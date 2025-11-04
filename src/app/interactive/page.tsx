'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import confetti from 'canvas-confetti';
import { ResultsPanelEnhanced } from '@/components/ResultsPanelEnhanced';
import { SkeletonLoader } from '@/components/SkeletonLoader';

// Lazy load MapView for better performance
const MapView = dynamic(() => import('@/components/MapView').then(mod => ({ default: mod.MapView })), {
  loading: () => (
    <div className="h-[600px]">
      <SkeletonLoader variant="map" className="w-full h-full" />
    </div>
  ),
  ssr: false,
});

/**
 * Pre-computed scenario structure matching JSON files
 */
interface PrecomputedScenario {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  parameters: {
    solar_growth_pct: number;
    rainfall_change_pct: number;
    period: string;
    demand_increase_pct?: number;
  };
  summary: {
    national_avg_stress: number;
    peak_stress: number;
    affected_population: number;
    critical_regions: number;
    high_risk_regions: number;
  };
  regions: Array<{
    name: string;
    stress: number;
    demand_mwh: number;
    supply_mwh: number;
    deficit_mwh: number;
    population: number;
    color: string;
    severity: string;
  }>;
  economics: {
    investment_required_million: number;
    investment_breakdown: string;
    economic_loss_prevented_million: number;
    economic_loss_explanation: string;
    roi_multiplier: number;
    roi_explanation: string;
    timeline_days: number;
    payback_period_years: number;
  };
  ai_analysis: {
    executive_summary: string;
    priority_actions: Array<{
      rank: number;
      action: string;
      timeline: string;
      cost_million: number;
      impact: string;
    }>;
    regional_breakdown: Array<{
      region: string;
      stress: number;
      severity: string;
      analysis: string;
      recommendation: string;
      timeline: string;
      cost_million: number;
    }>;
    risks: string[];
    opportunities: string[];
  };
}

/**
 * Available scenarios
 */
const scenarios = [
  { id: 'drought-crisis', name: 'Drought Crisis', emoji: '🌵', color: 'from-orange-500 to-red-600' },
  { id: 'coal-phaseout', name: 'Coal Phase-Out', emoji: '⚡', color: 'from-blue-500 to-cyan-600' },
  { id: 'climate-refugees', name: 'Climate Refugees', emoji: '🌊', color: 'from-teal-500 to-green-600' },
  { id: 'bitcoin-mining', name: 'Bitcoin Mining', emoji: '₿', color: 'from-yellow-500 to-orange-600' },
  { id: 'optimal-plan', name: 'Optimal Plan', emoji: '✨', color: 'from-purple-500 to-pink-600' },
  { id: 'custom', name: 'Custom Scenario', emoji: '🎯', color: 'from-indigo-500 to-purple-600' }
];

