'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { SimulationResponse } from '@/lib/types';
import { SkeletonLoader } from './SkeletonLoader';
import { LoadingSpinner } from './LoadingSpinner';

// Type-safe interfaces for mapbox-gl (provides type safety without relying on @types/mapbox-gl)
// This is safer than using 'any' while being compatible with the actual mapbox-gl library
interface MapboxMap {
  on(event: string, callback: (e: unknown) => void): void;
  on(event: string, layer: string, callback: (e: MapboxMapLayerMouseEvent) => void): void;
  remove(): void;
  setTerrain(options: { source: string; exaggeration: number } | null): void;
  setLayoutProperty(layer: string, property: string, value: string): void;
  easeTo(options: { pitch: number; bearing: number; duration: number; easing?: (t: number) => number }): void;
  fitBounds(
    bounds: [[number, number], [number, number]],
    options?: { padding: { top: number; bottom: number; left: number; right: number }; duration: number; essential: boolean; pitch?: number; bearing?: number }
  ): void;
  getCanvas(): HTMLCanvasElement;
  getSource(id: string): unknown;
  addSource(id: string, source: unknown): void;
  addLayer(layer: unknown): void;
  setFeatureState(feature: { source: string; id: string | number }, state: { hover: boolean }): void;
}

interface MapboxPopup {
  setLngLat(lngLat: { lng: number; lat: number }): MapboxPopup;
  setHTML(html: string): MapboxPopup;
  addTo(map: MapboxMap): MapboxPopup;
  remove(): void;
}

interface MapboxMapLayerMouseEvent {
  lngLat: { lng: number; lat: number };
  features?: Array<{
    id?: string | number;
    properties?: Record<string, unknown>;
  }>;
}

interface MapboxErrorEvent {
  error?: {
    message?: string;
    status?: number;
  };
}

interface MapViewProps {
  /** Optional callback when a region is clicked */
  onRegionClick?: (regionId: string, regionName: string) => void;
  /** Height of the map container (default: 600px) */
  height?: string;
  /** Simulation results to visualize on the map */
  simulationResults?: SimulationResponse | null;
  /** Type of visualization (energy, water, agriculture stress, economics, compare, or trends) */
  visualizationType?: 'energy' | 'water' | 'agriculture' | 'economics' | 'compare' | 'trends';
}

/**
 * MapView Component - Professional Government Edition with Stress Visualization
 *
 * Enterprise-grade interactive map displaying El Salvador's administrative divisions
 * with real-time infrastructure stress visualization.
 *
 * Features:
 * - Clean, professional base map style
 * - Dynamic stress-based region coloring (green → yellow → orange → red)
 * - Interactive popups showing stress levels and region data
 * - Custom government-style popups with color-coded headers
 * - Professional map controls (navigation, scale bar)
 * - Smooth animations and transitions (300ms)
 * - Optimized bounds to perfectly fit El Salvador
 * - WCAG AA compliant contrast ratios
 * - Keyboard accessible
 *
 * Stress Color Scale:
 * - Green (#10b981): 0-15% stress (Healthy)
 * - Yellow (#f59e0b): 15-35% stress (Caution)
 * - Orange (#f97316): 35-60% stress (Warning)
 * - Red (#ef4444): 60-100% stress (Critical)
 *
 * @example
 * <MapView
 *   onRegionClick={(id, name) => console.log(id, name)}
 *   simulationResults={results}
 * />
 */
