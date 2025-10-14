# WorldSim Setup Guide

Quick start guide to get WorldSim running locally.

## Prerequisites

- Node.js 20+
- Supabase account
- Mapbox account (for map visualization)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Your `.env.local` file is already configured with Supabase credentials. You just need to add your Mapbox token:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

**Get a Mapbox token:**
1. Go to https://www.mapbox.com
2. Sign up for a free account
3. Create an access token with default public scopes
4. Copy the token and paste it in `.env.local`

### 3. Set Up Supabase Database

Go to your Supabase project's SQL Editor and run the following SQL:

```sql
-- Enable PostGIS extension for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Regions table (El Salvador departments and municipalities)
CREATE TABLE regions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_es TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('department', 'municipality')),
  parent_id TEXT REFERENCES regions(id),
  geometry GEOMETRY(Geometry, 4326),
  population INTEGER,
  area_km2 DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simulations table
CREATE TABLE simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  parameters JSONB NOT NULL,
  results JSONB,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Energy data table
CREATE TABLE energy_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID REFERENCES simulations(id),
  region_id TEXT REFERENCES regions(id),
  date DATE NOT NULL,
  demand_kwh DECIMAL NOT NULL,
  solar_generation_kwh DECIMAL NOT NULL,
  grid_generation_kwh DECIMAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Climate data table
CREATE TABLE climate_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id TEXT REFERENCES regions(id),
  date DATE NOT NULL,
  rainfall_mm DECIMAL NOT NULL,
  temperature_c DECIMAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_energy_data_region ON energy_data(region_id);
CREATE INDEX idx_energy_data_date ON energy_data(date);
CREATE INDEX idx_climate_data_region ON climate_data(region_id);
CREATE INDEX idx_climate_data_date ON climate_data(date);
CREATE INDEX idx_simulations_status ON simulations(status);
```

### 4. Seed Regions Data

Run the seed script to populate the regions table with El Salvador's 14 departments:

```bash
npm run seed
```

You should see output like:

```
🌱 Starting regions seed script...
✅ Environment variables loaded
✅ Loaded 14 regions from regions.json
📝 Starting region upserts...
✅ San Salvador (SS) - Successfully upserted
✅ La Libertad (LI) - Successfully upserted
...
🎉 All regions seeded successfully!
```

### 5. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Troubleshooting

### Map Not Loading

- Verify `NEXT_PUBLIC_MAPBOX_TOKEN` is set in `.env.local`
- Check that the token has public scopes enabled
- Check browser console for errors

### Database Connection Errors

- Confirm Supabase URL and keys are correct in `.env.local`
- Verify you ran the SQL schema creation script
- Check Supabase dashboard for connection status

### Seed Script Fails

If you see `"Could not find the table 'public.regions'"`:
- Run the database schema SQL (Step 3) first
- Ensure PostGIS extension is enabled

### Port Already in Use

If port 3000 is in use:
```bash
npm run dev -- -p 3001
```

## Verify Setup

Once everything is running, you should see:

1. **Map loads** - Interactive map with El Salvador's 14 departments
2. **Regions are clickable** - Click on a department to select it
3. **Control panel works** - Adjust parameters and run simulations
4. **Charts render** - After running a simulation, charts should display

## Next Steps

- Explore the demo page at http://localhost:3000/demo
- Try running a simulation for San Salvador
- Upload sample CSV data (energy or climate)
- Generate AI explanations (requires API keys)

## Common Issues

**Q: I see "Mapbox token not configured"**
A: Add your Mapbox token to `.env.local` under `NEXT_PUBLIC_MAPBOX_TOKEN`

**Q: Simulations aren't saving to database**
A: Verify the `simulations` table was created in Step 3

**Q: AI explanations don't work**
A: Ensure `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` is set in `.env.local`

---

Need help? Check the main [README.md](./README.md) for detailed documentation.
