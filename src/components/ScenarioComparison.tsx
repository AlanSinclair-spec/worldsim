/**
 * ScenarioComparison Component
 *
 * Enables side-by-side comparison of multiple simulation scenarios.
 * Displays comparison tables, charts, and "winner" analysis for
 * optimal decision-making.
 */

import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface SavedScenario {
  id: string;
  name: string;
  type: 'energy' | 'water' | 'agriculture';
  timestamp: string;
  results: {
    summary: {
      avg_stress?: number;
      avg_crop_stress?: number;
      max_stress?: number;
      top_stressed_regions?: Array<{ region_name?: string; name?: string }>;
    };
    economic_analysis?: {
      infrastructure_investment_usd?: number;
      roi_5_year?: number;
      payback_period_months?: number;
      annual_costs_prevented_usd?: number;
      total_economic_exposure_usd?: number;
    };
  };
  params: Record<string, unknown>;
}

interface ScenarioComparisonProps {
  scenarios: SavedScenario[];
  onRemoveScenario: (id: string) => void;
  language?: 'en' | 'es';
}

export function ScenarioComparison({
  scenarios,
  onRemoveScenario,
  language = 'en',
}: ScenarioComparisonProps) {
  const labels = {
    title: { en: 'Scenario Comparison', es: 'Comparación de Escenarios' },
    noScenarios: {
      en: 'Save at least 2 scenarios to compare',
      es: 'Guarde al menos 2 escenarios para comparar',
    },
    differentTypes: {
      en: 'Compare scenarios of the same type (energy, water, or agriculture)',
      es: 'Compare escenarios del mismo tipo (energía, agua o agricultura)',
    },
    scenarioName: { en: 'Scenario Name', es: 'Nombre del Escenario' },
    avgStress: { en: 'Avg Stress', es: 'Estrés Promedio' },
    investment: { en: 'Investment', es: 'Inversión' },
    roi: { en: 'ROI (5yr)', es: 'ROI (5 años)' },
    payback: { en: 'Payback', es: 'Recuperación' },
    remove: { en: 'Remove', es: 'Eliminar' },
    bestRoi: { en: 'Best ROI', es: 'Mejor ROI' },
    lowestInvestment: { en: 'Lowest Investment', es: 'Inversión Más Baja' },
    fastestPayback: { en: 'Fastest Payback', es: 'Recuperación Más Rápida' },
    months: { en: 'months', es: 'meses' },
    comparisonChart: { en: 'Metric Comparison', es: 'Comparación de Métricas' },
    energyTab: { en: 'Energy', es: 'Energía' },
    waterTab: { en: 'Water', es: 'Agua' },
    agricultureTab: { en: 'Agriculture', es: 'Agricultura' },
  };

  // Group scenarios by type
  const groupedScenarios = useMemo(() => {
    const groups: Record<string, SavedScenario[]> = {
      energy: [],
      water: [],
      agriculture: [],
    };
    scenarios.forEach((s) => groups[s.type].push(s));
    return groups;
  }, [scenarios]);

  // Find best scenarios
  const getBestScenario = (
    typeScenarios: SavedScenario[],
    metric: 'roi' | 'investment' | 'payback'
  ): SavedScenario | null => {
    if (typeScenarios.length === 0) return null;

    return typeScenarios.reduce((best, current) => {
      const bestEcon = best.results.economic_analysis;
      const currentEcon = current.results.economic_analysis;

      if (!bestEcon || !currentEcon) return best;

      if (metric === 'roi') {
        return (currentEcon.roi_5_year || 0) > (bestEcon.roi_5_year || 0) ? current : best;
      } else if (metric === 'investment') {
        return (currentEcon.infrastructure_investment_usd || Infinity) <
          (bestEcon.infrastructure_investment_usd || Infinity)
          ? current
          : best;
      } else {
        // payback
        return (currentEcon.payback_period_months || Infinity) <
          (bestEcon.payback_period_months || Infinity)
          ? current
          : best;
      }
    });
  };

  const getStressColor = (stress: number) => {
    if (stress > 0.8) return 'text-red-600 font-bold';
    if (stress > 0.6) return 'text-orange-600 font-semibold';
    return 'text-green-600';
  };

  const getRoiColor = (roi: number) => {
    if (roi > 3) return 'text-green-600 font-bold';
    if (roi > 2) return 'text-blue-600 font-semibold';
    return 'text-gray-600';
  };

  // Empty state
  if (scenarios.length < 2) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{labels.title[language]}</h3>
          <p className="text-gray-600">{labels.noScenarios[language]}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{labels.title[language]}</h2>
        <div className="text-sm text-gray-500">
          {scenarios.length} {language === 'en' ? 'scenarios saved' : 'escenarios guardados'}
        </div>
      </div>

      {/* Render comparison for each type */}
      {Object.entries(groupedScenarios).map(([type, typeScenarios]) => {
        if (typeScenarios.length < 2) return null;

        const bestRoi = getBestScenario(typeScenarios, 'roi');
        const lowestInvestment = getBestScenario(typeScenarios, 'investment');
        const fastestPayback = getBestScenario(typeScenarios, 'payback');

        // Chart data
        const chartData = {
          labels: typeScenarios.map((s) => s.name),
          datasets: [
            {
              label: labels.avgStress[language],
              data: typeScenarios.map(
                (s) => ((s.results.summary.avg_stress || s.results.summary.avg_crop_stress || 0) * 100)
              ),
              backgroundColor: 'rgba(239, 68, 68, 0.7)',
              borderColor: 'rgb(239, 68, 68)',
              borderWidth: 2,
            },
            {
              label: `${labels.investment[language]} (M)`,
              data: typeScenarios.map(
                (s) =>
                  (s.results.economic_analysis?.infrastructure_investment_usd || 0) / 1_000_000
              ),
              backgroundColor: 'rgba(59, 130, 246, 0.7)',
              borderColor: 'rgb(59, 130, 246)',
              borderWidth: 2,
            },
            {
              label: `${labels.roi[language]} (x100)`,
              data: typeScenarios.map(
                (s) => (s.results.economic_analysis?.roi_5_year || 0) * 100
              ),
              backgroundColor: 'rgba(34, 197, 94, 0.7)',
              borderColor: 'rgb(34, 197, 94)',
              borderWidth: 2,
            },
          ],
        };

        return (
          <div key={type} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6 capitalize flex items-center gap-2">
              <span className="text-2xl">
                {type === 'energy' ? '⚡' : type === 'water' ? '💧' : '🌾'}
              </span>
              {type === 'energy'
                ? labels.energyTab[language]
                : type === 'water'
                ? labels.waterTab[language]
                : labels.agricultureTab[language]}{' '}
              {language === 'en' ? 'Scenarios' : 'Escenarios'}
            </h3>

            {/* Comparison Table */}
            <div className="overflow-x-auto mb-8">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {labels.scenarioName[language]}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {labels.avgStress[language]}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {labels.investment[language]}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {labels.roi[language]}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {labels.payback[language]}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {labels.remove[language]}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {typeScenarios.map((scenario) => {
                    const econ = scenario.results.economic_analysis;
                    const stress = scenario.results.summary.avg_stress || scenario.results.summary.avg_crop_stress || 0;

                    return (
                      <tr
                        key={scenario.id}
                        className={`hover:bg-gray-50 ${
                          scenario.id === bestRoi?.id ? 'bg-green-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="font-medium text-gray-900">{scenario.name}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(scenario.timestamp).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className={getStressColor(stress)}>
                            {(stress * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                          ${((econ?.infrastructure_investment_usd || 0) / 1_000_000).toFixed(1)}M
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className={getRoiColor(econ?.roi_5_year || 0)}>
                            {(econ?.roi_5_year || 0).toFixed(1)}x
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                          {econ?.payback_period_months || 0} {labels.months[language]}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <button
                            onClick={() => onRemoveScenario(scenario.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Winner Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 border-2 border-green-300">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🏆</span>
                  <h4 className="font-bold text-green-900">{labels.bestRoi[language]}</h4>
                </div>
                {bestRoi && (
                  <>
                    <p className="text-xl font-bold text-green-700 mb-1">{bestRoi.name}</p>
                    <p className="text-sm text-green-600">
                      {(bestRoi.results.economic_analysis?.roi_5_year || 0).toFixed(1)}x{' '}
                      {language === 'en' ? 'return' : 'retorno'}
                    </p>
                  </>
                )}
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border-2 border-blue-300">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💰</span>
                  <h4 className="font-bold text-blue-900">{labels.lowestInvestment[language]}</h4>
                </div>
                {lowestInvestment && (
                  <>
                    <p className="text-xl font-bold text-blue-700 mb-1">{lowestInvestment.name}</p>
                    <p className="text-sm text-blue-600">
                      $
                      {(
                        (lowestInvestment.results.economic_analysis
                          ?.infrastructure_investment_usd || 0) / 1_000_000
                      ).toFixed(1)}
                      M
                    </p>
                  </>
                )}
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-5 border-2 border-purple-300">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⚡</span>
                  <h4 className="font-bold text-purple-900">{labels.fastestPayback[language]}</h4>
                </div>
                {fastestPayback && (
                  <>
                    <p className="text-xl font-bold text-purple-700 mb-1">{fastestPayback.name}</p>
                    <p className="text-sm text-purple-600">
                      {fastestPayback.results.economic_analysis?.payback_period_months || 0}{' '}
                      {labels.months[language]}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Comparison Chart */}
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-4">
                {labels.comparisonChart[language]}
              </h4>
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                    title: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
