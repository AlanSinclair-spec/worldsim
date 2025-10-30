/**
 * WorldSim Simulation Model
 *
 * Core calculation engine for energy demand, supply, and infrastructure stress modeling.
 * Uses deterministic formulas to project future scenarios based on user parameters.
 *
 * @module lib/model
 */

import { supabase } from '@/lib/supabase';
import type {
  SimulationScenario,
  SimulationResponse,
  SimulationResult,
  TopStressedRegion,
  WaterSimulationScenario,
  WaterSimulationResponse,
  WaterSimulationResult,
} from '@/lib/types';

/**
 * Calculate infrastructure stress level
 *
 * Stress represents the gap between demand and supply as a ratio.
 * - 0.0 = No stress (supply meets or exceeds demand)
 * - 0.5 = 50% shortage
 * - 1.0 = 100% shortage (no supply)
 *
 * @param demand - Energy demand in MWh
 * @param supply - Available energy supply in MWh
 * @returns Stress level from 0 to 1
 *
 * @example
 * calculateStress(100, 90) // Returns 0.1 (10% shortage)
 * calculateStress(100, 110) // Returns 0 (no shortage)
 * calculateStress(100, 50) // Returns 0.5 (50% shortage)
 */
export function calculateStress(demand: number, supply: number): number {
  // Handle edge cases
  if (demand <= 0) return 0;
  if (supply <= 0) return 1;

  // Calculate shortage as ratio of demand
  const shortage = Math.max(0, demand - supply);
  const stress = shortage / Math.max(demand, 1);

  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, stress));
}

/**
 * Calculate summary statistics from simulation results
 *
 * Aggregates daily results to provide:
 * - Average stress across all regions and dates
 * - Maximum stress encountered
 * - Top 5 most stressed regions
 *
 * @param results - Array of daily simulation results
 * @returns Summary statistics object
 *
 * @example
 * const summary = calculateSummary(dailyResults);
 * console.log(summary.avg_stress); // 0.75
 * console.log(summary.top_stressed_regions[0]); // { region_id: 'SS', region_name: 'San Salvador', avg_stress: 0.95 }
 */
export function calculateSummary(results: SimulationResult[]): {
  avg_stress: number;
  max_stress: number;
  top_stressed_regions: TopStressedRegion[];
} {
  // Handle empty results
  if (results.length === 0) {
    return {
      avg_stress: 0,
      max_stress: 0,
      top_stressed_regions: [],
    };
  }

  // Calculate average stress across all results
  const totalStress = results.reduce((sum, result) => sum + result.stress, 0);
  const avg_stress = totalStress / results.length;

  // Find maximum stress
  const max_stress = Math.max(...results.map(r => r.stress));

  // Group by region and calculate average stress per region
  const regionStress = new Map<string, { name: string; stresses: number[] }>();

  results.forEach(result => {
    const existing = regionStress.get(result.region_id);
    if (existing) {
      existing.stresses.push(result.stress);
    } else {
      regionStress.set(result.region_id, {
        name: result.region_name,
        stresses: [result.stress],
      });
    }
  });

  // Calculate average stress per region
  const regionAverages: TopStressedRegion[] = Array.from(regionStress.entries()).map(
    ([region_id, data]) => ({
      region_id,
      region_name: data.name,
      avg_stress: data.stresses.reduce((sum, s) => sum + s, 0) / data.stresses.length,
    })
  );

  // Sort by average stress (descending) and take top 5
  const top_stressed_regions = regionAverages
    .sort((a, b) => b.avg_stress - a.avg_stress)
    .slice(0, 5);

  return {
    avg_stress: Math.round(avg_stress * 1000) / 1000, // Round to 3 decimals
    max_stress: Math.round(max_stress * 1000) / 1000,
    top_stressed_regions: top_stressed_regions.map(r => ({
      ...r,
      avg_stress: Math.round(r.avg_stress * 1000) / 1000,
    })),
  };
}

