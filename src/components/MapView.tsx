'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Region } from '@/lib/regions';

interface MapViewProps {
  regions: Region[];
  selectedRegion?: Region | null;
  onRegionSelect?: (region: Region) => void;
  viewport?: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
}

/**
 * Interactive map component using Mapbox GL JS
 *
 * Displays El Salvador with clickable regions, supports:
 * - Region selection
 * - Custom viewport
 * - GeoJSON layer visualization
 */
export function MapView({
  regions,
  selectedRegion,
  onRegionSelect,
  viewport = { longitude: -88.89653, latitude: 13.794185, zoom: 8 },
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.error('Mapbox token not configured');
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [viewport.longitude, viewport.latitude],
      zoom: viewport.zoom,
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [viewport]);

  // Add regions as GeoJSON polygon layers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Load regions.json and add as GeoJSON source
    fetch('/regions.json')
      .then(response => response.json())
      .then(geojson => {
        const mapInstance = map.current!;

        // Add source if it doesn't exist
        if (!mapInstance.getSource('regions')) {
          mapInstance.addSource('regions', {
            type: 'geojson',
            data: geojson,
          });

          // Add fill layer for polygons
          mapInstance.addLayer({
            id: 'regions-fill',
            type: 'fill',
            source: 'regions',
            paint: {
              'fill-color': '#0ea5e9',
              'fill-opacity': [
                'case',
                ['==', ['get', 'id'], selectedRegion?.id || ''],
                0.6,
                0.2,
              ],
            },
          });

          // Add outline layer
          mapInstance.addLayer({
            id: 'regions-outline',
            type: 'line',
            source: 'regions',
            paint: {
              'line-color': '#0369a1',
              'line-width': 2,
            },
          });

          // Add labels
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
              'text-color': '#1f2937',
              'text-halo-color': '#ffffff',
              'text-halo-width': 2,
            },
          });

          // Add click handler
          mapInstance.on('click', 'regions-fill', (e) => {
            if (e.features && e.features.length > 0 && onRegionSelect) {
              const feature = e.features[0];
              const regionId = feature.properties?.id;
              const region = regions.find(r => r.id === regionId);
              if (region) {
                onRegionSelect(region);
              }
            }
          });

          // Change cursor on hover
          mapInstance.on('mouseenter', 'regions-fill', () => {
            mapInstance.getCanvas().style.cursor = 'pointer';
          });

          mapInstance.on('mouseleave', 'regions-fill', () => {
            mapInstance.getCanvas().style.cursor = '';
          });
        }
      })
      .catch(error => {
        console.error('Error loading regions.json:', error);
      });
  }, [mapLoaded, regions, onRegionSelect]);

  // Update fill color when selection changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const mapInstance = map.current;
    if (mapInstance.getLayer('regions-fill')) {
      mapInstance.setPaintProperty('regions-fill', 'fill-opacity', [
        'case',
        ['==', ['get', 'id'], selectedRegion?.id || ''],
        0.6,
        0.2,
      ]);
    }
  }, [mapLoaded, selectedRegion]);

  // Update viewport when selectedRegion changes
  useEffect(() => {
    if (!map.current || !selectedRegion) return;

    map.current.flyTo({
      center: selectedRegion.coordinates,
      zoom: 10,
      duration: 1500,
    });
  }, [selectedRegion]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
