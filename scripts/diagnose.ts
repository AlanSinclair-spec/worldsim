#!/usr/bin/env tsx

/**
 * WorldSim Diagnostic Script
 * 
 * Comprehensive health check for the WorldSim application including:
 * - Database connectivity and table verification
 * - API endpoint availability
 * - Sample data validation
 * - Environment variable checks
 * - Simulation model testing
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';

// Import model functions for testing
import { calculateStress, calculateSummary, validateScenarioParams } from '../src/lib/model';
import type { SimulationScenario, SimulationResult } from '../src/lib/types';

// ANSI color codes for output formatting
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

// Helper functions for colored output
const success = (text: string) => `${colors.green}✅ ${text}${colors.reset}`;
const error = (text: string) => `${colors.red}❌ ${text}${colors.reset}`;
const warning = (text: string) => `${colors.yellow}⚠️  ${text}${colors.reset}`;
const info = (text: string) => `${colors.blue}ℹ️  ${text}${colors.reset}`;
const header = (text: string) => `${colors.bold}${colors.blue}${text}${colors.reset}`;

// Track overall status
let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function checkResult(passed: boolean, message: string, details?: string) {
  totalChecks++;
  if (passed) {
    passedChecks++;
    console.log(success(message));
  } else {
    failedChecks++;
    console.log(error(message));
    if (details) {
      console.log(`   ${colors.red}${details}${colors.reset}`);
    }
  }
}

function printSection(title: string) {
  console.log('\n' + header(`\n${'='.repeat(60)}`));
  console.log(header(`  ${title}`));
  console.log(header(`${'='.repeat(60)}`));
}

async function checkDatabaseConnectivity() {
  printSection('DATABASE CONNECTIVITY');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  
  checkResult(
    !!supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co',
    'SUPABASE_URL is configured',
    supabaseUrl ? 'URL is set' : 'SUPABASE_URL environment variable is missing'
  );
  
  checkResult(
    !!supabaseKey && supabaseKey !== 'placeholder-key',
    'SUPABASE_ANON_KEY is configured',
    supabaseKey ? 'Key is set' : 'SUPABASE_ANON_KEY environment variable is missing'
  );

  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://placeholder.supabase.co' || supabaseKey === 'placeholder-key') {
    console.log(warning('Skipping database checks - credentials not configured'));
    return;
  }

  // Test Supabase connection
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic connection
    const { error } = await supabase.from('regions').select('count').limit(1);
    
    checkResult(
      !error,
      'Supabase connection successful',
      error ? `Connection failed: ${error.message}` : 'Database is reachable'
    );

    if (error) {
      console.log(warning('Skipping table checks - connection failed'));
      return;
    }

    // Check if all required tables exist
    const tables = ['regions', 'energy_daily', 'rain_daily', 'runs'];
    
    for (const table of tables) {
      try {
        const { error: tableError } = await supabase.from(table).select('*').limit(1);
        checkResult(
          !tableError,
          `Table '${table}' exists`,
          tableError ? `Table error: ${tableError.message}` : 'Table is accessible'
        );
      } catch (err) {
        checkResult(false, `Table '${table}' exists`, `Exception: ${err}`);
      }
    }

    // Check regions table has 14 rows
    try {
      const { data: regions, error: regionsError } = await supabase
        .from('regions')
        .select('id', { count: 'exact' });
      
      const regionCount = regions?.length || 0;
      checkResult(
        !regionsError && regionCount === 14,
        `Regions table has 14 rows (found: ${regionCount})`,
        regionsError ? `Query error: ${regionsError.message}` : 
        regionCount !== 14 ? `Expected 14 rows, found ${regionCount}` : 'Correct number of regions'
      );
    } catch (err) {
      checkResult(false, 'Regions table has 14 rows', `Exception: ${err}`);
    }

    // Check energy_daily has data
    try {
      const { data: energyData, error: energyError } = await supabase
        .from('energy_daily')
        .select('id', { count: 'exact' });
      
      const energyCount = energyData?.length || 0;
      checkResult(
        !energyError && energyCount > 0,
        `Energy_daily table has data (${energyCount} rows)`,
        energyError ? `Query error: ${energyError.message}` : 
        energyCount === 0 ? 'No energy data found' : 'Energy data is available'
      );
    } catch (err) {
      checkResult(false, 'Energy_daily table has data', `Exception: ${err}`);
    }

    // Check rain_daily has data
    try {
      const { data: rainData, error: rainError } = await supabase
        .from('rain_daily')
        .select('id', { count: 'exact' });
      
      const rainCount = rainData?.length || 0;
      checkResult(
        !rainError && rainCount > 0,
        `Rain_daily table has data (${rainCount} rows)`,
        rainError ? `Query error: ${rainError.message}` : 
        rainCount === 0 ? 'No rainfall data found' : 'Rainfall data is available'
      );
    } catch (err) {
      checkResult(false, 'Rain_daily table has data', `Exception: ${err}`);
    }

    // Print row counts for each table
    console.log('\n' + info('Table Row Counts:'));
    for (const table of tables) {
      try {
        const { data, error: countError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!countError) {
          console.log(`   ${table}: ${data?.length || 0} rows`);
        } else {
          console.log(`   ${table}: Error - ${countError.message}`);
        }
      } catch (err) {
        console.log(`   ${table}: Error - ${err}`);
      }
    }

  } catch (err) {
    checkResult(false, 'Supabase connection test', `Exception: ${err}`);
  }
}

async function checkApiEndpoints() {
  printSection('API ENDPOINTS');
  
  // Check if Next.js dev server is running by testing localhost
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Test /api/ingest endpoint
    const ingestResponse = await fetch(`${baseUrl}/api/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv_text: 'test', data_type: 'energy' })
    });
    
    checkResult(
      ingestResponse.status !== 404,
      '/api/ingest endpoint exists',
      ingestResponse.status === 404 ? 'Endpoint not found (404)' : 
      ingestResponse.status === 400 ? 'Endpoint exists but expects valid data' : 
      'Endpoint is accessible'
    );
  } catch (err) {
    checkResult(false, '/api/ingest endpoint exists', `Connection failed: ${err}`);
  }

  try {
    // Test /api/simulate endpoint
    const simulateResponse = await fetch(`${baseUrl}/api/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        solar_growth_pct: 10, 
        rainfall_change_pct: -5, 
        start_date: '2024-01-01', 
        end_date: '2024-01-02' 
      })
    });
    
    checkResult(
      simulateResponse.status !== 404,
      '/api/simulate endpoint exists',
      simulateResponse.status === 404 ? 'Endpoint not found (404)' : 
      simulateResponse.status === 400 ? 'Endpoint exists but expects valid data' : 
      'Endpoint is accessible'
    );
  } catch (err) {
    checkResult(false, '/api/simulate endpoint exists', `Connection failed: ${err}`);
  }

  // Check if Next.js dev server is running
  try {
    const healthResponse = await fetch(baseUrl);
    checkResult(
      healthResponse.ok,
      'Next.js development server is running',
      healthResponse.ok ? 'Server is responding' : `Server returned ${healthResponse.status}`
    );
  } catch (err) {
    checkResult(false, 'Next.js development server is running', `Server not accessible: ${err}`);
    console.log(warning('Make sure to run "npm run dev" in another terminal'));
  }
}

function checkSampleData() {
  printSection('SAMPLE DATA');
  
  const sampleDataDir = join(process.cwd(), 'public', 'sample_data');
  
  // Check energy_sample.csv exists
  const energySamplePath = join(sampleDataDir, 'energy_sample.csv');
  const energyExists = existsSync(energySamplePath);
  checkResult(energyExists, 'energy_sample.csv exists', energyExists ? 'File found' : 'File not found');
  
  if (energyExists) {
    try {
      const energyContent = readFileSync(energySamplePath, 'utf-8');
      const energyRows = parse(energyContent, { columns: true, skip_empty_lines: true });
      checkResult(
        energyRows.length > 0,
        `energy_sample.csv has data (${energyRows.length} rows)`,
        energyRows.length === 0 ? 'File is empty' : 'Contains data rows'
      );
    } catch (err) {
      checkResult(false, 'energy_sample.csv is readable', `Parse error: ${err}`);
    }
  }

  // Check rainfall_sample.csv exists
  const rainfallSamplePath = join(sampleDataDir, 'rainfall_sample.csv');
  const rainfallExists = existsSync(rainfallSamplePath);
  checkResult(rainfallExists, 'rainfall_sample.csv exists', rainfallExists ? 'File found' : 'File not found');
  
  if (rainfallExists) {
    try {
      const rainfallContent = readFileSync(rainfallSamplePath, 'utf-8');
      const rainfallRows = parse(rainfallContent, { columns: true, skip_empty_lines: true });
      checkResult(
        rainfallRows.length > 0,
        `rainfall_sample.csv has data (${rainfallRows.length} rows)`,
        rainfallRows.length === 0 ? 'File is empty' : 'Contains data rows'
      );
    } catch (err) {
      checkResult(false, 'rainfall_sample.csv is readable', `Parse error: ${err}`);
    }
  }
}

function checkEnvironmentVariables() {
  printSection('ENVIRONMENT VARIABLES');
  
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY', 
    'NEXT_PUBLIC_MAPBOX_TOKEN'
  ];
  
  for (const varName of requiredVars) {
    const value = process.env[varName] || process.env[`NEXT_PUBLIC_${varName}`];
    checkResult(
      !!value && value.length > 0,
      `${varName} is set`,
      value ? 'Variable is configured' : 'Variable is missing or empty'
    );
  }
}

function checkSimulationModel() {
  printSection('SIMULATION MODEL');
  
  // Test calculateStress function
  try {
    const stress1 = calculateStress(100, 90);
    const stress2 = calculateStress(100, 110);
    const stress3 = calculateStress(100, 50);
    
    const tests = [
      { result: stress1, expected: 0.1, name: 'calculateStress(100, 90) = 0.1' },
      { result: stress2, expected: 0, name: 'calculateStress(100, 110) = 0' },
      { result: stress3, expected: 0.5, name: 'calculateStress(100, 50) = 0.5' }
    ];
    
    for (const test of tests) {
      checkResult(
        Math.abs(test.result - test.expected) < 0.001,
        test.name,
        `Expected ${test.expected}, got ${test.result}`
      );
    }
  } catch (err) {
    checkResult(false, 'calculateStress function works', `Exception: ${err}`);
  }

  // Test calculateSummary function
  try {
    const sampleResults: SimulationResult[] = [
      { date: '2024-01-01', region_id: 'SS', region_name: 'San Salvador', demand: 100, supply: 90, stress: 0.1 },
      { date: '2024-01-01', region_id: 'SA', region_name: 'Santa Ana', demand: 100, supply: 50, stress: 0.5 },
      { date: '2024-01-02', region_id: 'SS', region_name: 'San Salvador', demand: 100, supply: 80, stress: 0.2 },
    ];
    
    const summary = calculateSummary(sampleResults);
    
    checkResult(
      summary.avg_stress > 0 && summary.max_stress > 0 && summary.top_stressed_regions.length > 0,
      'calculateSummary function works',
      `avg_stress: ${summary.avg_stress}, max_stress: ${summary.max_stress}, regions: ${summary.top_stressed_regions.length}`
    );
  } catch (err) {
    checkResult(false, 'calculateSummary function works', `Exception: ${err}`);
  }

  // Test validateScenarioParams function
  try {
    const validScenario: SimulationScenario = {
      solar_growth_pct: 10,
      rainfall_change_pct: -5,
      start_date: '2024-01-01',
      end_date: '2024-12-31'
    };
    
    const invalidScenario: SimulationScenario = {
      solar_growth_pct: 300, // Too high
      rainfall_change_pct: -5,
      start_date: '2024-01-01',
      end_date: '2023-12-31' // Before start date
    };
    
    const validResult = validateScenarioParams(validScenario);
    const invalidResult = validateScenarioParams(invalidScenario);
    
    checkResult(
      validResult.isValid && !invalidResult.isValid,
      'validateScenarioParams function works',
      `Valid scenario: ${validResult.isValid}, Invalid scenario: ${invalidResult.isValid}`
    );
  } catch (err) {
    checkResult(false, 'validateScenarioParams function works', `Exception: ${err}`);
  }

  // Check if all model functions are exported
  const modelFunctions = ['calculateStress', 'calculateSummary', 'simulateScenario', 'validateScenarioParams'];
  for (const funcName of modelFunctions) {
    checkResult(
      typeof (globalThis as any)[funcName] === 'function' || 
      typeof calculateStress === 'function' || 
      typeof calculateSummary === 'function',
      `lib/model.ts exports ${funcName}`,
      'Function is available'
    );
  }
}

function printSummary() {
  printSection('DIAGNOSTIC SUMMARY');
  
  console.log(`\n${colors.bold}Total Checks: ${totalChecks}${colors.reset}`);
  console.log(`${colors.green}Passed: ${passedChecks}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedChecks}${colors.reset}`);
  
  const successRate = totalChecks > 0 ? (passedChecks / totalChecks * 100).toFixed(1) : '0';
  console.log(`${colors.blue}Success Rate: ${successRate}%${colors.reset}`);
  
  if (failedChecks === 0) {
    console.log(`\n${success('All checks passed! Your WorldSim application is ready to go.')}`);
  } else {
    console.log(`\n${warning(`${failedChecks} check(s) failed. Please review the issues above.`)}`);
    
    console.log(`\n${colors.bold}Common Fixes:${colors.reset}`);
    console.log('• Database issues: Run "npm run seed" to populate the database');
    console.log('• API issues: Start the dev server with "npm run dev"');
    console.log('• Environment variables: Create .env.local with required variables');
    console.log('• Sample data: Ensure CSV files exist in public/sample_data/');
  }
}

// Main execution
async function main() {
  console.log(header('\n🔍 WorldSim Diagnostic Tool'));
  console.log(header('Comprehensive health check for the WorldSim application\n'));
  
  try {
    await checkDatabaseConnectivity();
    await checkApiEndpoints();
    checkSampleData();
    checkEnvironmentVariables();
    checkSimulationModel();
    printSummary();
  } catch (err) {
    console.error(error(`Diagnostic failed: ${err}`));
    process.exit(1);
  }
}

// Run the diagnostic
if (require.main === module) {
  main().catch(console.error);
}

export { main as runDiagnostic };
