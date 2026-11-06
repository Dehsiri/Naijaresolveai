'use client';

import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  WarriGoogleMap,
  WARRI_GOOGLE_LOCATIONS,
} from '../GoogleMap/WarriGoogleMap';
import modalStyles from './Modal.module.css';

export function TravelModal() {
  const { state, content, travelTo, setActiveModal } = useGameStore();
  const [selectedLoc, setSelectedLoc] = useState<string | null>(null);

  const otherLocations = content.locations.filter((l) => l.id !== state.location);

  const handleKeke = (haggle: boolean) => {
    if (!selectedLoc || selectedLoc === state.location) return;
    travelTo(selectedLoc, 'keke', haggle);
  };

  const handleWalk = () => {
    if (!selectedLoc || selectedLoc === state.location) return;
    travelTo(selectedLoc, 'walk');
  };

  const activeLocObj = content.locations.find(
    (l) => l.id === (selectedLoc || state.location)
  );

  return (
    <div className={modalStyles.overlay} onClick={() => setActiveModal('none')}>
      <div className={modalStyles.modalSheet} onClick={(e) => e.stopPropagation()}>
        <div className={modalStyles.modalHeader}>
          <div className={modalStyles.modalTitle}>
            <span>🗺️</span>
            <span>Warri & Effurun Google Map</span>
          </div>
          <button
            className={modalStyles.closeBtn}
            onClick={() => setActiveModal('none')}
            aria-label="Close Google Map"
          >
            ✕
          </button>
        </div>

        <div className={modalStyles.modalBody}>
          {/* Interactive Warri & Effurun Google Map + Transit Radar */}
          <WarriGoogleMap
            currentLocationId={state.location}
            selectedLocationId={selectedLoc}
            onSelectLocation={(locId) => {
              if (locId !== state.location) {
                setSelectedLoc(locId);
              }
            }}
            height={220}
          />

          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Select a destination to view on Google Map & commute:
          </div>

          {/* Location Cards */}
          <div className={modalStyles.gridCards}>
            {otherLocations.map((loc) => {
              const isSelected = selectedLoc === loc.id;
              const mapMeta = WARRI_GOOGLE_LOCATIONS.find((n) => n.id === loc.id);
              return (
                <div
                  key={loc.id}
                  className={modalStyles.cardItem}
                  onClick={() => setSelectedLoc(loc.id)}
                  style={{
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                    background: isSelected
                      ? 'rgba(245, 158, 11, 0.08)'
                      : 'rgba(255,255,255,0.03)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 15 }}>
                      {mapMeta?.icon || '📍'} {loc.name}
                    </span>
                    {isSelected ? (
                      <span
                        style={{
                          color: 'var(--primary)',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        ✓ On Map
                      </span>
                    ) : (
                      <span
                        style={{
                          color: 'var(--text-muted)',
                          fontSize: 11,
                          fontFamily: 'monospace',
                        }}
                      >
                        {mapMeta ? `${mapMeta.lat.toFixed(3)}°N, ${mapMeta.lng.toFixed(3)}°E` : ''}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{loc.blurb}</p>
                </div>
              );
            })}
          </div>

          {selectedLoc && selectedLoc !== state.location && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-gold)' }}>
                Commute Mode to {activeLocObj?.name}:
              </div>

              {/* Standard Keke */}
              <button
                className={modalStyles.primaryActionBtn}
                onClick={() => handleKeke(false)}
                disabled={state.money < 300 || state.slot + 1 > 5}
                id="btn-travel-keke"
              >
                <span>🚖 Normal Keke Fare (₦300 · 1 Slot)</span>
              </button>

              {/* Haggle Keke */}
              <button
                className={modalStyles.secondaryBtn}
                onClick={() => handleKeke(true)}
                disabled={state.money < 400 || state.slot + 1 > 5}
                id="btn-travel-haggle"
              >
                <span>🎲 Haggle Keke Fare (50% ₦200 / 50% ₦400)</span>
              </button>

              {/* Trek / Walk */}
              <button
                className={modalStyles.secondaryBtn}
                onClick={handleWalk}
                disabled={state.slot + 2 > 5 || state.stats.energy < 10}
                id="btn-travel-walk"
              >
                <span>🚶 Trek on Foot (₦0 · 2 Slots · -10⚡)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
