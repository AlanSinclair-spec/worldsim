/**
 * Export Utilities for WorldSim
 *
 * Provides functions to export simulation results to various formats:
 * - CSV for data analysis in spreadsheet tools
 * - PNG for chart screenshots (requires Chart.js canvas reference)
 */

import { SimulationResponse } from './types';

/**
 * Convert simulation results to CSV format
 *
 * Generates a CSV with columns: date, region_id, region_name, demand, supply, stress
 *
 * @param results - Simulation results to export
 * @param includeHeaders - Whether to include column headers (default: true)
 * @returns CSV-formatted string
 *
 * @example
 * const csv = exportToCSV(simulationResults);
 * downloadCSV(csv, 'simulation_results.csv');
 */
export function exportToCSV(results: SimulationResponse, includeHeaders = true): string {
  const lines: string[] = [];

  // Add header row
  if (includeHeaders) {
    lines.push('date,region_id,region_name,demand,supply,stress');
  }

  // Add data rows
  for (const result of results.daily_results) {
    const row = [
      result.date,
      result.region_id,
      `"${result.region_name}"`, // Quote names to handle commas
      result.demand.toFixed(2),
      result.supply.toFixed(2),
      result.stress.toFixed(4),
    ];
    lines.push(row.join(','));
  }

  return lines.join('\n');
}

/**
 * Download a CSV string as a file
 *
 * Creates a Blob and triggers a browser download
 *
 * @param csvContent - CSV-formatted string
 * @param filename - Desired filename (default: simulation_results.csv)
 *
 * @example
 * const csv = exportToCSV(results);
 * downloadCSV(csv, 'my_simulation.csv');
 */
export function downloadCSV(csvContent: string, filename = 'simulation_results.csv'): void {
  // Create a Blob with CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  // Create a download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  // Append to body, click, and cleanup
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Release the object URL
  URL.revokeObjectURL(url);
}

/**
 * Export summary statistics to CSV
 *
 * Generates a separate CSV with regional summary statistics
 *
 * @param results - Simulation results to export
 * @param includeHeaders - Whether to include column headers (default: true)
 * @returns CSV-formatted string
 *
 * @example
 * const csv = exportSummaryToCSV(results);
 * downloadCSV(csv, 'simulation_summary.csv');
 */
export function exportSummaryToCSV(results: SimulationResponse, includeHeaders = true): string {
  const lines: string[] = [];

  // Add header row
  if (includeHeaders) {
    lines.push('rank,region_id,region_name,avg_stress');
  }

  // Add summary data rows
  results.summary.top_stressed_regions.forEach((region, index) => {
    const row = [
      (index + 1).toString(),
      region.region_id,
      `"${region.region_name}"`,
      region.avg_stress.toFixed(4),
    ];
    lines.push(row.join(','));
  });

  return lines.join('\n');
}

/**
 * Download chart as PNG image
 *
 * Extracts canvas content from Chart.js and downloads as PNG
 *
 * @param canvasElement - HTML canvas element from Chart.js
 * @param filename - Desired filename (default: chart.png)
 *
 * @example
 * const canvas = chartRef.current?.canvas;
 * if (canvas) {
 *   downloadChartAsPNG(canvas, 'stress_chart.png');
 * }
 */
export function downloadChartAsPNG(
  canvasElement: HTMLCanvasElement | null | undefined,
  filename = 'chart.png'
): void {
  if (!canvasElement) {
    console.error('Cannot export chart: canvas element not found');
    return;
  }

  // Convert canvas to blob
  canvasElement.toBlob((blob) => {
    if (!blob) {
      console.error('Failed to create image blob');
      return;
    }

    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    // Append to body, click, and cleanup
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Release the object URL
    URL.revokeObjectURL(url);
  }, 'image/png');
}

/**
 * Generate a timestamped filename for exports
 *
 * @param prefix - Filename prefix (e.g., 'simulation', 'summary')
 * @param extension - File extension without dot (e.g., 'csv', 'png')
 * @returns Filename with timestamp (e.g., 'simulation_2024-01-15_14-30.csv')
 *
 * @example
 * const filename = getTimestampedFilename('simulation', 'csv');
 * // Returns: 'simulation_2024-01-15_14-30-45.csv'
 */
export function getTimestampedFilename(prefix: string, extension: string): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS

  return `${prefix}_${date}_${time}.${extension}`;
}
