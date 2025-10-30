/**
 * Generate Sample Agriculture Data for WorldSim
 *
 * Creates realistic agriculture data for El Salvador:
 * - 30 days (2024-09-16 to 2024-10-15)
 * - 14 regions (all El Salvador departments)
 * - 4 crops (coffee, sugar_cane, corn, beans)
 * - Total: 1,680 rows
 *
 * Run with: npx tsx scripts/generate-agriculture-data.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// El Salvador regions (14 departments)
const REGIONS = [
  'San Salvador',
  'La Libertad',
  'Santa Ana',
  'Sonsonate',
  'La Paz',
  'Usulután',
  'San Miguel',
  'Morazán',
  'La Unión',
  'Cuscatlán',
  'Cabañas',
  'Chalatenango',
  'Ahuachapán',
  'San Vicente',
];

// Crop types
const CROPS = ['coffee', 'sugar_cane', 'corn', 'beans'];

// Baseline yields by crop (kg/hectare) - mid-range values
const BASELINE_YIELDS = {
  coffee: 1000,
  sugar_cane: 70000,
  corn: 2750,
  beans: 1150,
};

// Regional characteristics (altitude affects temperature and crop suitability)
const REGION_CHARACTERISTICS: Record<string, { altitude: 'high' | 'medium' | 'low' }> = {
  'San Salvador': { altitude: 'medium' },
  'La Libertad': { altitude: 'low' },
  'Santa Ana': { altitude: 'high' },    // Coffee region
  'Sonsonate': { altitude: 'low' },     // Sugar cane region
  'La Paz': { altitude: 'low' },        // Sugar cane region
  'Usulután': { altitude: 'low' },      // Sugar cane region
  'San Miguel': { altitude: 'medium' },
  'Morazán': { altitude: 'high' },
  'La Unión': { altitude: 'low' },
  'Cuscatlán': { altitude: 'medium' },
  'Cabañas': { altitude: 'medium' },
  'Chalatenango': { altitude: 'high' }, // Coffee region
  'Ahuachapán': { altitude: 'high' },   // Coffee region
  'San Vicente': { altitude: 'medium' },
};

/**
 * Generate random value within range
 */
function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Get temperature based on region altitude and day progression
 */
function getTemperature(region: string, dayIndex: number): number {
  const characteristics = REGION_CHARACTERISTICS[region];
  const baseTemp = characteristics.altitude === 'high' ? 20 :
                   characteristics.altitude === 'medium' ? 24 : 28;

  // Add daily variation (warmer mid-month, cooler at ends)
  const dailyVariation = Math.sin((dayIndex / 30) * Math.PI) * 3;

  // Add random variation
  const randomVariation = randomInRange(-2, 2);

  return Math.round((baseTemp + dailyVariation + randomVariation) * 10) / 10;
}

/**
 * Get rainfall based on day (simulating rainy season)
 */
function getRainfall(dayIndex: number): number {
  // Simulate rainy season: more rain in middle of period
  const seasonalFactor = Math.sin((dayIndex / 30) * Math.PI);

  // Base rainfall increases through the period
  const baseRainfall = 40 + (dayIndex / 30) * 60;

  // Apply seasonal factor and random variation
  const rainfall = baseRainfall * (0.5 + seasonalFactor * 0.5) + randomInRange(-15, 15);

  return Math.max(10, Math.round(rainfall * 10) / 10);
}

/**
 * Get soil moisture based on rainfall (with lag effect)
 */
function getSoilMoisture(rainfall: number, previousMoisture: number): number {
  // Soil moisture increases with rain but has memory from previous days
  const rainfallEffect = (rainfall / 150) * 40; // Up to 40% from rainfall
  const carryOver = previousMoisture * 0.6; // 60% of previous moisture remains

  const newMoisture = carryOver + rainfallEffect + randomInRange(-5, 5);

  // Clamp between 20% and 85%
  return Math.max(20, Math.min(85, Math.round(newMoisture * 10) / 10));
}

/**
 * Get crop yield based on conditions
 */
