/**
 * Unit Tests for Statistical Analysis and ML Predictions
 *
 * Tests time series analysis, forecasting, and anomaly detection:
 * - Moving averages (simple and exponential)
 * - Growth rate calculations
 * - Anomaly detection (z-score method)
 * - Linear regression
 * - Exponential smoothing forecasts
 * - Confidence interval calculations
 *
 * @module lib/trends.test
 */

import {
  calculateMovingAverage,
  calculateGrowthRate,
  detectAnomalies,
  linearRegression,
  exponentialSmoothing,
  calculateConfidenceInterval,
  DataPoint,
} from './trends';

// ═══════════════════════════════════════════════════════════════════
// MOVING AVERAGE CALCULATIONS
// ═══════════════════════════════════════════════════════════════════

describe('calculateMovingAverage', () => {
  describe('Simple Moving Average', () => {
    it('should calculate 3-period SMA correctly', () => {
      const data = [10, 12, 15, 14, 16, 18, 20];
      const result = calculateMovingAverage(data, 3);

      expect(result.simple[0]).toBeNaN(); // First value
      expect(result.simple[1]).toBeNaN(); // Second value
      expect(result.simple[2]).toBeCloseTo(12.33, 2); // (10+12+15)/3
      expect(result.simple[3]).toBeCloseTo(13.67, 2); // (12+15+14)/3
      expect(result.simple[4]).toBeCloseTo(15.00, 2); // (15+14+16)/3
    });

    it('should calculate 7-period SMA correctly (default)', () => {
      const data = [10, 12, 14, 16, 18, 20, 22, 24, 26];
      const result = calculateMovingAverage(data);

      expect(result.simple[0]).toBeNaN();
      expect(result.simple[5]).toBeNaN();
      expect(result.simple[6]).toBeCloseTo(16.00, 2); // First valid SMA
    });

    it('should return NaN for first (windowSize - 1) values', () => {
      const data = [10, 20, 30, 40, 50];
      const result = calculateMovingAverage(data, 3);

      expect(result.simple[0]).toBeNaN();
      expect(result.simple[1]).toBeNaN();
      expect(result.simple[2]).not.toBeNaN();
    });
  });

  describe('Exponential Moving Average', () => {
    it('should calculate EMA correctly', () => {
      const data = [10, 12, 15, 14, 16];
      const result = calculateMovingAverage(data, 3);

      expect(result.exponential[0]).toBe(10); // First value = data point
      expect(result.exponential[1]).toBeGreaterThan(10);
      expect(result.exponential[1]).toBeLessThan(12);
      expect(result.exponential.length).toBe(data.length);
    });

    it('should use alpha = 2 / (windowSize + 1)', () => {
      const data = [10, 20, 30];
      const windowSize = 3;
      const alpha = 2 / (windowSize + 1); // 0.5

      const result = calculateMovingAverage(data, windowSize);

      // EMA[1] = alpha * data[1] + (1-alpha) * EMA[0]
      const expected = alpha * 20 + (1 - alpha) * 10;
      expect(result.exponential[1]).toBeCloseTo(expected, 5);
    });

    it('should react faster than SMA to changes', () => {
      const data = [10, 10, 10, 20, 20, 20];
      const result = calculateMovingAverage(data, 3);

      // EMA should react faster to the jump from 10 to 20
      expect(result.exponential[3]).toBeGreaterThan(result.simple[3] || 0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single data point', () => {
      const data = [10];
      const result = calculateMovingAverage(data, 3);

      expect(result.simple[0]).toBeNaN();
      expect(result.exponential[0]).toBe(10);
    });

    it('should handle empty array', () => {
      const data: number[] = [];
      const result = calculateMovingAverage(data, 3);

      expect(result.simple).toEqual([]);
      expect(result.exponential).toEqual([]);
    });

    it('should handle windowSize larger than data length', () => {
      const data = [10, 20, 30];
      const result = calculateMovingAverage(data, 10);

      expect(result.simple.every(v => isNaN(v))).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// GROWTH RATE CALCULATIONS
// ═══════════════════════════════════════════════════════════════════

describe('calculateGrowthRate', () => {
  describe('Happy Path', () => {
    it('should calculate 20% overall growth correctly', () => {
      const data = [100, 110, 115, 120];
      const result = calculateGrowthRate(data);

      expect(result.overall).toBeCloseTo(0.20, 2); // 20% growth
      expect(result.trend_direction).toBe('increasing');
    });

    it('should calculate period-over-period growth rates', () => {
      const data = [100, 110, 121];
      const result = calculateGrowthRate(data);

      expect(result.period_over_period).toHaveLength(2);
      expect(result.period_over_period[0]).toBeCloseTo(0.10, 2); // 10% growth
      expect(result.period_over_period[1]).toBeCloseTo(0.10, 2); // 10% growth
    });

    it('should calculate average daily growth rate', () => {
      const data = [100, 110, 120, 130];
      const result = calculateGrowthRate(data);

      const expected = (0.10 + 0.091 + 0.083) / 3;
      expect(result.average_daily).toBeCloseTo(expected, 2);
    });

    it('should detect increasing trend', () => {
      const data = [100, 105, 110, 115, 120];
      const result = calculateGrowthRate(data);

      expect(result.trend_direction).toBe('increasing');
    });

    it('should detect decreasing trend', () => {
      const data = [120, 115, 110, 105, 100];
      const result = calculateGrowthRate(data);

      expect(result.trend_direction).toBe('decreasing');
    });

    it('should detect stable trend', () => {
      const data = [100, 100.5, 100.2, 100.3, 100.1];
      const result = calculateGrowthRate(data);

      expect(result.trend_direction).toBe('stable'); // <1% average change
    });
  });

  describe('Edge Cases', () => {
    it('should handle single data point', () => {
      const data = [100];
      const result = calculateGrowthRate(data);

      expect(result.overall).toBe(0);
      expect(result.period_over_period).toEqual([]);
      expect(result.average_daily).toBe(0);
      expect(result.trend_direction).toBe('stable');
    });

    it('should handle empty array', () => {
      const data: number[] = [];
      const result = calculateGrowthRate(data);

      expect(result.overall).toBe(0);
      expect(result.trend_direction).toBe('stable');
    });

    it('should handle division by zero in period-over-period', () => {
      const data = [0, 10, 20];
      const result = calculateGrowthRate(data);

      expect(result.period_over_period[0]).toBe(0); // 0 to 10 handled gracefully
    });

    it('should handle negative growth', () => {
      const data = [100, 80, 60];
      const result = calculateGrowthRate(data);

      expect(result.overall).toBeCloseTo(-0.40, 2); // -40% growth
      expect(result.trend_direction).toBe('decreasing');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// ANOMALY DETECTION
// ═══════════════════════════════════════════════════════════════════

describe('detectAnomalies', () => {
  describe('Happy Path', () => {
    it('should detect high anomalies using z-score', () => {
      const data: DataPoint[] = [
        { date: '2024-01-01', value: 10 },
        { date: '2024-01-02', value: 12 },
        { date: '2024-01-03', value: 11 },
        { date: '2024-01-04', value: 10 },
        { date: '2024-01-05', value: 200 }, // Extreme anomaly
        { date: '2024-01-06', value: 11 },
        { date: '2024-01-07', value: 12 },
        { date: '2024-01-08', value: 10 },
      ];

      const anomalies = detectAnomalies(data, 2);

      expect(anomalies.length).toBeGreaterThan(0);
      expect(anomalies[0].date).toBe('2024-01-05');
      expect(anomalies[0].value).toBe(200);
      expect(Math.abs(anomalies[0].z_score)).toBeGreaterThan(2);
    });

    it('should detect low anomalies', () => {
      const data: DataPoint[] = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 102 },
        { date: '2024-01-03', value: 101 },
        { date: '2024-01-04', value: 100 },
        { date: '2024-01-05', value: 1 }, // Extreme low anomaly
        { date: '2024-01-06', value: 101 },
        { date: '2024-01-07', value: 102 },
        { date: '2024-01-08', value: 100 },
      ];

      const anomalies = detectAnomalies(data, 2);

      expect(anomalies.length).toBeGreaterThan(0);
      expect(anomalies[0].value).toBe(1);
    });

    it('should classify anomaly severity correctly', () => {
      const data: DataPoint[] = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 100 },
        { date: '2024-01-03', value: 100 },
        { date: '2024-01-04', value: 100 },
        { date: '2024-01-05', value: 100 },
        { date: '2024-01-06', value: 100000 }, // Extreme anomaly for high severity
        { date: '2024-01-07', value: 100 },
        { date: '2024-01-08', value: 100 },
        { date: '2024-01-09', value: 100 },
        { date: '2024-01-10', value: 100 },
      ];

      const anomalies = detectAnomalies(data, 2);

      expect(anomalies.length).toBeGreaterThan(0);
      expect(anomalies[0].severity).toBe('high'); // z-score > threshold * 2
    });

    it('should include expected value and deviation', () => {
      const data: DataPoint[] = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 100 },
        { date: '2024-01-03', value: 200 },
      ];

      const anomalies = detectAnomalies(data, 1);

      if (anomalies.length > 0) {
        expect(anomalies[0].expected).toBeCloseTo(133.33, 1); // Mean
        expect(anomalies[0].deviation).toBeDefined();
      }
    });
  });

  describe('Severity Levels', () => {
    it('should classify low severity (z-score between threshold and 1.5x)', () => {
      const data: DataPoint[] = [
        { date: '2024-01-01', value: 10 },
        { date: '2024-01-02', value: 10 },
        { date: '2024-01-03', value: 10 },
        { date: '2024-01-04', value: 15 }, // Moderate anomaly
      ];

      const anomalies = detectAnomalies(data, 1.5);

      if (anomalies.length > 0) {
        expect(['low', 'medium']).toContain(anomalies[0].severity);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should return empty array for data with <3 points', () => {
      const data: DataPoint[] = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 200 },
      ];

      const anomalies = detectAnomalies(data);
      expect(anomalies).toEqual([]);
    });

    it('should handle zero standard deviation (all values same)', () => {
      const data: DataPoint[] = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 100 },
        { date: '2024-01-03', value: 100 },
      ];

      const anomalies = detectAnomalies(data, 2);
      expect(anomalies).toEqual([]); // No anomalies when all values identical
    });

    it('should use default threshold of 2', () => {
      const data: DataPoint[] = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 100 },
        { date: '2024-01-03', value: 100 },
        { date: '2024-01-04', value: 200 },
      ];

      const anomalies1 = detectAnomalies(data);
      const anomalies2 = detectAnomalies(data, 2);

      expect(anomalies1.length).toBe(anomalies2.length);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// LINEAR REGRESSION
// ═══════════════════════════════════════════════════════════════════

describe('linearRegression', () => {
  describe('Happy Path', () => {
    it('should calculate perfect linear fit', () => {
      const data = [10, 12, 14, 16, 18]; // Slope = 2, Intercept = 10
      const result = linearRegression(data);

      expect(result.slope).toBeCloseTo(2, 1);
      expect(result.intercept).toBeCloseTo(10, 1);
      expect(result.r_squared).toBeCloseTo(1.0, 2); // Perfect fit
    });

    it('should calculate slope and intercept correctly', () => {
      const data = [5, 10, 15, 20, 25]; // Slope = 5, Intercept = 5
      const result = linearRegression(data);

      expect(result.slope).toBeCloseTo(5, 1);
      expect(result.intercept).toBeCloseTo(5, 1);
    });

    it('should generate predictions for all data points', () => {
      const data = [10, 12, 14, 16, 18];
      const result = linearRegression(data);

      expect(result.predictions.length).toBe(data.length);
      expect(result.predictions[0]).toBeCloseTo(10, 1);
      expect(result.predictions[4]).toBeCloseTo(18, 1);
    });

    it('should calculate R² (coefficient of determination)', () => {
      const data = [10, 12, 14, 16, 18];
      const result = linearRegression(data);

      expect(result.r_squared).toBeGreaterThan(0.95); // Very high correlation
    });

    it('should format equation correctly', () => {
      const data = [10, 12, 14, 16, 18];
      const result = linearRegression(data);

      expect(result.equation).toContain('y = ');
      expect(result.equation).toContain('x');
      expect(result.equation).toMatch(/\d+\.\d+/); // Contains decimal numbers
    });
  });

  describe('Edge Cases', () => {
    it('should handle single data point', () => {
      const data = [10];
      const result = linearRegression(data);

      expect(result.slope).toBe(0);
      expect(result.intercept).toBe(0);
      expect(result.r_squared).toBe(0);
      expect(result.predictions).toEqual([10]);
    });

    it('should handle two data points', () => {
      const data = [10, 20];
      const result = linearRegression(data);

      expect(result.slope).toBeCloseTo(10, 1);
      expect(result.r_squared).toBeCloseTo(1.0, 2); // Perfect fit for 2 points
    });

    it('should handle horizontal line (zero slope)', () => {
      const data = [10, 10, 10, 10, 10];
      const result = linearRegression(data);

      expect(result.slope).toBeCloseTo(0, 5);
      expect(result.intercept).toBeCloseTo(10, 1);
    });

    it('should handle negative slope', () => {
      const data = [20, 15, 10, 5, 0];
      const result = linearRegression(data);

      expect(result.slope).toBeLessThan(0);
      expect(result.r_squared).toBeGreaterThan(0.95);
    });

    it('should handle noisy data (lower R²)', () => {
      const data = [10, 15, 12, 18, 14, 20, 16];
      const result = linearRegression(data);

      expect(result.r_squared).toBeLessThan(1.0);
      expect(result.r_squared).toBeGreaterThan(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// EXPONENTIAL SMOOTHING & FORECASTING
// ═══════════════════════════════════════════════════════════════════

describe('exponentialSmoothing', () => {
  describe('Happy Path', () => {
    it('should generate 7-day forecast by default', () => {
      const data: DataPoint[] = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 105 },
        { date: '2024-01-03', value: 110 },
      ];

      const result = exponentialSmoothing(data);

      expect(result.predictions.length).toBe(7);
      expect(result.model_type).toBe('exponential_smoothing');
    });

    it('should generate custom number of forecast periods', () => {
      const data: DataPoint[] = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 105 },
      ];

      const result = exponentialSmoothing(data, 14, 0.3);

      expect(result.predictions.length).toBe(14);
    });

    it('should include confidence intervals for each prediction', () => {
      const data: DataPoint[] = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 105 },
        { date: '2024-01-03', value: 110 },
      ];

      const result = exponentialSmoothing(data, 3, 0.3);

      result.predictions.forEach(pred => {
        expect(pred.confidence_interval).toHaveLength(2);
        expect(pred.confidence_interval[0]).toBeLessThan(pred.value);
        expect(pred.confidence_interval[1]).toBeGreaterThan(pred.value);
      });
    });

    it('should include accuracy metrics', () => {
      const data: DataPoint[] = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 105 },
        { date: '2024-01-03', value: 110 },
      ];

      const result = exponentialSmoothing(data);

      expect(result.accuracy_metrics.mae).toBeGreaterThanOrEqual(0);
      expect(result.accuracy_metrics.rmse).toBeGreaterThanOrEqual(0);
      expect(result.accuracy_metrics.mape).toBeGreaterThanOrEqual(0);
    });

    it('should use alpha parameter for smoothing', () => {
      const data: DataPoint[] = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 200 },
      ];

      const result_low_alpha = exponentialSmoothing(data, 3, 0.1);
      const result_high_alpha = exponentialSmoothing(data, 3, 0.9);

      // High alpha reacts faster to changes
      expect(result_high_alpha.predictions[0].value).toBeGreaterThan(
        result_low_alpha.predictions[0].value
      );
    });

    it('should ensure non-negative forecasts', () => {
      const data: DataPoint[] = [
        { date: '2024-01-01', value: 5 },
        { date: '2024-01-02', value: 3 },
        { date: '2024-01-03', value: 1 },
      ];

      const result = exponentialSmoothing(data, 5, 0.3);

      result.predictions.forEach(pred => {
        expect(pred.value).toBeGreaterThanOrEqual(0);
        expect(pred.confidence_interval[0]).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Confidence Intervals', () => {
    it('should widen confidence intervals for longer forecast horizons', () => {
      const data: DataPoint[] = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 105 },
        { date: '2024-01-03', value: 110 },
      ];

      const result = exponentialSmoothing(data, 5, 0.3);

      const width_first = result.predictions[0].confidence_interval[1] -
                          result.predictions[0].confidence_interval[0];
      const width_last = result.predictions[4].confidence_interval[1] -
                         result.predictions[4].confidence_interval[0];

      expect(width_last).toBeGreaterThan(width_first);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single data point', () => {
      const data: DataPoint[] = [
        { date: '2024-01-01', value: 100 },
      ];

      const result = exponentialSmoothing(data);

      expect(result.predictions).toEqual([]);
      expect(result.accuracy_metrics.mae).toBe(0);
    });

    it('should handle empty array', () => {
      const data: DataPoint[] = [];

      const result = exponentialSmoothing(data);

      expect(result.predictions).toEqual([]);
      expect(result.model_type).toBe('exponential_smoothing');
    });

    it('should use default alpha of 0.3', () => {
      const data: DataPoint[] = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 110 },
      ];

      const result1 = exponentialSmoothing(data, 3);
      const result2 = exponentialSmoothing(data, 3, 0.3);

      expect(result1.predictions[0].value).toBeCloseTo(result2.predictions[0].value, 2);
    });
  });

  describe('Date Handling', () => {
    it('should generate correct future dates', () => {
      const data: DataPoint[] = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 105 },
      ];

      const result = exponentialSmoothing(data, 3, 0.3);

      expect(result.predictions[0].date).toBe('2024-01-03');
      expect(result.predictions[1].date).toBe('2024-01-04');
      expect(result.predictions[2].date).toBe('2024-01-05');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// CONFIDENCE INTERVAL CALCULATIONS
// ═══════════════════════════════════════════════════════════════════

describe('calculateConfidenceInterval', () => {
  describe('Happy Path', () => {
    it('should calculate 95% confidence intervals by default', () => {
      const predictions = [100, 110, 120];
      const historicalData = [95, 100, 105, 110];

      const intervals = calculateConfidenceInterval(predictions, 0.95, historicalData);

      expect(intervals.length).toBe(predictions.length);
      intervals.forEach((interval, idx) => {
        expect(interval[0]).toBeLessThan(predictions[idx]);
        expect(interval[1]).toBeGreaterThan(predictions[idx]);
      });
    });

    it('should calculate 99% confidence intervals (wider)', () => {
      const predictions = [100, 110, 120];
      const historicalData = [95, 100, 105, 110];

      const intervals_95 = calculateConfidenceInterval(predictions, 0.95, historicalData);
      const intervals_99 = calculateConfidenceInterval(predictions, 0.99, historicalData);

      const width_95 = intervals_95[0][1] - intervals_95[0][0];
      const width_99 = intervals_99[0][1] - intervals_99[0][0];

      expect(width_99).toBeGreaterThan(width_95);
    });

    it('should widen intervals with forecast horizon', () => {
      const predictions = [100, 110, 120];
      const historicalData = [95, 100, 105];

      const intervals = calculateConfidenceInterval(predictions, 0.95, historicalData);

      const width_first = intervals[0][1] - intervals[0][0];
      const width_last = intervals[2][1] - intervals[2][0];

      expect(width_last).toBeGreaterThan(width_first);
    });

    it('should ensure non-negative lower bounds', () => {
      const predictions = [5, 4, 3];
      const historicalData = [10, 8, 6, 4];

      const intervals = calculateConfidenceInterval(predictions, 0.95, historicalData);

      intervals.forEach(interval => {
        expect(interval[0]).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty historical data', () => {
      const predictions = [100, 110, 120];

      const intervals = calculateConfidenceInterval(predictions, 0.95, []);

      expect(intervals.length).toBe(predictions.length);
    });

    it('should handle single prediction', () => {
      const predictions = [100];
      const historicalData = [95, 100, 105];

      const intervals = calculateConfidenceInterval(predictions, 0.95, historicalData);

      expect(intervals.length).toBe(1);
      expect(intervals[0][0]).toBeLessThan(100);
      expect(intervals[0][1]).toBeGreaterThan(100);
    });

    it('should use predictions for std dev if no historical data', () => {
      const predictions = [100, 110, 120, 130];

      const intervals = calculateConfidenceInterval(predictions, 0.95);

      expect(intervals.length).toBe(predictions.length);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// PERFORMANCE TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Performance Tests', () => {
  it('should calculate moving average for large dataset efficiently', () => {
    const data = Array.from({ length: 10000 }, (_, i) => i);

    const startTime = Date.now();
    calculateMovingAverage(data, 30);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(1000); // <1 second
  });

  it('should detect anomalies in large dataset efficiently', () => {
    const data: DataPoint[] = Array.from({ length: 1000 }, (_, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      value: 100 + Math.random() * 10,
    }));

    const startTime = Date.now();
    detectAnomalies(data, 2);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(500); // <500ms
  });

  it('should perform linear regression on large dataset efficiently', () => {
    const data = Array.from({ length: 10000 }, (_, i) => i * 2 + Math.random());

    const startTime = Date.now();
    linearRegression(data);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(500); // <500ms
  });
});
