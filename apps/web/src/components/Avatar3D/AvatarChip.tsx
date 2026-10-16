'use client';

import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { AvatarConfig, DEFAULT_MALE_AVATAR } from '../../types/avatar';
import { AvatarCanvas3D } from './AvatarCanvas3D';
import { playSound } from '../../utils/sound';
import styles from './AvatarChip.module.css';

export function AvatarChip() {
  const { state, setActiveModal } = useGameStore();

  const avatar = (state.flags.avatar as AvatarConfig) || DEFAULT_MALE_AVATAR;
  const isMale = avatar.gender === 'male';

  const handleClick = () => {
    playSound.click();
    setActiveModal('avatar');
  };

  const outfitLabel =
    avatar.outfitStyle === 'senator'
      ? 'Senator'
      : avatar.outfitStyle === 'ankara'
      ? 'Ankara'
      : avatar.outfitStyle === 'owambe'
      ? 'Owambe'
      : 'Street';

  return (
    <button
      type="button"
      className={styles.chip}
      onClick={handleClick}
      id="btn-open-avatar-studio"
      title="Customize your 3D Avatar & Drip"
      aria-label="Open 3D Avatar Studio"
    >
      <div className={styles.avatarViewport}>
        <AvatarCanvas3D
          config={avatar}
          pose="idle"
          energy={state.stats.energy}
          light={state.light}
          size="sm"
          interactive={false}
          showOverlay={false}
        />
      </div>

      <div className={styles.infoArea}>
        <div className={styles.nameRow}>
          <span className={styles.genderTag}>{isMale ? '👨🏾' : '👩🏾'}</span>
          <span className={styles.avatarName}>{avatar.name}</span>
          <span className={styles.editIcon}>✏️</span>
        </div>
        <span className={styles.dripSubtitle}>{outfitLabel} Drip</span>
      </div>
    </button>
  );
}
