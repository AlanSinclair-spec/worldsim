/**
 * Unit Tests for Validation Schemas
 *
 * Tests Zod schema validation for all API endpoints:
 * - EnergySimulationSchema
 * - WaterSimulationSchema
 * - AgricultureSimulationSchema
 * - IngestSchema
 * - Helper functions (checkBodySize, formatZodError)
 *
 * @module lib/validation.test
 */

import { z } from 'zod';
import {
  EnergySimulationSchema,
  WaterSimulationSchema,
  AgricultureSimulationSchema,
  IngestSchema,
  MAX_BODY_SIZE,
  checkBodySize,
  formatZodError,
} from './validation';

// Note: Global Request mock is defined in jest.setup.js

describe('EnergySimulationSchema', () => {
  describe('Happy Path', () => {
    it('should accept valid energy simulation parameters', () => {
      const valid = {
        solar_growth_pct: 20,
        rainfall_change_pct: -15,
        start_date: '2024-01-01',
        end_date: '2024-01-30',
      };

      expect(() => EnergySimulationSchema.parse(valid)).not.toThrow();
    });

    it('should accept zero values', () => {
      const valid = {
        solar_growth_pct: 0,
        rainfall_change_pct: 0,
        start_date: '2024-01-01',
        end_date: '2024-01-02',
      };

      expect(() => EnergySimulationSchema.parse(valid)).not.toThrow();
    });

    it('should accept negative percentage changes', () => {
      const valid = {
        solar_growth_pct: -50,
        rainfall_change_pct: -80,
        start_date: '2024-01-01',
        end_date: '2024-06-30',
      };

      expect(() => EnergySimulationSchema.parse(valid)).not.toThrow();
    });

    it('should accept maximum valid date range (5 years)', () => {
      const valid = {
        solar_growth_pct: 10,
        rainfall_change_pct: 5,
        start_date: '2024-01-01',
        end_date: '2028-12-30', // Just under 5 years
      };

      expect(() => EnergySimulationSchema.parse(valid)).not.toThrow();
    });
  });

  describe('Input Validation', () => {
    it('should reject missing required fields', () => {
      const invalid = {
        solar_growth_pct: 20,
        // Missing other required fields
      };

      expect(() => EnergySimulationSchema.parse(invalid)).toThrow();
    });

    it('should reject solar_growth_pct > 200', () => {
      const invalid = {
        solar_growth_pct: 250,
        rainfall_change_pct: 0,
        start_date: '2024-01-01',
        end_date: '2024-01-30',
      };

      expect(() => EnergySimulationSchema.parse(invalid)).toThrow(/cannot exceed 200%/);
    });

    it('should reject solar_growth_pct < -100', () => {
      const invalid = {
        solar_growth_pct: -150,
        rainfall_change_pct: 0,
        start_date: '2024-01-01',
        end_date: '2024-01-30',
      };

      expect(() => EnergySimulationSchema.parse(invalid)).toThrow(/cannot be less than -100%/);
    });

    it('should reject rainfall_change_pct > 200', () => {
      const invalid = {
        solar_growth_pct: 10,
        rainfall_change_pct: 300,
        start_date: '2024-01-01',
        end_date: '2024-01-30',
      };

      expect(() => EnergySimulationSchema.parse(invalid)).toThrow(/cannot exceed 200%/);
    });

    it('should reject rainfall_change_pct < -100', () => {
      const invalid = {
        solar_growth_pct: 10,
        rainfall_change_pct: -120,
        start_date: '2024-01-01',
        end_date: '2024-01-30',
      };

      expect(() => EnergySimulationSchema.parse(invalid)).toThrow(/cannot be less than -100%/);
    });

    it('should reject Infinity values', () => {
      const invalid = {
        solar_growth_pct: Infinity,
        rainfall_change_pct: 0,
        start_date: '2024-01-01',
        end_date: '2024-01-30',
      };

      expect(() => EnergySimulationSchema.parse(invalid)).toThrow(/must be a finite number/);
    });

    it('should reject NaN values', () => {
      const invalid = {
        solar_growth_pct: NaN,
        rainfall_change_pct: 0,
        start_date: '2024-01-01',
        end_date: '2024-01-30',
      };

      expect(() => EnergySimulationSchema.parse(invalid)).toThrow();
    });
  });

  describe('Date Validation', () => {
    it('should reject invalid date format', () => {
      const invalid = {
        solar_growth_pct: 10,
        rainfall_change_pct: 0,
        start_date: '01/01/2024', // Wrong format
        end_date: '2024-01-30',
      };

      expect(() => EnergySimulationSchema.parse(invalid)).toThrow(/Invalid date format/);
    });

    // Note: JavaScript's Date constructor auto-corrects invalid dates
    // (e.g., 2024-02-30 becomes 2024-03-01), so we can't reliably test
    // for non-existent dates using string validation alone.

    it('should reject end_date before start_date', () => {
      const invalid = {
        solar_growth_pct: 10,
        rainfall_change_pct: 0,
        start_date: '2024-02-01',
        end_date: '2024-01-01',
      };

      expect(() => EnergySimulationSchema.parse(invalid)).toThrow(/End date must be after start date/);
    });

    it('should reject end_date equal to start_date', () => {
      const invalid = {
        solar_growth_pct: 10,
        rainfall_change_pct: 0,
        start_date: '2024-01-01',
        end_date: '2024-01-01',
      };

      expect(() => EnergySimulationSchema.parse(invalid)).toThrow(/End date must be after start date/);
    });

    it('should reject date ranges exceeding 5 years', () => {
      const invalid = {
        solar_growth_pct: 10,
        rainfall_change_pct: 0,
        start_date: '2024-01-01',
        end_date: '2030-01-01', // More than 5 years
      };

      expect(() => EnergySimulationSchema.parse(invalid)).toThrow(/cannot exceed 5 years/);
    });
  });

  describe('Strict Mode', () => {
    it('should reject additional properties', () => {
      const invalid = {
        solar_growth_pct: 10,
        rainfall_change_pct: 0,
        start_date: '2024-01-01',
        end_date: '2024-01-30',
        extra_field: 'should be rejected',
      };

      expect(() => EnergySimulationSchema.parse(invalid)).toThrow();
    });
  });
});

