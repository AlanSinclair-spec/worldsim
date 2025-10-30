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
  geojson: Record<string, unknown>;
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
  /** Optional economic analysis (added in v2.0+) */
  economic_analysis?: EconomicAnalysis;
  /** Optional AI-generated explanation and insights (added in v3.0+) */
  ai_explanation?: AIExplanation;
}

/**
 * IngestStats contains statistics about a successful CSV data ingestion
 *
 * Returned by the /api/ingest endpoint after successful upload.
 *
 * @example
 * const stats: IngestStats = {
 *   rows_inserted: 365,
 *   date_range: {
 *     min: '2024-01-01',
 *     max: '2024-12-31'
 *   },
 *   regions_affected: ['San Salvador', 'Santa Ana', 'San Miguel'],
 *   errors: []
 * };
 */
export interface IngestStats {
  /** Number of rows successfully inserted into the database */
  rows_inserted: number;
  /** Date range of the uploaded data */
  date_range: {
    /** Earliest date in the dataset (YYYY-MM-DD) */
    min: string;
    /** Latest date in the dataset (YYYY-MM-DD) */
    max: string;
  };
  /** List of region names that were affected by this upload */
  regions_affected: string[];
  /** Any validation errors encountered (partial uploads may have errors) */
  errors: string[];
}

/**
 * IngestRequest is the request body for the /api/ingest endpoint
 *
 * @example
 * const request: IngestRequest = {
 *   csv_text: 'date,region_name,value\n2024-01-01,San Salvador,1250.5\n...',
 *   data_type: 'energy'
 * };
 */
export interface IngestRequest {
  /** Raw CSV text content */
  csv_text: string;
  /** Type of data being uploaded */
  data_type: 'energy' | 'rainfall';
}

/**
 * IngestResponse is the response from the /api/ingest endpoint
 *
 * @example
 * // Success response:
 * const successResponse: IngestResponse = {
 *   success: true,
 *   data: {
 *     rows_inserted: 365,
 *     date_range: { min: '2024-01-01', max: '2024-12-31' },
 *     regions_affected: ['San Salvador'],
 *     errors: []
 *   }
 * };
 *
 * // Error response:
 * const errorResponse: IngestResponse = {
 *   success: false,
 *   error: 'CSV parsing failed'
 * };
 */
export interface IngestResponse {
  /** Whether the ingestion was successful */
  success: boolean;
  /** Statistics about the ingestion (only present on success) */
  data?: IngestStats;
  /** Error message (only present on failure) */
  error?: string;
  /** Additional error details or hints */
  details?: string;
  /** Specific validation errors for individual rows */
  errors?: string[];
}

/**
 * WaterData represents daily water demand and supply for a specific region
 *
 * Used for water stress analysis and simulation.
 *
 * @example
 * const waterData: WaterData = {
 *   id: 'uuid-789',
 *   date: '2024-01-15',
 *   region_id: 'SS',
 *   water_demand_m3: 150000,
 *   water_supply_m3: 140000,
 *   reservoir_level_pct: 75
 * };
 */
export interface WaterData {
  /** Unique identifier for this water data record */
  id: string;
  /** Date in ISO format (YYYY-MM-DD) */
  date: string;
  /** Foreign key reference to regions table */
  region_id: string;
  /** Water demand in cubic meters (m³) */
  water_demand_m3: number;
  /** Water supply in cubic meters (m³) */
  water_supply_m3: number;
  /** Reservoir level as percentage (0-100) */
  reservoir_level_pct?: number;
}

/**
 * WaterSimulationScenario defines input parameters for water stress simulation
 *
 * @example
 * const scenario: WaterSimulationScenario = {
 *   water_demand_growth_pct: 30,
 *   rainfall_change_pct: -20,
 *   conservation_rate_pct: -15,
 *   start_date: '2024-01-01',
 *   end_date: '2024-12-31'
 * };
 */
export interface WaterSimulationScenario {
  /** Water demand growth rate as percentage (e.g., 30 = 30% increase from population) */
  water_demand_growth_pct: number;
  /** Rainfall change from baseline as percentage (e.g., -20 = 20% decrease) */
  rainfall_change_pct: number;
  /** Conservation rate as negative percentage (e.g., -15 = 15% savings) */
  conservation_rate_pct: number;
  /** Simulation start date in ISO format (YYYY-MM-DD) */
  start_date: string;
  /** Simulation end date in ISO format (YYYY-MM-DD) */
  end_date: string;
}

/**
 * WaterSimulationResult represents a single day's water simulation output
 *
 * @example
 * const result: WaterSimulationResult = {
 *   date: '2024-06-15',
 *   region_id: 'SS',
 *   region_name: 'San Salvador',
 *   demand: 165000,
 *   supply: 145000,
 *   stress: 0.88,
 *   unmet_demand: 20000
 * };
 */
export interface WaterSimulationResult {
  /** Date of this simulation result in ISO format (YYYY-MM-DD) */
  date: string;
  /** Region identifier this result applies to */
  region_id: string;
  /** Display name of the region */
  region_name: string;
  /** Projected water demand in m³ */
  demand: number;
  /** Available water supply in m³ */
  supply: number;
  /** Water stress ratio (0-1). Values closer to 1 indicate critical shortage */
  stress: number;
  /** Unmet water demand in m³ (demand - supply if positive) */
  unmet_demand: number;
}

