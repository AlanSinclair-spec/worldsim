/**
 * Test Utilities and Mocks
 *
 * Provides mock implementations for external services:
 * - Supabase
 * - OpenAI
 * - Anthropic
 * - Mapbox
 *
 * Also provides test data fixtures and helper functions.
 */

// ============================================================================
// SUPABASE MOCKS
// ============================================================================

export const mockSupabaseClient = {
  from: jest.fn((table: string) => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    // Simulate successful responses
    then: jest.fn((callback) =>
      callback({ data: [], error: null, status: 200, statusText: 'OK' })
    ),
  })),
  auth: {
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
  },
  rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
};

export function createMockSupabaseResponse<T>(data: T, error: any = null) {
  return {
    data,
    error,
    status: error ? 500 : 200,
    statusText: error ? 'Internal Server Error' : 'OK',
  };
}

// ============================================================================
// OPENAI MOCKS
// ============================================================================

export const mockOpenAIResponse = {
  id: 'chatcmpl-test123',
  object: 'chat.completion',
  created: Date.now(),
  model: 'gpt-4',
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: `**SUMMARY**
This simulation shows moderate infrastructure stress across El Salvador's departments.

**KEY INSIGHTS**
• San Salvador department shows highest energy demand (45% above baseline)
• Renewable energy capacity adequate for current projected growth
• Grid infrastructure requires $2.5M investment to prevent failures

**RISKS**
• Peak demand during dry season could exceed grid capacity
• 3 departments at risk of brownouts without infrastructure upgrades
• Drought scenario increases stress by 15% across all regions

**PRIORITY ACTIONS**
1. [CRITICAL] Invest in grid infrastructure for San Salvador within 6 months ($1.5M)
2. [HIGH] Accelerate solar capacity in La Libertad within 12 months ($800K)
3. [MEDIUM] Implement demand response program within 18 months ($200K)`,
      },
      finish_reason: 'stop',
    },
  ],
  usage: {
    prompt_tokens: 500,
    completion_tokens: 200,
    total_tokens: 700,
  },
};

export function createMockOpenAI() {
  return {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue(mockOpenAIResponse),
      },
    },
  };
}

// ============================================================================
// ANTHROPIC MOCKS
// ============================================================================

export const mockAnthropicResponse = {
  id: 'msg_test123',
  type: 'message',
  role: 'assistant',
  content: [
    {
      type: 'text',
      text: 'Based on the simulation results, infrastructure stress is moderate across El Salvador. San Salvador shows highest demand. Recommend grid upgrades within 6 months.',
    },
  ],
  model: 'claude-3-5-sonnet-20241022',
  stop_reason: 'end_turn',
  usage: {
    input_tokens: 500,
    output_tokens: 150,
  },
};

export function createMockAnthropic() {
  return {
    messages: {
      create: jest.fn().mockResolvedValue(mockAnthropicResponse),
    },
  };
}

// ============================================================================
// EL SALVADOR REGION DATA (TEST FIXTURES)
// ============================================================================

export const MOCK_REGIONS = [
  { id: '1', name: 'San Salvador', nameEs: 'San Salvador', population: 1700000, areaKm2: 886 },
  { id: '2', name: 'La Libertad', nameEs: 'La Libertad', population: 700000, areaKm2: 1653 },
  { id: '3', name: 'Santa Ana', nameEs: 'Santa Ana', population: 550000, areaKm2: 2023 },
  { id: '4', name: 'Chalatenango', nameEs: 'Chalatenango', population: 200000, areaKm2: 2017 },
  { id: '5', name: 'Sonsonate', nameEs: 'Sonsonate', population: 450000, areaKm2: 1226 },
  { id: '6', name: 'La Paz', nameEs: 'La Paz', population: 320000, areaKm2: 1224 },
  { id: '7', name: 'Usulutan', nameEs: 'Usulután', population: 350000, areaKm2: 2130 },
  { id: '8', name: 'San Miguel', nameEs: 'San Miguel', population: 480000, areaKm2: 2077 },
  { id: '9', name: 'Morazan', nameEs: 'Morazán', population: 180000, areaKm2: 1447 },
  { id: '10', name: 'La Union', nameEs: 'La Unión', population: 250000, areaKm2: 2074 },
  { id: '11', name: 'Cuscatlan', nameEs: 'Cuscatlán', population: 230000, areaKm2: 756 },
  { id: '12', name: 'Cabañas', nameEs: 'Cabañas', population: 150000, areaKm2: 1104 },
  { id: '13', name: 'Ahuachapan', nameEs: 'Ahuachapán', population: 320000, areaKm2: 1240 },
  { id: '14', name: 'San Vicente', nameEs: 'San Vicente', population: 160000, areaKm2: 1184 },
];

// ============================================================================
// CSV TEST DATA
// ============================================================================

export const MOCK_VALID_CSV_ENERGY = `date,region,demand_kwh
2024-01-01,San Salvador,50000
2024-01-01,La Libertad,30000
2024-01-02,San Salvador,52000
2024-01-02,La Libertad,31000`;

