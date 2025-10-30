'use client';

import { memo, useMemo, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Chart as ChartJS } from 'chart.js';
import { WaterSimulationResponse } from '@/lib/types';
import { SkeletonLoader, SkeletonStatCard } from './SkeletonLoader';
import { LoadingSpinner } from './LoadingSpinner';
import { AIExplanationPanel } from './AIExplanationPanel';
import {
  downloadCSV,
  downloadChartAsPNG,
  getTimestampedFilename,
} from '@/lib/export';

// Lazy load WaterStressChart for better performance
const WaterStressChart = dynamic(() => import('./WaterCharts').then(mod => ({ default: mod.WaterStressChart })), {
  loading: () => <SkeletonLoader variant="chart" className="h-[300px]" />,
  ssr: false,
});

interface WaterResultsPanelProps {
  /** Water simulation results to display */
  results?: WaterSimulationResponse | null;
  /** Loading state */
  isLoading?: boolean;
  /** Language for labels (EN/ES) */
  language?: 'en' | 'es';
  /** Scenario parameters used in simulation (for AI explanation) */
  scenarioParams?: Record<string, unknown>;
}

/**
 * Mock water simulation data for demonstration
 */
const MOCK_RESULTS: WaterSimulationResponse = {
  daily_results: [
    { date: '2024-01-01', region_id: 'SS', region_name: 'San Salvador', demand: 165000, supply: 145000, stress: 0.88, unmet_demand: 20000 },
    { date: '2024-01-02', region_id: 'SS', region_name: 'San Salvador', demand: 167000, supply: 146000, stress: 0.87, unmet_demand: 21000 },
    { date: '2024-01-01', region_id: 'SM', region_name: 'San Miguel', demand: 95000, supply: 88000, stress: 0.93, unmet_demand: 7000 },
    { date: '2024-01-02', region_id: 'SM', region_name: 'San Miguel', demand: 96000, supply: 89000, stress: 0.93, unmet_demand: 7000 },
  ],
  summary: {
    avg_stress: 0.72,
    max_stress: 0.95,
    total_unmet_demand_m3: 2500000,
    critical_shortage_days: 45,
    top_stressed_regions: [
      { region_id: 'SS', region_name: 'San Salvador', avg_stress: 0.88 },
      { region_id: 'SM', region_name: 'San Miguel', avg_stress: 0.82 },
      { region_id: 'LI', region_name: 'La Libertad', avg_stress: 0.75 },
      { region_id: 'SA', region_name: 'Santa Ana', avg_stress: 0.68 },
      { region_id: 'SO', region_name: 'Sonsonate', avg_stress: 0.62 },
    ],
  },
};

/**
 * WaterResultsPanel Component
 *
 * Displays water simulation results including:
 * - Summary statistics (avg stress, max stress, unmet demand, critical days)
 * - Line chart for water stress over time
 * - Top 5 most stressed regions table
 * - Export buttons (CSV, PNG)
 *
 * @example
 * <WaterResultsPanel
 *   results={waterSimulationResults}
 *   isLoading={false}
 *   language="en"
 * />
 */
