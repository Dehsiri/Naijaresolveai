'use client';

import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import modalStyles from './Modal.module.css';

export function SettingsModal() {
  const { state, exportSaveCode, importSaveCode, startNewGame, setActiveModal, showToast } = useGameStore();
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleExport = () => {
    const code = exportSaveCode();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      showToast('Save code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const res = importSaveCode(importText);
    if (!res.ok) {
      alert(`Import error: ${res.error}`);
    } else {
      setImportText('');
    }
  };

  const handleReset = () => {
    if (window.confirm('Start fresh game? All unsaved local progress will reset.')) {
      startNewGame();
    }
  };

  return (
    <div className={modalStyles.overlay} onClick={() => setActiveModal('none')}>
      <div className={modalStyles.modalSheet} onClick={(e) => e.stopPropagation()}>
        <div className={modalStyles.modalHeader}>
          <div className={modalStyles.modalTitle}>
            <span>⚙️</span>
            <span>Settings & Save Manager</span>
          </div>
          <button className={modalStyles.closeBtn} onClick={() => setActiveModal('none')}>
            ✕
          </button>
        </div>

        <div className={modalStyles.modalBody}>
          {/* Save Envelope Management */}
          <div className={modalStyles.cardItem}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>💾 Backup & Transfer Save</div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Export your game progress as a portable Base64 save code or import from another device.
            </p>

            <button className={modalStyles.secondaryBtn} onClick={handleExport} id="btn-export-save">
              <span>{copied ? '✓ Copied to Clipboard!' : '📋 Copy Base64 Save Code'}</span>
            </button>

            <div style={{ marginTop: 8 }}>
              <input
                type="text"
                placeholder="Paste save code here..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 12,
                }}
              />
              <button
                className={modalStyles.secondaryBtn}
                style={{ marginTop: 6, width: '100%' }}
                onClick={handleImport}
                disabled={!importText.trim()}
                id="btn-import-save"
              >
                <span>📥 Restore Save</span>
              </button>
            </div>
          </div>

          {/* New Game */}
          <div className={modalStyles.cardItem}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>🔄 New Hustle</div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Restart Day 1 with ₦5,000 cash and baseline skills.
            </p>
            <button
              className={modalStyles.secondaryBtn}
              style={{ color: 'var(--accent-red)' }}
              onClick={handleReset}
              id="btn-reset-game"
            >
              <span>⚠️ Start New Game</span>
            </button>
          </div>

          {/* About */}
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            WARRI VIBE v0.1 · Mobile-First Life Sim<br />
            Deterministic Pure TypeScript Engine · Offline PWA
          </div>
        </div>
      </div>
    </div>
  );
}
