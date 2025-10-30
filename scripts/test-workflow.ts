#!/usr/bin/env tsx

/**
 * WorldSim Workflow Test Script
 *
 * Tests the complete workflow:
 * 1. Upload rainfall data
 * 2. Run simulation
 * 3. Verify results
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

const success = (text: string) => `${colors.green}✅ ${text}${colors.reset}`;
const error = (text: string) => `${colors.red}❌ ${text}${colors.reset}`;
const info = (text: string) => `${colors.blue}ℹ️  ${text}${colors.reset}`;
const header = (text: string) => `${colors.bold}${colors.blue}${text}${colors.reset}`;

const BASE_URL = 'http://localhost:3000';

/**
 * Upload rainfall data
 */
async function uploadRainfallData() {
  console.log(header('\n========================================'));
  console.log(header('  STEP 1: Upload Rainfall Data'));
  console.log(header('========================================\n'));

  // Read rainfall sample file
  const rainfallPath = join(__dirname, '../public/sample_data/rainfall_sample.csv');
  console.log(info(`Reading rainfall data from: ${rainfallPath}`));

  const csvText = readFileSync(rainfallPath, 'utf-8');
  const lines = csvText.split('\n').filter(line => line.trim().length > 0);
  console.log(info(`Loaded ${lines.length - 1} rows (excluding header)`));

  // Upload to API
  console.log(info('Uploading to /api/ingest...'));

  const response = await fetch(`${BASE_URL}/api/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      csv_text: csvText,
      data_type: 'rainfall',
    }),
  });

  const result = await response.json();

  if (result.success) {
    console.log(success('Rainfall data uploaded successfully!'));
    console.log(info(`  Rows inserted: ${result.data.rows_inserted}`));
    console.log(info(`  Date range: ${result.data.date_range.min} to ${result.data.date_range.max}`));
    console.log(info(`  Regions affected: ${result.data.regions_affected.length}`));
    return true;
  } else {
    console.log(error('Rainfall upload failed!'));
    console.log(error(`  Error: ${result.error}`));
    if (result.details) {
      console.log(error(`  Details: ${result.details}`));
    }
    return false;
  }
}

/**
 * Run simulation with Drought Year preset
 */
async function runSimulation() {
  console.log(header('\n========================================'));
  console.log(header('  STEP 2: Run Simulation'));
  console.log(header('========================================\n'));

  console.log(info('Running simulation with "Drought Year" preset (-25% rainfall)...'));

  const scenario = {
    solar_growth_pct: 0,
    rainfall_change_pct: -25,
    start_date: '2025-09-16',
    end_date: '2025-10-15',
  };

  console.log(info(`Parameters: ${JSON.stringify(scenario, null, 2)}`));

  const response = await fetch(`${BASE_URL}/api/simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(scenario),
  });

  const result = await response.json();
  // Execution time is tracked on the server side

  if (result.success) {
    console.log(success('Simulation completed successfully!'));
    console.log(info(`  Run ID: ${result.data.run_id}`));
    console.log(info(`  Execution time: ${result.data.execution_time_ms}ms`));
    console.log(info(`  Daily results: ${result.data.daily_results.length} records`));
    console.log(info(`  Average stress: ${(result.data.summary.avg_stress * 100).toFixed(1)}%`));
    console.log(info(`  Maximum stress: ${(result.data.summary.max_stress * 100).toFixed(1)}%`));
    console.log(info(`  Top stressed regions:`));

    result.data.summary.top_stressed_regions.forEach((region: any, index: number) => {
      const stressPercent = (region.avg_stress * 100).toFixed(1);
      console.log(info(`    ${index + 1}. ${region.region_name}: ${stressPercent}%`));
    });

    // Check if execution time is reasonable (< 3 seconds)
    if (result.data.execution_time_ms < 3000) {
      console.log(success(`Performance target met: ${result.data.execution_time_ms}ms < 3000ms`));
    } else {
      console.log(error(`Performance target missed: ${result.data.execution_time_ms}ms > 3000ms`));
    }

    return result.data;
  } else {
    console.log(error('Simulation failed!'));
    console.log(error(`  Error: ${result.error}`));
    if (result.details) {
      console.log(error(`  Details: ${result.details}`));
    }
    return null;
  }
}

/**
 * Verify simulation results
 */
function verifyResults(simulationData: any) {
  console.log(header('\n========================================'));
  console.log(header('  STEP 3: Verify Results'));
  console.log(header('========================================\n'));

  const checks = [
    {
      name: 'Has daily results',
      passed: simulationData.daily_results && simulationData.daily_results.length > 0,
    },
    {
      name: 'Has summary statistics',
      passed: simulationData.summary &&
              typeof simulationData.summary.avg_stress === 'number' &&
              typeof simulationData.summary.max_stress === 'number',
    },
    {
      name: 'Has top stressed regions',
      passed: simulationData.summary.top_stressed_regions &&
              simulationData.summary.top_stressed_regions.length > 0,
    },
    {
      name: 'Stress values in valid range (0-1)',
      passed: simulationData.summary.avg_stress >= 0 &&
              simulationData.summary.avg_stress <= 1 &&
              simulationData.summary.max_stress >= 0 &&
              simulationData.summary.max_stress <= 1,
    },
    {
      name: 'All daily results have required fields',
      passed: simulationData.daily_results.every((result: any) =>
        result.date && result.region_id && result.region_name &&
        typeof result.demand === 'number' &&
        typeof result.supply === 'number' &&
        typeof result.stress === 'number'
      ),
    },
  ];

  let allPassed = true;
  checks.forEach(check => {
    if (check.passed) {
      console.log(success(check.name));
    } else {
      console.log(error(check.name));
      allPassed = false;
    }
  });

  return allPassed;
}

/**
 * Main workflow test
 */
async function main() {
  console.log(header('\n🧪 WorldSim Workflow Test'));
  console.log(header('Testing complete data upload and simulation workflow\n'));

  try {
    // Step 1: Upload rainfall data
    const uploadSuccess = await uploadRainfallData();
    if (!uploadSuccess) {
      console.log(error('\n❌ Workflow failed at upload step'));
      process.exit(1);
    }

    // Step 2: Run simulation
    const simulationData = await runSimulation();
    if (!simulationData) {
      console.log(error('\n❌ Workflow failed at simulation step'));
      process.exit(1);
    }

    // Step 3: Verify results
    const verificationPassed = verifyResults(simulationData);
    if (!verificationPassed) {
      console.log(error('\n❌ Workflow failed at verification step'));
      process.exit(1);
    }

    // Success!
    console.log(header('\n========================================'));
    console.log(success('🎉 Workflow test completed successfully!'));
    console.log(header('========================================\n'));

    console.log(info('Next steps:'));
    console.log(info('  1. Open http://localhost:3000 in your browser'));
    console.log(info('  2. Upload data using the UploadPanel'));
    console.log(info('  3. Adjust sliders or use presets in ControlPanel'));
    console.log(info('  4. Click "Run Simulation"'));
    console.log(info('  5. View color-coded map and results panel\n'));

    process.exit(0);
  } catch (err) {
    console.error(error('\n💥 Workflow test failed with error:'));
    console.error(err);
    process.exit(1);
  }
}

// Run the workflow test
if (require.main === module) {
  main();
}

export { main as runWorkflowTest };
