/**
 * Baseline Data Helper
 * Functions for checking and loading El Salvador baseline data
 */

import { supabase } from './supabase';

export interface BaselineDataInfo {
  hasEnergy: boolean;
  hasRainfall: boolean;
  dateRange: {
    min: string;
    max: string;
  } | null;
  regions: string[];
  recordCount: {
    energy: number;
    rainfall: number;
  };
}

/**
 * Check if baseline data exists in the database
 */
export async function checkBaselineData(): Promise<BaselineDataInfo> {
  try {
    // Check energy baseline data
    const { count: energyCount, error: energyError } = await supabase
      .from('energy_daily')
      .select('*', { count: 'exact', head: true })
      .eq('is_baseline', true);

    // Check rainfall baseline data
    const { count: rainfallCount, error: rainfallError } = await supabase
      .from('rain_daily')
      .select('*', { count: 'exact', head: true })
      .eq('is_baseline', true);

    if (energyError || rainfallError) {
      console.warn('[Baseline] Error checking baseline data:', energyError || rainfallError);
      return {
        hasEnergy: false,
        hasRainfall: false,
        dateRange: null,
        regions: [],
        recordCount: { energy: 0, rainfall: 0 },
      };
    }

    // If baseline data exists, get date range and regions
    if (energyCount && energyCount > 0) {
      const { data: energyData, error: energyDateError } = await supabase
        .from('energy_daily')
        .select('date, region_id')
        .eq('is_baseline', true)
        .order('date', { ascending: true });

      if (!energyDateError && energyData && energyData.length > 0) {
        const dates = energyData.map(d => d.date);
        const regions = [...new Set(energyData.map(d => d.region_id))];

        return {
          hasEnergy: true,
          hasRainfall: (rainfallCount || 0) > 0,
          dateRange: {
            min: dates[0],
            max: dates[dates.length - 1],
          },
          regions,
          recordCount: {
            energy: energyCount || 0,
            rainfall: rainfallCount || 0,
          },
        };
      }
    }

    return {
      hasEnergy: (energyCount || 0) > 0,
      hasRainfall: (rainfallCount || 0) > 0,
      dateRange: null,
      regions: [],
      recordCount: {
        energy: energyCount || 0,
        rainfall: rainfallCount || 0,
      },
    };
  } catch (error) {
    console.error('[Baseline] Fatal error checking baseline data:', error);
    return {
      hasEnergy: false,
      hasRainfall: false,
      dateRange: null,
      regions: [],
      recordCount: { energy: 0, rainfall: 0 },
    };
  }
}

/**
 * Get baseline data summary for display
 */
export async function getBaselineSummary(): Promise<{
  available: boolean;
  message: string;
  dateRange?: { min: string; max: string };
  regions?: number;
}> {
  const info = await checkBaselineData();

  if (info.hasEnergy && info.hasRainfall && info.dateRange) {
    return {
      available: true,
      message: `El Salvador baseline data (${info.dateRange.min} to ${info.dateRange.max})`,
      dateRange: info.dateRange,
      regions: info.regions.length,
    };
  }

  if (info.hasEnergy || info.hasRainfall) {
    return {
      available: false,
      message: 'Partial baseline data available (missing energy or rainfall)',
    };
  }

  return {
    available: false,
    message: 'No baseline data available. Please upload CSV files or contact admin.',
  };
}

/**
 * Check if custom (user-uploaded) data exists for a date range
 */
export async function hasCustomData(startDate: string, endDate: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('energy_daily')
    .select('*', { count: 'exact', head: true })
    .eq('is_baseline', false)
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) {
    console.warn('[Baseline] Error checking custom data:', error);
    return false;
  }

  return (count || 0) > 0;
}