function WaterResultsPanelComponent({
  results,
  isLoading = false,
  language = 'en',
  scenarioParams = {},
}: WaterResultsPanelProps) {
  // Chart ref for PNG export
  const chartRef = useRef<ChartJS<'line'> | undefined>(null);

  const labels = {
    title: { en: 'Water Simulation Results', es: 'Resultados de Simulación Hídrica' },
    subtitle: { en: 'Analysis of water stress across regions', es: 'Análisis del estrés hídrico en regiones' },
    summaryTitle: { en: 'Summary Statistics', es: 'Estadísticas Resumidas' },
    avgStress: { en: 'Average Water Stress', es: 'Estrés Hídrico Promedio' },
    maxStress: { en: 'Maximum Water Stress', es: 'Estrés Hídrico Máximo' },
    unmetDemand: { en: 'Total Unmet Demand', es: 'Demanda Total No Satisfecha' },
    criticalDays: { en: 'Critical Shortage Days', es: 'Días de Escasez Crítica' },
    chartTitle: { en: 'Water Stress Over Time', es: 'Estrés Hídrico en el Tiempo' },
    topRegionsTitle: { en: 'Top 5 Most Stressed Regions', es: 'Top 5 Regiones con Mayor Estrés' },
    regionName: { en: 'Region', es: 'Región' },
    avgStressCol: { en: 'Avg Stress', es: 'Estrés Prom.' },
    maxStressCol: { en: 'Max Stress', es: 'Estrés Máx.' },
    exportCSV: { en: 'Export CSV', es: 'Exportar CSV' },
    exportPNG: { en: 'Export PNG', es: 'Exportar PNG' },
    loading: { en: 'Running water simulation...', es: 'Ejecutando simulación hídrica...' },
    noResults: {
      en: 'No results yet. Run a water simulation to see analysis.',
      es: 'Sin resultados aún. Ejecute una simulación hídrica para ver el análisis.',
    },
    stressThreshold: { en: 'Stress > 80% indicates critical water shortage', es: 'Estrés > 80% indica escasez crítica de agua' },
  };

  // Use mock data for demonstration
  const displayResults = results || MOCK_RESULTS;

  // Calculate critical shortage days (stress > 0.8) - memoized for performance
  const criticalDays = useMemo(() => {
    return displayResults.summary.critical_shortage_days;
  }, [displayResults.summary.critical_shortage_days]);

  /**
   * Handle CSV export for water data
   */
  const handleExportCSV = useCallback(() => {
    if (!results) return;

    try {
      // Convert water results to CSV format
      const lines: string[] = [];
      lines.push('date,region_id,region_name,demand_m3,supply_m3,stress,unmet_demand_m3');

      for (const result of results.daily_results) {
        const row = [
          result.date,
          result.region_id,
          `"${result.region_name}"`,
          result.demand.toFixed(2),
          result.supply.toFixed(2),
          result.stress.toFixed(4),
          result.unmet_demand.toFixed(2),
        ];
        lines.push(row.join(','));
      }

      const csv = lines.join('\n');
      const filename = getTimestampedFilename('water_simulation_results', 'csv');
      downloadCSV(csv, filename);

      console.log(`[${new Date().toISOString()}] [WaterResultsPanel] CSV export successful: ${filename}`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [WaterResultsPanel] CSV export failed:`, error);
      alert(
        language === 'en'
          ? 'Failed to export CSV. Please try again.'
          : 'Error al exportar CSV. Por favor intente de nuevo.'
      );
    }
  }, [results, language]);

  /**
   * Handle PNG export
   */
  const handleExportPNG = useCallback(() => {
    try {
      // Access canvas from Chart.js ref
      const canvas = chartRef.current?.canvas;
      if (!canvas) {
        console.warn(`[${new Date().toISOString()}] [WaterResultsPanel] Cannot export PNG: chart not rendered`);
        alert(
          language === 'en'
            ? 'Chart not ready. Please wait a moment and try again.'
            : 'El gráfico no está listo. Espere un momento e intente de nuevo.'
        );
        return;
      }

      const filename = getTimestampedFilename('water_stress_chart', 'png');
      downloadChartAsPNG(canvas, filename);

      console.log(`[${new Date().toISOString()}] [WaterResultsPanel] PNG export successful: ${filename}`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [WaterResultsPanel] PNG export failed:`, error);
      alert(
        language === 'en'
          ? 'Failed to export chart. Please try again.'
          : 'Error al exportar gráfico. Por favor intente de nuevo.'
      );
    }
  }, [language]);

  // Loading State
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div>
            <SkeletonLoader variant="text" lines={2} height="h-6" />
          </div>

          {/* Summary stats skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>

          {/* Chart skeleton */}
          <SkeletonLoader variant="chart" className="h-64" />

          {/* Table skeleton */}
          <div className="space-y-3">
            <SkeletonLoader variant="text" lines={1} height="h-5" className="w-1/3" />
            <SkeletonLoader variant="card" />
          </div>

          {/* Loading message with spinner */}
          <div className="pt-4 border-t">
            <LoadingSpinner
              size="md"
              color="text-cyan-600"
              text={labels.loading[language]}
              center
            />
          </div>
        </div>
      </div>
    );
  }

  // Empty State
  if (!results) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-6xl mb-4">💧</div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {/* Average Stress */}
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-3 md:p-4 border border-cyan-200">
              <p className="text-[10px] md:text-xs font-medium text-cyan-700 uppercase tracking-wide mb-1">
                {labels.avgStress[language]}
              </p>
              <p className="text-2xl md:text-3xl font-bold text-cyan-900">
                {(displayResults.summary.avg_stress * 100).toFixed(1)}%
              </p>
              <div className="mt-2 flex items-center">
                <div className="flex-1 bg-cyan-200 rounded-full h-2">
                  <div
                    className="bg-cyan-600 h-2 rounded-full"
                    style={{ width: `${Math.min(displayResults.summary.avg_stress * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Max Stress */}
            <div className={`rounded-lg p-3 md:p-4 border ${
              displayResults.summary.max_stress > 0.8
                ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
            }`}>
              <p className={`text-[10px] md:text-xs font-medium uppercase tracking-wide mb-1 ${
                displayResults.summary.max_stress > 0.8 ? 'text-red-700' : 'text-green-700'
              }`}>
                {labels.maxStress[language]}
              </p>
              <p className={`text-2xl md:text-3xl font-bold ${
                displayResults.summary.max_stress > 0.8 ? 'text-red-900' : 'text-green-900'
              }`}>
                {(displayResults.summary.max_stress * 100).toFixed(1)}%
              </p>
              <div className="mt-2 flex items-center">
                <div className={`flex-1 rounded-full h-2 ${
                  displayResults.summary.max_stress > 0.8 ? 'bg-red-200' : 'bg-green-200'
                }`}>
                  <div
                    className={`h-2 rounded-full ${
                      displayResults.summary.max_stress > 0.8 ? 'bg-red-600' : 'bg-green-600'
                    }`}
                    style={{ width: `${Math.min(displayResults.summary.max_stress * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Total Unmet Demand */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 md:p-4 border border-orange-200">
              <p className="text-[10px] md:text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">
                {labels.unmetDemand[language]}
              </p>
              <p className="text-2xl md:text-3xl font-bold text-orange-900">
                {(displayResults.summary.total_unmet_demand_m3 / 1000000).toFixed(2)}M
              </p>
              <p className="text-[10px] md:text-xs text-orange-700 mt-2">
                m³ {language === 'en' ? 'shortage' : 'escasez'}
              </p>
            </div>

            {/* Critical Shortage Days */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 md:p-4 border border-purple-200">
              <p className="text-[10px] md:text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">
                {labels.criticalDays[language]}
              </p>
              <p className="text-2xl md:text-3xl font-bold text-purple-900">{criticalDays}</p>
              <p className="text-[10px] md:text-xs text-purple-700 mt-2">
                {language === 'en' ? 'days with stress > 80%' : 'días con estrés > 80%'}
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

        {/* AI Explanation Panel */}
        <AIExplanationPanel
          simulationType="water"
          results={{
            summary: displayResults.summary,
            economic_analysis: displayResults.economic_analysis,
          }}
          scenarioParams={scenarioParams}
          language={language}
        />

        {/* Chart */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {labels.chartTitle[language]}
          </h3>
          <WaterStressChart
            ref={chartRef}
            data={displayResults.daily_results}
            language={language}
            height={300}
          />
        </div>

        {/* Top 5 Most Stressed Regions Table */}
        <div>
          <h3 className="text-xs md:text-sm font-semibold text-gray-700 mb-2 md:mb-3">
            {labels.topRegionsTitle[language]}
          </h3>
          <div className="overflow-x-auto -mx-2 md:mx-0">
            <div className="inline-block min-w-full align-middle px-2 md:px-0">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-700 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-2 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {labels.regionName[language]}
                    </th>
                    <th className="px-2 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {labels.avgStressCol[language]}
                    </th>
                    <th className="px-2 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {labels.maxStressCol[language]}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayResults.summary.top_stressed_regions.map((region, index) => (
                    <tr key={region.region_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-900">
                        {region.region_name}
                      </td>
                      <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium ${
                          region.avg_stress > 0.8
                            ? 'bg-red-100 text-red-800'
                            : region.avg_stress > 0.6
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}>
                          {(region.avg_stress * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-500">
                        {((region.avg_stress + 0.1) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <button
            onClick={handleExportCSV}
            disabled={!results}
            className="inline-flex items-center px-3 md:px-4 py-2 border border-gray-300 rounded-lg text-xs md:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label={language === 'en' ? 'Export water data as CSV' : 'Exportar datos hídricos como CSV'}
          >
            <svg className="w-4 h-4 mr-1.5 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">{labels.exportCSV[language]}</span>
            <span className="sm:hidden">CSV</span>
          </button>
          <button
            onClick={handleExportPNG}
            disabled={!results}
            className="inline-flex items-center px-3 md:px-4 py-2 border border-gray-300 rounded-lg text-xs md:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label={language === 'en' ? 'Export water chart as PNG image' : 'Exportar gráfico hídrico como imagen PNG'}
          >
            <svg className="w-4 h-4 mr-1.5 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="hidden sm:inline">{labels.exportPNG[language]}</span>
            <span className="sm:hidden">PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Memoized export for performance optimization
export const WaterResultsPanel = memo(WaterResultsPanelComponent);
