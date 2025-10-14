'use client';

import { useState } from 'react';

/**
 * Preset simulation scenarios
 */
const SCENARIOS = {
  baseline: {
    name: { en: 'Baseline', es: 'Línea Base' },
    solar_growth_pct: 0,
    rainfall_change_pct: 0,
  },
  solarBoom: {
    name: { en: 'Solar Boom', es: 'Auge Solar' },
    solar_growth_pct: 150,
    rainfall_change_pct: 0,
  },
  drought: {
    name: { en: 'Drought Year', es: 'Año de Sequía' },
    solar_growth_pct: 0,
    rainfall_change_pct: -40,
  },
} as const;

interface ControlPanelProps {
  /** Language for labels (EN/ES) */
  language?: 'en' | 'es';
  /** Callback when simulation is triggered */
  onRunSimulation?: (params: SimulationParams) => void;
}

export interface SimulationParams {
  solar_growth_pct: number;
  rainfall_change_pct: number;
  start_date: string;
  end_date: string;
}

/**
 * ControlPanel Component
 *
 * Provides interactive controls for configuring simulation parameters:
 * - Solar growth rate slider (-50% to +200%)
 * - Rainfall change slider (-50% to +50%)
 * - Date range selection
 * - Preset scenario buttons
 * - Run simulation trigger
 *
 * @example
 * <ControlPanel
 *   language="en"
 *   onRunSimulation={(params) => console.log(params)}
 * />
 */
export function ControlPanel({ language = 'en', onRunSimulation }: ControlPanelProps) {
  // Calculate default dates (last 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [solarGrowth, setSolarGrowth] = useState(0);
  const [rainfallChange, setRainfallChange] = useState(0);
  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [isRunning, setIsRunning] = useState(false);

  /**
   * Apply a preset scenario
   */
  const applyScenario = (scenarioKey: keyof typeof SCENARIOS) => {
    const scenario = SCENARIOS[scenarioKey];
    setSolarGrowth(scenario.solar_growth_pct);
    setRainfallChange(scenario.rainfall_change_pct);
  };

  /**
   * Handle run simulation button click
   */
  const handleRunSimulation = () => {
    const params: SimulationParams = {
      solar_growth_pct: solarGrowth,
      rainfall_change_pct: rainfallChange,
      start_date: startDate,
      end_date: endDate,
    };

    console.log('🚀 Running simulation with parameters:', params);

    // Simulate loading state
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 2000);

    // Call parent callback if provided
    if (onRunSimulation) {
      onRunSimulation(params);
    }
  };

  /**
   * Validate date range
   */
  const isValidDateRange = startDate && endDate && new Date(startDate) < new Date(endDate);

  const labels = {
    title: { en: 'Simulation Controls', es: 'Controles de Simulación' },
    solarGrowth: { en: 'Solar Growth Rate', es: 'Tasa de Crecimiento Solar' },
    rainfallChange: { en: 'Rainfall Change', es: 'Cambio en Precipitación' },
    startDate: { en: 'Start Date', es: 'Fecha de Inicio' },
    endDate: { en: 'End Date', es: 'Fecha Final' },
    presets: { en: 'Preset Scenarios', es: 'Escenarios Predefinidos' },
    runButton: { en: 'Run Simulation', es: 'Ejecutar Simulación' },
    running: { en: 'Running...', es: 'Ejecutando...' },
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">{labels.title[language]}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {language === 'en'
            ? 'Configure parameters for your simulation'
            : 'Configure los parámetros para su simulación'}
        </p>
      </div>

      <div className="space-y-6">
        {/* Solar Growth Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="solar-growth" className="block text-sm font-medium text-gray-700">
              {labels.solarGrowth[language]}
            </label>
            <span className="text-sm font-semibold text-primary-600">
              {solarGrowth > 0 ? '+' : ''}
              {solarGrowth}%
            </span>
          </div>
          <input
            type="range"
            id="solar-growth"
            min="-50"
            max="200"
            step="5"
            value={solarGrowth}
            onChange={(e) => setSolarGrowth(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            disabled={isRunning}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>-50%</span>
            <span>0%</span>
            <span>+200%</span>
          </div>
        </div>

        {/* Rainfall Change Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="rainfall-change" className="block text-sm font-medium text-gray-700">
              {labels.rainfallChange[language]}
            </label>
            <span className="text-sm font-semibold text-blue-600">
              {rainfallChange > 0 ? '+' : ''}
              {rainfallChange}%
            </span>
          </div>
          <input
            type="range"
            id="rainfall-change"
            min="-50"
            max="50"
            step="5"
            value={rainfallChange}
            onChange={(e) => setRainfallChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            disabled={isRunning}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>-50%</span>
            <span>0%</span>
            <span>+50%</span>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
              {labels.startDate[language]}
            </label>
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              disabled={isRunning}
            />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
              {labels.endDate[language]}
            </label>
            <input
              type="date"
              id="end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              disabled={isRunning}
            />
          </div>
        </div>

        {/* Preset Scenarios */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {labels.presets[language]}
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => applyScenario('baseline')}
              disabled={isRunning}
              className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {SCENARIOS.baseline.name[language]}
            </button>
            <button
              onClick={() => applyScenario('solarBoom')}
              disabled={isRunning}
              className="px-3 py-2 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {SCENARIOS.solarBoom.name[language]}
            </button>
            <button
              onClick={() => applyScenario('drought')}
              disabled={isRunning}
              className="px-3 py-2 text-xs font-medium text-orange-700 bg-orange-100 rounded-md hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {SCENARIOS.drought.name[language]}
            </button>
          </div>
        </div>

        {/* Current Values Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            {language === 'en' ? 'Current Configuration' : 'Configuración Actual'}
          </h3>
          <div className="space-y-1 text-xs text-blue-800">
            <div className="flex justify-between">
              <span>{language === 'en' ? 'Solar:' : 'Solar:'}</span>
              <span className="font-medium">
                {solarGrowth > 0 ? '+' : ''}
                {solarGrowth}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>{language === 'en' ? 'Rainfall:' : 'Precipitación:'}</span>
              <span className="font-medium">
                {rainfallChange > 0 ? '+' : ''}
                {rainfallChange}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>{language === 'en' ? 'Period:' : 'Período:'}</span>
              <span className="font-medium">
                {new Date(endDate).getTime() - new Date(startDate).getTime() > 0
                  ? Math.ceil(
                      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : 0}{' '}
                {language === 'en' ? 'days' : 'días'}
              </span>
            </div>
          </div>
        </div>

        {/* Run Simulation Button */}
        <button
          onClick={handleRunSimulation}
          disabled={isRunning || !isValidDateRange}
          className="w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
        >
          {isRunning ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {labels.running[language]}
            </>
          ) : (
            labels.runButton[language]
          )}
        </button>

        {/* Validation Message */}
        {!isValidDateRange && (
          <p className="text-xs text-red-600 text-center">
            {language === 'en'
              ? 'Please select a valid date range (end date must be after start date)'
              : 'Por favor seleccione un rango de fechas válido (la fecha final debe ser posterior a la fecha inicial)'}
          </p>
        )}
      </div>
    </div>
  );
}
