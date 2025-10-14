import type { Metadata } from 'next';

/**
 * Page metadata for SEO
 */
export const metadata: Metadata = {
  title: 'WorldSim - El Salvador Digital Twin',
  description:
    'Digital twin simulation platform for El Salvador. Test infrastructure, energy, and climate scenarios before implementation.',
  keywords: [
    'El Salvador',
    'digital twin',
    'simulation',
    'energy',
    'climate',
    'infrastructure',
  ],
};

/**
 * WorldSim Main Page
 *
 * Features:
 * - Interactive map of El Salvador (placeholder)
 * - Simulation controls panel (placeholder)
 * - Responsive two-column layout
 * - Clean, modern design with Tailwind CSS
 */
export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                WorldSim
              </h1>
              <p className="text-sm text-gray-600 mt-2">
                El Salvador Digital Twin - Test the future before living it
              </p>
            </div>
            <a
              href="/demo"
              className="inline-flex items-center px-5 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200"
            >
              View Demo
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Two-column layout: 2/3 Map, 1/3 Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Map Container (2/3 width) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Map Placeholder */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-dashed border-blue-300 flex items-center justify-center min-h-[600px]">
                <div className="text-center p-8">
                  <svg
                    className="mx-auto h-24 w-24 text-blue-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Interactive Map
                  </h3>
                  <p className="text-gray-600 max-w-md">
                    El Salvador's 14 departments will be displayed here with clickable regions for
                    simulation
                  </p>
                </div>
              </div>
            </div>

            {/* Charts Placeholder (appears after simulation) */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Simulation Results
              </h3>
              <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center min-h-[300px]">
                <div className="text-center p-6">
                  <svg
                    className="mx-auto h-16 w-16 text-gray-400 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <p className="text-gray-600">
                    Charts and graphs will appear here after running a simulation
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Controls Panel (1/3 width) */}
          <div className="space-y-8">
            {/* Controls Placeholder */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Simulation Controls
              </h3>
              <div className="space-y-4">
                {/* Region Selector Placeholder */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Region
                  </label>
                  <div className="w-full h-10 bg-gray-100 rounded-md border border-gray-300"></div>
                </div>

                {/* Date Range Placeholder */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <div className="w-full h-10 bg-gray-100 rounded-md border border-gray-300"></div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <div className="w-full h-10 bg-gray-100 rounded-md border border-gray-300"></div>
                  </div>
                </div>

                {/* Sliders Placeholder */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Solar Growth Rate
                  </label>
                  <div className="w-full h-2 bg-gray-200 rounded-full"></div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rainfall Change
                  </label>
                  <div className="w-full h-2 bg-gray-200 rounded-full"></div>
                </div>

                {/* Run Button Placeholder */}
                <button className="w-full mt-6 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200">
                  Run Simulation
                </button>
              </div>
            </div>

            {/* Results Summary Placeholder */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Results Summary</h3>
              <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6 min-h-[200px] flex items-center justify-center">
                <p className="text-gray-600 text-center">
                  Results will appear here after simulation
                </p>
              </div>
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
