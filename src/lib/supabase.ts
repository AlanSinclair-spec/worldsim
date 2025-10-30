import { createClient } from '@supabase/supabase-js';

/**
 * Get Supabase credentials from environment variables
 *
 * In Next.js 14, environment variables prefixed with NEXT_PUBLIC_ are exposed to the browser.
 * Server-side variables (without prefix) are only available in server components and API routes.
 *
 * We use NEXT_PUBLIC_ versions for client-side access and fall back to server-side versions.
 *
 * SECURITY: No placeholder values are used. Missing credentials will cause the application
 * to fail fast, preventing silent failures in production.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// Fail fast if credentials are missing
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage =
    'Missing Supabase environment variables. ' +
    'Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env.local';

  if (typeof window === 'undefined') {
    // Server-side: Throw error to fail build/runtime
    console.error('❌ CRITICAL:', errorMessage);
    throw new Error(errorMessage);
  } else {
    // Client-side: Log error but don't crash the page (allows static export)
    console.error('❌ Supabase configuration error:', errorMessage);
  }
}

// Debug: Log what we're using (server-side only, only if configured)
if (typeof window === 'undefined' && supabaseUrl && supabaseAnonKey) {
  console.log(`[${new Date().toISOString()}] [Supabase Client Init] URL: ${supabaseUrl.substring(0, 30)}...`);
  console.log(`[${new Date().toISOString()}] [Supabase Client Init] Key: ${supabaseAnonKey.substring(0, 20)}...`);
  console.log(`[${new Date().toISOString()}] [Supabase Client Init] ✅ Credentials validated`);
}

/**
 * Supabase client instance for database operations
 *
 * This client is configured to work with the WorldSim database schema.
 *
 * SECURITY: Credentials are validated at initialization. If missing, the application
 * will fail fast rather than use placeholder values.
 *
 * Usage examples:
 *
 * @example
 * // Query regions
 * const { data: regions } = await supabase
 *   .from('regions')
 *   .select('*')
 *   .eq('type', 'department');
 *
 * @example
 * // Insert energy data
 * const { data, error } = await supabase
 *   .from('energy_daily')
 *   .insert({
 *     region_id: 'SS',
 *     date: '2024-01-01',
 *     demand_kwh: 50000,
 *     solar_kwh: 15000
 *   });
 *
 * @example
 * // Get simulation runs
 * const { data: runs } = await supabase
 *   .from('runs')
 *   .select('*')
 *   .eq('status', 'completed')
 *   .order('created_at', { ascending: false });
 */
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

/**
 * Check if Supabase is properly configured
 * Use this in API routes to ensure database is available
 *
 * @returns true if Supabase credentials are configured
 *
 * @example
 * if (!isSupabaseConfigured()) {
 *   return NextResponse.json(
 *     { success: false, error: 'Database not configured' },
 *     { status: 500 }
 *   );
 * }
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
  );
}

/**
 * Database table types for type-safe queries
 */

/**
 * Region record representing El Salvador departments and municipalities
 */
export type RegionRecord = {
  id: string;
  name: string;
  name_es: string;
  type: 'department' | 'municipality';
  parent_id: string | null;
  geometry: unknown; // PostGIS geometry type (Polygon or Point)
  population: number | null;
  area_km2: number | null;
  created_at: string;
};

/**
 * Daily energy data for a specific region
 */
export type EnergyDailyRecord = {
  id: string;
  region_id: string;
  date: string; // ISO date format (YYYY-MM-DD)
  demand_kwh: number;
  solar_kwh: number;
  grid_kwh: number;
  created_at: string;
};

/**
 * Daily rainfall data for a specific region
 */
export type RainDailyRecord = {
  id: string;
  region_id: string;
  date: string; // ISO date format (YYYY-MM-DD)
  rainfall_mm: number;
  created_at: string;
};

/**
 * Simulation run record with parameters and results
 */
export type RunRecord = {
  id: string;
  name: string;
  description: string | null;
  region_id: string;
  start_date: string; // ISO date format
  end_date: string; // ISO date format
  parameters: {
    solar_growth_rate: number;
    demand_growth_rate: number;
    rainfall_change: number;
    infrastructure_capacity: number;
    [key: string]: unknown;
  };
  results: {
    total_demand_kwh: number;
    total_solar_kwh: number;
    total_grid_kwh: number;
    solar_percentage: number;
    average_deficit: number;
    peak_deficit: number;
    [key: string]: unknown;
  } | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
};

/**
 * Legacy compatibility types (for backward compatibility with existing code)
 * @deprecated Use EnergyDailyRecord, RainDailyRecord, and RunRecord instead
 */
export type SimulationRecord = RunRecord;
export type EnergyDataRecord = EnergyDailyRecord;
export type ClimateDataRecord = RainDailyRecord;
