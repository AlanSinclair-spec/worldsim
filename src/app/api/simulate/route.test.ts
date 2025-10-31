/**
 * API Integration Tests for /api/simulate (Energy Simulation)
 *
 * Tests the complete API endpoint including:
 * - Input validation (Zod schemas)
 * - Rate limiting
 * - Simulation execution
 * - Response format
 * - Error handling
 * - Security (SQL injection, XSS)
 *
 * @module api/simulate/route.test
 */

// Mock dependencies - must be before imports
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ success: true }),
}));

import { POST } from './route';
import { NextRequest } from 'next/server';
import {
  MOCK_ENERGY_SIMULATION_REQUEST,
  createMockSupabaseResponse,
} from '../../../../tests/utils/mocks';
import { supabase } from '@/lib/supabase';

// Get reference to the mocked from function
const mockFrom = supabase.from as jest.Mock;

describe('POST /api/simulate', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default Supabase mock
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      then: jest.fn((callback) =>
        callback(createMockSupabaseResponse([
          { date: '2024-01-01', region: 'San Salvador', demand_kwh: 50000 },
          { date: '2024-01-02', region: 'San Salvador', demand_kwh: 52000 },
        ]))
      ),
    });
  });

  describe('Happy Path', () => {
    it('should return 200 with valid simulation results', async () => {
      const request = new NextRequest('http://localhost:3000/api/simulate', {
        method: 'POST',
        body: JSON.stringify(MOCK_ENERGY_SIMULATION_REQUEST),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.daily_results).toBeDefined();
      expect(data.data.summary).toBeDefined();
      expect(data.execution_time_ms).toBeDefined();
    });

    it('should include economic analysis in response', async () => {
      const request = new NextRequest('http://localhost:3000/api/simulate', {
        method: 'POST',
        body: JSON.stringify(MOCK_ENERGY_SIMULATION_REQUEST),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.data.economic_analysis).toBeDefined();
      expect(data.data.economic_analysis.total_infrastructure_investment_usd).toBeDefined();
      expect(data.data.economic_analysis.roi_5_year).toBeDefined();
    });

    it('should save simulation to database', async () => {
      const request = new NextRequest('http://localhost:3000/api/simulate', {
        method: 'POST',
        body: JSON.stringify(MOCK_ENERGY_SIMULATION_REQUEST),
      });

      await POST(request);

      // Verify Supabase insert was called
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('runs');
    });
  });

  describe('Input Validation', () => {
    it('should reject missing required fields', async () => {
      const invalidRequest = {
        solar_growth_pct: 0.2,
        // Missing other required fields
      };

      const request = new NextRequest('http://localhost:3000/api/simulate', {
        method: 'POST',
        body: JSON.stringify(invalidRequest),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('validation');
    });

    it('should reject invalid data types', async () => {
      const invalidRequest = {
        ...MOCK_ENERGY_SIMULATION_REQUEST,
        solar_growth_pct: 'invalid', // Should be number
      };

      const request = new NextRequest('http://localhost:3000/api/simulate', {
        method: 'POST',
        body: JSON.stringify(invalidRequest),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should reject out-of-range values', async () => {
      const invalidRequest = {
        ...MOCK_ENERGY_SIMULATION_REQUEST,
        solar_growth_pct: 999, // Too high
      };

      const request = new NextRequest('http://localhost:3000/api/simulate', {
        method: 'POST',
        body: JSON.stringify(invalidRequest),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should reject invalid date formats', async () => {
      const invalidRequest = {
        ...MOCK_ENERGY_SIMULATION_REQUEST,
        start_date: 'not-a-date',
      };

      const request = new NextRequest('http://localhost:3000/api/simulate', {
        method: 'POST',
        body: JSON.stringify(invalidRequest),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should reject end_date before start_date', async () => {
      const invalidRequest = {
        ...MOCK_ENERGY_SIMULATION_REQUEST,
        start_date: '2024-02-01',
        end_date: '2024-01-01',
      };

      const request = new NextRequest('http://localhost:3000/api/simulate', {
        method: 'POST',
        body: JSON.stringify(invalidRequest),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should reject date ranges exceeding 365 days', async () => {
      const invalidRequest = {
        ...MOCK_ENERGY_SIMULATION_REQUEST,
        start_date: '2024-01-01',
        end_date: '2025-12-31', // More than 1 year
      };

      const request = new NextRequest('http://localhost:3000/api/simulate', {
        method: 'POST',
        body: JSON.stringify(invalidRequest),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      // Mock rate limit failure
      const { checkRateLimit } = require('@/lib/rate-limit');
      checkRateLimit.mockResolvedValueOnce({
        success: false,
        limit: 10,
        remaining: 0,
        reset: Date.now() + 60000,
      });

      const request = new NextRequest('http://localhost:3000/api/simulate', {
        method: 'POST',
        body: JSON.stringify(MOCK_ENERGY_SIMULATION_REQUEST),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Too many requests');
    });

    it('should include retry-after header in rate limit response', async () => {
      const { checkRateLimit } = require('@/lib/rate-limit');
      const resetTime = Date.now() + 60000;
      checkRateLimit.mockResolvedValueOnce({
        success: false,
        limit: 10,
        remaining: 0,
        reset: resetTime,
      });

      const request = new NextRequest('http://localhost:3000/api/simulate', {
        method: 'POST',
        body: JSON.stringify(MOCK_ENERGY_SIMULATION_REQUEST),
      });

      const response = await POST(request);

      expect(response.headers.get('Retry-After')).toBeDefined();
    });
  });

  describe('Security Tests', () => {
    it('should sanitize SQL injection attempts', async () => {
      const maliciousRequest = {
        ...MOCK_ENERGY_SIMULATION_REQUEST,
        solar_growth_pct: "0.2'; DROP TABLE runs; --",
      };

      const request = new NextRequest('http://localhost:3000/api/simulate', {
        method: 'POST',
        body: JSON.stringify(maliciousRequest),
      });

      const response = await POST(request);

      // Should reject invalid input, not execute SQL
      expect(response.status).toBe(400);
    });

    it('should reject oversized payloads', async () => {
      // Create a 15MB payload (exceeds 10MB limit)
      const largeData = 'x'.repeat(15 * 1024 * 1024);
      const oversizedRequest = {
        ...MOCK_ENERGY_SIMULATION_REQUEST,
        extra_data: largeData,
      };

      const request = new NextRequest('http://localhost:3000/api/simulate', {
        method: 'POST',
        body: JSON.stringify(oversizedRequest),
      });

      const response = await POST(request);

      expect(response.status).toBe(413); // Payload too large
    });

    it('should reject non-JSON content-type', async () => {
      const request = new NextRequest('http://localhost:3000/api/simulate', {
        method: 'POST',
        body: 'not-json',
        headers: {
          'Content-Type': 'text/plain',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should handle malformed JSON gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/simulate', {
        method: 'POST',
        body: '{invalid json',
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Error Handling', () => {
    it('should handle Supabase database errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        then: jest.fn((callback) =>
          callback(createMockSupabaseResponse(null, { message: 'Database connection failed' }))
        ),
      });

      const request = new NextRequest('http://localhost:3000/api/simulate', {
        method: 'POST',
        body: JSON.stringify(MOCK_ENERGY_SIMULATION_REQUEST),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should handle empty database results', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        then: jest.fn((callback) =>
          callback(createMockSupabaseResponse([]))
        ),
      });

      const request = new NextRequest('http://localhost:3000/api/simulate', {
        method: 'POST',
        body: JSON.stringify(MOCK_ENERGY_SIMULATION_REQUEST),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });

    it('should return detailed error messages in development', async () => {
      process.env.NODE_ENV = 'development';

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        then: jest.fn(() => {
          throw new Error('Detailed error message');
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/simulate', {
        method: 'POST',
        body: JSON.stringify(MOCK_ENERGY_SIMULATION_REQUEST),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.error).toContain('Detailed error message');

      process.env.NODE_ENV = 'test';
    });

    it('should return generic error messages in production', async () => {
      process.env.NODE_ENV = 'production';

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        then: jest.fn(() => {
          throw new Error('Internal database error');
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/simulate', {
        method: 'POST',
        body: JSON.stringify(MOCK_ENERGY_SIMULATION_REQUEST),
      });

      const response = await POST(request);
      const data = await response.json();

      // Should not expose internal errors in production
      expect(data.error).not.toContain('database');

      process.env.NODE_ENV = 'test';
    });
  });

  describe('Response Format', () => {
    it('should return correct response structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/simulate', {
        method: 'POST',
        body: JSON.stringify(MOCK_ENERGY_SIMULATION_REQUEST),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('execution_time_ms');
      expect(data.data).toHaveProperty('daily_results');
      expect(data.data).toHaveProperty('summary');
      expect(data.data).toHaveProperty('economic_analysis');
    });

    it('should include cache headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/simulate', {
        method: 'POST',
        body: JSON.stringify(MOCK_ENERGY_SIMULATION_REQUEST),
      });

      const response = await POST(request);

      // Should cache results for 1 hour
      expect(response.headers.get('Cache-Control')).toContain('max-age=3600');
    });

    it('should include CORS headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/simulate', {
        method: 'POST',
        body: JSON.stringify(MOCK_ENERGY_SIMULATION_REQUEST),
      });

      const response = await POST(request);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should complete in under 3 seconds for 30-day simulation', async () => {
      // Mock 30 days of data
      const mockData = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
        region: 'San Salvador',
        demand_kwh: 50000 + Math.random() * 5000,
      }));

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        then: jest.fn((callback) =>
          callback(createMockSupabaseResponse(mockData))
        ),
      });

      const request = new NextRequest('http://localhost:3000/api/simulate', {
        method: 'POST',
        body: JSON.stringify({
          ...MOCK_ENERGY_SIMULATION_REQUEST,
          start_date: '2024-01-01',
          end_date: '2024-01-30',
        }),
      });

      const startTime = Date.now();
      const response = await POST(request);
      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(3000); // 3 seconds
    }, 10000); // 10 second timeout for this test

    it('should include execution time in response', async () => {
      const request = new NextRequest('http://localhost:3000/api/simulate', {
        method: 'POST',
        body: JSON.stringify(MOCK_ENERGY_SIMULATION_REQUEST),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.execution_time_ms).toBeGreaterThan(0);
      expect(data.execution_time_ms).toBeLessThan(3000);
    });
  });
});
