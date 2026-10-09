'use client';

import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import modalStyles from './Modal.module.css';

const LOC_ICONS: Record<string, string> = {
  udu_home: '🏠',
  effurun: '🚖',
  warri_market: '🛍️',
  garden_park: '🌳',
};

export function TravelModal() {
  const { state, content, travelTo, setActiveModal } = useGameStore();
  const [selectedLoc, setSelectedLoc] = useState<string | null>(null);

  const otherLocations = content.locations.filter((l) => l.id !== state.location);

  const handleKeke = (haggle: boolean) => {
    if (!selectedLoc) return;
    travelTo(selectedLoc, 'keke', haggle);
  };

  const handleWalk = () => {
    if (!selectedLoc) return;
    travelTo(selectedLoc, 'walk');
  };

  return (
    <div className={modalStyles.overlay} onClick={() => setActiveModal('none')}>
      <div className={modalStyles.modalSheet} onClick={(e) => e.stopPropagation()}>
        <div className={modalStyles.modalHeader}>
          <div className={modalStyles.modalTitle}>
            <span>🚖</span>
            <span>Delta Commute & Map</span>
          </div>
          <button className={modalStyles.closeBtn} onClick={() => setActiveModal('none')}>
            ✕
          </button>
        </div>

        <div className={modalStyles.modalBody}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Choose where to move in Warri / Effurun. Keke is fast (1 slot), Trekking is free but takes 2 slots & energy.
          </p>

          <div className={modalStyles.gridCards}>
            {otherLocations.map((loc) => {
              const isSelected = selectedLoc === loc.id;
              return (
                <div
                  key={loc.id}
                  className={modalStyles.cardItem}
                  onClick={() => setSelectedLoc(loc.id)}
                  style={{
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                    background: isSelected ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255,255,255,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>
                      {LOC_ICONS[loc.id] || '📍'} {loc.name}
                    </span>
                    {isSelected && <span style={{ color: 'var(--primary)', fontSize: 12 }}>Selected</span>}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{loc.blurb}</p>
                </div>
              );
            })}
          </div>

          {selectedLoc && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-gold)' }}>
                Select Travel Mode to {content.locations.find((l) => l.id === selectedLoc)?.name}:
              </div>

              {/* Standard Keke */}
              <button
                className={modalStyles.primaryActionBtn}
                onClick={() => handleKeke(false)}
                disabled={state.money < 300 || state.slot + 1 > 5}
                id="btn-travel-keke"
              >
                <span>🚖 Normal Keke (₦300 · 1 Slot)</span>
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
