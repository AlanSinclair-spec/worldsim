/**
 * Unit Tests for WorldSim Simulation Model
 *
 * Tests core calculation functions:
 * - calculateStress() - Infrastructure stress calculation
 * - calculateSummary() - Summary statistics aggregation
 * - simulate Scenario() - Full energy simulation (mocked Supabase)
 * - simulateWaterScenario() - Water stress simulation
 * - simulateAgricultureScenario() - Agriculture yield simulation
 *
 * @module lib/model.test
 */

// Mock Supabase module - must be before imports
jest.mock('./supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import {
  calculateStress,
  calculateSummary,
  simulateScenario,
  simulateWaterScenario,
  simulateAgricultureScenario,
} from './model';
import type { SimulationResult, SimulationScenario, WaterSimulationScenario } from './types';
import { supabase } from './supabase';

// Get reference to the mocked from function
const mockFrom = supabase.from as jest.Mock;

// Helper to create mock Supabase responses
const createMockSupabaseResponse = (data: any = null, error: any = null) => ({
  data,
  error,
  status: error ? 500 : 200,
});

describe('calculateStress', () => {
  describe('Happy Path', () => {
    it('should return 0 when supply meets demand', () => {
      expect(calculateStress(100, 100)).toBe(0);
    });

    it('should return 0 when supply exceeds demand', () => {
      expect(calculateStress(100, 150)).toBe(0);
    });

    it('should calculate correct stress when demand exceeds supply', () => {
      // 10% shortage: demand=100, supply=90, shortage=10, stress=10/100=0.1
      expect(calculateStress(100, 90)).toBe(0.1);
    });

    it('should calculate 50% stress correctly', () => {
      expect(calculateStress(100, 50)).toBe(0.5);
    });

    it('should calculate 90% stress correctly', () => {
      expect(calculateStress(100, 10)).toBe(0.9);
    });
  });

  describe('Edge Cases', () => {
    it('should return 1 when supply is zero', () => {
      expect(calculateStress(100, 0)).toBe(1);
    });

    it('should return 0 when demand is zero', () => {
      expect(calculateStress(0, 100)).toBe(0);
    });

    it('should handle both zero values', () => {
      expect(calculateStress(0, 0)).toBe(0);
    });

    it('should handle negative supply as zero supply', () => {
      expect(calculateStress(100, -10)).toBe(1);
    });

    it('should handle negative demand as zero demand', () => {
      expect(calculateStress(-100, 100)).toBe(0);
    });

    it('should clamp stress to maximum of 1', () => {
      // Even if supply is negative, stress should not exceed 1
      expect(calculateStress(100, -1000)).toBe(1);
    });

    it('should handle very small numbers correctly', () => {
      expect(calculateStress(0.01, 0.009)).toBeCloseTo(0.1, 5);
    });

    it('should handle very large numbers correctly', () => {
      const demand = 1e9; // 1 billion
      const supply = 9e8; // 900 million
      expect(calculateStress(demand, supply)).toBeCloseTo(0.1, 5);
    });
  });

  describe('Boundary Values', () => {
    it('should handle exact boundary at 0% stress', () => {
      expect(calculateStress(1000, 1000)).toBe(0);
    });

    it('should handle exact boundary at 100% stress', () => {
      expect(calculateStress(1000, 0)).toBe(1);
    });

    it('should handle mid-point stress', () => {
      expect(calculateStress(1000, 500)).toBe(0.5);
    });
  });
});

