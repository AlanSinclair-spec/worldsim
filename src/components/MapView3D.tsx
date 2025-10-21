'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxglImport from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { SimulationResponse } from '@/lib/types';

// Type workaround for mapbox-gl module export issues with TypeScript
// eslint-disable-next-line
const mapboxgl: any = mapboxglImport;

interface MapView3DProps {
  /** Optional callback when a region is clicked */
  onRegionClick?: (regionId: string, regionName: string) => void;
  /** Height of the map container (default: 600px) */
  height?: string;
  /** Simulation results to visualize on the map */
  simulationResults?: SimulationResponse | null;
}

/**
 * MapView3D Component - Premium Edition with 3D Terrain
 *
 * Professional data visualization with optional 3D terrain:
 * - Clean 2D mode (default) for professional data analysis
 * - Stunning 3D terrain mode for presentations and demos
 * - Smooth animated transitions between modes (800ms)
 * - All stress visualization features work in both modes
 * - Pitch and bearing controls with drag
 * - Reset view button
 * - 3D building extrusions for major cities
 * - Hillshade for depth and dimension
 *
 * 3D Features:
 * - Terrain exaggeration: 1.5x (visible but not extreme)
 * - Initial pitch: 45° (professional angled view)
 * - Hillshade for realistic depth
 * - 3D buildings in San Salvador and major cities
 * - Right-click drag to rotate and tilt
 *
 * @example
 * <MapView3D
 *   simulationResults={results}
 *   onRegionClick={(id, name) => console.log(id, name)}
 * />
 */
