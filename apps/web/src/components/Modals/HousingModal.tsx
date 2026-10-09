'use client';

import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { RULES } from '@warri-vibe/engine';
import modalStyles from './Modal.module.css';

export function HousingModal() {
  const { state, upgradeHouse, setActiveModal } = useGameStore();

  const daysToRent = RULES.rentEvery - ((state.day - 1) % RULES.rentEvery);
  const isRentClose = daysToRent <= 3;
  const isSelfContain = state.housing === 'self_contain';
  const rentDue = RULES.rent[state.housing];
  const canAffordUpgrade = state.money >= RULES.housingUpgradeCost;

  return (
    <div className={modalStyles.overlay} onClick={() => setActiveModal('none')}>
      <div className={modalStyles.modalSheet} onClick={(e) => e.stopPropagation()}>
        <div className={modalStyles.modalHeader}>
          <div className={modalStyles.modalTitle}>
            <span>🏠</span>
            <span>Housing & Landlord Office</span>
          </div>
          <button className={modalStyles.closeBtn} onClick={() => setActiveModal('none')}>
            ✕
          </button>
        </div>

        <div className={modalStyles.modalBody}>
          {/* Current Housing Card */}
          <div className={modalStyles.cardItem} style={{ borderLeft: '4px solid var(--primary)' }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              {isSelfContain ? '✨ Self-Contain Apartment' : '📦 Shared Room (Face-me-I-face-you)'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {isSelfContain
                ? 'Private bathroom, steady calm, 100% base morning wake energy, 15% outage rate.'
                : 'Shared compound, loud neighbours, 80% base morning wake energy, 35% outage rate.'}
            </div>

            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span>Monthly Rent:</span>
              <span style={{ fontWeight: 700, color: 'var(--text-gold)' }}>₦{rentDue.toLocaleString()}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span>Rent Due In:</span>
              <span style={{ fontWeight: 700, color: isRentClose ? 'var(--accent-red)' : 'var(--text-main)' }}>
                {daysToRent} {daysToRent === 1 ? 'Day' : 'Days'}
              </span>
            </div>

            {state.flags.arrears > 0 && (
              <div style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', padding: '6px 10px', borderRadius: 6, fontSize: 12, marginTop: 4 }}>
                ⚠️ Warning: You have {state.flags.arrears} unpaid rent arrears! 2 arrears causes eviction.
              </div>
            )}

            {isRentClose && (
              <div style={{ background: 'rgba(245,158,11,0.15)', color: '#fde047', padding: '6px 10px', borderRadius: 6, fontSize: 12, marginTop: 4 }}>
                ⏰ Rent Warning: Landlord will collect ₦{rentDue.toLocaleString()} on Day {state.day + daysToRent - 1}. Keep funds ready!
              </div>
            )}
          </div>

          {/* Upgrade Section */}
          {!isSelfContain && (
            <div className={modalStyles.cardItem}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Upgrade to Self-Contain</div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Escape noise, increase morning wake energy to 100%, and reduce power cut frequency.
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 4 }}>
                <span>Upgrade Agency & Form Fee:</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-green)' }}>
                  ₦{RULES.housingUpgradeCost.toLocaleString()}
                </span>
              </div>

              <button
                className={modalStyles.primaryActionBtn}
                style={{ marginTop: 8 }}
                disabled={!canAffordUpgrade}
                onClick={upgradeHouse}
                id="btn-upgrade-house"
              >
                {canAffordUpgrade ? 'Pay Agency Fee & Move In' : 'Need ₦35,000 to Upgrade'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
