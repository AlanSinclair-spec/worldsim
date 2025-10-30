import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { simulateAgricultureScenario } from '@/lib/model';
import { supabase } from '@/lib/supabase';
import {
  AgricultureSimulationSchema,
  checkBodySize,
  formatZodError,
  MAX_BODY_SIZE,
} from '@/lib/validation';
import { applyRateLimit } from '@/lib/rate-limit';

/**
 * API Route: /api/simulate-agriculture
 *
 * Runs agriculture impact simulations to model crop yield changes under different climate scenarios.
 *
 * This endpoint:
 * 1. Validates agriculture simulation parameters with Zod
 * 2. Executes the agriculture simulation model
 * 3. Stores the run in the database for reference
 * 4. Returns detailed results with summary statistics
 *
 * @example
 * POST /api/simulate-agriculture
 * {
 *   "rainfall_change_pct": -30,
 *   "temperature_change_c": 2,
 *   "irrigation_improvement_pct": 20,
 *   "crop_type": "coffee",
 *   "start_date": "2024-01-01",
 *   "end_date": "2024-12-31"
 * }
 *
 * @returns Agriculture simulation results with run ID, daily data, and summary
 */

/**
 * Agriculture simulation response interface
 */
interface SimulateAgricultureResponse {
  success: boolean;
  data?: {
    run_id: string;
    daily_results: Array<{
      date: string;
      region_id: string;
      region_name: string;
      crop_type: string;
      baseline_yield_kg: number;
      actual_yield_kg: number;
      yield_change_pct: number;
      stress: number;
    }>;
    summary: {
      avg_stress: number;
      max_stress: number;
      total_yield_loss_kg: number;
      total_yield_loss_pct: number;
      most_affected_crop: string;
      top_stressed_regions: Array<{
        region_id: string;
        region_name: string;
        avg_stress: number;
        crop_type: string;
      }>;
    };
    scenario: {
      rainfall_change_pct: number;
      temperature_change_c: number;
      irrigation_improvement_pct: number;
      crop_type: string;
      start_date: string;
      end_date: string;
    };
    execution_time_ms: number;
  };
  error?: string;
  details?: string | string[];
}

/**
 * POST handler for running agriculture simulations
 *
 * Accepts scenario parameters, runs the agriculture simulation model, stores the results,
 * and returns comprehensive output including daily projections and summary statistics.
 *
 * @param {NextRequest} req - Next.js request object
 * @returns {NextResponse<SimulateAgricultureResponse>} JSON response with simulation results
 */
