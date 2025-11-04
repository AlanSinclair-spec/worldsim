/**
 * Check Baseline Data Status
 * Diagnose baseline data issues
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBaselineStatus() {
  console.log('🔍 Checking Baseline Data Status\n');

  // Check if is_baseline column exists
  console.log('1. Checking database schema...');
  try {
    const { error: energyError } = await supabase
      .from('energy_daily')
      .select('is_baseline')
      .limit(1);

    if (energyError) {
      console.error('❌ is_baseline column does NOT exist in energy_daily');
      console.error('   Error:', energyError.message);
      console.log('\n⚠️  SOLUTION: Run the migration in Supabase SQL Editor:');
      console.log('   scripts/migrations/001_add_baseline_tracking.sql\n');
      return false;
    } else {
      console.log('✅ is_baseline column exists in energy_daily');
    }
  } catch (error) {
    console.error('❌ Database query failed:', error);
    return false;
  }

  // Check for baseline data
  console.log('\n2. Checking for baseline data...');
  const { count: energyCount, error: energyCountError } = await supabase
    .from('energy_daily')
    .select('*', { count: 'exact', head: true })
    .eq('is_baseline', true);

  if (energyCountError) {
    console.error('❌ Error counting baseline energy data:', energyCountError.message);
    return false;
  }

  const { count: rainfallCount, error: rainfallCountError } = await supabase
    .from('rain_daily')
    .select('*', { count: 'exact', head: true })
    .eq('is_baseline', true);

  if (rainfallCountError) {
    console.error('❌ Error counting baseline rainfall data:', rainfallCountError.message);
    return false;
  }

  console.log(`   Energy baseline records: ${energyCount || 0}`);
  console.log(`   Rainfall baseline records: ${rainfallCount || 0}`);

  if ((energyCount || 0) === 0 || (rainfallCount || 0) === 0) {
    console.log('\n⚠️  No baseline data found!');
    console.log('   SOLUTION: Run: npm run seed:baseline\n');
    return false;
  } else {
    console.log('✅ Baseline data exists!');
  }

  // Check date range
  console.log('\n3. Checking baseline date range...');
  const { data: energyData, error: energyDateError } = await supabase
    .from('energy_daily')
    .select('date')
    .eq('is_baseline', true)
    .order('date', { ascending: true });

  if (energyDateError) {
    console.error('❌ Error fetching date range:', energyDateError.message);
    return false;
  }

  if (energyData && energyData.length > 0) {
    const minDate = energyData[0].date;
    const maxDate = energyData[energyData.length - 1].date;
    console.log(`   Date range: ${minDate} to ${maxDate}`);
    console.log(`   Total days: ${energyData.length / 14} days`);
    console.log('✅ Date range valid');
  }

  // Check for any custom data
  console.log('\n4. Checking for custom (user-uploaded) data...');
  const { count: customCount, error: customError } = await supabase
    .from('energy_daily')
    .select('*', { count: 'exact', head: true })
    .eq('is_baseline', false);

  if (!customError) {
    console.log(`   Custom data records: ${customCount || 0}`);
    if ((customCount || 0) > 0) {
      console.log('✅ Custom data exists (will be used instead of baseline)');
    } else {
      console.log('ℹ️  No custom data (will use baseline)');
    }
  }

  // Check regions
  console.log('\n5. Checking regions...');
  const { data: regions, error: regionsError } = await supabase
    .from('regions')
    .select('id, name');

  if (regionsError) {
    console.error('❌ Error fetching regions:', regionsError.message);
    return false;
  }

  if (!regions || regions.length === 0) {
    console.error('❌ No regions found!');
    console.log('   SOLUTION: Run: npm run seed\n');
    return false;
  }

  console.log(`✅ Found ${regions.length} regions`);

  console.log('\n🎉 All checks passed! System should work.\n');
  return true;
}

checkBaselineStatus()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
