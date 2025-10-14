#!/usr/bin/env tsx

/**
 * Seed script for populating the regions table in Supabase
 *
 * Usage: npm run seed
 *
 * This script:
 * 1. Reads regions data from public/regions.json
 * 2. Connects to Supabase using credentials from .env.local
 * 3. Upserts each region into the regions table
 * 4. Logs success/failure for each region
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

interface RegionFeature {
  type: 'Feature';
  properties: {
    id: string;
    name: string;
    nameEs: string;
    type: string;
    population: number;
    areaKm2: number;
  };
  geometry: {
    type: string;
    coordinates: number[][][] | number[];
  };
}

interface RegionsGeoJSON {
  type: 'FeatureCollection';
  features: RegionFeature[];
}

/**
 * Main seed function
 */
async function seedRegions() {
  console.log('🌱 Starting regions seed script...\n');

  // Validate environment variables
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing Supabase credentials');
    console.error('Please ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in .env.local');
    process.exit(1);
  }

  console.log('✅ Environment variables loaded');
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`);

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read regions.json
  let regionsData: RegionsGeoJSON;
  try {
    const regionsPath = resolve(__dirname, '../public/regions.json');
    const regionsFile = readFileSync(regionsPath, 'utf-8');
    regionsData = JSON.parse(regionsFile);
    console.log(`✅ Loaded ${regionsData.features.length} regions from regions.json\n`);
  } catch (error) {
    console.error('❌ Error reading regions.json:', error);
    process.exit(1);
  }

  // Process each region
  let successCount = 0;
  let errorCount = 0;

  console.log('📝 Starting region upserts...\n');

  for (const feature of regionsData.features) {
    const { id, name, nameEs, type, population, areaKm2 } = feature.properties;
    const geometry = feature.geometry;

    try {
      // Convert GeoJSON geometry to WKT format for PostGIS
      let geometryWKT: string;

      if (geometry.type === 'Polygon') {
        const coords = geometry.coordinates as number[][][];
        const polygonCoords = coords[0]
          .map((coord: number[]) => `${coord[0]} ${coord[1]}`)
          .join(', ');
        geometryWKT = `POLYGON((${polygonCoords}))`;
      } else if (geometry.type === 'Point') {
        const coords = geometry.coordinates as number[];
        geometryWKT = `POINT(${coords[0]} ${coords[1]})`;
      } else {
        throw new Error(`Unsupported geometry type: ${geometry.type}`);
      }

      // Upsert region into database
      const { data, error } = await supabase
        .from('regions')
        .upsert(
          {
            id,
            name,
            name_es: nameEs,
            type,
            population,
            area_km2: areaKm2,
            geometry: `SRID=4326;${geometryWKT}`,
          },
          {
            onConflict: 'id',
          }
        )
        .select();

      if (error) {
        throw error;
      }

      console.log(`✅ ${name} (${id}) - Successfully upserted`);
      successCount++;
    } catch (error) {
      console.error(`❌ ${name} (${id}) - Failed:`, error instanceof Error ? error.message : error);
      errorCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Seed Summary:');
  console.log(`   Total regions: ${regionsData.features.length}`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log('='.repeat(50) + '\n');

  if (errorCount === 0) {
    console.log('🎉 All regions seeded successfully!');
    process.exit(0);
  } else {
    console.error('⚠️  Some regions failed to seed. Please check the errors above.');
    process.exit(1);
  }
}

// Run the seed function
seedRegions().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
