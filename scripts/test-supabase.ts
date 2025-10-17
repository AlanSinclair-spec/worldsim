/**
 * Supabase Connection Test Script
 *
 * Tests connectivity to Supabase database and verifies access to all tables.
 * Run with: npm run test:supabase
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local file
const envPath = resolve(__dirname, '../.env.local');
console.log(`📂 Loading environment variables from: ${envPath}\n`);
config({ path: envPath });

// Get credentials from environment
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  '';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Check if configured
function isSupabaseConfigured(): boolean {
  return (
    supabaseUrl.length > 0 &&
    supabaseAnonKey.length > 0 &&
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseAnonKey !== 'placeholder-key'
  );
}

/**
 * Main test function
 */
async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  // Check if Supabase is configured
  console.log('📋 Step 1: Checking Supabase configuration...');
  const configured = isSupabaseConfigured();

  if (!configured) {
    console.error('❌ Supabase is NOT configured!');
    console.error('Please check that .env.local has:');
    console.error('  - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
    console.error('  - SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  console.log('✅ Supabase configuration found\n');

  // Test regions table
  console.log('📋 Step 2: Testing regions table...');
  try {
    const { data: regions, error: regionsError, count } = await supabase
      .from('regions')
      .select('*', { count: 'exact' })
      .limit(5);

    if (regionsError) {
      console.error('❌ Failed to fetch regions:');
      console.error('  Error code:', regionsError.code);
      console.error('  Error message:', regionsError.message);
      console.error('  Error details:', regionsError.details);
      console.error('  Error hint:', regionsError.hint);
      console.error('\n  Full error object:', JSON.stringify(regionsError, null, 2));
    } else {
      console.log(`✅ Regions table accessible! Found ${count || regions?.length || 0} total regions`);
      if (regions && regions.length > 0) {
        console.log(`  Sample region:`, {
          id: regions[0].id,
          name: regions[0].name,
          type: regions[0].type,
        });
      }
    }
  } catch (err) {
    console.error('❌ Exception while fetching regions:', err);
  }

  console.log('');

  // Test energy_daily table
  console.log('📋 Step 3: Testing energy_daily table...');
  try {
    const { data: energyData, error: energyError, count } = await supabase
      .from('energy_daily')
      .select('*', { count: 'exact' })
      .limit(5);

    if (energyError) {
      console.error('❌ Failed to fetch energy_daily:');
      console.error('  Error code:', energyError.code);
      console.error('  Error message:', energyError.message);
      console.error('  Error details:', energyError.details);
      console.error('  Error hint:', energyError.hint);
      console.error('\n  Full error object:', JSON.stringify(energyError, null, 2));
    } else {
      console.log(`✅ Energy_daily table accessible! Found ${count || energyData?.length || 0} total records`);
      if (energyData && energyData.length > 0) {
        console.log(`  Sample record:`, {
          region_id: energyData[0].region_id,
          date: energyData[0].date,
          demand_kwh: energyData[0].demand_kwh,
        });
      }
    }
  } catch (err) {
    console.error('❌ Exception while fetching energy_daily:', err);
  }

  console.log('');

  // Test rain_daily table
  console.log('📋 Step 4: Testing rain_daily table...');
  try {
    const { data: rainData, error: rainError, count } = await supabase
      .from('rain_daily')
      .select('*', { count: 'exact' })
      .limit(5);

    if (rainError) {
      console.error('❌ Failed to fetch rain_daily:');
      console.error('  Error code:', rainError.code);
      console.error('  Error message:', rainError.message);
      console.error('  Error details:', rainError.details);
      console.error('  Error hint:', rainError.hint);
      console.error('\n  Full error object:', JSON.stringify(rainError, null, 2));
    } else {
      console.log(`✅ Rain_daily table accessible! Found ${count || rainData?.length || 0} total records`);
      if (rainData && rainData.length > 0) {
        console.log(`  Sample record:`, {
          region_id: rainData[0].region_id,
          date: rainData[0].date,
          rainfall_mm: rainData[0].rainfall_mm,
        });
      }
    }
  } catch (err) {
    console.error('❌ Exception while fetching rain_daily:', err);
  }

  console.log('');

  // Test runs table
  console.log('📋 Step 5: Testing runs table...');
  try {
    const { data: runsData, error: runsError, count } = await supabase
      .from('runs')
      .select('*', { count: 'exact' })
      .limit(5);

    if (runsError) {
      console.error('❌ Failed to fetch runs:');
      console.error('  Error code:', runsError.code);
      console.error('  Error message:', runsError.message);
      console.error('  Error details:', runsError.details);
      console.error('  Error hint:', runsError.hint);
      console.error('\n  Full error object:', JSON.stringify(runsError, null, 2));
    } else {
      console.log(`✅ Runs table accessible! Found ${count || runsData?.length || 0} total records`);
      if (runsData && runsData.length > 0) {
        console.log(`  Sample record:`, {
          id: runsData[0].id,
          created_at: runsData[0].created_at,
          execution_time_ms: runsData[0].execution_time_ms,
        });
      }
    }
  } catch (err) {
    console.error('❌ Exception while fetching runs:', err);
  }

  console.log('');

  // Summary
  console.log('========================================');
  console.log('🎯 Test Summary:');
  console.log('  1. Configuration: ✅');
  console.log('  2. Regions table: Check logs above');
  console.log('  3. Energy_daily table: Check logs above');
  console.log('  4. Rain_daily table: Check logs above');
  console.log('  5. Runs table: Check logs above');
  console.log('========================================');
  console.log('\n💡 If you see errors above, please check:');
  console.log('  1. Environment variables in .env.local are correct');
  console.log('  2. Supabase project is running');
  console.log('  3. Tables exist in your Supabase database');
  console.log('  4. RLS (Row Level Security) policies allow access');
  console.log('  5. Network connection to Supabase is working');
}

// Run the test
testSupabaseConnection()
  .then(() => {
    console.log('\n✅ Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed with unhandled error:', error);
    process.exit(1);
  });
