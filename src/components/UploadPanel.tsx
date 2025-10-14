'use client';

import { useState } from 'react';

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
  stats?: {
    rowsInserted: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
}

interface UploadPanelProps {
  /** Language for labels (EN/ES) */
  language?: 'en' | 'es';
  /** Callback when files are uploaded */
  onUpload?: (type: 'energy' | 'rainfall', file: File) => Promise<void>;
}

/**
 * UploadPanel Component
 *
 * Provides file upload interface for Energy and Rainfall CSV data:
 * - Drag-and-drop or click to select files
 * - Upload status tracking
 * - Statistics display after upload
 * - CSV format guide
 *
 * @example
 * <UploadPanel
 *   language="en"
 *   onUpload={async (type, file) => {
 *     console.log('Uploading', type, file);
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
    rowsInserted: { en: 'Rows inserted:', es: 'Filas insertadas:' },
    dateRange: { en: 'Date range:', es: 'Rango de fechas:' },
    formatGuide: { en: 'CSV Format Guide', es: 'Guía de Formato CSV' },
    showGuide: { en: 'Show format guide', es: 'Mostrar guía de formato' },
    hideGuide: { en: 'Hide format guide', es: 'Ocultar guía de formato' },
  };

  /**
   * Handle file selection for a specific upload type
   */
  const handleFileSelect = (
    type: 'energy' | 'rainfall',
    file: File | null
  ) => {
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      const setUpload = type === 'energy' ? setEnergyUpload : setRainfallUpload;
      setUpload({
        file: null,
        status: 'error',
        error: language === 'en' ? 'Please select a CSV file' : 'Por favor seleccione un archivo CSV',
      });
      return;
    }

    const setUpload = type === 'energy' ? setEnergyUpload : setRainfallUpload;
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
    });

    try {
      // Simulate upload with delay (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock success response
      const mockStats = {
        rowsInserted: Math.floor(Math.random() * 500) + 100,
        dateRange: {
          start: '2024-01-01',
          end: '2024-12-31',
        },
      };

      setUpload({
        file: uploadData.file,
        status: 'success',
        stats: mockStats,
      });

      // Call parent callback if provided
      if (onUpload) {
        await onUpload(type, uploadData.file);
      }

      console.log(`✅ ${type} upload successful:`, mockStats);
    } catch (error) {
      setUpload({
        file: uploadData.file,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
      });
      console.error(`❌ ${type} upload failed:`, error);
    }
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
      },
      blue: {
        border: 'border-blue-300',
        bg: 'bg-blue-50',
        hover: 'hover:border-blue-400',
        text: 'text-blue-700',
        button: 'bg-blue-600 hover:bg-blue-700',
      },
    };

    const colors = colorClasses[color];

    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>

        {/* Upload Area */}
        <div
          onDrop={(e) => handleDrop(e, type)}
          onDragOver={handleDragOver}
          className={`relative border-2 border-dashed rounded-lg p-6 text-center ${colors.border} ${colors.bg} ${colors.hover} transition-colors`}
        >
          <input
            type="file"
            accept=".csv"
            onChange={(e) => handleFileSelect(type, e.target.files?.[0] || null)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploadData.status === 'uploading'}
          />

          {/* Icon */}
          <div className="mb-3">
            📊
          </div>

          {/* Text */}
          <p className="text-sm text-gray-600 mb-1">
            {labels.dragDrop[language]}{' '}
            <span className={`font-medium ${colors.text}`}>{labels.clickUpload[language]}</span>
          </p>
          <p className="text-xs text-gray-500">{labels.csvOnly[language]}</p>
        </div>

        {/* File Info */}
        {uploadData.file && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">📄</span>
                <span className="text-sm font-medium text-gray-900">{uploadData.file.name}</span>
              </div>
              <span className="text-xs text-gray-500">
                {(uploadData.file.size / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {uploadData.status === 'uploading' && (
          <div className="flex items-center justify-center space-x-2 py-2">
            <svg
              className="animate-spin h-5 w-5 text-primary-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-sm text-gray-600">{labels.uploading[language]}</span>
          </div>
        )}

        {uploadData.status === 'success' && uploadData.stats && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <span className="text-lg">✅</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-900 mb-2">
                  {labels.success[language]}
                </p>
                <div className="space-y-1 text-xs text-green-800">
                  <p>
                    {labels.rowsInserted[language]} <strong>{uploadData.stats.rowsInserted}</strong>
                  </p>
                  <p>
                    {labels.dateRange[language]} <strong>{uploadData.stats.dateRange.start}</strong> →{' '}
                    <strong>{uploadData.stats.dateRange.end}</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {uploadData.status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <span className="text-lg">❌</span>
              <div>
                <p className="text-sm font-semibold text-red-900">{labels.error[language]}</p>
                {uploadData.error && (
                  <p className="text-xs text-red-700 mt-1">{uploadData.error}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upload Button */}
        {uploadData.file && uploadData.status !== 'success' && (
          <button
            onClick={() => handleUpload(type)}
            disabled={uploadData.status === 'uploading'}
            className={`w-full px-4 py-2 ${colors.button} text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors`}
          >
            {uploadData.status === 'uploading'
              ? labels.uploading[language]
              : language === 'en'
                ? 'Upload File'
                : 'Cargar Archivo'}
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
                        ? 'Energy (MWh) or Rainfall (mm)'
                        : 'Energía (MWh) o Precipitación (mm)'}
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {language === 'en' ? 'Example Row' : 'Ejemplo de Fila'}
                  </h4>
                  <div className="bg-white border border-gray-300 rounded p-2 font-mono text-xs overflow-x-auto">
                    2024-01-01,San Salvador,120.5
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {language === 'en' ? 'Valid Regions' : 'Regiones Válidas'}
                  </h4>
                  <p className="text-xs text-gray-600">
                    San Salvador, La Libertad, Santa Ana, San Miguel, Sonsonate, La Paz, Usulután,
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
