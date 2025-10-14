'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapView } from '@/components/MapView';
import { ControlPanel, SimulationParams } from '@/components/ControlPanel';
import { UploadPanel } from '@/components/UploadPanel';
import { ResultsPanel } from '@/components/ResultsPanel';
import { SimulationResponse } from '@/lib/types';

/**
 * WorldSim Main Page
 *
 * Integrated platform for El Salvador digital twin simulations.
 *
 * Features:
 * - Interactive Mapbox GL JS map
 * - Simulation controls with parameter adjustment
 * - CSV file upload for energy and rainfall data
 * - Results visualization with charts and statistics
 * - Responsive three-column layout (stacks on mobile)
 */
export default function Page() {
  const [results, setResults] = useState<SimulationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle simulation run from ControlPanel
   */
  const handleRunSimulation = async (params: SimulationParams) => {
    console.log('🚀 Running simulation with params:', params);
    setIsLoading(true);
    setResults(null);

    // TODO: Call API endpoint /api/simulate
    // For now, just simulate a delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock results (will be replaced with API call)
    console.log('⏳ Simulation would run here with API integration');
    setIsLoading(false);
  };

  /**
   * Handle file upload from UploadPanel
   */
  const handleFileUpload = async (type: 'energy' | 'rainfall', file: File) => {
    console.log(`📁 Uploading ${type} file:`, file.name);
    // TODO: Call API endpoint /api/ingest
  };

  /**
   * Handle region click from MapView
   */
  const handleRegionClick = (regionId: string, regionName: string) => {
    console.log('🗺️ Region clicked:', regionId, regionName);
    // TODO: Update selected region state or trigger region-specific actions
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                WorldSim
              </h1>
              <p className="text-sm text-gray-600 mt-2">
                Test the future before living it
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/interactive"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Interactive Demo
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                About
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Three-column layout: 40% Left, 35% Middle (Map), 25% Right */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Column - Upload & Controls (40% on desktop) */}
          <div className="xl:col-span-5 space-y-6">
            {/* Upload Panel */}
            <UploadPanel
              language="en"
              onUpload={handleFileUpload}
            />

            {/* Control Panel */}
            <ControlPanel
              language="en"
              onRunSimulation={handleRunSimulation}
            />
          </div>

          {/* Middle Column - Map (35% on desktop) */}
          <div className="xl:col-span-4">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
              <MapView
                height="800px"
                onRegionClick={handleRegionClick}
              />
            </div>
          </div>

          {/* Right Column - Results (25% on desktop) */}
          <div className="xl:col-span-3">
            <ResultsPanel
              results={results}
              isLoading={isLoading}
              language="en"
            />
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Getting Started
              </h3>
              <p className="text-sm text-blue-800">
                Upload historical data, configure simulation parameters, and run scenarios to analyze infrastructure stress.{' '}
                <span className="font-medium">Tip:</span> Try the{' '}
                <Link href="/interactive" className="underline hover:text-blue-900">
                  Interactive Demo
                </Link>{' '}
                to see all features with mock data.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600 text-sm">
            WorldSim &copy; 2024 - Empowering decision-makers with data-driven insights
          </p>
        </div>
      </footer>
    </div>
  );
}