describe('WaterSimulationSchema', () => {
  describe('Happy Path', () => {
    it('should accept valid water simulation parameters', () => {
      const valid = {
        water_demand_growth_pct: 10,
        rainfall_change_pct: -20,
        conservation_rate_pct: 15,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      };

      expect(() => WaterSimulationSchema.parse(valid)).not.toThrow();
    });

    it('should accept zero conservation rate', () => {
      const valid = {
        water_demand_growth_pct: 5,
        rainfall_change_pct: -10,
        conservation_rate_pct: 0,
        start_date: '2024-01-01',
        end_date: '2024-06-30',
      };

      expect(() => WaterSimulationSchema.parse(valid)).not.toThrow();
    });

    it('should accept 100% conservation rate', () => {
      const valid = {
        water_demand_growth_pct: 5,
        rainfall_change_pct: -10,
        conservation_rate_pct: 100,
        start_date: '2024-01-01',
        end_date: '2024-06-30',
      };

      expect(() => WaterSimulationSchema.parse(valid)).not.toThrow();
    });
  });

  describe('Input Validation', () => {
    it('should reject water_demand_growth_pct < -50', () => {
      const invalid = {
        water_demand_growth_pct: -60,
        rainfall_change_pct: 0,
        conservation_rate_pct: 10,
        start_date: '2024-01-01',
        end_date: '2024-01-30',
      };

      expect(() => WaterSimulationSchema.parse(invalid)).toThrow(/cannot be less than -50%/);
    });

    it('should reject water_demand_growth_pct > 200', () => {
      const invalid = {
        water_demand_growth_pct: 250,
        rainfall_change_pct: 0,
        conservation_rate_pct: 10,
        start_date: '2024-01-01',
        end_date: '2024-01-30',
      };

      expect(() => WaterSimulationSchema.parse(invalid)).toThrow(/cannot exceed 200%/);
    });

    it('should reject negative conservation rate', () => {
      const invalid = {
        water_demand_growth_pct: 10,
        rainfall_change_pct: 0,
        conservation_rate_pct: -5,
        start_date: '2024-01-01',
        end_date: '2024-01-30',
      };

      expect(() => WaterSimulationSchema.parse(invalid)).toThrow(/cannot be negative/);
    });

    it('should reject conservation_rate_pct > 100', () => {
      const invalid = {
        water_demand_growth_pct: 10,
        rainfall_change_pct: 0,
        conservation_rate_pct: 150,
        start_date: '2024-01-01',
        end_date: '2024-01-30',
      };

      expect(() => WaterSimulationSchema.parse(invalid)).toThrow(/cannot exceed 100%/);
    });

    it('should reject date ranges exceeding 5 years', () => {
      const invalid = {
        water_demand_growth_pct: 10,
        rainfall_change_pct: 0,
        conservation_rate_pct: 10,
        start_date: '2024-01-01',
        end_date: '2030-01-01',
      };

      expect(() => WaterSimulationSchema.parse(invalid)).toThrow(/cannot exceed 5 years/);
    });
  });
});

