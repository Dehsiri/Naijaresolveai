'use client';

import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { playSound } from '../../utils/sound';
import modalStyles from './Modal.module.css';

type PhoneTab = 'chat' | 'bank' | 'missions';

interface Message {
  from: 'player' | 'npc';
  text: string;
}

const NPC_CHATS: Record<string, { prompts: { label: string; reply: string; affinity: number }[] }> = {
  mama_tonye: {
    prompts: [
      {
        label: 'Mama Tonye, how market today?',
        reply: 'My pikin, customers full ground! If you come shift today, be sharp with change o.',
        affinity: 2,
      },
      {
        label: 'Mama, any new stock arriving?',
        reply: 'Yes o, carton of biscuit and milk don land. Warri people like sweet things.',
        affinity: 2,
      },
      {
        label: 'Thank you for looking out for me, Mama.',
        reply: 'Hard work dey pay. Stay honest, your pocket go heavy.',
        affinity: 3,
      },
    ],
  },
  ejiro: {
    prompts: [
      {
        label: 'Ejiro my guy! Which area get traffic today?',
        reply: 'Effurun Roundabout get small go-slow, but shortcuts dey through refinery road!',
        affinity: 2,
      },
      {
        label: 'Any groove or owambe this weekend?',
        reply: 'Every weekend na party for Delta! Make sure your outfit clean, vibes go loud.',
        affinity: 3,
      },
      {
        label: 'How keke business dey move?',
        reply: 'Fuel price dey try test us, but Warri no dey carry last!',
        affinity: 2,
      },
    ],
  },
  chief_oghenemine: {
    prompts: [
      {
        label: 'Elder Mine, good day sir!',
        reply: 'Good day young hustle. Discipline and consistency open doors in this market.',
        affinity: 2,
      },
      {
        label: 'I am working hard towards my table deposit.',
        reply: 'Keep grinding. When your ₦12,000 is complete, Section A is waiting for you.',
        affinity: 3,
      },
    ],
  },
  blessing_tailor: {
    prompts: [
      {
        label: 'Blessing, what style is trending now?',
        reply: 'Senator wear with sharp neck embroidery! Everybody want look like governor.',
        affinity: 2,
      },
      {
        label: 'Can you advise me on aso-ebi fabrics?',
        reply: 'Quality over quantity anytime. When you dress sharp, respect follow.',
        affinity: 2,
      },
    ],
  },
};

