'use client';

import React from 'react';
import { useGameStore } from '../../store/gameStore';
import styles from './GameLog.module.css';

export function Toast() {
  const { toastMessage } = useGameStore();

  if (!toastMessage) return null;

  return (
    <div className={styles.toastContainer}>
      <div className={styles.toast}>
        <span>📣</span>
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}