describe('calculateSummary', () => {
  describe('Happy Path', () => {
    it('should calculate average stress correctly', () => {
      const results: SimulationResult[] = [
        {
          date: '2024-01-01',
          region_id: '1',
          region_name: 'San Salvador',
          stress: 0.5,
          demand_kwh: 100,
          renewable_supply_kwh: 40,
          grid_supply_kwh: 10,
          battery_supply_kwh: 0,
          shortfall_kwh: 50,
          cost_usd: 1000,
          emissions_kg_co2: 500,
        },
        {
          date: '2024-01-02',
          region_id: '1',
          region_name: 'San Salvador',
          stress: 0.3,
          demand_kwh: 100,
          renewable_supply_kwh: 60,
          grid_supply_kwh: 10,
          battery_supply_kwh: 0,
          shortfall_kwh: 30,
          cost_usd: 900,
          emissions_kg_co2: 450,
        },
      ];

      const summary = calculateSummary(results);

      expect(summary.avg_stress).toBeCloseTo(0.4, 5); // (0.5 + 0.3) / 2
      expect(summary.max_stress).toBe(0.5);
      expect(summary.top_stressed_regions).toHaveLength(1);
      expect(summary.top_stressed_regions[0].region_name).toBe('San Salvador');
      expect(summary.top_stressed_regions[0].avg_stress).toBeCloseTo(0.4, 5);
    });

    it('should identify top 5 stressed regions correctly', () => {
      const results: SimulationResult[] = [
        { date: '2024-01-01', region_id: '1', region_name: 'Region1', stress: 0.9, demand_kwh: 100, renewable_supply_kwh: 10, grid_supply_kwh: 0, battery_supply_kwh: 0, shortfall_kwh: 90, cost_usd: 100, emissions_kg_co2: 50 },
        { date: '2024-01-01', region_id: '2', region_name: 'Region2', stress: 0.8, demand_kwh: 100, renewable_supply_kwh: 20, grid_supply_kwh: 0, battery_supply_kwh: 0, shortfall_kwh: 80, cost_usd: 100, emissions_kg_co2: 50 },
        { date: '2024-01-01', region_id: '3', region_name: 'Region3', stress: 0.7, demand_kwh: 100, renewable_supply_kwh: 30, grid_supply_kwh: 0, battery_supply_kwh: 0, shortfall_kwh: 70, cost_usd: 100, emissions_kg_co2: 50 },
        { date: '2024-01-01', region_id: '4', region_name: 'Region4', stress: 0.6, demand_kwh: 100, renewable_supply_kwh: 40, grid_supply_kwh: 0, battery_supply_kwh: 0, shortfall_kwh: 60, cost_usd: 100, emissions_kg_co2: 50 },
        { date: '2024-01-01', region_id: '5', region_name: 'Region5', stress: 0.5, demand_kwh: 100, renewable_supply_kwh: 50, grid_supply_kwh: 0, battery_supply_kwh: 0, shortfall_kwh: 50, cost_usd: 100, emissions_kg_co2: 50 },
        { date: '2024-01-01', region_id: '6', region_name: 'Region6', stress: 0.4, demand_kwh: 100, renewable_supply_kwh: 60, grid_supply_kwh: 0, battery_supply_kwh: 0, shortfall_kwh: 40, cost_usd: 100, emissions_kg_co2: 50 },
        { date: '2024-01-01', region_id: '7', region_name: 'Region7', stress: 0.3, demand_kwh: 100, renewable_supply_kwh: 70, grid_supply_kwh: 0, battery_supply_kwh: 0, shortfall_kwh: 30, cost_usd: 100, emissions_kg_co2: 50 },
      ];

      const summary = calculateSummary(results);

      // Should return only top 5
      expect(summary.top_stressed_regions).toHaveLength(5);

      // Should be sorted by stress (descending)
      expect(summary.top_stressed_regions[0].region_name).toBe('Region1');
      expect(summary.top_stressed_regions[0].avg_stress).toBe(0.9);
      expect(summary.top_stressed_regions[4].region_name).toBe('Region5');
      expect(summary.top_stressed_regions[4].avg_stress).toBe(0.5);
    });

    it('should aggregate multiple days per region correctly', () => {
      const results: SimulationResult[] = [
        { date: '2024-01-01', region_id: '1', region_name: 'Region1', stress: 0.8, demand_kwh: 100, renewable_supply_kwh: 20, grid_supply_kwh: 0, battery_supply_kwh: 0, shortfall_kwh: 80, cost_usd: 100, emissions_kg_co2: 50 },
        { date: '2024-01-02', region_id: '1', region_name: 'Region1', stress: 0.6, demand_kwh: 100, renewable_supply_kwh: 40, grid_supply_kwh: 0, battery_supply_kwh: 0, shortfall_kwh: 60, cost_usd: 100, emissions_kg_co2: 50 },
        { date: '2024-01-03', region_id: '1', region_name: 'Region1', stress: 0.4, demand_kwh: 100, renewable_supply_kwh: 60, grid_supply_kwh: 0, battery_supply_kwh: 0, shortfall_kwh: 40, cost_usd: 100, emissions_kg_co2: 50 },
      ];

      const summary = calculateSummary(results);

      // Average across 3 days: (0.8 + 0.6 + 0.4) / 3 = 0.6
      expect(summary.avg_stress).toBeCloseTo(0.6, 5);
      expect(summary.max_stress).toBe(0.8);
      expect(summary.top_stressed_regions[0].avg_stress).toBeCloseTo(0.6, 5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty results array', () => {
      const summary = calculateSummary([]);

      expect(summary.avg_stress).toBe(0);
      expect(summary.max_stress).toBe(0);
      expect(summary.top_stressed_regions).toEqual([]);
    });

    it('should handle single result', () => {
      const results: SimulationResult[] = [
        {
          date: '2024-01-01',
          region_id: '1',
          region_name: 'Region1',
          stress: 0.75,
          demand_kwh: 100,
          renewable_supply_kwh: 25,
          grid_supply_kwh: 0,
          battery_supply_kwh: 0,
          shortfall_kwh: 75,
          cost_usd: 100,
          emissions_kg_co2: 50,
        },
      ];

      const summary = calculateSummary(results);

      expect(summary.avg_stress).toBe(0.75);
      expect(summary.max_stress).toBe(0.75);
      expect(summary.top_stressed_regions).toHaveLength(1);
      expect(summary.top_stressed_regions[0].avg_stress).toBe(0.75);
    });

    it('should handle all regions with zero stress', () => {
      const results: SimulationResult[] = [
        { date: '2024-01-01', region_id: '1', region_name: 'Region1', stress: 0, demand_kwh: 100, renewable_supply_kwh: 100, grid_supply_kwh: 0, battery_supply_kwh: 0, shortfall_kwh: 0, cost_usd: 100, emissions_kg_co2: 50 },
        { date: '2024-01-01', region_id: '2', region_name: 'Region2', stress: 0, demand_kwh: 100, renewable_supply_kwh: 100, grid_supply_kwh: 0, battery_supply_kwh: 0, shortfall_kwh: 0, cost_usd: 100, emissions_kg_co2: 50 },
      ];

      const summary = calculateSummary(results);

      expect(summary.avg_stress).toBe(0);
      expect(summary.max_stress).toBe(0);
      expect(summary.top_stressed_regions).toHaveLength(2);
    });

    it('should handle all regions with maximum stress', () => {
      const results: SimulationResult[] = [
        { date: '2024-01-01', region_id: '1', region_name: 'Region1', stress: 1, demand_kwh: 100, renewable_supply_kwh: 0, grid_supply_kwh: 0, battery_supply_kwh: 0, shortfall_kwh: 100, cost_usd: 100, emissions_kg_co2: 50 },
        { date: '2024-01-01', region_id: '2', region_name: 'Region2', stress: 1, demand_kwh: 100, renewable_supply_kwh: 0, grid_supply_kwh: 0, battery_supply_kwh: 0, shortfall_kwh: 100, cost_usd: 100, emissions_kg_co2: 50 },
      ];

      const summary = calculateSummary(results);

      expect(summary.avg_stress).toBe(1);
      expect(summary.max_stress).toBe(1);
    });
  });
});

describe('simulateScenario (Energy)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should run simulation with valid parameters', async () => {
    // Mock Supabase response
    const mockEnergyData = [
      { date: '2024-01-01', region: 'San Salvador', demand_kwh: 50000 },
      { date: '2024-01-02', region: 'San Salvador', demand_kwh: 52000 },
    ];

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      then: jest.fn((callback) =>
        callback(createMockSupabaseResponse(mockEnergyData))
      ),
    });

    const scenario: SimulationScenario = {
      solar_growth_pct: 0.2,
      rainfall_change_pct: -0.15,
      start_date: '2024-01-01',
      end_date: '2024-01-02',
      grid_capacity_mw: 1500,
      battery_storage_mwh: 100,
    };

    const result = await simulateScenario(scenario);

    expect(result).toBeDefined();
    expect(result.daily_results).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(mockFrom).toHaveBeenCalledWith('energy_daily');
  });

  it('should handle Supabase errors gracefully', async () => {
    // Mock Supabase error
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      then: jest.fn((callback) =>
        callback(createMockSupabaseResponse(null, { message: 'Database error' }))
      ),
    });

    const scenario: SimulationScenario = {
      solar_growth_pct: 0.2,
      rainfall_change_pct: -0.15,
      start_date: '2024-01-01',
      end_date: '2024-01-02',
      grid_capacity_mw: 1500,
      battery_storage_mwh: 100,
    };

    await expect(simulateScenario(scenario)).rejects.toThrow();
  });
});