/**
 * Run energy infrastructure simulation
 *
 * Models future energy demand and supply scenarios based on:
 * - Solar capacity growth
 * - Rainfall changes (affecting hydroelectric generation)
 * - Historical demand patterns
 *
 * The simulation uses simplified but realistic formulas:
 * 1. Baseline supply = 90% of demand (historical grid coverage)
 * 2. Renewable component = 30% of baseline (solar, wind)
 * 3. Hydro component = 20% of baseline (hydroelectric)
 * 4. Apply growth rates and rainfall impacts
 * 5. Calculate infrastructure stress
 *
 * @param params - Simulation scenario parameters
 * @returns Simulation results with daily data and summary statistics
 * @throws Error if database queries fail or data is missing
 *
 * @example
 * const results = await simulateScenario({
 *   solar_growth_pct: 10,      // 10% solar growth
 *   rainfall_change_pct: -15,  // 15% decrease in rainfall
 *   start_date: '2024-01-01',
 *   end_date: '2024-12-31'
 * });
 *
 * console.log(results.summary.avg_stress); // 0.15 (15% average shortage)
 * console.log(results.daily_results.length); // 5110 (14 regions × 365 days)
 */
export async function simulateScenario(
  params: SimulationScenario
): Promise<SimulationResponse> {
  const { solar_growth_pct, rainfall_change_pct, start_date, end_date } = params;

  console.log(`[${new Date().toISOString()}] [Model simulateScenario] ========== SIMULATION START ==========`);
  console.log(`[${new Date().toISOString()}] [Model simulateScenario] 🔬 Parameters:`, {
    solar_growth_pct,
    rainfall_change_pct,
    start_date,
    end_date,
  });

  // Step 1: Fetch all regions
  console.log(`[${new Date().toISOString()}] [Model simulateScenario] 📍 Step 1: Fetching regions from database...`);
  const { data: regions, error: regionsError } = await supabase
    .from('regions')
    .select('id, name');

  if (regionsError) {
    console.error(`[${new Date().toISOString()}] [Model simulateScenario] ❌ Failed to fetch regions:`, regionsError);
    throw new Error(`Failed to fetch regions: ${regionsError.message}`);
  }

  if (!regions || regions.length === 0) {
    console.error(`[${new Date().toISOString()}] [Model simulateScenario] ❌ No regions found in database`);
    throw new Error('No regions found in database');
  }

  console.log(`[${new Date().toISOString()}] [Model simulateScenario] ✅ Loaded ${regions.length} regions:`, regions.map(r => r.name).join(', '));

  // Create region lookup map
  const regionMap = new Map(regions.map(r => [r.id, r.name]));
  console.log(`[${new Date().toISOString()}] [Model simulateScenario] 🗺️ Created region lookup map with ${regionMap.size} entries`);

  // Step 2: Fetch energy demand data
  console.log(`[${new Date().toISOString()}] [Model simulateScenario] ⚡ Step 2: Fetching energy data from ${start_date} to ${end_date}...`);
  const { data: energyData, error: energyError } = await supabase
    .from('energy_daily')
    .select('region_id, date, demand_kwh')
    .gte('date', start_date)
    .lte('date', end_date)
    .order('date', { ascending: true });

  if (energyError) {
    console.error(`[${new Date().toISOString()}] [Model simulateScenario] ❌ Failed to fetch energy data:`, energyError);
    throw new Error(`Failed to fetch energy data: ${energyError.message}`);
  }

  console.log(`[${new Date().toISOString()}] [Model simulateScenario] ✅ Loaded ${energyData?.length || 0} energy records`);
  if (energyData && energyData.length > 0) {
    console.log(`[${new Date().toISOString()}] [Model simulateScenario] 📋 Sample energy data (first record):`, energyData[0]);
  } else {
    console.warn(`[${new Date().toISOString()}] [Model simulateScenario] ⚠️ No energy data found for date range`);
  }

  // Step 3: Fetch rainfall data
  console.log(`[${new Date().toISOString()}] [Model simulateScenario] 🌧️ Step 3: Fetching rainfall data from ${start_date} to ${end_date}...`);
  const { data: rainfallData, error: rainfallError } = await supabase
    .from('rain_daily')
    .select('region_id, date, rainfall_mm')
    .gte('date', start_date)
    .lte('date', end_date)
    .order('date', { ascending: true });

  if (rainfallError) {
    console.error(`[${new Date().toISOString()}] [Model simulateScenario] ❌ Failed to fetch rainfall data:`, rainfallError);
    throw new Error(`Failed to fetch rainfall data: ${rainfallError.message}`);
  }

  console.log(`[${new Date().toISOString()}] [Model simulateScenario] ✅ Loaded ${rainfallData?.length || 0} rainfall records`);
  if (rainfallData && rainfallData.length > 0) {
    console.log(`[${new Date().toISOString()}] [Model simulateScenario] 📋 Sample rainfall data (first record):`, rainfallData[0]);
  } else {
    console.warn(`[${new Date().toISOString()}] [Model simulateScenario] ⚠️ No rainfall data found for date range`);
  }

  // Step 4: Create rainfall lookup map (region_id + date -> rainfall)
  console.log(`[${new Date().toISOString()}] [Model simulateScenario] 🗂️ Step 4: Creating rainfall lookup map...`);
  const rainfallMap = new Map<string, number>();
  if (rainfallData) {
    rainfallData.forEach(record => {
      const key = `${record.region_id}:${record.date}`;
      rainfallMap.set(key, record.rainfall_mm);
    });
  }
  console.log(`[${new Date().toISOString()}] [Model simulateScenario] ✅ Rainfall map created with ${rainfallMap.size} entries`);

  // Step 5: Calculate daily results
  console.log(`[${new Date().toISOString()}] [Model simulateScenario] 🧮 Step 5: Calculating daily simulation results...`);
  const daily_results: SimulationResult[] = [];

  if (energyData) {
    console.log(`[${new Date().toISOString()}] [Model simulateScenario] 🔄 Processing ${energyData.length} energy records...`);
    let processedCount = 0;

    for (const energyRecord of energyData) {
      processedCount++;

      // Log progress every 100 records
      if (processedCount % 100 === 0) {
        console.log(`[${new Date().toISOString()}] [Model simulateScenario] 📊 Progress: ${processedCount}/${energyData.length} records processed`);
      }
      const region_id = energyRecord.region_id;
      const region_name = regionMap.get(region_id) || 'Unknown';
      const date = energyRecord.date;
      const demand = energyRecord.demand_kwh;

      // Get rainfall for this region and date (if available)
      const rainfallKey = `${region_id}:${date}`;
      const rainfall = rainfallMap.get(rainfallKey);

      // --- SIMULATION CALCULATIONS ---

      // 1. Baseline supply (90% of demand - historical grid coverage)
      const baselineSupply = demand * 0.9;

      // 2. Renewable component (30% of baseline - solar, wind)
      const renewableComponent = baselineSupply * 0.3;

      // 3. Hydro component (20% of baseline - hydroelectric)
      const hydroComponent = baselineSupply * 0.2;

      // 4. Apply solar growth rate to renewables
      const solarGrowthFactor = 1 + solar_growth_pct / 100;
      const adjustedRenewables = renewableComponent * solarGrowthFactor;

      // 5. Apply rainfall changes to hydro
      // Rainfall impact is 66% correlated with hydro output
      let hydroFactor = 1.0;
      if (rainfall !== undefined) {
        // If we have rainfall data, use rainfall change parameter
        hydroFactor = 1 + (rainfall_change_pct / 100) * 0.66;
      }
      const adjustedHydro = hydroComponent * hydroFactor;

      // 6. Calculate total supply
      // 50% from baseline (grid) + adjusted renewables + adjusted hydro
      const gridComponent = baselineSupply * 0.5;
      const totalSupply = gridComponent + adjustedRenewables + adjustedHydro;

      // 7. Calculate infrastructure stress
      const stress = calculateStress(demand, totalSupply);

      // Add to results
      daily_results.push({
        date,
        region_id,
        region_name,
        demand,
        supply: Math.round(totalSupply),
        stress,
      });
    }

    console.log(`[${new Date().toISOString()}] [Model simulateScenario] ✅ Finished processing all ${processedCount} energy records`);
  } else {
    console.warn(`[${new Date().toISOString()}] [Model simulateScenario] ⚠️ No energy data to process`);
  }

  console.log(`[${new Date().toISOString()}] [Model simulateScenario] 📊 Calculated ${daily_results.length} daily results`);

  // Handle case where no data was found
  if (daily_results.length === 0) {
    console.warn(`[${new Date().toISOString()}] [Model simulateScenario] ⚠️ No simulation results generated - no energy data in date range`);
    return {
      daily_results: [],
      summary: {
        avg_stress: 0,
        max_stress: 0,
        top_stressed_regions: [],
      },
    };
  }

  // Log sample results
  if (daily_results.length > 0) {
    console.log(`[${new Date().toISOString()}] [Model simulateScenario] 📋 Sample result (first entry):`, {
      date: daily_results[0].date,
      region: daily_results[0].region_name,
      demand: daily_results[0].demand,
      supply: daily_results[0].supply,
      stress: daily_results[0].stress,
    });
  }

  // Step 6: Calculate summary statistics
  console.log(`[${new Date().toISOString()}] [Model simulateScenario] 📈 Step 6: Calculating summary statistics...`);
  const summary = calculateSummary(daily_results);

  console.log(`[${new Date().toISOString()}] [Model simulateScenario] ✅ Summary calculated:`, {
    total_results: daily_results.length,
    avg_stress: summary.avg_stress,
    max_stress: summary.max_stress,
    top_stressed_regions_count: summary.top_stressed_regions.length,
    top_region: summary.top_stressed_regions[0]?.region_name,
    top_region_stress: summary.top_stressed_regions[0]?.avg_stress,
  });

  console.log(`[${new Date().toISOString()}] [Model simulateScenario] ========== SIMULATION COMPLETE ==========`);

  return {
    daily_results,
    summary,
  };
}