export function MapView3D({ onRegionClick, height = '600px', simulationResults }: MapView3DProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Record<string, unknown> | null>(null);
  const popup = useRef<Record<string, unknown> | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [is3DMode, setIs3DMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  /**
   * Calculate average stress per region from simulation results
   */
  const getRegionStress = useCallback((regionId: string): number => {
    if (!simulationResults) return 0;
    const regionResults = simulationResults.daily_results.filter(r => r.region_id === regionId);
    if (regionResults.length === 0) return 0;
    const totalStress = regionResults.reduce((sum, r) => sum + r.stress, 0);
    return totalStress / regionResults.length;
  }, [simulationResults]);

  /**
   * Get color based on stress level
   */
  const getStressColor = (stress: number): string => {
    if (stress < 0.15) return '#10b981'; // Green
    if (stress < 0.35) return '#f59e0b'; // Yellow/Amber
    if (stress < 0.60) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  /**
   * Toggle between 2D and 3D modes with smooth animation
   */
  const toggle3DMode = useCallback(() => {
    if (!map.current || isTransitioning) return;
    const mapInstance = map.current as any;

    setIsTransitioning(true);
    const newMode = !is3DMode;
    setIs3DMode(newMode);

    if (newMode) {
      // Switch to 3D mode
      mapInstance.easeTo({
        pitch: 50, // Angled view
        bearing: 0, // North-up
        duration: 800,
        essential: true
      });
    } else {
      // Switch to 2D mode
      mapInstance.easeTo({
        pitch: 0, // Flat
        bearing: 0, // North-up
        duration: 800,
        essential: true
      });
    }

    // Clear transitioning state after animation
    setTimeout(() => setIsTransitioning(false), 850);
  }, [is3DMode, isTransitioning]);

  /**
   * Reset view to default position
   */
  const resetView = useCallback(() => {
    if (!map.current) return;
    const mapInstance = map.current as any;

    mapInstance.fitBounds(
      [
        [-90.2, 13.0], // Southwest
        [-87.5, 14.45], // Northeast
      ],
      {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        pitch: is3DMode ? 50 : 0,
        bearing: 0,
        duration: 1200,
        essential: true,
      }
    );
  }, [is3DMode]);

  /**
   * Initialize Mapbox GL JS map with 3D capabilities
   */
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxToken) {
      setError('Mapbox token not configured. Please add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local file.');
      console.error('NEXT_PUBLIC_MAPBOX_TOKEN is missing');
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    try {
      // Initialize map with 3D capabilities
      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-88.9, 13.7],
        zoom: 8.2,
        pitch: 0, // Start in 2D (professional default)
        bearing: 0,
        minZoom: 7,
        maxZoom: 14,
        maxPitch: 85, // Allow steep angles for 3D
        maxBounds: [
          [-90.5, 12.8],
          [-87.0, 14.5],
        ],
        attributionControl: false,
        antialias: true, // Better rendering quality for 3D
      });
      map.current = mapInstance;

      // Enable right-click drag for pitch/bearing controls
      mapInstance.dragRotate.enable();
      mapInstance.touchZoomRotate.enableRotation();

      // Create popup
      popup.current = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: true,
        className: 'government-popup',
        maxWidth: '280px',
        offset: 12,
        focusAfterOpen: true,
      });

      mapInstance.on('load', () => {
        console.log('✅ Map loaded successfully with 3D support');
        setMapLoaded(true);
        setError(null);

        // Add 3D terrain source
        mapInstance.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.terrain-rgb',
          tileSize: 512,
          maxzoom: 14
        });

        // Set terrain (always loaded, visibility controlled by pitch)
        mapInstance.setTerrain({
          source: 'mapbox-dem',
          exaggeration: 1.5 // Makes elevation visible but not extreme
        });

        // Add hillshade for depth and dimension
        mapInstance.addLayer({
          id: 'hillshading',
          type: 'hillshade',
          source: 'mapbox-dem',
          layout: {
            visibility: 'visible'
          },
          paint: {
            'hillshade-exaggeration': 0.3,
            'hillshade-shadow-color': '#1e293b',
            'hillshade-highlight-color': '#f1f5f9',
            'hillshade-illumination-direction': 315
          }
        }, 'regions-fill'); // Add before regions so it doesn't cover data

        // Add sky layer for 3D atmosphere
        mapInstance.addLayer({
          id: 'sky',
          type: 'sky',
          paint: {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 90.0],
            'sky-atmosphere-sun-intensity': 15
          }
        });

        // Fit to El Salvador bounds
        mapInstance.fitBounds(
          [
            [-90.2, 13.0],
            [-87.5, 14.45],
          ],
          {
            padding: { top: 50, bottom: 50, left: 50, right: 50 },
            duration: 1500,
            essential: true,
          }
        );
      });

      mapInstance.on('error', (e: any) => {
        console.error('❌ Mapbox error:', e);
        const errorMsg = e.error?.message || 'Failed to load map';
        setError(`Map Error: ${errorMsg}. Check console for details.`);
      });

      // Map controls
      const nav = new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true, // Show pitch indicator for 3D
      });
      mapInstance.addControl(nav, 'top-right');

      const scale = new mapboxgl.ScaleControl({
        maxWidth: 120,
        unit: 'metric',
      });
      mapInstance.addControl(scale, 'bottom-left');

      const attribution = new mapboxgl.AttributionControl({
        compact: true,
        customAttribution: '© WorldSim | Government of El Salvador',
      });
      mapInstance.addControl(attribution, 'bottom-right');
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize map. Please refresh the page.');
    }

    return () => {
      (popup.current as any)?.remove();
      popup.current = null;
      (map.current as any)?.remove();
      map.current = null;
    };
  }, []);

  /**
   * Load regions GeoJSON and add styled layers
   */
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const mapInstance = map.current as any;

    fetch('/regions.json')
      .then(response => {
        if (!response.ok) throw new Error(`Failed to load regions.json: ${response.statusText}`);
        return response.json();
      })
      .then(geojson => {
        if (!mapInstance.getSource('regions')) {
          mapInstance.addSource('regions', {
            type: 'geojson',
            data: geojson,
            generateId: true,
          });

          // Region fill layer (renders on top of terrain)
          mapInstance.addLayer({
            id: 'regions-fill',
            type: 'fill',
            source: 'regions',
            paint: {
              'fill-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                '#2563eb',
                '#3b82f6',
              ],
              'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                0.45,
                0.25,
              ],
              'fill-opacity-transition': {
                duration: 300,
                delay: 0,
              },
            },
          });

          // Add 3D extrusion layer for regions (optional, subtle)
          mapInstance.addLayer({
            id: 'regions-3d-extrusion',
            type: 'fill-extrusion',
            source: 'regions',
            layout: {
              visibility: 'none' // Hidden by default, can be toggled
            },
            paint: {
              'fill-extrusion-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                '#2563eb',
                '#3b82f6',
              ],
              'fill-extrusion-height': 500, // Subtle elevation
              'fill-extrusion-base': 0,
              'fill-extrusion-opacity': 0.6
            }
          });

          // Region outlines
          mapInstance.addLayer({
            id: 'regions-outline',
            type: 'line',
            source: 'regions',
            paint: {
              'line-color': '#1e40af',
              'line-width': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                3,
                2,
              ],
              'line-opacity': 0.8,
              'line-width-transition': {
                duration: 300,
                delay: 0,
              },
            },
          });

          // Region labels
          mapInstance.addLayer({
            id: 'regions-labels',
            type: 'symbol',
            source: 'regions',
            layout: {
              'text-field': ['get', 'name'],
              'text-size': 12,
              'text-anchor': 'center',
              'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
              'text-letter-spacing': 0.05,
            },
            paint: {
              'text-color': '#1e3a8a',
              'text-halo-color': '#ffffff',
              'text-halo-width': 2,
              'text-halo-blur': 0.5,
              'text-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                1.0,
                0.9,
              ],
            },
          });

          // Add 3D buildings for major cities (San Salvador area)
          mapInstance.addLayer({
            id: '3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 10,
            layout: {
              visibility: 'none' // Show only in 3D mode
            },
            paint: {
              'fill-extrusion-color': '#cbd5e1',
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 0,
                12, ['get', 'height']
              ],
              'fill-extrusion-base': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 0,
                12, ['get', 'min_height']
              ],
              'fill-extrusion-opacity': 0.6
            }
          });

          let hoveredRegionId: string | number | null = null;

          // Hover effects
          mapInstance.on('mouseenter', 'regions-fill', (e: any) => {
            mapInstance.getCanvas().style.cursor = 'pointer';
            if (e.features && e.features.length > 0) {
              if (hoveredRegionId !== null) {
                mapInstance.setFeatureState(
                  { source: 'regions', id: hoveredRegionId },
                  { hover: false }
                );
              }
              hoveredRegionId = e.features[0].id!;
              mapInstance.setFeatureState(
                { source: 'regions', id: hoveredRegionId },
                { hover: true }
              );
            }
          });

          mapInstance.on('mouseleave', 'regions-fill', () => {
            mapInstance.getCanvas().style.cursor = '';
            if (hoveredRegionId !== null) {
              mapInstance.setFeatureState(
                { source: 'regions', id: hoveredRegionId },
                { hover: false }
              );
              hoveredRegionId = null;
            }
          });

          // Click handler with professional popup
          mapInstance.on('click', 'regions-fill', (e: any) => {
            if (e.features && e.features.length > 0) {
              const feature = e.features[0];
              const regionId = feature.properties?.id || '';
              const regionName = feature.properties?.name || 'Unknown Region';
              const regionNameEs = feature.properties?.nameEs || regionName;
              const population = feature.properties?.population;
              const areaKm2 = feature.properties?.areaKm2;

              const stress = getRegionStress(regionId);
              const hasStressData = simulationResults !== null && simulationResults !== undefined;
              const stressColor = getStressColor(stress);
              const stressPercentage = (stress * 100).toFixed(1);

              let headerGradient = 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)';
              if (hasStressData) {
                if (stress < 0.15) {
                  headerGradient = 'linear-gradient(135deg, #059669 0%, #10b981 100%)';
                } else if (stress < 0.35) {
                  headerGradient = 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)';
                } else if (stress < 0.60) {
                  headerGradient = 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)';
                } else {
                  headerGradient = 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)';
                }
              }

              let popupContent = `
                <div style="font-family: system-ui, -apple-system, sans-serif; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden; max-width: 280px;">
                  <div style="background: ${headerGradient}; padding: 16px; position: relative;">
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
                  <div style="padding: 16px;">`;

              if (hasStressData) {
                let stressLabel = 'Healthy';
                if (stress >= 0.60) stressLabel = 'Critical';
                else if (stress >= 0.35) stressLabel = 'Warning';
                else if (stress >= 0.15) stressLabel = 'Caution';

                popupContent += `
                    <div style="margin-bottom: 16px; padding: 12px; background: ${stressColor}15; border-left: 4px solid ${stressColor}; border-radius: 6px;">
                      <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 4px;">Infrastructure Stress</div>
                      <div style="font-size: 24px; font-weight: 700; color: ${stressColor};">${stressPercentage}%</div>
                      <div style="font-size: 12px; font-weight: 500; color: #6b7280; margin-top: 4px;">${stressLabel}</div>
                    </div>`;
              }

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

              popupContent += `
                    <div style="padding-top: 12px; border-top: 1px solid #e5e7eb;">
                      <div style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af;">Department ID: ${regionId}</div>
                    </div>
                  </div>
                </div>`;

              if (popup.current) {
                (popup.current as any)
                  .setLngLat(e.lngLat)
                  .setHTML(popupContent)
                  .addTo(mapInstance);
              }

              if (onRegionClick) {
                onRegionClick(regionId, regionName);
              }
            }
          });
        }
      })
      .catch(err => {
        console.error('Error loading regions.json:', err);
        setError(`Failed to load regions: ${err.message}`);
      });
  }, [mapLoaded, onRegionClick, getRegionStress, simulationResults]);

  /**
   * Update 3D buildings visibility based on mode
   */
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const mapInstance = map.current as any;

    if (mapInstance.getLayer('3d-buildings')) {
      mapInstance.setLayoutProperty(
        '3d-buildings',
        'visibility',
        is3DMode ? 'visible' : 'none'
      );
    }
  }, [is3DMode, mapLoaded]);

  /**
   * Update region colors when simulation results change
   */
  useEffect(() => {
    if (!map.current || !mapLoaded || !simulationResults) return;

    const mapInstance = map.current as any;
    if (!mapInstance.getSource('regions')) return;

    fetch('/regions.json')
      .then(response => response.json())
      .then(geojson => {
        geojson.features.forEach((feature: any) => {
          const regionId = feature.properties.id;
          const stress = getRegionStress(regionId);
          const color = getStressColor(stress);

          const features = mapInstance.querySourceFeatures('regions', {
            sourceLayer: undefined,
            filter: ['==', 'id', regionId]
          });

          if (features.length > 0 && features[0].id !== undefined) {
            mapInstance.setFeatureState(
              { source: 'regions', id: features[0].id },
              { stress, stressColor: color }
            );
          }
        });

        if (mapInstance.getLayer('regions-fill')) {
          mapInstance.setPaintProperty('regions-fill', 'fill-color', [
            'case',
            ['!=', ['feature-state', 'stressColor'], null],
            ['feature-state', 'stressColor'],
            [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              '#2563eb',
              '#3b82f6',
            ]
          ]);
        }

        console.log('✅ Region colors updated (works in 2D and 3D modes)');
      })
      .catch(err => {
        console.error('Error updating region colors:', err);
      });
  }, [simulationResults, mapLoaded, getRegionStress]);

  return (
    <div className="relative w-full" style={{ height }}>
      {/* Professional popup and map styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
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
          .mapboxgl-ctrl button {
            transition: all 0.2s ease;
          }
          .mapboxgl-ctrl button:hover {
            background-color: rgba(59, 130, 246, 0.1) !important;
          }
          .mapboxgl-ctrl-scale {
            background-color: rgba(255, 255, 255, 0.95) !important;
            border: 1px solid rgba(30, 64, 175, 0.2) !important;
            border-radius: 4px !important;
            padding: 2px 6px !important;
            font-size: 11px !important;
            font-weight: 500 !important;
            color: #1e40af !important;
          }
          .mapboxgl-canvas-container canvas {
            transition: filter 0.3s ease;
          }
        `
      }} />

      <div className="relative w-full h-full">
        {/* Map container */}
        <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" />

        {/* 2D/3D Toggle Button - Top Right (below nav controls) */}
        {mapLoaded && (
          <div className="absolute top-24 right-4 z-10">
            <button
              onClick={toggle3DMode}
              disabled={isTransitioning}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold text-sm shadow-lg transition-all duration-200 transform ${
                isTransitioning
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:scale-105 active:scale-95'
              } ${
                is3DMode
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-300'
              }`}
              aria-label={is3DMode ? 'Switch to 2D mode' : 'Switch to 3D mode'}
            >
              <span className="text-lg">{is3DMode ? '🏔️' : '🗺️'}</span>
              <span>{is3DMode ? '3D Mode' : '2D Mode'}</span>
            </button>
          </div>
        )}

        {/* Reset View Button - Below 2D/3D toggle */}
        {mapLoaded && (
          <div className="absolute top-40 right-4 z-10">
            <button
              onClick={resetView}
              className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg font-semibold text-sm text-gray-700 shadow-lg hover:bg-gray-50 border-2 border-gray-300 transition-all duration-200 transform hover:scale-105 active:scale-95"
              aria-label="Reset view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Reset</span>
            </button>
          </div>
        )}

        {/* Mode Indicator - Top Center */}
        {mapLoaded && (
          <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full text-xs font-bold shadow-lg transition-all duration-800 ${
            is3DMode
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
              : 'bg-white/90 text-gray-700 border border-gray-300'
          }`}>
            {is3DMode ? '3D Terrain Mode' : '2D Professional Mode'}
          </div>
        )}

        {/* Stress Level Legend */}
        {simulationResults && (
          <div className="absolute bottom-16 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-4 max-w-[200px]">
            <h4 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">
              Infrastructure Stress
            </h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded" style={{ backgroundColor: '#10b981' }}></div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-800">Healthy</div>
                  <div className="text-xs text-gray-500">0-15%</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-800">Caution</div>
                  <div className="text-xs text-gray-500">15-35%</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded" style={{ backgroundColor: '#f97316' }}></div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-800">Warning</div>
                  <div className="text-xs text-gray-500">35-60%</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded" style={{ backgroundColor: '#ef4444' }}></div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-800">Critical</div>
                  <div className="text-xs text-gray-500">60-100%</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {!mapLoaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 rounded-lg">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-green-600 animate-spin"></div>
                <div className="absolute inset-2 rounded-full bg-white"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl">🏔️</span>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Loading 3D WorldSim</p>
              <p className="text-xs text-gray-500">Preparing terrain and map data...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border-2 border-red-200">
            <div className="text-center p-6 max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-red-900 mb-2">Map Error</h3>
              <p className="text-sm text-red-700 mb-4">{error}</p>
              {error.includes('token') && (
                <div className="mt-4 text-xs text-left bg-white p-4 rounded-lg border border-red-300 shadow-sm">
                  <p className="font-mono text-gray-700 mb-2">Add to .env.local:</p>
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
