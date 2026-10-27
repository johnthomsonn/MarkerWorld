'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import { Layers, Compass, ZoomIn, ZoomOut, Box, Crosshair, Tag } from 'lucide-react';
import { Marker, MapStyle, PendingLocation } from '@/types';

if (typeof window !== 'undefined' && maplibregl.setWorkerUrl) {
  maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs');
}

interface GlobeMapProps {
  markers: Marker[];
  selectedMarker: Marker | null;
  onSelectMarker: (marker: Marker | null) => void;
  isAddingMarker: boolean;
  onInitiateAddMarker: (location: PendingLocation) => void;
  onToggleAddMode: () => void;
}

const MAP_STYLES: Record<MapStyle, { name: string; style: maplibregl.StyleSpecification | string }> = {
  satellite: {
    name: 'Satellite Hybrid (Streets & Areas)',
    style: {
      version: 8,
      sources: {
        'esri-satellite': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution: 'Esri, Maxar, Earthstar Geographics',
        },
        'esri-transportation': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
        },
        'esri-labels': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
        },
      },
      layers: [
        {
          id: 'esri-satellite-layer',
          type: 'raster',
          source: 'esri-satellite',
          minzoom: 0,
          maxzoom: 19,
        },
        {
          id: 'esri-transportation-layer',
          type: 'raster',
          source: 'esri-transportation',
          minzoom: 3,
          maxzoom: 19,
        },
        {
          id: 'esri-labels-layer',
          type: 'raster',
          source: 'esri-labels',
          minzoom: 1,
          maxzoom: 19,
        },
      ],
    },
  },
  dark: {
    name: 'Dark Matter (Streets & Places)',
    style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  },
  street: {
    name: 'Street Atlas (Detailed Roads & Topo)',
    style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  },
};

