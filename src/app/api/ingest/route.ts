import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { supabase } from '@/lib/supabase';

/**
 * API Route: /api/ingest
 *
 * Ingests CSV data for energy or rainfall measurements into the WorldSim database.
 *
 * This endpoint validates CSV data, matches regions by name, and safely inserts
 * records using upsert to handle duplicates.
 *
 * @example
 * POST /api/ingest
 * {
 *   csv_text: "date,region_name,value\n2024-01-01,San Salvador,50000\n...",
 *   data_type: "energy"
 * }
 *
 * @returns {Object} Result with insertion stats or error details
 */

/** Valid region names (El Salvador's 14 departments) */
const VALID_REGIONS = [
  'San Salvador',
  'Santa Ana',
  'San Miguel',
  'La Libertad',
  'Sonsonate',
  'La Paz',
  'Usulután',
  'Chalatenango',
  'Cuscatlán',
  'Ahuachapán',
  'Morazán',
  'La Unión',
  'San Vicente',
  'Cabañas',
];

/**
 * Request body structure
 */
interface IngestRequest {
  csv_text: string;
  data_type: 'energy' | 'rainfall';
}

/**
 * Parsed CSV row structure
 */
interface CSVRow {
  date: string;
  region_name: string;
  value: string | number;
}

/**
 * Response statistics
 */
interface IngestStats {
  rows_inserted: number;
  date_range: {
    min: string;
    max: string;
  };
  regions_affected: string[];
  errors: string[];
}

/**
 * POST handler for CSV data ingestion
 *
 * Validates and inserts energy or rainfall data from CSV format.
 *
 * Expected CSV format:
 * - Headers: date, region_name, value
 * - Date format: YYYY-MM-DD
 * - Region name: Must match one of El Salvador's 14 departments
 * - Value: Numeric (kWh for energy, mm for rainfall)
 *
 * @param {NextRequest} req - Next.js request object
 * @returns {NextResponse} JSON response with success status and data/error
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json() as IngestRequest;
    const { csv_text, data_type } = body;

    // Validate inputs
    if (!csv_text || typeof csv_text !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid csv_text' },
        { status: 400 }
      );
    }

    if (!data_type || !['energy', 'rainfall'].includes(data_type)) {
      return NextResponse.json(
        { success: false, error: 'data_type must be "energy" or "rainfall"' },
        { status: 400 }
      );
    }

    // Parse CSV
    let records: CSVRow[];
    try {
      records = parse(csv_text, {
        columns: true, // Use first row as headers
        skip_empty_lines: true,
        trim: true,
        cast: false, // Keep as strings for validation
      }) as CSVRow[];
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          error: 'CSV parsing failed',
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error',
        },
        { status: 400 }
      );
    }

    // Check if CSV is empty
    if (records.length === 0) {
      return NextResponse.json(
        { success: false, error: 'CSV contains no data rows' },
        { status: 400 }
      );
    }

    // Validate required columns
    const firstRow = records[0];
    const requiredColumns = ['date', 'region_name', 'value'];
    const missingColumns = requiredColumns.filter(
      col => !(col in firstRow)
    );

    if (missingColumns.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required columns: ${missingColumns.join(', ')}`,
          expected: requiredColumns,
        },
        { status: 400 }
      );
    }

    // Validate and transform records
    const errors: string[] = [];
    const validRecords: Array<{
      date: string;
      region_name: string;
      value: number;
    }> = [];

    records.forEach((row, index) => {
      const rowNum = index + 2; // +2 because index 0 = row 2 (after header)

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(row.date)) {
        errors.push(`Row ${rowNum}: Invalid date format "${row.date}" (expected YYYY-MM-DD)`);
        return;
      }

      // Validate date is a real date
      const parsedDate = new Date(row.date);
      if (isNaN(parsedDate.getTime())) {
        errors.push(`Row ${rowNum}: Invalid date "${row.date}"`);
        return;
      }

      // Validate region name
      if (!VALID_REGIONS.includes(row.region_name)) {
        errors.push(
          `Row ${rowNum}: Unknown region "${row.region_name}". Valid regions: ${VALID_REGIONS.join(', ')}`
        );
        return;
      }

      // Validate value is numeric
      const numericValue = typeof row.value === 'number'
        ? row.value
        : parseFloat(String(row.value));

      if (isNaN(numericValue)) {
        errors.push(`Row ${rowNum}: Value "${row.value}" is not a number`);
        return;
      }

      // Validate value is positive
      if (numericValue < 0) {
        errors.push(`Row ${rowNum}: Value ${numericValue} cannot be negative`);
        return;
      }

      // Record is valid
      validRecords.push({
        date: row.date,
        region_name: row.region_name,
        value: numericValue,
      });
    });

    // If more than 20% of rows failed, reject the entire upload
    if (errors.length > records.length * 0.2) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many validation errors (${errors.length} out of ${records.length} rows failed)`,
          errors: errors.slice(0, 10), // Show first 10 errors
        },
        { status: 400 }
      );
    }

    // If no valid records, return error
    if (validRecords.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid records to insert',
          errors,
        },
        { status: 400 }
      );
    }

    // Fetch region IDs from database
    const uniqueRegionNames = [...new Set(validRecords.map(r => r.region_name))];
    const { data: regions, error: regionError } = await supabase
      .from('regions')
      .select('id, name')
      .in('name', uniqueRegionNames);

    if (regionError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch regions from database',
          details: regionError.message,
        },
        { status: 500 }
      );
    }

    // Create region name to ID mapping
    const regionMap = new Map<string, string>();
    regions?.forEach(region => {
      regionMap.set(region.name, region.id);
    });

    // Check if all regions were found
    const missingRegions = uniqueRegionNames.filter(
      name => !regionMap.has(name)
    );

    if (missingRegions.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Regions not found in database: ${missingRegions.join(', ')}`,
          hint: 'These regions may need to be added to the database first',
        },
        { status: 400 }
      );
    }

    // Prepare records for insertion
    const insertRecords = validRecords.map(record => {
      const region_id = regionMap.get(record.region_name)!;

      if (data_type === 'energy') {
        return {
          region_id,
          date: record.date,
          demand_kwh: record.value,
          solar_kwh: 0, // Default values - can be updated later
          grid_kwh: record.value, // Assume all demand is from grid initially
        };
      } else {
        // rainfall
        return {
          region_id,
          date: record.date,
          rainfall_mm: record.value,
        };
      }
    });

    // Insert records using upsert (handles duplicates)
    const tableName = data_type === 'energy' ? 'energy_daily' : 'rain_daily';
    const { data: insertedData, error: insertError } = await supabase
      .from(tableName)
      .upsert(insertRecords, {
        onConflict: 'region_id,date', // Unique constraint
        ignoreDuplicates: false, // Update existing records
      })
      .select();

    if (insertError) {
      return NextResponse.json(
        {
          success: false,
          error: `Database insertion failed: ${insertError.message}`,
          details: insertError.details || insertError.hint,
        },
        { status: 500 }
      );
    }

    // Calculate statistics
    const dates = validRecords.map(r => r.date).sort();
    const dateRange = {
      min: dates[0],
      max: dates[dates.length - 1],
    };

    const stats: IngestStats = {
      rows_inserted: insertedData?.length || validRecords.length,
      date_range: dateRange,
      regions_affected: uniqueRegionNames,
      errors: errors.length > 0 ? errors : [],
    };

    return NextResponse.json({
      success: true,
      data: stats,
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
