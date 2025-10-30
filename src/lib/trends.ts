/**
 * Statistical Analysis and ML Prediction Library for WorldSim
 *
 * Provides time series analysis, anomaly detection, and forecasting
 * capabilities for simulation data. Used by TrendsDashboard to show
 * historical patterns and predict future scenarios.
 */

export interface DataPoint {
  date: string;
  value: number;
}

export interface MovingAverageResult {
  simple: number[];
  exponential: number[];
}

export interface GrowthRateResult {
  overall: number;
  period_over_period: number[];
  average_daily: number;
  trend_direction: 'increasing' | 'decreasing' | 'stable';
}

export interface Anomaly {
  date: string;
  value: number;
  expected: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
  z_score: number;
}

export interface RegressionResult {
  slope: number;
  intercept: number;
  r_squared: number;
  predictions: number[];
  equation: string;
}

export interface ForecastResult {
  predictions: Array<{
    date: string;
    value: number;
    confidence_interval: [number, number];
  }>;
  model_type: 'exponential_smoothing' | 'linear_regression';
  accuracy_metrics: {
    mae: number; // Mean Absolute Error
    rmse: number; // Root Mean Squared Error
    mape: number; // Mean Absolute Percentage Error
  };
}

/**
 * Calculate Simple Moving Average (SMA) and Exponential Moving Average (EMA)
 *
 * @param data - Array of numerical values
 * @param windowSize - Number of periods for averaging (default: 7)
 * @returns Object with simple and exponential moving averages
 *
 * @example
 * const data = [10, 12, 15, 14, 16, 18, 20];
 * const ma = calculateMovingAverage(data, 3);
 * // ma.simple = [NaN, NaN, 12.33, 13.67, 15, 16, 18]
 */
export function calculateMovingAverage(
  data: number[],
  windowSize: number = 7
): MovingAverageResult {
  const simple: number[] = [];
  const exponential: number[] = [];

  // Calculate Simple Moving Average
  for (let i = 0; i < data.length; i++) {
    if (i < windowSize - 1) {
      simple.push(NaN);
    } else {
      const window = data.slice(i - windowSize + 1, i + 1);
      const avg = window.reduce((sum, val) => sum + val, 0) / windowSize;
      simple.push(avg);
    }
  }

  // Calculate Exponential Moving Average
  // EMA = α * current + (1 - α) * previous_EMA
  const alpha = 2 / (windowSize + 1);
  exponential[0] = data[0]; // First value is just the data point

  for (let i = 1; i < data.length; i++) {
    const ema = alpha * data[i] + (1 - alpha) * exponential[i - 1];
    exponential.push(ema);
  }

  return { simple, exponential };
}

/**
 * Calculate growth rate metrics for time series data
 *
 * @param data - Array of numerical values
 * @returns Growth rate analysis including overall, period-over-period, and trend direction
 *
 * @example
 * const data = [100, 110, 115, 120];
 * const growth = calculateGrowthRate(data);
 * // growth.overall = 0.20 (20% total growth)
 * // growth.trend_direction = 'increasing'
 */
export function calculateGrowthRate(data: number[]): GrowthRateResult {
  if (data.length < 2) {
    return {
      overall: 0,
      period_over_period: [],
      average_daily: 0,
      trend_direction: 'stable',
    };
  }

  // Overall growth rate: (final - initial) / initial
  const overall = (data[data.length - 1] - data[0]) / data[0];

  // Period-over-period growth rates
  const period_over_period: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const growth = data[i - 1] !== 0 ? (data[i] - data[i - 1]) / data[i - 1] : 0;
    period_over_period.push(growth);
  }

  // Average daily growth rate
  const average_daily =
    period_over_period.reduce((sum, val) => sum + val, 0) / period_over_period.length;

  // Trend direction based on linear regression slope
  let trend_direction: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (Math.abs(average_daily) > 0.01) {
    // 1% threshold
    trend_direction = average_daily > 0 ? 'increasing' : 'decreasing';
  }

  return {
    overall,
    period_over_period,
    average_daily,
    trend_direction,
  };
}