describe('AgricultureSimulationSchema', () => {
  describe('Happy Path', () => {
    it('should accept valid agriculture simulation parameters', () => {
      const valid = {
        rainfall_change_pct: -30,
        temperature_change_c: 2.5,
        irrigation_improvement_pct: 25,
        crop_type: 'coffee',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      };

      expect(() => AgricultureSimulationSchema.parse(valid)).not.toThrow();
    });

    it('should accept "all" as crop type', () => {
      const valid = {
        rainfall_change_pct: -20,
        temperature_change_c: 1.5,
        irrigation_improvement_pct: 10,
        crop_type: 'all',
        start_date: '2024-01-01',
        end_date: '2024-06-30',
      };

      expect(() => AgricultureSimulationSchema.parse(valid)).not.toThrow();
    });

    it('should accept all valid crop types', () => {
      const cropTypes = ['all', 'coffee', 'sugar_cane', 'corn', 'beans'];

      cropTypes.forEach((crop_type) => {
        const valid = {
          rainfall_change_pct: 0,
          temperature_change_c: 0,
          irrigation_improvement_pct: 0,
          crop_type,
          start_date: '2024-01-01',
          end_date: '2024-01-30',
        };

        expect(() => AgricultureSimulationSchema.parse(valid)).not.toThrow();
      });
    });

    it('should accept negative temperature change', () => {
      const valid = {
        rainfall_change_pct: 0,
        temperature_change_c: -3,
        irrigation_improvement_pct: 10,
        crop_type: 'corn',
        start_date: '2024-01-01',
        end_date: '2024-06-30',
      };

      expect(() => AgricultureSimulationSchema.parse(valid)).not.toThrow();
    });
  });

  describe('Input Validation', () => {
    it('should reject temperature_change_c < -5', () => {
      const invalid = {
        rainfall_change_pct: 0,
        temperature_change_c: -6,
        irrigation_improvement_pct: 10,
        crop_type: 'coffee',
        start_date: '2024-01-01',
        end_date: '2024-01-30',
      };

      expect(() => AgricultureSimulationSchema.parse(invalid)).toThrow(/cannot be less than -5/);
    });

    it('should reject temperature_change_c > 10', () => {
      const invalid = {
        rainfall_change_pct: 0,
        temperature_change_c: 12,
        irrigation_improvement_pct: 10,
        crop_type: 'coffee',
        start_date: '2024-01-01',
        end_date: '2024-01-30',
      };

      expect(() => AgricultureSimulationSchema.parse(invalid)).toThrow(/cannot exceed \+10/);
    });

    it('should reject negative irrigation_improvement_pct', () => {
      const invalid = {
        rainfall_change_pct: 0,
        temperature_change_c: 2,
        irrigation_improvement_pct: -10,
        crop_type: 'coffee',
        start_date: '2024-01-01',
        end_date: '2024-01-30',
      };

      expect(() => AgricultureSimulationSchema.parse(invalid)).toThrow(/cannot be negative/);
    });

    it('should reject irrigation_improvement_pct > 100', () => {
      const invalid = {
        rainfall_change_pct: 0,
        temperature_change_c: 2,
        irrigation_improvement_pct: 150,
        crop_type: 'coffee',
        start_date: '2024-01-01',
        end_date: '2024-01-30',
      };

      expect(() => AgricultureSimulationSchema.parse(invalid)).toThrow(/cannot exceed 100%/);
    });

    it('should reject invalid crop types', () => {
      const invalid = {
        rainfall_change_pct: 0,
        temperature_change_c: 2,
        irrigation_improvement_pct: 10,
        crop_type: 'wheat', // Not in enum
        start_date: '2024-01-01',
        end_date: '2024-01-30',
      };

      expect(() => AgricultureSimulationSchema.parse(invalid)).toThrow(); // Should reject invalid crop_type
    });
  });
});

