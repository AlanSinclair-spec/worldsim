'use client';

import { SimulationResponse, SimulationScenario } from '@/lib/types';
import { StressChart } from './Charts';
import { useState } from 'react';

interface ResultsPanelEnhancedProps {
  /** Simulation results to display */
  results?: SimulationResponse | null;
  /** Input scenario parameters */
  scenario?: SimulationScenario | null;
  /** Execution time in milliseconds */
  executionTime?: number;
  /** Loading state */
  isLoading?: boolean;
  /** Language for labels (EN/ES) */
  language?: 'en' | 'es';
}

/**
 * Enhanced ResultsPanel Component
 *
 * Displays comprehensive simulation results including:
 * - Input Parameters Summary (what the user selected)
 * - Outcome Summary with smart insights
 * - Performance metrics
 * - Visual charts and statistics
 * - Top stressed regions with detailed breakdowns
 * - Export functionality (CSV, JSON)
 * - Comparative analysis and recommendations
 *
 * @example
 * <ResultsPanelEnhanced
 *   results={simulationResults}
 *   scenario={inputScenario}
 *   executionTime={406}
 *   isLoading={false}
 *   language="en"
 * />
 */
export function ResultsPanelEnhanced({
  results,
  scenario,
  executionTime,
  isLoading = false,
  language = 'en',
}: ResultsPanelEnhancedProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('summary');

  const labels = {
    title: { en: 'Simulation Results', es: 'Resultados de Simulación' },
    subtitle: { en: 'Comprehensive analysis of your scenario', es: 'Análisis completo de su escenario' },

    // Section headers
    inputParams: { en: 'Input Parameters', es: 'Parámetros de Entrada' },
    outcomes: { en: 'Outcomes & Insights', es: 'Resultados e Insights' },
    performance: { en: 'Performance', es: 'Rendimiento' },
    charts: { en: 'Visualizations', es: 'Visualizaciones' },
    topRegions: { en: 'Regional Breakdown', es: 'Desglose Regional' },
    exports: { en: 'Export Data', es: 'Exportar Datos' },

    // Input parameters
    solarGrowth: { en: 'Solar Growth', es: 'Crecimiento Solar' },
    rainfallChange: { en: 'Rainfall Change', es: 'Cambio de Lluvia' },
    dateRange: { en: 'Simulation Period', es: 'Período de Simulación' },
    duration: { en: 'Duration', es: 'Duración' },
    days: { en: 'days', es: 'días' },

    // Outcomes
    avgStress: { en: 'Average Infrastructure Stress', es: 'Estrés Promedio de Infraestructura' },
    maxStress: { en: 'Peak Stress', es: 'Estrés Máximo' },
    criticalDays: { en: 'Critical Days', es: 'Días Críticos' },
    healthyDays: { en: 'Healthy Days', es: 'Días Saludables' },
    totalResults: { en: 'Data Points', es: 'Puntos de Datos' },

    // Insights
    insightsTitle: { en: 'Key Insights', es: 'Insights Clave' },
    recommendation: { en: 'Recommendation', es: 'Recomendación' },

    // Export
    exportCSV: { en: 'Export to CSV', es: 'Exportar a CSV' },
    exportJSON: { en: 'Export to JSON', es: 'Exportar a JSON' },
    exportReport: { en: 'Generate Report', es: 'Generar Reporte' },

    // States
    loading: { en: 'Running simulation...', es: 'Ejecutando simulación...' },
    noResults: { en: 'No results yet', es: 'Sin resultados aún' },
    runSimulation: { en: 'Configure parameters and run a simulation', es: 'Configure parámetros y ejecute una simulación' },
  };

  /**
   * Calculate key metrics and insights from results
   */
  const metrics = results
    ? {
        criticalDays: results.daily_results.filter(r => r.stress > 0.6).length,
        warningDays: results.daily_results.filter(r => r.stress > 0.35 && r.stress <= 0.6).length,
        cautionDays: results.daily_results.filter(r => r.stress > 0.15 && r.stress <= 0.35).length,
        healthyDays: results.daily_results.filter(r => r.stress <= 0.15).length,
        totalDays: results.daily_results.length,
        avgDemand: results.daily_results.reduce((sum, r) => sum + r.demand, 0) / results.daily_results.length,
        avgSupply: results.daily_results.reduce((sum, r) => sum + r.supply, 0) / results.daily_results.length,
      }
    : null;

  /**
   * Generate smart insights based on results
   */
  const generateInsights = (): string[] => {
    if (!results || !scenario || !metrics) return [];

    const insights: string[] = [];

    // Stress level insights
    if (results.summary.avg_stress > 0.6) {
      insights.push(
        language === 'en'
          ? '🔴 Critical infrastructure stress detected. Immediate action required.'
          : '🔴 Estrés crítico de infraestructura detectado. Se requiere acción inmediata.'
      );
    } else if (results.summary.avg_stress > 0.35) {
      insights.push(
        language === 'en'
          ? '🟠 Moderate stress levels observed. Consider infrastructure upgrades.'
          : '🟠 Niveles moderados de estrés observados. Considere mejoras de infraestructura.'
      );
    } else if (results.summary.avg_stress > 0.15) {
      insights.push(
        language === 'en'
          ? '🟡 Low stress levels. Infrastructure coping adequately.'
          : '🟡 Niveles bajos de estrés. La infraestructura se adapta adecuadamente.'
      );
    } else {
      insights.push(
        language === 'en'
          ? '🟢 Excellent performance. Infrastructure capacity exceeds demand.'
          : '🟢 Rendimiento excelente. La capacidad de infraestructura supera la demanda.'
      );
    }

    // Solar growth impact
    if (scenario.solar_growth_pct > 30) {
      insights.push(
        language === 'en'
          ? `⚡ High solar growth (+${scenario.solar_growth_pct}%) significantly reduces grid dependency.`
          : `⚡ Alto crecimiento solar (+${scenario.solar_growth_pct}%) reduce significativamente la dependencia de la red.`
      );
    } else if (scenario.solar_growth_pct < -20) {
      insights.push(
        language === 'en'
          ? `☀️ Solar capacity decline (${scenario.solar_growth_pct}%) increases infrastructure stress.`
          : `☀️ Disminución de capacidad solar (${scenario.solar_growth_pct}%) aumenta el estrés de infraestructura.`
      );
    }

    // Rainfall impact
    if (scenario.rainfall_change_pct < -20) {
      insights.push(
        language === 'en'
          ? `💧 Drought conditions (${scenario.rainfall_change_pct}% rainfall) reduce hydroelectric capacity.`
          : `💧 Condiciones de sequía (${scenario.rainfall_change_pct}% lluvia) reducen capacidad hidroeléctrica.`
      );
    } else if (scenario.rainfall_change_pct > 20) {
      insights.push(
        language === 'en'
          ? `🌧️ Increased rainfall (+${scenario.rainfall_change_pct}%) boosts hydroelectric generation.`
          : `🌧️ Aumento de lluvia (+${scenario.rainfall_change_pct}%) incrementa generación hidroeléctrica.`
      );
    }

    // Regional insights
    if (results.summary.top_stressed_regions.length > 0) {
      const topRegion = results.summary.top_stressed_regions[0];
      insights.push(
        language === 'en'
          ? `📍 ${topRegion.region_name} shows highest stress (${(topRegion.avg_stress * 100).toFixed(1)}%). Priority for infrastructure investment.`
          : `📍 ${topRegion.region_name} muestra mayor estrés (${(topRegion.avg_stress * 100).toFixed(1)}%). Prioridad para inversión en infraestructura.`
      );
    }

    // Performance insight
    if (executionTime && executionTime < 1000) {
      insights.push(
        language === 'en'
          ? `⚡ Fast simulation completed in ${executionTime}ms. Ready for iterative testing.`
          : `⚡ Simulación rápida completada en ${executionTime}ms. Lista para pruebas iterativas.`
      );
    }

    return insights;
  };

  /**
   * Generate recommendation based on scenario
   */
  const generateRecommendation = (): string => {
    if (!results || !scenario) return '';

    if (results.summary.avg_stress > 0.6) {
      return language === 'en'
        ? 'Consider increasing solar capacity (+50% or more) and improving grid infrastructure to handle peak demand periods.'
        : 'Considere aumentar la capacidad solar (+50% o más) y mejorar la infraestructura de la red para manejar períodos de demanda máxima.';
    } else if (results.summary.avg_stress > 0.35) {
      return language === 'en'
        ? 'Gradual infrastructure improvements recommended. Focus on regions with highest stress levels.'
        : 'Se recomiendan mejoras graduales de infraestructura. Enfoque en regiones con mayores niveles de estrés.';
    } else if (results.summary.avg_stress > 0.15) {
      return language === 'en'
        ? 'Current infrastructure is adequate. Monitor for future demand growth and climate changes.'
        : 'La infraestructura actual es adecuada. Monitoree el crecimiento futuro de la demanda y los cambios climáticos.';
    } else {
      return language === 'en'
        ? 'Excellent system performance. Consider exporting excess capacity or scaling back investments.'
        : 'Rendimiento excelente del sistema. Considere exportar exceso de capacidad o reducir inversiones.';
    }
  };

  /**
   * Export results to CSV
   */
  const exportToCSV = () => {
    if (!results) return;

    const csvRows = [
      ['Date', 'Region ID', 'Region Name', 'Demand (kWh)', 'Supply (kWh)', 'Stress (%)'],
      ...results.daily_results.map(r => [
        r.date,
        r.region_id,
        r.region_name,
        r.demand.toString(),
        r.supply.toString(),
        (r.stress * 100).toFixed(2),
      ]),
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `worldsim-results-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Export results to JSON
   */
  const exportToJSON = () => {
    if (!results || !scenario) return;

    const exportData = {
      scenario,
      results,
      executionTime,
      exportedAt: new Date().toISOString(),
      insights: generateInsights(),
      recommendation: generateRecommendation(),
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `worldsim-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Calculate simulation duration in days
   */
  const calculateDuration = (): number => {
    if (!scenario) return 0;
    const start = new Date(scenario.start_date);
    const end = new Date(scenario.end_date);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  /**
   * Toggle section expansion
   */
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-50 rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
          <div className="h-64 bg-gray-100 rounded-lg"></div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">{labels.loading[language]}</p>
        </div>
      </div>
    );
  }

  // Empty State
  if (!results || !scenario) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{labels.noResults[language]}</h3>
          <p className="text-sm text-gray-500 text-center max-w-md">{labels.runSimulation[language]}</p>
        </div>
      </div>
    );
  }

  const insights = generateInsights();
  const recommendation = generateRecommendation();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-1">{labels.title[language]}</h2>
        <p className="text-sm text-blue-100">{labels.subtitle[language]}</p>
        {executionTime && (
          <div className="mt-3 flex items-center text-xs text-blue-100">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span>{language === 'en' ? `Computed in ${executionTime}ms` : `Calculado en ${executionTime}ms`}</span>
          </div>
        )}
      </div>

      {/* Input Parameters Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('input')}
          className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-colors"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-gray-900">{labels.inputParams[language]}</h3>
              <p className="text-xs text-gray-500">{language === 'en' ? 'Your scenario configuration' : 'Configuración de su escenario'}</p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transform transition-transform ${expandedSection === 'input' ? 'rotate-180' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {expandedSection === 'input' && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">{labels.solarGrowth[language]}</p>
                <p className="text-2xl font-bold text-blue-600">
                  {scenario.solar_growth_pct > 0 ? '+' : ''}{scenario.solar_growth_pct}%
                </p>
                <div className="mt-2 flex items-center text-xs text-gray-500">
                  {scenario.solar_growth_pct > 0 ? '☀️ Increasing capacity' : scenario.solar_growth_pct < 0 ? '⚠️ Decreasing capacity' : '→ No change'}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">{labels.rainfallChange[language]}</p>
                <p className="text-2xl font-bold text-green-600">
                  {scenario.rainfall_change_pct > 0 ? '+' : ''}{scenario.rainfall_change_pct}%
                </p>
                <div className="mt-2 flex items-center text-xs text-gray-500">
                  {scenario.rainfall_change_pct > 0 ? '🌧️ Wetter conditions' : scenario.rainfall_change_pct < 0 ? '💧 Drier conditions' : '→ Normal conditions'}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">{labels.dateRange[language]}</p>
                <p className="text-sm font-bold text-gray-900">{scenario.start_date}</p>
                <p className="text-xs text-gray-500">to</p>
                <p className="text-sm font-bold text-gray-900">{scenario.end_date}</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">{labels.duration[language]}</p>
                <p className="text-2xl font-bold text-purple-600">{calculateDuration()}</p>
                <p className="text-xs text-gray-500 mt-1">{labels.days[language]}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Outcomes & Insights Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('outcomes')}
          className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-colors"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .993-.241 1.929-.668 2.754l-1.524-1.525a3.997 3.997 0 00.078-2.183l1.562-1.562C15.802 8.249 16 9.1 16 10zm-5.165 3.913l1.58 1.58A5.98 5.98 0 0110 16a5.976 5.976 0 01-2.516-.552l1.562-1.562a4.006 4.006 0 001.789.027zm-4.677-2.796a4.002 4.002 0 01-.041-2.08l-.08.08-1.53-1.533A5.98 5.98 0 004 10c0 .954.223 1.856.619 2.657l1.54-1.54zm1.088-6.45A5.974 5.974 0 0110 4c.954 0 1.856.223 2.657.619l-1.54 1.54a4.002 4.002 0 00-2.346.033L7.246 4.668zM12 10a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-gray-900">{labels.outcomes[language]}</h3>
              <p className="text-xs text-gray-500">{language === 'en' ? 'Simulation results and analysis' : 'Resultados y análisis de simulación'}</p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transform transition-transform ${expandedSection === 'outcomes' ? 'rotate-180' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {expandedSection === 'outcomes' && metrics && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 space-y-4">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">{labels.avgStress[language]}</p>
                <p className="text-3xl font-bold text-blue-900">{(results.summary.avg_stress * 100).toFixed(1)}%</p>
                <div className="mt-2 bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(results.summary.avg_stress * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className={`rounded-lg p-4 border ${
                results.summary.max_stress > 0.6
                  ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                  : results.summary.max_stress > 0.35
                  ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
                  : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
              }`}>
                <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${
                  results.summary.max_stress > 0.6 ? 'text-red-700' : results.summary.max_stress > 0.35 ? 'text-orange-700' : 'text-green-700'
                }`}>{labels.maxStress[language]}</p>
                <p className={`text-3xl font-bold ${
                  results.summary.max_stress > 0.6 ? 'text-red-900' : results.summary.max_stress > 0.35 ? 'text-orange-900' : 'text-green-900'
                }`}>{(results.summary.max_stress * 100).toFixed(1)}%</p>
                <div className={`mt-2 rounded-full h-2 ${
                  results.summary.max_stress > 0.6 ? 'bg-red-200' : results.summary.max_stress > 0.35 ? 'bg-orange-200' : 'bg-green-200'
                }`}>
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      results.summary.max_stress > 0.6 ? 'bg-red-600' : results.summary.max_stress > 0.35 ? 'bg-orange-600' : 'bg-green-600'
                    }`}
                    style={{ width: `${Math.min(results.summary.max_stress * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">{labels.healthyDays[language]}</p>
                <p className="text-3xl font-bold text-green-600">{metrics.healthyDays}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {((metrics.healthyDays / metrics.totalDays) * 100).toFixed(0)}% {language === 'en' ? 'of period' : 'del período'}
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">{labels.criticalDays[language]}</p>
                <p className="text-3xl font-bold text-red-600">{metrics.criticalDays}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {((metrics.criticalDays / metrics.totalDays) * 100).toFixed(0)}% {language === 'en' ? 'of period' : 'del período'}
                </p>
              </div>
            </div>

            {/* Insights */}
            {insights.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {labels.insightsTitle[language]}
                </h4>
                <ul className="space-y-2">
                  {insights.map((insight, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendation */}
            {recommendation && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
                <h4 className="text-sm font-bold text-purple-900 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {labels.recommendation[language]}
                </h4>
                <p className="text-sm text-purple-900">{recommendation}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('charts')}
          className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-colors"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-gray-900">{labels.charts[language]}</h3>
              <p className="text-xs text-gray-500">{language === 'en' ? 'Stress trends over time' : 'Tendencias de estrés en el tiempo'}</p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transform transition-transform ${expandedSection === 'charts' ? 'rotate-180' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {expandedSection === 'charts' && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <StressChart
              data={results.daily_results}
              language={language}
              height={350}
            />
          </div>
        )}
      </div>

      {/* Regional Breakdown */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('regions')}
          className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-colors"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-gray-900">{labels.topRegions[language]}</h3>
              <p className="text-xs text-gray-500">{language === 'en' ? 'Top 5 stressed regions' : 'Top 5 regiones estresadas'}</p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transform transition-transform ${expandedSection === 'regions' ? 'rotate-180' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {expandedSection === 'regions' && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {language === 'en' ? 'Rank' : 'Rango'}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {language === 'en' ? 'Region' : 'Región'}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {language === 'en' ? 'Avg Stress' : 'Estrés Prom'}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {language === 'en' ? 'Status' : 'Estado'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.summary.top_stressed_regions.map((region, index) => (
                    <tr key={region.region_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm">
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {region.region_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-lg font-bold text-gray-900 mr-2">
                            {(region.avg_stress * 100).toFixed(1)}%
                          </span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                region.avg_stress > 0.6
                                  ? 'bg-red-600'
                                  : region.avg_stress > 0.35
                                  ? 'bg-orange-500'
                                  : region.avg_stress > 0.15
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(region.avg_stress * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                            region.avg_stress > 0.6
                              ? 'bg-red-100 text-red-800'
                              : region.avg_stress > 0.35
                              ? 'bg-orange-100 text-orange-800'
                              : region.avg_stress > 0.15
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {region.avg_stress > 0.6
                            ? language === 'en'
                              ? '🔴 Critical'
                              : '🔴 Crítico'
                            : region.avg_stress > 0.35
                            ? language === 'en'
                              ? '🟠 Warning'
                              : '🟠 Advertencia'
                            : region.avg_stress > 0.15
                            ? language === 'en'
                              ? '🟡 Caution'
                              : '🟡 Precaución'
                            : language === 'en'
                            ? '🟢 Healthy'
                            : '🟢 Saludable'}
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

      {/* Export Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{labels.exports[language]}</h3>
              <p className="text-xs text-gray-500">{language === 'en' ? 'Download results in various formats' : 'Descargar resultados en varios formatos'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors shadow-md"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              CSV
            </button>
            <button
              onClick={exportToJSON}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
