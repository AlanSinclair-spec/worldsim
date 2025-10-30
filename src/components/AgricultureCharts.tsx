'use client';

import { useMemo } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AgricultureChartsProps {
  results: {
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
  };
  language?: 'en' | 'es';
}

/**
 * Crop colors for consistent visualization
 */
const CROP_COLORS = {
  coffee: '#8B4513',      // Brown
  sugar_cane: '#10B981',  // Green
  corn: '#F59E0B',        // Yellow/Amber
  beans: '#DC2626',       // Red
};

/**
 * AgricultureCharts Component
 *
 * Displays interactive charts for agriculture simulation results:
 * 1. Crop Stress Over Time (Line Chart)
 * 2. Yield Impact by Crop (Bar Chart)
 * 3. Regional Impact (Horizontal Bar)
 *
 * Uses Chart.js for rendering with responsive design and bilingual support.
 */
function AgricultureCharts({ results, language = 'en' }: AgricultureChartsProps) {
    const labels = {
      stressOverTime: { en: 'Crop Stress Over Time', es: 'Estrés de Cultivos en el Tiempo' },
      yieldImpact: { en: 'Yield Impact by Crop', es: 'Impacto en Rendimiento por Cultivo' },
      regionalImpact: { en: 'Top 10 Regions by Economic Loss', es: 'Top 10 Regiones por Pérdida Económica' },
      stressPercent: { en: 'Stress (%)', es: 'Estrés (%)' },
      yieldChange: { en: 'Yield Change (%)', es: 'Cambio en Rendimiento (%)' },
      economicLoss: { en: 'Economic Loss ($M)', es: 'Pérdida Económica ($M)' },
      date: { en: 'Date', es: 'Fecha' },
      coffee: { en: 'Coffee', es: 'Café' },
      sugar_cane: { en: 'Sugar Cane', es: 'Caña de Azúcar' },
      corn: { en: 'Corn', es: 'Maíz' },
      beans: { en: 'Beans', es: 'Frijoles' },
    };

    /**
     * Chart 1: Crop Stress Over Time (Line Chart)
     */
    const stressOverTimeData = useMemo(() => {
      // Get unique dates sorted
      const dates = Array.from(new Set(results.daily_results.map(r => r.date))).sort();

      // Get unique crop types
      const cropTypes = Array.from(new Set(results.daily_results.map(r => r.crop_type)));

      // Build datasets for each crop
      const datasets = cropTypes.map(crop => {
        const data = dates.map(date => {
          // Calculate average stress for this crop on this date
          const cropResults = results.daily_results.filter(
            r => r.crop_type === crop && r.date === date
          );
          if (cropResults.length === 0) return 0;
          const avgStress = cropResults.reduce((sum, r) => sum + r.stress, 0) / cropResults.length;
          return avgStress * 100; // Convert to percentage
        });

        return {
          label: labels[crop as keyof typeof labels]?.[language] || crop,
          data,
          borderColor: CROP_COLORS[crop as keyof typeof CROP_COLORS] || '#6B7280',
          backgroundColor: CROP_COLORS[crop as keyof typeof CROP_COLORS] || '#6B7280',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
        };
      });

      return {
        labels: dates,
        datasets,
      };
    }, [results, language, labels]);

    /**
     * Chart 2: Yield Impact by Crop (Bar Chart)
     */
    const yieldImpactData = useMemo(() => {
      const cropTypes = Array.from(new Set(results.daily_results.map(r => r.crop_type)));

      const data = cropTypes.map(crop => {
        const cropResults = results.daily_results.filter(r => r.crop_type === crop);
        if (cropResults.length === 0) return 0;
        const avgYieldChange = cropResults.reduce((sum, r) => sum + r.yield_change_pct, 0) / cropResults.length;
        return avgYieldChange;
      });

      return {
        labels: cropTypes.map(crop => labels[crop as keyof typeof labels]?.[language] || crop),
        datasets: [
          {
            label: labels.yieldChange[language],
            data,
            backgroundColor: data.map(value => value < 0 ? '#DC2626' : '#10B981'),
            borderColor: data.map(value => value < 0 ? '#B91C1C' : '#059669'),
            borderWidth: 1,
          },
        ],
      };
    }, [results, language, labels]);

    /**
     * Chart 3: Regional Impact (Horizontal Bar)
     */
    const regionalImpactData = useMemo(() => {
      // Calculate economic loss per region
      const regionLosses = new Map<string, { name: string; loss: number }>();

      for (const result of results.daily_results) {
        const yieldLoss = result.baseline_yield_kg - result.actual_yield_kg;
        const price = result.crop_type === 'coffee' ? 3.5 :
                      result.crop_type === 'sugar_cane' ? 0.05 :
                      result.crop_type === 'corn' ? 0.25 : 0.8;
        const economicLoss = (yieldLoss * price) / 1_000_000; // Convert to millions

        if (regionLosses.has(result.region_id)) {
          const existing = regionLosses.get(result.region_id)!;
          existing.loss += economicLoss;
        } else {
          regionLosses.set(result.region_id, {
            name: result.region_name,
            loss: economicLoss,
          });
        }
      }

      // Sort by loss and take top 10
      const sortedRegions = Array.from(regionLosses.values())
        .sort((a, b) => b.loss - a.loss)
        .slice(0, 10);

      return {
        labels: sortedRegions.map(r => r.name),
        datasets: [
          {
            label: labels.economicLoss[language],
            data: sortedRegions.map(r => r.loss),
            backgroundColor: '#DC2626',
            borderColor: '#B91C1C',
            borderWidth: 1,
          },
        ],
      };
    }, [results, language, labels]);

    /**
     * Chart options
     */
    const lineChartOptions: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
          },
        },
        title: {
          display: true,
          text: labels.stressOverTime[language],
          font: {
            size: 16,
            weight: 'bold',
          },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (context) => {
              const value = context.parsed?.y ?? 0;
              return `${context.dataset.label}: ${value.toFixed(1)}%`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: labels.stressPercent[language],
          },
          ticks: {
            callback: (value) => `${value}%`,
          },
        },
        x: {
          title: {
            display: true,
            text: labels.date[language],
          },
        },
      },
    };

    const barChartOptions: ChartOptions<'bar'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: labels.yieldImpact[language],
          font: {
            size: 16,
            weight: 'bold',
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed?.y ?? 0;
              return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
            },
          },
        },
      },
      scales: {
        y: {
          title: {
            display: true,
            text: labels.yieldChange[language],
          },
          ticks: {
            callback: (value) => `${value}%`,
          },
        },
      },
    };

    const horizontalBarOptions: ChartOptions<'bar'> = {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: labels.regionalImpact[language],
          font: {
            size: 16,
            weight: 'bold',
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed?.x ?? 0;
              return `$${value.toFixed(2)}M`;
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: labels.economicLoss[language],
          },
          ticks: {
            callback: (value) => `$${value}M`,
          },
        },
      },
    };

  return (
    <div className="space-y-8">
      {/* Crop Stress Over Time */}
      <div className="h-[300px]">
        <Line data={stressOverTimeData} options={lineChartOptions} />
      </div>

      {/* Yield Impact by Crop */}
      <div className="h-[300px]">
        <Bar data={yieldImpactData} options={barChartOptions} />
      </div>

      {/* Regional Impact */}
      <div className="h-[400px]">
        <Bar data={regionalImpactData} options={horizontalBarOptions} />
      </div>
    </div>
  );
}

export default AgricultureCharts;
