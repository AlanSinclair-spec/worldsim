/**
 * Region utilities for El Salvador geographic data
 *
 * This module provides functions for working with El Salvador's
 * departments and municipalities for the WorldSim platform.
 */

export interface Region {
  id: string;
  name: string;
  nameEs: string;
  type: 'department' | 'municipality';
  parentId?: string; // For municipalities, references department
  coordinates: [number, number]; // [longitude, latitude]
  properties?: {
    population?: number;
    areaKm2?: number;
    [key: string]: unknown;
  };
}

/**
 * El Salvador departments (14 total)
 */
export const departments: Region[] = [
  { id: 'AH', name: 'Ahuachapán', nameEs: 'Ahuachapán', type: 'department', coordinates: [-89.845, 13.921] },
  { id: 'CA', name: 'Cabañas', nameEs: 'Cabañas', type: 'department', coordinates: [-88.741, 13.863] },
  { id: 'CH', name: 'Chalatenango', nameEs: 'Chalatenango', type: 'department', coordinates: [-88.935, 14.033] },
  { id: 'CU', name: 'Cuscatlán', nameEs: 'Cuscatlán', type: 'department', coordinates: [-89.049, 13.872] },
  { id: 'LI', name: 'La Libertad', nameEs: 'La Libertad', type: 'department', coordinates: [-89.322, 13.688] },
  { id: 'LP', name: 'La Paz', nameEs: 'La Paz', type: 'department', coordinates: [-89.090, 13.502] },
  { id: 'LU', name: 'La Unión', nameEs: 'La Unión', type: 'department', coordinates: [-87.844, 13.337] },
  { id: 'MO', name: 'Morazán', nameEs: 'Morazán', type: 'department', coordinates: [-88.127, 13.769] },
  { id: 'SA', name: 'Santa Ana', nameEs: 'Santa Ana', type: 'department', coordinates: [-89.559, 14.008] },
  { id: 'SM', name: 'San Miguel', nameEs: 'San Miguel', type: 'department', coordinates: [-88.177, 13.483] },
  { id: 'SO', name: 'Sonsonate', nameEs: 'Sonsonate', type: 'department', coordinates: [-89.724, 13.719] },
  { id: 'SS', name: 'San Salvador', nameEs: 'San Salvador', type: 'department', coordinates: [-89.187, 13.699] },
  { id: 'SV', name: 'San Vicente', nameEs: 'San Vicente', type: 'department', coordinates: [-88.783, 13.639] },
  { id: 'US', name: 'Usulután', nameEs: 'Usulután', type: 'department', coordinates: [-88.435, 13.345] },
];

/**
 * Get all regions (departments and municipalities)
 * In production, this would fetch from the database
 *
 * @returns Array of all regions
 */
export function getAllRegions(): Region[] {
  // In production, this would query the Supabase database
  // For now, return departments as base data
  return departments;
}

/**
 * Get a specific region by ID
 *
 * @param id - Region identifier
 * @returns Region object or null if not found
 */
export function getRegionById(id: string): Region | null {
  const allRegions = getAllRegions();
  return allRegions.find(region => region.id === id) || null;
}

/**
 * Get all municipalities within a department
 *
 * @param departmentId - Department identifier
 * @returns Array of municipalities
 */
export function getMunicipalitiesByDepartment(departmentId: string): Region[] {
  const allRegions = getAllRegions();
  return allRegions.filter(
    region => region.type === 'municipality' && region.parentId === departmentId
  );
}

/**
 * Get GeoJSON Feature for a region
 * This is used for map visualization
 *
 * @param region - Region object
 * @returns GeoJSON Feature
 */
export function getRegionGeoJSON(region: Region): GeoJSON.Feature {
  return {
    type: 'Feature',
    properties: {
      id: region.id,
      name: region.name,
      nameEs: region.nameEs,
      type: region.type,
      ...region.properties,
    },
    geometry: {
      type: 'Point',
      coordinates: region.coordinates,
    },
  };
}

/**
 * Get GeoJSON FeatureCollection for all regions
 *
 * @param regions - Array of regions
 * @returns GeoJSON FeatureCollection
 */
export function getRegionsGeoJSON(regions: Region[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: regions.map(getRegionGeoJSON),
  };
}

/**
 * Calculate distance between two coordinates using Haversine formula
 *
 * @param coord1 - First coordinate [longitude, latitude]
 * @param coord2 - Second coordinate [longitude, latitude]
 * @returns Distance in kilometers
 */
export function calculateDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const R = 6371; // Earth's radius in km
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Find the nearest region to a given coordinate
 *
 * @param coordinate - [longitude, latitude]
 * @param regions - Array of regions to search
 * @returns Nearest region
 */
export function findNearestRegion(
  coordinate: [number, number],
  regions: Region[] = getAllRegions()
): Region | null {
  if (regions.length === 0) return null;

  let nearestRegion = regions[0];
  let minDistance = calculateDistance(coordinate, regions[0].coordinates);

  for (let i = 1; i < regions.length; i++) {
    const distance = calculateDistance(coordinate, regions[i].coordinates);
    if (distance < minDistance) {
      minDistance = distance;
      nearestRegion = regions[i];
    }
  }

  return nearestRegion;
}
