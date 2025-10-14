/**
 * WorldSim Deterministic Simulation Models
 *
 * This module contains the core simulation logic for:
 * - Energy demand and supply modeling
 * - Climate impact analysis
 * - Infrastructure capacity planning
 *
 * All models are deterministic (no randomness) for reproducibility
 */

export interface SimulationParameters {
  regionId: string;
  startDate: string;
  endDate: string;
  solarGrowthRate: number; // Annual percentage growth
  demandGrowthRate: number; // Annual percentage growth
  rainfallChange: number; // Percentage change from baseline
  infrastructureCapacity: number; // MW
}

export interface SimulationResult {
  date: string;
  demandKwh: number;
  solarGenerationKwh: number;
  gridGenerationKwh: number;
  deficit: number;
  rainfallMm: number;
  temperatureC: number;
}

export interface SimulationOutput {
  parameters: SimulationParameters;
  results: SimulationResult[];
  summary: {
    totalDemandKwh: number;
    totalSolarKwh: number;
    totalGridKwh: number;
    averageDeficit: number;
    peakDeficit: number;
    solarPercentage: number;
  };
}

/**
 * Run a full simulation based on parameters
 *
 * @param params - Simulation configuration parameters
 * @param baselineData - Historical data for the region (optional)
 * @returns Simulation results with daily projections
 */
export function runSimulation(
  params: SimulationParameters,
  baselineData?: {
    avgDailyDemandKwh: number;
    avgDailySolarKwh: number;
    avgRainfallMm: number;
    avgTemperatureC: number;
  }
): SimulationOutput {
  const startDate = new Date(params.startDate);
  const endDate = new Date(params.endDate);

  // Use provided baseline or defaults for El Salvador
  const baseline = baselineData || {
    avgDailyDemandKwh: 50000, // ~50 MWh per day for a municipality
    avgDailySolarKwh: 15000, // ~30% solar capacity
    avgRainfallMm: 5.5, // ~2000mm annual / 365 days
    avgTemperatureC: 25, // Average tropical temperature
  };

  const results: SimulationResult[] = [];
  const daysToSimulate = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  for (let day = 0; day < daysToSimulate; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);

    // Calculate growth factors (compound growth over years)
    const yearsElapsed = day / 365;
    const demandMultiplier = Math.pow(1 + params.demandGrowthRate / 100, yearsElapsed);
    const solarMultiplier = Math.pow(1 + params.solarGrowthRate / 100, yearsElapsed);

    // Apply seasonal variations (simple sinusoidal model)
    const dayOfYear = getDayOfYear(currentDate);
    const seasonalFactor = 1 + 0.15 * Math.sin((dayOfYear / 365) * 2 * Math.PI);

    // Calculate energy metrics
    const demandKwh = baseline.avgDailyDemandKwh * demandMultiplier * seasonalFactor;
    const solarGenerationKwh = Math.min(
      baseline.avgDailySolarKwh * solarMultiplier * seasonalFactor,
      params.infrastructureCapacity * 24 * 0.25 // 25% capacity factor for solar
    );
    const gridGenerationKwh = Math.max(0, demandKwh - solarGenerationKwh);
    const deficit = Math.max(0, demandKwh - solarGenerationKwh - gridGenerationKwh);

    // Calculate climate metrics
    const rainfallMm = baseline.avgRainfallMm * (1 + params.rainfallChange / 100) * seasonalFactor;
    const temperatureC = baseline.avgTemperatureC + (dayOfYear > 180 ? 2 : -2); // Simple seasonal temp variation

    results.push({
      date: currentDate.toISOString().split('T')[0],
      demandKwh: Math.round(demandKwh),
      solarGenerationKwh: Math.round(solarGenerationKwh),
      gridGenerationKwh: Math.round(gridGenerationKwh),
      deficit: Math.round(deficit),
      rainfallMm: Math.round(rainfallMm * 10) / 10,
      temperatureC: Math.round(temperatureC * 10) / 10,
    });
  }

  // Calculate summary statistics
  const summary = {
    totalDemandKwh: results.reduce((sum, r) => sum + r.demandKwh, 0),
    totalSolarKwh: results.reduce((sum, r) => sum + r.solarGenerationKwh, 0),
    totalGridKwh: results.reduce((sum, r) => sum + r.gridGenerationKwh, 0),
    averageDeficit: results.reduce((sum, r) => sum + r.deficit, 0) / results.length,
    peakDeficit: Math.max(...results.map(r => r.deficit)),
    solarPercentage: 0,
  };

  summary.solarPercentage = (summary.totalSolarKwh / summary.totalDemandKwh) * 100;

  return {
    parameters: params,
    results,
    summary,
  };
}

/**
 * Helper function to get day of year (1-365)
 */
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Validate simulation parameters
 *
 * @param params - Parameters to validate
 * @returns Validation result with error messages if invalid
 */
export function validateSimulationParameters(params: SimulationParameters): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!params.regionId) {
    errors.push('Region ID is required');
  }

  const startDate = new Date(params.startDate);
  const endDate = new Date(params.endDate);

  if (isNaN(startDate.getTime())) {
    errors.push('Invalid start date');
  }

  if (isNaN(endDate.getTime())) {
    errors.push('Invalid end date');
  }

  if (startDate >= endDate) {
    errors.push('End date must be after start date');
  }

  const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff > 365 * 10) {
    errors.push('Simulation period cannot exceed 10 years');
  }

  if (params.solarGrowthRate < -100 || params.solarGrowthRate > 1000) {
    errors.push('Solar growth rate must be between -100% and 1000%');
  }

  if (params.demandGrowthRate < -100 || params.demandGrowthRate > 1000) {
    errors.push('Demand growth rate must be between -100% and 1000%');
  }

  if (params.rainfallChange < -100 || params.rainfallChange > 1000) {
    errors.push('Rainfall change must be between -100% and 1000%');
  }

  if (params.infrastructureCapacity < 0) {
    errors.push('Infrastructure capacity must be positive');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
