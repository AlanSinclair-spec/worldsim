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

  console.log('🔬 Starting simulation:', {
    solar_growth_pct,
    rainfall_change_pct,
    start_date,
    end_date,
  });

  // Step 1: Fetch all regions
  const { data: regions, error: regionsError } = await supabase
    .from('regions')
    .select('id, name');

  if (regionsError) {
    throw new Error(`Failed to fetch regions: ${regionsError.message}`);
  }

  if (!regions || regions.length === 0) {
    throw new Error('No regions found in database');
  }

  console.log(`✓ Loaded ${regions.length} regions`);

  // Create region lookup map
  const regionMap = new Map(regions.map(r => [r.id, r.name]));

  // Step 2: Fetch energy demand data
  const { data: energyData, error: energyError } = await supabase
    .from('energy_daily')
    .select('region_id, date, demand_kwh')
    .gte('date', start_date)
    .lte('date', end_date)
    .order('date', { ascending: true });

  if (energyError) {
    throw new Error(`Failed to fetch energy data: ${energyError.message}`);
  }

  console.log(`✓ Loaded ${energyData?.length || 0} energy records`);

  // Step 3: Fetch rainfall data
  const { data: rainfallData, error: rainfallError } = await supabase
    .from('rain_daily')
    .select('region_id, date, rainfall_mm')
    .gte('date', start_date)
    .lte('date', end_date)
    .order('date', { ascending: true });

  if (rainfallError) {
    throw new Error(`Failed to fetch rainfall data: ${rainfallError.message}`);
  }

  console.log(`✓ Loaded ${rainfallData?.length || 0} rainfall records`);

  // Step 4: Create rainfall lookup map (region_id + date -> rainfall)
  const rainfallMap = new Map<string, number>();
  if (rainfallData) {
    rainfallData.forEach(record => {
      const key = `${record.region_id}:${record.date}`;
      rainfallMap.set(key, record.rainfall_mm);
    });
  }

  // Step 5: Calculate daily results
  const daily_results: SimulationResult[] = [];

  if (energyData) {
    for (const energyRecord of energyData) {
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
  }

  console.log(`✓ Calculated ${daily_results.length} daily results`);

  // Handle case where no data was found
  if (daily_results.length === 0) {
    console.warn('⚠️ No simulation results generated - no energy data in date range');
    return {
      daily_results: [],
      summary: {
        avg_stress: 0,
        max_stress: 0,
        top_stressed_regions: [],
      },
    };
  }

  // Step 6: Calculate summary statistics
  const summary = calculateSummary(daily_results);

  console.log('✓ Simulation complete:', {
    total_results: daily_results.length,
    avg_stress: summary.avg_stress,
    max_stress: summary.max_stress,
    top_region: summary.top_stressed_regions[0]?.region_name,
  });

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
