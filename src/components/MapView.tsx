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

  // Add regions as markers
  useEffect(() => {
    if (!map.current || !mapLoaded || regions.length === 0) return;

    // Clear existing markers
    const markers = document.querySelectorAll('.mapboxgl-marker');
    markers.forEach(marker => marker.remove());

    // Add markers for each region
    regions.forEach(region => {
      const el = document.createElement('div');
      el.className = 'region-marker';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = selectedRegion?.id === region.id ? '#0ea5e9' : '#94a3b8';
      el.style.border = '2px solid white';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      el.addEventListener('click', () => {
        if (onRegionSelect) {
          onRegionSelect(region);
        }
      });

      new mapboxgl.Marker(el)
        .setLngLat(region.coordinates)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<strong>${region.name}</strong><br/>${region.nameEs}`
          )
        )
        .addTo(map.current!);
    });
  }, [mapLoaded, regions, selectedRegion, onRegionSelect]);

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
