import { NextRequest, NextResponse } from 'next/server';
import { simulateScenario, validateScenarioParams } from '@/lib/model';
import { supabase } from '@/lib/supabase';
import type { SimulationScenario, SimulationResponse } from '@/lib/types';

/**
 * API Route: /api/simulate
 *
 * Runs energy infrastructure simulations to model future demand, supply, and stress scenarios.
 *
 * This endpoint:
 * 1. Validates simulation parameters
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
 * Simulation request body interface
 */
interface SimulateRequest {
  solar_growth_pct: number;
  rainfall_change_pct: number;
  start_date: string;
  end_date: string;
}

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
  details?: string;
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

  try {
    // Parse request body
    const body = await req.json() as SimulateRequest;
    const { solar_growth_pct, rainfall_change_pct, start_date, end_date } = body;

    console.log('📥 Simulation request received:', {
      solar_growth_pct,
      rainfall_change_pct,
      start_date,
      end_date,
    });

    // Validate required fields
    if (solar_growth_pct === undefined || solar_growth_pct === null) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: solar_growth_pct',
        },
        { status: 400 }
      );
    }

    if (rainfall_change_pct === undefined || rainfall_change_pct === null) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: rainfall_change_pct',
        },
        { status: 400 }
      );
    }

    if (!start_date) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: start_date',
        },
        { status: 400 }
      );
    }

    if (!end_date) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: end_date',
        },
        { status: 400 }
      );
    }

    // Create scenario object
    const scenario: SimulationScenario = {
      solar_growth_pct,
      rainfall_change_pct,
      start_date,
      end_date,
    };

    // Validate scenario parameters
    const validation = validateScenarioParams(scenario);
    if (!validation.isValid) {
      console.warn('❌ Validation failed:', validation.error);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid simulation parameters',
          details: validation.error,
        },
        { status: 400 }
      );
    }

    console.log('✓ Parameters validated successfully');

    // Run simulation
    let simulationResults: SimulationResponse;
    try {
      simulationResults = await simulateScenario(scenario);
    } catch (simulationError) {
      console.error('❌ Simulation failed:', simulationError);

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

    console.log('✓ Simulation completed successfully');

    // Calculate execution time
    const executionTime = Date.now() - startTime;

    // Store run in database
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
        console.error('⚠️ Failed to store run in database:', insertError);
        // Continue anyway - return results even if storage fails
      } else if (runRecord) {
        runId = runRecord.id;
        console.log(`✓ Run stored in database with ID: ${runId}`);
      }
    } catch (storageError) {
      console.error('⚠️ Error storing run:', storageError);
      // Continue anyway - return results even if storage fails
    }

    // Log performance metrics
    console.log('📊 Performance metrics:', {
      execution_time_ms: executionTime,
      total_results: simulationResults.daily_results.length,
      avg_stress: simulationResults.summary.avg_stress,
    });

    // Return successful response
    return NextResponse.json({
      success: true,
      data: {
        run_id: runId || 'not-stored',
        daily_results: simulationResults.daily_results,
        summary: simulationResults.summary,
        scenario: scenario,
        execution_time_ms: executionTime,
      },
    });
  } catch (error) {
    console.error('💥 Simulate API Error:', error);

    // Calculate execution time even for errors
    const executionTime = Date.now() - startTime;
    console.error(`❌ Request failed after ${executionTime}ms`);

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
