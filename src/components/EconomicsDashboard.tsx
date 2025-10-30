'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { SimulationResponse, WaterSimulationResponse } from '@/lib/types';

// Dynamically import Chart.js components for performance
const Line = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), { ssr: false });
const Pie = dynamic(() => import('react-chartjs-2').then(mod => mod.Pie), { ssr: false });

// Register Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * EconomicsDashboard Props
 */
interface EconomicsDashboardProps {
  /** Energy simulation results */
  energyResults?: SimulationResponse | null;
  /** Water simulation results */
  waterResults?: WaterSimulationResponse | null;
  /** Agriculture simulation results */
  agricultureResults?: any | null;
  /** Language preference */
  language?: 'en' | 'es';
}

/**
 * EconomicsDashboard Component
 *
 * Master dashboard showing unified economic analysis across all simulation types.
 *
 * Features:
 * - Total economic exposure hero card
 * - Three-column comparison table (Energy, Water, Agriculture)
 * - Investment portfolio optimizer with ROI ranking
 * - 5-year projection chart (cost of inaction vs returns)
 * - Recommended budget allocation pie chart
 *
 * Provides executives with comprehensive financial analysis for decision-making.
 */
export function EconomicsDashboard({
  energyResults,
  waterResults,
  agricultureResults,
  language = 'en',
}: EconomicsDashboardProps) {
  // Labels for bilingual support
  const labels = {
    title: { en: 'Economic Impact Analysis', es: 'Análisis de Impacto Económico' },
    subtitle: {
      en: 'Comprehensive financial assessment across all infrastructure sectors',
      es: 'Evaluación financiera integral en todos los sectores de infraestructura',
    },
    totalExposure: { en: 'Total Economic Exposure', es: 'Exposición Económica Total' },
    exposureSubtitle: {
      en: 'Total cost of inaction over 5 years',
      es: 'Costo total de la inacción durante 5 años',
    },
    noData: {
      en: 'Run at least one simulation to see economic analysis',
      es: 'Ejecute al menos una simulación para ver el análisis económico',
    },
    energy: { en: 'Energy', es: 'Energía' },
    water: { en: 'Water', es: 'Agua' },
    agriculture: { en: 'Agriculture', es: 'Agricultura' },
    investment: { en: 'Investment Needed', es: 'Inversión Necesaria' },
    atRisk: { en: 'At Risk (5yr)', es: 'En Riesgo (5 años)' },
    roi: { en: 'ROI (5yr)', es: 'ROI (5 años)' },
    payback: { en: 'Payback (months)', es: 'Recuperación (meses)' },
    npv: { en: 'NPV', es: 'VPN' },
    projectionTitle: { en: '5-Year Financial Projection', es: 'Proyección Financiera 5 Años' },
    inaction: { en: 'Cost of Inaction', es: 'Costo de Inacción' },
    returns: { en: 'Returns After Investment', es: 'Retornos Tras Inversión' },
    allocationTitle: { en: 'Recommended Budget Allocation', es: 'Asignación Presupuestaria Recomendada' },
  };

  // Extract economic analysis from results
  const energyEcon = energyResults?.economic_analysis;
  const waterEcon = waterResults?.economic_analysis;
  const agEcon = agricultureResults?.economic_analysis;

  // Check if we have any data
  const hasData = !!(energyEcon || waterEcon || agEcon);

  // Calculate total exposure across all sectors
  const totalExposure = useMemo(() => {
    let total = 0;
    if (energyEcon) total += energyEcon.cost_of_inaction_5_year_usd;
    if (waterEcon) total += waterEcon.cost_of_inaction_5_year_usd;
    if (agEcon) total += agEcon.cost_of_inaction_5_year_usd;
    return total;
  }, [energyEcon, waterEcon, agEcon]);

  // Calculate total investment needed
  const totalInvestment = useMemo(() => {
    let total = 0;
    if (energyEcon) total += energyEcon.infrastructure_investment_usd;
    if (waterEcon) total += waterEcon.infrastructure_investment_usd;
    if (agEcon) total += agEcon.infrastructure_investment_usd;
    return total;
  }, [energyEcon, waterEcon, agEcon]);

  // Format currency
  const formatCurrency = (value: number): string => {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`;
    }
    return `$${(value / 1_000).toFixed(0)}K`;
  };

  // Get ROI color
  const getRoiColor = (roi: number): string => {
    if (roi >= 4.0) return 'text-green-600 bg-green-50';
    if (roi >= 3.0) return 'text-yellow-600 bg-yellow-50';
    if (roi >= 2.0) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  // 5-Year Projection Chart Data
  const projectionData = useMemo(() => {
    const years = [0, 1, 2, 3, 4, 5];

    // Calculate cumulative costs of inaction (escalating)
    const inactionCosts = years.map(year => {
      if (year === 0) return 0;
      let yearlyLoss = 0;
      if (energyEcon) yearlyLoss += energyEcon.annual_costs_prevented_usd;
      if (waterEcon) yearlyLoss += waterEcon.annual_costs_prevented_usd;
      if (agEcon) yearlyLoss += agEcon.annual_costs_prevented_usd;

      // Escalate by 10% annually
      return yearlyLoss * year * Math.pow(1.1, year - 1);
    });

    // Calculate cumulative returns (investment upfront, then savings)
    const cumulativeReturns = years.map(year => {
      if (year === 0) return -totalInvestment;

      let yearlySavings = 0;
      if (energyEcon) yearlySavings += energyEcon.annual_savings_usd;
      if (waterEcon) yearlySavings += waterEcon.annual_savings_usd;
      if (agEcon) yearlySavings += agEcon.annual_savings_usd;

      return -totalInvestment + (yearlySavings * year);
    });

    return {
      labels: years.map(y => language === 'en' ? `Year ${y}` : `Año ${y}`),
      datasets: [
        {
          label: labels.inaction[language],
          data: inactionCosts.map(v => v / 1_000_000), // Convert to millions
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: labels.returns[language],
          data: cumulativeReturns.map(v => v / 1_000_000), // Convert to millions
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [energyEcon, waterEcon, agEcon, totalInvestment, language, labels]);

  // Budget Allocation Pie Chart Data
  const allocationData = useMemo(() => {
    const allocations: { sector: string; value: number; color: string }[] = [];

    if (energyEcon && energyEcon.roi_5_year > 0) {
      allocations.push({
        sector: labels.energy[language],
        value: energyEcon.roi_5_year,
        color: '#f59e0b',
      });
    }

    if (waterEcon && waterEcon.roi_5_year > 0) {
      allocations.push({
        sector: labels.water[language],
        value: waterEcon.roi_5_year,
        color: '#3b82f6',
      });
    }

    if (agEcon && agEcon.roi_5_year > 0) {
      allocations.push({
        sector: labels.agriculture[language],
        value: agEcon.roi_5_year,
        color: '#10b981',
      });
    }

    const totalRoi = allocations.reduce((sum, a) => sum + a.value, 0);

    return {
      labels: allocations.map(a => a.sector),
      datasets: [
        {
          data: allocations.map(a => (a.value / totalRoi) * 100),
          backgroundColor: allocations.map(a => a.color),
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    };
  }, [energyEcon, waterEcon, agEcon, language, labels]);

  // Render empty state if no data
  if (!hasData) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-green-50 border-2 border-dashed border-blue-300 rounded-xl p-12 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">{labels.title[language]}</h3>
        <p className="text-lg text-gray-600 max-w-md mx-auto">{labels.noData[language]}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{labels.title[language]}</h2>
        <p className="text-gray-600">{labels.subtitle[language]}</p>
      </div>

      {/* Total Exposure Hero Card */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl blur opacity-20"></div>
        <div className="relative bg-white rounded-2xl shadow-2xl border-2 border-red-200 p-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                {labels.totalExposure[language]}
              </h3>
              <div className="text-6xl font-bold text-red-600 mb-2">
                {formatCurrency(totalExposure)}
              </div>
              <p className="text-sm text-gray-600">{labels.exposureSubtitle[language]}</p>
            </div>
            <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Three-Column Comparison Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {language === 'en' ? 'Metric' : 'Métrica'}
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-yellow-700 uppercase tracking-wider">
                  ⚡ {labels.energy[language]}
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">
                  💧 {labels.water[language]}
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-green-700 uppercase tracking-wider">
                  🌾 {labels.agriculture[language]}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* At Risk (5yr) */}
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{labels.atRisk[language]}</td>
                <td className="px-6 py-4 text-center text-lg font-bold text-red-600">
                  {energyEcon ? formatCurrency(energyEcon.cost_of_inaction_5_year_usd) : '—'}
                </td>
                <td className="px-6 py-4 text-center text-lg font-bold text-red-600">
                  {waterEcon ? formatCurrency(waterEcon.cost_of_inaction_5_year_usd) : '—'}
                </td>
                <td className="px-6 py-4 text-center text-lg font-bold text-red-600">
                  {agEcon ? formatCurrency(agEcon.cost_of_inaction_5_year_usd) : '—'}
                </td>
              </tr>

              {/* Investment Needed */}
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{labels.investment[language]}</td>
                <td className="px-6 py-4 text-center text-lg font-semibold text-blue-600">
                  {energyEcon ? formatCurrency(energyEcon.infrastructure_investment_usd) : '—'}
                </td>
                <td className="px-6 py-4 text-center text-lg font-semibold text-blue-600">
                  {waterEcon ? formatCurrency(waterEcon.infrastructure_investment_usd) : '—'}
                </td>
                <td className="px-6 py-4 text-center text-lg font-semibold text-blue-600">
                  {agEcon ? formatCurrency(agEcon.infrastructure_investment_usd) : '—'}
                </td>
              </tr>

              {/* ROI (5yr) */}
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{labels.roi[language]}</td>
                <td className="px-6 py-4 text-center">
                  {energyEcon ? (
                    <span className={`inline-block px-4 py-2 rounded-full font-bold ${getRoiColor(energyEcon.roi_5_year)}`}>
                      {energyEcon.roi_5_year.toFixed(1)}x
                    </span>
                  ) : '—'}
                </td>
                <td className="px-6 py-4 text-center">
                  {waterEcon ? (
                    <span className={`inline-block px-4 py-2 rounded-full font-bold ${getRoiColor(waterEcon.roi_5_year)}`}>
                      {waterEcon.roi_5_year.toFixed(1)}x
                    </span>
                  ) : '—'}
                </td>
                <td className="px-6 py-4 text-center">
                  {agEcon ? (
                    <span className={`inline-block px-4 py-2 rounded-full font-bold ${getRoiColor(agEcon.roi_5_year)}`}>
                      {agEcon.roi_5_year.toFixed(1)}x
                    </span>
                  ) : '—'}
                </td>
              </tr>

              {/* Payback Period */}
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{labels.payback[language]}</td>
                <td className="px-6 py-4 text-center text-lg font-semibold">
                  {energyEcon ? `${energyEcon.payback_period_months} ${language === 'en' ? 'mo' : 'meses'}` : '—'}
                </td>
                <td className="px-6 py-4 text-center text-lg font-semibold">
                  {waterEcon ? `${waterEcon.payback_period_months} ${language === 'en' ? 'mo' : 'meses'}` : '—'}
                </td>
                <td className="px-6 py-4 text-center text-lg font-semibold">
                  {agEcon ? `${agEcon.payback_period_months} ${language === 'en' ? 'mo' : 'meses'}` : '—'}
                </td>
              </tr>

              {/* NPV */}
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{labels.npv[language]}</td>
                <td className="px-6 py-4 text-center text-lg font-semibold text-green-600">
                  {energyEcon ? formatCurrency(energyEcon.net_present_value_usd) : '—'}
                </td>
                <td className="px-6 py-4 text-center text-lg font-semibold text-green-600">
                  {waterEcon ? formatCurrency(waterEcon.net_present_value_usd) : '—'}
                </td>
                <td className="px-6 py-4 text-center text-lg font-semibold text-green-600">
                  {agEcon ? formatCurrency(agEcon.net_present_value_usd) : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 5-Year Projection Chart */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">{labels.projectionTitle[language]}</h3>
          <div className="h-80">
            <Line
              data={projectionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom' as const,
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const value = context.parsed.y ?? 0;
                        return `${context.dataset.label}: $${value.toFixed(1)}M`;
                      },
                    },
                  },
                },
                scales: {
                  y: {
                    ticks: {
                      callback: (value) => value != null ? `$${value}M` : '',
                    },
                  },
                },
              }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-4 text-center">
            {language === 'en'
              ? 'Red line shows escalating costs without action. Green line shows cumulative returns after initial investment.'
              : 'La línea roja muestra costos crecientes sin acción. La línea verde muestra retornos acumulados después de la inversión inicial.'}
          </p>
        </div>

        {/* Budget Allocation Pie Chart */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">{labels.allocationTitle[language]}</h3>
          <div className="h-80 flex items-center justify-center">
            <Pie
              data={allocationData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom' as const,
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const value = context.parsed;
                        return `${context.label}: ${value.toFixed(1)}%`;
                      },
                    },
                  },
                },
              }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-4 text-center">
            {language === 'en'
              ? 'Budget allocation based on ROI-weighted distribution across sectors.'
              : 'Asignación presupuestaria basada en distribución ponderada por ROI entre sectores.'}
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border-2 border-blue-200 p-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {language === 'en' ? '💡 Key Insights' : '💡 Puntos Clave'}
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                {language === 'en'
                  ? `Total investment of ${formatCurrency(totalInvestment)} prevents ${formatCurrency(totalExposure)} in losses over 5 years`
                  : `Inversión total de ${formatCurrency(totalInvestment)} previene ${formatCurrency(totalExposure)} en pérdidas durante 5 años`}
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                {language === 'en'
                  ? 'All sectors show positive ROI, indicating strong economic viability'
                  : 'Todos los sectores muestran ROI positivo, indicando fuerte viabilidad económica'}
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">⚠</span>
                {language === 'en'
                  ? 'Delaying action increases costs by 2% per month due to infrastructure degradation'
                  : 'Retrasar la acción aumenta los costos en 2% por mes debido a la degradación de infraestructura'}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