/**
 * Detect anomalies in time series data using z-score method
 *
 * @param data - Array of data points with date and value
 * @param threshold - Z-score threshold for anomaly detection (default: 2)
 * @returns Array of detected anomalies with severity ratings
 *
 * @example
 * const data = [{ date: '2024-01-01', value: 100 }, ...];
 * const anomalies = detectAnomalies(data, 2.5);
 */
export function detectAnomalies(data: DataPoint[], threshold: number = 2): Anomaly[] {
  if (data.length < 3) return [];

  const values = data.map((d) => d.value);

  // Calculate mean and standard deviation
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // Detect anomalies using z-score
  const anomalies: Anomaly[] = [];

  for (let i = 0; i < data.length; i++) {
    const z_score = stdDev !== 0 ? (data[i].value - mean) / stdDev : 0;

    if (Math.abs(z_score) > threshold) {
      let severity: 'low' | 'medium' | 'high';
      if (Math.abs(z_score) > threshold * 2) {
        severity = 'high';
      } else if (Math.abs(z_score) > threshold * 1.5) {
        severity = 'medium';
      } else {
        severity = 'low';
      }

      anomalies.push({
        date: data[i].date,
        value: data[i].value,
        expected: mean,
        deviation: data[i].value - mean,
        severity,
        z_score,
      });
    }
  }

  return anomalies;
}

/**
 * Perform linear regression on time series data
 *
 * @param data - Array of numerical values (y-values, x is index)
 * @returns Regression results with slope, intercept, R², and predictions
 *
 * @example
 * const data = [10, 12, 14, 16, 18];
 * const regression = linearRegression(data);
 * // regression.slope = 2
 * // regression.r_squared = 1.0 (perfect fit)
 */
export function linearRegression(data: number[]): RegressionResult {
  const n = data.length;
  if (n < 2) {
    return {
      slope: 0,
      intercept: 0,
      r_squared: 0,
      predictions: data,
      equation: 'y = 0',
    };
  }

  // Create x values (time indices)
  const x = Array.from({ length: n }, (_, i) => i);
  const y = data;

  // Calculate means
  const meanX = x.reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;

  // Calculate slope and intercept using least squares
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (x[i] - meanX) * (y[i] - meanY);
    denominator += Math.pow(x[i] - meanX, 2);
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = meanY - slope * meanX;

  // Generate predictions
  const predictions = x.map((xi) => slope * xi + intercept);

  // Calculate R² (coefficient of determination)
  const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);
  const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - predictions[i], 2), 0);
  const r_squared = ssTot !== 0 ? 1 - ssRes / ssTot : 0;

  // Format equation
  const equation = `y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`;

  return {
    slope,
    intercept,
    r_squared,
    predictions,
    equation,
  };
}

/**
 * Forecast future values using exponential smoothing
 *
 * @param data - Historical data points with dates and values
 * @param forecastPeriods - Number of periods to forecast (default: 7)
 * @param alpha - Smoothing parameter 0-1 (default: 0.3)
 * @returns Forecast results with predictions and confidence intervals
 *
 * @example
 * const data = [{ date: '2024-01-01', value: 100 }, ...];
 * const forecast = exponentialSmoothing(data, 7, 0.3);
 */
