'use client';

import { useEffect, useRef } from 'react';
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
import { Line, Bar } from 'react-chartjs-2';
import { SimulationResult } from '@/lib/model';

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

interface ChartsProps {
  results: SimulationResult[];
  type?: 'line' | 'bar';
}

/**
 * Interactive charts component using Chart.js
 *
 * Visualizes simulation results with:
 * - Time series energy data
 * - Climate data trends
 * - Customizable chart types
 */
export function Charts({ results, type = 'line' }: ChartsProps) {
  if (!results || results.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-gray-600 text-center">No data to display</p>
      </div>
    );
  }

  // Prepare data for charts
  const labels = results.map(r => r.date);

  const energyData = {
    labels,
    datasets: [
      {
        label: 'Demand (kWh)',
        data: results.map(r => r.demandKwh),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Solar Generation (kWh)',
        data: results.map(r => r.solarGenerationKwh),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Grid Generation (kWh)',
        data: results.map(r => r.gridGenerationKwh),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const climateData = {
    labels,
    datasets: [
      {
        label: 'Rainfall (mm)',
        data: results.map(r => r.rainfallMm),
        borderColor: 'rgb(14, 165, 233)',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Temperature (°C)',
        data: results.map(r => r.temperatureC),
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };

  const energyOptions: ChartOptions<'line' | 'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Energy Generation and Demand',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
        },
        ticks: {
          maxTicksLimit: 10,
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Energy (kWh)',
        },
      },
    },
  };

  const climateOptions: ChartOptions<'line' | 'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Climate Data',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
        },
        ticks: {
          maxTicksLimit: 10,
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Rainfall (mm)',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Temperature (°C)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const ChartComponent = type === 'line' ? Line : Bar;

  return (
    <div className="space-y-8">
      {/* Energy Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div style={{ height: '400px' }}>
          <ChartComponent data={energyData} options={energyOptions} />
        </div>
      </div>

      {/* Climate Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div style={{ height: '400px' }}>
          <ChartComponent data={climateData} options={climateOptions} />
        </div>
      </div>
    </div>
  );
}
