'use client';

import { useState } from 'react';
import { MapView } from '@/components/MapView';
import { ControlPanel, SimulationParams } from '@/components/ControlPanel';
import { UploadPanel } from '@/components/UploadPanel';
import { ResultsPanel } from '@/components/ResultsPanel';
import { SimulationResponse } from '@/lib/types';
import Link from 'next/link';

/**
 * Interactive Demo Page
 *
 * Showcases all WorldSim components working together:
 * - ControlPanel: Configure simulation parameters
 * - UploadPanel: Upload energy and rainfall data
 * - ResultsPanel: View simulation results with charts
 *
 * Uses mock data to demonstrate functionality without backend.
 */
export default function InteractivePage() {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [results, setResults] = useState<SimulationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Generate mock simulation results based on parameters
   */
  const generateMockResults = (params: SimulationParams): SimulationResponse => {
    const days = Math.ceil(
      (new Date(params.end_date).getTime() - new Date(params.start_date).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const regions = [
      { id: 'SS', name: 'San Salvador' },
      { id: 'SM', name: 'San Miguel' },
      { id: 'LI', name: 'La Libertad' },
      { id: 'SA', name: 'Santa Ana' },
      { id: 'SO', name: 'Sonsonate' },
    ];

    const daily_results = [];

    // Generate daily results for each region
    for (let i = 0; i < days; i++) {
      const date = new Date(params.start_date);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      for (const region of regions) {
        // Base demand with some random variation
        const baseDemand = 1000 + Math.random() * 500;

        // Apply solar growth (reduces demand from grid)
        const solarOffset = (params.solar_growth_pct / 100) * baseDemand * 0.3;

        // Apply rainfall change (affects hydro, impacts supply)
        const rainfallFactor = 1 + (params.rainfall_change_pct / 100) * 0.2;

        const demand = baseDemand - solarOffset;
        const supply = (baseDemand * 0.9 * rainfallFactor) + (Math.random() * 200 - 100);
        const stress = demand / supply;

        daily_results.push({
          date: dateStr,
          region_id: region.id,
          region_name: region.name,
          demand: Math.round(demand),
          supply: Math.round(supply),
          stress: Number(stress.toFixed(2)),
        });
      }
    }

    // Calculate summary statistics
    const stressList = daily_results.map(r => r.stress);
    const avg_stress = stressList.reduce((a, b) => a + b, 0) / stressList.length;
    const max_stress = Math.max(...stressList);

    // Calculate top stressed regions
    const regionAvgStress = regions.map(region => {
      const regionResults = daily_results.filter(r => r.region_id === region.id);
      const regionStress = regionResults.reduce((sum, r) => sum + r.stress, 0) / regionResults.length;
      return {
        region_id: region.id,
        region_name: region.name,
        avg_stress: Number(regionStress.toFixed(2)),
      };
    });

    regionAvgStress.sort((a, b) => b.avg_stress - a.avg_stress);

    return {
      daily_results,
      summary: {
        avg_stress: Number(avg_stress.toFixed(2)),
        max_stress: Number(max_stress.toFixed(2)),
        top_stressed_regions: regionAvgStress,
      },
    };
  };

  /**
   * Handle simulation run
   */
  const handleRunSimulation = async (params: SimulationParams) => {
    console.log('🚀 Running simulation with params:', params);

    setIsLoading(true);
    setResults(null);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockResults = generateMockResults(params);
    setResults(mockResults);
    setIsLoading(false);

    console.log('✅ Simulation complete:', mockResults);
  };

  /**
   * Handle file upload
   */
  const handleFileUpload = async (type: 'energy' | 'rainfall', file: File) => {
    console.log(`📁 Uploading ${type} file:`, file.name);
    // Mock upload - in production, would send to API
  };

  const labels = {
    title: { en: 'Interactive Demo', es: 'Demo Interactivo' },
    subtitle: {
      en: 'Experience all WorldSim features with live controls and mock data',
      es: 'Experimente todas las funciones de WorldSim con controles en vivo y datos simulados',
    },
    leftColumn: { en: 'Configuration', es: 'Configuración' },
    rightColumn: { en: 'Results', es: 'Resultados' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg"></div>
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

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Three-column layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Column - Configuration (40%) */}
          <div className="xl:col-span-5 space-y-6">
            {/* Upload Panel */}
            <div className="transform hover:scale-[1.01] transition-all duration-200">
              <UploadPanel
                language={language}
                onUpload={handleFileUpload}
              />
            </div>

            {/* Control Panel */}
            <div className="transform hover:scale-[1.01] transition-all duration-200">
              <ControlPanel
                language={language}
                onRunSimulation={handleRunSimulation}
              />
            </div>
          </div>

          {/* Middle Column - Map (35%) */}
          <div className="xl:col-span-4">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl blur-xl opacity-20"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 transform hover:scale-[1.01] transition-all duration-300">
                <div className="p-2">
                  <MapView height="700px" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Results (25%) */}
          <div className="xl:col-span-3">
            <div className="transform hover:scale-[1.01] transition-all duration-200">
              <ResultsPanel
                results={results}
                isLoading={isLoading}
                language={language}
              />
            </div>
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
                {language === 'en' ? '🎯 Demo Mode' : '🎯 Modo de Demostración'}
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {language === 'en'
                  ? 'This interactive demo uses mock data to showcase all features. Upload files, adjust parameters, run simulations, and view results with charts. In production, simulations connect to the backend API with real infrastructure data.'
                  : 'Esta demostración interactiva utiliza datos simulados para mostrar todas las funciones. Cargue archivos, ajuste parámetros, ejecute simulaciones y vea resultados con gráficos. En producción, las simulaciones se conectan a la API del backend con datos reales de infraestructura.'}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-gray-300 mt-16 py-12 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg"></div>
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
    </div>
  );
}
