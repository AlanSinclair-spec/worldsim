-- WorldSim Database Schema
-- Run this in your Supabase SQL Editor to create all required tables

-- Enable PostGIS extension for geographic data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Regions table (departments and municipalities of El Salvador)
CREATE TABLE IF NOT EXISTS regions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_es TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('department', 'municipality')),
  parent_id TEXT REFERENCES regions(id),
  geometry GEOMETRY(Geometry, 4326), -- PostGIS geometry (Polygon or Point)
  population INTEGER,
  area_km2 DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Energy daily data table
CREATE TABLE IF NOT EXISTS energy_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id TEXT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  demand_kwh DECIMAL(15, 2) NOT NULL,
  solar_kwh DECIMAL(15, 2) DEFAULT 0,
  grid_kwh DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(region_id, date)
);

-- Rainfall daily data table
CREATE TABLE IF NOT EXISTS rain_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id TEXT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  rainfall_mm DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(region_id, date)
);

-- Agriculture daily data table
CREATE TABLE IF NOT EXISTS agriculture_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id TEXT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  crop_type TEXT NOT NULL CHECK (crop_type IN ('coffee', 'sugar_cane', 'corn', 'beans')),
  yield_kg_per_hectare DECIMAL(10, 2) NOT NULL,
  rainfall_mm DECIMAL(10, 2) NOT NULL,
  temperature_avg_c DECIMAL(5, 2) NOT NULL,
  soil_moisture_pct DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(region_id, date, crop_type)
);

-- Simulation runs table
CREATE TABLE IF NOT EXISTS runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario JSONB NOT NULL,
  results JSONB,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_energy_daily_region_date ON energy_daily(region_id, date);
CREATE INDEX IF NOT EXISTS idx_rain_daily_region_date ON rain_daily(region_id, date);
CREATE INDEX IF NOT EXISTS idx_agriculture_region_crop ON agriculture_daily(region_id, crop_type, date);
CREATE INDEX IF NOT EXISTS idx_runs_created_at ON runs(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE rain_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE agriculture_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access (adjust based on your security needs)
-- For development, we'll allow all operations with anon key

-- Regions policies
CREATE POLICY "Allow public read access to regions"
  ON regions FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to regions"
  ON regions FOR INSERT
  WITH CHECK (true);

-- Energy daily policies
CREATE POLICY "Allow public read access to energy_daily"
  ON energy_daily FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to energy_daily"
  ON energy_daily FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to energy_daily"
  ON energy_daily FOR UPDATE
  USING (true);

-- Rain daily policies
CREATE POLICY "Allow public read access to rain_daily"
  ON rain_daily FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to rain_daily"
  ON rain_daily FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to rain_daily"
  ON rain_daily FOR UPDATE
  USING (true);

-- Agriculture daily policies
CREATE POLICY "Allow public read access to agriculture_daily"
  ON agriculture_daily FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to agriculture_daily"
  ON agriculture_daily FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to agriculture_daily"
  ON agriculture_daily FOR UPDATE
  USING (true);

-- Runs policies
CREATE POLICY "Allow public read access to runs"
  ON runs FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to runs"
  ON runs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to runs"
  ON runs FOR UPDATE
  USING (true);

-- Grant permissions
GRANT ALL ON regions TO anon, authenticated;
GRANT ALL ON energy_daily TO anon, authenticated;
GRANT ALL ON rain_daily TO anon, authenticated;
GRANT ALL ON agriculture_daily TO anon, authenticated;
GRANT ALL ON runs TO anon, authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database schema created successfully!';
  RAISE NOTICE 'Tables created: regions, energy_daily, rain_daily, agriculture_daily, runs';
  RAISE NOTICE 'Next step: Run npm run seed to populate regions table';
END $$;
