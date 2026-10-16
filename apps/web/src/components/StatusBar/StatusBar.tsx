'use client';

import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { AvatarChip } from '../Avatar3D/AvatarChip';
import styles from './StatusBar.module.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function StatusBar() {
  const { state } = useGameStore();
  const weekday = DAYS[(state.day - 1) % 7];

  return (
    <header className={styles.statusBar}>
      <div className={styles.topRow}>
        <div className={styles.daySlotBadge}>
          <span className={styles.dayText}>Day {state.day}</span>
          <span className={styles.weekday}>({weekday})</span>
          <div className={styles.slotPips} title={`Time slot: ${state.slot} / 5`}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`${styles.pip} ${i < state.slot ? styles.pipActive : ''}`}
              />
            ))}
          </div>
        </div>

        <AvatarChip />

        <div className={styles.topRight}>
          <div className={styles.moneyChip} title="Your Cash in Naira">
            <span>₦</span>
            <span>{state.money.toLocaleString()}</span>
          </div>

          <div
            className={`${styles.lightBadge} ${!state.light ? styles.lightOutage : ''}`}
            title={state.light ? 'Light dey (NEPA ON)' : 'Light don go (NEPA OFF)'}
          >
            {state.light ? '💡' : '⚡'}
          </div>
        </div>
      </div>

      <div className={styles.statsRow}>
        {/* Energy */}
        <div className={styles.statPill}>
          <div className={styles.statHeader}>
            <span>⚡ Energy</span>
            <span>{state.stats.energy}%</span>
          </div>
          <div className={styles.statBarTrack}>
            <div
              className={`${styles.statBarFill} ${styles.energyFill}`}
              style={{ width: `${Math.min(100, Math.max(0, state.stats.energy))}%` }}
            />
          </div>
        </div>

        {/* Mood */}
        <div className={styles.statPill}>
          <div className={styles.statHeader}>
            <span>😊 Mood</span>
            <span>{state.stats.mood}%</span>
          </div>
          <div className={styles.statBarTrack}>
            <div
              className={`${styles.statBarFill} ${styles.moodFill}`}
              style={{ width: `${Math.min(100, Math.max(0, state.stats.mood))}%` }}
            />
          </div>
        </div>

        {/* Hunger */}
        <div className={styles.statPill}>
          <div className={styles.statHeader}>
            <span>🍲 Hunger</span>
            <span>{state.stats.hunger}%</span>
          </div>
          <div className={styles.statBarTrack}>
            <div
              className={`${styles.statBarFill} ${
                state.stats.hunger > 70 ? styles.hungerHigh : styles.hungerFill
              }`}
              style={{ width: `${Math.min(100, Math.max(0, state.stats.hunger))}%` }}
            />
          </div>
        </div>
      </div>

      <div className={styles.subRow}>
        <div className={styles.subTags}>
          <span className={`${styles.subTag} ${styles.respectTag}`} title="Street Respect">
            👑 {state.stats.respect}%
          </span>
          {state.stats.heat > 0 && (
            <span className={`${styles.subTag} ${styles.heatTag}`} title="Police / Street Heat">
              🔥 Heat {state.stats.heat}%
            </span>
          )}
          <span className={styles.subTag} title="Skills (Charisma / Street / Craft)">
            🎯 C:{state.skills.charisma} · S:{state.skills.street} · Cr:{state.skills.craft}
          </span>
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
          {state.housing === 'self_contain' ? '✨ Self-Contain' : '📦 Shared Room'}
        </div>
      </div>
    </header>
  );
}
