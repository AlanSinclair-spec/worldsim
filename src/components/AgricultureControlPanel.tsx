'use client';

import { useState, useEffect } from 'react';

/**
 * AgricultureControlPanel Component
 *
 * Interactive control panel for running agriculture impact simulations.
 * Allows users to adjust climate parameters and see crop yield impacts.
 *
 * Features:
 * - Rainfall change slider (-50% to +50%)
 * - Temperature change slider (-2°C to +5°C)
 * - Irrigation improvement slider (0% to 50%)
 * - Crop type selector (all/coffee/sugar_cane/corn/beans)
 * - Pre-loaded scenarios
 * - Date range inputs
 * - Bilingual support (EN/ES)
 */

interface AgricultureControlPanelProps {
  onRunSimulation: (params: AgricultureSimulationParams) => void;
  loading?: boolean;
  language?: 'en' | 'es';
  initialScenario?: AgricultureScenario | null;
}

export interface AgricultureSimulationParams {
  rainfall_change_pct: number;
  temperature_change_c: number;
  irrigation_improvement_pct: number;
  crop_type: string;
  start_date: string;
  end_date: string;
}

export interface AgricultureScenario {
  id: string;
  title: { en: string; es: string };
  description: { en: string; es: string };
  icon: string;
  category: 'agriculture';
  impact: 'positive' | 'negative' | 'critical';
  parameters: AgricultureSimulationParams;
}

const labels = {
  title: { en: 'Agriculture Impact Simulator', es: 'Simulador de Impacto Agrícola' },
  subtitle: {
    en: 'Model crop yield changes under different climate scenarios',
    es: 'Modele cambios en rendimiento de cultivos bajo diferentes escenarios climáticos',
  },
  rainfallChange: { en: 'Climate Impact on Rainfall', es: 'Impacto Climático en Lluvia' },
  temperatureChange: { en: 'Temperature Shift (Climate Change)', es: 'Cambio de Temperatura (Cambio Climático)' },
  irrigationImprovement: { en: 'Irrigation Infrastructure Investment', es: 'Inversión en Infraestructura de Riego' },
  cropType: { en: 'Crop Type', es: 'Tipo de Cultivo' },
  allCrops: { en: 'All Crops', es: 'Todos los Cultivos' },
  coffee: { en: 'Coffee', es: 'Café' },
  sugarCane: { en: 'Sugar Cane', es: 'Caña de Azúcar' },
  corn: { en: 'Corn', es: 'Maíz' },
  beans: { en: 'Beans', es: 'Frijoles' },
  startDate: { en: 'Start Date', es: 'Fecha de Inicio' },
  endDate: { en: 'End Date', es: 'Fecha de Fin' },
  runSimulation: { en: 'Run Simulation', es: 'Ejecutar Simulación' },
  quickStart: { en: 'Quick-Start Scenarios', es: 'Escenarios de Inicio Rápido' },
};