export const MOCK_VALID_CSV_RAINFALL = `date,region,rainfall_mm
2024-01-01,San Salvador,5.2
2024-01-01,La Libertad,8.1
2024-01-02,San Salvador,3.5
2024-01-02,La Libertad,6.3`;

export const MOCK_INVALID_CSV_MISSING_HEADER = `date,region
2024-01-01,San Salvador`;

export const MOCK_INVALID_CSV_BAD_DATE = `date,region,demand_kwh
invalid-date,San Salvador,50000`;

export const MOCK_INVALID_CSV_BAD_REGION = `date,region,demand_kwh
2024-01-01,InvalidRegion,50000`;

export const MOCK_MALICIOUS_CSV_SQL_INJECTION = `date,region,demand_kwh
2024-01-01,'; DROP TABLE regions; --,50000`;

export const MOCK_MALICIOUS_CSV_XSS = `date,region,demand_kwh
2024-01-01,<script>alert('XSS')</script>,50000`;

// ============================================================================
// SIMULATION REQUEST/RESPONSE FIXTURES
// ============================================================================

export const MOCK_ENERGY_SIMULATION_REQUEST = {
  solar_growth_pct: 0.2,
  rainfall_change_pct: -0.15,
  start_date: '2024-01-01',
  end_date: '2024-01-30',
  grid_capacity_mw: 1500,
  battery_storage_mwh: 100,
};

export const MOCK_WATER_SIMULATION_REQUEST = {
  rainfall_reduction_pct: 0.3,
  start_date: '2024-01-01',
  end_date: '2024-01-30',
  conservation_effort_pct: 0.1,
  infrastructure_investment_usd: 5000000,
};

export const MOCK_AGRICULTURE_SIMULATION_REQUEST = {
  crop_type: 'coffee',
  climate_scenario: 'moderate_drought',
  start_date: '2024-01-01',
  end_date: '2024-03-31',
  irrigation_coverage_pct: 0.3,
  adaptation_measures: ['drought_resistant_varieties', 'mulching'],
};

export const MOCK_SIMULATION_RESPONSE = {
  daily_results: [
    {
      date: '2024-01-01',
      total_demand_kwh: 150000,
      renewable_supply_kwh: 80000,
      grid_supply_kwh: 70000,
      stress: 0.35,
      cost_usd: 12000,
      emissions_kg_co2: 45000,
      top_stressed_regions: ['San Salvador', 'La Libertad'],
    },
    {
      date: '2024-01-02',
      total_demand_kwh: 155000,
      renewable_supply_kwh: 82000,
      grid_supply_kwh: 73000,
      stress: 0.38,
      cost_usd: 12500,
      emissions_kg_co2: 46000,
      top_stressed_regions: ['San Salvador', 'Santa Ana'],
    },
  ],
  summary: {
    avg_stress: 0.365,
    max_stress: 0.38,
    total_cost_usd: 24500,
    total_emissions_kg_co2: 91000,
    renewable_pct: 0.52,
    days_critical: 0,
    top_stressed_regions: [
      { name: 'San Salvador', avg_stress: 0.55 },
      { name: 'La Libertad', avg_stress: 0.42 },
    ],
  },
  economic_analysis: {
    total_infrastructure_investment_usd: 2500000,
    annual_operational_cost_usd: 180000,
    roi_5_year: 2.3,
    payback_period_years: 4.2,
    net_present_value_usd: 1200000,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a mock Next.js request object
 */
export function createMockRequest(options: {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  ip?: string;
}) {
  const { method = 'POST', body = {}, headers = {}, ip = '127.0.0.1' } = options;

  return {
    method,
    json: jest.fn().mockResolvedValue(body),
    headers: new Map(Object.entries({
      'content-type': 'application/json',
      ...headers,
    })),
    ip,
    nextUrl: {
      pathname: '/api/test',
    },
  } as any;
}

/**
 * Create a mock Next.js response helper
 */
export function createMockNextResponse() {
  return {
    json: jest.fn((data: any, init?: ResponseInit) => ({
      status: init?.status || 200,
      data,
    })),
  };
}

/**
 * Wait for async operations to complete
 */
export const waitFor = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Simulate rate limit storage
 */
export class MockRateLimitStore extends Map<string, number[]> {
  constructor() {
    super();
  }

  addRequest(key: string) {
    const now = Date.now();
    const requests = this.get(key) || [];
    requests.push(now);
    this.set(key, requests);
  }

  getRequestCount(key: string, windowMs: number) {
    const now = Date.now();
    const requests = this.get(key) || [];
    const recentRequests = requests.filter((timestamp) => now - timestamp < windowMs);
    this.set(key, recentRequests);
    return recentRequests.length;
  }

  clear() {
    super.clear();
  }
}

/**
 * Mock console methods during tests
 */
export function mockConsole() {
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
  };

  beforeEach(() => {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    console.info = jest.fn();
  });

  afterEach(() => {
    Object.assign(console, originalConsole);
  });
}
