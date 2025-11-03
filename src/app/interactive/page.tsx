'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import confetti from 'canvas-confetti';
import { UploadPanel } from '@/components/UploadPanel';
import { ResultsPanelEnhanced } from '@/components/ResultsPanelEnhanced';
import { WaterResultsPanel } from '@/components/WaterResultsPanel';
import { AgricultureResultsPanel } from '@/components/AgricultureResultsPanel';
import { ExecutiveSummary } from '@/components/ExecutiveSummary';
import { EconomicsDashboard } from '@/components/EconomicsDashboard';
import { ScenarioComparison } from '@/components/ScenarioComparison';
import { TrendsDashboard } from '@/components/TrendsDashboard';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import type { SimulationResponse, SimulationScenario, IngestStats, WaterSimulationResponse } from '@/lib/types';

// Lazy load MapView for better performance (largest component)
const MapView = dynamic(() => import('@/components/MapView').then(mod => ({ default: mod.MapView })), {
  loading: () => (
    <div className="h-[300px] sm:h-[400px] md:h-[500px] xl:h-[700px]">
      <SkeletonLoader variant="map" className="w-full h-full" />
    </div>
  ),
  ssr: false, // Mapbox requires window object
});

/**
 * Interactive Demo Page
 *
 * Full end-to-end workflow demonstration:
 * 1. Upload CSVs via UploadPanel → /api/ingest
 * 2. Configure parameters via ControlPanel
 * 3. Run simulation → /api/simulate
 * 4. Display results on MapView (colored by stress)
 * 5. Show charts and stats in Results Panel
 *
 * Features:
 * - Real API integration (no mock data)
 * - Smooth animations and transitions
 * - Auto-scroll to results after simulation
 * - Loading states and error handling
 * - Bilingual support (EN/ES)
 */
interface SavedScenario {
  id: string;
  name: string;
  type: 'energy' | 'water' | 'agriculture';
  timestamp: string;
  results: any;
  params: Record<string, unknown>;
}