export function PhoneModal() {
  const { state, content, setActiveModal, showToast } = useGameStore();
  const [tab, setTab] = useState<PhoneTab>('chat');
  const [activeNpcId, setActiveNpcId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Record<string, Message[]>>({
    mama_tonye: [{ from: 'npc', text: 'Welcome to Warri, pikin. Hustle well and greet customers with smile.' }],
    ejiro: [{ from: 'npc', text: 'My guy! Any time you need keke run, holla me.' }],
    chief_oghenemine: [{ from: 'npc', text: 'Respect the market rules and you will prosper.' }],
    blessing_tailor: [{ from: 'npc', text: 'Styling na identity. Keep your vibe sharp.' }],
  });

  const activeNpc = content.npcs.find((n) => n.id === activeNpcId);

  const sendMessage = (npcId: string, label: string, reply: string, affinityGain: number) => {
    playSound.click();
    setChatHistory((prev) => ({
      ...prev,
      [npcId]: [
        ...(prev[npcId] || []),
        { from: 'player', text: label },
        { from: 'npc', text: reply },
      ],
    }));

    if (state.affinity[npcId] !== undefined) {
      state.affinity[npcId] = Math.min(100, (state.affinity[npcId] || 0) + affinityGain);
    }
    showToast(`Friendship with ${activeNpc?.name || 'NPC'} increased!`);
  };

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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            borderBottom: '1px solid var(--glass-border)',
            background: 'rgba(0,0,0,0.2)',
          }}
        >
          <button
            onClick={() => {
              setTab('chat');
              setActiveNpcId(null);
            }}
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
            onClick={() => {
              setTab('bank');
              setActiveNpcId(null);
            }}
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
            onClick={() => {
              setTab('missions');
              setActiveNpcId(null);
            }}
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
          {tab === 'chat' && !activeNpcId && (
            <div className={modalStyles.gridCards}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Tap any contact to chat, get street gossip, and build friendship affinity.
              </div>

              {content.npcs.map((npc) => {
                const affinity = state.affinity[npc.id] || 0;
                return (
                  <div
                    key={npc.id}
                    className={modalStyles.cardItem}
                    onClick={() => setActiveNpcId(npc.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>💬 {npc.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-gold)', fontWeight: 700 }}>
                        Affinity: {affinity}%
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {npc.role} · {npc.home}
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--text-main)',
                        background: 'rgba(0,0,0,0.25)',
                        padding: '6px 8px',
                        borderRadius: 6,
                        marginTop: 4,
                      }}
                    >
                      {chatHistory[npc.id]?.[chatHistory[npc.id].length - 1]?.text || npc.bio}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* ACTIVE CHAT ROOM */}
          {tab === 'chat' && activeNpcId && activeNpc && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => setActiveNpcId(null)}
                    style={{ color: 'var(--text-gold)', fontWeight: 700, fontSize: 14 }}
                  >
                    ← Back
                  </button>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{activeNpc.name}</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-gold)' }}>
                  Affinity: {state.affinity[activeNpc.id] || 0}%
                </span>
              </div>

              {/* Message History */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  maxHeight: 220,
                  overflowY: 'auto',
                  padding: 8,
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: 8,
                }}
              >
                {(chatHistory[activeNpc.id] || []).map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      alignSelf: msg.from === 'player' ? 'flex-end' : 'flex-start',
                      background:
                        msg.from === 'player'
                          ? 'linear-gradient(135deg, #065f46, #047857)'
                          : 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      padding: '8px 12px',
                      borderRadius: 12,
                      fontSize: 13,
                      maxWidth: '85%',
                      lineHeight: 1.4,
                    }}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>

              {/* Dialogue Prompt Choices */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                  Send WhatsApp Gist:
                </div>
                {(NPC_CHATS[activeNpc.id]?.prompts || []).map((p, idx) => (
                  <button
                    key={idx}
                    className={modalStyles.secondaryBtn}
                    style={{ textAlign: 'left', justifyContent: 'flex-start', fontSize: 12 }}
                    onClick={() => sendMessage(activeNpc.id, p.label, p.reply, p.affinity)}
                  >
                    💬 {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* BANK LEDGER TAB */}
          {tab === 'bank' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #065f46, #047857)',
                  padding: 14,
                  borderRadius: 12,
                  color: '#fff',
                  boxShadow: '0 4px 16px rgba(6,95,70,0.3)',
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.8 }}>Available Cash Balance</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>₦{state.money.toLocaleString()}</div>
                <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
                  Account: 0123456789 (Warri Kuda Microfinance)
                </div>
              </div>

              <div style={{ fontWeight: 700, fontSize: 14, marginTop: 4 }}>
                Transaction History ({state.ledger.length})
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  maxHeight: 240,
                  overflowY: 'auto',
                }}
              >
                {state.ledger
                  .slice()
                  .reverse()
                  .map((entry, idx) => (
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
                        {entry.amount >= 0
                          ? `+₦${entry.amount.toLocaleString()}`
                          : `-₦${Math.abs(entry.amount).toLocaleString()}`}
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
                Complete Chapter 1 missions to build your respect and unlock the Market Table Lease!
              </div>

              {content.missions.map((m, idx) => {
                const isDone = state.completedMissions.includes(m.id);
                return (
                  <div
                    key={m.id}
                    className={modalStyles.cardItem}
                    style={{
                      borderLeft: isDone ? '4px solid var(--accent-green)' : '4px solid var(--primary)',
                    }}
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
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{m.text}</p>
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