/**
 * Validate simulation parameters
 *
 * Checks that scenario parameters are within reasonable bounds.
 *
 * @param params - Simulation parameters to validate
 * @returns Object with isValid flag and error message if invalid
 *
 * @example
 * const validation = validateScenarioParams({
 *   solar_growth_pct: 150, // Too high
 *   rainfall_change_pct: -50,
 *   start_date: '2024-01-01',
 *   end_date: '2023-12-31' // Before start date
 * });
 * console.log(validation.isValid); // false
 * console.log(validation.error); // "End date must be after start date"
 */
export function validateScenarioParams(params: SimulationScenario): {
  isValid: boolean;
  error?: string;
} {
  // Check solar growth is reasonable (-100% to +200%)
  if (params.solar_growth_pct < -100 || params.solar_growth_pct > 200) {
    return {
      isValid: false,
      error: 'Solar growth must be between -100% and +200%',
    };
  }

  // Check rainfall change is reasonable (-100% to +200%)
  if (params.rainfall_change_pct < -100 || params.rainfall_change_pct > 200) {
    return {
      isValid: false,
      error: 'Rainfall change must be between -100% and +200%',
    };
  }

  // Check date formats
  const startDate = new Date(params.start_date);
  const endDate = new Date(params.end_date);

  if (isNaN(startDate.getTime())) {
    return {
      isValid: false,
      error: 'Invalid start date format (expected YYYY-MM-DD)',
    };
  }

  if (isNaN(endDate.getTime())) {
    return {
      isValid: false,
      error: 'Invalid end date format (expected YYYY-MM-DD)',
    };
  }

  // Check end date is after start date
  if (endDate <= startDate) {
    return {
      isValid: false,
      error: 'End date must be after start date',
    };
  }

  // Check date range is not too large (max 5 years)
  const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff > 365 * 5) {
    return {
      isValid: false,
      error: 'Date range cannot exceed 5 years',
    };
  }

  return { isValid: true };
}

