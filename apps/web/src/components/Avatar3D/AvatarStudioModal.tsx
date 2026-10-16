'use client';

import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  AvatarConfig,
  SKIN_TONES,
  OUTFIT_PALETTES,
  MALE_HAIRSTYLES,
  FEMALE_HAIRSTYLES,
  DEFAULT_MALE_AVATAR,
  DEFAULT_FEMALE_AVATAR,
} from '../../types/avatar';
import { AvatarCanvas3D } from './AvatarCanvas3D';
import { playSound } from '../../utils/sound';
import styles from './AvatarStudioModal.module.css';

type StudioTab = 'identity' | 'attire' | 'hair' | 'bling' | 'poses';

export function AvatarStudioModal() {
  const { state, updateAvatar, setActiveModal, showToast } = useGameStore();

  const currentSavedAvatar = (state.flags.avatar as AvatarConfig) || DEFAULT_MALE_AVATAR;

  const [draft, setDraft] = useState<AvatarConfig>({ ...currentSavedAvatar });
  const [activeTab, setActiveTab] = useState<StudioTab>('identity');
  const [activePose, setActivePose] = useState<'idle' | 'groove' | 'wave' | 'proud' | 'hustle'>('idle');

  const isMale = draft.gender === 'male';

  // Gender Switch
  const handleGenderSwitch = (gender: 'male' | 'female') => {
    playSound.click();
    if (gender === 'male') {
      setDraft((prev) => ({
        ...DEFAULT_MALE_AVATAR,
        name: prev.name.startsWith('Sisi') ? 'Bros Efe' : prev.name,
        skinTone: prev.skinTone,
      }));
    } else {
      setDraft((prev) => ({
        ...DEFAULT_FEMALE_AVATAR,
        name: prev.name.startsWith('Bros') ? 'Sisi Blessing' : prev.name,
        skinTone: prev.skinTone,
      }));
    }
  };

  // Quick Preset
  const applyPreset = (presetName: string) => {
    playSound.click();
    if (presetName === 'senator') {
      setDraft({
        ...DEFAULT_MALE_AVATAR,
        name: 'Bros Efe',
        outfitStyle: 'senator',
        outfitColor: '#0d5c3a',
        accentColor: '#f59e0b',
        hairStyle: 'fade',
        goldChain: true,
        coralBeads: false,
        sunglasses: false,
      });
    } else if (presetName === 'queen') {
      setDraft({
        ...DEFAULT_FEMALE_AVATAR,
        name: 'Sisi Blessing',
        outfitStyle: 'ankara',
        outfitColor: '#831843',
        accentColor: '#fbbf24',
        hairStyle: 'gele',
        coralBeads: true,
        earrings: true,
        sunglasses: false,
      });
    } else if (presetName === 'street') {
      setDraft({
        gender: 'male',
        name: 'Warri Boy',
        skinTone: draft.skinTone,
        outfitStyle: 'casual',
        outfitColor: '#1f2937',
        accentColor: '#10b981',
        hairStyle: 'afro',
        hairColor: '#111827',
        sunglasses: true,
        goldChain: true,
        coralBeads: false,
        wristwatch: true,
        earrings: false,
      });
    } else if (presetName === 'owambe') {
      setDraft({
        gender: 'female',
        name: 'Owambe Queen',
        skinTone: draft.skinTone,
        outfitStyle: 'owambe',
        outfitColor: '#f8fafc',
        accentColor: '#d97706',
        hairStyle: 'gele',
        hairColor: '#111827',
        sunglasses: false,
        goldChain: false,
        coralBeads: true,
        wristwatch: true,
        earrings: true,
      });
    }
  };

  // Randomize Drip
  const handleRandomize = () => {
    playSound.coin();
    const randomSkin = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)].color;
    const randomPalette = OUTFIT_PALETTES[Math.floor(Math.random() * OUTFIT_PALETTES.length)];
    const hairstyles = isMale ? MALE_HAIRSTYLES : FEMALE_HAIRSTYLES;
    const randomHair = hairstyles[Math.floor(Math.random() * hairstyles.length)].id as any;

    setDraft((prev) => ({
      ...prev,
      skinTone: randomSkin,
      outfitColor: randomPalette.primary,
      accentColor: randomPalette.accent,
      hairStyle: randomHair,
      sunglasses: Math.random() > 0.5,
      goldChain: isMale ? Math.random() > 0.3 : Math.random() > 0.7,
      coralBeads: !isMale ? true : Math.random() > 0.7,
    }));
  };

  // Save Avatar
  const handleSave = () => {
    playSound.fanfare();
    updateAvatar(draft);
    showToast('✨ Drip updated! You dey look sharp!');
    setActiveModal('none');
  };

  return (
    <div className={styles.modalOverlay} onClick={() => setActiveModal('none')}>
      <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <span className={styles.titleIcon}>✨</span>
            <div>
              <h2 className={styles.title}>Warri 3D Avatar Studio</h2>
              <p className={styles.subtitle}>Customize your character drip & street posture</p>
            </div>
          </div>
          <button
            className={styles.closeBtn}
            onClick={() => setActiveModal('none')}
            aria-label="Close studio"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className={styles.scrollArea}>
          {/* Live 3D Viewport Stage */}
          <div className={styles.stageContainer}>
            <AvatarCanvas3D
              config={draft}
              pose={activePose}
              energy={state.stats.energy}
              light={state.light}
              size="hero"
            />
          </div>

          {/* Quick Gender Switcher */}
          <div className={styles.genderToggleRow}>
            <button
              type="button"
              className={`${styles.genderBtn} ${isMale ? styles.genderBtnActive : ''}`}
              onClick={() => handleGenderSwitch('male')}
              id="btn-gender-male"
            >
              <span>👨🏾</span>
              <span>Bros (Male)</span>
            </button>
            <button
              type="button"
              className={`${styles.genderBtn} ${!isMale ? styles.genderBtnActive : ''}`}
              onClick={() => handleGenderSwitch('female')}
              id="btn-gender-female"
            >
              <span>👩🏾</span>
              <span>Sisi (Female)</span>
            </button>
          </div>

          {/* Quick Drip Presets */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <span>⚡ Quick Delta Styles</span>
            </div>
            <div className={styles.optionsGrid}>
              <button
                type="button"
                className={styles.optionBtn}
                onClick={() => applyPreset('senator')}
              >
                <span>🤵🏾</span>
                <span>Warri Senator</span>
              </button>
              <button
                type="button"
                className={styles.optionBtn}
                onClick={() => applyPreset('queen')}
              >
                <span>👑</span>
                <span>Delta Queen</span>
              </button>
              <button
                type="button"
                className={styles.optionBtn}
                onClick={() => applyPreset('street')}
              >
                <span>🧢</span>
                <span>Street Hustler</span>
              </button>
              <button
                type="button"
                className={styles.optionBtn}
                onClick={() => applyPreset('owambe')}
              >
                <span>✨</span>
                <span>Owambe Royale</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className={styles.tabBar}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'identity' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('identity')}
            >
              👤 Identity & Complexion
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'attire' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('attire')}
            >
              👕 Outfits & Colors
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'hair' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('hair')}
            >
              💇 {isMale ? 'Hair / Cap' : 'Gele / Braids'}
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'bling' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('bling')}
            >
              💍 Bling & Beads
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'poses' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('poses')}
            >
              🕺 Vibes & Dance
            </button>
          </div>

          {/* Tab 1: Identity */}
          {activeTab === 'identity' && (
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <span>Character Name</span>
              </div>
              <input
                type="text"
                className={styles.inputField}
                value={draft.name}
                maxLength={20}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Enter character name..."
              />

              <div className={styles.sectionHeader} style={{ marginTop: 8 }}>
                <span>Skin Complexion</span>
              </div>
              <div className={styles.swatchRow}>
                {SKIN_TONES.map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    className={`${styles.swatchBtn} ${
                      draft.skinTone === tone.color ? styles.swatchBtnActive : ''
                    }`}
                    style={{ backgroundColor: tone.color }}
                    onClick={() => {
                      playSound.click();
                      setDraft({ ...draft, skinTone: tone.color });
                    }}
                    title={tone.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Attire & Colors */}
          {activeTab === 'attire' && (
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <span>Outfit Style</span>
              </div>
              <div className={styles.optionsGrid}>
                {isMale ? (
                  <>
                    <button
                      type="button"
                      className={`${styles.optionBtn} ${
                        draft.outfitStyle === 'senator' ? styles.optionBtnActive : ''
                      }`}
                      onClick={() => setDraft({ ...draft, outfitStyle: 'senator' })}
                    >
                      <span>🤵🏾</span>
                      <span>Senator Suit</span>
                    </button>
                    <button
                      type="button"
                      className={`${styles.optionBtn} ${
                        draft.outfitStyle === 'casual' ? styles.optionBtnActive : ''
                      }`}
                      onClick={() => setDraft({ ...draft, outfitStyle: 'casual' })}
                    >
                      <span>👕</span>
                      <span>Streetwear Tee</span>
                    </button>
                    <button
                      type="button"
                      className={`${styles.optionBtn} ${
                        draft.outfitStyle === 'owambe' ? styles.optionBtnActive : ''
                      }`}
                      onClick={() => setDraft({ ...draft, outfitStyle: 'owambe' })}
                    >
                      <span>🪡</span>
                      <span>Owambe Agbada</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className={`${styles.optionBtn} ${
                        draft.outfitStyle === 'ankara' ? styles.optionBtnActive : ''
                      }`}
                      onClick={() => setDraft({ ...draft, outfitStyle: 'ankara' })}
                    >
                      <span>👗</span>
                      <span>Ankara Peplum</span>
                    </button>
                    <button
                      type="button"
                      className={`${styles.optionBtn} ${
                        draft.outfitStyle === 'senator' ? styles.optionBtnActive : ''
                      }`}
                      onClick={() => setDraft({ ...draft, outfitStyle: 'senator' })}
                    >
                      <span>🤵🏾‍♀️</span>
                      <span>Chic Senator</span>
                    </button>
                    <button
                      type="button"
                      className={`${styles.optionBtn} ${
                        draft.outfitStyle === 'owambe' ? styles.optionBtnActive : ''
                      }`}
                      onClick={() => setDraft({ ...draft, outfitStyle: 'owambe' })}
                    >
                      <span>✨</span>
                      <span>Owambe Lace</span>
                    </button>
                  </>
                )}
              </div>

              <div className={styles.sectionHeader} style={{ marginTop: 8 }}>
                <span>Fabric Colorway</span>
              </div>
              <div className={styles.swatchRow}>
                {OUTFIT_PALETTES.map((pal) => (
                  <button
                    key={pal.id}
                    type="button"
                    className={`${styles.swatchBtn} ${
                      draft.outfitColor === pal.primary ? styles.swatchBtnActive : ''
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${pal.primary} 60%, ${pal.accent} 60%)`,
                    }}
                    onClick={() => {
                      playSound.click();
                      setDraft({
                        ...draft,
                        outfitColor: pal.primary,
                        accentColor: pal.accent,
                      });
                    }}
                    title={pal.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Hairstyles / Headwear */}
          {activeTab === 'hair' && (
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <span>{isMale ? 'Male Hair & Headwear' : 'Female Hair & Gele'}</span>
              </div>
              <div className={styles.optionsGrid}>
                {(isMale ? MALE_HAIRSTYLES : FEMALE_HAIRSTYLES).map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    className={`${styles.optionBtn} ${
                      draft.hairStyle === h.id ? styles.optionBtnActive : ''
                    }`}
                    onClick={() => {
                      playSound.click();
                      setDraft({ ...draft, hairStyle: h.id as any });
                    }}
                  >
                    <span>{h.id === 'gele' ? '👑' : h.id === 'fila' ? '🧢' : '✂️'}</span>
                    <span>{h.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Bling & Accessories */}
          {activeTab === 'bling' && (
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <span>Jewelry & Street Accessories</span>
              </div>

              <label className={styles.toggleRow}>
                <span className={styles.toggleLabel}>
                  <span>🕶️</span>
                  <span>Designer Sunglasses</span>
                </span>
                <div
                  className={`${styles.switchIndicator} ${
                    draft.sunglasses ? styles.switchIndicatorOn : ''
                  }`}
                  onClick={() => setDraft({ ...draft, sunglasses: !draft.sunglasses })}
                >
                  <div className={styles.switchKnob} />
                </div>
              </label>

              <label className={styles.toggleRow}>
                <span className={styles.toggleLabel}>
                  <span>⛓️</span>
                  <span>Gold Cuban Chain</span>
                </span>
                <div
                  className={`${styles.switchIndicator} ${
                    draft.goldChain ? styles.switchIndicatorOn : ''
                  }`}
                  onClick={() => setDraft({ ...draft, goldChain: !draft.goldChain })}
                >
                  <div className={styles.switchKnob} />
                </div>
              </label>

              <label className={styles.toggleRow}>
                <span className={styles.toggleLabel}>
                  <span>📿</span>
                  <span>Royal Edo/Delta Coral Beads</span>
                </span>
                <div
                  className={`${styles.switchIndicator} ${
                    draft.coralBeads ? styles.switchIndicatorOn : ''
                  }`}
                  onClick={() => setDraft({ ...draft, coralBeads: !draft.coralBeads })}
                >
                  <div className={styles.switchKnob} />
                </div>
              </label>

              <label className={styles.toggleRow}>
                <span className={styles.toggleLabel}>
                  <span>⌚</span>
                  <span>Gold Wristwatch</span>
                </span>
                <div
                  className={`${styles.switchIndicator} ${
                    draft.wristwatch ? styles.switchIndicatorOn : ''
                  }`}
                  onClick={() => setDraft({ ...draft, wristwatch: !draft.wristwatch })}
                >
                  <div className={styles.switchKnob} />
                </div>
              </label>

              {!isMale && (
                <label className={styles.toggleRow}>
                  <span className={styles.toggleLabel}>
                    <span>💎</span>
                    <span>Gold Hoop Earrings</span>
                  </span>
                  <div
                    className={`${styles.switchIndicator} ${
                      draft.earrings ? styles.switchIndicatorOn : ''
                    }`}
                    onClick={() => setDraft({ ...draft, earrings: !draft.earrings })}
                  >
                    <div className={styles.switchKnob} />
                  </div>
                </label>
              )}
            </div>
          )}

          {/* Tab 5: Vibes & Poses */}
          {activeTab === 'poses' && (
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <span>Street Posture & Dance Moves</span>
              </div>
              <div className={styles.optionsGrid}>
                <button
                  type="button"
                  className={`${styles.optionBtn} ${
                    activePose === 'idle' ? styles.optionBtnActive : ''
                  }`}
                  onClick={() => {
                    playSound.click();
                    setActivePose('idle');
                  }}
                >
                  <span>🧘🏾</span>
                  <span>Cool Idle</span>
                </button>
                <button
                  type="button"
                  className={`${styles.optionBtn} ${
                    activePose === 'groove' ? styles.optionBtnActive : ''
                  }`}
                  onClick={() => {
                    playSound.click();
                    setActivePose('groove');
                  }}
                >
                  <span>🕺🏾</span>
                  <span>Warri Groove Dance</span>
                </button>
                <button
                  type="button"
                  className={`${styles.optionBtn} ${
                    activePose === 'wave' ? styles.optionBtnActive : ''
                  }`}
                  onClick={() => {
                    playSound.click();
                    setActivePose('wave');
                  }}
                >
                  <span>👋🏾</span>
                  <span>Delta Welcome Wave</span>
                </button>
                <button
                  type="button"
                  className={`${styles.optionBtn} ${
                    activePose === 'proud' ? styles.optionBtnActive : ''
                  }`}
                  onClick={() => {
                    playSound.click();
                    setActivePose('proud');
                  }}
                >
                  <span>👑</span>
                  <span>Street Don Stance</span>
                </button>
                <button
                  type="button"
                  className={`${styles.optionBtn} ${
                    activePose === 'hustle' ? styles.optionBtnActive : ''
                  }`}
                  onClick={() => {
                    playSound.click();
                    setActivePose('hustle');
                  }}
                >
                  <span>✊🏾</span>
                  <span>Hustle Fist Pump</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={styles.footerBar}>
          <button
            type="button"
            className={styles.randomBtn}
            onClick={handleRandomize}
            title="Randomize style"
          >
            <span>🎲</span>
            <span>Surprise Me</span>
          </button>
          <button
            type="button"
            className={styles.randomBtn}
            onClick={() => {
              handleSave();
              setActiveModal('world');
            }}
            title="Save and walk around in 3D"
          >
            <span>🚶</span>
            <span>Walk in 3D</span>
          </button>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSave}
            id="btn-save-avatar"
          >
            <span>💾</span>
            <span>Save & Rock Drip</span>
          </button>
        </div>
      </div>
    </div>
  );
}
