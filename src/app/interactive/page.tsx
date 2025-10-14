'use client';

import { useState } from 'react';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  WorldSim
                </h1>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {labels.title[language]}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {labels.subtitle[language]}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Language Toggle */}
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    language === 'en'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('es')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    language === 'es'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ES
                </button>
              </div>
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                {language === 'en' ? 'Back Home' : 'Volver'}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Configuration */}
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {labels.leftColumn[language]}
              </h2>

              {/* Control Panel */}
              <ControlPanel
                language={language}
                onRunSimulation={handleRunSimulation}
              />
            </div>

            {/* Upload Panel */}
            <UploadPanel
              language={language}
              onUpload={handleFileUpload}
            />
          </div>

          {/* Right Column - Results */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {labels.rightColumn[language]}
            </h2>

            {/* Results Panel */}
            <ResultsPanel
              results={results}
              isLoading={isLoading}
              language={language}
            />
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <svg
              className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                {language === 'en' ? 'Demo Mode' : 'Modo de Demostración'}
              </h3>
              <p className="text-sm text-blue-800">
                {language === 'en'
                  ? 'This page uses mock data to demonstrate functionality. In production, simulations would connect to the backend API and use real data from the database.'
                  : 'Esta página utiliza datos simulados para demostrar la funcionalidad. En producción, las simulaciones se conectarían a la API del backend y utilizarían datos reales de la base de datos.'}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-sm text-gray-600">
              WorldSim &copy; 2024 - {language === 'en' ? 'El Salvador Digital Twin' : 'Gemelo Digital de El Salvador'}
            </p>
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
                {language === 'en' ? 'Home' : 'Inicio'}
              </Link>
              <Link href="/demo" className="text-sm text-gray-600 hover:text-gray-900">
                {language === 'en' ? 'About' : 'Acerca de'}
              </Link>
              <a
                href="https://github.com/AlanSinclair-spec/worldsim"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-gray-900"
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