// ============================================
// WATER STRESS SIMULATION FUNCTIONS
// ============================================

/**
 * Calculate water stress level
 *
 * Water stress represents the gap between water demand and available supply.
 * Factors in reservoir levels as a buffer against shortages.
 *
 * Formula:
 * - Stress = (demand - supply) / demand
 * - Reservoir buffer: Reduces effective stress when levels are high
 * - 0.0 = No stress (supply meets or exceeds demand)
 * - 0.5 = 50% shortage (moderate water stress)
 * - 1.0 = 100% shortage (critical water crisis)
 *
 * @param demand_m3 - Water demand in cubic meters
 * @param supply_m3 - Available water supply in cubic meters
 * @param reservoir_level_pct - Optional reservoir level percentage (0-100)
 * @returns Water stress level from 0 to 1
 *
 * @example
 * calculateWaterStress(10000, 8000, 70) // Returns ~0.14 (14% shortage with reservoir buffer)
 * calculateWaterStress(10000, 5000) // Returns 0.5 (50% shortage, no reservoir)
 * calculateWaterStress(10000, 12000) // Returns 0 (no shortage)
 */
export function calculateWaterStress(
  demand_m3: number,
  supply_m3: number,
  reservoir_level_pct?: number
): number {
  // Handle edge cases
  if (demand_m3 <= 0) return 0;
  if (supply_m3 <= 0) return 1;

  // Calculate base shortage
  const shortage = Math.max(0, demand_m3 - supply_m3);
  let stress = shortage / Math.max(demand_m3, 1);

  // Apply reservoir buffer if available
  // High reservoir levels (>50%) reduce stress by up to 30%
  if (reservoir_level_pct !== undefined && reservoir_level_pct > 0) {
    const reservoirFactor = Math.min(reservoir_level_pct / 100, 1.0);
    const stressReduction = reservoirFactor * 0.3; // Max 30% stress reduction
    stress = stress * (1 - stressReduction);
  }

  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, stress));
}

