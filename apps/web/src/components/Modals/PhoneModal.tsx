'use client';

import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import modalStyles from './Modal.module.css';

type PhoneTab = 'chat' | 'bank' | 'missions';

export function PhoneModal() {
  const { state, content, setActiveModal } = useGameStore();
  const [tab, setTab] = useState<PhoneTab>('chat');

  return (
    <div className={modalStyles.overlay} onClick={() => setActiveModal('none')}>
      <div className={modalStyles.modalSheet} onClick={(e) => e.stopPropagation()}>
        <div className={modalStyles.modalHeader}>
          <div className={modalStyles.modalTitle}>
            <span>📱</span>
            <span>Tecno Spark · Warri Dial</span>
          </div>
          <button className={modalStyles.closeBtn} onClick={() => setActiveModal('none')}>
            ✕
          </button>
        </div>

        {/* Phone Nav Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
          <button
            onClick={() => setTab('chat')}
            style={{
              padding: '10px 4px',
              fontWeight: 700,
              fontSize: 13,
              color: tab === 'chat' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: tab === 'chat' ? '2px solid var(--primary)' : 'none',
            }}
          >
            💬 Gist / Chats
          </button>
          <button
            onClick={() => setTab('bank')}
            style={{
              padding: '10px 4px',
              fontWeight: 700,
              fontSize: 13,
              color: tab === 'bank' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: tab === 'bank' ? '2px solid var(--primary)' : 'none',
            }}
          >
            🏦 Kuda Bank
          </button>
          <button
            onClick={() => setTab('missions')}
            style={{
              padding: '10px 4px',
              fontWeight: 700,
              fontSize: 13,
              color: tab === 'missions' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: tab === 'missions' ? '2px solid var(--primary)' : 'none',
            }}
          >
            🎯 Chapter 1
          </button>
        </div>

        <div className={modalStyles.modalBody}>
          {/* CHAT TAB */}
          {tab === 'chat' && (
            <div className={modalStyles.gridCards}>
              {content.npcs.map((npc) => {
                const affinity = state.affinity[npc.id] || 0;
                return (
                  <div key={npc.id} className={modalStyles.cardItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{npc.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-gold)' }}>Friendship: {affinity}%</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Role: {npc.role} ({npc.home})</div>
                    <p style={{ fontSize: 12, color: 'var(--text-main)', background: 'rgba(0,0,0,0.25)', padding: '6px 8px', borderRadius: 6 }}>
                      {npc.bio}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* BANK LEDGER TAB */}
          {tab === 'bank' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'linear-gradient(135deg, #065f46, #047857)', padding: 14, borderRadius: 12, color: '#fff' }}>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Available Balance</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>₦{state.money.toLocaleString()}</div>
                <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>Account: 0123456789 (Warri Microfinance)</div>
              </div>

              <div style={{ fontWeight: 700, fontSize: 14, marginTop: 4 }}>Recent Transactions ({state.ledger.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
                {state.ledger.slice().reverse().map((entry, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 10px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 6,
                      fontSize: 13,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{entry.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Day {entry.day}</div>
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: entry.amount >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                      }}
                    >
                      {entry.amount >= 0 ? `+₦${entry.amount.toLocaleString()}` : `-₦${Math.abs(entry.amount).toLocaleString()}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MISSIONS TAB */}
          {tab === 'missions' && (
            <div className={modalStyles.gridCards}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Complete missions to build your reputation and unlock Chapter 1 Finale (Rent a Market Table).
              </div>

              {content.missions.map((m, idx) => {
                const isDone = state.completedMissions.includes(m.id);
                return (
                  <div
                    key={m.id}
                    className={modalStyles.cardItem}
                    style={{ borderLeft: isDone ? '4px solid var(--accent-green)' : '4px solid var(--primary)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>
                        Mission {idx + 1}: {m.title}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: isDone ? 'var(--accent-green)' : 'var(--text-gold)',
                          background: isDone ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                          padding: '2px 6px',
                          borderRadius: 4,
                        }}
                      >
                        {isDone ? '✓ Completed' : 'In Progress'}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.text}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
