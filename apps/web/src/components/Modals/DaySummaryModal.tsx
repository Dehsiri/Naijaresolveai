'use client';

import React from 'react';
import { useGameStore } from '../../store/gameStore';
import modalStyles from './Modal.module.css';

export function DaySummaryModal() {
  const { state, lastSummary, dismissSummary } = useGameStore();

  if (!lastSummary) return null;

  return (
    <div className={modalStyles.overlay}>
      <div className={modalStyles.modalSheet}>
        <div className={modalStyles.modalHeader}>
          <div className={modalStyles.modalTitle}>
            <span>🌙</span>
            <span>Day {lastSummary.day} Summary</span>
          </div>
        </div>

        <div className={modalStyles.modalBody}>
          {/* Gist Headline Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(16,185,129,0.1))',
              border: '1px solid rgba(245,158,11,0.3)',
              padding: 14,
              borderRadius: 12,
              fontStyle: 'italic',
              fontSize: 14,
              color: '#fef08a',
            }}
          >
            "{lastSummary.gistHeadline}"
          </div>

          {/* Financial Breakdown Table */}
          <div className={modalStyles.cardItem}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span>Total Hustle Income:</span>
              <span style={{ fontWeight: 700, color: 'var(--accent-green)' }}>
                +₦{lastSummary.earnings.toLocaleString()}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span>Total Expenses & Chop:</span>
              <span style={{ fontWeight: 700, color: 'var(--accent-red)' }}>
                -₦{lastSummary.expenses.toLocaleString()}
              </span>
            </div>
            <hr style={{ borderColor: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ fontWeight: 700 }}>Net Daily Profit:</span>
              <span
                style={{
                  fontWeight: 800,
                  color: lastSummary.netChange >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                }}
              >
                {lastSummary.netChange >= 0 ? '+' : ''}₦{lastSummary.netChange.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Power Status */}
          <div className={modalStyles.cardItem}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13 }}>NEPA Power Grid Status:</span>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 12,
                  color: state.light ? 'var(--accent-green)' : 'var(--accent-red)',
                }}
              >
                {state.light ? '💡 Light Dey' : '⚡ Light Don Go'}
              </span>
            </div>
            {lastSummary.lightOutage && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Generator/charging cost: -₦{lastSummary.outageCost.toLocaleString()}
              </div>
            )}
          </div>

          <button
            className={modalStyles.primaryActionBtn}
            onClick={dismissSummary}
            id="btn-start-next-day"
          >
            <span>🌅 Rise & Hustle (Start Day {state.day})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
