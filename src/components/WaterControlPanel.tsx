'use client';

import { useState, useEffect } from 'react';
import type { WaterSimulationResponse, WaterSimulationScenario } from '@/lib/types';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * Preset water simulation scenarios
 */
const PRESETS = {
  baseline: {
    name: { en: 'Baseline', es: 'Línea Base' },
    description: { en: 'Current conditions', es: 'Condiciones actuales' },
    water_demand_growth_pct: 0,
    rainfall_change_pct: 0,
    conservation_rate_pct: 0,
    color: 'gray',
  },
  populationBoom: {
    name: { en: 'Population Boom', es: 'Auge Poblacional' },
    description: { en: '+50% demand', es: '+50% demanda' },
    water_demand_growth_pct: 50,
    rainfall_change_pct: 0,
    conservation_rate_pct: 0,
    color: 'blue',
  },
  severeDrought: {
    name: { en: 'Severe Drought', es: 'Sequía Severa' },
    description: { en: '-30% rainfall', es: '-30% lluvia' },
    water_demand_growth_pct: 0,
    rainfall_change_pct: -30,
    conservation_rate_pct: 0,
    color: 'orange',
  },
  waterConservation: {
    name: { en: 'Water Conservation', es: 'Conservación Hídrica' },
    description: { en: '30% conservation', es: '30% conservación' },
    water_demand_growth_pct: 0,
    rainfall_change_pct: 0,
    conservation_rate_pct: 30,
    color: 'green',
  },
  climateCrisis: {
    name: { en: 'Climate Crisis', es: 'Crisis Climática' },
    description: { en: '+40% demand, -20% rain', es: '+40% demanda, -20% lluvia' },
    water_demand_growth_pct: 40,
    rainfall_change_pct: -20,
    conservation_rate_pct: 15,
    color: 'red',
  },
} as const;

type PresetKey = keyof typeof PRESETS;

interface WaterControlPanelProps {
  /** Language for labels (EN/ES) */
  language?: 'en' | 'es';
  /** Callback when simulation completes successfully */
  onSimulationComplete?: (results: WaterSimulationResponse, scenario?: {
    water_demand_growth_pct: number;
    rainfall_change_pct: number;
    conservation_rate_pct: number;
    start_date: string;
    end_date: string;
  }, executionTime?: number) => void;
  /** Initial scenario to load (from PolicyScenarios) */
  initialScenario?: WaterSimulationScenario | null;
}

/**
 * WaterControlPanel Component
 *
 * Provides interactive controls for configuring and running water stress simulations:
 * - Water demand growth slider (-50% to +200%)
 * - Rainfall change slider (-100% to +200%)
 * - Conservation rate slider (0% to 100%)
 * - Date range selection (last 30 days default)
 * - 5 preset scenario buttons with auto-run
 * - Real-time API integration with /api/simulate-water
 * - Loading states and error handling
 * - Execution time display
 *
 * @example
 * <WaterControlPanel
 *   language="en"
 *   onSimulationComplete={(results) => {
 *     console.log('Water simulation complete:', results);
 *     updateMapWithResults(results);
 *   }}
 * />
 */
