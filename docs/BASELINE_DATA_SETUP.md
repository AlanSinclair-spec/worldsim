# Baseline Data System - Setup Guide

## Overview

WorldSim now includes a **baseline data system** that pre-loads El Salvador's public infrastructure data. This enables:

✅ **Instant demos** - Government users see results in 10 seconds without uploads
✅ **Accurate simulations** - Based on realistic El Salvador energy & rainfall patterns
✅ **Optional custom data** - Users can still upload their own proprietary data
✅ **Automatic fallback** - System uses baseline if no custom data exists

---

## Quick Start

### 1. Run Database Migration

The baseline system requires new columns in your database tables.

**In your Supabase SQL Editor**, run:

```sql
-- Copy and paste from: scripts/migrations/001_add_baseline_tracking.sql
```

OR if you're setting up a fresh database, the columns are already included in:
```sql
-- scripts/create-tables.sql
```

### 2. Generate Baseline Data Files

Generate 30 days of realistic El Salvador data:

```bash
npm run generate:baseline
```

This creates:
- `public/baseline_data/el_salvador_energy_baseline.csv` (420 rows)
- `public/baseline_data/el_salvador_rainfall_baseline.csv` (420 rows)

### 3. Seed Database with Baseline Data

```bash
npm run seed:baseline
```

**Expected Output:**
```
🌎 WorldSim Baseline Data Seeder
================================

📊 Seeding energy baseline data...
   Found 420 rows to insert
   Mapped 14/14 regions
   ✓ Cleared existing baseline data
   ✅ Inserted 420 energy records

🌧️  Seeding rainfall baseline data...
   Found 420 rows to insert
   Mapped 14/14 regions
   ✓ Cleared existing baseline data
   ✅ Inserted 420 rainfall records

🔍 Verifying baseline data...
   Energy baseline records: 420
   Rainfall baseline records: 420

✨ Baseline data seeded successfully!

📌 Next steps:
   1. Visit http://localhost:3000/interactive
   2. Page will auto-load baseline data
   3. Results will appear within 10 seconds
```

### 4. Test the System