export default function GlobeMap({
  markers,
  selectedMarker,
  onSelectMarker,
  isAddingMarker,
  onInitiateAddMarker,
  onToggleAddMode,
}: GlobeMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markerObjectsRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const pendingMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [currentStyle, setCurrentStyle] = useState<MapStyle>('satellite');
  const [pitch, setPitch] = useState<number>(45);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showLabels, setShowLabels] = useState<boolean>(true);

  // Toggle Street & Area labels on Satellite view
  const toggleLabels = () => {
    if (!mapInstance.current) return;
    const nextShow = !showLabels;
    setShowLabels(nextShow);
    const visibility = nextShow ? 'visible' : 'none';

    try {
      if (mapInstance.current.getLayer('esri-labels-layer')) {
        mapInstance.current.setLayoutProperty('esri-labels-layer', 'visibility', visibility);
      }
      if (mapInstance.current.getLayer('esri-transportation-layer')) {
        mapInstance.current.setLayoutProperty('esri-transportation-layer', 'visibility', visibility);
      }
    } catch {
      // style layer not loaded
    }
  };

  const isAddingMarkerRef = useRef(isAddingMarker);
  isAddingMarkerRef.current = isAddingMarker;

  const onInitiateAddMarkerRef = useRef(onInitiateAddMarker);
  onInitiateAddMarkerRef.current = onInitiateAddMarker;

  const onSelectMarkerRef = useRef(onSelectMarker);
  onSelectMarkerRef.current = onSelectMarker;

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLES[currentStyle].style,
      center: [20, 20],
      zoom: 2.2,
      pitch: 45,
      bearing: 0,
      attributionControl: { compact: true },
    });

    map.on('mousemove', (e) => {
      setCoords({
        lat: Number(e.lngLat.lat.toFixed(4)),
        lng: Number(e.lngLat.lng.toFixed(4)),
      });
    });

    map.on('click', (e) => {
      const lat = Number(e.lngLat.lat.toFixed(5));
      const lng = Number(e.lngLat.lng.toFixed(5));

      if (isAddingMarkerRef.current) {
        onInitiateAddMarkerRef.current({ lat, lng });
      } else {
        // Deselect marker if clicking empty map
        onSelectMarkerRef.current(null);
      }
    });

    // Right-click contextmenu directly adds marker at that spot
    map.on('contextmenu', (e) => {
      const lat = Number(e.lngLat.lat.toFixed(5));
      const lng = Number(e.lngLat.lng.toFixed(5));
      onInitiateAddMarkerRef.current({ lat, lng });
    });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update Map Style
  const handleStyleChange = (styleKey: MapStyle) => {
    if (!mapInstance.current || currentStyle === styleKey) return;
    setCurrentStyle(styleKey);
    mapInstance.current.setStyle(MAP_STYLES[styleKey].style);
  };

  // Toggle 3D Pitch
  const togglePitch = () => {
    if (!mapInstance.current) return;
    const nextPitch = pitch === 0 ? 55 : 0;
    mapInstance.current.easeTo({ pitch: nextPitch, duration: 800 });
    setPitch(nextPitch);
  };

  // Zoom Controls
  const zoomIn = () => mapInstance.current?.zoomIn();
  const zoomOut = () => mapInstance.current?.zoomOut();
  const resetNorth = () => mapInstance.current?.resetNorthPitch({ duration: 800 });

  // Render & Synchronize Markers
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    // Remove obsolete markers
    const currentMarkerIds = new Set(markers.map((m) => m.id));
    markerObjectsRef.current.forEach((markerObj, id) => {
      if (!currentMarkerIds.has(id)) {
        markerObj.remove();
        markerObjectsRef.current.delete(id);
      }
    });

    // Create or update markers
    markers.forEach((marker) => {
      const isSelected = selectedMarker?.id === marker.id;
      let existing = markerObjectsRef.current.get(marker.id);

      if (!existing) {
        // Build custom DOM pin
        const el = document.createElement('div');
        el.className = 'custom-pin';
        el.id = `map-marker-${marker.id}`;

        const pulse = document.createElement('div');
        pulse.className = `pin-pulse ${marker.isResolved ? 'resolved' : 'open'}`;

        const head = document.createElement('div');
        head.className = `pin-head ${marker.isResolved ? 'resolved' : 'open'}`;

        const iconContainer = document.createElement('div');
        iconContainer.className = 'pin-icon';
        iconContainer.innerHTML = marker.isResolved
          ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
          : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>';

        head.appendChild(iconContainer);
        el.appendChild(pulse);
        el.appendChild(head);

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectMarker(marker);
          map.flyTo({
            center: [marker.lng, marker.lat],
            zoom: Math.max(map.getZoom(), 8),
            speed: 1.2,
            curve: 1.42,
            essential: true,
          });
        });

        const newMarker = new maplibregl.Marker({ element: el })
          .setLngLat([marker.lng, marker.lat])
          .addTo(map);

        markerObjectsRef.current.set(marker.id, newMarker);
      } else {
        // Update appearance if resolved status changed
        const el = existing.getElement();
        const head = el.querySelector('.pin-head');
        const pulse = el.querySelector('.pin-pulse');
        const iconContainer = el.querySelector('.pin-icon');

        if (head && pulse && iconContainer) {
          head.className = `pin-head ${marker.isResolved ? 'resolved' : 'open'}`;
          pulse.className = `pin-pulse ${marker.isResolved ? 'resolved' : 'open'}`;
          iconContainer.innerHTML = marker.isResolved
            ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
            : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>';
        }
      }
    });
  }, [markers, selectedMarker, onSelectMarker]);

  // Center on Selected Marker if changed externally
  useEffect(() => {
    if (!selectedMarker || !mapInstance.current) return;
    mapInstance.current.flyTo({
      center: [selectedMarker.lng, selectedMarker.lat],
      zoom: Math.max(mapInstance.current.getZoom(), 7.5),
      speed: 1.2,
      curve: 1.4,
      essential: true,
    });
  }, [selectedMarker]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Map Container */}
      <div
        ref={mapContainer}
        className={isAddingMarker ? 'drop-mode-active' : ''}
        style={{ width: '100%', height: '100%' }}
      />

      {/* Drop Pin Mode Active Banner */}
      {isAddingMarker && (
        <div
          style={{
            position: 'absolute',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
            padding: '10px 20px',
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.95), rgba(0, 114, 255, 0.95))',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.875rem',
            boxShadow: '0 8px 24px rgba(0, 240, 255, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            backdropFilter: 'blur(8px)',
          }}
        >
          <Crosshair size={18} className="animate-spin" />
          <span>Click anywhere on the globe to drop your pin</span>
          <button
            onClick={onToggleAddMode}
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              border: 'none',
              color: '#ffffff',
              borderRadius: 'var(--radius-full)',
              padding: '2px 8px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              marginLeft: 4,
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Floating HUD Controls (Right side) */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          zIndex: 25,
        }}
      >
        {/* Style Selector */}
        <div
          className="glass-panel"
          style={{
            borderRadius: 'var(--radius-md)',
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {(['satellite', 'dark', 'street'] as MapStyle[]).map((styleKey) => (
            <button
              key={styleKey}
              onClick={() => handleStyleChange(styleKey)}
              className={`btn-icon ${currentStyle === styleKey ? 'active' : ''}`}
              title={MAP_STYLES[styleKey].name}
              style={{ width: 34, height: 34 }}
            >
              <Layers size={16} />
            </button>
          ))}
        </div>

        {/* 3D Pitch Toggle */}
        <div
          className="glass-panel"
          style={{
            borderRadius: 'var(--radius-md)',
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <button
            onClick={togglePitch}
            className={`btn-icon ${pitch > 0 ? 'active' : ''}`}
            title="Toggle 3D Camera Tilt"
            style={{ width: 34, height: 34 }}
          >
            <Box size={16} />
          </button>
          <button
            onClick={resetNorth}
            className="btn-icon"
            title="Reset North & Compass"
            style={{ width: 34, height: 34 }}
          >
            <Compass size={16} />
          </button>
          <button
            onClick={zoomIn}
            className="btn-icon"
            title="Zoom In"
            style={{ width: 34, height: 34 }}
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={zoomOut}
            className="btn-icon"
            title="Zoom Out"
            style={{ width: 34, height: 34 }}
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={toggleLabels}
            className={`btn-icon ${showLabels ? 'active' : ''}`}
            title={showLabels ? 'Street & Place Labels: ON (Click to hide)' : 'Street & Place Labels: OFF (Click to show)'}
            style={{ width: 34, height: 34 }}
          >
            <Tag size={16} />
          </button>
        </div>
      </div>

      {/* Bottom Coordinates HUD Display */}
      {coords && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            zIndex: 20,
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            pointerEvents: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--accent-cyan)' }}>LAT</span>
            <span>{coords.lat}°</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--accent-cyan)' }}>LNG</span>
            <span>{coords.lng}°</span>
          </div>
        </div>
      )}
    </div>
  );
}
