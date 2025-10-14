'use client';

import { useState } from 'react';
import { Region } from '@/lib/regions';

interface UploadPanelProps {
  regions: Region[];
  onUpload: (file: File, dataType: string, regionId: string) => Promise<void>;
}

/**
 * Panel for uploading CSV data files
 *
 * Supports uploading:
 * - Energy data (demand, generation)
 * - Climate data (rainfall, temperature)
 * - Infrastructure data (capacity, locations)
 */
export function UploadPanel({ regions, onUpload }: UploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dataType, setDataType] = useState<'energy' | 'climate' | 'infrastructure'>('energy');
  const [regionId, setRegionId] = useState<string>(regions[0]?.id || '');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setMessage({ type: 'error', text: 'Please select a CSV file' });
        return;
      }
      setFile(selectedFile);
      setMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file' });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      await onUpload(file, dataType, regionId);
      setMessage({ type: 'success', text: 'File uploaded successfully!' });
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Data</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Data Type Selection */}
        <div>
          <label htmlFor="dataType" className="block text-sm font-medium text-gray-700 mb-2">
            Data Type
          </label>
          <select
            id="dataType"
            value={dataType}
            onChange={e =>
              setDataType(e.target.value as 'energy' | 'climate' | 'infrastructure')
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isUploading}
          >
            <option value="energy">Energy Data</option>
            <option value="climate">Climate Data</option>
            <option value="infrastructure">Infrastructure Data</option>
          </select>
        </div>

        {/* Region Selection */}
        <div>
          <label htmlFor="uploadRegion" className="block text-sm font-medium text-gray-700 mb-2">
            Region
          </label>
          <select
            id="uploadRegion"
            value={regionId}
            onChange={e => setRegionId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isUploading}
          >
            {regions.map(region => (
              <option key={region.id} value={region.id}>
                {region.name} ({region.nameEs})
              </option>
            ))}
          </select>
        </div>

        {/* File Upload */}
        <div>
          <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
            CSV File
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-primary-400 transition-colors">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                >
                  <span>Upload a file</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept=".csv"
                    className="sr-only"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">CSV files only</p>
              {file && (
                <p className="text-sm text-primary-600 font-medium mt-2">{file.name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Expected Format Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Expected CSV Format:</h3>
          <div className="text-xs text-blue-800">
            {dataType === 'energy' && (
              <p>Columns: date, demand_kwh, solar_generation_kwh, grid_generation_kwh</p>
            )}
            {dataType === 'climate' && (
              <p>Columns: date, rainfall_mm, temperature_c</p>
            )}
            {dataType === 'infrastructure' && (
              <p>Columns: name, type, capacity_mw, latitude, longitude</p>
            )}
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div
            className={`p-4 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!file || isUploading}
          className="w-full bg-primary-600 text-white py-3 px-6 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? 'Uploading...' : 'Upload File'}
        </button>
      </form>
    </div>
  );
}