describe('simulateWaterScenario', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should run water simulation with valid parameters', async () => {
    // Mock Supabase response
    const mockRainfallData = [
      { date: '2024-01-01', region: 'San Salvador', rainfall_mm: 5.2 },
      { date: '2024-01-02', region: 'San Salvador', rainfall_mm: 3.5 },
    ];

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      then: jest.fn((callback) =>
        callback(createMockSupabaseResponse(mockRainfallData))
      ),
    });

    const scenario: WaterSimulationScenario = {
      rainfall_reduction_pct: 0.3,
      start_date: '2024-01-01',
      end_date: '2024-01-02',
      conservation_effort_pct: 0.1,
      infrastructure_investment_usd: 5000000,
    };

    const result = await simulateWaterScenario(scenario);

    expect(result).toBeDefined();
    expect(result.daily_results).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(mockFrom).toHaveBeenCalledWith('rain_daily');
  });
});

describe('simulateAgricultureScenario', () => {
  it('should run agriculture simulation with valid parameters', async () => {
    const scenario = {
      crop_type: 'coffee',
      climate_scenario: 'moderate_drought',
      start_date: '2024-01-01',
      end_date: '2024-03-31',
      irrigation_coverage_pct: 0.3,
      adaptation_measures: ['drought_resistant_varieties'],
    };

    const result = await simulateAgricultureScenario(scenario as any);

    expect(result).toBeDefined();
    expect(result.daily_results).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.summary.avg_stress).toBeGreaterThanOrEqual(0);
    expect(result.summary.avg_stress).toBeLessThanOrEqual(1);
  });

  it('should apply irrigation benefits correctly', async () => {
    const baseScenario = {
      crop_type: 'coffee',
      climate_scenario: 'severe_drought',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      irrigation_coverage_pct: 0,
      adaptation_measures: [],
    };

    const irrigatedScenario = {
      ...baseScenario,
      irrigation_coverage_pct: 0.5,
    };

    const baseResult = await simulateAgricultureScenario(baseScenario as any);
    const irrigatedResult = await simulateAgricultureScenario(irrigatedScenario as any);

    // Irrigation should reduce stress
    expect(irrigatedResult.summary.avg_stress).toBeLessThan(baseResult.summary.avg_stress);
  });
});

describe('Performance Tests', () => {
  it('should complete 30-day simulation in under 3 seconds', async () => {
    const scenario: SimulationScenario = {
      solar_growth_pct: 0.2,
      rainfall_change_pct: -0.15,
      start_date: '2024-01-01',
      end_date: '2024-01-30',
      grid_capacity_mw: 1500,
      battery_storage_mwh: 100,
    };

    // Mock 30 days of data
    const mockData = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
      region: 'San Salvador',
      demand_kwh: 50000 + Math.random() * 5000,
    }));

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      then: jest.fn((callback) =>
        callback(createMockSupabaseResponse(mockData))
      ),
    });

    const startTime = Date.now();
    await simulateScenario(scenario);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(3000); // 3 seconds
  }, 10000); // 10 second timeout for this test
});