function MapViewComponent({ onRegionClick, height = '600px', simulationResults, visualizationType = 'energy' }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<MapboxMap | null>(null);
  const popup = useRef<MapboxPopup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [is3DMode, setIs3DMode] = useState(true); // Start in 3D mode by default
  const isInitialMount = useRef(true); // Track initial mount to avoid duplicate terrain application

  // Load 3D preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved3DMode = localStorage.getItem('worldsim-map-3d-mode');
      if (saved3DMode === 'false') {
        setIs3DMode(false); // Only override if explicitly set to false
      }
    }
  }, []);

  /**
   * Toggle between 2D and 3D view with smooth animation
   */
  const toggle3DMode = useCallback(() => {
    if (!map.current || !mapLoaded) return;

    const newMode = !is3DMode;

    setIs3DMode(newMode);
    localStorage.setItem('worldsim-map-3d-mode', String(newMode));

    if (newMode) {
      // Switch to 3D: enable terrain, tilt camera
      map.current.setTerrain({
        source: 'mapbox-dem',
        exaggeration: 1.5 // Dramatic terrain relief
      });
      map.current.easeTo({
        pitch: 60, // Tilted view for 3D perspective
        bearing: 0, // Front-facing view
        duration: 1000, // Smoother transition
        easing: (t: number) => t * (2 - t), // ease-in-out
      });
    } else {
      // Switch to 2D: remove terrain, flatten camera
      map.current.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 1000, // Smoother transition
        easing: (t: number) => t * (2 - t),
      });
      // Disable terrain after animation completes
      setTimeout(() => {
        if (map.current) {
          map.current.setTerrain(null);
        }
      }, 1000); // Match animation duration
    }
  }, [is3DMode, mapLoaded]);

  /**
   * Reset camera to default view
   */
  const resetView = useCallback(() => {
    if (!map.current || !mapLoaded) return;

    map.current.fitBounds(
      [
        [-90.2, 13.0], // Southwest
        [-87.5, 14.45], // Northeast
      ],
      {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        duration: 1000,
        essential: true,
        pitch: is3DMode ? 60 : 0,
        bearing: 0,
      }
    );
  }, [mapLoaded, is3DMode]);

  // Apply 3D mode when toggled (skip initial mount since terrain is applied in style.load)
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Skip initial mount - terrain is already applied in style.load
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Apply 3D mode when toggled by user
    if (is3DMode) {
      map.current.setTerrain({
        source: 'mapbox-dem',
        exaggeration: 1.5
      });
      map.current.easeTo({
        pitch: 60,
        bearing: 0,
        duration: 1000, // Smoother transition
        easing: (t: number) => t * (2 - t),
      });
    }
  }, [mapLoaded, is3DMode]);

  /**
   * Calculate average stress per region from simulation results
   * Wrapped in useCallback to prevent unnecessary re-renders
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
   * - 0.0-0.15: Green (healthy)
   * - 0.15-0.35: Yellow (caution)
   * - 0.35-0.60: Orange (warning)
   * - 0.60-1.0: Red (critical)
   */
  const getStressColor = (stress: number): string => {
    if (stress < 0.15) return '#10b981'; // Green
    if (stress < 0.35) return '#f59e0b'; // Yellow/Amber
    if (stress < 0.60) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

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

    (mapboxgl as unknown as { accessToken: string }).accessToken = mapboxToken;

    try {
      // Initialize map with Mapbox Standard 3D style (global basemap with terrain, buildings, landmarks, trees)
      const mapInstance = new (mapboxgl as unknown as { Map: new (options: unknown) => MapboxMap }).Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/standard', // Mapbox Standard 3D style with built-in terrain
        center: [-88.8965, 13.7942], // El Salvador center (precise coordinates)
        zoom: 8,
        pitch: 60, // Start in 3D view with terrain
        bearing: 0, // Slight rotation for better 3D perspective
        minZoom: 7,
        maxZoom: 16, // Higher max zoom for Standard style
        maxBounds: [
          [-90.5, 12.8], // Southwest bound
          [-87.0, 14.5], // Northeast bound
        ],
        attributionControl: false, // Will add custom attribution
        antialias: true, // Enable antialiasing for smoother 3D rendering
      });
      map.current = mapInstance;

      // Create professional government-style popup with responsive max-width
      popup.current = new (mapboxgl as unknown as { Popup: new (options: unknown) => MapboxPopup }).Popup({
        closeButton: false, // Custom close button
        closeOnClick: true,
        className: 'government-popup',
        maxWidth: '90vw', // Responsive: 90% of viewport width max
        offset: [0, -10],
        focusAfterOpen: true, // Accessibility
      });

      mapInstance.on('style.load', () => {
        console.log('✅ Mapbox Standard style loaded successfully (3D terrain, buildings, landmarks enabled)');
        setMapLoaded(true);
        setError(null);

        // Mapbox Standard style has built-in terrain! Just enable it with exaggeration
        // The Standard style includes 'mapbox-dem' source automatically
        mapInstance.setTerrain({
          source: 'mapbox-dem',
          exaggeration: 1.5 // Enhance terrain relief for dramatic 3D effect
        });

        // Note: Mapbox Standard style handles sky/atmosphere automatically
        // No need to manually control sky layer visibility

        // Fit to El Salvador bounds with smooth animation (maintaining 3D view)
        mapInstance.fitBounds(
          [
            [-90.2, 13.0], // Southwest
            [-87.5, 14.45], // Northeast
          ],
          {
            padding: { top: 50, bottom: 50, left: 50, right: 50 },
            duration: 1500, // Smooth 1.5s animation
            essential: true,
            pitch: 60, // Maintain 3D pitch
            bearing: 0, // Front-facing view
          }
        );
      });

      mapInstance.on('error', (e: unknown) => {
        const errorEvent = e as MapboxErrorEvent;
        console.error('❌ Mapbox error:', errorEvent);
        console.error('Error details:', {
          error: errorEvent.error,
          message: errorEvent.error?.message,
          status: errorEvent.error?.status,
        });

        const errorMsg = errorEvent.error?.message || 'Failed to load map';
        setError(`Map Error: ${errorMsg}. Check console for details.`);
      });

      // Add additional logging
      console.log('🗺️ Initializing Mapbox with token:', mapboxToken?.substring(0, 20) + '...');

      // Professional map controls

      // Navigation control (zoom + compass) - top right
      const nav = new (mapboxgl as unknown as { NavigationControl: new (options: unknown) => unknown }).NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: false, // Disabled for flat view
      });
      (mapInstance as unknown as { addControl: (control: unknown, position: string) => void }).addControl(nav, 'top-right');

      // Scale bar - bottom left (metric units)
      const scale = new (mapboxgl as unknown as { ScaleControl: new (options: unknown) => unknown }).ScaleControl({
        maxWidth: 120,
        unit: 'metric',
      });
      (mapInstance as unknown as { addControl: (control: unknown, position: string) => void }).addControl(scale, 'bottom-left');

      // Professional attribution - bottom right
      const attribution = new (mapboxgl as unknown as { AttributionControl: new (options: unknown) => unknown }).AttributionControl({
        compact: true,
        customAttribution: '© WorldSim | Government of El Salvador',
      });
      (mapInstance as unknown as { addControl: (control: unknown, position: string) => void }).addControl(attribution, 'bottom-right');
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize map. Please refresh the page.');
    }

    // Cleanup on unmount to prevent memory leaks
    return () => {
      // Cleanup popup
      if (popup.current) {
        popup.current.remove();
        popup.current = null;
      }

      // Cleanup map
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Empty dependency array - only run once

  /**
   * Load regions GeoJSON and add premium styled map layers
   */
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

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
        if (!map.current) return;

        if (!map.current.getSource('regions')) {
          map.current.addSource('regions', {
            type: 'geojson',
            data: geojson,
            generateId: true, // Generate IDs for features to enable feature-state
          });

          // Professional color palette - softer, more executive-grade colors
          map.current.addLayer({
            id: 'regions-fill',
            type: 'fill',
            source: 'regions',
            paint: {
              'fill-color': [
                'match',
                ['get', 'NAM'], // Use department name from official data
                'San Salvador', '#3B82F6',    // Blue
                'La Libertad', '#10B981',     // Emerald
                'Santa Ana', '#F59E0B',       // Amber
                'Chalatenango', '#6366F1',    // Indigo
                'Sonsonate', '#8B5CF6',       // Purple
                'La Paz', '#EC4899',          // Pink
                'Usulutan', '#14B8A6',        // Teal
                'San Miguel', '#EF4444',      // Red
                'Morazan', '#F97316',         // Orange
                'La Union', '#06B6D4',        // Cyan
                'Cuscatlan', '#A855F7',       // Violet
                'Cabañas', '#84CC16',         // Lime
                'Ahuachapan', '#22C55E',      // Green
                'San Vicente', '#EAB308',     // Yellow
                '#94a3b8' // Default gray for any unmapped regions
              ],
              'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                0.7, // Hover: more opaque
                0.5, // Default: softer, professional look
              ],
              'fill-opacity-transition': {
                duration: 500, // Smoother transitions
                delay: 0,
              },
              // Glow effect for stressed regions
              'fill-outline-color': [
                'case',
                ['>=', ['get', 'stress'], 0.8],
                '#ef4444', // Red glow for critical regions
                ['>=', ['get', 'stress'], 0.6],
                '#f97316', // Orange glow for high stress
                ['>=', ['get', 'stress'], 0.3],
                '#f59e0b', // Amber glow for moderate stress
                '#10b981' // Green glow for low stress
              ],
            },
          });

          // Pulsing animation layer for critical regions (stress > 0.8)
          // This creates a breathing effect to draw attention to critical areas
          map.current.addLayer({
            id: 'regions-pulse',
            type: 'fill',
            source: 'regions',
            paint: {
              'fill-color': '#ef4444', // Red color for critical regions
              'fill-opacity': [
                'case',
                ['>=', ['get', 'stress'], 0.8],
                [
                  'interpolate',
                  ['linear'],
                  ['%', ['/', ['+', ['get', 't'], 0], 2000], 1], // 2-second pulse cycle
                  0, 0.1,  // Start at low opacity
                  0.5, 0.4, // Peak at higher opacity
                  1, 0.1   // Return to low opacity
                ],
                0 // No pulse for non-critical regions
              ],
            },
          });

          // Professional border/outline layer - subtle and clean
          map.current.addLayer({
            id: 'regions-outline',
            type: 'line',
            source: 'regions',
            paint: {
              'line-color': '#ffffff', // White borders for clear separation
              'line-width': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                2.5, // Slightly thicker on hover
                1, // Thin, professional borders
              ],
              'line-opacity': 0.8, // Slightly more subtle
              'line-width-transition': {
                duration: 500, // Smooth transition
                delay: 0,
              },
            },
          });

          // Professional labels - executive-grade typography with shadow
          map.current.addLayer({
            id: 'regions-labels',
            type: 'symbol',
            source: 'regions',
            layout: {
              'text-field': ['get', 'NAM'], // Use NAM field from official El Salvador GeoJSON
              'text-size': [
                'interpolate', ['linear'], ['zoom'],
                7, 11,   // Smaller at low zoom
                9, 14,   // Larger as you zoom in
                12, 16   // Largest at high zoom
              ],
              'text-anchor': 'center',
              'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
              'text-letter-spacing': 0.08, // More spacing for readability
              'text-transform': 'uppercase', // Professional government style
            },
            paint: {
              'text-color': '#ffffff', // White text
              'text-halo-color': 'rgba(0, 0, 0, 0.8)', // Dark shadow for readability
              'text-halo-width': 3,
              'text-halo-blur': 1,
              'text-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                1.0, // Full opacity on hover
                0.9, // Slightly transparent by default
              ],
              'text-opacity-transition': {
                duration: 500,
                delay: 0,
              },
            },
          });

          let hoveredRegionId: string | number | null = null;

          // Hover effect: darken region and outline on mouse enter
          map.current.on('mouseenter', 'regions-fill', (e: MapboxMapLayerMouseEvent) => {
            if (!map.current) return;

            // Change cursor to pointer
            map.current.getCanvas().style.cursor = 'pointer';

            if (e.features && e.features.length > 0) {
              // Remove previous hover state
              if (hoveredRegionId !== null) {
                map.current.setFeatureState(
                  { source: 'regions', id: hoveredRegionId },
                  { hover: false }
                );
              }

              // Set new hover state
              hoveredRegionId = e.features[0].id!;
              map.current.setFeatureState(
                { source: 'regions', id: hoveredRegionId },
                { hover: true }
              );
            }
          });

          // Hover effect: remove highlight on mouse leave
          map.current.on('mouseleave', 'regions-fill', () => {
            if (!map.current) return;

            // Reset cursor
            map.current.getCanvas().style.cursor = '';

            // Remove hover state
            if (hoveredRegionId !== null) {
              map.current.setFeatureState(
                { source: 'regions', id: hoveredRegionId },
                { hover: false }
              );
              hoveredRegionId = null;
            }
          });

          // Click handler: show professional government-style popup
          map.current.on('click', 'regions-fill', (e: MapboxMapLayerMouseEvent) => {
            if (!map.current) return;

            if (e.features && e.features.length > 0) {
              const feature = e.features[0];
              const regionId = String(feature.properties?.id || '');
              const regionName = String(feature.properties?.name || 'Unknown Region');
              const regionNameEs = String(feature.properties?.nameEs || regionName);
              const population = feature.properties?.population as number | undefined;
              const areaKm2 = feature.properties?.areaKm2 as number | undefined;

              // Get stress data if available
              const stress = getRegionStress(regionId);
              const hasStressData = simulationResults !== null && simulationResults !== undefined;
              const stressColor = getStressColor(stress);
              const stressPercentage = (stress * 100).toFixed(1);

              // Determine header gradient based on stress
              let headerGradient = 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)'; // Default blue
              if (hasStressData) {
                if (stress < 0.15) {
                  headerGradient = 'linear-gradient(135deg, #059669 0%, #10b981 100%)'; // Green
                } else if (stress < 0.35) {
                  headerGradient = 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)'; // Amber
                } else if (stress < 0.60) {
                  headerGradient = 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)'; // Orange
                } else {
                  headerGradient = 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'; // Red
                }
              }

              // Professional government-style popup with clean design
              let popupContent = `
                <div style="font-family: system-ui, -apple-system, sans-serif; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden; max-width: 280px;">
                  <!-- Professional header -->
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

                  <!-- Clean stats section -->
                  <div style="padding: 16px;">`;

              // Show stress data if available (priority #1)
              if (hasStressData) {
                let stressLabel = 'Healthy';
                let stressTitle = 'Infrastructure Stress';

                // Agriculture uses different thresholds and labels
                if (visualizationType === 'agriculture') {
                  stressTitle = 'Crop Stress';
                  if (stress >= 0.80) stressLabel = 'Critical';
                  else if (stress >= 0.60) stressLabel = 'High Stress';
                  else if (stress >= 0.30) stressLabel = 'Moderate';
                  else stressLabel = 'Low';
                } else {
                  // Energy/Water thresholds
                  if (stress >= 0.60) stressLabel = 'Critical';
                  else if (stress >= 0.35) stressLabel = 'Warning';
                  else if (stress >= 0.15) stressLabel = 'Caution';
                }

                popupContent += `
                    <div style="margin-bottom: 16px; padding: 12px; background: ${stressColor}15; border-left: 4px solid ${stressColor}; border-radius: 6px;">
                      <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 4px;">${stressTitle}</div>
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

              // Action buttons
              if (hasStressData && stress >= 0.6) {
                popupContent += `
                    <div style="margin-top: 16px; display: flex; gap: 8px;">
                      <button
                        onclick="window.dispatchEvent(new CustomEvent('map-zoom-to-region', { detail: { regionId: '${regionId}', regionName: '${regionName}' }}))"
                        style="flex: 1; padding: 10px 14px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(59, 130, 246, 0.4)'"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(59, 130, 246, 0.3)'">
                        🔍 Zoom Here
                      </button>
                      <button
                        onclick="window.dispatchEvent(new CustomEvent('map-view-details', { detail: { regionId: '${regionId}', regionName: '${regionName}', stress: ${stress} }}))"
                        style="flex: 1; padding: 10px 14px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(16, 185, 129, 0.4)'"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(16, 185, 129, 0.3)'">
                        📊 Details
                      </button>
                    </div>`;
              }

              // Professional footer
              popupContent += `
                    <div style="padding-top: 12px; border-top: 1px solid #e5e7eb; margin-top: 12px;">
                      <div style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af;">Department ID: ${regionId}</div>
                    </div>
                  </div>
                </div>`;

              // Show popup at click location
              if (popup.current && map.current) {
                popup.current
                  .setLngLat(e.lngLat)
                  .setHTML(popupContent)
                  .addTo(map.current);
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
  }, [mapLoaded, onRegionClick, getRegionStress, simulationResults]);

  /**
   * Add strategic location markers (ports, airports, capital cities)
   */
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Strategic locations in El Salvador
    const strategicLocations = {
      type: 'FeatureCollection',
      features: [
        // Capital
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-89.2182, 13.6929] },
          properties: { name: 'San Salvador', type: 'capital', icon: '🏛️', description: 'Capital City' }
        },
        // Major Ports
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-87.8333, 13.3333] },
          properties: { name: 'La Unión', type: 'port', icon: '⚓', description: 'Pacific Port' }
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-89.8333, 13.4833] },
          properties: { name: 'Acajutla', type: 'port', icon: '⚓', description: 'Major Cargo Port' }
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-89.5500, 13.4833] },
          properties: { name: 'La Libertad', type: 'port', icon: '⚓', description: 'Fishing Port' }
        },
        // Airport
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-89.0557, 13.4409] },
          properties: { name: 'El Salvador Int\'l Airport', type: 'airport', icon: '✈️', description: 'San Salvador' }
        },
        // Other major cities
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-89.5597, 13.9794] },
          properties: { name: 'Santa Ana', type: 'city', icon: '🏙️', description: 'Second Largest City' }
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-88.1833, 13.4833] },
          properties: { name: 'San Miguel', type: 'city', icon: '🏙️', description: 'Third Largest City' }
        },
      ]
    };

    // Add source for strategic locations
    if (!map.current.getSource('strategic-locations')) {
      map.current.addSource('strategic-locations', {
        type: 'geojson',
        data: strategicLocations
      });

      // Add icon layer
      map.current.addLayer({
        id: 'strategic-icons',
        type: 'symbol',
        source: 'strategic-locations',
        layout: {
          'text-field': ['get', 'icon'],
          'text-size': 18,
          'text-anchor': 'center',
          'text-offset': [0, 0],
          'text-allow-overlap': true, // Show even if crowded
        },
        paint: {
          'text-opacity': 0.8,
        }
      });

      // Add label layer
      map.current.addLayer({
        id: 'strategic-labels',
        type: 'symbol',
        source: 'strategic-locations',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 10,
          'text-anchor': 'top',
          'text-offset': [0, 1.2],
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
        },
        paint: {
          'text-color': '#1f2937',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2,
          'text-opacity': 0.7,
        }
      });
    }
  }, [mapLoaded]);

  /**
   * Note: Region colors are now fixed by department name
   * Simulation results are shown in popups and the legend,
   * but colors remain distinct per department for easy identification
   */
  // Removed dynamic color changing based on simulation results
  // Each department keeps its unique color for visual distinction

  /**
   * Handle zoom-to-region custom events from popup buttons
   */
  useEffect(() => {
    const handleZoomToRegion = async (event: any) => {
      if (!map.current) return;

      const { regionId, regionName } = event.detail;
      console.log('Zooming to region:', regionName);

      // Fetch region GeoJSON to get bounds
      try {
        const response = await fetch('/regions.json');
        const geojson = await response.json();
        const feature = geojson.features.find(
          (f: any) => f.properties.id === regionId || f.properties.NAM === regionName
        );

        if (feature && feature.geometry) {
          // Calculate bounds from geometry
          const coordinates = feature.geometry.coordinates[0];
          const bounds = new (mapboxgl as any).LngLatBounds();

          coordinates.forEach((coord: any) => {
            bounds.extend(coord);
          });

          // Animate zoom to region with padding
          map.current.fitBounds(bounds, {
            padding: { top: 50, bottom: 50, left: 50, right: 50 },
            duration: 1500,
            essential: true,
          });
        }
      } catch (error) {
        console.error('Error zooming to region:', error);
      }
    };

    const handleViewDetails = (event: any) => {
      const { regionId, regionName, stress } = event.detail;
      console.log('View details for region:', regionId, regionName, 'Stress:', stress);
      // This could trigger a modal or side panel in the future
      // For now, just log the action
    };

    window.addEventListener('map-zoom-to-region', handleZoomToRegion);
    window.addEventListener('map-view-details', handleViewDetails);

    return () => {
      window.removeEventListener('map-zoom-to-region', handleZoomToRegion);
      window.removeEventListener('map-view-details', handleViewDetails);
    };
  }, []);

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

        {/* Minimal Controls - Top Right (subtle, fade in on hover) */}
        {mapLoaded && (
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10 opacity-40 hover:opacity-100 transition-opacity duration-300">
            {/* 2D/3D Toggle Button - Icon Only */}
            <button
              onClick={toggle3DMode}
              className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 p-2.5 hover:bg-blue-50 hover:shadow-lg transition-all duration-200 min-w-[40px] min-h-[40px] flex items-center justify-center"
              title={is3DMode ? 'Switch to 2D View' : 'Switch to 3D View'}
              aria-label={is3DMode ? 'Switch to 2D View' : 'Switch to 3D View'}
            >
              <span className="text-xl transition-transform hover:scale-110">
                {is3DMode ? '🗺️' : '⛰️'}
              </span>
            </button>

            {/* Reset View Button - Icon Only */}
            <button
              onClick={resetView}
              className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 p-2.5 hover:bg-blue-50 hover:shadow-lg transition-all duration-200 min-w-[40px] min-h-[40px] flex items-center justify-center"
              title="Reset View"
              aria-label="Reset camera to default position"
            >
              <span className="text-xl transition-transform hover:rotate-180 duration-500">
                🧭
              </span>
            </button>
          </div>
        )}

        {/* Department Colors Legend - shown when NO simulation */}
        {!simulationResults && mapLoaded && (
          <div className="absolute bottom-12 md:bottom-16 left-2 md:left-auto md:right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-3 md:p-4 max-w-[200px] md:max-w-[220px]">
            <h4 className="text-[10px] md:text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">
              🇸🇻 El Salvador Departments
            </h4>
            <div className="space-y-1.5 text-[9px] md:text-[10px] text-gray-600 max-h-[200px] overflow-y-auto">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm flex-shrink-0" style={{backgroundColor: '#3B82F6'}}></div><span>San Salvador</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm flex-shrink-0" style={{backgroundColor: '#10B981'}}></div><span>La Libertad</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm flex-shrink-0" style={{backgroundColor: '#F59E0B'}}></div><span>Santa Ana</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm flex-shrink-0" style={{backgroundColor: '#6366F1'}}></div><span>Chalatenango</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm flex-shrink-0" style={{backgroundColor: '#8B5CF6'}}></div><span>Sonsonate</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm flex-shrink-0" style={{backgroundColor: '#EC4899'}}></div><span>La Paz</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm flex-shrink-0" style={{backgroundColor: '#14B8A6'}}></div><span>Usulutan</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm flex-shrink-0" style={{backgroundColor: '#EF4444'}}></div><span>San Miguel</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm flex-shrink-0" style={{backgroundColor: '#F97316'}}></div><span>Morazan</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm flex-shrink-0" style={{backgroundColor: '#06B6D4'}}></div><span>La Union</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm flex-shrink-0" style={{backgroundColor: '#A855F7'}}></div><span>Cuscatlan</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm flex-shrink-0" style={{backgroundColor: '#84CC16'}}></div><span>Cabañas</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm flex-shrink-0" style={{backgroundColor: '#22C55E'}}></div><span>Ahuachapan</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm flex-shrink-0" style={{backgroundColor: '#EAB308'}}></div><span>San Vicente</span></div>
            </div>
          </div>
        )}

        {/* Stress Level Legend - shown when simulation IS running */}
        {simulationResults && (
          <div className="absolute bottom-12 md:bottom-16 left-2 md:left-auto md:right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-2 md:p-4 max-w-[180px] md:max-w-[200px]">
            <h4 className="text-[10px] md:text-xs font-bold text-gray-700 mb-2 md:mb-3 uppercase tracking-wide">
              {visualizationType === 'agriculture' ? 'Crop Stress' : 'Infrastructure Stress'}
            </h4>
            {visualizationType === 'agriculture' ? (
              // Agriculture-specific legend
              <div className="space-y-1.5 md:space-y-2">
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="w-4 h-4 md:w-6 md:h-6 rounded flex-shrink-0" style={{ backgroundColor: '#10b981' }}></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] md:text-xs font-semibold text-gray-800">Low</div>
                    <div className="text-[9px] md:text-xs text-gray-500">0-30%</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="w-4 h-4 md:w-6 md:h-6 rounded flex-shrink-0" style={{ backgroundColor: '#f59e0b' }}></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] md:text-xs font-semibold text-gray-800">Moderate</div>
                    <div className="text-[9px] md:text-xs text-gray-500">30-60%</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="w-4 h-4 md:w-6 md:h-6 rounded flex-shrink-0" style={{ backgroundColor: '#f97316' }}></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] md:text-xs font-semibold text-gray-800">High Stress</div>
                    <div className="text-[9px] md:text-xs text-gray-500">60-80%</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="w-4 h-4 md:w-6 md:h-6 rounded flex-shrink-0" style={{ backgroundColor: '#ef4444' }}></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] md:text-xs font-semibold text-gray-800">Critical</div>
                    <div className="text-[9px] md:text-xs text-gray-500">80-100%</div>
                  </div>
                </div>
              </div>
            ) : (
              // Energy/Water legend
              <div className="space-y-1.5 md:space-y-2">
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="w-4 h-4 md:w-6 md:h-6 rounded flex-shrink-0" style={{ backgroundColor: '#10b981' }}></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] md:text-xs font-semibold text-gray-800">Healthy</div>
                    <div className="text-[9px] md:text-xs text-gray-500">0-15%</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="w-4 h-4 md:w-6 md:h-6 rounded flex-shrink-0" style={{ backgroundColor: '#f59e0b' }}></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] md:text-xs font-semibold text-gray-800">Caution</div>
                    <div className="text-[9px] md:text-xs text-gray-500">15-35%</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="w-4 h-4 md:w-6 md:h-6 rounded flex-shrink-0" style={{ backgroundColor: '#f97316' }}></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] md:text-xs font-semibold text-gray-800">Warning</div>
                    <div className="text-[9px] md:text-xs text-gray-500">35-60%</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="w-4 h-4 md:w-6 md:h-6 rounded flex-shrink-0" style={{ backgroundColor: '#ef4444' }}></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] md:text-xs font-semibold text-gray-800">Critical</div>
                    <div className="text-[9px] md:text-xs text-gray-500">60-100%</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Premium loading state */}
        {!mapLoaded && !error && (
          <div className="absolute inset-0 rounded-lg overflow-hidden">
            <SkeletonLoader variant="map" className="w-full h-full" />
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 backdrop-blur-sm">
              <div className="text-center bg-white/90 rounded-xl p-6 shadow-lg">
                <LoadingSpinner size="lg" color="text-blue-600" center className="mb-4" />
                <p className="text-sm font-semibold text-gray-700 mb-1">Loading El Salvador...</p>
                <p className="text-xs text-gray-500">Initializing 14 departments</p>
              </div>
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

// Memoized export for performance optimization
export const MapView = memo(MapViewComponent);
