'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapViewProps {
  /** Optional callback when a region is clicked */
  onRegionClick?: (regionId: string, regionName: string) => void;
  /** Height of the map container (default: 600px) */
  height?: string;
}

/**
 * MapView Component
 *
 * Interactive Mapbox GL JS map displaying El Salvador's regions.
 *
 * Features:
 * - Gray regions with hover effects
 * - Click to show popup with region name
 * - Responsive container
 * - Loading and error states
 * - Navigation controls
 *
 * @example
 * <MapView onRegionClick={(id, name) => console.log(id, name)} />
 */
export function MapView({ onRegionClick, height = '600px' }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popup = useRef<mapboxgl.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize Mapbox GL JS map
   */
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Check for Mapbox token
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxToken) {
      setError('Mapbox token not configured. Please add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local file.');
      console.error('NEXT_PUBLIC_MAPBOX_TOKEN is missing');
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    try {
      // Initialize map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-88.9, 13.7], // El Salvador center
        zoom: 8,
      });

      // Create popup instance
      popup.current = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: true,
      });

      map.current.on('load', () => {
        setMapLoaded(true);
        setError(null);
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setError('Failed to load map. Please check your internet connection.');
      });

      // Add navigation controls (zoom, rotate)
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize map. Please refresh the page.');
    }

    // Cleanup on unmount
    return () => {
      popup.current?.remove();
      popup.current = null;
      map.current?.remove();
      map.current = null;
    };
  }, []); // Empty dependency array - only run once

  /**
   * Load regions GeoJSON and add map layers
   */
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const mapInstance = map.current;

    // Load regions from public directory
    fetch('/regions.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load regions.json: ${response.statusText}`);
        }
        return response.json();
      })
      .then(geojson => {
        // Add source if it doesn't exist
        if (!mapInstance.getSource('regions')) {
          mapInstance.addSource('regions', {
            type: 'geojson',
            data: geojson,
            generateId: true, // Generate IDs for features to enable feature-state
          });

          // Add fill layer for region polygons (gray with darker hover effect)
          mapInstance.addLayer({
            id: 'regions-fill',
            type: 'fill',
            source: 'regions',
            paint: {
              'fill-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                '#6b7280', // gray-500 (darker on hover)
                '#9ca3af', // gray-400 (default)
              ],
              'fill-opacity': 0.6,
            },
          });

          // Add outline layer for region borders (thicker on hover)
          mapInstance.addLayer({
            id: 'regions-outline',
            type: 'line',
            source: 'regions',
            paint: {
              'line-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                '#1f2937', // gray-800 (darker on hover)
                '#4b5563', // gray-600 (default)
              ],
              'line-width': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                3, // Thicker on hover
                2, // Default width
              ],
            },
          });

          // Add labels for region names
          mapInstance.addLayer({
            id: 'regions-labels',
            type: 'symbol',
            source: 'regions',
            layout: {
              'text-field': ['get', 'name'],
              'text-size': 12,
              'text-anchor': 'center',
            },
            paint: {
              'text-color': '#1f2937', // gray-800
              'text-halo-color': '#ffffff',
              'text-halo-width': 2,
            },
          });

          let hoveredRegionId: string | number | null = null;

          // Hover effect: darken region and outline on mouse enter
          mapInstance.on('mouseenter', 'regions-fill', (e) => {
            // Change cursor to pointer
            mapInstance.getCanvas().style.cursor = 'pointer';

            if (e.features && e.features.length > 0) {
              // Remove previous hover state
              if (hoveredRegionId !== null) {
                mapInstance.setFeatureState(
                  { source: 'regions', id: hoveredRegionId },
                  { hover: false }
                );
              }

              // Set new hover state
              hoveredRegionId = e.features[0].id!;
              mapInstance.setFeatureState(
                { source: 'regions', id: hoveredRegionId },
                { hover: true }
              );
            }
          });

          // Hover effect: remove highlight on mouse leave
          mapInstance.on('mouseleave', 'regions-fill', () => {
            // Reset cursor
            mapInstance.getCanvas().style.cursor = '';

            // Remove hover state
            if (hoveredRegionId !== null) {
              mapInstance.setFeatureState(
                { source: 'regions', id: hoveredRegionId },
                { hover: false }
              );
              hoveredRegionId = null;
            }
          });

          // Click handler: show popup with region name
          mapInstance.on('click', 'regions-fill', (e) => {
            if (e.features && e.features.length > 0) {
              const feature = e.features[0];
              const regionId = feature.properties?.id || '';
              const regionName = feature.properties?.name || 'Unknown Region';
              const regionNameEs = feature.properties?.nameEs || regionName;
              const population = feature.properties?.population;
              const areaKm2 = feature.properties?.areaKm2;

              // Build popup content
              let popupContent = `<div class="font-sans">
                <h3 class="font-bold text-lg mb-2">${regionName}</h3>`;

              if (regionNameEs && regionNameEs !== regionName) {
                popupContent += `<p class="text-sm text-gray-600 mb-2">${regionNameEs}</p>`;
              }

              if (population) {
                popupContent += `<p class="text-sm"><strong>Population:</strong> ${population.toLocaleString()}</p>`;
              }

              if (areaKm2) {
                popupContent += `<p class="text-sm"><strong>Area:</strong> ${areaKm2.toLocaleString()} km²</p>`;
              }

              popupContent += `</div>`;

              // Show popup at click location
              if (popup.current) {
                popup.current
                  .setLngLat(e.lngLat)
                  .setHTML(popupContent)
                  .addTo(mapInstance);
              }

              // Call optional callback
              if (onRegionClick) {
                onRegionClick(regionId, regionName);
              }

              console.log('Region clicked:', regionId, regionName);
            }
          });
        }
      })
      .catch(err => {
        console.error('Error loading regions.json:', err);
        setError(`Failed to load regions: ${err.message}`);
      });
  }, [mapLoaded, onRegionClick]);

  // Render map container with loading and error states
  return (
    <div className="relative w-full" style={{ height }}>
      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full rounded-lg" />

      {/* Loading state */}
      {!mapLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg border-2 border-red-200">
          <div className="text-center p-6 max-w-md">
            <svg
              className="mx-auto h-12 w-12 text-red-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Map Error</h3>
            <p className="text-sm text-red-700">{error}</p>
            {error.includes('token') && (
              <div className="mt-4 text-xs text-left bg-white p-3 rounded border border-red-300">
                <p className="font-mono text-gray-700">
                  Add to .env.local:
                  <br />
                  NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
