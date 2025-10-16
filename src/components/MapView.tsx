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
 * MapView Component - Professional Government Edition
 *
 * Enterprise-grade interactive map displaying El Salvador's administrative divisions.
 *
 * Features:
 * - Clean, professional base map style
 * - Authoritative blue color scheme
 * - Custom government-style popups
 * - Professional map controls (navigation, scale bar)
 * - Smooth animations and transitions (300ms)
 * - Optimized bounds to perfectly fit El Salvador
 * - WCAG AA compliant contrast ratios
 * - Keyboard accessible
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
      // Initialize map with professional government styling
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11', // Clean, professional base
        center: [-88.9, 13.7], // El Salvador center
        zoom: 8.2,
        pitch: 0, // Flat view - professional standard
        bearing: 0, // North-up orientation
        minZoom: 7,
        maxZoom: 14,
        maxBounds: [
          [-90.5, 12.8], // Southwest bound
          [-87.0, 14.5], // Northeast bound
        ],
        attributionControl: false, // Will add custom attribution
      });

      // Create professional government-style popup
      popup.current = new mapboxgl.Popup({
        closeButton: false, // Custom close button
        closeOnClick: true,
        className: 'government-popup',
        maxWidth: '280px',
        offset: 12,
        focusAfterOpen: true, // Accessibility
      });

      map.current.on('load', () => {
        console.log('✅ Map loaded successfully');
        setMapLoaded(true);
        setError(null);

        // Fit to El Salvador bounds with smooth animation
        if (map.current) {
          map.current.fitBounds(
            [
              [-90.2, 13.0], // Southwest
              [-87.5, 14.45], // Northeast
            ],
            {
              padding: { top: 50, bottom: 50, left: 50, right: 50 },
              duration: 1500, // Smooth 1.5s animation
              essential: true,
            }
          );
        }
      });

      map.current.on('error', (e) => {
        console.error('❌ Mapbox error:', e);
        console.error('Error details:', {
          error: e.error,
          message: e.error?.message,
          status: e.error?.status,
        });

        const errorMsg = e.error?.message || 'Failed to load map';
        setError(`Map Error: ${errorMsg}. Check console for details.`);
      });

      // Add additional logging
      console.log('🗺️ Initializing Mapbox with token:', mapboxToken?.substring(0, 20) + '...');

      // Professional map controls

      // Navigation control (zoom + compass) - top right
      const nav = new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: false, // Disabled for flat view
      });
      map.current.addControl(nav, 'top-right');

      // Scale bar - bottom left (metric units)
      const scale = new mapboxgl.ScaleControl({
        maxWidth: 120,
        unit: 'metric',
      });
      map.current.addControl(scale, 'bottom-left');

      // Professional attribution - bottom right
      const attribution = new mapboxgl.AttributionControl({
        compact: true,
        customAttribution: '© WorldSim | Government of El Salvador',
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

          // Professional government blue fill layer
          mapInstance.addLayer({
            id: 'regions-fill',
            type: 'fill',
            source: 'regions',
            paint: {
              'fill-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                '#2563eb', // Hover: darker professional blue
                '#3b82f6', // Default: professional blue
              ],
              'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                0.45, // Hover: medium opacity for visibility
                0.25, // Default: subtle, professional
              ],
              'fill-opacity-transition': {
                duration: 300,
                delay: 0,
              },
            },
          });

          // Professional border/outline layer
          mapInstance.addLayer({
            id: 'regions-outline',
            type: 'line',
            source: 'regions',
            paint: {
              'line-color': '#1e40af', // Dark professional blue
              'line-width': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                3, // Thicker on hover
                2, // Standard width
              ],
              'line-opacity': 0.8,
              'line-width-transition': {
                duration: 300,
                delay: 0,
              },
            },
          });

          // Professional labels - clean, authoritative typography
          mapInstance.addLayer({
            id: 'regions-labels',
            type: 'symbol',
            source: 'regions',
            layout: {
              'text-field': ['get', 'name'],
              'text-size': 12,
              'text-anchor': 'center',
              'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
              'text-letter-spacing': 0.05, // Professional spacing
            },
            paint: {
              'text-color': '#1e3a8a', // Deep professional blue
              'text-halo-color': '#ffffff',
              'text-halo-width': 2,
              'text-halo-blur': 0.5,
              'text-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                1.0, // Full opacity on hover
                0.9, // Slight transparency default
              ],
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

          // Click handler: show professional government-style popup
          mapInstance.on('click', 'regions-fill', (e) => {
            if (e.features && e.features.length > 0) {
              const feature = e.features[0];
              const regionId = feature.properties?.id || '';
              const regionName = feature.properties?.name || 'Unknown Region';
              const regionNameEs = feature.properties?.nameEs || regionName;
              const population = feature.properties?.population;
              const areaKm2 = feature.properties?.areaKm2;

              // Professional government-style popup with clean design
              let popupContent = `
                <div style="font-family: system-ui, -apple-system, sans-serif; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden; max-width: 280px;">
                  <!-- Professional header -->
                  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 16px; position: relative;">
                    <button
                      onclick="this.closest('.mapboxgl-popup').remove()"
                      style="position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.2); border: none; border-radius: 6px; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s;"
                      onmouseover="this.style.background='rgba(255,255,255,0.3)'"
                      onmouseout="this.style.background='rgba(255,255,255,0.2)'"
                      aria-label="Close">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" stroke-width="2" stroke-linecap="round">
                        <path d="M1 1L13 13M1 13L13 1"/>
                      </svg>
                    </button>
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: white; padding-right: 32px;">${regionName}</h3>`;

              if (regionNameEs && regionNameEs !== regionName) {
                popupContent += `<p style="margin: 4px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.9);">${regionNameEs}</p>`;
              }

              popupContent += `
                  </div>

                  <!-- Clean stats section -->
                  <div style="padding: 16px;">`;

              if (population) {
                popupContent += `
                    <div style="margin-bottom: 12px;">
                      <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 4px;">Population</div>
                      <div style="font-size: 20px; font-weight: 600; color: #111827;">${population.toLocaleString()}</div>
                    </div>`;
              }

              if (areaKm2) {
                popupContent += `
                    <div style="margin-bottom: 12px;">
                      <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 4px;">Area</div>
                      <div style="font-size: 20px; font-weight: 600; color: #111827;">${areaKm2.toLocaleString()} km²</div>
                    </div>`;
              }

              // Professional footer
              popupContent += `
                    <div style="padding-top: 12px; border-top: 1px solid #e5e7eb;">
                      <div style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af;">Department ID: ${regionId}</div>
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

              console.log('Department clicked:', regionId, regionName);
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
      {/* Professional government popup styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Professional popup styling */
          .mapboxgl-popup-content {
            padding: 0 !important;
            border-radius: 12px !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
            background: white !important;
          }
          .mapboxgl-popup-tip {
            border-top-color: #1e40af !important;
            border-bottom-color: #1e40af !important;
          }
          .mapboxgl-popup-close-button {
            display: none !important;
          }

          /* Professional map controls styling */
          .mapboxgl-ctrl button {
            transition: all 0.2s ease;
          }
          .mapboxgl-ctrl button:hover {
            background-color: rgba(59, 130, 246, 0.1) !important;
          }

          /* Professional scale bar */
          .mapboxgl-ctrl-scale {
            background-color: rgba(255, 255, 255, 0.95) !important;
            border: 1px solid rgba(30, 64, 175, 0.2) !important;
            border-radius: 4px !important;
            padding: 2px 6px !important;
            font-size: 11px !important;
            font-weight: 500 !important;
            color: #1e40af !important;
          }

          /* Smooth animations */
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
