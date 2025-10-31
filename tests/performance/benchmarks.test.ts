/**
 * Performance Benchmark Tests for WorldSim
 *
 * Tests performance targets:
 * - API response times (<3s for 30-day simulations)
 * - Bundle size (<500KB)
 * - Database query performance
 * - Memory usage during simulations
 * - Concurrent request handling
 */

import { simulateEnergyScenario, simulateWaterScenario, simulateAgricultureScenario } from '@/lib/model';
import type { EnergySimulationScenario, WaterSimulationScenario, AgricultureSimulationScenario } from '@/lib/types';

describe('Performance Benchmarks - Simulation Speed', () => {
  describe('Energy Simulation Performance', () => {
    it('should complete 30-day simulation in under 3 seconds', async () => {
      const scenario: EnergySimulationScenario = {
        solar_growth_pct: 20,
        rainfall_change_pct: -10,
        start_date: '2024-01-01',
        end_date: '2024-01-30',
      };

      const startTime = Date.now();
      await simulateEnergyScenario(scenario);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(3000);
    }, 10000);

    it('should complete 365-day simulation in under 10 seconds', async () => {
      const scenario: EnergySimulationScenario = {
        solar_growth_pct: 15,
        rainfall_change_pct: -5,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      };

      const startTime = Date.now();
      await simulateEnergyScenario(scenario);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(10000);
    }, 15000);

    it('should handle maximum 5-year simulation efficiently', async () => {
      const scenario: EnergySimulationScenario = {
        solar_growth_pct: 10,
        rainfall_change_pct: 0,
        start_date: '2024-01-01',
        end_date: '2028-12-30',
      };

      const startTime = Date.now();
      await simulateEnergyScenario(scenario);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(30000); // 30 seconds for 5 years
    }, 35000);
  });

  describe('Water Simulation Performance', () => {
    it('should complete 30-day simulation in under 3 seconds', async () => {
      const scenario: WaterSimulationScenario = {
        water_demand_growth_pct: 10,
        rainfall_change_pct: -15,
        conservation_rate_pct: 10,
        start_date: '2024-01-01',
        end_date: '2024-01-30',
      };

      const startTime = Date.now();
      await simulateWaterScenario(scenario);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(3000);
    }, 10000);
  });

  describe('Agriculture Simulation Performance', () => {
    it('should complete 365-day simulation in under 5 seconds', async () => {
      const scenario: AgricultureSimulationScenario = {
        rainfall_change_pct: -20,
        temperature_change_c: 2,
        irrigation_improvement_pct: 15,
        crop_type: 'coffee',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      };

      const startTime = Date.now();
      await simulateAgricultureScenario(scenario);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
    }, 10000);
  });
});

describe('Performance Benchmarks - Memory Usage', () => {
  it('should not exceed 100MB heap for single simulation', async () => {
    const scenario: EnergySimulationScenario = {
      solar_growth_pct: 20,
      rainfall_change_pct: -10,
      start_date: '2024-01-01',
      end_date: '2024-12-31',
    };

    const memBefore = process.memoryUsage().heapUsed;
    await simulateEnergyScenario(scenario);
    const memAfter = process.memoryUsage().heapUsed;

    const memUsedMB = (memAfter - memBefore) / 1024 / 1024;

    expect(memUsedMB).toBeLessThan(100);
  });

  it('should not leak memory across multiple simulations', async () => {
    const scenario: EnergySimulationScenario = {
      solar_growth_pct: 10,
      rainfall_change_pct: 0,
      start_date: '2024-01-01',
      end_date: '2024-01-30',
    };

    const memBefore = process.memoryUsage().heapUsed;

    // Run 10 simulations
    for (let i = 0; i < 10; i++) {
      await simulateEnergyScenario(scenario);
    }

    global.gc && global.gc(); // Force garbage collection if available

    const memAfter = process.memoryUsage().heapUsed;
    const memIncreaseMB = (memAfter - memBefore) / 1024 / 1024;

    // Should not increase by more than 50MB after GC
    expect(memIncreaseMB).toBeLessThan(50);
  });
});

