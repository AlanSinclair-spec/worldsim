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
 * MapView Component - Premium Edition
 *
 * Professional interactive map displaying El Salvador's regions with modern styling.
 *
 * Features:
 * - Clean streets-v12 base map style
 * - Blue gradient regions with glow effects on hover
 * - Custom styled popups with modern card design
 * - Navigation controls, scale bar, and compass
 * - Smooth animations and transitions (300ms)
 * - Optimized bounds to perfectly fit El Salvador
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
   * Initialize Mapbox GL JS map with premium styling and controls
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
      // Initialize map with light style for compatibility
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11', // Clean, compatible base map
        center: [-88.9, 13.7], // El Salvador center
        zoom: 8.2,
        pitch: 0, // Flat view for clarity
        bearing: 0,
        // Optimized bounds to fit El Salvador perfectly
        maxBounds: [
          [-90.5, 12.8], // Southwest
          [-87.0, 14.5], // Northeast
        ],
        minZoom: 7,
        maxZoom: 14,
        // Smooth animations
        attributionControl: false, // We'll add it back in a better position
      });

      // Create custom styled popup
      popup.current = new mapboxgl.Popup({
        closeButton: false, // Custom close button in HTML
        closeOnClick: true,
        className: 'custom-popup', // For additional CSS styling
        maxWidth: '320px',
        offset: 15, // Offset from click point
      });

      map.current.on('load', () => {
        setMapLoaded(true);
        setError(null);

        // Fit to El Salvador bounds with padding
        if (map.current) {
          map.current.fitBounds(
            [
              [-90.2, 13.0], // Southwest
              [-87.5, 14.45], // Northeast
            ],
            {
              padding: { top: 40, bottom: 40, left: 40, right: 40 },
              duration: 1000, // Smooth 1s animation on load
            }
          );
        }
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setError('Failed to load map. Please check your internet connection.');
      });

      // Add professional controls

      // Navigation controls (zoom, compass) - top right
      const nav = new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true,
      });
      map.current.addControl(nav, 'top-right');

      // Scale bar - bottom left
      const scale = new mapboxgl.ScaleControl({
        maxWidth: 100,
        unit: 'metric', // kilometers
      });
      map.current.addControl(scale, 'bottom-left');

      // Attribution - bottom right (compact)
      const attribution = new mapboxgl.AttributionControl({
        compact: true,
        customAttribution: '© WorldSim',
      });
      map.current.addControl(attribution, 'bottom-right');
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
   * Load regions GeoJSON and add premium styled map layers
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

          // Add glow layer (only visible on hover for premium effect)
          mapInstance.addLayer({
            id: 'regions-glow',
            type: 'fill',
            source: 'regions',
            paint: {
              'fill-color': '#60a5fa', // blue-400 glow
              'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                0.4, // Visible glow on hover
                0, // Hidden by default
              ],
              'fill-opacity-transition': {
                duration: 300, // Smooth 300ms transition
                delay: 0,
              },
            },
          });

          // Add main fill layer with modern blue gradient
          mapInstance.addLayer({
            id: 'regions-fill',
            type: 'fill',
            source: 'regions',
            paint: {
              'fill-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                '#60a5fa', // blue-400 (brighter on hover)
                '#3b82f6', // blue-500 (default)
              ],
              'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                0.5, // More visible on hover
                0.3, // Semi-transparent default
              ],
              // Smooth transitions
              'fill-color-transition': {
                duration: 300,
                delay: 0,
              },
              'fill-opacity-transition': {
                duration: 300,
                delay: 0,
              },
            },
          });

          // Add outline layer for crisp borders
          mapInstance.addLayer({
            id: 'regions-outline',
            type: 'line',
            source: 'regions',
            paint: {
              'line-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                '#2563eb', // blue-600 (darker on hover for contrast)
                '#ffffff', // white (clean default)
              ],
              'line-width': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                3, // Thicker on hover
                2, // Default width
              ],
              'line-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                1.0, // Full opacity on hover
                0.8, // Slightly transparent default
              ],
              // Smooth transitions
              'line-color-transition': {
                duration: 300,
                delay: 0,
              },
              'line-width-transition': {
                duration: 300,
                delay: 0,
              },
            },
          });

          // Add labels for region names with better visibility
          mapInstance.addLayer({
            id: 'regions-labels',
            type: 'symbol',
            source: 'regions',
            layout: {
              'text-field': ['get', 'name'],
              'text-size': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                14, // Larger on hover
                12, // Default size
              ],
              'text-anchor': 'center',
              'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
            },
            paint: {
              'text-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                '#1e3a8a', // blue-900 (darker on hover)
                '#1f2937', // gray-800 (default)
              ],
              'text-halo-color': '#ffffff',
              'text-halo-width': 2,
              'text-halo-blur': 1,
              // Smooth transitions
              'text-color-transition': {
                duration: 300,
                delay: 0,
              },
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

          // Click handler: show premium styled popup
          mapInstance.on('click', 'regions-fill', (e) => {
            if (e.features && e.features.length > 0) {
              const feature = e.features[0];
              const regionId = feature.properties?.id || '';
              const regionName = feature.properties?.name || 'Unknown Region';
              const regionNameEs = feature.properties?.nameEs || regionName;
              const population = feature.properties?.population;
              const areaKm2 = feature.properties?.areaKm2;

              // Build premium popup content with modern card design
              let popupContent = `
                <div class="font-sans bg-white rounded-xl shadow-2xl overflow-hidden" style="min-width: 280px;">
                  <!-- Header with gradient -->
                  <div class="bg-gradient-to-r from-blue-600 to-green-600 px-4 py-3">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-2">
                        <div class="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                          <span class="text-white text-lg">📍</span>
                        </div>
                        <h3 class="font-bold text-lg text-white">${regionName}</h3>
                      </div>
                      <button onclick="this.closest('.mapboxgl-popup').remove()" class="text-white/80 hover:text-white transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>`;

              if (regionNameEs && regionNameEs !== regionName) {
                popupContent += `
                    <p class="text-sm text-blue-100 mt-1 ml-10">${regionNameEs}</p>`;
              }

              popupContent += `
                  </div>

                  <!-- Content with stats -->
                  <div class="px-4 py-3 space-y-3">`;

              if (population) {
                popupContent += `
                    <div class="flex items-center space-x-3 p-2 bg-blue-50 rounded-lg">
                      <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span class="text-white text-lg">👥</span>
                      </div>
                      <div>
                        <p class="text-xs text-gray-500 font-semibold uppercase tracking-wide">Population</p>
                        <p class="text-lg font-bold text-gray-900">${population.toLocaleString()}</p>
                      </div>
                    </div>`;
              }

              if (areaKm2) {
                popupContent += `
                    <div class="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
                      <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span class="text-white text-lg">🗺️</span>
                      </div>
                      <div>
                        <p class="text-xs text-gray-500 font-semibold uppercase tracking-wide">Area</p>
                        <p class="text-lg font-bold text-gray-900">${areaKm2.toLocaleString()} km²</p>
                      </div>
                    </div>`;
              }

              // Add footer with region ID badge
              popupContent += `
                    <div class="pt-2 border-t border-gray-100">
                      <div class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-green-100 text-blue-800">
                        Region ID: ${regionId}
                      </div>
                    </div>
                  </div>
                </div>`;

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
      {/* Custom popup styles - injected globally */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .mapboxgl-popup-content {
            padding: 0 !important;
            border-radius: 12px !important;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
          }
          .mapboxgl-popup-tip {
            border-top-color: rgb(59, 130, 246) !important;
            border-bottom-color: rgb(59, 130, 246) !important;
          }
          .mapboxgl-popup-close-button {
            display: none !important;
          }
          /* Smooth map animations */
          .mapboxgl-canvas-container canvas {
            transition: filter 0.3s ease;
          }
        `
      }} />

      <div className="relative w-full h-full">
        {/* Map container */}
        <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" />

        {/* Premium loading state */}
        {!mapLoaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 rounded-lg">
            <div className="text-center">
              {/* Animated gradient spinner */}
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-green-600 animate-spin"></div>
                <div className="absolute inset-2 rounded-full bg-white"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl">🗺️</span>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Loading WorldSim</p>
              <p className="text-xs text-gray-500">Preparing interactive map...</p>
            </div>
          </div>
        )}

        {/* Enhanced error state */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border-2 border-red-200">
            <div className="text-center p-6 max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
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
              </div>
              <h3 className="text-lg font-bold text-red-900 mb-2">Map Error</h3>
              <p className="text-sm text-red-700 mb-4">{error}</p>
              {error.includes('token') && (
                <div className="mt-4 text-xs text-left bg-white p-4 rounded-lg border border-red-300 shadow-sm">
                  <p className="font-mono text-gray-700 mb-2">
                    Add to .env.local:
                  </p>
                  <code className="block bg-gray-100 px-3 py-2 rounded text-xs">
                    NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
                  </code>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
