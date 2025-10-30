'use client';

import { memo, useMemo, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { SkeletonLoader } from './SkeletonLoader';
import { AIExplanationPanel } from './AIExplanationPanel';
import {
  downloadCSV,
  downloadChartAsPNG,
  getTimestampedFilename,
} from '@/lib/export';

// Lazy load AgricultureCharts for better performance
const AgricultureCharts = dynamic(() => import('./AgricultureCharts'), {
  loading: () => <SkeletonLoader variant="chart" className="h-[300px]" />,
  ssr: false,
});

interface AgricultureResultsPanelProps {
  /** Agriculture simulation results to display */
  results?: AgricultureSimulationResponse | null;
  /** Loading state */
  isLoading?: boolean;
  /** Language for labels (EN/ES) */
  language?: 'en' | 'es';
  /** Scenario parameters used in simulation (for AI explanation) */
  scenarioParams?: Record<string, unknown>;
}

interface AgricultureSimulationResponse {
  daily_results: Array<{
    date: string;
    region_id: string;
    region_name: string;
    crop_type: string;
    baseline_yield_kg: number;
    actual_yield_kg: number;
    yield_change_pct: number;
    stress: number;
  }>;
  summary: {
    avg_stress: number;
    max_stress: number;
    total_yield_loss_kg: number;
    total_yield_loss_pct: number;
    most_affected_crop: string;
    top_stressed_regions: Array<{
      region_id: string;
      region_name: string;
      avg_stress: number;
      crop_type: string;
    }>;
  };
  economic_analysis?: {
    total_economic_exposure_usd?: number;
    infrastructure_investment_usd?: number;
    roi_5_year?: number;
    annual_costs_prevented_usd?: number;
  };
}

/**
 * AgricultureResultsPanel Component
 *
 * Displays agriculture simulation results including:
 * - Summary metrics (yield change, economic impact, crop stress, affected crops)
 * - Top 5 most stressed regions table
 * - Charts for crop stress and yield impacts
 * - Actionable recommendations
 * - Export buttons (CSV, PNG)
 *
 * @example
 * <AgricultureResultsPanel
 *   results={agricultureSimulationResults}
 *   isLoading={false}
 *   language="en"
 * />
 */
function AgricultureResultsPanelComponent({
  results,
  isLoading = false,
  language = 'en',
  scenarioParams = {},
}: AgricultureResultsPanelProps) {
  // Chart ref for PNG export (simplified for now)
  const chartRef = useRef<HTMLCanvasElement | null>(null);

  const labels = {
    title: { en: 'Agriculture Simulation Results', es: 'Resultados de Simulación Agrícola' },
    subtitle: { en: 'Analysis of crop yield impacts across regions', es: 'Análisis de impactos en rendimiento de cultivos' },
    summaryTitle: { en: 'Summary Metrics', es: 'Métricas Resumidas' },
    totalYieldChange: { en: 'Total Yield Change', es: 'Cambio Total en Rendimiento' },
    economicImpact: { en: 'Economic Impact', es: 'Impacto Económico' },
    avgCropStress: { en: 'Average Crop Stress', es: 'Estrés Promedio de Cultivos' },
    mostAffectedCrop: { en: 'Most Affected Crop', es: 'Cultivo Más Afectado' },
    comparedToBaseline: { en: 'Compared to baseline', es: 'Comparado con línea base' },
    lostRevenue: { en: 'Lost agricultural revenue', es: 'Ingresos agrícolas perdidos' },
    acrossAllRegions: { en: 'Across all regions and crops', es: 'En todas las regiones y cultivos' },
    yieldLoss: { en: 'yield loss', es: 'pérdida de rendimiento' },
    topRegionsTitle: { en: 'Top 5 Stressed Regions', es: 'Top 5 Regiones con Mayor Estrés' },
    regionName: { en: 'Region', es: 'Región' },
    dominantCrop: { en: 'Dominant Crop', es: 'Cultivo Dominante' },
    yieldLossCol: { en: 'Yield Loss %', es: '% Pérdida' },
    economicLoss: { en: 'Economic Loss ($)', es: 'Pérdida Económica ($)' },
    recommendationsTitle: { en: 'Recommendations', es: 'Recomendaciones' },
    chartsTitle: { en: 'Detailed Analysis', es: 'Análisis Detallado' },
    exportCSV: { en: 'Export CSV', es: 'Exportar CSV' },
    exportPNG: { en: 'Export Chart PNG', es: 'Exportar Gráfico PNG' },
    loading: { en: 'Running agriculture simulation...', es: 'Ejecutando simulación agrícola...' },
    noResults: {
      en: 'No results yet. Run an agriculture simulation to see analysis.',
      es: 'Sin resultados aún. Ejecute una simulación agrícola para ver el análisis.',
    },
    coffee: { en: 'Coffee', es: 'Café' },
    sugar_cane: { en: 'Sugar Cane', es: 'Caña de Azúcar' },
    corn: { en: 'Corn', es: 'Maíz' },
    beans: { en: 'Beans', es: 'Frijoles' },
  };

  // Crop price estimates (USD per kg) for economic calculations
  const CROP_PRICES = {
    coffee: 3.5,       // Premium coffee
    sugar_cane: 0.05,  // Bulk commodity
    corn: 0.25,        // Staple grain
    beans: 0.8,        // Protein source
  };

  /**
   * Calculate economic loss in USD
   */
  const economicLoss = useMemo(() => {
    if (!results) return 0;

    let totalLoss = 0;
    for (const result of results.daily_results) {
      const yieldLoss = result.baseline_yield_kg - result.actual_yield_kg;
      const price = CROP_PRICES[result.crop_type as keyof typeof CROP_PRICES] || 0.5;
      totalLoss += yieldLoss * price;
    }

    // Convert to millions and return
    return totalLoss / 1_000_000;
  }, [results]);

  /**
   * Get translated crop name
   */
  const getCropName = useCallback((cropType: string) => {
    const cropKey = cropType as keyof typeof labels;
    return labels[cropKey]?.[language] || cropType;
  }, [language]);

  /**
   * Get stress color based on percentage
   */
  const getStressColor = (stress: number): string => {
    if (stress < 0.3) return 'text-green-600 bg-green-50 border-green-200';
    if (stress < 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (stress < 0.8) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  /**
   * Generate recommendations based on results
   */
  const recommendations = useMemo(() => {
    if (!results) return [];

    const recs: Array<{ icon: string; text: string; priority: 'high' | 'medium' | 'low' }> = [];

    // Check average crop stress
    if (results.summary.avg_stress > 0.6) {
      recs.push({
        icon: '🚨',
        text: language === 'en'
          ? 'URGENT: Implement drought mitigation measures immediately'
          : 'URGENTE: Implementar medidas de mitigación de sequía inmediatamente',
        priority: 'high',
      });
    }

    // Check yield loss
    if (results.summary.total_yield_loss_pct > 20) {
      recs.push({
        icon: '⚠️',
        text: language === 'en'
          ? `Severe yield loss detected (${results.summary.total_yield_loss_pct.toFixed(1)}%). Consider crop diversification`
          : `Pérdida severa de rendimiento detectada (${results.summary.total_yield_loss_pct.toFixed(1)}%). Considere diversificación de cultivos`,
        priority: 'high',
      });
    }

    // Check most affected crop
    if (results.summary.most_affected_crop) {
      recs.push({
        icon: '🌱',
        text: language === 'en'
          ? `Focus resources on ${getCropName(results.summary.most_affected_crop)} - most vulnerable crop`
          : `Enfoque recursos en ${getCropName(results.summary.most_affected_crop)} - cultivo más vulnerable`,
        priority: 'medium',
      });
    }

    // Top priority regions
    if (results.summary.top_stressed_regions.length > 0) {
      const topRegion = results.summary.top_stressed_regions[0];
      recs.push({
        icon: '📍',
        text: language === 'en'
          ? `Priority intervention needed in ${topRegion.region_name} (${(topRegion.avg_stress * 100).toFixed(0)}% stress)`
          : `Intervención prioritaria necesaria en ${topRegion.region_name} (${(topRegion.avg_stress * 100).toFixed(0)}% estrés)`,
        priority: 'high',
      });
    }

    // Economic impact recommendation
    if (economicLoss > 10) {
      recs.push({
        icon: '💰',
        text: language === 'en'
          ? `Estimated economic loss: $${economicLoss.toFixed(1)}M. Consider irrigation investment (ROI: 2-3x over 5 years)`
          : `Pérdida económica estimada: $${economicLoss.toFixed(1)}M. Considere inversión en riego (ROI: 2-3x en 5 años)`,
        priority: 'medium',
      });
    }

    return recs;
  }, [results, language, economicLoss, getCropName]);

  /**
   * Handle CSV export for agriculture data
   */
  const handleExportCSV = useCallback(() => {
    if (!results) return;

    try {
      const lines: string[] = [];
      lines.push('date,region_id,region_name,crop_type,baseline_yield_kg,actual_yield_kg,yield_change_pct,stress');

      for (const result of results.daily_results) {
        const row = [
          result.date,
          result.region_id,
          `"${result.region_name}"`,
          result.crop_type,
          result.baseline_yield_kg.toFixed(2),
          result.actual_yield_kg.toFixed(2),
          result.yield_change_pct.toFixed(2),
          result.stress.toFixed(4),
        ];
        lines.push(row.join(','));
      }

      const csv = lines.join('\n');
      const filename = getTimestampedFilename('agriculture_simulation_results', 'csv');
      downloadCSV(csv, filename);

      console.log(`[Agriculture] CSV export successful: ${filename}`);
    } catch (error) {
      console.error('[Agriculture] CSV export failed:', error);
      alert(
        language === 'en'
          ? 'Failed to export CSV. Please try again.'
          : 'Error al exportar CSV. Por favor intente de nuevo.'
      );
    }
  }, [results, language]);

  /**
   * Handle PNG export for charts
   */
  const handleExportPNG = useCallback(() => {
    if (!chartRef.current) {
      console.warn('[Agriculture] Chart ref not available for PNG export');
      return;
    }

    try {
      const filename = getTimestampedFilename('agriculture_chart', 'png');
      downloadChartAsPNG(chartRef.current, filename);
      console.log(`[Agriculture] PNG export successful: ${filename}`);
    } catch (error) {
      console.error('[Agriculture] PNG export failed:', error);
      alert(
        language === 'en'
          ? 'Failed to export PNG. Please try again.'
          : 'Error al exportar PNG. Por favor intente de nuevo.'
      );
    }
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
            <p className="text-gray-600">{labels.loading[language]}</p>
          </div>
        </div>
      </div>
    );
  }

  // No results state
  if (!results) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">🌾</span>
          <p className="text-gray-600">{labels.noResults[language]}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {labels.title[language]}
        </h2>
        <p className="text-gray-600">{labels.subtitle[language]}</p>
      </div>

      {/* Summary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Yield Change */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-2">{labels.totalYieldChange[language]}</div>
          <div className={`text-3xl font-bold mb-1 ${
            results.summary.total_yield_loss_pct < 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {results.summary.total_yield_loss_pct > 0 ? '-' : '+'}{Math.abs(results.summary.total_yield_loss_pct).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">{labels.comparedToBaseline[language]}</div>
        </div>

        {/* Economic Impact */}
        <div className="bg-white rounded-lg border-2 border-red-200 p-4">
          <div className="text-sm text-gray-600 mb-2">{labels.economicImpact[language]}</div>
          <div className="text-3xl font-bold text-red-600 mb-1">
            ${economicLoss.toFixed(1)}M
          </div>
          <div className="text-xs text-gray-500">{labels.lostRevenue[language]}</div>
        </div>

        {/* Average Crop Stress */}
        <div className={`bg-white rounded-lg border-2 p-4 ${getStressColor(results.summary.avg_stress)}`}>
          <div className="text-sm mb-2">{labels.avgCropStress[language]}</div>
          <div className="text-3xl font-bold mb-1">
            {(results.summary.avg_stress * 100).toFixed(0)}%
          </div>
          <div className="text-xs opacity-75">{labels.acrossAllRegions[language]}</div>
        </div>

        {/* Most Affected Crop */}
        <div className="bg-white rounded-lg border-2 border-orange-200 p-4">
          <div className="text-sm text-gray-600 mb-2">{labels.mostAffectedCrop[language]}</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {getCropName(results.summary.most_affected_crop)}
          </div>
          <div className="text-xs text-gray-500">
            -{results.summary.total_yield_loss_pct.toFixed(1)}% {labels.yieldLoss[language]}
          </div>
        </div>
      </div>

      {/* Top 5 Stressed Regions Table */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">{labels.topRegionsTitle[language]}</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="text-left p-3 text-sm font-semibold text-gray-700">{labels.regionName[language]}</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-700">{labels.dominantCrop[language]}</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700">{labels.yieldLossCol[language]}</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700">{labels.economicLoss[language]}</th>
              </tr>
            </thead>
            <tbody>
              {results.summary.top_stressed_regions.map((region) => {
                const stressColor = region.avg_stress > 0.8 ? 'bg-red-50' : region.avg_stress > 0.6 ? 'bg-orange-50' : '';
                const yieldLoss = region.avg_stress * 100; // Approximate
                const economicLossForRegion = (yieldLoss / 100) * (economicLoss / 5); // Rough estimate

                return (
                  <tr key={region.region_id} className={`border-b border-gray-200 hover:bg-gray-50 ${stressColor}`}>
                    <td className="p-3 font-medium text-gray-900">{region.region_name}</td>
                    <td className="p-3 text-gray-700">{getCropName(region.crop_type)}</td>
                    <td className="p-3 text-right font-semibold text-red-600">-{yieldLoss.toFixed(1)}%</td>
                    <td className="p-3 text-right text-gray-700">${economicLossForRegion.toFixed(2)}M</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">{labels.recommendationsTitle[language]}</h3>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  rec.priority === 'high'
                    ? 'bg-red-50 border-red-500'
                    : rec.priority === 'medium'
                    ? 'bg-yellow-50 border-yellow-500'
                    : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-start">
                  <span className="text-2xl mr-3">{rec.icon}</span>
                  <p className="text-sm text-gray-800 flex-1">{rec.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Explanation Panel */}
      <AIExplanationPanel
        simulationType="agriculture"
        results={{
          summary: {
            avg_crop_stress: results.summary.avg_stress,
            top_stressed_regions: results.summary.top_stressed_regions.map(r => ({
              name: r.region_name,
              avg_stress: r.avg_stress,
            })),
          },
          economic_analysis: results.economic_analysis,
        }}
        scenarioParams={scenarioParams}
        language={language}
      />

      {/* Charts Section */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">{labels.chartsTitle[language]}</h3>
        <AgricultureCharts
          results={results}
          language={language}
        />
      </div>

      {/* Export Buttons */}
      <div className="flex gap-4 justify-end">
        <button
          onClick={handleExportCSV}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          {labels.exportCSV[language]}
        </button>
        <button
          onClick={handleExportPNG}
          className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
        >
          {labels.exportPNG[language]}
        </button>
      </div>
    </div>
  );
}

// Export memoized version for better performance
export const AgricultureResultsPanel = memo(AgricultureResultsPanelComponent);
