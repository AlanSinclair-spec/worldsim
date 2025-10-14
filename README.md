# WorldSim - El Salvador Digital Twin

WorldSim is a digital twin simulation platform for El Salvador enabling government agencies, universities, NGOs, and enterprises to model infrastructure, energy, climate, and economic scenarios.

**Mission**: Test the future before living it.

## Features

- **Energy Modeling**: Simulate solar growth, energy demand, and grid capacity
- **Climate Impact Analysis**: Model rainfall changes and temperature trends
- **Interactive Maps**: Visualize data across El Salvador's 14 departments using Mapbox
- **Data Upload**: Import real CSV data for energy, climate, and infrastructure
- **Visual Analytics**: Generate interactive charts using Chart.js
- **AI Explanations**: Get bilingual (EN/ES) summaries powered by OpenAI and Anthropic Claude

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript 5.3+ (strict mode)
- React 18.2+ (functional components, hooks)
- Tailwind CSS 3.4+
- Mapbox GL JS
- Chart.js with react-chartjs-2
- React Query

### Backend
- Node.js 20+
- Next.js API Routes
- Supabase (PostgreSQL 15 + PostGIS)
- RESTful API design

### AI & External Services
- OpenAI API (GPT-4)
- Anthropic API (Claude)
- Mapbox API

### Deployment
- Vercel (hosting)
- Supabase Cloud (database)

## Prerequisites

- Node.js 20+ and npm
- Supabase account
- Mapbox account
- OpenAI API key (optional, for AI explanations)
- Anthropic API key (optional, for AI explanations)

## Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd worldsim
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Mapbox Configuration
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI API Configuration (optional)
OPENAI_API_KEY=your_openai_api_key_here

# Anthropic API Configuration (optional)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 4. Set Up Supabase Database

#### Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the database to initialize

#### Run Database Migrations

Create the following tables in your Supabase SQL Editor:

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
  geometry GEOMETRY(Point, 4326),
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

-- Insert El Salvador departments
INSERT INTO regions (id, name, name_es, type, geometry, population, area_km2) VALUES
  ('AH', 'Ahuachapán', 'Ahuachapán', 'department', ST_SetSRID(ST_MakePoint(-89.845, 13.921), 4326), 319503, 1239.6),
  ('CA', 'Cabañas', 'Cabañas', 'department', ST_SetSRID(ST_MakePoint(-88.741, 13.863), 4326), 149326, 1103.5),
  ('CH', 'Chalatenango', 'Chalatenango', 'department', ST_SetSRID(ST_MakePoint(-88.935, 14.033), 4326), 192788, 2016.6),
  ('CU', 'Cuscatlán', 'Cuscatlán', 'department', ST_SetSRID(ST_MakePoint(-89.049, 13.872), 4326), 231480, 756.2),
  ('LI', 'La Libertad', 'La Libertad', 'department', ST_SetSRID(ST_MakePoint(-89.322, 13.688), 4326), 660652, 1652.9),
  ('LP', 'La Paz', 'La Paz', 'department', ST_SetSRID(ST_MakePoint(-89.090, 13.502), 4326), 308087, 1223.6),
  ('LU', 'La Unión', 'La Unión', 'department', ST_SetSRID(ST_MakePoint(-87.844, 13.337), 4326), 238217, 2074.3),
  ('MO', 'Morazán', 'Morazán', 'department', ST_SetSRID(ST_MakePoint(-88.127, 13.769), 4326), 174406, 1447.4),
  ('SA', 'Santa Ana', 'Santa Ana', 'department', ST_SetSRID(ST_MakePoint(-89.559, 14.008), 4326), 523655, 2023.2),
  ('SM', 'San Miguel', 'San Miguel', 'department', ST_SetSRID(ST_MakePoint(-88.177, 13.483), 4326), 434003, 2077.1),
  ('SO', 'Sonsonate', 'Sonsonate', 'department', ST_SetSRID(ST_MakePoint(-89.724, 13.719), 4326), 438960, 1225.9),
  ('SS', 'San Salvador', 'San Salvador', 'department', ST_SetSRID(ST_MakePoint(-89.187, 13.699), 4326), 1740336, 886.2),
  ('SV', 'San Vicente', 'San Vicente', 'department', ST_SetSRID(ST_MakePoint(-88.783, 13.639), 4326), 161645, 1184.0),
  ('US', 'Usulután', 'Usulután', 'department', ST_SetSRID(ST_MakePoint(-88.435, 13.345), 4326), 344235, 2130.4);