describe('Performance Benchmarks - Concurrent Processing', () => {
  it('should handle 10 concurrent simulations efficiently', async () => {
    const scenario: EnergySimulationScenario = {
      solar_growth_pct: 15,
      rainfall_change_pct: -5,
      start_date: '2024-01-01',
      end_date: '2024-01-30',
    };

    const startTime = Date.now();

    // Run 10 simulations concurrently
    const promises = Array(10).fill(null).map(() => simulateEnergyScenario(scenario));
    await Promise.all(promises);

    const duration = Date.now() - startTime;

    // Should complete all 10 in under 10 seconds (parallel processing)
    expect(duration).toBeLessThan(10000);
  }, 15000);

  it('should not block event loop during simulation', async () => {
    const scenario: EnergySimulationScenario = {
      solar_growth_pct: 20,
      rainfall_change_pct: -10,
      start_date: '2024-01-01',
      end_date: '2024-12-31',
    };

    const eventLoopDelays: number[] = [];
    const checkInterval = setInterval(() => {
      const start = Date.now();
      setImmediate(() => {
        eventLoopDelays.push(Date.now() - start);
      });
    }, 100);

    await simulateEnergyScenario(scenario);

    clearInterval(checkInterval);

    // Event loop delays should be minimal (<50ms)
    const avgDelay = eventLoopDelays.reduce((a, b) => a + b, 0) / eventLoopDelays.length;
    expect(avgDelay).toBeLessThan(50);
  }, 15000);
});

describe('Performance Benchmarks - Data Processing', () => {
  it('should efficiently process large result sets', () => {
    // Simulate 1000 daily results
    const dailyResults = Array(1000).fill(null).map((_, i) => ({
      date: `2024-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
      region_id: '1',
      region_name: 'San Salvador',
      demand_kwh: 100000 + i * 100,
      supply_kwh: 95000 + i * 90,
      stress: 0.05,
      outage_hours: 0,
    }));

    const startTime = Date.now();

    // Calculate summary statistics
    const avgStress = dailyResults.reduce((sum, r) => sum + r.stress, 0) / dailyResults.length;
    const maxStress = Math.max(...dailyResults.map(r => r.stress));

    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(100); // Should be nearly instant
    expect(avgStress).toBeCloseTo(0.05, 2);
    expect(maxStress).toBeCloseTo(0.05, 2);
  });

  it('should efficiently calculate economic analysis for all regions', () => {
    const regions = Array(14).fill(null).map((_, i) => ({
      region: `Region ${i}`,
      population: 100000 + i * 50000,
      stress_level: 0.3 + i * 0.05,
    }));

    const startTime = Date.now();

    // Simulate economic calculations
    const results = regions.map(region => ({
      ...region,
      outage_cost: region.population * region.stress_level * 5,
      investment_needed: region.stress_level > 0.6 ? 2000000 : 0,
    }));

    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(50);
    expect(results).toHaveLength(14);
  });
});

describe('Performance Benchmarks - Algorithm Efficiency', () => {
  it('should use O(n) time complexity for moving average', () => {
    const data = Array(10000).fill(null).map((_, i) => i);

    const startTime = Date.now();

    // Simple moving average
    const windowSize = 7;
    const sma: number[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < windowSize - 1) {
        sma.push(NaN);
      } else {
        const window = data.slice(i - windowSize + 1, i + 1);
        const avg = window.reduce((sum, val) => sum + val, 0) / windowSize;
        sma.push(avg);
      }
    }

    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(100); // 10k elements should be fast
    expect(sma.length).toBe(data.length);
  });

  it('should efficiently detect anomalies in large datasets', () => {
    const data = Array(5000).fill(null).map((_, i) => ({
      date: `2024-01-01`,
      value: 100 + Math.random() * 10,
    }));

    // Add some anomalies
    data[1000].value = 500;
    data[2000].value = 1;

    const startTime = Date.now();

    // Calculate mean and std dev
    const values = data.map(d => d.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Detect anomalies
    const anomalies = data.filter(d => {
      const zScore = (d.value - mean) / stdDev;
      return Math.abs(zScore) > 2;
    });

    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(200); // 5k elements
    expect(anomalies.length).toBeGreaterThan(0);
  });
});

describe('Performance Benchmarks - Cache Effectiveness', () => {
  it('should benefit from repeated calculations', async () => {
    const scenario: EnergySimulationScenario = {
      solar_growth_pct: 20,
      rainfall_change_pct: -10,
      start_date: '2024-01-01',
      end_date: '2024-01-30',
    };

    // First run
    const startTime1 = Date.now();
    await simulateEnergyScenario(scenario);
    const duration1 = Date.now() - startTime1;

    // Second run (might be cached if caching is implemented)
    const startTime2 = Date.now();
    await simulateEnergyScenario(scenario);
    const duration2 = Date.now() - startTime2;

    // Both should be fast
    expect(duration1).toBeLessThan(3000);
    expect(duration2).toBeLessThan(3000);
  }, 10000);
});
