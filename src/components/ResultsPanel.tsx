'use client';

import { SimulationResponse } from '@/lib/types';
import { StressChart } from './Charts';

interface ResultsPanelProps {
  /** Simulation results to display */
  results?: SimulationResponse | null;
  /** Loading state */
  isLoading?: boolean;
  /** Language for labels (EN/ES) */
  language?: 'en' | 'es';
}

/**
 * Mock simulation data for demonstration
 */
const MOCK_RESULTS: SimulationResponse = {
  daily_results: [
    { date: '2024-01-01', region_id: 'SS', region_name: 'San Salvador', demand: 1250, supply: 1100, stress: 1.14 },
    { date: '2024-01-02', region_id: 'SS', region_name: 'San Salvador', demand: 1280, supply: 1120, stress: 1.14 },
    { date: '2024-01-01', region_id: 'SM', region_name: 'San Miguel', demand: 890, supply: 820, stress: 1.09 },
    { date: '2024-01-02', region_id: 'SM', region_name: 'San Miguel', demand: 910, supply: 840, stress: 1.08 },
  ],
  summary: {
    avg_stress: 0.95,
    max_stress: 1.25,
    top_stressed_regions: [
      { region_id: 'SS', region_name: 'San Salvador', avg_stress: 1.15 },
      { region_id: 'SM', region_name: 'San Miguel', avg_stress: 1.08 },
      { region_id: 'LI', region_name: 'La Libertad', avg_stress: 1.05 },
      { region_id: 'SA', region_name: 'Santa Ana', avg_stress: 0.98 },
      { region_id: 'SO', region_name: 'Sonsonate', avg_stress: 0.92 },
    ],
  },
};

/**
 * ResultsPanel Component
 *
 * Displays simulation results including:
 * - Summary statistics (average stress, peak stress, high-stress days)
 * - Line chart placeholder for stress over time
 * - Top 5 stressed regions table
 * - Export buttons (CSV, PNG)
 *
 * @example
 * <ResultsPanel
 *   results={simulationResults}
 *   isLoading={false}
 *   language="en"
 * />
 */