describe('IngestSchema', () => {
  describe('Happy Path', () => {
    it('should accept valid CSV with energy data type', () => {
      const valid = {
        csv_text: 'date,region,demand_kwh\n2024-01-01,San Salvador,50000',
        data_type: 'energy',
      };

      expect(() => IngestSchema.parse(valid)).not.toThrow();
    });

    it('should accept valid CSV with rainfall data type', () => {
      const valid = {
        csv_text: 'date,region,rainfall_mm\n2024-01-01,San Salvador,5.2',
        data_type: 'rainfall',
      };

      expect(() => IngestSchema.parse(valid)).not.toThrow();
    });

    it('should accept valid CSV with water data type', () => {
      const valid = {
        csv_text: 'date,region,consumption_m3\n2024-01-01,San Salvador,1000',
        data_type: 'water',
      };

      expect(() => IngestSchema.parse(valid)).not.toThrow();
    });

    it('should accept large CSV up to MAX_BODY_SIZE', () => {
      const largeCSV = 'date,region,value\n' + 'x'.repeat(1000000); // 1MB
      const valid = {
        csv_text: largeCSV,
        data_type: 'energy',
      };

      expect(() => IngestSchema.parse(valid)).not.toThrow();
    });
  });

  describe('Input Validation', () => {
    it('should reject CSV content shorter than 10 characters', () => {
      const invalid = {
        csv_text: 'a,b',
        data_type: 'energy',
      };

      expect(() => IngestSchema.parse(invalid)).toThrow(/too short/);
    });

    it('should reject CSV content larger than MAX_BODY_SIZE', () => {
      const oversizedCSV = 'x'.repeat(MAX_BODY_SIZE + 1);
      const invalid = {
        csv_text: oversizedCSV,
        data_type: 'energy',
      };

      expect(() => IngestSchema.parse(invalid)).toThrow(/too large/);
    });

    it('should reject text without commas or newlines', () => {
      const invalid = {
        csv_text: 'this is just plain text without structure',
        data_type: 'energy',
      };

      expect(() => IngestSchema.parse(invalid)).toThrow(/Invalid CSV format/);
    });

    it('should reject invalid data types', () => {
      const invalid = {
        csv_text: 'date,region,value\n2024-01-01,San Salvador,100',
        data_type: 'invalid_type',
      };

      expect(() => IngestSchema.parse(invalid)).toThrow(); // Should reject invalid data_type
    });

    it('should reject additional properties', () => {
      const invalid = {
        csv_text: 'date,region,value\n2024-01-01,San Salvador,100',
        data_type: 'energy',
        extra_field: 'should be rejected',
      };

      expect(() => IngestSchema.parse(invalid)).toThrow();
    });
  });
});

describe('checkBodySize', () => {
  it('should return true for requests within MAX_BODY_SIZE', () => {
    const mockRequest = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: {
        'content-length': '1000000', // 1MB
      },
    });

    expect(checkBodySize(mockRequest)).toBe(true);
  });

  it('should return false for requests exceeding MAX_BODY_SIZE', () => {
    const mockRequest = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: {
        'content-length': (MAX_BODY_SIZE + 1).toString(),
      },
    });

    expect(checkBodySize(mockRequest)).toBe(false);
  });

  it('should return true when content-length header is missing', () => {
    const mockRequest = new Request('http://localhost:3000/api/test', {
      method: 'POST',
    });

    expect(checkBodySize(mockRequest)).toBe(true);
  });

  it('should return false for invalid content-length (NaN)', () => {
    const mockRequest = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: {
        'content-length': 'invalid',
      },
    });

    expect(checkBodySize(mockRequest)).toBe(false);
  });

  it('should return true for exactly MAX_BODY_SIZE', () => {
    const mockRequest = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: {
        'content-length': MAX_BODY_SIZE.toString(),
      },
    });

    expect(checkBodySize(mockRequest)).toBe(true);
  });
});

describe('formatZodError', () => {
  it('should format Zod error with field paths', () => {
    const schema = z.object({
      name: z.string().min(3),
      age: z.number().min(18),
    });

    try {
      schema.parse({ name: 'ab', age: 15 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formatted = formatZodError(error);

        expect(formatted.success).toBe(false);
        expect(formatted.error).toBe('Invalid input parameters');
        expect(formatted.details).toHaveLength(2);
        expect(formatted.details[0]).toContain('name:');
        expect(formatted.details[1]).toContain('age:');
      }
    }
  });

  it('should format Zod error without field paths (root errors)', () => {
    const schema = z.string().min(5);

    try {
      schema.parse('abc');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formatted = formatZodError(error);

        expect(formatted.success).toBe(false);
        expect(formatted.error).toBe('Invalid input parameters');
        expect(formatted.details).toHaveLength(1);
        expect(formatted.details[0]).not.toContain(':'); // No field path
      }
    }
  });

  it('should handle nested field paths', () => {
    const schema = z.object({
      user: z.object({
        profile: z.object({
          email: z.string().email(),
        }),
      }),
    });

    try {
      schema.parse({ user: { profile: { email: 'invalid' } } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formatted = formatZodError(error);

        expect(formatted.details[0]).toContain('user.profile.email:');
      }
    }
  });

  it('should format multiple validation errors', () => {
    try {
      EnergySimulationSchema.parse({
        solar_growth_pct: 999, // Too high
        rainfall_change_pct: -200, // Too low
        start_date: 'invalid', // Invalid format
        end_date: '2024-01-01',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formatted = formatZodError(error);

        expect(formatted.success).toBe(false);
        expect(formatted.details.length).toBeGreaterThan(1);
      }
    }
  });
});