/**
 * WaterSimulationResponse is the complete output from water simulation
 *
 * @example
 * const response: WaterSimulationResponse = {
 *   daily_results: [...],
 *   summary: {
 *     avg_stress: 0.65,
 *     max_stress: 0.95,
 *     total_unmet_demand_m3: 2500000,
 *     critical_shortage_days: 45,
 *     top_stressed_regions: [...]
 *   }
 * };
 */
export interface WaterSimulationResponse {
  /** Array of daily simulation results across all regions */
  daily_results: WaterSimulationResult[];
  /** Aggregate summary statistics for the entire simulation */
  summary: {
    /** Average water stress across all regions and dates */
    avg_stress: number;
    /** Maximum stress value encountered in the simulation */
    max_stress: number;
    /** Total unmet water demand across simulation period (m³) */
    total_unmet_demand_m3: number;
    /** Number of days with critical water shortage (stress > 0.8) */
    critical_shortage_days: number;
    /** List of regions with highest average stress (sorted descending) */
    top_stressed_regions: TopStressedRegion[];
  };
  /** Optional economic analysis (added in v2.0+) */
  economic_analysis?: EconomicAnalysis;
  /** Optional AI-generated explanation and insights (added in v3.0+) */
  ai_explanation?: AIExplanation;
}

/**
 * EconomicAnalysis provides comprehensive financial assessment of infrastructure stress
 *
 * Includes investment requirements, ROI calculations, and cost of inaction analysis.
 * All monetary values in USD.
 *
 * @example
 * const analysis: EconomicAnalysis = {
 *   infrastructure_investment_usd: 45_000_000,
 *   annual_savings_usd: 12_000_000,
 *   annual_costs_prevented_usd: 15_000_000,
 *   roi_5_year: 4.2,
 *   payback_period_months: 18,
 *   net_present_value_usd: 35_000_000,
 *   opportunity_cost_6mo_delay_usd: 8_500_000,
 *   total_economic_exposure_usd: 15_000_000,
 *   cost_of_inaction_5_year_usd: 82_500_000
 * };
 */
export interface EconomicAnalysis {
  /** Total infrastructure investment needed (USD) */
  infrastructure_investment_usd: number;

  /** Annual savings from investment (USD/year) */
  annual_savings_usd: number;

  /** Annual costs prevented by taking action (USD/year) */
  annual_costs_prevented_usd: number;

  /** Return on Investment over 5 years (as multiplier, e.g. 4.2 = 420% return) */
  roi_5_year: number;

  /** Time to recover investment (months) */
  payback_period_months: number;

  /** Net Present Value of investment using 5% discount rate (USD) */
  net_present_value_usd: number;

  /** Cost of delaying action by 6 months (USD) */
  opportunity_cost_6mo_delay_usd: number;

  /** Total annual economic exposure if no action taken (USD/year) */
  total_economic_exposure_usd: number;

  /** Cumulative cost of inaction over 5 years (USD) */
  cost_of_inaction_5_year_usd: number;
}

/**
 * AIExplanation provides structured AI-generated insights for simulation results
 *
 * Generated by GPT-4 to explain complex simulation outcomes in executive-friendly
 * language with actionable recommendations.
 *
 * @example
 * const explanation: AIExplanation = {
 *   summary: 'High energy stress detected in San Salvador and La Libertad...',
 *   key_insights: ['Peak demand exceeds capacity by 15%', ...],
 *   risks: ['Grid instability during heat waves', ...],
 *   recommendations: [
 *     {
 *       priority: 'critical',
 *       title: 'Deploy emergency solar capacity',
 *       description: 'Install 50MW solar in San Salvador',
 *       timeline: '30 days',
 *       estimated_cost_usd: 60_000_000
 *     }
 *   ],
 *   confidence_score: 0.85,
 *   generated_at: '2025-10-30T12:00:00Z',
 *   provider: 'openai'
 * };
 */
export interface AIExplanation {
  /** Executive summary of simulation results (2-3 sentences) */
  summary: string;

  /** Key insights extracted from data (3-4 bullet points) */
  key_insights: string[];

  /** Main risks if no action is taken (2-3 points) */
  risks: string[];

  /** Prioritized action items with timelines and costs */
  recommendations: ActionItem[];

  /** Confidence score of the analysis (0-1) */
  confidence_score: number;

  /** ISO timestamp when explanation was generated */
  generated_at: string;

  /** AI provider used ('openai' | 'anthropic') */
  provider: 'openai' | 'anthropic';
}

/**
 * ActionItem represents a recommended action from AI analysis
 *
 * Each action has a priority level, description, timeline, and optional cost estimate.
 */
export interface ActionItem {
  /** Priority level of this action */
  priority: 'critical' | 'high' | 'medium' | 'low';

  /** Short title for the action */
  title: string;

  /** Detailed description of what needs to be done */
  description: string;

  /** Expected timeline for completion (e.g., '30 days', '90 days') */
  timeline: string;

  /** Estimated implementation cost in USD (optional) */
  estimated_cost_usd?: number;

  /** Expected impact or benefit (optional) */
  expected_impact?: string;
}