function getCropYield(
  crop: string,
  region: string,
  rainfall: number,
  temperature: number,
  soilMoisture: number
): number {
  const baseYield = BASELINE_YIELDS[crop as keyof typeof BASELINE_YIELDS];
  const characteristics = REGION_CHARACTERISTICS[region];

  let yieldMultiplier = 1.0;

  // Coffee grows best in high altitude, moderate conditions
  if (crop === 'coffee') {
    if (characteristics.altitude === 'high') {
      yieldMultiplier *= 1.15;
    } else if (characteristics.altitude === 'low') {
      yieldMultiplier *= 0.85;
    }

    // Coffee likes 50-150mm rainfall
    if (rainfall < 50) yieldMultiplier *= (0.7 + (rainfall / 50) * 0.3);
    if (rainfall > 150) yieldMultiplier *= (1.0 - (rainfall - 150) / 200);

    // Coffee likes 18-25°C
    if (temperature < 18) yieldMultiplier *= 0.8;
    if (temperature > 26) yieldMultiplier *= 0.9;
  }

  // Sugar cane grows best in low altitude, hot and wet
  if (crop === 'sugar_cane') {
    if (characteristics.altitude === 'low') {
      yieldMultiplier *= 1.1;
    } else if (characteristics.altitude === 'high') {
      yieldMultiplier *= 0.9;
    }

    // Sugar cane likes 80-200mm rainfall
    if (rainfall < 80) yieldMultiplier *= (0.75 + (rainfall / 80) * 0.25);
    if (rainfall > 80 && rainfall < 200) yieldMultiplier *= 1.05;

    // Sugar cane likes 24-30°C
    if (temperature > 24 && temperature < 30) yieldMultiplier *= 1.05;
    if (temperature < 20) yieldMultiplier *= 0.85;
  }

  // Corn is adaptable but needs moderate conditions
  if (crop === 'corn') {
    // Corn likes 40-120mm rainfall
    if (rainfall < 40) yieldMultiplier *= 0.7;
    if (rainfall > 120) yieldMultiplier *= 0.9;

    // Corn likes 18-28°C
    if (temperature > 28) yieldMultiplier *= 0.9;
  }

  // Beans are similar to corn
  if (crop === 'beans') {
    // Beans like 30-100mm rainfall
    if (rainfall < 30) yieldMultiplier *= 0.65;
    if (rainfall > 100) yieldMultiplier *= 0.85;

    // Beans like 20-26°C
    if (temperature < 20 || temperature > 26) yieldMultiplier *= 0.9;
  }

  // Soil moisture effect (all crops benefit from good soil moisture)
  if (soilMoisture < 35) yieldMultiplier *= 0.85;
  if (soilMoisture > 60) yieldMultiplier *= 1.05;

  // Add random variation (±10%)
  const randomFactor = randomInRange(0.9, 1.1);

  const finalYield = baseYield * yieldMultiplier * randomFactor;

  return Math.round(finalYield);
}

/**
 * Generate date string for day offset
 */
function getDateString(dayOffset: number): string {
  const startDate = new Date('2024-09-16');
  const currentDate = new Date(startDate);
  currentDate.setDate(startDate.getDate() + dayOffset);

  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Main function to generate data
 */
function generateAgricultureData(): string {
  const rows: string[] = [];

  // Header
  rows.push('date,region_name,crop_type,yield_kg_per_hectare,rainfall_mm,temperature_avg_c,soil_moisture_pct');

  // Track soil moisture by region (has memory across days)
  const soilMoistureByRegion = new Map<string, number>();
  REGIONS.forEach(region => soilMoistureByRegion.set(region, 50)); // Start at 50%

  // Generate data for 30 days
  for (let day = 0; day < 30; day++) {
    const date = getDateString(day);
    const rainfall = getRainfall(day);

    // Generate data for each region
    for (const region of REGIONS) {
      const temperature = getTemperature(region, day);
      const previousMoisture = soilMoistureByRegion.get(region) || 50;
      const soilMoisture = getSoilMoisture(rainfall, previousMoisture);
      soilMoistureByRegion.set(region, soilMoisture);

      // Generate data for each crop
      for (const crop of CROPS) {
        const yield_kg = getCropYield(crop, region, rainfall, temperature, soilMoisture);

        rows.push(
          `${date},${region},${crop},${yield_kg},${rainfall},${temperature},${soilMoisture}`
        );
      }
    }
  }

  return rows.join('\n');
}

/**
 * Write CSV to file
 */
function writeCsvFile() {
  const csvData = generateAgricultureData();
  const outputDir = path.join(__dirname, '..', 'public', 'sample_data');
  const outputFile = path.join(outputDir, 'agriculture_sample.csv');

  // Create directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write file
  fs.writeFileSync(outputFile, csvData, 'utf-8');

  // Count rows
  const rowCount = csvData.split('\n').length - 1; // Exclude header

  console.log(`✅ Generated agriculture sample data:`);
  console.log(`   File: ${outputFile}`);
  console.log(`   Rows: ${rowCount} (30 days × 14 regions × 4 crops)`);
  console.log(`   Size: ${Math.round(csvData.length / 1024)} KB`);
}

// Run if executed directly
if (require.main === module) {
  writeCsvFile();
}

export { generateAgricultureData, writeCsvFile };
