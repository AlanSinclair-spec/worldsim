import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { simulateScenario } from '@/lib/model';
import { supabase } from '@/lib/supabase';
import type { SimulationScenario, SimulationResponse } from '@/lib/types';
import {
  EnergySimulationSchema,
  checkBodySize,
  formatZodError,
  MAX_BODY_SIZE,
} from '@/lib/validation';
import { applyRateLimit } from '@/lib/rate-limit';

/**
 * API Route: /api/simulate
 *
 * Runs energy infrastructure simulations to model future demand, supply, and stress scenarios.
 *
 * This endpoint:
 * 1. Validates simulation parameters with Zod
 * 2. Executes the simulation model
 * 3. Stores the run in the database for reference
 * 4. Returns detailed results with summary statistics
 *
 * @example
 * POST /api/simulate
 * {
 *   "solar_growth_pct": 10,
 *   "rainfall_change_pct": -15,
 *   "start_date": "2024-01-01",
 *   "end_date": "2024-12-31"
 * }
 *
 * @returns Simulation results with run ID, daily data, and summary
 */

/**
 * Simulation response interface
 */
interface SimulateResponse {
  success: boolean;
  data?: {
    run_id: string;
    daily_results: SimulationResponse['daily_results'];
    summary: SimulationResponse['summary'];
    scenario: SimulationScenario;
    execution_time_ms: number;
  };
  error?: string;
  details?: string | string[];
}

/**
 * POST handler for running simulations
 *
 * Accepts scenario parameters, runs the simulation model, stores the results,
 * and returns comprehensive output including daily projections and summary statistics.
 *
 * @param {NextRequest} req - Next.js request object
 * @returns {NextResponse<SimulateResponse>} JSON response with simulation results
 */
