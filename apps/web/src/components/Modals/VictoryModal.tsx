'use client';

import React from 'react';
import { useGameStore } from '../../store/gameStore';
import modalStyles from './Modal.module.css';

export function VictoryModal() {
  const { state, showToast } = useGameStore();

  if (!state.flags.chapter1Done || state.flags.victoryDismissed) return null;

  const dismissVictory = () => {
    state.flags.victoryDismissed = true;
    showToast('Endless hustle mode unlocked!');
  };

  return (
    <div className={modalStyles.overlay}>
      <div
        className={modalStyles.modalSheet}
        style={{
          border: '2px solid var(--primary)',
          boxShadow: '0 0 35px var(--primary-glow)',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            padding: 24,
            textAlign: 'center',
            color: '#0f172a',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>CHAPTER 1 CONQUERED!</div>
          <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.9, marginTop: 4 }}>
            Official Registered Merchant · Warri Main Market
          </div>
        </div>

        <div className={modalStyles.modalBody}>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-main)' }}>
            <strong>Warri no dey carry last!</strong> From sleeping on a mat in a shared Udu room with only ₦5,000 to paying off your ₦12,000 market stall deposit, you have proven your street credibility, negotiation sharpness, and resilience.
          </p>

          <div className={modalStyles.cardItem}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-gold)' }}>Career Statistics</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 4 }}>
              <span>Days Survived:</span>
              <span style={{ fontWeight: 700 }}>{state.day} Days</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span>Final Cash Reserve:</span>
              <span style={{ fontWeight: 700, color: 'var(--accent-green)' }}>₦{state.money.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span>Street Respect:</span>
              <span style={{ fontWeight: 700 }}>👑 {state.stats.respect}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span>Missions Completed:</span>
              <span style={{ fontWeight: 700 }}>6 / 6 Story Missions</span>
            </div>
          </div>

          <button
            className={modalStyles.primaryActionBtn}
            onClick={dismissVictory}
            id="btn-continue-endless"
          >
            <span>🚀 Continue Endless Hustle & Free Play</span>
          </button>
        </div>
      </div>
    </div>
  );
}