export default function InteractivePage() {
  const [selectedScenario, setSelectedScenario] = useState<PrecomputedScenario | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customParams, setCustomParams] = useState({
    solar_growth_pct: 0,
    rainfall_change_pct: 0,
    demand_increase_pct: 0,
    scenario_name: 'Custom Scenario',
  });

  /**
   * Load pre-computed scenario from JSON file
   */
  const loadScenario = async (scenarioId: string) => {
    // Handle custom scenario - open form instead of loading JSON
    if (scenarioId === 'custom') {
      setShowCustomForm(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/scenarios/${scenarioId}.json`);

      if (!response.ok) {
        throw new Error(`Failed to load scenario: ${response.statusText}`);
      }

      const data: PrecomputedScenario = await response.json();

      setSelectedScenario(data);

      // Confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Smooth scroll to results
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({
          behavior: 'smooth'
        });
      }, 300);

    } catch (error) {
      console.error('Failed to load scenario:', error);
      alert('Failed to load scenario. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Generate custom scenario using AI
   */
  const generateCustomScenario = async () => {
    setIsLoading(true);
    setShowCustomForm(false);

    try {
      const response = await fetch('/api/generate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...customParams,
          language,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate scenario');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setSelectedScenario(result.data);

        // Confetti celebration
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        // Smooth scroll to results
        setTimeout(() => {
          document.getElementById('results')?.scrollIntoView({
            behavior: 'smooth'
          });
        }, 300);
      } else {
        throw new Error('Invalid response from API');
      }

    } catch (error) {
      console.error('Failed to generate custom scenario:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate scenario. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Link href="/" className="group">
                  <Image
                    src="/logo-icon.svg"
                    alt="WorldSim"
                    width={48}
                    height={48}
                    className="transition-transform group-hover:scale-105"
                  />
                </Link>
                <h1 className="text-5xl font-bold">
                  WorldSim: El Salvador Digital Twin
                </h1>
              </div>
              <p className="text-xl text-blue-100 mb-2">
                Test the future before living it.
              </p>
              <p className="text-lg text-blue-200">
                Instant AI-powered infrastructure simulations for policy makers
              </p>
            </div>

            {/* Language Toggle */}
            <div className="flex items-center space-x-1 bg-white/20 rounded-lg p-1">
              <button
                onClick={() => setLanguage('en')}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                  language === 'en'
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-white hover:text-blue-100'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('es')}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                  language === 'es'
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-white hover:text-blue-100'
                }`}
              >
                ES
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scenario Selector */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {language === 'en' ? 'Select a Scenario' : 'Seleccione un Escenario'}
        </h2>
        <p className="text-gray-600 mb-8">
          {language === 'en'
            ? 'Click any scenario to see instant AI-powered policy recommendations'
            : 'Haga clic en cualquier escenario para ver recomendaciones de políticas impulsadas por IA'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => loadScenario(scenario.id)}
              disabled={isLoading}
              className={`
                group relative overflow-hidden
                bg-white rounded-2xl shadow-lg hover:shadow-2xl
                transition-all duration-300 transform hover:-translate-y-2
                p-8 text-center
                disabled:opacity-50 disabled:cursor-not-allowed
                ${selectedScenario?.id === scenario.id ? 'ring-4 ring-blue-500' : ''}
              `}
            >
              {/* Gradient background on hover */}
              <div className={`
                absolute inset-0 bg-gradient-to-br ${scenario.color}
                opacity-0 group-hover:opacity-10 transition-opacity
              `} />

              {/* Content */}
              <div className="relative z-10">
                <div className="text-6xl mb-4">
                  {scenario.emoji}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {scenario.name}
                </h3>

                {selectedScenario?.id === scenario.id && (
                  <div className="mt-3 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    {language === 'en' ? 'Active' : 'Activo'}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Compare Button */}
        {selectedScenario && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setCompareMode(!compareMode)}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
            >
              {compareMode
                ? (language === 'en' ? '📊 Viewing Comparison' : '📊 Viendo Comparación')
                : (language === 'en' ? '🔄 Compare All Scenarios' : '🔄 Comparar Todos los Escenarios')}
            </button>
          </div>
        )}
      </div>

      {/* Custom Scenario Form Modal */}
      {showCustomForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">🎯</div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {language === 'en' ? 'Create Custom Scenario' : 'Crear Escenario Personalizado'}
                  </h2>
                </div>
                <button
                  onClick={() => setShowCustomForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Description */}
              <p className="text-gray-600 mb-6">
                {language === 'en'
                  ? 'AI will generate a realistic scenario based on your inputs using Claude. Adjust the parameters below:'
                  : 'La IA generará un escenario realista basado en sus entradas usando Claude. Ajuste los parámetros a continuación:'}
              </p>

              {/* Form */}
              <div className="space-y-6">
                {/* Scenario Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {language === 'en' ? 'Scenario Name' : 'Nombre del Escenario'}
                  </label>
                  <input
                    type="text"
                    value={customParams.scenario_name}
                    onChange={(e) => setCustomParams({ ...customParams, scenario_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={language === 'en' ? 'e.g., Extreme Weather Event' : 'ej., Evento Climático Extremo'}
                  />
                </div>

                {/* Solar Growth */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {language === 'en' ? 'Solar Energy Growth' : 'Crecimiento de Energía Solar'}: {customParams.solar_growth_pct}%
                  </label>
                  <input
                    type="range"
                    min="-100"
                    max="500"
                    step="10"
                    value={customParams.solar_growth_pct}
                    onChange={(e) => setCustomParams({ ...customParams, solar_growth_pct: parseInt(e.target.value) })}
                    className="w-full h-3 bg-gradient-to-r from-red-200 via-yellow-200 to-green-500 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>-100% {language === 'en' ? '(Major Decline)' : '(Gran Declive)'}</span>
                    <span>+500% {language === 'en' ? '(Major Growth)' : '(Gran Crecimiento)'}</span>
                  </div>
                </div>

                {/* Rainfall Change */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {language === 'en' ? 'Rainfall Change' : 'Cambio en Precipitación'}: {customParams.rainfall_change_pct}%
                  </label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="5"
                    value={customParams.rainfall_change_pct}
                    onChange={(e) => setCustomParams({ ...customParams, rainfall_change_pct: parseInt(e.target.value) })}
                    className="w-full h-3 bg-gradient-to-r from-orange-300 via-blue-200 to-blue-500 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>-100% {language === 'en' ? '(Severe Drought)' : '(Sequía Severa)'}</span>
                    <span>+100% {language === 'en' ? '(Heavy Rainfall)' : '(Lluvia Intensa)'}</span>
                  </div>
                </div>

                {/* Demand Increase */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {language === 'en' ? 'Demand Increase' : 'Aumento de Demanda'}: +{customParams.demand_increase_pct}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="5"
                    value={customParams.demand_increase_pct}
                    onChange={(e) => setCustomParams({ ...customParams, demand_increase_pct: parseInt(e.target.value) })}
                    className="w-full h-3 bg-gradient-to-r from-green-200 to-red-500 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0% {language === 'en' ? '(No Change)' : '(Sin Cambio)'}</span>
                    <span>+200% {language === 'en' ? '(Triple Demand)' : '(Triple Demanda)'}</span>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🤖</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 mb-1">
                        {language === 'en' ? 'AI-Powered Generation' : 'Generación Impulsada por IA'}
                      </h4>
                      <p className="text-sm text-blue-800">
                        {language === 'en'
                          ? 'Claude will analyze your parameters and generate realistic stress levels, economic impacts, and policy recommendations for all 14 regions. This takes ~10 seconds.'
                          : 'Claude analizará sus parámetros y generará niveles de estrés realistas, impactos económicos y recomendaciones de políticas para las 14 regiones. Esto toma ~10 segundos.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowCustomForm(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    {language === 'en' ? 'Cancel' : 'Cancelar'}
                  </button>
                  <button
                    onClick={generateCustomScenario}
                    disabled={!customParams.scenario_name.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">🚀</span>
                    {language === 'en' ? 'Generate with AI' : 'Generar con IA'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">
            {language === 'en' ? 'Loading scenario...' : 'Cargando escenario...'}
          </p>
        </div>
      )}

      {/* Results Display */}
      {selectedScenario && !isLoading && !compareMode && (
        <div id="results" className="container mx-auto px-4 py-12">

          {/* Scenario Header */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-start gap-6">
              <div className="text-6xl">{selectedScenario.emoji}</div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {selectedScenario.name}
                </h2>
                <p className="text-xl text-gray-600 mb-4">
                  {selectedScenario.tagline}
                </p>
                <p className="text-gray-700">
                  {selectedScenario.description}
                </p>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="text-sm text-gray-600 mb-1">
                {language === 'en' ? 'Avg Stress' : 'Estrés Promedio'}
              </div>
              <div className="text-3xl font-bold text-orange-600">
                {selectedScenario.summary.national_avg_stress}%
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="text-sm text-gray-600 mb-1">
                {language === 'en' ? 'Peak Stress' : 'Estrés Máximo'}
              </div>
              <div className="text-3xl font-bold text-red-600">
                {selectedScenario.summary.peak_stress}%
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="text-sm text-gray-600 mb-1">
                {language === 'en' ? 'Affected Population' : 'Población Afectada'}
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {(selectedScenario.summary.affected_population / 1000000).toFixed(1)}M
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="text-sm text-gray-600 mb-1">
                {language === 'en' ? 'Critical Regions' : 'Regiones Críticas'}
              </div>
              <div className="text-3xl font-bold text-purple-600">
                {selectedScenario.summary.critical_regions}
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="text-2xl font-bold mb-4">
              {language === 'en' ? 'Infrastructure Stress Map' : 'Mapa de Estrés de Infraestructura'}
            </h3>
            <div className="h-[600px] rounded-xl overflow-hidden">
              <MapView
                height="100%"
                simulationResults={{
                  daily_results: selectedScenario.regions.map(r => ({
                    date: new Date().toISOString(),
                    region_id: r.name.toLowerCase().replace(/\s+/g, '-'),
                    region_name: r.name,
                    demand: r.demand_mwh,
                    supply: r.supply_mwh,
                    stress: r.stress / 100,
                  })),
                  summary: {
                    avg_stress: selectedScenario.summary.national_avg_stress / 100,
                    max_stress: selectedScenario.summary.peak_stress / 100,
                    top_stressed_regions: selectedScenario.regions
                      .sort((a, b) => b.stress - a.stress)
                      .slice(0, 3)
                      .map(r => ({
                        region_id: r.name.toLowerCase().replace(/\s+/g, '-'),
                        region_name: r.name,
                        avg_stress: r.stress / 100,
                      })),
                  },
                }}
                visualizationType="energy"
              />
            </div>
          </div>

          {/* Two-Column Layout: Results + Economics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Left: Results Panel */}
            <div>
              <ResultsPanelEnhanced
                results={{
                  daily_results: selectedScenario.regions.map(r => ({
                    date: new Date().toISOString(),
                    region_id: r.name.toLowerCase().replace(/\s+/g, '-'),
                    region_name: r.name,
                    demand: r.demand_mwh,
                    supply: r.supply_mwh,
                    stress: r.stress / 100,
                  })),
                  summary: {
                    avg_stress: selectedScenario.summary.national_avg_stress / 100,
                    max_stress: selectedScenario.summary.peak_stress / 100,
                    top_stressed_regions: selectedScenario.regions
                      .sort((a, b) => b.stress - a.stress)
                      .slice(0, 3)
                      .map(r => ({
                        region_id: r.name.toLowerCase().replace(/\s+/g, '-'),
                        region_name: r.name,
                        avg_stress: r.stress / 100,
                      })),
                  },
                }}
                scenario={{
                  solar_growth_pct: selectedScenario.parameters.solar_growth_pct,
                  rainfall_change_pct: selectedScenario.parameters.rainfall_change_pct,
                  start_date: new Date().toISOString().split('T')[0],
                  end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                }}
                language={language}
              />
            </div>

            {/* Right: Economics + AI Analysis */}
            <div className="space-y-8">
              {/* Economics Dashboard */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-2xl font-bold mb-4">
                  {language === 'en' ? 'Economic Analysis' : 'Análisis Económico'}
                </h3>

                <div className="space-y-4">
                  {/* Investment Required */}
                  <div className="border-b pb-4">
                    <div className="text-sm text-gray-600 mb-1">
                      {language === 'en' ? 'Investment Required' : 'Inversión Requerida'}
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      ${selectedScenario.economics.investment_required_million}M
                    </div>
                    <div className="text-sm text-gray-700 mt-2">
                      {selectedScenario.economics.investment_breakdown}
                    </div>
                  </div>

                  {/* Economic Loss Prevented */}
                  <div className="border-b pb-4">
                    <div className="text-sm text-gray-600 mb-1">
                      {language === 'en' ? 'Economic Loss Prevented' : 'Pérdida Económica Prevenida'}
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      ${selectedScenario.economics.economic_loss_prevented_million}M
                    </div>
                    <div className="text-sm text-gray-700 mt-2">
                      {selectedScenario.economics.economic_loss_explanation}
                    </div>
                  </div>

                  {/* ROI */}
                  <div className="border-b pb-4">
                    <div className="text-sm text-gray-600 mb-1">
                      {language === 'en' ? 'Return on Investment' : 'Retorno de Inversión'}
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedScenario.economics.roi_multiplier}x
                    </div>
                    <div className="text-sm text-gray-700 mt-2">
                      {selectedScenario.economics.roi_explanation}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      {language === 'en' ? 'Implementation Timeline' : 'Cronograma de Implementación'}
                    </div>
                    <div className="text-2xl font-bold text-orange-600">
                      {selectedScenario.economics.timeline_days} {language === 'en' ? 'days' : 'días'}
                    </div>
                    <div className="text-sm text-gray-700 mt-2">
                      {language === 'en' ? 'Payback period: ' : 'Periodo de recuperación: '}
                      {selectedScenario.economics.payback_period_years} {language === 'en' ? 'years' : 'años'}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Analysis */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-lg p-6 border-2 border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">🤖</div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {language === 'en' ? 'AI Policy Analysis' : 'Análisis de Políticas IA'}
                  </h3>
                </div>

                {/* Executive Summary */}
                <div className="bg-white rounded-lg p-4 mb-4">
                  <h4 className="font-bold text-gray-900 mb-2">
                    {language === 'en' ? 'Executive Summary' : 'Resumen Ejecutivo'}
                  </h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {selectedScenario.ai_analysis.executive_summary}
                  </p>
                </div>

                {/* Priority Actions */}
                <div className="bg-white rounded-lg p-4 mb-4">
                  <h4 className="font-bold text-gray-900 mb-3">
                    {language === 'en' ? 'Priority Actions' : 'Acciones Prioritarias'}
                  </h4>
                  <div className="space-y-3">
                    {selectedScenario.ai_analysis.priority_actions.map((action) => (
                      <div key={action.rank} className="border-l-4 border-blue-500 pl-4">
                        <div className="font-semibold text-gray-900">
                          #{action.rank}: {action.action}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {language === 'en' ? 'Timeline: ' : 'Cronograma: '}{action.timeline} |
                          {language === 'en' ? ' Cost: ' : ' Costo: '}${action.cost_million}M
                        </div>
                        <div className="text-sm text-gray-700 mt-1">
                          {action.impact}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risks & Opportunities */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <h4 className="font-bold text-red-900 mb-2">
                      {language === 'en' ? '⚠️ Risks' : '⚠️ Riesgos'}
                    </h4>
                    <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                      {selectedScenario.ai_analysis.risks.slice(0, 3).map((risk, i) => (
                        <li key={i}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="font-bold text-green-900 mb-2">
                      {language === 'en' ? '✨ Opportunities' : '✨ Oportunidades'}
                    </h4>
                    <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                      {selectedScenario.ai_analysis.opportunities.slice(0, 3).map((opp, i) => (
                        <li key={i}>{opp}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compare Mode Placeholder */}
      {compareMode && selectedScenario && (
        <div className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold mb-8">
            {language === 'en' ? 'Scenario Comparison' : 'Comparación de Escenarios'}
          </h2>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <p className="text-gray-600">
              {language === 'en'
                ? 'Comparison view coming soon...'
                : 'Vista de comparación próximamente...'}
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-gray-300 mt-16 py-12 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <Link href="/" className="group">
                <Image
                  src="/logo-icon.svg"
                  alt="WorldSim"
                  width={32}
                  height={32}
                  className="transition-transform group-hover:scale-105"
                />
              </Link>
              <p className="text-sm text-gray-300">
                <span className="font-bold text-white">WorldSim</span> &copy; 2024 -
                {language === 'en' ? ' El Salvador Digital Twin' : ' Gemelo Digital de El Salvador'}
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
                {language === 'en' ? 'Home' : 'Inicio'}
              </Link>
              <Link href="/demo" className="text-sm text-gray-400 hover:text-white transition-colors">
                {language === 'en' ? 'About' : 'Acerca de'}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