export async function POST(req: NextRequest): Promise<NextResponse<SimulateResponse>> {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] [API /api/simulate] ========== NEW SIMULATION REQUEST ==========`);

  try {
    // Rate limiting - prevent abuse (check before any processing)
    console.log(`[${new Date().toISOString()}] [API /api/simulate] 🚦 Checking rate limits...`);
    const rateLimitResponse = applyRateLimit(req, 'simulation');
    if (rateLimitResponse) {
      return rateLimitResponse as NextResponse<SimulateResponse>;
    }

    // Check body size before parsing (DoS protection)
    console.log(`[${new Date().toISOString()}] [API /api/simulate] 🔒 Checking request size...`);
    if (!checkBodySize(req)) {
      console.error(`[${new Date().toISOString()}] [API /api/simulate] ❌ Request too large`);
      return NextResponse.json(
        {
          success: false,
          error: `Request too large (maximum ${MAX_BODY_SIZE / 1024 / 1024}MB)`,
        },
        { status: 413 }
      );
    }

    // Parse and validate request body with Zod
    console.log(`[${new Date().toISOString()}] [API /api/simulate] 📥 Parsing and validating request body...`);
    const body = await req.json();

    let validatedParams: SimulationScenario;
    try {
      validatedParams = EnergySimulationSchema.parse(body);
      console.log(`[${new Date().toISOString()}] [API /api/simulate] ✅ Input validation passed`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(`[${new Date().toISOString()}] [API /api/simulate] ❌ Validation failed:`, error.errors);
        return NextResponse.json(formatZodError(error), { status: 400 });
      }
      throw error;
    }

    const { solar_growth_pct, rainfall_change_pct, start_date, end_date } = validatedParams;

    console.log(`[${new Date().toISOString()}] [API /api/simulate] 📋 Validated parameters:`, {
      solar_growth_pct,
      rainfall_change_pct,
      start_date,
      end_date,
    });

    // Create scenario object (already validated by Zod)
    const scenario: SimulationScenario = validatedParams;
    console.log(`[${new Date().toISOString()}] [API /api/simulate] 📦 Scenario object:`, scenario);

    // Run simulation
    console.log(`[${new Date().toISOString()}] [API /api/simulate] 🚀 Calling simulateScenario()...`);
    let simulationResults: SimulationResponse;
    try {
      simulationResults = await simulateScenario(scenario);
      console.log(`[${new Date().toISOString()}] [API /api/simulate] ✅ simulateScenario() completed successfully`);
      console.log(`[${new Date().toISOString()}] [API /api/simulate] 📊 Results summary:`, {
        daily_results_count: simulationResults.daily_results?.length || 0,
        avg_stress: simulationResults.summary?.avg_stress,
        max_stress: simulationResults.summary?.max_stress,
      });
    } catch (simulationError) {
      console.error(`[${new Date().toISOString()}] [API /api/simulate] ❌ Simulation failed:`, simulationError);
      console.error(`[${new Date().toISOString()}] [API /api/simulate] Error details:`, {
        message: simulationError instanceof Error ? simulationError.message : 'Unknown error',
        stack: simulationError instanceof Error ? simulationError.stack : 'No stack trace',
      });

      // Check for common errors
      if (simulationError instanceof Error) {
        if (simulationError.message.includes('No regions found')) {
          return NextResponse.json(
            {
              success: false,
              error: 'No regions data available',
              details: 'The regions table is empty. Please seed the database first.',
            },
            { status: 400 }
          );
        }

        if (simulationError.message.includes('Failed to fetch')) {
          return NextResponse.json(
            {
              success: false,
              error: 'Database query failed',
              details: simulationError.message,
            },
            { status: 500 }
          );
        }
      }

      throw simulationError;
    }

    // Calculate execution time
    const executionTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] [API /api/simulate] ⏱️ Simulation execution time: ${executionTime}ms`);

    // Store run in database
    console.log(`[${new Date().toISOString()}] [API /api/simulate] 💾 Storing run in database...`);
    let runId: string | null = null;
    try {
      const { data: runRecord, error: insertError } = await supabase
        .from('runs')
        .insert({
          scenario: scenario as unknown as Record<string, unknown>, // Cast for JSONB
          results: simulationResults as unknown as Record<string, unknown>, // Cast for JSONB
          execution_time_ms: executionTime,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error(`[${new Date().toISOString()}] [API /api/simulate] ⚠️ Failed to store run in database:`, insertError);
        // Continue anyway - return results even if storage fails
      } else if (runRecord) {
        runId = runRecord.id;
        console.log(`[${new Date().toISOString()}] [API /api/simulate] ✅ Run stored in database with ID: ${runId}`);
      }
    } catch (storageError) {
      console.error(`[${new Date().toISOString()}] [API /api/simulate] ⚠️ Error storing run:`, storageError);
      // Continue anyway - return results even if storage fails
    }

    // Log performance metrics
    console.log(`[${new Date().toISOString()}] [API /api/simulate] 📊 Final performance metrics:`, {
      execution_time_ms: executionTime,
      total_results: simulationResults.daily_results.length,
      avg_stress: simulationResults.summary.avg_stress,
      max_stress: simulationResults.summary.max_stress,
      run_id: runId || 'not-stored',
    });

    // Return successful response
    console.log(`[${new Date().toISOString()}] [API /api/simulate] 📤 Returning successful response`);
    const response = {
      success: true,
      data: {
        run_id: runId || 'not-stored',
        daily_results: simulationResults.daily_results,
        summary: simulationResults.summary,
        scenario: scenario,
        execution_time_ms: executionTime,
      },
    };
    console.log(`[${new Date().toISOString()}] [API /api/simulate] ========== REQUEST COMPLETED SUCCESSFULLY ==========`);

    // Return with caching headers for performance
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [API /api/simulate] 💥 UNHANDLED ERROR:`, error);
    console.error(`[${new Date().toISOString()}] [API /api/simulate] Error stack:`, error instanceof Error ? error.stack : 'No stack');

    // Calculate execution time even for errors
    const executionTime = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] [API /api/simulate] ❌ Request failed after ${executionTime}ms`);
    console.log(`[${new Date().toISOString()}] [API /api/simulate] ========== REQUEST FAILED ==========`);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for retrieving past simulation runs
 *
 * Retrieves a previously executed simulation by its run ID.
 *
 * @param {NextRequest} req - Next.js request object
 * @returns {NextResponse<SimulateResponse>} JSON response with stored simulation
 *
 * @example
 * GET /api/simulate?run_id=550e8400-e29b-41d4-a716-446655440000
 */
export async function GET(req: NextRequest): Promise<NextResponse<SimulateResponse>> {
  try {
    const searchParams = req.nextUrl.searchParams;
    const runId = searchParams.get('run_id');

    if (!runId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required query parameter: run_id',
        },
        { status: 400 }
      );
    }

    console.log(`📥 Fetching run: ${runId}`);

    // Fetch run from database
    const { data: runRecord, error: fetchError } = await supabase
      .from('runs')
      .select('id, scenario, results, execution_time_ms, created_at')
      .eq('id', runId)
      .single();

    if (fetchError) {
      console.error('❌ Failed to fetch run:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch simulation run',
          details: fetchError.message,
        },
        { status: 500 }
      );
    }

    if (!runRecord) {
      return NextResponse.json(
        {
          success: false,
          error: 'Simulation run not found',
          details: `No run found with ID: ${runId}`,
        },
        { status: 404 }
      );
    }

    console.log(`✓ Run found: ${runId}`);

    // Cast stored JSONB back to proper types
    const scenario = runRecord.scenario as unknown as SimulationScenario;
    const results = runRecord.results as unknown as SimulationResponse;

    return NextResponse.json({
      success: true,
      data: {
        run_id: runRecord.id,
        daily_results: results.daily_results,
        summary: results.summary,
        scenario: scenario,
        execution_time_ms: runRecord.execution_time_ms || 0,
      },
    });
  } catch (error) {
    console.error('💥 Simulate GET API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