export default function InteractivePage() {
  // State management
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [activeTab, setActiveTab] = useState<'energy' | 'water' | 'agriculture' | 'economics' | 'compare' | 'trends'>('energy');
  const [energyResults, setEnergyResults] = useState<SimulationResponse | null>(null);
  // Keep for tab switching support, but auto-simulation only runs for energy
  const [waterResults] = useState<WaterSimulationResponse | null>(null);
  const [agricultureResults] = useState<any | null>(null);
  const [energyScenario, setEnergyScenario] = useState<SimulationScenario | null>(null);
  const [energyExecutionTime, setEnergyExecutionTime] = useState<number | undefined>(undefined);
  const [isSimulating, setIsSimulating] = useState(false);
  const [uploadedData, setUploadedData] = useState<{
    energy?: IngestStats;
    rainfall?: IngestStats;
  }>({});
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);

  // Refs for scrolling
  const resultsRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  /**
   * Trigger success confetti celebration
   */
  const celebrate = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  }, []);

  /**
   * Save current scenario for comparison
   */
  const saveScenarioForComparison = useCallback((
    type: 'energy' | 'water' | 'agriculture',
    results: any,
    params: Record<string, unknown>,
    customName?: string
  ) => {
    const name = customName || `${type.charAt(0).toUpperCase() + type.slice(1)} - ${new Date().toLocaleString()}`;
    const newScenario: SavedScenario = {
      id: crypto.randomUUID(),
      name,
      type,
      timestamp: new Date().toISOString(),
      results,
      params,
    };
    setSavedScenarios(prev => [...prev, newScenario]);
    console.log('💾 Scenario saved for comparison:', newScenario);
  }, []);

  /**
   * Remove scenario from comparison
   */
  const removeScenario = useCallback((id: string) => {
    setSavedScenarios(prev => prev.filter(s => s.id !== id));
    console.log('🗑️ Scenario removed:', id);
  }, []);

  /**
   * Auto-run simulation with default parameters after data upload
   */
  const autoRunSimulation = useCallback(async (dateRange: { min: string; max: string }) => {
    console.log('🚀 Auto-running simulation with uploaded data...');
    setIsSimulating(true);

    try {
      // Use default parameters (no changes to baseline)
      const defaultParams = {
        solar_growth_pct: 0,
        rainfall_change_pct: 0,
        start_date: dateRange.min,
        end_date: dateRange.max,
      };

      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultParams),
      });

      if (!response.ok) {
        throw new Error('Simulation failed');
      }

      const result = await response.json();

      if (result.success && result.data) {
        console.log('✅ Auto-simulation complete!', {
          daily_results: result.data.daily_results.length,
          avg_stress: result.data.summary.avg_stress,
        });

        setEnergyResults(result.data);
        setEnergyScenario(defaultParams);
        setEnergyExecutionTime(result.execution_time_ms);

        // Celebrate success!
        setTimeout(() => celebrate(), 600);

        // Smooth scroll to results
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }, 800);
      }
    } catch (error) {
      console.error('Auto-simulation error:', error);
    } finally {
      setIsSimulating(false);
    }
  }, [celebrate]);

  /**
   * Handle CSV upload completion
   * Auto-runs simulation when both energy and rainfall data are uploaded
   */
  const handleUploadComplete = useCallback((type: 'energy' | 'rainfall', stats: IngestStats) => {
    console.log(`📊 ${type} data uploaded:`, {
      rows: stats.rows_inserted,
      date_range: stats.date_range,
      regions: stats.regions_affected.length,
    });

    const newUploadedData = {
      ...uploadedData,
      [type]: stats,
    };

    setUploadedData(newUploadedData);

    // Auto-run simulation if BOTH energy and rainfall data are now uploaded
    if (newUploadedData.energy && newUploadedData.rainfall) {
      console.log('✅ Both files uploaded! Auto-running simulation...');

      // Use the date range from energy data
      const dateRange = newUploadedData.energy.date_range;
      autoRunSimulation(dateRange);
    }
  }, [uploadedData, autoRunSimulation]);

  /**
   * Check if user has uploaded data
   */
  const hasUploadedData = uploadedData.energy || uploadedData.rainfall;

  const labels = {
    title: { en: 'El Salvador Policy Decision Platform', es: 'Plataforma de Decisiones de El Salvador' },
    subtitle: {
      en: 'Test critical scenarios across El Salvador\'s 14 departments - see which regions fail first in 10 seconds',
      es: 'Pruebe escenarios críticos en los 14 departamentos de El Salvador - vea qué regiones fallan primero en 10 segundos',
    },
    dataUploaded: { en: 'Data Ready', es: 'Datos Listos' },
    noResults: { en: 'No policy tested yet', es: 'Sin políticas probadas aún' },
    runSimulation: { en: 'Test a policy scenario to get cabinet-ready recommendations', es: 'Pruebe un escenario de política para obtener recomendaciones' },
    energyTab: { en: 'Energy Policy', es: 'Política Energética' },
    waterTab: { en: 'Water Policy', es: 'Política Hídrica' },
    agricultureTab: { en: 'Agriculture Policy', es: 'Política Agrícola' },
    economicsTab: { en: 'Economic Analysis', es: 'Análisis Económico' },
    compareTab: { en: 'Compare Scenarios', es: 'Comparar Escenarios' },
    trendsTab: { en: 'Trends & ML', es: 'Tendencias y ML' },
    saveScenario: { en: 'Save for Comparison', es: 'Guardar para Comparar' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <Link href="/" className="group">
                  <Image
                    src="/logo-icon.svg"
                    alt="WorldSim"
                    width={40}
                    height={40}
                    className="transition-transform group-hover:scale-105"
                  />
                </Link>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  WorldSim
                </h1>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg">
                  {labels.title[language]}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {labels.subtitle[language]}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Upload Status Indicator */}
              {hasUploadedData && (
                <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-xs font-medium text-green-900">
                    {labels.dataUploaded[language]}
                  </span>
                </div>
              )}

              {/* Language Toggle */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1 shadow-inner">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                    language === 'en'
                      ? 'bg-white text-blue-600 shadow-md transform scale-105'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('es')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                    language === 'es'
                      ? 'bg-white text-blue-600 shadow-md transform scale-105'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ES
                </button>
              </div>
              <Link
                href="/"
                className="inline-flex items-center px-5 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-semibold rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                {language === 'en' ? 'Back Home' : 'Volver'}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex justify-center">
          <div className="inline-flex bg-white rounded-xl shadow-lg p-2 border border-gray-200">
            <button
              onClick={() => setActiveTab('energy')}
              className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === 'energy'
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mr-2">⚡</span>
              <span className="text-base">{labels.energyTab[language]}</span>
            </button>
            <button
              onClick={() => setActiveTab('water')}
              className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === 'water'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mr-2">💧</span>
              <span className="text-base">{labels.waterTab[language]}</span>
            </button>
            <button
              onClick={() => setActiveTab('agriculture')}
              className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === 'agriculture'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mr-2">🌾</span>
              <span className="text-base">{labels.agricultureTab[language]}</span>
            </button>
            <button
              onClick={() => setActiveTab('economics')}
              className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === 'economics'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mr-2">💰</span>
              <span className="text-base">{labels.economicsTab[language]}</span>
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-all duration-200 relative ${
                activeTab === 'compare'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mr-2">📊</span>
              <span className="text-base">{labels.compareTab[language]}</span>
              {savedScenarios.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {savedScenarios.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === 'trends'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mr-2">📈</span>
              <span className="text-base">{labels.trendsTab[language]}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Responsive layout: Mobile (stack), Tablet (2 cols), Desktop (3 cols) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 md:gap-6">
          {/* Left Column - Configuration */}
          <div className="md:col-span-1 xl:col-span-5 space-y-4 md:space-y-6">
            {/* Upload Panel - Auto-runs simulation after both files uploaded */}
            <div className="transform hover:scale-[1.01] transition-all duration-200">
              <UploadPanel
                language={language}
                onUpload={handleUploadComplete}
              />
            </div>
          </div>

          {/* Middle Column - Map */}
          <div className="md:col-span-1 xl:col-span-4" ref={mapRef}>
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl blur-xl opacity-20"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 transform hover:scale-[1.01] transition-all duration-300">
                <div className="p-1 md:p-2">
                  {/* Responsive map height: Mobile 300px, Tablet 400px, Desktop 700px */}
                  <div className="h-[300px] sm:h-[400px] md:h-[500px] xl:h-[700px]">
                    <MapView
                      height="100%"
                      simulationResults={(activeTab === 'energy' ? energyResults : activeTab === 'water' ? waterResults : agricultureResults) as SimulationResponse | null}
                      visualizationType={activeTab}
                    />
                  </div>
                </div>

                {/* Map Overlay - Show results summary (responsive) */}
                {(() => {
                  const currentResults = activeTab === 'energy' ? energyResults : activeTab === 'water' ? waterResults : agricultureResults;
                  return currentResults && (
                    <div className="absolute top-2 left-2 right-2 md:top-4 md:left-4 md:right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-2 md:p-3 border border-gray-200">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                        <div>
                          <p className="text-[10px] md:text-xs font-semibold text-gray-700">
                            {language === 'en' ? 'Avg Stress' : 'Estrés Prom'}
                          </p>
                          <p className="text-lg md:text-2xl font-bold text-blue-600">
                            {(currentResults.summary.avg_stress * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] md:text-xs font-semibold text-gray-700">
                            {language === 'en' ? 'Max Stress' : 'Estrés Máx'}
                          </p>
                          <p className="text-lg md:text-2xl font-bold text-red-600">
                            {(currentResults.summary.max_stress * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                          <p className="text-[10px] md:text-xs font-semibold text-gray-700">
                            {language === 'en' ? 'Most Stressed' : 'Más Estresado'}
                          </p>
                          <p className="text-xs md:text-sm font-bold text-orange-600 truncate">
                            {currentResults.summary.top_stressed_regions[0]?.region_name || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Right Column - Results - Full width on mobile, half on tablet, 1/4 on desktop */}
          <div className="md:col-span-2 xl:col-span-3" ref={resultsRef}>
            {/* Executive Summary - Cabinet-Ready Recommendation */}
            {activeTab === 'energy' && energyResults && !isSimulating && (
              <div className="mb-6 transform hover:scale-[1.01] transition-all duration-200">
                <ExecutiveSummary
                  results={energyResults}
                  scenario={energyScenario}
                  language={language}
                />
              </div>
            )}

            {activeTab === 'water' && waterResults && !isSimulating && (
              <div className="mb-6 transform hover:scale-[1.01] transition-all duration-200">
                <ExecutiveSummary
                  results={waterResults as unknown as SimulationResponse}
                  scenario={null}
                  language={language}
                />
              </div>
            )}

            {activeTab === 'agriculture' && agricultureResults && !isSimulating && (
              <div className="mb-6 transform hover:scale-[1.01] transition-all duration-200">
                <ExecutiveSummary
                  results={agricultureResults as unknown as SimulationResponse}
                  scenario={null}
                  language={language}
                />
              </div>
            )}

            {/* Save for Comparison Button */}
            {activeTab !== 'economics' && activeTab !== 'compare' && (
              <>
                {(activeTab === 'energy' && energyResults) ||
                 (activeTab === 'water' && waterResults) ||
                 (activeTab === 'agriculture' && agricultureResults) ? (
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        const currentResults = activeTab === 'energy' ? energyResults : activeTab === 'water' ? waterResults : agricultureResults;
                        if (currentResults) {
                          saveScenarioForComparison(activeTab as 'energy' | 'water' | 'agriculture', currentResults, {});
                        }
                      }}
                      className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">💾</span>
                      <span>{labels.saveScenario[language]}</span>
                      <span className="ml-2 bg-white text-indigo-600 text-xs font-bold rounded-full px-2 py-1">
                        {savedScenarios.length}
                      </span>
                    </button>
                  </div>
                ) : null}
              </>
            )}

            {/* Detailed Results Panel, Economics Dashboard, or Scenario Comparison */}
            <div className="transform hover:scale-[1.01] transition-all duration-200">
              {activeTab === 'energy' ? (
                <ResultsPanelEnhanced
                  results={energyResults}
                  scenario={energyScenario}
                  executionTime={energyExecutionTime}
                  isLoading={isSimulating}
                  language={language}
                />
              ) : activeTab === 'water' ? (
                <WaterResultsPanel
                  results={waterResults}
                  isLoading={isSimulating}
                  language={language}
                />
              ) : activeTab === 'agriculture' ? (
                <AgricultureResultsPanel
                  results={agricultureResults}
                  isLoading={isSimulating}
                  language={language}
                />
              ) : activeTab === 'compare' ? (
                <ScenarioComparison
                  scenarios={savedScenarios}
                  onRemoveScenario={removeScenario}
                  language={language}
                />
              ) : activeTab === 'trends' ? (
                <TrendsDashboard
                  simulationType={
                    energyResults ? 'energy' : waterResults ? 'water' : 'agriculture'
                  }
                  historicalData={
                    energyResults?.daily_results ||
                    waterResults?.daily_results ||
                    agricultureResults?.daily_results ||
                    []
                  }
                  language={language}
                />
              ) : (
                <EconomicsDashboard
                  energyResults={energyResults}
                  waterResults={waterResults}
                  agricultureResults={agricultureResults}
                  language={language}
                />
              )}
            </div>

            {/* No results state */}
            {!(activeTab === 'energy' ? energyResults : activeTab === 'water' ? waterResults : agricultureResults) && !isSimulating && (
              <div className="mt-6 bg-gradient-to-br from-blue-50 to-green-50 border-2 border-dashed border-blue-300 rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {labels.noResults[language]}
                </h3>
                <p className="text-sm text-gray-600">
                  {labels.runSimulation[language]}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-xl p-6 shadow-lg">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900 mb-2">
                {language === 'en' ? '🎯 Policy Flight Simulator' : '🎯 Simulador de Políticas'}
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {language === 'en'
                  ? 'Test billion-dollar decisions before implementation: Upload your government data or use our El Salvador dataset → Ask critical questions like "What if drought reduces rainfall 30%?" → Get instant answers showing which regions fail first, investment costs, and ROI. Every recommendation is cabinet-ready with action items and timelines.'
                  : 'Pruebe decisiones de miles de millones antes de implementarlas: Cargue datos gubernamentales o use nuestro conjunto de datos de El Salvador → Haga preguntas críticas como "¿Qué pasa si la sequía reduce las lluvias un 30%?" → Obtenga respuestas instantáneas mostrando qué regiones fallan primero, costos de inversión y ROI. Cada recomendación está lista para el gabinete con elementos de acción y cronogramas.'}
              </p>
            </div>
          </div>
        </div>

        {/* Sample Data Download Section */}
        <div className="mt-6 bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900 mb-2">
                {language === 'en' ? '📥 Need Sample Data?' : '📥 ¿Necesita Datos de Ejemplo?'}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {language === 'en'
                  ? 'Download our sample CSV files with 30 days of realistic data for all 14 El Salvador departments:'
                  : 'Descargue nuestros archivos CSV de ejemplo con 30 días de datos realistas para los 14 departamentos de El Salvador:'}
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/sample_data/energy_sample.csv"
                  download
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-md"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {language === 'en' ? 'Energy Sample CSV' : 'CSV de Ejemplo - Energía'}
                </a>
                <a
                  href="/sample_data/rainfall_sample.csv"
                  download
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {language === 'en' ? 'Rainfall Sample CSV' : 'CSV de Ejemplo - Lluvia'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

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
                <span className="font-bold text-white">WorldSim</span> &copy; 2024 - {language === 'en' ? 'El Salvador Digital Twin' : 'Gemelo Digital de El Salvador'}
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
                {language === 'en' ? 'Home' : 'Inicio'}
              </Link>
              <Link href="/demo" className="text-sm text-gray-400 hover:text-white transition-colors">
                {language === 'en' ? 'About' : 'Acerca de'}
              </Link>
              <a
                href="https://github.com/AlanSinclair-spec/worldsim"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Add CSS for pulse animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse-once {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.02);
            }
          }
          .animate-pulse-once {
            animation: pulse-once 0.6s ease-in-out;
          }
        `
      }} />
    </div>
  );
}
