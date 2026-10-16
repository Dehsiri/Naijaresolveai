'use client';

import React from 'react';
import { useGameStore } from '../../store/gameStore';
import styles from './LocationBanner.module.css';

const ICONS: Record<string, string> = {
  udu_home: '🏠',
  effurun: '🚖',
  warri_market: '🛍️',
  garden_park: '🌳',
};

const TIME_NAMES = [
  { name: '🌅 Morning', class: styles.morningGlow },
  { name: '☀️ Afternoon', class: styles.afternoonGlow },
  { name: '🌇 Evening', class: styles.eveningGlow },
  { name: '🌙 Night', class: styles.nightGlow },
  { name: '🌌 Late Night', class: styles.nightGlow },
];

export function LocationBanner() {
  const { state, content, eatChop, advanceDay, setActiveModal } = useGameStore();
  const currentLocation = content.locations.find((l) => l.id === state.location);
  const icon = ICONS[state.location] || '📍';
  const timeInfo = TIME_NAMES[Math.min(state.slot, 4)] || TIME_NAMES[0];

  const canEat = state.mealsToday < 3 && state.money >= 500;

  return (
    <div className={`${styles.banner} ${timeInfo.class}`}>
      <div className={styles.headerArea}>
        <div>
          <div className={styles.locationTitle}>
            <span className={styles.locationIcon}>{icon}</span>
            <span>{currentLocation?.name || 'Warri Territory'}</span>
          </div>
          <p className={styles.locationBlurb}>{currentLocation?.blurb}</p>
        </div>
        <div className={styles.timeTag}>{timeInfo.name}</div>
      </div>

      <div className={styles.quickActions}>
        <button
          className={`${styles.quickBtn} ${styles.eatBtn}`}
          onClick={() => eatChop()}
          disabled={!canEat}
          title={
            !canEat
              ? state.mealsToday >= 3
                ? 'Full for today (3 meals max)'
                : 'Need ₦500 for food'
              : 'Eat Bole & Fish (-₦500, -35 Hunger)'
          }
          style={{ opacity: canEat ? 1 : 0.45 }}
        >
          <span>🍲 Chop (₦500)</span>
        </button>

        <button
          className={styles.quickBtn}
          onClick={() => setActiveModal('world')}
          title="Walk and explore this location in 3D"
          id="btn-explore-3d-world"
        >
          <span>🚶 Walk in 3D</span>
        </button>

        <button
          className={styles.quickBtn}
          onClick={() => setActiveModal('map')}
          title="Change location by keke or trekking"
        >
          <span>🗺️ Travel</span>
        </button>

        <button
          className={`${styles.quickBtn} ${styles.endDayBtn}`}
          onClick={() => advanceDay()}
          title="Rest and conclude today"
        >
          <span>🌙 Sleep / End Day</span>
        </button>
      </div>
    </div>
  );
}