export function exponentialSmoothing(
  data: DataPoint[],
  forecastPeriods: number = 7,
  alpha: number = 0.3
): ForecastResult {
  if (data.length < 2) {
    return {
      predictions: [],
      model_type: 'exponential_smoothing',
      accuracy_metrics: { mae: 0, rmse: 0, mape: 0 },
    };
  }

  const values = data.map((d) => d.value);

  // Calculate smoothed values for historical data
  const smoothed: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    smoothed[i] = alpha * values[i] + (1 - alpha) * smoothed[i - 1];
  }

  // Calculate trend component (simple linear trend)
  const trend = linearRegression(smoothed);
  const trendPerPeriod = trend.slope;

  // Generate forecasts
  const predictions: ForecastResult['predictions'] = [];
  const lastDate = new Date(data[data.length - 1].date);
  const lastSmoothed = smoothed[smoothed.length - 1];

  for (let i = 1; i <= forecastPeriods; i++) {
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + i);

    // Forecast = last smoothed value + trend * periods ahead
    const forecastValue = lastSmoothed + trendPerPeriod * i;

    // Calculate confidence interval (95% = ±1.96 * std error)
    const stdError = calculateStandardError(values, smoothed);
    const marginOfError = 1.96 * stdError * Math.sqrt(i); // Increases with forecast horizon

    predictions.push({
      date: forecastDate.toISOString().split('T')[0],
      value: Math.max(0, forecastValue), // Ensure non-negative
      confidence_interval: [
        Math.max(0, forecastValue - marginOfError),
        forecastValue + marginOfError,
      ],
    });
  }

  // Calculate accuracy metrics on historical data
  const mae = calculateMAE(values, smoothed);
  const rmse = calculateRMSE(values, smoothed);
  const mape = calculateMAPE(values, smoothed);

  return {
    predictions,
    model_type: 'exponential_smoothing',
    accuracy_metrics: { mae, rmse, mape },
  };
}

/**
 * Calculate confidence interval for predictions
 *
 * @param predictions - Array of predicted values
 * @param confidence - Confidence level (default: 0.95 for 95%)
 * @param historicalData - Historical data for calculating std deviation
 * @returns Array of [lower_bound, upper_bound] tuples
 */
export function calculateConfidenceInterval(
  predictions: number[],
  confidence: number = 0.95,
  historicalData: number[] = []
): Array<[number, number]> {
  // Calculate standard deviation from historical data
  const mean =
    historicalData.length > 0
      ? historicalData.reduce((sum, val) => sum + val, 0) / historicalData.length
      : predictions.reduce((sum, val) => sum + val, 0) / predictions.length;

  const dataForStd = historicalData.length > 0 ? historicalData : predictions;
  const variance =
    dataForStd.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / dataForStd.length;
  const stdDev = Math.sqrt(variance);

  // Z-score for confidence level (95% = 1.96, 99% = 2.576)
  const zScore = confidence === 0.99 ? 2.576 : 1.96;

  return predictions.map((pred, index) => {
    // Margin of error increases with forecast horizon
    const marginOfError = zScore * stdDev * Math.sqrt(index + 1);
    return [Math.max(0, pred - marginOfError), pred + marginOfError];
  });
}

/**
 * Helper: Calculate Mean Absolute Error
 */
function calculateMAE(actual: number[], predicted: number[]): number {
  const n = Math.min(actual.length, predicted.length);
  const sum = actual
    .slice(0, n)
    .reduce((acc, val, i) => acc + Math.abs(val - predicted[i]), 0);
  return sum / n;
}

/**
 * Helper: Calculate Root Mean Squared Error
 */
function calculateRMSE(actual: number[], predicted: number[]): number {
  const n = Math.min(actual.length, predicted.length);
  const sumSquares = actual
    .slice(0, n)
    .reduce((acc, val, i) => acc + Math.pow(val - predicted[i], 2), 0);
  return Math.sqrt(sumSquares / n);
}

/**
 * Helper: Calculate Mean Absolute Percentage Error
 */
function calculateMAPE(actual: number[], predicted: number[]): number {
  const n = Math.min(actual.length, predicted.length);
  let sum = 0;
  let count = 0;

  for (let i = 0; i < n; i++) {
    if (actual[i] !== 0) {
      sum += Math.abs((actual[i] - predicted[i]) / actual[i]);
      count++;
    }
  }

  return count > 0 ? (sum / count) * 100 : 0;
}

/**
 * Helper: Calculate Standard Error
 */
function calculateStandardError(actual: number[], predicted: number[]): number {
  const n = Math.min(actual.length, predicted.length);
  if (n < 2) return 0;

  const sumSquaredErrors = actual
    .slice(0, n)
    .reduce((acc, val, i) => acc + Math.pow(val - predicted[i], 2), 0);

  return Math.sqrt(sumSquaredErrors / (n - 1));
}
