/**
 * API Integration Tests for /api/simulate-agriculture
 *
 * Tests agriculture simulation endpoint including:
 * - Request validation (crop types, temperature ranges)
 * - Rate limiting
 * - Successful simulations
 * - Error handling
 * - Security
 */

import { POST } from './route';
import { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { simulateAgricultureScenario } from '@/lib/model';
import { supabase } from '@/lib/supabase';

// Mock dependencies
jest.mock('@/lib/rate-limit');
jest.mock('@/lib/model');
jest.mock('@/lib/supabase');

const mockCheckRateLimit = checkRateLimit as jest.MockedFunction<typeof checkRateLimit>;
const mockSimulateAg = simulateAgricultureScenario as jest.MockedFunction<typeof simulateAgricultureScenario>;

// Mock Supabase
const mockSupabase = supabase as jest.Mocked<typeof supabase>;
mockSupabase.from = jest.fn(() => ({
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  then: jest.fn((callback) => callback({ data: { id: 'test-run-id' }, error: null })),
} as any));

describe('POST /api/simulate-agriculture', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({ success: true, remaining: 9 });
    mockSimulateAg.mockResolvedValue({
      daily_results: [
        {
          date: '2024-01-01',
          region_id: '1',
          region_name: 'Santa Ana',
          crop_type: 'coffee',
          baseline_yield_kg: 1000,
          simulated_yield_kg: 900,
          yield_change_pct: -10,
          stress_level: 0.1,
        },
      ],
      summary: {
        avg_yield_change_pct: -10,
        total_crop_loss_kg: 100,
        most_affected_regions: [
          { region: 'Santa Ana', crop: 'coffee', yield_change_pct: -10 },
        ],
      },
      crop_losses: {
        coffee: 100,
      },
    });
  });

  const VALID_REQUEST = {
    rainfall_change_pct: -20,
    temperature_change_c: 2.5,
    irrigation_improvement_pct: 15,
    crop_type: 'coffee',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
  };

  describe('Happy Path', () => {
    it('should return 200 with valid simulation results', async () => {
      const request = new NextRequest('http://localhost:3000/api/simulate-agriculture', {
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

    it('should support all valid crop types', async () => {
      const cropTypes = ['all', 'coffee', 'sugar_cane', 'corn', 'beans'];

      for (const crop_type of cropTypes) {
        const request = new NextRequest('http://localhost:3000/api/simulate-agriculture', {
          method: 'POST',
          body: JSON.stringify({ ...VALID_REQUEST, crop_type }),
        });

        const response = await POST(request);
        expect(response.status).toBe(200);
      }
    });

    it('should include crop losses in response', async () => {
      const request = new NextRequest('http://localhost:3000/api/simulate-agriculture', {
        method: 'POST',
        body: JSON.stringify(VALID_REQUEST),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.data.crop_losses).toBeDefined();
      expect(data.data.crop_losses.coffee).toBe(100);
    });

    it('should include economic analysis for agriculture', async () => {
      const request = new NextRequest('http://localhost:3000/api/simulate-agriculture', {
        method: 'POST',
        body: JSON.stringify(VALID_REQUEST),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.data.economic_analysis).toBeDefined();
      expect(data.data.economic_analysis.infrastructure_investment_usd).toBeDefined();
    });
  });

  describe('Validation', () => {
    it('should reject missing required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/simulate-agriculture', {
        method: 'POST',
        body: JSON.stringify({ rainfall_change_pct: -20 }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject temperature_change_c < -5', async () => {
      const request = new NextRequest('http://localhost:3000/api/simulate-agriculture', {
        method: 'POST',
        body: JSON.stringify({ ...VALID_REQUEST, temperature_change_c: -6 }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject temperature_change_c > 10', async () => {
      const request = new NextRequest('http://localhost:3000/api/simulate-agriculture', {
        method: 'POST',
        body: JSON.stringify({ ...VALID_REQUEST, temperature_change_c: 12 }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject invalid crop types', async () => {
      const request = new NextRequest('http://localhost:3000/api/simulate-agriculture', {
        method: 'POST',
        body: JSON.stringify({ ...VALID_REQUEST, crop_type: 'wheat' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject irrigation_improvement_pct > 100', async () => {
      const request = new NextRequest('http://localhost:3000/api/simulate-agriculture', {
        method: 'POST',
        body: JSON.stringify({ ...VALID_REQUEST, irrigation_improvement_pct: 150 }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      mockCheckRateLimit.mockResolvedValueOnce({ success: false, remaining: 0 });

      const request = new NextRequest('http://localhost:3000/api/simulate-agriculture', {
        method: 'POST',
        body: JSON.stringify(VALID_REQUEST),
      });

      const response = await POST(request);
      expect(response.status).toBe(429);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when simulation fails', async () => {
      mockSimulateAg.mockRejectedValueOnce(new Error('Simulation failed'));

      const request = new NextRequest('http://localhost:3000/api/simulate-agriculture', {
        method: 'POST',
        body: JSON.stringify(VALID_REQUEST),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });

  describe('Performance', () => {
    it('should complete within 3 seconds', async () => {
      const request = new NextRequest('http://localhost:3000/api/simulate-agriculture', {
        method: 'POST',
        body: JSON.stringify(VALID_REQUEST),
      });

      const startTime = Date.now();
      await POST(request);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(3000);
    });
  });
});
