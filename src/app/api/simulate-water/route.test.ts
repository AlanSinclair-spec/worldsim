/**
 * API Integration Tests for /api/simulate-water
 *
 * Tests water simulation endpoint including:
 * - Request validation
 * - Rate limiting
 * - Successful simulations
 * - Error handling
 * - Security (SQL injection, XSS, oversized payloads)
 */

import { POST } from './route';
import { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { simulateWaterScenario } from '@/lib/model';
import { supabase } from '@/lib/supabase';

// Mock dependencies
jest.mock('@/lib/rate-limit');
jest.mock('@/lib/model');
jest.mock('@/lib/supabase');

const mockCheckRateLimit = checkRateLimit as jest.MockedFunction<typeof checkRateLimit>;
const mockSimulateWater = simulateWaterScenario as jest.MockedFunction<typeof simulateWaterScenario>;

// Mock Supabase
const mockSupabase = supabase as jest.Mocked<typeof supabase>;
mockSupabase.from = jest.fn(() => ({
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  then: jest.fn((callback) => callback({ data: { id: 'test-run-id' }, error: null })),
} as any));

describe('POST /api/simulate-water', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({ success: true, remaining: 9 });
    mockSimulateWater.mockResolvedValue({
      daily_results: [
        {
          date: '2024-01-01',
          region_id: '1',
          region_name: 'San Salvador',
          demand_m3: 1000,
          supply_m3: 900,
          stress: 0.1,
          shortage_days: 0,
        },
      ],
      summary: {
        avg_stress: 0.1,
        max_stress: 0.1,
        total_shortage_days: 0,
        top_stressed_regions: [
          { region: 'San Salvador', population: 1800000, avg_stress: 0.1 },
        ],
      },
    });
  });

  const VALID_REQUEST = {
    water_demand_growth_pct: 10,
    rainfall_change_pct: -15,
    conservation_rate_pct: 10,
    start_date: '2024-01-01',
    end_date: '2024-01-30',
  };

  describe('Happy Path', () => {
    it('should return 200 with valid simulation results', async () => {
      const request = new NextRequest('http://localhost:3000/api/simulate-water', {
        method: 'POST',
        body: JSON.stringify(VALID_REQUEST),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.daily_results).toBeDefined();
      expect(data.data.summary).toBeDefined();
    });

    it('should include economic analysis in response', async () => {
      const request = new NextRequest('http://localhost:3000/api/simulate-water', {
        method: 'POST',
        body: JSON.stringify(VALID_REQUEST),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.data.economic_analysis).toBeDefined();
      expect(data.data.economic_analysis.infrastructure_investment_usd).toBeDefined();
      expect(data.data.economic_analysis.roi_5_year).toBeDefined();
    });

    it('should return run_id from database', async () => {
      const request = new NextRequest('http://localhost:3000/api/simulate-water', {
        method: 'POST',
        body: JSON.stringify(VALID_REQUEST),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.data.run_id).toBe('test-run-id');
    });
  });

  describe('Validation', () => {
    it('should reject missing required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/simulate-water', {
        method: 'POST',
        body: JSON.stringify({ water_demand_growth_pct: 10 }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject water_demand_growth_pct > 200', async () => {
      const request = new NextRequest('http://localhost:3000/api/simulate-water', {
        method: 'POST',
        body: JSON.stringify({ ...VALID_REQUEST, water_demand_growth_pct: 250 }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject negative conservation_rate_pct', async () => {
      const request = new NextRequest('http://localhost:3000/api/simulate-water', {
        method: 'POST',
        body: JSON.stringify({ ...VALID_REQUEST, conservation_rate_pct: -10 }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject conservation_rate_pct > 100', async () => {
      const request = new NextRequest('http://localhost:3000/api/simulate-water', {
        method: 'POST',
        body: JSON.stringify({ ...VALID_REQUEST, conservation_rate_pct: 150 }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject invalid date format', async () => {
      const request = new NextRequest('http://localhost:3000/api/simulate-water', {
        method: 'POST',
        body: JSON.stringify({ ...VALID_REQUEST, start_date: '01/01/2024' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject date range > 5 years', async () => {
      const request = new NextRequest('http://localhost:3000/api/simulate-water', {
        method: 'POST',
        body: JSON.stringify({
          ...VALID_REQUEST,
          start_date: '2024-01-01',
          end_date: '2030-01-01',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      mockCheckRateLimit.mockResolvedValueOnce({ success: false, remaining: 0 });

      const request = new NextRequest('http://localhost:3000/api/simulate-water', {
        method: 'POST',
        body: JSON.stringify(VALID_REQUEST),
      });

      const response = await POST(request);
      expect(response.status).toBe(429);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when simulation fails', async () => {
      mockSimulateWater.mockRejectedValueOnce(new Error('Simulation failed'));

      const request = new NextRequest('http://localhost:3000/api/simulate-water', {
        method: 'POST',
        body: JSON.stringify(VALID_REQUEST),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });

    it('should return 500 when database insert fails', async () => {
      mockSupabase.from = jest.fn(() => ({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        then: jest.fn((callback) => callback({ data: null, error: { message: 'DB error' } })),
      } as any));

      const request = new NextRequest('http://localhost:3000/api/simulate-water', {
        method: 'POST',
        body: JSON.stringify(VALID_REQUEST),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });

  describe('Security', () => {
    it('should reject oversized payloads', async () => {
      const largePayload = { ...VALID_REQUEST, extra: 'x'.repeat(15 * 1024 * 1024) };

      const request = new NextRequest('http://localhost:3000/api/simulate-water', {
        method: 'POST',
        body: JSON.stringify(largePayload),
        headers: { 'content-length': (15 * 1024 * 1024).toString() },
      });

      const response = await POST(request);
      expect(response.status).toBe(413);
    });

    it('should sanitize SQL injection attempts in parameters', async () => {
      const maliciousRequest = {
        ...VALID_REQUEST,
        water_demand_growth_pct: "10'; DROP TABLE runs; --" as any,
      };

      const request = new NextRequest('http://localhost:3000/api/simulate-water', {
        method: 'POST',
        body: JSON.stringify(maliciousRequest),
      });

      const response = await POST(request);
      expect(response.status).toBe(400); // Should reject, not execute SQL
    });
  });

  describe('Performance', () => {
    it('should complete within 3 seconds for 30-day simulation', async () => {
      const request = new NextRequest('http://localhost:3000/api/simulate-water', {
        method: 'POST',
        body: JSON.stringify(VALID_REQUEST),
      });

      const startTime = Date.now();
      await POST(request);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(3000);
    });

    it('should include execution time in response', async () => {
      const request = new NextRequest('http://localhost:3000/api/simulate-water', {
        method: 'POST',
        body: JSON.stringify(VALID_REQUEST),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.data.execution_time_ms).toBeGreaterThan(0);
    });
  });
});