```

### 5. Get API Keys

#### Mapbox
1. Go to [mapbox.com](https://www.mapbox.com)
2. Sign up for a free account
3. Create an access token with default public scopes
4. Copy the token to `NEXT_PUBLIC_MAPBOX_TOKEN`

#### OpenAI (Optional)
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an account and add billing
3. Generate an API key
4. Copy to `OPENAI_API_KEY`

#### Anthropic (Optional)
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an account
3. Generate an API key
4. Copy to `ANTHROPIC_API_KEY`

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Running a Simulation

1. **Select Region**: Click on a department marker on the map or use the dropdown
2. **Set Parameters**:
   - Date range (start and end dates)
   - Solar growth rate (annual percentage)
   - Demand growth rate (annual percentage)
   - Rainfall change (percentage)
   - Infrastructure capacity (MW)
3. **Run Simulation**: Click "Run Simulation" button
4. **View Results**: See summary statistics, charts, and AI-generated insights

### Uploading Data

1. Navigate to the "Upload Data" tab
2. Select data type (Energy, Climate, or Infrastructure)
3. Choose the region
4. Upload a CSV file matching the expected format:
   - **Energy**: `date, demand_kwh, solar_generation_kwh, grid_generation_kwh`
   - **Climate**: `date, rainfall_mm, temperature_c`
   - **Infrastructure**: `name, type, capacity_mw, latitude, longitude`

### Getting AI Explanations

1. Run a simulation first
2. Click "Get AI Explanation" in the Results panel
3. Choose language (English or Spanish)
4. Wait for the AI-generated summary

## Project Structure

```
worldsim/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/               # API routes
│   │   │   ├── ingest/        # CSV upload endpoint
│   │   │   ├── simulate/      # Simulation endpoint
│   │   │   └── explain/       # AI explanation endpoint
│   │   ├── demo/              # Demo page
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── MapView.tsx
│   │   ├── ControlPanel.tsx
│   │   ├── UploadPanel.tsx
│   │   ├── ResultsPanel.tsx
│   │   └── Charts.tsx
│   ├── lib/                   # Business logic
│   │   ├── supabase.ts        # Database client
│   │   ├── model.ts           # Simulation models
│   │   └── regions.ts         # Region utilities
│   └── types/                 # TypeScript types
│       └── index.ts
├── public/
│   └── regions.json           # GeoJSON data
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── README.md
```

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
npm test             # Run tests (when implemented)
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_MAPBOX_TOKEN`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY` (optional)
   - `ANTHROPIC_API_KEY` (optional)
5. Deploy

Vercel will auto-deploy on every push to your main branch.

## API Reference

### POST /api/simulate

Run a simulation.

**Request Body:**
```json
{
  "regionId": "SS",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "solarGrowthRate": 10,
  "demandGrowthRate": 5,
  "rainfallChange": 0,
  "infrastructureCapacity": 100
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "simulation": { ... },
    "simulationId": "uuid"
  }
}
```

### POST /api/ingest

Upload CSV data.

**Request:** `multipart/form-data`
- `file`: CSV file
- `dataType`: "energy" | "climate" | "infrastructure"
- `regionId`: Region ID

**Response:**
```json
{
  "success": true,
  "data": {
    "recordsImported": 100
  }
}
```

### POST /api/explain

Get AI explanation.

**Request Body:**
```json
{
  "simulationId": "uuid",
  "language": "en",
  "provider": "openai"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "explanation": "...",
    "language": "en",
    "provider": "openai"
  }
}
```

## Troubleshooting

### Map Not Loading
- Verify `NEXT_PUBLIC_MAPBOX_TOKEN` is set correctly
- Check browser console for errors
- Ensure Mapbox token has correct permissions

### Database Errors
- Confirm Supabase URL and keys are correct
- Verify tables were created successfully
- Check Supabase dashboard for error logs

### Simulation Fails
- Ensure date range is valid
- Check that growth rates are within bounds (-100% to 1000%)
- Verify region ID exists in database

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Code Conventions

- **TypeScript strict mode** - No implicit any
- **Functional components only** - No class components
- **Named exports** - Prefer named over default exports
- **ESLint** - Follow ESLint rules
- See `CLAUDE.md` for detailed conventions

## License

Copyright © 2024 WorldSim Team. All rights reserved.

## Support

For questions or issues:
- Create an issue on GitHub
- Email: support@worldsim.sv (example)

---

**Built with** ❤️ **for El Salvador**
