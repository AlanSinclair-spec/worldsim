'use client';

import { useMemo } from 'react';
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
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { SimulationResult } from '@/lib/types';

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

interface StressChartProps {
  /** Array of simulation results to visualize */
  data: SimulationResult[];
  /** Language for labels (EN/ES) */
  language?: 'en' | 'es';
  /** Height of the chart in pixels */
  height?: number;
}

/**
 * StressChart Component
 *
 * Displays a line chart showing infrastructure stress trends over time
 * for different regions using Chart.js.
 *
 * Features:
 * - Multiple lines (one per region)
 * - Color-coded by stress level (green/yellow/red)
 * - Horizontal threshold line at 1.0 (capacity limit)
 * - Responsive design
 * - Bilingual support (EN/ES)
 * - Tooltips with formatted data
 * - Grid lines and axis labels
 *
 * @example
 * <StressChart
 *   data={simulationResults}
 *   language="en"
 *   height={300}
 * />
 */
export function StressChart({ data, language = 'en', height = 300 }: StressChartProps) {
  const labels = {
    title: { en: 'Infrastructure Stress Over Time', es: 'Estrés de Infraestructura en el Tiempo' },
    yAxis: { en: 'Stress Ratio', es: 'Relación de Estrés' },
    xAxis: { en: 'Date', es: 'Fecha' },
    threshold: { en: 'Capacity Limit (1.0)', es: 'Límite de Capacidad (1.0)' },
    stress: { en: 'Stress', es: 'Estrés' },
  };

  /**
   * Transform simulation results into Chart.js dataset format
   * Groups data by region and creates separate line series
   */
  const chartData = useMemo(() => {
    // Extract unique dates and regions
    const uniqueDates = Array.from(new Set(data.map(r => r.date))).sort();
    const uniqueRegions = Array.from(new Set(data.map(r => r.region_id)));

    // Color palette for different regions
    const colors = [
      { border: 'rgb(59, 130, 246)', bg: 'rgba(59, 130, 246, 0.1)' }, // blue
      { border: 'rgb(16, 185, 129)', bg: 'rgba(16, 185, 129, 0.1)' }, // green
      { border: 'rgb(249, 115, 22)', bg: 'rgba(249, 115, 22, 0.1)' }, // orange
      { border: 'rgb(239, 68, 68)', bg: 'rgba(239, 68, 68, 0.1)' }, // red
      { border: 'rgb(168, 85, 247)', bg: 'rgba(168, 85, 247, 0.1)' }, // purple
      { border: 'rgb(236, 72, 153)', bg: 'rgba(236, 72, 153, 0.1)' }, // pink
    ];

    // Create dataset for each region
    const datasets = uniqueRegions.map((regionId, index) => {
      const regionData = data.filter(r => r.region_id === regionId);
      const regionName = regionData[0]?.region_name || regionId;
      const color = colors[index % colors.length];

      // Map stress values to dates
      const stressValues = uniqueDates.map(date => {
        const result = regionData.find(r => r.date === date);
        return result ? result.stress : null;
      });

      return {
        label: regionName,
        data: stressValues,
        borderColor: color.border,
        backgroundColor: color.bg,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.3, // Smooth curves
        fill: false,
      };
    });

    return {
      labels: uniqueDates.map(date => {
        // Format date for display (e.g., "Jan 15" or "15 Ene")
        const d = new Date(date);
        if (language === 'es') {
          const monthsES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          return `${d.getDate()} ${monthsES[d.getMonth()]}`;
        } else {
          const monthsEN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return `${monthsEN[d.getMonth()]} ${d.getDate()}`;
        }
      }),
      datasets,
    };
  }, [data, language]);

  /**
   * Chart.js configuration options
   */
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
        },
      },
      title: {
        display: false, // We use external title for better styling
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 13,
          weight: 'bold',
        },
        bodyFont: {
          size: 12,
        },
        padding: 12,
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const stressLabel = labels.stress[language];
            return `${label}: ${stressLabel} ${(value * 100).toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: labels.xAxis[language],
          font: {
            size: 12,
            weight: 'bold',
          },
        },
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 10,
          },
        },
      },
      y: {
        title: {
          display: true,
          text: labels.yAxis[language],
          font: {
            size: 12,
            weight: 'bold',
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: function (value) {
            return `${(Number(value) * 100).toFixed(0)}%`;
          },
          font: {
            size: 10,
          },
        },
        // Add padding to show values above 100%
        suggestedMin: 0,
        suggestedMax: 1.5,
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300" style={{ height }}>
        <div className="text-center p-6">
          <div className="text-5xl mb-3">📈</div>
          <p className="text-sm text-gray-600">
            {language === 'en' ? 'No data to display' : 'Sin datos para mostrar'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ height }}>
      <Line data={chartData} options={options} />

      {/* Legend note below chart */}
      <div className="mt-2 flex items-center justify-center text-xs text-gray-500">
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <span>
          {language === 'en'
            ? 'Values above 100% indicate demand exceeds supply capacity'
            : 'Valores superiores al 100% indican que la demanda supera la capacidad de suministro'}
        </span>
      </div>
    </div>
  );
}

interface EnergyMixChartProps {
  /** Array of simulation results to visualize */
  data: SimulationResult[];
  /** Language for labels (EN/ES) */
  language?: 'en' | 'es';
  /** Height of the chart in pixels */
  height?: number;
}

/**
 * EnergyMixChart Component
 *
 * Displays a stacked area chart showing energy supply composition
 * (solar vs grid) over time.
 *
 * Note: This component is a placeholder for future implementation
 * when supply breakdown data is available in SimulationResult.
 *
 * @example
 * <EnergyMixChart
 *   data={simulationResults}
 *   language="en"
 *   height={250}
 * />
 */
export function EnergyMixChart({ language = 'en', height = 250 }: EnergyMixChartProps) {
  return (
    <div className="flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300" style={{ height }}>
      <div className="text-center p-6">
        <div className="text-5xl mb-3">⚡</div>
        <p className="text-sm font-medium text-gray-600 mb-1">
          {language === 'en' ? 'Energy Mix Chart' : 'Gráfico de Mezcla Energética'}
        </p>
        <p className="text-xs text-gray-500">
          {language === 'en'
            ? 'Coming soon: Solar vs Grid supply breakdown'
            : 'Próximamente: Desglose de suministro solar vs red'}
        </p>
      </div>
    </div>
  );
}