/**
 * Calculate summary statistics from water simulation results
 *
 * Aggregates daily water results to provide:
 * - Average stress across all regions and dates
 * - Maximum stress encountered
 * - Total unmet water demand
 * - Critical shortage days (stress > 0.7)
 * - Top 5 most stressed regions
 *
 * @param results - Array of daily water simulation results
 * @returns Summary statistics object
 *
 * @example
 * const summary = calculateWaterSummary(dailyResults);
 * console.log(summary.avg_stress); // 0.45
 * console.log(summary.critical_shortage_days); // 23
 * console.log(summary.total_unmet_demand_m3); // 150000
 */
export function calculateWaterSummary(results: WaterSimulationResult[]): {
  avg_stress: number;
  max_stress: number;
  total_unmet_demand_m3: number;
  critical_shortage_days: number;
  top_stressed_regions: Array<{
    region_id: string;
    region_name: string;
    avg_stress: number;
  }>;
} {
  // Handle empty results
  if (results.length === 0) {
    return {
      avg_stress: 0,
      max_stress: 0,
      total_unmet_demand_m3: 0,
      critical_shortage_days: 0,
      top_stressed_regions: [],
    };
  }

  // Calculate average stress
  const totalStress = results.reduce((sum, result) => sum + result.stress, 0);
  const avg_stress = totalStress / results.length;

  // Find maximum stress
  const max_stress = Math.max(...results.map(r => r.stress));

  // Calculate total unmet demand
  const total_unmet_demand_m3 = results.reduce(
    (sum, result) => sum + result.unmet_demand,
    0
  );

  // Count critical shortage days (stress > 0.7)
  const critical_shortage_days = results.filter(r => r.stress > 0.7).length;

  // Group by region and calculate average stress per region
  const regionStress = new Map<string, { name: string; stresses: number[] }>();

  results.forEach(result => {
    const existing = regionStress.get(result.region_id);
    if (existing) {
      existing.stresses.push(result.stress);
    } else {
      regionStress.set(result.region_id, {
        name: result.region_name,
        stresses: [result.stress],
      });
    }
  });

  // Calculate average stress per region
  const regionAverages = Array.from(regionStress.entries()).map(
    ([region_id, data]) => ({
      region_id,
      region_name: data.name,
      avg_stress: data.stresses.reduce((sum, s) => sum + s, 0) / data.stresses.length,
    })
  );

  // Sort by average stress (descending) and take top 5
  const top_stressed_regions = regionAverages
    .sort((a, b) => b.avg_stress - a.avg_stress)
    .slice(0, 5);

  return {
    avg_stress: Math.round(avg_stress * 1000) / 1000,
    max_stress: Math.round(max_stress * 1000) / 1000,
    total_unmet_demand_m3: Math.round(total_unmet_demand_m3),
    critical_shortage_days,
    top_stressed_regions: top_stressed_regions.map(r => ({
      ...r,
      avg_stress: Math.round(r.avg_stress * 1000) / 1000,
    })),
  };
}