const presetScenarios: AgricultureScenario[] = [
  {
    id: 'baseline-agriculture',
    title: { en: 'Baseline Agriculture', es: 'Agricultura Base' },
    description: {
      en: 'Current conditions - no changes to climate or infrastructure',
      es: 'Condiciones actuales - sin cambios climáticos o de infraestructura',
    },
    icon: '🌱',
    category: 'agriculture',
    impact: 'positive',
    parameters: {
      rainfall_change_pct: 0,
      temperature_change_c: 0,
      irrigation_improvement_pct: 0,
      crop_type: 'all',
      start_date: '2024-09-16',
      end_date: '2024-10-15',
    },
  },
  {
    id: 'climate-change-2030',
    title: { en: 'Climate Change 2030', es: 'Cambio Climático 2030' },
    description: {
      en: 'Projected climate conditions by 2030: less rainfall, warmer temperatures',
      es: 'Condiciones climáticas proyectadas para 2030: menos lluvia, temperaturas más cálidas',
    },
    icon: '🌡️',
    category: 'agriculture',
    impact: 'negative',
    parameters: {
      rainfall_change_pct: -15,
      temperature_change_c: 1.5,
      irrigation_improvement_pct: 0,
      crop_type: 'all',
      start_date: '2024-09-16',
      end_date: '2024-10-15',
    },
  },
  {
    id: 'severe-drought-impact',
    title: { en: 'Severe Drought Impact', es: 'Impacto de Sequía Severa' },
    description: {
      en: 'Crisis scenario: 30% less rainfall + 2°C warmer',
      es: 'Escenario de crisis: 30% menos lluvia + 2°C más calor',
    },
    icon: '🌵',
    category: 'agriculture',
    impact: 'critical',
    parameters: {
      rainfall_change_pct: -30,
      temperature_change_c: 2,
      irrigation_improvement_pct: 0,
      crop_type: 'all',
      start_date: '2024-09-16',
      end_date: '2024-10-15',
    },
  },
  {
    id: 'irrigation-investment',
    title: { en: 'Irrigation Investment', es: 'Inversión en Riego' },
    description: {
      en: 'Mitigation strategy: 30% improvement in irrigation systems',
      es: 'Estrategia de mitigación: 30% de mejora en sistemas de riego',
    },
    icon: '💧',
    category: 'agriculture',
    impact: 'positive',
    parameters: {
      rainfall_change_pct: 0,
      temperature_change_c: 0,
      irrigation_improvement_pct: 30,
      crop_type: 'all',
      start_date: '2024-09-16',
      end_date: '2024-10-15',
    },
  },
  {
    id: 'optimal-growing-season',
    title: { en: 'Optimal Growing Season', es: 'Temporada de Crecimiento Óptima' },
    description: {
      en: 'Best case: 20% more rainfall + irrigation improvements',
      es: 'Mejor caso: 20% más lluvia + mejoras en riego',
    },
    icon: '🌾',
    category: 'agriculture',
    impact: 'positive',
    parameters: {
      rainfall_change_pct: 20,
      temperature_change_c: 0,
      irrigation_improvement_pct: 20,
      crop_type: 'all',
      start_date: '2024-09-16',
      end_date: '2024-10-15',
    },
  },
];

