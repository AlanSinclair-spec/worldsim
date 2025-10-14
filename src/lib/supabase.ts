import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Supabase client instance for database operations
 *
 * This client is configured to work with the WorldSim database schema
 * which includes tables for:
 * - simulations: Stores simulation runs and metadata
 * - energy_data: Energy consumption and production data
 * - climate_data: Rainfall, temperature, and other climate data
 * - regions: El Salvador geographic regions with PostGIS support
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Database table types for type-safe queries
 */
export type SimulationRecord = {
  id: string;
  name: string;
  description: string | null;
  parameters: Record<string, unknown>;
  results: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
};

export type EnergyDataRecord = {
  id: string;
  simulation_id: string;
  region_id: string;
  date: string;
  demand_kwh: number;
  solar_generation_kwh: number;
  grid_generation_kwh: number;
  created_at: string;
};

export type ClimateDataRecord = {
  id: string;
  region_id: string;
  date: string;
  rainfall_mm: number;
  temperature_c: number;
  created_at: string;
};

export type RegionRecord = {
  id: string;
  name: string;
  name_es: string;
  geometry: unknown; // PostGIS geometry type
  population: number | null;
  area_km2: number | null;
  created_at: string;
};
