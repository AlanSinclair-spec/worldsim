import { NextRequest, NextResponse } from 'next/server';
import { runSimulation, validateSimulationParameters } from '@/lib/model';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

/**
 * POST /api/simulate
 *
 * Runs a deterministic simulation based on provided parameters
 *
 * Request body:
 * - regionId: string
 * - startDate: string (ISO date)
 * - endDate: string (ISO date)
 * - solarGrowthRate: number (percentage)
 * - demandGrowthRate: number (percentage)
 * - rainfallChange: number (percentage)
 * - infrastructureCapacity: number (MW)
 */

const simulationParamsSchema = z.object({
  regionId: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  solarGrowthRate: z.number().min(-100).max(1000),
  demandGrowthRate: z.number().min(-100).max(1000),
  rainfallChange: z.number().min(-100).max(1000),
  infrastructureCapacity: z.number().min(0),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input with Zod
    const parseResult = simulationParamsSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid parameters',
          details: parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
        },
        { status: 400 }
      );
    }

    const params = parseResult.data;

    // Validate simulation parameters using model validator
    const validation = validateSimulationParameters(params);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid simulation parameters',
          details: validation.errors.join(', '),
        },
        { status: 400 }
      );
    }

    // Fetch baseline data from database (if available)
    const { data: energyData, error: energyError } = await supabase
      .from('energy_data')
      .select('demand_kwh, solar_generation_kwh')
      .eq('region_id', params.regionId)
      .limit(30); // Get last 30 days

    let baselineData;
    if (energyData && energyData.length > 0) {
      // Calculate averages from historical data
      const avgDemand =
        energyData.reduce((sum, d) => sum + d.demand_kwh, 0) / energyData.length;
      const avgSolar =
        energyData.reduce((sum, d) => sum + d.solar_generation_kwh, 0) / energyData.length;

      baselineData = {
        avgDailyDemandKwh: avgDemand,
        avgDailySolarKwh: avgSolar,
        avgRainfallMm: 5.5,
        avgTemperatureC: 25,
      };
    }
    // If no historical data, use defaults (passed to runSimulation)

    // Run simulation
    const simulationOutput = runSimulation(params, baselineData);

    // Store simulation in database
    const { data: simulationRecord, error: insertError } = await supabase
      .from('simulations')
      .insert({
        name: `Simulation for ${params.regionId}`,
        description: `${params.startDate} to ${params.endDate}`,
        parameters: params,
        results: simulationOutput,
        status: 'completed',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving simulation:', insertError);
      // Continue even if save fails - return results anyway
    }

    return NextResponse.json({
      success: true,
      data: {
        simulation: simulationOutput,
        simulationId: simulationRecord?.id,
      },
    });
  } catch (error) {
    console.error('Simulate API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/simulate?id={simulationId}
 *
 * Retrieves a previously run simulation by ID
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const simulationId = searchParams.get('id');

    if (!simulationId) {
      return NextResponse.json(
        { success: false, error: 'Simulation ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('simulations')
      .select('*')
      .eq('id', simulationId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Simulation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        simulation: data.results,
        simulationId: data.id,
      },
    });
  } catch (error) {
    console.error('Simulate GET API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