Visit [http://localhost:3000/interactive](http://localhost:3000/interactive)

**What you should see:**
1. Map loads with infrastructure stress visualization immediately
2. Simulation runs automatically using baseline data
3. Results appear within 10 seconds
4. AI recommendations generated automatically

---

## How It Works

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│ User visits /interactive                                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ System checks: Is custom data uploaded?                 │
└─────────────────────────────────────────────────────────┘
                 ↙                    ↘
         YES (Custom Data)      NO (No Upload)
                 ↓                     ↓
         ┌──────────────┐      ┌───────────────┐
         │ Use Custom   │      │ Use Baseline  │
         │ Data         │      │ Data          │
         └──────────────┘      └───────────────┘
                 ↓                     ↓
         ┌────────────────────────────────┐
         │ Run Simulation                 │
         │ (model.ts with fallback logic) │
         └────────────────────────────────┘
                          ↓
         ┌────────────────────────────────┐
         │ Display Results & AI Analysis  │
         └────────────────────────────────┘
```

### Database Schema

**New Columns Added:**

```sql
-- energy_daily table
is_baseline BOOLEAN DEFAULT false
data_source TEXT CHECK (data_source IN ('baseline', 'user_upload', 'admin_update'))

-- rain_daily table
is_baseline BOOLEAN DEFAULT false
data_source TEXT CHECK (data_source IN ('baseline', 'user_upload', 'admin_update'))

-- agriculture_daily table
is_baseline BOOLEAN DEFAULT false
data_source TEXT CHECK (data_source IN ('baseline', 'user_upload', 'admin_update'))
```

**Indexes Created:**
```sql
CREATE INDEX idx_energy_daily_baseline ON energy_daily(is_baseline, date);
CREATE INDEX idx_rain_daily_baseline ON rain_daily(is_baseline, date);
CREATE INDEX idx_agriculture_baseline ON agriculture_daily(is_baseline, date);
```

### Code Components

**1. Baseline Data Helper** (`src/lib/baseline.ts`)
- `checkBaselineData()` - Check if baseline data exists
- `getBaselineSummary()` - Get date range and stats
- `hasCustomData()` - Check for user-uploaded data

**2. Model with Fallback** (`src/lib/model.ts`)
- Lines 195-223: Energy data fallback logic
- Lines 241-268: Rainfall data fallback logic
- Tries custom data first, falls back to baseline

**3. Seed Script** (`scripts/seed-baseline-data.ts`)
- Reads CSV files from `public/baseline_data/`
- Maps region names to region IDs
- Inserts with `is_baseline=true` and `data_source='baseline'`
- Uses UPSERT to avoid duplicates

**4. Generation Script** (`scripts/generate-baseline-data.ts`)
- Generates realistic 30-day data for all 14 departments
- Energy: 1,600-7,000 kWh (moderate stress levels)
- Rainfall: 0-9mm with wet/dry cycles
- Accounts for weekends (lower demand)
- Accounts for regional differences

---

## Baseline Data Details

### Energy Demand Values

| Department | Base Energy (kWh) | Purpose |
|------------|-------------------|---------|
| San Salvador | 6,000 | Capital city, highest demand |
| Santa Ana | 4,200 | 2nd largest |
| San Miguel | 3,800 | 3rd largest |
| La Libertad | 3,600 | Port city |
| Sonsonate | 2,800 | Western region |
| Others | 1,600-2,600 | Scaled by population |

**Variations:**
- ±8% daily random variation
- 5-10% lower on weekends
- Slight upward trend over 30 days (simulate growth)

**Target Stress Levels:** 40-55% (actionable recommendations)

### Rainfall Patterns

| Department | Base Rainfall (mm) | Characteristics |
|------------|-------------------|-----------------|
| Ahuachapán | 5.2 | Western, highest rainfall |
| Sonsonate | 4.5 | Western region |
| Chalatenango | 3.8 | Northern highlands |
| San Salvador | 2.5 | Central valley |
| La Unión | 1.5 | Eastern, driest |

**Patterns:**
- 10-day wet/dry cycles
- 30% chance of no rain
- 30% chance of light rain (30% of base)
- 25% chance of normal rain
- 15% chance of heavy rain (180% of base)

---

## Updating Baseline Data

### Option 1: Admin Script (Coming Soon)

```bash
npm run update:baseline -- --energy=new_energy.csv --rainfall=new_rainfall.csv
```

### Option 2: Manual Update

1. Edit CSV files in `public/baseline_data/`
2. Regenerate if needed: `npm run generate:baseline`
3. Re-run seed script: `npm run seed:baseline`

### Option 3: Direct SQL (Advanced)

```sql
-- Delete old baseline
DELETE FROM energy_daily WHERE is_baseline = true;
DELETE FROM rain_daily WHERE is_baseline = true;

-- Then run: npm run seed:baseline
```

---

## Troubleshooting

### Error: "column is_baseline does not exist"

**Solution:** Run the migration first
```sql
-- Run scripts/migrations/001_add_baseline_tracking.sql in Supabase SQL Editor
```

### Error: "No regions found in database"

**Solution:** Seed regions first
```bash
npm run seed
```

### Error: "Region 'San Salvador' not found"

**Solution:** Check region naming in `regions` table
```sql
SELECT id, name FROM regions;
```

Ensure names match exactly (case-sensitive):
- San Salvador (not "San salvador")
- La Libertad (not "La libertad")
- etc.

### Baseline data seeded but simulation shows "No data"

**Check 1:** Verify baseline data exists
```sql
SELECT COUNT(*) FROM energy_daily WHERE is_baseline = true;
SELECT COUNT(*) FROM rain_daily WHERE is_baseline = true;
```

**Check 2:** Check date range
```sql
SELECT MIN(date), MAX(date) FROM energy_daily WHERE is_baseline = true;
```

**Check 3:** View logs
```bash
npm run dev
# Check console for:
# "Using baseline energy data"
# "Using baseline rainfall data"
```

### Simulation uses baseline but should use custom data

**Check:** Verify your uploaded data has `is_baseline = false`
```sql
SELECT COUNT(*), is_baseline FROM energy_daily GROUP BY is_baseline;
```

If your custom data has `is_baseline = true`, update it:
```sql
UPDATE energy_daily
SET is_baseline = false, data_source = 'user_upload'
WHERE created_at > '2024-11-01'  -- Your upload date
AND data_source = 'user_upload';
```

---

## Data Source Priority

The system follows this priority order:

1. **Custom Data** (is_baseline = false) - User-uploaded CSVs
2. **Baseline Data** (is_baseline = true) - Public El Salvador data
3. **Error** - No data available for date range

---

## Performance Considerations

### Query Optimization

Baseline queries are optimized with indexes:

```sql
-- Fast lookup for baseline data
CREATE INDEX idx_energy_daily_baseline ON energy_daily(is_baseline, date);

-- Query plan should use index:
EXPLAIN SELECT * FROM energy_daily WHERE is_baseline = true;
```

### Caching

API responses are cached for 1 hour:
```typescript
headers: {
  'Cache-Control': 'private, max-age=3600'
}
```

---

## Production Deployment

### Vercel Deployment

1. **Migrate Database** (one-time)
   ```sql
   -- Run in Supabase production SQL Editor
   scripts/migrations/001_add_baseline_tracking.sql
   ```

2. **Seed Baseline Data** (one-time)
   ```bash
   # Set production environment variables
   export NEXT_PUBLIC_SUPABASE_URL=<prod-url>
   export NEXT_PUBLIC_SUPABASE_ANON_KEY=<prod-key>

   npm run seed:baseline
   ```

3. **Deploy Code**
   ```bash
   git push origin main
   # Vercel auto-deploys
   ```

4. **Verify**
   - Visit https://your-app.vercel.app/interactive
   - Should see instant results with baseline data

---

## Security Considerations

### Row Level Security (RLS)

Baseline data is read-only for end users:

```sql
-- In Supabase, RLS policies allow:
- SELECT (read): Everyone
- INSERT/UPDATE/DELETE: Only service role or authenticated admins
```

### Admin Updates

For security, baseline updates require:
1. Direct database access (Supabase dashboard), OR
2. Server-side API with authentication, OR
3. Admin CLI with environment variable check

---

## Future Enhancements

- [ ] Web-based admin panel for updating baseline
- [ ] Baseline data versioning (track updates over time)
- [ ] Multiple baseline scenarios (optimistic, pessimistic, realistic)
- [ ] Baseline data for other countries (Honduras, Guatemala)
- [ ] Automated baseline updates from public APIs
- [ ] Historical baseline data (2020-2024)

---

## FAQ

**Q: Can users override baseline data?**
A: Yes! Uploading a CSV automatically uses custom data instead of baseline.

**Q: How often should baseline data be updated?**
A: Quarterly or when new government data is published.

**Q: Can I have multiple baselines?**
A: Not currently. Future enhancement would add baseline versioning.

**Q: Does baseline data work offline?**
A: No, it requires database connection. But it's cached in the browser after first load.

**Q: What if baseline data becomes outdated?**
A: Update CSV files and re-run `npm run seed:baseline`. Old baseline is replaced.

---

## Support

For issues or questions:
1. Check logs: `npm run dev` and inspect console
2. Verify database: Run SQL queries above
3. File issue: https://github.com/your-org/worldsim/issues

---

**Last Updated:** 2025-11-03
**Version:** 1.0.0 (Initial baseline system)
