'use client';

import React, { useState, useMemo } from 'react';
import styles from './WarriGoogleMap.module.css';

export interface WarriMapNode {
  id: string;
  name: string;
  short: string;
  landmarkQuery: string;
  area: string;
  icon: string;
  lat: number;
  lng: number;
  radarX: number;
  radarY: number;
}

export const WARRI_GOOGLE_LOCATIONS: WarriMapNode[] = [
  {
    id: 'udu_home',
    name: 'Your Room, Udu',
    short: 'Udu Base',
    landmarkQuery: 'Udu Road, Warri, Delta State, Nigeria',
    area: 'Udu Express / Enerhen Axis',
    icon: '🏠',
    lat: 5.4892,
    lng: 5.7924,
    radarX: 20,
    radarY: 75,
  },
  {
    id: 'effurun',
    name: 'Effurun Roundabout',
    short: 'Effurun Hub',
    landmarkQuery: 'Effurun Roundabout, Effurun, Delta State, Nigeria',
    area: 'Effurun Junction / PTI Axis',
    icon: '🚖',
    lat: 5.5544,
    lng: 5.7932,
    radarX: 50,
    radarY: 45,
  },
  {
    id: 'warri_market',
    name: 'Warri Main Market',
    short: 'Main Market',
    landmarkQuery: 'Main Market, Warri, Delta State, Nigeria',
    area: 'Warri River / Market Road',
    icon: '🛍️',
    lat: 5.5174,
    lng: 5.7501,
    radarX: 80,
    radarY: 25,
  },
  {
    id: 'garden_park',
    name: 'Effurun Garden Park',
    short: 'Garden Park',
    landmarkQuery: 'Effurun Garden Park, Effurun, Delta State, Nigeria',
    area: 'NPA / DSC Expressway',
    icon: '🌳',
    lat: 5.562,
    lng: 5.785,
    radarX: 80,
    radarY: 75,
  },
];

// Haversine distance in kilometers with 1.25x Warri street routing factor
export function getWarriRouteDistanceKm(a: WarriMapNode, b: WarriMapNode): number {
  if (a.id === b.id) return 0;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const c =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  const straightKm = 2 * R * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
  return Math.round(straightKm * 1.25 * 10) / 10;
}

interface WarriGoogleMapProps {
  currentLocationId: string;
  selectedLocationId: string | null;
  onSelectLocation: (locId: string) => void;
  height?: number;
  allowSelectCurrent?: boolean;
}

