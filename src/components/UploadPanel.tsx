'use client';

import { useState } from 'react';
import type { IngestStats, IngestRequest, IngestResponse } from '@/lib/types';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * Upload status types
 */
type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

/**
 * File upload data type
 */
interface FileUploadData {
  file: File | null;
  status: UploadStatus;
  error?: string;
  stats?: IngestStats;
}

interface UploadPanelProps {
  /** Language for labels (EN/ES) */
  language?: 'en' | 'es';
  /** Callback when files are uploaded successfully */
  onUpload?: (type: 'energy' | 'rainfall', stats: IngestStats) => void;
}

/**
 * UploadPanel Component
 *
 * Provides production-ready file upload interface for Energy and Rainfall CSV data:
 * - Drag-and-drop or click to select files
 * - Real-time upload status with spinner
 * - Comprehensive statistics display
 * - Error handling with detailed messages
 * - CSV format guide with examples
 *
 * Connects to /api/ingest endpoint for server-side processing.
 *
 * @example
 * <UploadPanel
 *   language="en"
 *   onUpload={(type, stats) => {
 *     console.log('Upload complete:', type, stats);
 *   }}
 * />
 */
export function UploadPanel({ language = 'en', onUpload }: UploadPanelProps) {
  const [energyUpload, setEnergyUpload] = useState<FileUploadData>({
    file: null,
    status: 'idle',
  });
  const [rainfallUpload, setRainfallUpload] = useState<FileUploadData>({
    file: null,
    status: 'idle',
  });
  const [showFormatGuide, setShowFormatGuide] = useState(false);

  const labels = {
    title: { en: 'Upload Data', es: 'Cargar Datos' },
    subtitle: {
      en: 'Import historical data to improve simulation accuracy',
      es: 'Importe datos históricos para mejorar la precisión de la simulación',
    },
    energyTitle: { en: 'Energy Data', es: 'Datos de Energía' },
    rainfallTitle: { en: 'Rainfall Data', es: 'Datos de Precipitación' },
    dragDrop: { en: 'Drag and drop CSV file here, or', es: 'Arrastre y suelte el archivo CSV aquí, o' },
    clickUpload: { en: 'click to upload', es: 'haga clic para cargar' },
    csvOnly: { en: 'CSV files only', es: 'Solo archivos CSV' },
    uploading: { en: 'Uploading...', es: 'Cargando...' },
    success: { en: 'Upload successful!', es: '¡Carga exitosa!' },
    error: { en: 'Upload failed', es: 'Error en la carga' },
    rowsInserted: { en: 'rows uploaded', es: 'filas cargadas' },
    dateRange: { en: 'Date range:', es: 'Rango de fechas:' },
    regions: { en: 'Regions:', es: 'Regiones:' },
    formatGuide: { en: 'CSV Format Guide', es: 'Guía de Formato CSV' },
    uploadButton: { en: 'Upload File', es: 'Cargar Archivo' },
    uploadAgain: { en: 'Upload Another File', es: 'Cargar Otro Archivo' },
    invalidFile: { en: 'Please select a CSV file', es: 'Por favor seleccione un archivo CSV' },
    readError: { en: 'Failed to read file', es: 'Error al leer el archivo' },
  };

  /**
   * Format number with thousands separators
   */
  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US');
  };

  /**
   * Read file content as text
   */
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(text);
      };
      reader.onerror = () => {
        reject(new Error(labels.readError[language]));
      };
      reader.readAsText(file);
    });
  };

  /**
   * Upload file to /api/ingest endpoint
   */
  const uploadToAPI = async (
    csvText: string,
    dataType: 'energy' | 'rainfall'
  ): Promise<IngestStats> => {
    const requestBody: IngestRequest = {
      csv_text: csvText,
      data_type: dataType,
    };

    const response = await fetch('/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const result: IngestResponse = await response.json();

    if (!result.success) {
      // Construct detailed error message
      let errorMessage = result.error || 'Upload failed';

      if (result.details) {
        errorMessage += `\n${result.details}`;
      }

      if (result.errors && result.errors.length > 0) {
        errorMessage += `\n\nValidation errors:\n${result.errors.slice(0, 5).join('\n')}`;
        if (result.errors.length > 5) {
          errorMessage += `\n... and ${result.errors.length - 5} more errors`;
        }
      }

      throw new Error(errorMessage);
    }

    if (!result.data) {
      throw new Error('No data returned from server');
    }

    return result.data;
  };

  /**
   * Handle file selection for a specific upload type
   */
  const handleFileSelect = (
    type: 'energy' | 'rainfall',
    file: File | null
  ) => {
    if (!file) return;

    const setUpload = type === 'energy' ? setEnergyUpload : setRainfallUpload;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setUpload({
        file: null,
        status: 'error',
        error: labels.invalidFile[language],
      });
      return;
    }

    // Set file with idle status
    setUpload({
      file,
      status: 'idle',
    });
  };

  /**
   * Handle file drop
   */
  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    type: 'energy' | 'rainfall'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(type, files[0]);
    }
  };

  /**
   * Prevent default drag behavior
   */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  /**
   * Handle upload button click
   */
  const handleUpload = async (type: 'energy' | 'rainfall') => {
    const uploadData = type === 'energy' ? energyUpload : rainfallUpload;
    const setUpload = type === 'energy' ? setEnergyUpload : setRainfallUpload;

    if (!uploadData.file) return;

    // Set uploading status
    setUpload({
      ...uploadData,
      status: 'uploading',
      error: undefined,
    });

    try {
      // Read file content
      const csvText = await readFileAsText(uploadData.file);

      // Upload to API
      const stats = await uploadToAPI(csvText, type);

      // Set success status
      setUpload({
        file: uploadData.file,
        status: 'success',
        stats,
      });

      // Call parent callback if provided
      if (onUpload) {
        onUpload(type, stats);
      }

      console.log(`✅ ${type} upload successful:`, stats);
    } catch (error) {
      // Set error status
      setUpload({
        file: uploadData.file,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
      });
      console.error(`❌ ${type} upload failed:`, error);
    }
  };

  /**
   * Clear upload and allow re-upload
   */
  const handleReset = (type: 'energy' | 'rainfall') => {
    const setUpload = type === 'energy' ? setEnergyUpload : setRainfallUpload;
    setUpload({
      file: null,
      status: 'idle',
    });
  };

  /**
   * Render upload area for a specific type
   */
  const renderUploadArea = (
    type: 'energy' | 'rainfall',
    uploadData: FileUploadData,
    title: string,
    color: 'green' | 'blue'
  ) => {
    const colorClasses = {
      green: {
        border: 'border-green-300',
        bg: 'bg-green-50',
        hover: 'hover:border-green-400',
        text: 'text-green-700',
        button: 'bg-green-600 hover:bg-green-700',
        icon: '⚡',
      },
      blue: {
        border: 'border-blue-300',
        bg: 'bg-blue-50',
        hover: 'hover:border-blue-400',
        text: 'text-blue-700',
        button: 'bg-blue-600 hover:bg-blue-700',
        icon: '🌧️',
      },
    };

    const colors = colorClasses[color];
    const isDisabled = uploadData.status === 'uploading';

    return (
      <div className="space-y-2 md:space-y-3">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-base sm:text-lg">{colors.icon}</span>
          {title}
        </h3>

        {/* Upload Area - smaller on mobile */}
        <div
          onDrop={(e) => handleDrop(e, type)}
          onDragOver={handleDragOver}
          className={`relative border-2 border-dashed rounded-lg p-4 md:p-8 text-center transition-all touch-manipulation ${colors.border} ${colors.bg} ${
            isDisabled ? 'opacity-50 cursor-not-allowed' : `${colors.hover} cursor-pointer`
          }`}
        >
          <input
            type="file"
            accept=".csv"
            onChange={(e) => handleFileSelect(type, e.target.files?.[0] || null)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isDisabled}
          />

          {/* Icon - smaller on mobile */}
          <div className="mb-2 md:mb-3">
            <svg
              className={`mx-auto h-8 w-8 md:h-12 md:w-12 ${colors.text}`}
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
          </div>

          {/* Text - smaller on mobile */}
          <p className="text-xs md:text-sm text-gray-600 mb-1">
            {labels.dragDrop[language]}{' '}
            <span className={`font-medium ${colors.text}`}>{labels.clickUpload[language]}</span>
          </p>
          <p className="text-[10px] md:text-xs text-gray-500">{labels.csvOnly[language]}</p>
        </div>

        {/* File Info */}
        {uploadData.file && (
          <div className="bg-white rounded-lg p-3 border-2 border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg
                    className="h-8 w-8 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {uploadData.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatNumber(uploadData.file.size)} bytes ({(uploadData.file.size / 1024).toFixed(1)} KB)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {uploadData.status === 'uploading' && (
          <div className="py-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <LoadingSpinner
              size="md"
              color="text-blue-600"
              text={labels.uploading[language]}
              center
            />
          </div>
        )}

        {uploadData.status === 'success' && uploadData.stats && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-900 mb-3">
                  {labels.success[language]}
                </p>
                <div className="space-y-2">
                  {/* Rows Inserted */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold text-green-900">
                      ✓ {formatNumber(uploadData.stats.rows_inserted)}
                    </span>
                    <span className="text-sm text-green-700">{labels.rowsInserted[language]}</span>
                  </div>

                  {/* Date Range */}
                  <div className="text-xs text-green-800">
                    <span className="font-medium">{labels.dateRange[language]}</span>{' '}
                    <span className="font-mono">{uploadData.stats.date_range.min}</span>
                    {' → '}
                    <span className="font-mono">{uploadData.stats.date_range.max}</span>
                  </div>

                  {/* Regions */}
                  <div className="text-xs text-green-800">
                    <span className="font-medium">{labels.regions[language]}</span>{' '}
                    <span className="font-normal">
                      {uploadData.stats.regions_affected.join(', ')}
                    </span>
                  </div>

                  {/* Warnings (if any errors but upload succeeded) */}
                  {uploadData.stats.errors && uploadData.stats.errors.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-green-300">
                      <p className="text-xs font-medium text-yellow-800 mb-1">
                        ⚠️ {uploadData.stats.errors.length} validation{' '}
                        {uploadData.stats.errors.length === 1 ? 'warning' : 'warnings'} (rows skipped)
                      </p>
                      <div className="text-xs text-yellow-700 space-y-1 max-h-20 overflow-y-auto">
                        {uploadData.stats.errors.slice(0, 3).map((err, idx) => (
                          <div key={idx} className="truncate">
                            • {err}
                          </div>
                        ))}
                        {uploadData.stats.errors.length > 3 && (
                          <div className="italic">
                            ... and {uploadData.stats.errors.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {uploadData.status === 'error' && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900 mb-1">{labels.error[language]}</p>
                {uploadData.error && (
                  <p className="text-xs text-red-700 whitespace-pre-line">{uploadData.error}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons - touch-friendly */}
        {uploadData.file && uploadData.status === 'idle' && (
          <button
            onClick={() => handleUpload(type)}
            className={`w-full px-4 py-3 min-h-[44px] ${colors.button} text-white text-sm md:text-base font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors shadow-sm touch-manipulation`}
          >
            {labels.uploadButton[language]}
          </button>
        )}

        {uploadData.status === 'success' && (
          <button
            onClick={() => handleReset(type)}
            className="w-full px-4 py-3 min-h-[44px] bg-gray-600 hover:bg-gray-700 text-white text-sm md:text-base font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors shadow-sm touch-manipulation"
          >
            {labels.uploadAgain[language]}
          </button>
        )}

        {uploadData.status === 'error' && (
          <button
            onClick={() => handleReset(type)}
            className="w-full px-4 py-3 min-h-[44px] bg-gray-600 hover:bg-gray-700 text-white text-sm md:text-base font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors shadow-sm touch-manipulation"
          >
            {labels.uploadAgain[language]}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">{labels.title[language]}</h2>
        <p className="text-sm text-gray-500 mt-1">{labels.subtitle[language]}</p>
      </div>

      <div className="space-y-6">
        {/* Energy Upload */}
        {renderUploadArea('energy', energyUpload, labels.energyTitle[language], 'green')}

        {/* Rainfall Upload */}
        {renderUploadArea('rainfall', rainfallUpload, labels.rainfallTitle[language], 'blue')}

        {/* CSV Format Guide */}
        <div className="border-t pt-4">
          <button
            onClick={() => setShowFormatGuide(!showFormatGuide)}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            <span className="flex items-center space-x-2">
              <span>📋</span>
              <span>{labels.formatGuide[language]}</span>
            </span>
            <span className="text-gray-400">
              {showFormatGuide ? '▼' : '▶'}
            </span>
          </button>

          {showFormatGuide && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {language === 'en' ? 'Required Columns' : 'Columnas Requeridas'}
                  </h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-2">
                    <li>
                      <code className="bg-gray-200 px-1 rounded">date</code> - YYYY-MM-DD format
                    </li>
                    <li>
                      <code className="bg-gray-200 px-1 rounded">region_name</code> -{' '}
                      {language === 'en' ? 'Department name' : 'Nombre del departamento'}
                    </li>
                    <li>
                      <code className="bg-gray-200 px-1 rounded">value</code> -{' '}
                      {language === 'en'
                        ? 'Energy (kWh) or Rainfall (mm)'
                        : 'Energía (kWh) o Precipitación (mm)'}
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {language === 'en' ? 'Example CSV' : 'Ejemplo de CSV'}
                  </h4>
                  <div className="bg-white border border-gray-300 rounded p-3 font-mono text-xs overflow-x-auto">
                    <div>date,region_name,value</div>
                    <div>2024-01-01,San Salvador,50000</div>
                    <div>2024-01-01,Santa Ana,25000</div>
                    <div>2024-01-02,San Salvador,52000</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {language === 'en' ? 'Valid Regions (14 Departments)' : 'Regiones Válidas (14 Departamentos)'}
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    San Salvador, Santa Ana, San Miguel, La Libertad, Sonsonate, La Paz, Usulután,
                    Chalatenango, Cuscatlán, Ahuachapán, Morazán, La Unión, San Vicente, Cabañas
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