/**
 * Run water stress simulation
 *
 * Models future water demand and supply scenarios based on:
 * - Water demand growth (population, urbanization, agriculture)
 * - Rainfall changes (affecting water availability)
 * - Conservation measures (reducing effective demand)
 * - Reservoir levels (providing buffer capacity)
 *
 * The simulation formula:
 * 1. Apply demand growth rate to baseline demand
 * 2. Apply conservation rate to reduce effective demand
 * 3. Apply rainfall changes to water supply
 * 4. Factor in reservoir levels as buffer
 * 5. Calculate water stress level
 *
 * @param params - Water simulation scenario parameters
 * @returns Water simulation results with daily data and summary statistics
 * @throws Error if database queries fail or data is missing
 *
 * @example
 * const results = await simulateWaterScenario({
 *   water_demand_growth_pct: 5,    // 5% demand increase
 *   rainfall_change_pct: -10,      // 10% decrease in rainfall
 *   conservation_rate_pct: 15,     // 15% conservation measures
 *   start_date: '2024-01-01',
 *   end_date: '2024-12-31'
 * });
 *
 * console.log(results.summary.avg_stress); // 0.35 (35% average shortage)
 * console.log(results.daily_results.length); // 5110 (14 regions × 365 days)
 */
export async function simulateWaterScenario(
  params: WaterSimulationScenario
): Promise<WaterSimulationResponse> {
  const {
    water_demand_growth_pct,
    rainfall_change_pct,
    conservation_rate_pct,
    start_date,
    end_date,
  } = params;

  console.log(`[${new Date().toISOString()}] [Model simulateWaterScenario] ========== WATER SIMULATION START ==========`);
  console.log(`[${new Date().toISOString()}] [Model simulateWaterScenario] 💧 Parameters:`, {
    water_demand_growth_pct,
    rainfall_change_pct,
    conservation_rate_pct,
    start_date,
    end_date,
  });

  // Step 1: Fetch all regions
  console.log(`[${new Date().toISOString()}] [Model simulateWaterScenario] 📍 Step 1: Fetching regions from database...`);
  const { data: regions, error: regionsError } = await supabase
    .from('regions')
    .select('id, name');

  if (regionsError) {
    console.error(`[${new Date().toISOString()}] [Model simulateWaterScenario] ❌ Failed to fetch regions:`, regionsError);
    throw new Error(`Failed to fetch regions: ${regionsError.message}`);
  }

  if (!regions || regions.length === 0) {
    console.error(`[${new Date().toISOString()}] [Model simulateWaterScenario] ❌ No regions found in database`);
    throw new Error('No regions found in database');
  }

  console.log(`[${new Date().toISOString()}] [Model simulateWaterScenario] ✅ Loaded ${regions.length} regions:`, regions.map(r => r.name).join(', '));

  // Create region lookup map
  const regionMap = new Map(regions.map(r => [r.id, r.name]));
  console.log(`[${new Date().toISOString()}] [Model simulateWaterScenario] 🗺️ Created region lookup map with ${regionMap.size} entries`);

  // Step 2: Fetch water data
  console.log(`[${new Date().toISOString()}] [Model simulateWaterScenario] 💧 Step 2: Fetching water data from ${start_date} to ${end_date}...`);
  const { data: waterData, error: waterError } = await supabase
    .from('water_daily')
    .select('region_id, date, water_demand_m3, water_supply_m3, reservoir_level_pct')
    .gte('date', start_date)
    .lte('date', end_date)
    .order('date', { ascending: true });

  if (waterError) {
    console.error(`[${new Date().toISOString()}] [Model simulateWaterScenario] ❌ Failed to fetch water data:`, waterError);
    throw new Error(`Failed to fetch water data: ${waterError.message}`);
  }

  console.log(`[${new Date().toISOString()}] [Model simulateWaterScenario] ✅ Loaded ${waterData?.length || 0} water records`);
  if (waterData && waterData.length > 0) {
    console.log(`[${new Date().toISOString()}] [Model simulateWaterScenario] 📋 Sample water data (first record):`, waterData[0]);
  } else {
    console.warn(`[${new Date().toISOString()}] [Model simulateWaterScenario] ⚠️ No water data found for date range`);
  }

  // Step 3: Calculate daily results
  console.log(`[${new Date().toISOString()}] [Model simulateWaterScenario] 🧮 Step 3: Calculating daily simulation results...`);
  const daily_results: WaterSimulationResult[] = [];

  if (waterData) {
    console.log(`[${new Date().toISOString()}] [Model simulateWaterScenario] 🔄 Processing ${waterData.length} water records...`);
    let processedCount = 0;

    for (const waterRecord of waterData) {
      processedCount++;

      // Log progress every 100 records
      if (processedCount % 100 === 0) {
        console.log(`[${new Date().toISOString()}] [Model simulateWaterScenario] 📊 Progress: ${processedCount}/${waterData.length} records processed`);
      }

      const region_id = waterRecord.region_id;
      const region_name = regionMap.get(region_id) || 'Unknown';
      const date = waterRecord.date;
      const baseDemand = waterRecord.water_demand_m3;
      const baseSupply = waterRecord.water_supply_m3;
      const reservoirLevel = waterRecord.reservoir_level_pct;

      // --- SIMULATION CALCULATIONS ---

      // 1. Apply demand growth rate
      const demandGrowthFactor = 1 + water_demand_growth_pct / 100;
      let adjustedDemand = baseDemand * demandGrowthFactor;

      // 2. Apply conservation measures (reduces effective demand)
      const conservationFactor = 1 - conservation_rate_pct / 100;
      adjustedDemand = adjustedDemand * conservationFactor;

      // 3. Apply rainfall changes to supply
      // Rainfall directly affects water availability (aquifers, surface water)
      const rainfallFactor = 1 + rainfall_change_pct / 100;
      const adjustedSupply = baseSupply * rainfallFactor;

      // 4. Calculate water stress (factors in reservoir level if available)
      const stress = calculateWaterStress(
        adjustedDemand,
        adjustedSupply,
        reservoirLevel
      );

      // 5. Calculate unmet demand
      const unmet_demand = Math.max(0, adjustedDemand - adjustedSupply);

      // Add to results
      daily_results.push({
        date,
        region_id,
        region_name,
        demand: Math.round(adjustedDemand),
        supply: Math.round(adjustedSupply),
        stress,
        unmet_demand: Math.round(unmet_demand),
      });
    }

    console.log(`[${new Date().toISOString()}] [Model simulateWaterScenario] ✅ Finished processing all ${processedCount} water records`);
  } else {
    console.warn(`[${new Date().toISOString()}] [Model simulateWaterScenario] ⚠️ No water data to process`);
  }

  console.log(`[${new Date().toISOString()}] [Model simulateWaterScenario] 📊 Calculated ${daily_results.length} daily results`);

  // Handle case where no data was found
  if (daily_results.length === 0) {
    console.warn(`[${new Date().toISOString()}] [Model simulateWaterScenario] ⚠️ No simulation results generated - no water data in date range`);
    return {
      daily_results: [],
      summary: {
        avg_stress: 0,
        max_stress: 0,
        total_unmet_demand_m3: 0,
        critical_shortage_days: 0,
        top_stressed_regions: [],
      },
    };
  }

  // Log sample results
  if (daily_results.length > 0) {
    console.log(`[${new Date().toISOString()}] [Model simulateWaterScenario] 📋 Sample result (first entry):`, {
      date: daily_results[0].date,
      region: daily_results[0].region_name,
      demand: daily_results[0].demand,
      supply: daily_results[0].supply,
      stress: daily_results[0].stress,
      unmet_demand: daily_results[0].unmet_demand,
    });
  }

  // Step 4: Calculate summary statistics
  console.log(`[${new Date().toISOString()}] [Model simulateWaterScenario] 📈 Step 4: Calculating summary statistics...`);
  const summary = calculateWaterSummary(daily_results);

  console.log(`[${new Date().toISOString()}] [Model simulateWaterScenario] ✅ Summary calculated:`, {
    total_results: daily_results.length,
    avg_stress: summary.avg_stress,
    max_stress: summary.max_stress,
    total_unmet_demand_m3: summary.total_unmet_demand_m3,
    critical_shortage_days: summary.critical_shortage_days,
    top_stressed_regions_count: summary.top_stressed_regions.length,
    top_region: summary.top_stressed_regions[0]?.region_name,
    top_region_stress: summary.top_stressed_regions[0]?.avg_stress,
  });

  console.log(`[${new Date().toISOString()}] [Model simulateWaterScenario] ========== WATER SIMULATION COMPLETE ==========`);

  return {
    daily_results,
    summary,
  };
}

