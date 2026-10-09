'use client';

import React from 'react';
import { useGameStore } from '../../store/gameStore';
import modalStyles from './Modal.module.css';

export function ShopModal() {
  const { state, content, purchaseItem, setActiveModal } = useGameStore();

  return (
    <div className={modalStyles.overlay} onClick={() => setActiveModal('none')}>
      <div className={modalStyles.modalSheet} onClick={(e) => e.stopPropagation()}>
        <div className={modalStyles.modalHeader}>
          <div className={modalStyles.modalTitle}>
            <span>🛒</span>
            <span>Provision Store & Chop Spot</span>
          </div>
          <button className={modalStyles.closeBtn} onClick={() => setActiveModal('none')}>
            ✕
          </button>
        </div>

        <div className={modalStyles.modalBody}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Buy authentic food, data top-up, and electrical backup gear.
          </p>

          <div className={modalStyles.gridCards}>
            {content.items.map((item) => {
              const isOwned = item.oneTime && Boolean(state.inventory[item.id]);
              const canAfford = state.money >= item.price;
              const disabled = isOwned || !canAfford;

              return (
                <div key={item.id} className={modalStyles.cardItem}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-main)' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {item.blurb}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--accent-green)', fontSize: 14 }}>
                      ₦{item.price.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {item.hungerDelta && (
                      <span style={{ fontSize: 11, background: 'rgba(6,182,212,0.15)', color: '#38bdf8', padding: '2px 6px', borderRadius: 4 }}>
                        Hunger {item.hungerDelta}
                      </span>
                    )}
                    {item.moodDelta && (
                      <span style={{ fontSize: 11, background: 'rgba(245,158,11,0.15)', color: '#fde047', padding: '2px 6px', borderRadius: 4 }}>
                        Mood +{item.moodDelta}
                      </span>
                    )}
                    {item.energyDelta && (
                      <span style={{ fontSize: 11, background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', padding: '2px 6px', borderRadius: 4 }}>
                        Energy +{item.energyDelta}
                      </span>
                    )}
                    {item.oneTime && (
                      <span style={{ fontSize: 11, background: 'rgba(168,85,247,0.15)', color: '#d8b4fe', padding: '2px 6px', borderRadius: 4 }}>
                        Permanent Gear
                      </span>
                    )}
                  </div>

                  <button
                    className={modalStyles.primaryActionBtn}
                    style={{ marginTop: 6 }}
                    disabled={disabled}
                    onClick={() => purchaseItem(item.id)}
                    id={`btn-buy-${item.id}`}
                  >
                    {isOwned ? 'Already Purchased' : !canAfford ? 'Cannot Afford' : `Buy (₦${item.price.toLocaleString()})`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
