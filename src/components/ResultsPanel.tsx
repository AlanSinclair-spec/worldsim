'use client';

import { useState } from 'react';
import { SimulationOutput } from '@/lib/model';

interface ResultsPanelProps {
  results: SimulationOutput | null;
  onExplain?: (language: 'en' | 'es') => void;
  isExplaining?: boolean;
  explanation?: string;
}

/**
 * Panel displaying simulation results and summary statistics
 *
 * Shows:
 * - Summary statistics
 * - Key metrics
 * - AI-generated explanations (optional)
 */
export function ResultsPanel({
  results,
  onExplain,
  isExplaining = false,
  explanation,
}: ResultsPanelProps) {
  const [language, setLanguage] = useState<'en' | 'es'>('en');

  if (!results) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Results</h2>
        <p className="text-gray-600">Run a simulation to see results here.</p>
      </div>
    );
  }

  const { summary, parameters } = results;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Results</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setLanguage('en');
              if (onExplain) onExplain('en');
            }}
            disabled={isExplaining}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              language === 'en'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } disabled:opacity-50`}
          >
            EN
          </button>
          <button
            onClick={() => {
              setLanguage('es');
              if (onExplain) onExplain('es');
            }}
            disabled={isExplaining}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              language === 'es'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } disabled:opacity-50`}
          >
            ES
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-1">Total Demand</h3>
          <p className="text-2xl font-bold text-blue-700">
            {(summary.totalDemandKwh / 1000).toFixed(1)} MWh
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-900 mb-1">Solar Generation</h3>
          <p className="text-2xl font-bold text-green-700">
            {(summary.totalSolarKwh / 1000).toFixed(1)} MWh
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-900 mb-1">Grid Generation</h3>
          <p className="text-2xl font-bold text-purple-700">
            {(summary.totalGridKwh / 1000).toFixed(1)} MWh
          </p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-orange-900 mb-1">Solar Percentage</h3>
          <p className="text-2xl font-bold text-orange-700">
            {summary.solarPercentage.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Deficit Information */}
      {summary.peakDeficit > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-red-900 mb-2">Energy Deficit Warning</h3>
          <p className="text-sm text-red-800">
            Peak deficit: {(summary.peakDeficit / 1000).toFixed(1)} MWh
          </p>
          <p className="text-sm text-red-800">
            Average daily deficit: {(summary.averageDeficit / 1000).toFixed(1)} MWh
          </p>
        </div>
      )}

      {/* Parameters Summary */}
      <div className="border-t pt-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Simulation Parameters</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600">Period:</span>
            <span className="ml-2 font-medium text-gray-900">
              {parameters.startDate} to {parameters.endDate}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Solar Growth:</span>
            <span className="ml-2 font-medium text-gray-900">
              {parameters.solarGrowthRate}% annually
            </span>
          </div>
          <div>
            <span className="text-gray-600">Demand Growth:</span>
            <span className="ml-2 font-medium text-gray-900">
              {parameters.demandGrowthRate}% annually
            </span>
          </div>
          <div>
            <span className="text-gray-600">Rainfall Change:</span>
            <span className="ml-2 font-medium text-gray-900">
              {parameters.rainfallChange > 0 ? '+' : ''}
              {parameters.rainfallChange}%
            </span>
          </div>
        </div>
      </div>

      {/* AI Explanation */}
      {explanation && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {language === 'en' ? 'Analysis' : 'Análisis'}
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-800 whitespace-pre-wrap">{explanation}</p>
          </div>
        </div>
      )}

      {/* Explain Button */}
      {onExplain && !explanation && (
        <button
          onClick={() => onExplain(language)}
          disabled={isExplaining}
          className="w-full mt-4 bg-secondary-600 text-white py-3 px-6 rounded-md hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isExplaining
            ? language === 'en'
              ? 'Generating Explanation...'
              : 'Generando Explicación...'
            : language === 'en'
              ? 'Get AI Explanation'
              : 'Obtener Explicación con IA'}
        </button>
      )}
    </div>
  );
}
