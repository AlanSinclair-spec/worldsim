/**
 * TypeScript type definitions for WorldSim application
 *
 * This file contains all core interfaces used throughout the application
 * for data modeling, API responses, and simulation parameters.
 */

/**
 * Region represents an El Salvador geographic region (department or municipality)
 *
 * @example
 * const region: Region = {
 *   id: 'SS',
 *   name: 'San Salvador',
 *   geojson: { type: 'Polygon', coordinates: [...] },
 *   population: 1740336
 * };
 */
export interface Region {
  /** Unique identifier for the region (e.g., 'SS' for San Salvador) */
  id: string;
  /** Display name of the region */
  name: string;
  /** GeoJSON geometry data for map visualization */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geojson: any;
  /** Population count for the region */
  population: number;
}

/**
 * EnergyData represents daily energy demand for a specific region
 *
 * Used for historical data and simulation results.
 *
 * @example
 * const energyData: EnergyData = {
 *   id: 'uuid-123',
 *   date: '2024-01-15',
 *   region_id: 'SS',
 *   demand_mwh: 1250.5
 * };
 */
export interface EnergyData {
  /** Unique identifier for this energy data record */
  id: string;
  /** Date in ISO format (YYYY-MM-DD) */
  date: string;
  /** Foreign key reference to regions table */
  region_id: string;
  /** Energy demand in megawatt-hours (MWh) */
  demand_mwh: number;
}

/**
 * RainfallData represents daily rainfall measurement for a specific region
 *
 * Used for climate analysis and scenario modeling.
 *
 * @example
 * const rainfallData: RainfallData = {
 *   id: 'uuid-456',
 *   date: '2024-01-15',
 *   region_id: 'SS',
 *   rainfall_mm: 12.5
 * };
 */
export interface RainfallData {
  /** Unique identifier for this rainfall data record */
  id: string;
  /** Date in ISO format (YYYY-MM-DD) */
  date: string;
  /** Foreign key reference to regions table */
  region_id: string;
  /** Rainfall measurement in millimeters (mm) */
  rainfall_mm: number;
}

/**
 * SimulationScenario defines input parameters for running a simulation
 *
 * Controls how the simulation models future energy demand and climate conditions.
 *
 * @example
 * const scenario: SimulationScenario = {
 *   solar_growth_pct: 10,
 *   rainfall_change_pct: -15,
 *   start_date: '2024-01-01',
 *   end_date: '2024-12-31'
 * };
 */
export interface SimulationScenario {
  /** Annual solar capacity growth rate as percentage (e.g., 10 = 10% per year) */
  solar_growth_pct: number;
  /** Rainfall change from baseline as percentage (e.g., -15 = 15% decrease) */
  rainfall_change_pct: number;
  /** Simulation start date in ISO format (YYYY-MM-DD) */
  start_date: string;
  /** Simulation end date in ISO format (YYYY-MM-DD) */
  end_date: string;
}

/**
 * SimulationResult represents a single day's simulation output for a region
 *
 * Contains projected energy demand, supply, and infrastructure stress metrics.
 *
 * @example
 * const result: SimulationResult = {
 *   date: '2024-06-15',
 *   region_id: 'SS',
 *   region_name: 'San Salvador',
 *   demand: 1350.2,
 *   supply: 1200.8,
 *   stress: 0.89
 * };
 */
export interface SimulationResult {
  /** Date of this simulation result in ISO format (YYYY-MM-DD) */
  date: string;
  /** Region identifier this result applies to */
  region_id: string;
  /** Display name of the region */
  region_name: string;
  /** Projected energy demand in MWh */
  demand: number;
  /** Available energy supply in MWh */
  supply: number;
  /** Infrastructure stress ratio (demand/supply). Values > 1.0 indicate deficit */
  stress: number;
}

/**
 * TopStressedRegion represents a region with high infrastructure stress
 *
 * Used in simulation summary to highlight areas of concern.
 */
export interface TopStressedRegion {
  /** Region identifier */
  region_id: string;
  /** Display name of the region */
  region_name: string;
  /** Average stress ratio for this region across simulation period */
  avg_stress: number;
}

/**
 * SimulationResponse is the complete output from running a simulation
 *
 * Contains daily results for all regions plus aggregate summary statistics.
 *
 * @example
 * const response: SimulationResponse = {
 *   daily_results: [
 *     { date: '2024-01-01', region_id: 'SS', region_name: 'San Salvador', demand: 1200, supply: 1100, stress: 1.09 },
 *     // ... more results
 *   ],
 *   summary: {
 *     avg_stress: 0.95,
 *     max_stress: 1.25,
 *     top_stressed_regions: [
 *       { region_id: 'SS', region_name: 'San Salvador', avg_stress: 1.15 },
 *       { region_id: 'SM', region_name: 'San Miguel', avg_stress: 1.08 }
 *     ]
 *   }
 * };
 */
export interface SimulationResponse {
  /** Array of daily simulation results across all regions */
  daily_results: SimulationResult[];
  /** Aggregate summary statistics for the entire simulation */
  summary: {
    /** Average infrastructure stress across all regions and dates */
    avg_stress: number;
    /** Maximum stress value encountered in the simulation */
    max_stress: number;
    /** List of regions with highest average stress (sorted descending) */
    top_stressed_regions: TopStressedRegion[];
  };
}