export function AgricultureControlPanel({
  onRunSimulation,
  loading = false,
  language = 'en',
  initialScenario = null,
}: AgricultureControlPanelProps) {
  // State for simulation parameters
  const [rainfallChange, setRainfallChange] = useState(0);
  const [temperatureChange, setTemperatureChange] = useState(0);
  const [irrigationImprovement, setIrrigationImprovement] = useState(0);
  const [cropType, setCropType] = useState('all');
  const [startDate, setStartDate] = useState('2024-09-16');
  const [endDate, setEndDate] = useState('2024-10-15');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Load scenario parameters when initialScenario changes
   */
  useEffect(() => {
    if (initialScenario) {
      setRainfallChange(initialScenario.parameters.rainfall_change_pct);
      setTemperatureChange(initialScenario.parameters.temperature_change_c);
      setIrrigationImprovement(initialScenario.parameters.irrigation_improvement_pct);
      setCropType(initialScenario.parameters.crop_type);
      setStartDate(initialScenario.parameters.start_date);
      setEndDate(initialScenario.parameters.end_date);
      setActivePreset(null);
      setError(null);
      setSuccessMessage('✅ Scenario loaded! Click "Run Simulation" to test.');
      console.log('✅ Scenario loaded into AgricultureControlPanel:', initialScenario);

      // Auto-clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    }
  }, [initialScenario]);

  /**
   * Handle preset scenario selection
   */
  const handlePresetClick = (scenario: AgricultureScenario) => {
    setRainfallChange(scenario.parameters.rainfall_change_pct);
    setTemperatureChange(scenario.parameters.temperature_change_c);
    setIrrigationImprovement(scenario.parameters.irrigation_improvement_pct);
    setCropType(scenario.parameters.crop_type);
    setStartDate(scenario.parameters.start_date);
    setEndDate(scenario.parameters.end_date);
    setActivePreset(scenario.id);
    setError(null);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (new Date(endDate) <= new Date(startDate)) {
      setError(
        language === 'en'
          ? 'End date must be after start date'
          : 'La fecha de fin debe ser posterior a la fecha de inicio'
      );
      return;
    }

    // Build parameters object
    const params: AgricultureSimulationParams = {
      rainfall_change_pct: rainfallChange,
      temperature_change_c: temperatureChange,
      irrigation_improvement_pct: irrigationImprovement,
      crop_type: cropType,
      start_date: startDate,
      end_date: endDate,
    };

    console.log('🌾 Running agriculture simulation with parameters:', params);
    onRunSimulation(params);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {labels.title[language]}
        </h2>
        <p className="text-gray-600">{labels.subtitle[language]}</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Quick-Start Scenarios */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          {labels.quickStart[language]}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {presetScenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => handlePresetClick(scenario)}
              disabled={loading}
              className={`p-3 rounded-lg border-2 transition-all ${
                activePreset === scenario.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="text-2xl mb-1">{scenario.icon}</div>
              <div className="text-xs font-semibold text-gray-900">
                {scenario.title[language]}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit}>
        {/* Rainfall Change Slider */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {labels.rainfallChange[language]}:{' '}
            <span className="text-blue-600">{rainfallChange > 0 ? '+' : ''}{rainfallChange}%</span>
          </label>
          <input
            type="range"
            min="-50"
            max="50"
            step="5"
            value={rainfallChange}
            onChange={(e) => {
              setRainfallChange(Number(e.target.value));
              setActivePreset(null);
            }}
            disabled={loading}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>-50% {language === 'en' ? '(Drought)' : '(Sequía)'}</span>
            <span>0%</span>
            <span>+50% {language === 'en' ? '(Wet)' : '(Húmedo)'}</span>
          </div>
        </div>

        {/* Temperature Change Slider */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {labels.temperatureChange[language]}:{' '}
            <span className="text-orange-600">
              {temperatureChange > 0 ? '+' : ''}{temperatureChange.toFixed(1)}°C
            </span>
          </label>
          <input
            type="range"
            min="-2"
            max="5"
            step="0.5"
            value={temperatureChange}
            onChange={(e) => {
              setTemperatureChange(Number(e.target.value));
              setActivePreset(null);
            }}
            disabled={loading}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>-2°C {language === 'en' ? '(Cooler)' : '(Más Frío)'}</span>
            <span>0°C</span>
            <span>+5°C {language === 'en' ? '(Warmer)' : '(Más Cálido)'}</span>
          </div>
        </div>

        {/* Irrigation Improvement Slider */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {labels.irrigationImprovement[language]}:{' '}
            <span className="text-green-600">+{irrigationImprovement}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="50"
            step="5"
            value={irrigationImprovement}
            onChange={(e) => {
              setIrrigationImprovement(Number(e.target.value));
              setActivePreset(null);
            }}
            disabled={loading}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0% {language === 'en' ? '(No Investment)' : '(Sin Inversión)'}</span>
            <span>+50% {language === 'en' ? '(Major Investment)' : '(Inversión Mayor)'}</span>
          </div>
        </div>

        {/* Crop Type Selector */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {labels.cropType[language]}
          </label>
          <select
            value={cropType}
            onChange={(e) => {
              setCropType(e.target.value);
              setActivePreset(null);
            }}
            disabled={loading}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">{labels.allCrops[language]}</option>
            <option value="coffee">{labels.coffee[language]}</option>
            <option value="sugar_cane">{labels.sugarCane[language]}</option>
            <option value="corn">{labels.corn[language]}</option>
            <option value="beans">{labels.beans[language]}</option>
          </select>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {labels.startDate[language]}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActivePreset(null);
              }}
              disabled={loading}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {labels.endDate[language]}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActivePreset(null);
              }}
              disabled={loading}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Run Simulation Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-6 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <span className="flex items-center justify-center">
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
              {language === 'en' ? 'Running simulation...' : 'Ejecutando simulación...'}
            </span>
          ) : (
            labels.runSimulation[language]
          )}
        </button>
      </form>
    </div>
  );
}
