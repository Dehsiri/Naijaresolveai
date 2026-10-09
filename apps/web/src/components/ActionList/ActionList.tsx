'use client';

import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { ActionCard } from './ActionCard';
import styles from './ActionList.module.css';

export function ActionList() {
  const { state, content } = useGameStore();

  const currentActions = content.actions.filter((a) => a.location === state.location);

  return (
    <section className={styles.container}>
      <div className={styles.sectionHeader}>
        <span>Available Activities ({currentActions.length})</span>
      </div>

      {currentActions.length === 0 ? (
        <div className={styles.emptyState}>
          No activities here. Use travel to check other spots in Warri!
        </div>
      ) : (
        currentActions.map((act) => <ActionCard key={act.id} action={act} />)
      )}
    </section>
  );
}