/**
 * Validate water simulation parameters
 *
 * Checks that water scenario parameters are within reasonable bounds.
 *
 * @param params - Water simulation parameters to validate
 * @returns Object with isValid flag and error message if invalid
 *
 * @example
 * const validation = validateWaterScenarioParams({
 *   water_demand_growth_pct: 250, // Too high
 *   rainfall_change_pct: -50,
 *   conservation_rate_pct: 25,
 *   start_date: '2024-01-01',
 *   end_date: '2023-12-31' // Before start date
 * });
 * console.log(validation.isValid); // false
 * console.log(validation.error); // "End date must be after start date"
 */
export function validateWaterScenarioParams(params: WaterSimulationScenario): {
  isValid: boolean;
  error?: string;
} {
  // Check water demand growth is reasonable (-50% to +200%)
  if (params.water_demand_growth_pct < -50 || params.water_demand_growth_pct > 200) {
    return {
      isValid: false,
      error: 'Water demand growth must be between -50% and +200%',
    };
  }

  // Check rainfall change is reasonable (-100% to +200%)
  if (params.rainfall_change_pct < -100 || params.rainfall_change_pct > 200) {
    return {
      isValid: false,
      error: 'Rainfall change must be between -100% and +200%',
    };
  }

  // Check conservation rate is reasonable (0% to 100%)
  if (params.conservation_rate_pct < 0 || params.conservation_rate_pct > 100) {
    return {
      isValid: false,
      error: 'Conservation rate must be between 0% and 100%',
    };
  }

  // Check date formats
  const startDate = new Date(params.start_date);
  const endDate = new Date(params.end_date);

  if (isNaN(startDate.getTime())) {
    return {
      isValid: false,
      error: 'Invalid start date format (expected YYYY-MM-DD)',
    };
  }

  if (isNaN(endDate.getTime())) {
    return {
      isValid: false,
      error: 'Invalid end date format (expected YYYY-MM-DD)',
    };
  }

  // Check end date is after start date
  if (endDate <= startDate) {
    return {
      isValid: false,
      error: 'End date must be after start date',
    };
  }

  // Check date range is not too large (max 5 years)
  const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff > 365 * 5) {
    return {
      isValid: false,
      error: 'Date range cannot exceed 5 years',
    };
  }

  return { isValid: true };
}
