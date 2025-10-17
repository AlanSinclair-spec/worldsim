/**
 * Central type definitions for WorldSim application
 */

import { Region } from '@/lib/regions';
import { SimulationResult } from '@/lib/types';

// Re-export commonly used types
export type {
  SimulationResult,
  Region,
};

/**
 * API Response types
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * CSV Upload types
 */
export interface CsvUploadRequest {
  file: File;
  dataType: 'energy' | 'climate' | 'infrastructure';
  regionId: string;
}

export interface CsvUploadResponse {
  recordsImported: number;
  errors?: string[];
}

/**
 * LLM Explanation types
 */
export interface ExplainRequest {
  simulationId: string;
  language: 'en' | 'es';
  provider: 'openai' | 'anthropic';
}

export interface ExplainResponse {
  explanation: string;
  keyInsights: string[];
  recommendations: string[];
}

/**
 * Chart data types
 */
export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
}

export interface TimeSeriesData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
  }[];
}

/**
 * Map view types
 */
export interface MapViewport {
  longitude: number;
  latitude: number;
  zoom: number;
}

export interface MapLayer {
  id: string;
  type: 'fill' | 'line' | 'circle' | 'heatmap';
  source: string;
  paint: Record<string, unknown>;
  layout?: Record<string, unknown>;
}

/**
 * User preferences
 */
export interface UserPreferences {
  language: 'en' | 'es';
  theme: 'light' | 'dark';
  defaultRegion?: string;
}

/**
 * Loading and error states
 */
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  details?: string;
}
