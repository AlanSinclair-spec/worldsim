'use client';

import { useState } from 'react';
import { SimulationParameters } from '@/lib/model';
import { Region } from '@/lib/regions';

interface ControlPanelProps {
  regions: Region[];
  onSimulate: (params: SimulationParameters) => void;
  isLoading?: boolean;
}

/**
 * Control panel for configuring simulation parameters
 *
 * Allows users to:
 * - Select region
 * - Set date range
 * - Adjust growth rates and scenarios
 * - Trigger simulation
 */
export function ControlPanel({ regions, onSimulate, isLoading = false }: ControlPanelProps) {
  const [params, setParams] = useState<SimulationParameters>({
    regionId: regions[0]?.id || '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    solarGrowthRate: 10,
    demandGrowthRate: 5,
    rainfallChange: 0,
    infrastructureCapacity: 100,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSimulate(params);
  };

  const updateParam = <K extends keyof SimulationParameters>(
    key: K,
    value: SimulationParameters[K]
  ) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Simulation Controls</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Region Selection */}
        <div>
          <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
            Region
          </label>
          <select
            id="region"
            value={params.regionId}
            onChange={e => updateParam('regionId', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isLoading}
          >
            {regions.map(region => (
              <option key={region.id} value={region.id}>
                {region.name} ({region.nameEs})
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={params.startDate}
              onChange={e => updateParam('startDate', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={params.endDate}
              onChange={e => updateParam('endDate', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Growth Rates */}
        <div>
          <label htmlFor="solarGrowth" className="block text-sm font-medium text-gray-700 mb-2">
            Solar Growth Rate: {params.solarGrowthRate}% annually
          </label>
          <input
            type="range"
            id="solarGrowth"
            min="-10"
            max="50"
            step="1"
            value={params.solarGrowthRate}
            onChange={e => updateParam('solarGrowthRate', parseFloat(e.target.value))}
            className="w-full"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="demandGrowth" className="block text-sm font-medium text-gray-700 mb-2">
            Demand Growth Rate: {params.demandGrowthRate}% annually
          </label>
          <input
            type="range"
            id="demandGrowth"
            min="-10"
            max="50"
            step="1"
            value={params.demandGrowthRate}
            onChange={e => updateParam('demandGrowthRate', parseFloat(e.target.value))}
            className="w-full"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="rainfallChange" className="block text-sm font-medium text-gray-700 mb-2">
            Rainfall Change: {params.rainfallChange > 0 ? '+' : ''}
            {params.rainfallChange}%
          </label>
          <input
            type="range"
            id="rainfallChange"
            min="-50"
            max="50"
            step="5"
            value={params.rainfallChange}
            onChange={e => updateParam('rainfallChange', parseFloat(e.target.value))}
            className="w-full"
            disabled={isLoading}
          />
        </div>

        {/* Infrastructure Capacity */}
        <div>
          <label
            htmlFor="infrastructureCapacity"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Infrastructure Capacity (MW)
          </label>
          <input
            type="number"
            id="infrastructureCapacity"
            value={params.infrastructureCapacity}
            onChange={e => updateParam('infrastructureCapacity', parseFloat(e.target.value))}
            min="0"
            step="10"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary-600 text-white py-3 px-6 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Running Simulation...' : 'Run Simulation'}
        </button>
      </form>
    </div>
  );
}
