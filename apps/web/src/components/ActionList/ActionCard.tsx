'use client';

import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { canDo, successChance, type ActionDef } from '@warri-vibe/engine';
import styles from './ActionList.module.css';

interface ActionCardProps {
  action: ActionDef;
}

export function ActionCard({ action }: ActionCardProps) {
  const { state, doAction } = useGameStore();

  const disabledReason = canDo(state, action);
  const isAvailable = disabledReason === null;
  const chance = Math.round(successChance(state, action) * 100);

  const [minPay, maxPay] = action.money;
  const isFree = minPay === 0 && maxPay === 0;

  return (
    <div
      className={`${styles.card} ${isAvailable ? styles.cardAvailable : styles.cardDisabled}`}
      id={`action-${action.id}`}
    >
      <div className={styles.cardTop}>
        <span className={styles.actionLabel}>{action.label}</span>
        {isFree ? (
          <span className={`${styles.payoutBadge} ${styles.freePayoutBadge}`}>Rest & Recharge</span>
        ) : (
          <span className={styles.payoutBadge}>
            ₦{minPay.toLocaleString()} - ₦{maxPay.toLocaleString()}
          </span>
        )}
      </div>

      <div className={styles.metaRow}>
        <span className={styles.tag}>⏳ {action.slots} {action.slots === 1 ? 'Slot' : 'Slots'}</span>
        {action.energy > 0 && <span className={styles.tag}>⚡ {action.energy} Energy</span>}
        {action.skill && <span className={styles.tag}>🎯 {action.skill}</span>}
        {!isFree && <span className={`${styles.tag} ${styles.chanceTag}`}>🎯 {chance}% Odds</span>}
      </div>

      {disabledReason && (
        <div className={styles.disabledReason}>
          <span>⚠️ {disabledReason}</span>
        </div>
      )}

      <button
        className={styles.actionBtn}
        onClick={() => doAction(action.id)}
        disabled={!isAvailable}
        id={`btn-do-${action.id}`}
      >
        {isAvailable ? (isFree ? 'Take Rest' : 'Start Hustle') : 'Unavailable'}
      </button>
    </div>
  );
}
