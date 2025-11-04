/**
 * Seed Script: Baseline Data
 * Populates energy_daily and rain_daily tables with El Salvador baseline data
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse CSV file
function parseCSV(filePath: string): Array<{ date: string; region_name: string; value: number }> {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  // Skip header
  const dataLines = lines.slice(1);

  return dataLines.map(line => {
    const [date, region_name, value] = line.split(',');
    return {
      date: date.trim(),
      region_name: region_name.trim(),
      value: parseFloat(value.trim()),
    };
  });
}

// Get region ID by name
async function getRegionIdByName(name: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('regions')
    .select('id')
    .eq('name', name)
    .single();

  if (error) {
    console.error(`❌ Error fetching region ID for "${name}":`, error.message);
    return null;
  }

  return data?.id || null;
}

// Seed energy baseline data
async function seedEnergyBaseline() {
  console.log('\n📊 Seeding energy baseline data...');

  const filePath = join(process.cwd(), 'public', 'baseline_data', 'el_salvador_energy_baseline.csv');
  const data = parseCSV(filePath);

  console.log(`   Found ${data.length} rows to insert`);

  // Get region mappings
  const regionMap = new Map<string, string>();
  const uniqueRegions = [...new Set(data.map(d => d.region_name))];

  for (const regionName of uniqueRegions) {
    const regionId = await getRegionIdByName(regionName);
    if (regionId) {
      regionMap.set(regionName, regionId);
    } else {
      console.warn(`   ⚠️  Warning: Region "${regionName}" not found in database`);
    }
  }

  console.log(`   Mapped ${regionMap.size}/${uniqueRegions.length} regions`);

  // Delete existing baseline data
  const { error: deleteError } = await supabase
    .from('energy_daily')
    .delete()
    .eq('is_baseline', true);

  if (deleteError) {
    console.error('   ❌ Error deleting old baseline data:', deleteError.message);
  } else {
    console.log('   ✓ Cleared existing baseline data');
  }

  // Insert new baseline data in batches
  const batchSize = 50;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    const records = batch
      .filter(row => regionMap.has(row.region_name))
      .map(row => ({
        region_id: regionMap.get(row.region_name)!,
        date: row.date,
        demand_kwh: row.value,
        solar_kwh: 0,
        grid_kwh: row.value, // Initially assume all from grid
        is_baseline: true,
        data_source: 'baseline',
      }));

    const { error } = await supabase
      .from('energy_daily')
      .upsert(records, { onConflict: 'region_id,date' });

    if (error) {
      console.error(`   ❌ Error inserting batch ${i / batchSize + 1}:`, error.message);
      skipped += records.length;
    } else {
      inserted += records.length;
    }
  }

  console.log(`   ✅ Inserted ${inserted} energy records`);
  if (skipped > 0) {
    console.log(`   ⚠️  Skipped ${skipped} records due to errors`);
  }
}

// Seed rainfall baseline data
async function seedRainfallBaseline() {
  console.log('\n🌧️  Seeding rainfall baseline data...');

  const filePath = join(process.cwd(), 'public', 'baseline_data', 'el_salvador_rainfall_baseline.csv');
  const data = parseCSV(filePath);

  console.log(`   Found ${data.length} rows to insert`);

  // Get region mappings
  const regionMap = new Map<string, string>();
  const uniqueRegions = [...new Set(data.map(d => d.region_name))];

  for (const regionName of uniqueRegions) {
    const regionId = await getRegionIdByName(regionName);
    if (regionId) {
      regionMap.set(regionName, regionId);
    } else {
      console.warn(`   ⚠️  Warning: Region "${regionName}" not found in database`);
    }
  }

  console.log(`   Mapped ${regionMap.size}/${uniqueRegions.length} regions`);

  // Delete existing baseline data
  const { error: deleteError } = await supabase
    .from('rain_daily')
    .delete()
    .eq('is_baseline', true);

  if (deleteError) {
    console.error('   ❌ Error deleting old baseline data:', deleteError.message);
  } else {
    console.log('   ✓ Cleared existing baseline data');
  }

  // Insert new baseline data in batches
  const batchSize = 50;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    const records = batch
      .filter(row => regionMap.has(row.region_name))
      .map(row => ({
        region_id: regionMap.get(row.region_name)!,
        date: row.date,
        rainfall_mm: row.value,
        is_baseline: true,
        data_source: 'baseline',
      }));

    const { error } = await supabase
      .from('rain_daily')
      .upsert(records, { onConflict: 'region_id,date' });

    if (error) {
      console.error(`   ❌ Error inserting batch ${i / batchSize + 1}:`, error.message);
      skipped += records.length;
    } else {
      inserted += records.length;
    }
  }

  console.log(`   ✅ Inserted ${inserted} rainfall records`);
  if (skipped > 0) {
    console.log(`   ⚠️  Skipped ${skipped} records due to errors`);
  }
}

// Verify baseline data was seeded
async function verifyBaseline() {
  console.log('\n🔍 Verifying baseline data...');

  const { count: energyCount } = await supabase
    .from('energy_daily')
    .select('*', { count: 'exact', head: true })
    .eq('is_baseline', true);

  const { count: rainfallCount } = await supabase
    .from('rain_daily')
    .select('*', { count: 'exact', head: true })
    .eq('is_baseline', true);

  console.log(`   Energy baseline records: ${energyCount || 0}`);
  console.log(`   Rainfall baseline records: ${rainfallCount || 0}`);

  if (energyCount && energyCount > 0 && rainfallCount && rainfallCount > 0) {
    console.log('\n✨ Baseline data seeded successfully!');
    console.log('\n📌 Next steps:');
    console.log('   1. Visit http://localhost:3000/interactive');
    console.log('   2. Page will auto-load baseline data');
    console.log('   3. Results will appear within 10 seconds');
    return true;
  } else {
    console.log('\n⚠️  Warning: Baseline data may be incomplete');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🌎 WorldSim Baseline Data Seeder');
  console.log('================================\n');

  try {
    await seedEnergyBaseline();
    await seedRainfallBaseline();
    await verifyBaseline();

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
