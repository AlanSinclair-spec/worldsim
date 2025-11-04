-- Migration: Add baseline data tracking columns
-- Purpose: Track whether data is baseline (public) or custom (user-uploaded)
-- Run this in your Supabase SQL Editor

-- Add is_baseline column to energy_daily
ALTER TABLE energy_daily
ADD COLUMN IF NOT EXISTS is_baseline BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'user_upload'
  CHECK (data_source IN ('baseline', 'user_upload', 'admin_update'));

-- Add is_baseline column to rain_daily
ALTER TABLE rain_daily
ADD COLUMN IF NOT EXISTS is_baseline BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'user_upload'
  CHECK (data_source IN ('baseline', 'user_upload', 'admin_update'));

-- Add is_baseline column to agriculture_daily
ALTER TABLE agriculture_daily
ADD COLUMN IF NOT EXISTS is_baseline BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'user_upload'
  CHECK (data_source IN ('baseline', 'user_upload', 'admin_update'));

-- Create indexes for fast baseline data queries
CREATE INDEX IF NOT EXISTS idx_energy_daily_baseline ON energy_daily(is_baseline, date);
CREATE INDEX IF NOT EXISTS idx_rain_daily_baseline ON rain_daily(is_baseline, date);
CREATE INDEX IF NOT EXISTS idx_agriculture_baseline ON agriculture_daily(is_baseline, date);

-- Add comment to document the columns
COMMENT ON COLUMN energy_daily.is_baseline IS 'True if this is public baseline data, false if user-uploaded';
COMMENT ON COLUMN energy_daily.data_source IS 'Source of data: baseline (public), user_upload (CSV), admin_update (admin tool)';
COMMENT ON COLUMN rain_daily.is_baseline IS 'True if this is public baseline data, false if user-uploaded';
COMMENT ON COLUMN rain_daily.data_source IS 'Source of data: baseline (public), user_upload (CSV), admin_update (admin tool)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration 001 completed successfully!';
  RAISE NOTICE 'Added columns: is_baseline, data_source to energy_daily, rain_daily, agriculture_daily';
  RAISE NOTICE 'Created indexes for fast baseline queries';
  RAISE NOTICE 'Next step: Run npm run seed:baseline to populate baseline data';
END $$;