export async function POST(
  req: NextRequest
): Promise<NextResponse<SimulateAgricultureResponse>> {
  const startTime = Date.now();
  console.log(
    `[${new Date().toISOString()}] [API /api/simulate-agriculture] ========== NEW AGRICULTURE SIMULATION REQUEST ==========`
  );

  try {
    // Rate limiting - prevent abuse (check before any processing)
    console.log(
      `[${new Date().toISOString()}] [API /api/simulate-agriculture] 🚦 Checking rate limits...`
    );
    const rateLimitResponse = applyRateLimit(req, 'simulation');
    if (rateLimitResponse) {
      return rateLimitResponse as NextResponse<SimulateAgricultureResponse>;
    }

    // Check body size before parsing (DoS protection)
    console.log(
      `[${new Date().toISOString()}] [API /api/simulate-agriculture] 🔒 Checking request size...`
    );
    if (!checkBodySize(req)) {
      console.error(
        `[${new Date().toISOString()}] [API /api/simulate-agriculture] ❌ Request too large`
      );
      return NextResponse.json(
        {
          success: false,
          error: `Request too large (maximum ${MAX_BODY_SIZE / 1024 / 1024}MB)`,
        },
        { status: 413 }
      );
    }

    // Parse and validate request body with Zod
    console.log(
      `[${new Date().toISOString()}] [API /api/simulate-agriculture] 📥 Parsing and validating request body...`
    );
    const body = await req.json();

    let validatedParams: z.infer<typeof AgricultureSimulationSchema>;
    try {
      validatedParams = AgricultureSimulationSchema.parse(body);
      console.log(
        `[${new Date().toISOString()}] [API /api/simulate-agriculture] ✅ Input validation passed`
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(
          `[${new Date().toISOString()}] [API /api/simulate-agriculture] ❌ Validation failed:`,
          error.errors
        );
        return NextResponse.json(formatZodError(error), { status: 400 });
      }
      throw error;
    }

    const {
      rainfall_change_pct,
      temperature_change_c,
      irrigation_improvement_pct,
      crop_type,
      start_date,
      end_date,
    } = validatedParams;

    console.log(
      `[${new Date().toISOString()}] [API /api/simulate-agriculture] 📋 Validated parameters:`,
      {
        rainfall_change_pct,
        temperature_change_c,
        irrigation_improvement_pct,
        crop_type,
        start_date,
        end_date,
      }
    );

    // Create scenario object (already validated by Zod)
    const scenario = validatedParams;
    console.log(
      `[${new Date().toISOString()}] [API /api/simulate-agriculture] 📦 Scenario object:`,
      scenario
    );

    // Run agriculture simulation
    console.log(
      `[${new Date().toISOString()}] [API /api/simulate-agriculture] 🚀 Calling simulateAgricultureScenario()...`
    );
    let simulationResults: Awaited<ReturnType<typeof simulateAgricultureScenario>>;
    try {
      simulationResults = await simulateAgricultureScenario(scenario);
      console.log(
        `[${new Date().toISOString()}] [API /api/simulate-agriculture] ✅ simulateAgricultureScenario() completed successfully`
      );
      console.log(
        `[${new Date().toISOString()}] [API /api/simulate-agriculture] 📊 Results summary:`,
        {
          daily_results_count: simulationResults.daily_results?.length || 0,
          avg_stress: simulationResults.summary?.avg_stress,
          max_stress: simulationResults.summary?.max_stress,
          total_yield_loss_kg: simulationResults.summary?.total_yield_loss_kg,
          total_yield_loss_pct: simulationResults.summary?.total_yield_loss_pct,
          most_affected_crop: simulationResults.summary?.most_affected_crop,
        }
      );
    } catch (simulationError) {
      console.error(
        `[${new Date().toISOString()}] [API /api/simulate-agriculture] ❌ Simulation failed:`,
        simulationError
      );
      console.error(
        `[${new Date().toISOString()}] [API /api/simulate-agriculture] Error details:`,
        {
          message:
            simulationError instanceof Error
              ? simulationError.message
              : 'Unknown error',
          stack:
            simulationError instanceof Error
              ? simulationError.stack
              : 'No stack trace',
        }
      );

      // Check for common errors
      if (simulationError instanceof Error) {
        if (simulationError.message.includes('No regions found')) {
          return NextResponse.json(
            {
              success: false,
              error: 'No regions data available',
              details:
                'The regions table is empty. Please seed the database first.',
            },
            { status: 400 }
          );
        }

        if (simulationError.message.includes('Failed to fetch agriculture data')) {
          return NextResponse.json(
            {
              success: false,
              error: 'Agriculture data not available',
              details:
                'The agriculture_daily table is empty or missing data for this date range. Please ensure agriculture data is seeded.',
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
    console.log(
      `[${new Date().toISOString()}] [API /api/simulate-agriculture] ⏱️ Simulation execution time: ${executionTime}ms`
    );

    // Store run in database
    console.log(
      `[${new Date().toISOString()}] [API /api/simulate-agriculture] 💾 Storing run in database...`
    );
    let runId: string | null = null;
    try {
      const { data: runRecord, error: insertError } = await supabase
        .from('runs')
        .insert({
          scenario: { ...scenario, type: 'agriculture' } as unknown as Record<string, unknown>, // Cast for JSONB
          results: simulationResults as unknown as Record<string, unknown>, // Cast for JSONB
          execution_time_ms: executionTime,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error(
          `[${new Date().toISOString()}] [API /api/simulate-agriculture] ⚠️ Failed to store run in database:`,
          insertError
        );
        // Continue anyway - return results even if storage fails
      } else if (runRecord) {
        runId = runRecord.id;
        console.log(
          `[${new Date().toISOString()}] [API /api/simulate-agriculture] ✅ Run stored in database with ID: ${runId}`
        );
      }
    } catch (storageError) {
      console.error(
        `[${new Date().toISOString()}] [API /api/simulate-agriculture] ⚠️ Error storing run:`,
        storageError
      );
      // Continue anyway - return results even if storage fails
    }

    // Log performance metrics
    console.log(
      `[${new Date().toISOString()}] [API /api/simulate-agriculture] 📊 Final performance metrics:`,
      {
        execution_time_ms: executionTime,
        total_results: simulationResults.daily_results.length,
        avg_stress: simulationResults.summary.avg_stress,
        max_stress: simulationResults.summary.max_stress,
        total_yield_loss_kg: simulationResults.summary.total_yield_loss_kg,
        total_yield_loss_pct: simulationResults.summary.total_yield_loss_pct,
        most_affected_crop: simulationResults.summary.most_affected_crop,
        run_id: runId || 'not-stored',
      }
    );

    // Return successful response
    console.log(
      `[${new Date().toISOString()}] [API /api/simulate-agriculture] 📤 Returning successful response`
    );
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
    console.log(
      `[${new Date().toISOString()}] [API /api/simulate-agriculture] ========== REQUEST COMPLETED SUCCESSFULLY ==========`
    );

    // Return with caching headers for performance
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] [API /api/simulate-agriculture] 💥 UNHANDLED ERROR:`,
      error
    );
    console.error(
      `[${new Date().toISOString()}] [API /api/simulate-agriculture] Error stack:`,
      error instanceof Error ? error.stack : 'No stack'
    );

    // Calculate execution time even for errors
    const executionTime = Date.now() - startTime;
    console.error(
      `[${new Date().toISOString()}] [API /api/simulate-agriculture] ❌ Request failed after ${executionTime}ms`
    );
    console.log(
      `[${new Date().toISOString()}] [API /api/simulate-agriculture] ========== REQUEST FAILED ==========`
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for retrieving past agriculture simulation runs
 *
 * Retrieves a previously executed agriculture simulation by its run ID.
 *
 * @param {NextRequest} req - Next.js request object
 * @returns {NextResponse<SimulateAgricultureResponse>} JSON response with stored simulation
 *
 * @example
 * GET /api/simulate-agriculture?run_id=550e8400-e29b-41d4-a716-446655440000
 */
export async function GET(
  req: NextRequest
): Promise<NextResponse<SimulateAgricultureResponse>> {
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

    console.log(`🌾 Fetching agriculture simulation run: ${runId}`);

    // Fetch run from database
    const { data: runRecord, error: fetchError } = await supabase
      .from('runs')
      .select('id, scenario, results, execution_time_ms, created_at')
      .eq('id', runId)
      .single();

    if (fetchError) {
      console.error('❌ Failed to fetch agriculture simulation run:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch agriculture simulation run',
          details: fetchError.message,
        },
        { status: 500 }
      );
    }

    if (!runRecord) {
      return NextResponse.json(
        {
          success: false,
          error: 'Agriculture simulation run not found',
          details: `No run found with ID: ${runId}`,
        },
        { status: 404 }
      );
    }

    console.log(`✓ Agriculture simulation run found: ${runId}`);

    // Cast stored JSONB back to proper types
    const scenario = runRecord.scenario as unknown as z.infer<typeof AgricultureSimulationSchema>;
    const results = runRecord.results as unknown as Awaited<ReturnType<typeof simulateAgricultureScenario>>;

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
    console.error('💥 Simulate Agriculture GET API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
