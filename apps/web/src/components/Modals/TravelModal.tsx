'use client';

import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import modalStyles from './Modal.module.css';

interface MapNode {
  id: string;
  name: string;
  short: string;
  icon: string;
  x: number;
  y: number;
}

const MAP_NODES: MapNode[] = [
  { id: 'udu_home', name: 'Your Room, Udu', short: 'Udu Base', icon: '🏠', x: 20, y: 75 },
  { id: 'effurun', name: 'Effurun Roundabout', short: 'Effurun Hub', icon: '🚖', x: 50, y: 45 },
  { id: 'warri_market', name: 'Warri Main Market', short: 'Main Market', icon: '🛍️', x: 80, y: 25 },
  { id: 'garden_park', name: 'Effurun Garden Park', short: 'Garden Park', icon: '🌳', x: 80, y: 75 },
];

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

  const activeLocObj = content.locations.find((l) => l.id === (selectedLoc || state.location));

  return (
    <div className={modalStyles.overlay} onClick={() => setActiveModal('none')}>
      <div className={modalStyles.modalSheet} onClick={(e) => e.stopPropagation()}>
        <div className={modalStyles.modalHeader}>
          <div className={modalStyles.modalTitle}>
            <span>🚖</span>
            <span>Delta Transit & Interactive Map</span>
          </div>
          <button className={modalStyles.closeBtn} onClick={() => setActiveModal('none')}>
            ✕
          </button>
        </div>

        <div className={modalStyles.modalBody}>
          {/* Visual Interactive Map Diagram */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 170,
              background: 'linear-gradient(135deg, #090e1c, #131b2e)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
            }}
          >
            {/* SVG Connecting Transit Roads */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              <line x1="20%" y1="75%" x2="50%" y2="45%" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="3" strokeDasharray="4 4" />
              <line x1="50%" y1="45%" x2="80%" y2="25%" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="3" strokeDasharray="4 4" />
              <line x1="50%" y1="45%" x2="80%" y2="75%" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="3" strokeDasharray="4 4" />
            </svg>

            {/* Map Nodes */}
            {MAP_NODES.map((node) => {
              const isCurrent = state.location === node.id;
              const isSelected = selectedLoc === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => {
                    if (!isCurrent) setSelectedLoc(node.id);
                  }}
                  style={{
                    position: 'absolute',
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    transform: 'translate(-50%, -50%)',
                    cursor: isCurrent ? 'default' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    zIndex: 10,
                  }}
                >
                  <div
                    style={{
                      width: isCurrent || isSelected ? 36 : 30,
                      height: isCurrent || isSelected ? 36 : 30,
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
                      color: isCurrent ? '#6ee7b7' : isSelected ? '#fde047' : 'var(--text-muted)',
                      background: 'rgba(0,0,0,0.7)',
                      padding: '1px 5px',
                      borderRadius: 4,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isCurrent ? '📍 You Here' : node.short}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Tap a map spot or select from destinations below:
          </div>

          {/* Location Cards */}
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
                      {MAP_NODES.find((n) => n.id === loc.id)?.icon || '📍'} {loc.name}
                    </span>
                    {isSelected && (
                      <span style={{ color: 'var(--primary)', fontSize: 12, fontWeight: 700 }}>
                        ✓ Selected
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{loc.blurb}</p>
                </div>
              );
            })}
          </div>

          {selectedLoc && (
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
