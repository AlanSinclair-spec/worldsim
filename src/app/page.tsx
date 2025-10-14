'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MapView } from '@/components/MapView';
import { ControlPanel } from '@/components/ControlPanel';
import { UploadPanel } from '@/components/UploadPanel';
import { ResultsPanel } from '@/components/ResultsPanel';
import { Charts } from '@/components/Charts';
import { getAllRegions } from '@/lib/regions';
import { SimulationParameters, SimulationOutput } from '@/types';

const queryClient = new QueryClient();

/**
 * Home page - Main simulation interface
 *
 * Features:
 * - Interactive map of El Salvador
 * - Simulation controls
 * - Data upload
 * - Results visualization
 */
function HomePage() {
  const regions = getAllRegions();
  const [selectedRegion, setSelectedRegion] = useState(regions[0] || null);
  const [simulationResults, setSimulationResults] = useState<SimulationOutput | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<'controls' | 'upload'>('controls');

  const handleSimulate = async (params: SimulationParameters) => {
    setIsSimulating(true);
    setExplanation(undefined);

    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const result = await response.json();

      if (result.success) {
        setSimulationResults(result.data.simulation);
      } else {
        alert(`Simulation failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Simulation error:', error);
      alert('Failed to run simulation');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleUpload = async (file: File, dataType: string, regionId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dataType', dataType);
    formData.append('regionId', regionId);

    const response = await fetch('/api/ingest', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    alert(`Successfully uploaded ${result.data.recordsImported} records`);
  };

  const handleExplain = async (language: 'en' | 'es') => {
    if (!simulationResults) return;

    setIsExplaining(true);

    try {
      // For now, generate a simple explanation client-side
      // In production, this would call /api/explain with a simulationId
      const summary = simulationResults.summary;
      const params = simulationResults.parameters;

      const simpleExplanation =
        language === 'en'
          ? `This simulation analyzed energy patterns for the selected region over the specified period.

Key Findings:
- Total energy demand reached ${(summary.totalDemandKwh / 1000).toFixed(1)} MWh
- Solar generation contributed ${summary.solarPercentage.toFixed(1)}% of total energy needs
- ${summary.peakDeficit > 0 ? `Peak energy deficit of ${(summary.peakDeficit / 1000).toFixed(1)} MWh indicates potential supply challenges` : 'No energy deficits detected during the simulation period'}

Recommendations:
${params.solarGrowthRate > 0 ? '- Continue investing in solar infrastructure to increase renewable energy capacity' : '- Consider accelerating solar energy adoption'}
- Monitor demand growth trends and plan infrastructure upgrades accordingly
- Implement energy efficiency programs to manage demand peaks`
          : `Esta simulación analizó patrones de energía para la región seleccionada durante el período especificado.

Hallazgos Clave:
- La demanda total de energía alcanzó ${(summary.totalDemandKwh / 1000).toFixed(1)} MWh
- La generación solar contribuyó ${summary.solarPercentage.toFixed(1)}% de las necesidades totales de energía
- ${summary.peakDeficit > 0 ? `Déficit máximo de energía de ${(summary.peakDeficit / 1000).toFixed(1)} MWh indica posibles desafíos de suministro` : 'No se detectaron déficits de energía durante el período de simulación'}

Recomendaciones:
${params.solarGrowthRate > 0 ? '- Continuar invirtiendo en infraestructura solar para aumentar la capacidad de energía renovable' : '- Considerar acelerar la adopción de energía solar'}
- Monitorear tendencias de crecimiento de demanda y planificar actualizaciones de infraestructura
- Implementar programas de eficiencia energética para gestionar picos de demanda`;

      setExplanation(simpleExplanation);
    } catch (error) {
      console.error('Explanation error:', error);
      alert('Failed to generate explanation');
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">WorldSim</h1>
              <p className="text-sm text-gray-600 mt-1">
                Digital Twin for El Salvador - Test the future before living it
              </p>
            </div>
            <a
              href="/demo"
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
            >
              View Demo
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-4" style={{ height: '600px' }}>
              <MapView
                regions={regions}
                selectedRegion={selectedRegion}
                onRegionSelect={setSelectedRegion}
              />
            </div>

            {/* Charts */}
            {simulationResults && (
              <div className="mt-8">
                <Charts results={simulationResults.results} />
              </div>
            )}
          </div>

          {/* Right Column - Controls and Results */}
          <div className="space-y-8">
            {/* Tab Switcher */}
            <div className="bg-white rounded-lg shadow-lg p-2 flex gap-2">
              <button
                onClick={() => setActiveTab('controls')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'controls'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Controls
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'upload'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Upload Data
              </button>
            </div>

            {/* Control Panel or Upload Panel */}
            {activeTab === 'controls' ? (
              <ControlPanel regions={regions} onSimulate={handleSimulate} isLoading={isSimulating} />
            ) : (
              <UploadPanel regions={regions} onUpload={handleUpload} />
            )}

            {/* Results Panel */}
            <ResultsPanel
              results={simulationResults}
              onExplain={handleExplain}
              isExplaining={isExplaining}
              explanation={explanation}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600 text-sm">
            WorldSim &copy; 2024 - Empowering decision-makers with data-driven insights
          </p>
        </div>
      </footer>
    </div>
  );
}

/**
 * Root page component wrapped with providers
 */
export default function Page() {
  return (
    <QueryClientProvider client={queryClient}>
      <HomePage />
    </QueryClientProvider>
  );
}
