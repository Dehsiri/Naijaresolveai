'use client';

import React from 'react';
import { useGameStore, type ModalType } from '../../store/gameStore';
import styles from './BottomNav.module.css';

interface NavItemDef {
  id: ModalType;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItemDef[] = [
  { id: 'none', label: 'Hustle', icon: '⚡' },
  { id: 'world', label: '3D World', icon: '🚶' },
  { id: 'map', label: 'Travel', icon: '🚖' },
  { id: 'shop', label: 'Chop/Shop', icon: '🛒' },
  { id: 'housing', label: 'House', icon: '🏠' },
  { id: 'phone', label: 'Phone', icon: '📱' },
  { id: 'settings', label: 'Menu', icon: '⚙️' },
];

export function BottomNav() {
  const { activeModal, setActiveModal, state } = useGameStore();

  const hasPhoneNotification = state.flags.arrears > 0 || state.completedMissions.length < 6;

  return (
    <nav className={styles.navBar} aria-label="Bottom Navigation">
      {NAV_ITEMS.map((item) => {
        const isActive = activeModal === item.id;
        return (
          <button
            key={item.id}
            className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            onClick={() => setActiveModal(item.id)}
            id={`nav-${item.id}`}
            aria-label={item.label}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
            {item.id === 'phone' && hasPhoneNotification && <span className={styles.badge} />}
          </button>
        );
      })}
    </nav>
  );
}