export function WarriGoogleMap({
  currentLocationId,
  selectedLocationId,
  onSelectLocation,
  height = 225,
  allowSelectCurrent = false,
}: WarriGoogleMapProps) {
  const [viewMode, setViewMode] = useState<'google' | 'radar'>('google');
  const [mapLayer, setMapLayer] = useState<'m' | 'k'>('m'); // 'm' = Road Map, 'k' = Satellite
  const [zoom, setZoom] = useState<number>(15);

  const currentNode = useMemo(
    () =>
      WARRI_GOOGLE_LOCATIONS.find((n) => n.id === currentLocationId) ||
      WARRI_GOOGLE_LOCATIONS[0],
    [currentLocationId]
  );

  const targetNode = useMemo(
    () =>
      WARRI_GOOGLE_LOCATIONS.find((n) => n.id === (selectedLocationId || currentLocationId)) ||
      currentNode,
    [selectedLocationId, currentLocationId, currentNode]
  );

  const distanceKm = useMemo(
    () => getWarriRouteDistanceKm(currentNode, targetNode),
    [currentNode, targetNode]
  );

  const kekeMinutes = Math.max(4, Math.round(distanceKm * 2.4));
  const trekMinutes = Math.max(12, Math.round(distanceKm * 11));

  // Keyless Google Maps Embed URL centered on target node's Warri/Effurun GPS coordinates
  const googleEmbedUrl = useMemo(() => {
    const query = encodeURIComponent(`${targetNode.lat},${targetNode.lng} (${targetNode.name})`);
    return `https://maps.google.com/maps?q=${query}&ll=${targetNode.lat},${targetNode.lng}&t=${mapLayer}&z=${zoom}&ie=UTF8&iwloc=B&output=embed`;
  }, [targetNode, mapLayer, zoom]);

  // Direct external Google Maps Directions / Place URL
  const externalGoogleMapsUrl = useMemo(() => {
    if (selectedLocationId && selectedLocationId !== currentLocationId) {
      return `https://www.google.com/maps/dir/?api=1&origin=${currentNode.lat},${currentNode.lng}&destination=${targetNode.lat},${targetNode.lng}&travelmode=driving`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${targetNode.lat},${targetNode.lng}`;
  }, [selectedLocationId, currentLocationId, currentNode, targetNode]);

  return (
    <div className={styles.mapContainer} data-testid="warri-google-map">
      {/* Top Map Mode & Layer Controls */}
      <div className={styles.mapToolbar}>
        <div className={styles.modeGroup} role="tablist" aria-label="Map View Mode">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'google'}
            className={`${styles.modeBtn} ${viewMode === 'google' ? styles.modeBtnActive : ''}`}
            onClick={() => setViewMode('google')}
            id="btn-map-mode-google"
          >
            <span>🗺️</span>
            <span>Google Map</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'radar'}
            className={`${styles.modeBtn} ${viewMode === 'radar' ? styles.modeBtnActive : ''}`}
            onClick={() => setViewMode('radar')}
            id="btn-map-mode-radar"
          >
            <span>📡</span>
            <span>Transit Radar</span>
          </button>
        </div>

        {viewMode === 'google' && (
          <div className={styles.layerGroup}>
            <button
              type="button"
              className={`${styles.iconControlBtn} ${mapLayer === 'm' ? styles.iconControlBtnActive : ''}`}
              onClick={() => setMapLayer('m')}
              title="Google Street Map View"
              id="btn-map-layer-road"
            >
              <span>🛣️</span>
              <span>Road</span>
            </button>
            <button
              type="button"
              className={`${styles.iconControlBtn} ${mapLayer === 'k' ? styles.iconControlBtnActive : ''}`}
              onClick={() => setMapLayer('k')}
              title="Google Satellite View"
              id="btn-map-layer-satellite"
            >
              <span>🛰️</span>
              <span>Satellite</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Map Viewport */}
      <div className={styles.viewportWrapper} style={{ height }}>
        {viewMode === 'google' ? (
          <>
            <iframe
              key={`${targetNode.id}-${mapLayer}-${zoom}`}
              src={googleEmbedUrl}
              title={`Google Map - ${targetNode.name}`}
              className={styles.googleIframe}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />

            {/* Top GPS Telemetry Overlay */}
            <div className={styles.gpsTopBar}>
              <div className={styles.gpsBadge}>
                <span className={styles.liveDot} />
                <span>
                  {targetNode.icon} {targetNode.name}
                </span>
              </div>
              <div className={styles.coordsChip}>
                {targetNode.lat.toFixed(4)}°N, {targetNode.lng.toFixed(4)}°E
              </div>
            </div>

            {/* Zoom Controls (>=44px tap targets) */}
            <div className={styles.zoomOverlay}>
              <button
                type="button"
                className={styles.zoomBtn}
                onClick={() => setZoom((z) => Math.min(18, z + 1))}
                aria-label="Zoom in Google Map"
                title="Zoom In"
              >
                +
              </button>
              <button
                type="button"
                className={styles.zoomBtn}
                onClick={() => setZoom((z) => Math.max(12, z - 1))}
                aria-label="Zoom out Google Map"
                title="Zoom Out"
              >
                −
              </button>
            </div>
          </>
        ) : (
          /* Interactive SVG Delta Transit Radar (Offline Fallback & Quick Graph) */
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <svg
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
            >
              <line
                x1="20%"
                y1="75%"
                x2="50%"
                y2="45%"
                stroke="rgba(245, 158, 11, 0.45)"
                strokeWidth="3"
                strokeDasharray="4 4"
              />
              <line
                x1="50%"
                y1="45%"
                x2="80%"
                y2="25%"
                stroke="rgba(16, 185, 129, 0.45)"
                strokeWidth="3"
                strokeDasharray="4 4"
              />
              <line
                x1="50%"
                y1="45%"
                x2="80%"
                y2="75%"
                stroke="rgba(6, 182, 212, 0.45)"
                strokeWidth="3"
                strokeDasharray="4 4"
              />
            </svg>

            {WARRI_GOOGLE_LOCATIONS.map((node) => {
              const isCurrent = currentLocationId === node.id;
              const isSelected = selectedLocationId === node.id;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => {
                    if (!isCurrent || allowSelectCurrent) {
                      onSelectLocation(node.id);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    left: `${node.radarX}%`,
                    top: `${node.radarY}%`,
                    transform: 'translate(-50%, -50%)',
                    cursor: isCurrent && !allowSelectCurrent ? 'default' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    zIndex: 10,
                    background: 'transparent',
                    border: 'none',
                    minWidth: 44,
                    minHeight: 44,
                    padding: 4,
                  }}
                >
                  <div
                    style={{
                      width: isCurrent || isSelected ? 38 : 32,
                      height: isCurrent || isSelected ? 38 : 32,
                      borderRadius: '50%',
                      background: isCurrent
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : isSelected
                        ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                        : 'rgba(30,41,59,0.9)',
                      border: isCurrent
                        ? '2px solid #6ee7b7'
                        : isSelected
                        ? '2px solid #fde047'
                        : '1px solid rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isCurrent || isSelected ? 16 : 13,
                      boxShadow: isCurrent
                        ? '0 0 14px rgba(16,185,129,0.6)'
                        : isSelected
                        ? '0 0 14px rgba(245,158,11,0.6)'
                        : '0 2px 6px rgba(0,0,0,0.4)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {node.icon}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: isCurrent
                        ? '#6ee7b7'
                        : isSelected
                        ? '#fde047'
                        : 'var(--text-muted)',
                      background: 'rgba(0,0,0,0.75)',
                      padding: '2px 6px',
                      borderRadius: 4,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isCurrent ? '📍 You Here' : node.short}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Google Map Pin Selector Strip (>=44px touch targets) */}
      <div className={styles.pinStrip} role="group" aria-label="Warri & Effurun Map Pins">
        {WARRI_GOOGLE_LOCATIONS.map((node) => {
          const isCurrent = currentLocationId === node.id;
          const isSelected = selectedLocationId === node.id;
          const dist = getWarriRouteDistanceKm(currentNode, node);
          return (
            <button
              key={node.id}
              type="button"
              className={`${styles.pinChip} ${
                isSelected
                  ? styles.pinChipSelected
                  : isCurrent
                  ? styles.pinChipCurrent
                  : ''
              }`}
              onClick={() => {
                if (!isCurrent || allowSelectCurrent) {
                  onSelectLocation(node.id);
                }
              }}
              id={`google-pin-${node.id}`}
            >
              <span className={styles.pinChipLeft}>
                <span>{node.icon}</span>
                <span className={styles.pinChipName}>{node.short}</span>
              </span>
              <span className={styles.pinBadge}>
                {isCurrent ? 'HERE' : `${dist} km`}
              </span>
            </button>
          );
        })}
      </div>

      {/* GPS Route Telemetry & External Google Maps Link */}
      <div className={styles.routeInfoBar}>
        <div className={styles.routeMetrics}>
          <div className={styles.routeTitle}>
            <span>🧭</span>
            <span>
              {targetNode.id === currentNode.id
                ? `Current GPS: ${currentNode.area}`
                : `Route: ${currentNode.short} → ${targetNode.short} (${distanceKm} km)`}
            </span>
          </div>
          <div className={styles.routeSub}>
            {targetNode.id === currentNode.id
              ? `Tap any destination pin above to preview route on Google Maps`
              : `Est. Keke: ~${kekeMinutes} mins · Trek: ~${trekMinutes} mins · ${targetNode.area}`}
          </div>
        </div>

        <a
          href={externalGoogleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.externalMapLink}
          id="link-open-google-maps"
        >
          <span>🗺️</span>
          <span>Open Maps ↗</span>
        </a>
      </div>
    </div>
  );
}

