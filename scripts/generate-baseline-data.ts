/**
 * Generate realistic baseline data for El Salvador
 * Creates 30 days of energy and rainfall data for all 14 departments
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

// El Salvador's 14 departments with population-based energy demand
const departments = [
  { name: 'San Salvador', baseEnergy: 6000, baseRainfall: 2.5 }, // Capital, highest demand
  { name: 'Santa Ana', baseEnergy: 4200, baseRainfall: 3.2 },    // 2nd largest
  { name: 'San Miguel', baseEnergy: 3800, baseRainfall: 2.1 },   // 3rd largest
  { name: 'La Libertad', baseEnergy: 3600, baseRainfall: 2.8 },  // Port city
  { name: 'Sonsonate', baseEnergy: 2800, baseRainfall: 4.5 },    // Western, more rain
  { name: 'Usulután', baseEnergy: 2600, baseRainfall: 2.0 },
  { name: 'La Paz', baseEnergy: 2400, baseRainfall: 2.3 },
  { name: 'Cuscatlán', baseEnergy: 2100, baseRainfall: 2.6 },
  { name: 'Ahuachapán', baseEnergy: 2200, baseRainfall: 5.2 },   // Western, high rain
  { name: 'Chalatenango', baseEnergy: 1900, baseRainfall: 3.8 },
  { name: 'Morazán', baseEnergy: 1700, baseRainfall: 1.8 },
  { name: 'San Vicente', baseEnergy: 2000, baseRainfall: 2.7 },
  { name: 'La Unión', baseEnergy: 1800, baseRainfall: 1.5 },
  { name: 'Cabañas', baseEnergy: 1600, baseRainfall: 3.0 },
];

// Generate dates for last 30 days
const generateDates = (days: number): string[] => {
  const dates: string[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }

  return dates;
};

// Add realistic variation to base value
const addVariation = (base: number, dayOfWeek: number, dayIndex: number): number => {
  // Weekend reduction (5-10% lower on Sat/Sun)
  let value = dayOfWeek === 0 || dayOfWeek === 6 ? base * 0.93 : base;

  // Daily random variation (+/- 8%)
  const randomFactor = 0.92 + Math.random() * 0.16;
  value *= randomFactor;

  // Slight upward trend over month (simulate growing demand)
  const trendFactor = 1 + (dayIndex * 0.01);
  value *= trendFactor;

  return Math.round(value);
};

// Add rainfall variation (more realistic with dry/wet periods)
const addRainfallVariation = (base: number, dayIndex: number): number => {
  // Create wet and dry periods
  const cycleFactor = Math.sin(dayIndex / 5) * 0.5 + 0.5; // 10-day wet/dry cycle

  // Random daily variation
  const randomFactor = Math.random();

  // Some days have no rain
  if (randomFactor < 0.3) {
    return 0;
  }

  // Light rain days
  if (randomFactor < 0.6) {
    return Number((base * 0.3 * cycleFactor).toFixed(1));
  }

  // Normal rain days
  if (randomFactor < 0.85) {
    return Number((base * cycleFactor).toFixed(1));
  }

  // Heavy rain days
  return Number((base * 1.8 * cycleFactor).toFixed(1));
};

// Generate energy baseline CSV
const generateEnergyBaseline = (): string => {
  const dates = generateDates(30);
  const lines: string[] = ['date,region_name,value'];

  dates.forEach((date, dayIndex) => {
    const dayOfWeek = new Date(date).getDay();

    departments.forEach(dept => {
      const value = addVariation(dept.baseEnergy, dayOfWeek, dayIndex);
      lines.push(`${date},${dept.name},${value}`);
    });
  });

  return lines.join('\n');
};

// Generate rainfall baseline CSV
const generateRainfallBaseline = (): string => {
  const dates = generateDates(30);
  const lines: string[] = ['date,region_name,value'];

  dates.forEach((date, dayIndex) => {
    departments.forEach(dept => {
      const value = addRainfallVariation(dept.baseRainfall, dayIndex);
      lines.push(`${date},${dept.name},${value}`);
    });
  });

  return lines.join('\n');
};

// Main execution
const main = () => {
  console.log('🌎 Generating El Salvador baseline data...\n');

  // Generate energy baseline
  const energyCSV = generateEnergyBaseline();
  const energyPath = join(process.cwd(), 'public', 'baseline_data', 'el_salvador_energy_baseline.csv');
  writeFileSync(energyPath, energyCSV);
  console.log(`✅ Created: ${energyPath}`);
  console.log(`   - 30 days × 14 departments = 420 rows`);
  console.log(`   - Date range: Last 30 days`);
  console.log(`   - Energy demand: 1,600-7,000 kWh (moderate stress levels)\n`);

  // Generate rainfall baseline
  const rainfallCSV = generateRainfallBaseline();
  const rainfallPath = join(process.cwd(), 'public', 'baseline_data', 'el_salvador_rainfall_baseline.csv');
  writeFileSync(rainfallPath, rainfallCSV);
  console.log(`✅ Created: ${rainfallPath}`);
  console.log(`   - 30 days × 14 departments = 420 rows`);
  console.log(`   - Rainfall: 0-9mm (realistic wet/dry patterns)`);
  console.log(`   - Western regions: Higher rainfall\n`);

  console.log('✨ Baseline data generation complete!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run seed:baseline');
  console.log('2. Baseline data will be available immediately on page load\n');
};

main();
