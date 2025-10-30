/**
 * TrendsDashboard Component
 *
 * Advanced analytics dashboard showing historical trends, statistical analysis,
 * and ML-powered forecasts. Enables data-driven decision-making by revealing
 * patterns, anomalies, and predicted future scenarios.
 */

'use client';

import React, { useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import {
  calculateMovingAverage,
  calculateGrowthRate,
  detectAnomalies,
  linearRegression,
  exponentialSmoothing,
  DataPoint,
} from '@/lib/trends';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SimulationResult {
  date: string;
  energy_demand_kwh?: number;
  water_demand_m3?: number;
  crop_yield_kg?: number;
  stress?: number;
}

interface TrendsDashboardProps {
  simulationType: 'energy' | 'water' | 'agriculture';
  historicalData: SimulationResult[];
  language?: 'en' | 'es';
}

export function TrendsDashboard({
  simulationType,
  historicalData,
  language = 'en',
}: TrendsDashboardProps) {
  const [forecastDays, setForecastDays] = useState(7);
  const [showConfidenceInterval, setShowConfidenceInterval] = useState(true);

  const labels = {
    title: { en: 'Trends & ML Predictions', es: 'Tendencias y Predicciones ML' },
    historicalChart: { en: 'Historical Analysis', es: 'Análisis Histórico' },
    forecastChart: { en: 'ML Forecast', es: 'Pronóstico ML' },
    statistics: { en: 'Trend Statistics', es: 'Estadísticas de Tendencia' },
    avgValue: { en: 'Average Value', es: 'Valor Promedio' },
    growthRate: { en: 'Growth Rate', es: 'Tasa de Crecimiento' },
    anomaliesDetected: { en: 'Anomalies', es: 'Anomalías' },
    trendDirection: { en: 'Trend', es: 'Tendencia' },
    forecastAccuracy: { en: 'Forecast Accuracy', es: 'Precisión del Pronóstico' },
    mae: { en: 'MAE', es: 'Error Absoluto Medio' },
    rmse: { en: 'RMSE', es: 'Error Cuadrático Medio' },
    mape: { en: 'MAPE', es: 'Error Porcentual Medio' },
    rSquared: { en: 'R² Score', es: 'Puntuación R²' },
    forecastPeriod: { en: 'Forecast Period', es: 'Período de Pronóstico' },
    days: { en: 'days', es: 'días' },
    showCI: { en: 'Show Confidence Interval', es: 'Mostrar Intervalo de Confianza' },
    increasing: { en: 'Increasing', es: 'Creciente' },
    decreasing: { en: 'Decreasing', es: 'Decreciente' },
    stable: { en: 'Stable', es: 'Estable' },
    noData: { en: 'No historical data available', es: 'No hay datos históricos disponibles' },
    exportCSV: { en: 'Export CSV', es: 'Exportar CSV' },
    exportPNG: { en: 'Export PNG', es: 'Exportar PNG' },
  };

  // Extract metric based on simulation type
  const dataPoints: DataPoint[] = useMemo(() => {
    return historicalData.map((d) => {
      let value = 0;
      if (simulationType === 'energy') {
        value = d.energy_demand_kwh || 0;
      } else if (simulationType === 'water') {
        value = d.water_demand_m3 || 0;
      } else if (simulationType === 'agriculture') {
        value = d.crop_yield_kg || 0;
      }
      return { date: d.date, value };
    });
  }, [historicalData, simulationType]);

  // Calculate analytics
  const analytics = useMemo(() => {
    if (dataPoints.length < 2) {
      return null;
    }

    const values = dataPoints.map((d) => d.value);

    // Moving averages
    const ma = calculateMovingAverage(values, Math.min(7, dataPoints.length));

    // Growth rate
    const growth = calculateGrowthRate(values);

    // Anomaly detection
    const anomalies = detectAnomalies(dataPoints, 2);

    // Linear regression
    const regression = linearRegression(values);

    // Exponential smoothing forecast
    const forecast = exponentialSmoothing(dataPoints, forecastDays, 0.3);

    // Calculate average value
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;

    return {
      movingAverage: ma,
      growth,
      anomalies,
      regression,
      forecast,
      avgValue,
    };
  }, [dataPoints, forecastDays]);

  // Empty state
  if (!historicalData || historicalData.length < 2) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="text-center">
          <div className="text-6xl mb-4">📈</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{labels.title[language]}</h3>
          <p className="text-gray-600">{labels.noData[language]}</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  // Historical Chart Data
  const historicalChartData = {
    labels: dataPoints.map((d) => new Date(d.date).toLocaleDateString(language === 'es' ? 'es-SV' : 'en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: language === 'en' ? 'Actual Data' : 'Datos Reales',
        data: dataPoints.map((d) => d.value),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: language === 'en' ? '7-Day Moving Avg' : 'Promedio Móvil 7 días',
        data: analytics.movingAverage.simple,
        borderColor: 'rgb(251, 146, 60)',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: language === 'en' ? 'Exponential MA' : 'Promedio Exponencial',
        data: analytics.movingAverage.exponential,
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [10, 5],
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  // Forecast Chart Data
  const forecastChartData = {
    labels: [
      ...dataPoints.slice(-7).map((d) => new Date(d.date).toLocaleDateString(language === 'es' ? 'es-SV' : 'en-US', { month: 'short', day: 'numeric' })),
      ...analytics.forecast.predictions.map((d) =>
        new Date(d.date).toLocaleDateString(language === 'es' ? 'es-SV' : 'en-US', { month: 'short', day: 'numeric' })
      ),
    ],
    datasets: [
      {
        label: language === 'en' ? 'Historical' : 'Histórico',
        data: [...dataPoints.slice(-7).map((d) => d.value), ...Array(forecastDays).fill(null)],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 4,
      },
      {
        label: language === 'en' ? 'ML Forecast' : 'Pronóstico ML',
        data: [
          ...Array(7).fill(null),
          ...analytics.forecast.predictions.map((d) => d.value),
        ],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 3,
        borderDash: [5, 5],
        tension: 0.4,
        pointRadius: 5,
        pointStyle: 'rectRot',
      },
      ...(showConfidenceInterval
        ? [
            {
              label: language === 'en' ? '95% Confidence Upper' : 'IC 95% Superior',
              data: [
                ...Array(7).fill(null),
                ...analytics.forecast.predictions.map((d) => d.confidence_interval[1]),
              ],
              borderColor: 'rgba(34, 197, 94, 0.3)',
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderDash: [2, 2],
              tension: 0.4,
              pointRadius: 0,
              fill: false,
            },
            {
              label: language === 'en' ? '95% Confidence Lower' : 'IC 95% Inferior',
              data: [
                ...Array(7).fill(null),
                ...analytics.forecast.predictions.map((d) => d.confidence_interval[0]),
              ],
              borderColor: 'rgba(34, 197, 94, 0.3)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              borderWidth: 1,
              borderDash: [2, 2],
              tension: 0.4,
              pointRadius: 0,
              fill: '-1',
            },
          ]
        : []),
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(2);
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Value', 'Forecast', 'CI Lower', 'CI Upper'];
    const rows = [
      ...dataPoints.map((d) => [d.date, d.value.toString(), '', '', '']),
      ...analytics.forecast.predictions.map((d) => [
        d.date,
        '',
        d.value.toString(),
        d.confidence_interval[0].toString(),
        d.confidence_interval[1].toString(),
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `worldsim_trends_${simulationType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{labels.title[language]}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {historicalData.length} {language === 'en' ? 'data points analyzed' : 'puntos de datos analizados'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            📊 {labels.exportCSV[language]}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Value */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border-2 border-blue-300">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📊</span>
            <h4 className="font-bold text-blue-900 text-sm">{labels.avgValue[language]}</h4>
          </div>
          <p className="text-2xl font-bold text-blue-700">{analytics.avgValue.toFixed(1)}</p>
          <p className="text-xs text-blue-600 mt-1">
            {simulationType === 'energy' ? 'kWh' : simulationType === 'water' ? 'm³' : 'kg'}
          </p>
        </div>

        {/* Growth Rate */}
        <div className={`bg-gradient-to-br rounded-lg p-5 border-2 ${
          analytics.growth.trend_direction === 'increasing'
            ? 'from-green-50 to-green-100 border-green-300'
            : analytics.growth.trend_direction === 'decreasing'
            ? 'from-red-50 to-red-100 border-red-300'
            : 'from-gray-50 to-gray-100 border-gray-300'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">
              {analytics.growth.trend_direction === 'increasing' ? '📈' : analytics.growth.trend_direction === 'decreasing' ? '📉' : '➡️'}
            </span>
            <h4 className={`font-bold text-sm ${
              analytics.growth.trend_direction === 'increasing'
                ? 'text-green-900'
                : analytics.growth.trend_direction === 'decreasing'
                ? 'text-red-900'
                : 'text-gray-900'
            }`}>
              {labels.growthRate[language]}
            </h4>
          </div>
          <p className={`text-2xl font-bold ${
            analytics.growth.trend_direction === 'increasing'
              ? 'text-green-700'
              : analytics.growth.trend_direction === 'decreasing'
              ? 'text-red-700'
              : 'text-gray-700'
          }`}>
            {(analytics.growth.overall * 100).toFixed(1)}%
          </p>
          <p className={`text-xs mt-1 ${
            analytics.growth.trend_direction === 'increasing'
              ? 'text-green-600'
              : analytics.growth.trend_direction === 'decreasing'
              ? 'text-red-600'
              : 'text-gray-600'
          }`}>
            {labels[analytics.growth.trend_direction][language]}
          </p>
        </div>

        {/* Anomalies */}
        <div className={`bg-gradient-to-br rounded-lg p-5 border-2 ${
          analytics.anomalies.length > 0
            ? 'from-orange-50 to-orange-100 border-orange-300'
            : 'from-gray-50 to-gray-100 border-gray-300'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">⚠️</span>
            <h4 className={`font-bold text-sm ${
              analytics.anomalies.length > 0 ? 'text-orange-900' : 'text-gray-900'
            }`}>
              {labels.anomaliesDetected[language]}
            </h4>
          </div>
          <p className={`text-2xl font-bold ${
            analytics.anomalies.length > 0 ? 'text-orange-700' : 'text-gray-700'
          }`}>
            {analytics.anomalies.length}
          </p>
          <p className={`text-xs mt-1 ${
            analytics.anomalies.length > 0 ? 'text-orange-600' : 'text-gray-600'
          }`}>
            {analytics.anomalies.filter((a) => a.severity === 'high').length}{' '}
            {language === 'en' ? 'high severity' : 'alta severidad'}
          </p>
        </div>

        {/* R² Score */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-5 border-2 border-purple-300">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🎯</span>
            <h4 className="font-bold text-purple-900 text-sm">{labels.rSquared[language]}</h4>
          </div>
          <p className="text-2xl font-bold text-purple-700">
            {(analytics.regression.r_squared * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-purple-600 mt-1">
            {analytics.regression.r_squared > 0.8
              ? language === 'en'
                ? 'Excellent fit'
                : 'Excelente ajuste'
              : analytics.regression.r_squared > 0.5
              ? language === 'en'
                ? 'Good fit'
                : 'Buen ajuste'
              : language === 'en'
              ? 'Fair fit'
              : 'Ajuste aceptable'}
          </p>
        </div>
      </div>

      {/* Historical Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{labels.historicalChart[language]}</h3>
        <div className="h-80">
          <Line data={historicalChartData} options={chartOptions} />
        </div>
      </div>

      {/* Forecast Controls */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">{labels.forecastChart[language]}</h3>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={showConfidenceInterval}
                onChange={(e) => setShowConfidenceInterval(e.target.checked)}
                className="rounded border-gray-300"
              />
              {labels.showCI[language]}
            </label>
            <select
              value={forecastDays}
              onChange={(e) => setForecastDays(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value={3}>3 {labels.days[language]}</option>
              <option value={7}>7 {labels.days[language]}</option>
              <option value={14}>14 {labels.days[language]}</option>
              <option value={30}>30 {labels.days[language]}</option>
            </select>
          </div>
        </div>

        {/* Forecast Chart */}
        <div className="h-80 bg-white rounded-lg p-4">
          <Line data={forecastChartData} options={chartOptions} />
        </div>

        {/* Forecast Accuracy Metrics */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <p className="text-xs text-gray-600 mb-1">{labels.mae[language]}</p>
            <p className="text-lg font-bold text-gray-900">
              {analytics.forecast.accuracy_metrics.mae.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <p className="text-xs text-gray-600 mb-1">{labels.rmse[language]}</p>
            <p className="text-lg font-bold text-gray-900">
              {analytics.forecast.accuracy_metrics.rmse.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <p className="text-xs text-gray-600 mb-1">{labels.mape[language]}</p>
            <p className="text-lg font-bold text-gray-900">
              {analytics.forecast.accuracy_metrics.mape.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Anomalies Table */}
      {analytics.anomalies.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {language === 'en' ? 'Detected Anomalies' : 'Anomalías Detectadas'}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    {language === 'en' ? 'Date' : 'Fecha'}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                    {language === 'en' ? 'Value' : 'Valor'}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                    {language === 'en' ? 'Expected' : 'Esperado'}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                    {language === 'en' ? 'Deviation' : 'Desviación'}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                    {language === 'en' ? 'Severity' : 'Severidad'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.anomalies.map((anomaly, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {new Date(anomaly.date).toLocaleDateString(language === 'es' ? 'es-SV' : 'en-US')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                      {anomaly.value.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                      {anomaly.expected.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <span className={anomaly.deviation > 0 ? 'text-red-600' : 'text-green-600'}>
                        {anomaly.deviation > 0 ? '+' : ''}
                        {anomaly.deviation.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          anomaly.severity === 'high'
                            ? 'bg-red-100 text-red-800'
                            : anomaly.severity === 'medium'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {anomaly.severity.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