export function ResultsPanel({
  results,
  isLoading = false,
  language = 'en',
}: ResultsPanelProps) {
  const labels = {
    title: { en: 'Simulation Results', es: 'Resultados de Simulación' },
    subtitle: { en: 'Analysis of infrastructure stress across regions', es: 'Análisis del estrés de infraestructura en regiones' },
    summaryTitle: { en: 'Summary Statistics', es: 'Estadísticas Resumidas' },
    avgStress: { en: 'Average Stress', es: 'Estrés Promedio' },
    peakStress: { en: 'Peak Stress', es: 'Estrés Máximo' },
    highStressDays: { en: 'High-Stress Days', es: 'Días de Alto Estrés' },
    chartTitle: { en: 'Infrastructure Stress Over Time', es: 'Estrés de Infraestructura en el Tiempo' },
    topRegionsTitle: { en: 'Top 5 Stressed Regions', es: 'Top 5 Regiones con Mayor Estrés' },
    regionName: { en: 'Region', es: 'Región' },
    avgStressCol: { en: 'Avg Stress', es: 'Estrés Prom.' },
    peakStressCol: { en: 'Peak Stress', es: 'Estrés Máx.' },
    exportCSV: { en: 'Export CSV', es: 'Exportar CSV' },
    exportPNG: { en: 'Export PNG', es: 'Exportar PNG' },
    loading: { en: 'Running simulation...', es: 'Ejecutando simulación...' },
    noResults: {
      en: 'No results yet. Run a simulation to see analysis.',
      es: 'Sin resultados aún. Ejecute una simulación para ver el análisis.',
    },
    stressThreshold: { en: 'Stress threshold: 1.0 = capacity matched', es: 'Umbral de estrés: 1.0 = capacidad igualada' },
  };

  // Use mock data for demonstration
  const displayResults = results || MOCK_RESULTS;

  // Calculate high-stress days (stress > 1.0)
  const highStressDays = displayResults.daily_results.filter(r => r.stress > 1.0).length;

  // Loading State
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="animate-pulse space-y-6">
          {/* Header skeleton */}
          <div>
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>

          {/* Summary stats skeleton */}
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-50 rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>

          {/* Chart skeleton */}
          <div className="h-64 bg-gray-100 rounded-lg"></div>

          {/* Table skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-gray-50 rounded"></div>
            ))}
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">{labels.loading[language]}</p>
        </div>
      </div>
    );
  }

  // Empty State
  if (!results) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {language === 'en' ? 'No Results' : 'Sin Resultados'}
          </h3>
          <p className="text-sm text-gray-500 text-center max-w-md">
            {labels.noResults[language]}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">{labels.title[language]}</h2>
        <p className="text-sm text-gray-500 mt-1">{labels.subtitle[language]}</p>
      </div>

      <div className="space-y-6">
        {/* Summary Statistics */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {labels.summaryTitle[language]}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Average Stress */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">
                {labels.avgStress[language]}
              </p>
              <p className="text-3xl font-bold text-blue-900">
                {(displayResults.summary.avg_stress * 100).toFixed(1)}%
              </p>
              <div className="mt-2 flex items-center">
                <div className="flex-1 bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min(displayResults.summary.avg_stress * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Peak Stress */}
            <div className={`rounded-lg p-4 border ${
              displayResults.summary.max_stress > 1.0
                ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
            }`}>
              <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${
                displayResults.summary.max_stress > 1.0 ? 'text-red-700' : 'text-green-700'
              }`}>
                {labels.peakStress[language]}
              </p>
              <p className={`text-3xl font-bold ${
                displayResults.summary.max_stress > 1.0 ? 'text-red-900' : 'text-green-900'
              }`}>
                {(displayResults.summary.max_stress * 100).toFixed(1)}%
              </p>
              <div className="mt-2 flex items-center">
                <div className={`flex-1 rounded-full h-2 ${
                  displayResults.summary.max_stress > 1.0 ? 'bg-red-200' : 'bg-green-200'
                }`}>
                  <div
                    className={`h-2 rounded-full ${
                      displayResults.summary.max_stress > 1.0 ? 'bg-red-600' : 'bg-green-600'
                    }`}
                    style={{ width: `${Math.min(displayResults.summary.max_stress * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* High-Stress Days */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <p className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">
                {labels.highStressDays[language]}
              </p>
              <p className="text-3xl font-bold text-orange-900">{highStressDays}</p>
              <p className="text-xs text-orange-700 mt-2">
                {((highStressDays / displayResults.daily_results.length) * 100).toFixed(0)}%{' '}
                {language === 'en' ? 'of period' : 'del período'}
              </p>
            </div>
          </div>

          {/* Stress threshold info */}
          <div className="mt-3 flex items-center text-xs text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>{labels.stressThreshold[language]}</span>
          </div>
        </div>

        {/* Chart */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {labels.chartTitle[language]}
          </h3>
          <StressChart
            data={displayResults.daily_results}
            language={language}
            height={300}
          />
        </div>

        {/* Top 5 Stressed Regions Table */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {labels.topRegionsTitle[language]}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {labels.regionName[language]}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {labels.avgStressCol[language]}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {labels.peakStressCol[language]}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayResults.summary.top_stressed_regions.map((region, index) => (
                  <tr key={region.region_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {region.region_name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        region.avg_stress > 1.0
                          ? 'bg-red-100 text-red-800'
                          : region.avg_stress > 0.9
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                      }`}>
                        {(region.avg_stress * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {((region.avg_stress + 0.1) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <button
            disabled
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-400 bg-gray-50 cursor-not-allowed"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {labels.exportCSV[language]}
          </button>
          <button
            disabled
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-400 bg-gray-50 cursor-not-allowed"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {labels.exportPNG[language]}
          </button>
        </div>
      </div>
    </div>
  );
}
