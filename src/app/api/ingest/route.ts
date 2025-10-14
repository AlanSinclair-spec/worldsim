import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Papa from 'papaparse';

/**
 * POST /api/ingest
 *
 * Ingests CSV data into the database
 *
 * Supports:
 * - Energy data (demand, generation)
 * - Climate data (rainfall, temperature)
 * - Infrastructure data (capacity, locations)
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const dataType = formData.get('dataType') as string;
    const regionId = formData.get('regionId') as string;

    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!dataType || !['energy', 'climate', 'infrastructure'].includes(dataType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid data type' },
        { status: 400 }
      );
    }

    if (!regionId) {
      return NextResponse.json(
        { success: false, error: 'Region ID is required' },
        { status: 400 }
      );
    }

    // Read CSV file
    const fileContent = await file.text();

    // Parse CSV
    const parseResult = await new Promise<Papa.ParseResult<Record<string, string>>>(
      (resolve, reject) => {
        Papa.parse(fileContent, {
          header: true,
          skipEmptyLines: true,
          complete: resolve,
          error: reject,
        });
      }
    );

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'CSV parsing error',
          details: parseResult.errors[0].message,
        },
        { status: 400 }
      );
    }

    const records = parseResult.data;
    let insertedCount = 0;
    const errors: string[] = [];

    // Process based on data type
    if (dataType === 'energy') {
      // Validate columns
      const requiredColumns = ['date', 'demand_kwh', 'solar_generation_kwh', 'grid_generation_kwh'];
      const hasRequiredColumns = requiredColumns.every(col =>
        Object.keys(records[0] || {}).includes(col)
      );

      if (!hasRequiredColumns) {
        return NextResponse.json(
          {
            success: false,
            error: `Missing required columns. Expected: ${requiredColumns.join(', ')}`,
          },
          { status: 400 }
        );
      }

      // Insert energy data
      const energyRecords = records.map(record => ({
        region_id: regionId,
        date: record.date,
        demand_kwh: parseFloat(record.demand_kwh),
        solar_generation_kwh: parseFloat(record.solar_generation_kwh),
        grid_generation_kwh: parseFloat(record.grid_generation_kwh),
      }));

      const { error } = await supabase.from('energy_data').insert(energyRecords);

      if (error) {
        return NextResponse.json(
          { success: false, error: `Database error: ${error.message}` },
          { status: 500 }
        );
      }

      insertedCount = energyRecords.length;
    } else if (dataType === 'climate') {
      // Validate columns
      const requiredColumns = ['date', 'rainfall_mm', 'temperature_c'];
      const hasRequiredColumns = requiredColumns.every(col =>
        Object.keys(records[0] || {}).includes(col)
      );

      if (!hasRequiredColumns) {
        return NextResponse.json(
          {
            success: false,
            error: `Missing required columns. Expected: ${requiredColumns.join(', ')}`,
          },
          { status: 400 }
        );
      }

      // Insert climate data
      const climateRecords = records.map(record => ({
        region_id: regionId,
        date: record.date,
        rainfall_mm: parseFloat(record.rainfall_mm),
        temperature_c: parseFloat(record.temperature_c),
      }));

      const { error } = await supabase.from('climate_data').insert(climateRecords);

      if (error) {
        return NextResponse.json(
          { success: false, error: `Database error: ${error.message}` },
          { status: 500 }
        );
      }

      insertedCount = climateRecords.length;
    } else if (dataType === 'infrastructure') {
      // Infrastructure ingestion not yet implemented
      return NextResponse.json(
        { success: false, error: 'Infrastructure data ingestion not yet implemented' },
        { status: 501 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        recordsImported: insertedCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error('Ingest API Error:', error);
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