export function WaterControlPanel({ language = 'en', onSimulationComplete, initialScenario }: WaterControlPanelProps) {
  // Calculate default dates (last 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  // State
  const [demandGrowth, setDemandGrowth] = useState(0);
  const [rainfallChange, setRainfallChange] = useState(0);
  const [conservationRate, setConservationRate] = useState(0);
  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  /**
   * Load scenario parameters when initialScenario changes
   */
  useEffect(() => {
    if (initialScenario) {
      setDemandGrowth(initialScenario.water_demand_growth_pct);
      setRainfallChange(initialScenario.rainfall_change_pct);
      setConservationRate(initialScenario.conservation_rate_pct);
      setStartDate(initialScenario.start_date);
      setEndDate(initialScenario.end_date);
      setActivePreset(null); // Clear preset selection
      setError(null);
      setSuccessMessage(null);
      console.log('✅ Water scenario loaded into WaterControlPanel:', initialScenario);
    }
  }, [initialScenario]);

  /**
   * Clear messages after timeout
   */
  const clearMessages = () => {
    setTimeout(() => {
      setError(null);
      setSuccessMessage(null);
    }, 5000);
  };

  /**
   * Run simulation by calling /api/simulate-water
   */
  const runSimulation = async (params: {
    water_demand_growth_pct: number;
    rainfall_change_pct: number;
    conservation_rate_pct: number;
    start_date: string;
    end_date: string;
  }) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [WaterControlPanel] 💧 Starting water simulation with parameters:`, params);

    setIsRunning(true);
    setError(null);
    setSuccessMessage(null);
    setExecutionTime(null);

    try {
      console.log(`[${new Date().toISOString()}] [WaterControlPanel] 📤 Sending POST request to /api/simulate-water`);
      console.log(`[${new Date().toISOString()}] [WaterControlPanel] Request payload:`, JSON.stringify(params, null, 2));

      const response = await fetch('/api/simulate-water', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      console.log(`[${new Date().toISOString()}] [WaterControlPanel] 📥 Received response with status:`, response.status);

      const result = await response.json();
      console.log(`[${new Date().toISOString()}] [WaterControlPanel] 📋 Parsed response:`, {
        success: result.success,
        hasData: !!result.data,
        error: result.error,
        details: result.details,
      });

      if (!result.success) {
        // Handle error response - format array or string
        let errorMsg: string;
        if (result.details) {
          // If details is an array (from Zod validation), format as list
          if (Array.isArray(result.details)) {
            errorMsg = result.details.join('; ');
          } else {
            errorMsg = String(result.details);
          }
        } else {
          errorMsg = result.error || 'Water simulation failed';
        }

        setError(errorMsg);
        console.error(`[${new Date().toISOString()}] [WaterControlPanel] ❌ Simulation failed with error:`, errorMsg);
        console.error(`[${new Date().toISOString()}] [WaterControlPanel] Full error response:`, result);
        clearMessages();
        return;
      }

      // Success!
      const execTime = result.data.execution_time_ms;
      setExecutionTime(execTime);
      setSuccessMessage(
        language === 'en'
          ? `Water simulation complete in ${(execTime / 1000).toFixed(2)}s`
          : `Simulación hídrica completada en ${(execTime / 1000).toFixed(2)}s`
      );

      console.log(`[${new Date().toISOString()}] [WaterControlPanel] ✅ Simulation successful! Summary:`, {
        run_id: result.data.run_id,
        daily_results_count: result.data.daily_results?.length || 0,
        avg_stress: result.data.summary?.avg_stress,
        max_stress: result.data.summary?.max_stress,
        execution_time_ms: execTime,
      });

      console.log(`[${new Date().toISOString()}] [WaterControlPanel] 📊 Full response data:`, result.data);

      // Pass results to parent via callback
      if (onSimulationComplete && result.data) {
        console.log(`[${new Date().toISOString()}] [WaterControlPanel] 🔔 Calling onSimulationComplete callback`);
        onSimulationComplete(
          {
            daily_results: result.data.daily_results,
            summary: result.data.summary,
          },
          params,
          execTime
        );
      } else {
        console.warn(`[${new Date().toISOString()}] [WaterControlPanel] ⚠️ No callback provided or no data to pass`);
      }

      clearMessages();
    } catch (err) {
      // Network or parsing error
      const errorMsg =
        language === 'en'
          ? 'Failed to connect to server. Please try again.'
          : 'Error al conectar con el servidor. Por favor intente de nuevo.';

      setError(errorMsg);
      console.error(`[${new Date().toISOString()}] [WaterControlPanel] ❌ Network error:`, err);
      console.error(`[${new Date().toISOString()}] [WaterControlPanel] Error stack:`, err instanceof Error ? err.stack : 'No stack trace');
      clearMessages();
    } finally {
      console.log(`[${new Date().toISOString()}] [WaterControlPanel] 🏁 Simulation complete, setting isRunning to false`);
      setIsRunning(false);
    }
  };

  /**
   * Handle manual simulation run
   */
  const handleRunSimulation = () => {
    runSimulation({
      water_demand_growth_pct: demandGrowth,
      rainfall_change_pct: rainfallChange,
      conservation_rate_pct: conservationRate,
      start_date: startDate,
      end_date: endDate,
    });
  };

  /**
   * Apply preset and auto-run simulation
   */
  const applyPreset = (presetKey: PresetKey) => {
    const preset = PRESETS[presetKey];

    // Update state
    setDemandGrowth(preset.water_demand_growth_pct);
    setRainfallChange(preset.rainfall_change_pct);
    setConservationRate(preset.conservation_rate_pct);
    setActivePreset(presetKey);

    // Auto-run simulation with preset values
    runSimulation({
      water_demand_growth_pct: preset.water_demand_growth_pct,
      rainfall_change_pct: preset.rainfall_change_pct,
      conservation_rate_pct: preset.conservation_rate_pct,
      start_date: startDate,
      end_date: endDate,
    });
  };

  /**
   * Check if manual changes have been made (deactivate preset)
   */
  const checkPresetMatch = () => {
    if (!activePreset) return;

    const preset = PRESETS[activePreset];
    if (
      demandGrowth !== preset.water_demand_growth_pct ||
      rainfallChange !== preset.rainfall_change_pct ||
      conservationRate !== preset.conservation_rate_pct
    ) {
      setActivePreset(null);
    }
  };

  /**
   * Validate date range
   */
  const isValidDateRange = startDate && endDate && new Date(startDate) < new Date(endDate);

  const labels = {
    title: { en: 'Water Simulation Controls', es: 'Controles de Simulación Hídrica' },
    demandGrowth: { en: 'Population & Industrial Growth', es: 'Crecimiento Poblacional e Industrial' },
    rainfallChange: { en: 'Climate Impact on Rainfall', es: 'Impacto Climático en Lluvia' },
    conservationRate: { en: 'Water Conservation Measures', es: 'Medidas de Conservación de Agua' },
    startDate: { en: 'Start Date', es: 'Fecha de Inicio' },
    endDate: { en: 'End Date', es: 'Fecha Final' },
    presets: { en: 'Preset Scenarios', es: 'Escenarios Predefinidos' },
    runButton: { en: 'Run Water Simulation', es: 'Ejecutar Simulación Hídrica' },
    running: { en: 'Running...', es: 'Ejecutando...' },
  };

  // Get preset button colors
  const getPresetColors = (color: string, isActive: boolean) => {
    const colors = {
      gray: {
        default: 'text-gray-700 bg-gray-100 hover:bg-gray-200 ring-gray-400',
        active: 'text-white bg-gray-600 ring-gray-600',
      },
      blue: {
        default: 'text-blue-700 bg-blue-100 hover:bg-blue-200 ring-blue-400',
        active: 'text-white bg-blue-600 ring-blue-600',
      },
      orange: {
        default: 'text-orange-700 bg-orange-100 hover:bg-orange-200 ring-orange-400',
        active: 'text-white bg-orange-600 ring-orange-600',
      },
      green: {
        default: 'text-green-700 bg-green-100 hover:bg-green-200 ring-green-400',
        active: 'text-white bg-green-600 ring-green-600',
      },
      red: {
        default: 'text-red-700 bg-red-100 hover:bg-red-200 ring-red-400',
        active: 'text-white bg-red-600 ring-red-600',
      },
    };

    return isActive ? colors[color as keyof typeof colors].active : colors[color as keyof typeof colors].default;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">{labels.title[language]}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {language === 'en'
            ? 'Configure parameters for your water stress simulation'
            : 'Configure los parámetros para su simulación hídrica'}
        </p>
      </div>

      <div className="space-y-6">
        {/* Success Message */}
        {successMessage && (
          <div role="status" aria-live="polite" className="flex items-center gap-3 bg-green-50 border-2 border-green-200 rounded-lg p-3 animate-fade-in">
            <svg className="h-5 w-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-900">{successMessage}</p>
              {executionTime && (
                <p className="text-xs text-green-700 mt-0.5">
                  {language === 'en' ? 'Processing time:' : 'Tiempo de procesamiento:'}{' '}
                  {executionTime}ms
                </p>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div role="alert" aria-live="assertive" className="flex items-start gap-3 bg-red-50 border-2 border-red-200 rounded-lg p-3 animate-fade-in">
            <svg className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900">
                {language === 'en' ? 'Error' : 'Error'}
              </p>
              {/* Handle multiple errors separated by semicolons */}
              {error.includes(';') ? (
                <ul className="text-xs text-red-700 mt-1 list-disc list-inside space-y-0.5">
                  {error.split(';').map((err, index) => (
                    <li key={index}>{err.trim()}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-red-700 mt-1">{error}</p>
              )}
            </div>
          </div>
        )}

        {/* Preset Scenarios */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 md:mb-3">
            {labels.presets[language]}
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {(Object.keys(PRESETS) as PresetKey[]).map((key) => {
              const preset = PRESETS[key];
              const isActive = activePreset === key;

              return (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  disabled={isRunning}
                  aria-label={`${preset.name[language]}: ${preset.description[language]}`}
                  aria-pressed={isActive}
                  className={`relative px-2 md:px-3 py-2.5 md:py-3 text-[10px] sm:text-xs font-medium rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all touch-manipulation ${getPresetColors(
                    preset.color,
                    isActive
                  )} ${isActive ? 'ring-2 scale-105 shadow-md' : ''}`}
                >
                  {isActive && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                  )}
                  <div className="font-semibold">{preset.name[language]}</div>
                  <div className={`text-[10px] mt-0.5 ${isActive ? 'text-white/90' : 'opacity-75'}`}>
                    {preset.description[language]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Water Demand Growth Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="demand-growth" className="block text-xs sm:text-sm font-medium text-gray-700">
              {labels.demandGrowth[language]}
            </label>
            <span className="text-xs sm:text-sm font-semibold text-blue-600">
              {demandGrowth > 0 ? '+' : ''}
              {demandGrowth}%
            </span>
          </div>
          <input
            type="range"
            id="demand-growth"
            name="demand-growth"
            min="-50"
            max="200"
            step="5"
            value={demandGrowth}
            onChange={(e) => {
              setDemandGrowth(Number(e.target.value));
              checkPresetMatch();
            }}
            aria-label={labels.demandGrowth[language]}
            aria-valuemin={-50}
            aria-valuemax={200}
            aria-valuenow={demandGrowth}
            aria-valuetext={`${demandGrowth > 0 ? '+' : ''}${demandGrowth}%`}
            className="w-full h-3 md:h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 touch-manipulation"
            style={{
              WebkitAppearance: 'none',
            }}
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
            <label htmlFor="rainfall-change" className="block text-xs sm:text-sm font-medium text-gray-700">
              {labels.rainfallChange[language]}
            </label>
            <span className="text-xs sm:text-sm font-semibold text-cyan-600">
              {rainfallChange > 0 ? '+' : ''}
              {rainfallChange}%
            </span>
          </div>
          <input
            type="range"
            id="rainfall-change"
            name="rainfall-change"
            min="-100"
            max="200"
            step="5"
            value={rainfallChange}
            onChange={(e) => {
              setRainfallChange(Number(e.target.value));
              checkPresetMatch();
            }}
            aria-label={labels.rainfallChange[language]}
            aria-valuemin={-100}
            aria-valuemax={200}
            aria-valuenow={rainfallChange}
            aria-valuetext={`${rainfallChange > 0 ? '+' : ''}${rainfallChange}%`}
            className="w-full h-3 md:h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-600 touch-manipulation"
            style={{
              WebkitAppearance: 'none',
            }}
            disabled={isRunning}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>-100%</span>
            <span>0%</span>
            <span>+200%</span>
          </div>
        </div>

        {/* Conservation Rate Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="conservation-rate" className="block text-xs sm:text-sm font-medium text-gray-700">
              {labels.conservationRate[language]}
            </label>
            <span className="text-xs sm:text-sm font-semibold text-green-600">
              {conservationRate}%
            </span>
          </div>
          <input
            type="range"
            id="conservation-rate"
            name="conservation-rate"
            min="0"
            max="100"
            step="5"
            value={conservationRate}
            onChange={(e) => {
              setConservationRate(Number(e.target.value));
              checkPresetMatch();
            }}
            aria-label={labels.conservationRate[language]}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={conservationRate}
            aria-valuetext={`${conservationRate}%`}
            className="w-full h-3 md:h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600 touch-manipulation"
            style={{
              WebkitAppearance: 'none',
            }}
            disabled={isRunning}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="water-start-date" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              {labels.startDate[language]}
            </label>
            <input
              type="date"
              id="water-start-date"
              name="water-start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              aria-label={labels.startDate[language]}
              aria-required="true"
              className="w-full px-3 py-2.5 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm touch-manipulation"
              disabled={isRunning}
            />
          </div>
          <div>
            <label htmlFor="water-end-date" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              {labels.endDate[language]}
            </label>
            <input
              type="date"
              id="water-end-date"
              name="water-end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              aria-label={labels.endDate[language]}
              aria-required="true"
              className="w-full px-3 py-2.5 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm touch-manipulation"
              disabled={isRunning}
            />
          </div>
        </div>

        {/* Current Values Summary */}
        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-cyan-900 mb-2">
            {language === 'en' ? 'Current Configuration' : 'Configuración Actual'}
          </h3>
          <div className="space-y-1 text-xs text-cyan-800">
            <div className="flex justify-between">
              <span>{language === 'en' ? 'Demand Growth:' : 'Crecimiento de Demanda:'}</span>
              <span className="font-medium">
                {demandGrowth > 0 ? '+' : ''}
                {demandGrowth}%
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
              <span>{language === 'en' ? 'Conservation:' : 'Conservación:'}</span>
              <span className="font-medium">{conservationRate}%</span>
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
          aria-label={isRunning ? labels.running[language] : labels.runButton[language]}
          aria-busy={isRunning}
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          {isRunning ? (
            <LoadingSpinner
              size="sm"
              color="text-white"
              text={labels.running[language]}
              center
            />
          ) : (
            <span className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              {labels.runButton[language]}
            </span>
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

      {/* Add CSS for fade-in animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in {
            animation: fade-in 0.3s ease-out;
          }
        `
      }} />
    </div>
  );
}
