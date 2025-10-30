'use client';

import { useMemo, forwardRef } from 'react';
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
import { WaterSimulationResult } from '@/lib/types';

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

interface WaterStressChartProps {
  /** Array of water simulation results to visualize */
  data: WaterSimulationResult[];
  /** Language for labels (EN/ES) */
  language?: 'en' | 'es';
  /** Height of the chart in pixels */
  height?: number;
}

/**
 * WaterStressChart Component
 *
 * Displays a line chart showing water stress trends over time
 * for different regions using Chart.js.
 *
 * Features:
 * - Multiple lines (one per region)
 * - Color-coded by stress level (green/yellow/orange/red)
 * - Horizontal threshold line at 0.8 (critical shortage)
 * - Responsive design
 * - Bilingual support (EN/ES)
 * - Tooltips with formatted data
 * - Grid lines and axis labels
 * - Supports ref forwarding for PNG export
 *
 * @example
 * const chartRef = useRef();
 * <WaterStressChart
 *   ref={chartRef}
 *   data={waterSimulationResults}
 *   language="en"
 *   height={300}
 * />
 */
export const WaterStressChart = forwardRef<ChartJS<'line'> | undefined, WaterStressChartProps>(
  function WaterStressChart({ data, language = 'en', height = 300 }, ref) {
  const labels = {
    title: { en: 'Water Stress Over Time', es: 'Estrés Hídrico en el Tiempo' },
    yAxis: { en: 'Water Stress', es: 'Estrés Hídrico' },
    xAxis: { en: 'Date', es: 'Fecha' },
    threshold: { en: 'Critical Shortage (80%)', es: 'Escasez Crítica (80%)' },
    stress: { en: 'Stress', es: 'Estrés' },
  };

  /**
   * Transform water simulation results into Chart.js dataset format
   * Groups data by region and creates separate line series
   */
  const chartData = useMemo(() => {
    // Extract unique dates and regions
    const uniqueDates = Array.from(new Set(data.map(r => r.date))).sort();
    const uniqueRegions = Array.from(new Set(data.map(r => r.region_id)));

    // Color palette for different regions
    const colors = [
      { border: 'rgb(6, 182, 212)', bg: 'rgba(6, 182, 212, 0.1)' }, // cyan
      { border: 'rgb(16, 185, 129)', bg: 'rgba(16, 185, 129, 0.1)' }, // green
      { border: 'rgb(251, 146, 60)', bg: 'rgba(251, 146, 60, 0.1)' }, // orange
      { border: 'rgb(239, 68, 68)', bg: 'rgba(239, 68, 68, 0.1)' }, // red
      { border: 'rgb(139, 92, 246)', bg: 'rgba(139, 92, 246, 0.1)' }, // violet
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
            if (value === null || value === undefined) return label;
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
        // Water stress ranges from 0 to 1 (0% to 100%)
        suggestedMin: 0,
        suggestedMax: 1,
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
          <div className="text-5xl mb-3">💧</div>
          <p className="text-sm text-gray-600">
            {language === 'en' ? 'No data to display' : 'Sin datos para mostrar'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ height }}>
      <Line ref={ref} data={chartData} options={options} />

      {/* Legend note below chart */}
      <div className="mt-2 flex items-center justify-center text-xs text-gray-500">
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <span>
          {language === 'en'
            ? 'Values above 80% indicate critical water shortage'
            : 'Valores superiores al 80% indican escasez crítica de agua'}
        </span>
      </div>
    </div>
  );
});
