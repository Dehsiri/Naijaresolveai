'use client';

import React from 'react';
import { useGameStore } from '../../store/gameStore';
import type { ChoiceDef } from '@warri-vibe/engine';
import modalStyles from './Modal.module.css';

export function EventModal() {
  const { state, respondToEvent } = useGameStore();
  const event = state.pendingEvent;

  if (!event) return null;

  return (
    <div className={modalStyles.overlay}>
      <div className={modalStyles.modalSheet}>
        <div className={modalStyles.modalHeader}>
          <div className={modalStyles.modalTitle}>
            <span>{event.isMission ? '📜' : '🎲'}</span>
            <span>{event.title}</span>
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              color: event.isMission ? 'var(--primary)' : 'var(--accent-cyan)',
              background: event.isMission ? 'rgba(245,158,11,0.15)' : 'rgba(6,182,212,0.15)',
              padding: '3px 8px',
              borderRadius: 4,
            }}
          >
            {event.isMission ? 'Story Mission' : 'Random Event'}
          </span>
        </div>

        <div className={modalStyles.modalBody}>
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255,255,255,0.06)',
              fontSize: 14,
              lineHeight: 1.5,
              color: 'var(--text-main)',
            }}
          >
            {event.text}
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginTop: 4 }}>
            What will you do?
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {event.choices?.map((choice: ChoiceDef) => {
              const cantAfford = choice.requires?.minMoney && state.money < choice.requires.minMoney;
              return (
                <button
                  key={choice.id}
                  className={modalStyles.secondaryBtn}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    gap: 4,
                    padding: '12px 14px',
                  }}
                  disabled={Boolean(cantAfford)}
                  onClick={() => respondToEvent(choice.id)}
                  id={`btn-choice-${choice.id}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{choice.label}</span>
                    {choice.check && (
                      <span style={{ fontSize: 11, color: 'var(--text-gold)', fontWeight: 600 }}>
                        🎯 {choice.check.skill} Check
                      </span>
                    )}
                  </div>
                  {cantAfford && (
                    <span style={{ fontSize: 11, color: 'var(--accent-red)' }}>
                      Need ₦{choice.requires?.minMoney?.toLocaleString()}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
