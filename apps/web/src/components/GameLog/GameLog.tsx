'use client';

import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import styles from './GameLog.module.css';

export function GameLog() {
  const { state } = useGameStore();
  const [collapsed, setCollapsed] = useState(false);

  const recentLogs = state.log.slice(-6).reverse();

  return (
    <div className={styles.logContainer}>
      <div className={styles.logHeader}>
        <span>Activity Ticker</span>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{ fontSize: 11, color: 'var(--text-muted)' }}
        >
          {collapsed ? 'Show' : 'Hide'}
        </button>
      </div>

      {!collapsed && (
        <div className={styles.logList}>
          {recentLogs.map((item, idx) => (
            <div key={idx} className={styles.logItem}>
              <span className={styles.logBullet}>•</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
