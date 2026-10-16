'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { WorldHotspot } from './WorldScenes';
import styles from './WorldExplorerModal.module.css';

interface WorldControlsProps {
  activeHotspot: WorldHotspot | null;
  onMoveVectorChange: (vec: { x: number; z: number; isRunning: boolean }) => void;
  onInteract: () => void;
}

export function WorldControls({
  activeHotspot,
  onMoveVectorChange,
  onInteract,
}: WorldControlsProps) {
  const [isRunning, setIsRunning] = useState(false);
  const activeKeysRef = useRef<Set<string>>(new Set());
  const touchDirectionRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;

  // Dispatch current combined vector
  const updateVector = useCallback(() => {
    let kx = 0;
    let kz = 0;

    const keys = activeKeysRef.current;
    if (keys.has('KeyW') || keys.has('ArrowUp')) kz -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) kz += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) kx -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) kx += 1;

    // Combine keyboard + touch D-Pad
    let vx = kx + touchDirectionRef.current.x;
    let vz = kz + touchDirectionRef.current.z;

    // Normalize diagonal
    const len = Math.hypot(vx, vz);
    if (len > 1) {
      vx /= len;
      vz /= len;
    }

    onMoveVectorChange({
      x: vx,
      z: vz,
      isRunning: isRunningRef.current || keys.has('ShiftLeft') || keys.has('ShiftRight'),
    });
  }, [onMoveVectorChange]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'].includes(e.code)) {
        activeKeysRef.current.add(e.code);
        updateVector();
      }

      if (e.code === 'KeyE' || e.code === 'Space') {
        if (activeHotspot) {
          e.preventDefault();
          onInteract();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (activeKeysRef.current.has(e.code)) {
        activeKeysRef.current.delete(e.code);
        updateVector();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeHotspot, onInteract, updateVector]);

  // Touch D-Pad handlers
  const handleTouchDirStart = (dx: number, dz: number) => {
    touchDirectionRef.current = { x: dx, z: dz };
    updateVector();
  };

  const handleTouchDirEnd = () => {
    touchDirectionRef.current = { x: 0, z: 0 };
    updateVector();
  };

  return (
    <div className={styles.controlsOverlay}>
      {/* Active Hotspot Action Button */}
      {activeHotspot && (
        <div className={styles.hotspotActionWrapper}>
          <button
            type="button"
            className={styles.hotspotActionBtn}
            onClick={onInteract}
            id="btn-world-interact"
            aria-label={activeHotspot.label}
          >
            <span className={styles.hotspotIcon}>{activeHotspot.icon}</span>
            <div className={styles.hotspotTextGroup}>
              <span className={styles.hotspotPrompt}>{activeHotspot.prompt}</span>
              <span className={styles.hotspotLabel}>{activeHotspot.label}</span>
            </div>
            <span className={styles.keyHint}>[E]</span>
          </button>
        </div>
      )}

      {/* Bottom Control Bar */}
      <div className={styles.touchControlBar}>
        {/* Virtual 4-Way D-Pad for Mobile */}
        <div className={styles.dpadContainer} aria-label="Virtual D-Pad">
          <div className={styles.dpadRow}>
            <button
              type="button"
              className={styles.dpadBtn}
              onPointerDown={(e) => {
                e.preventDefault();
                handleTouchDirStart(0, -1);
              }}
              onPointerUp={handleTouchDirEnd}
              onPointerLeave={handleTouchDirEnd}
              onPointerCancel={handleTouchDirEnd}
              aria-label="Walk Forward"
            >
              ⬆️
            </button>
          </div>
          <div className={styles.dpadRowMid}>
            <button
              type="button"
              className={styles.dpadBtn}
              onPointerDown={(e) => {
                e.preventDefault();
                handleTouchDirStart(-1, 0);
              }}
              onPointerUp={handleTouchDirEnd}
              onPointerLeave={handleTouchDirEnd}
              onPointerCancel={handleTouchDirEnd}
              aria-label="Walk Left"
            >
              ⬅️
            </button>

            <div className={styles.dpadCenter}>
              <span className={styles.dpadCenterDot} />
            </div>

            <button
              type="button"
              className={styles.dpadBtn}
              onPointerDown={(e) => {
                e.preventDefault();
                handleTouchDirStart(1, 0);
              }}
              onPointerUp={handleTouchDirEnd}
              onPointerLeave={handleTouchDirEnd}
              onPointerCancel={handleTouchDirEnd}
              aria-label="Walk Right"
            >
              ➡️
            </button>
          </div>
          <div className={styles.dpadRow}>
            <button
              type="button"
              className={styles.dpadBtn}
              onPointerDown={(e) => {
                e.preventDefault();
                handleTouchDirStart(0, 1);
              }}
              onPointerUp={handleTouchDirEnd}
              onPointerLeave={handleTouchDirEnd}
              onPointerCancel={handleTouchDirEnd}
              aria-label="Walk Backward"
            >
              ⬇️
            </button>
          </div>
        </div>

        {/* Action Toggle (Sprint & Interact) */}
        <div className={styles.sideActions}>
          <button
            type="button"
            className={`${styles.speedToggleBtn} ${isRunning ? styles.speedActive : ''}`}
            onClick={() => {
              setIsRunning((prev) => !prev);
              isRunningRef.current = !isRunning;
              updateVector();
            }}
            aria-label="Toggle Sprint Run"
          >
            <span>{isRunning ? '🏃 Running' : '🚶 Walking'}</span>
          </button>

          {activeHotspot && (
            <button
              type="button"
              className={styles.directInteractCircle}
              onClick={onInteract}
              aria-label="Interact"
            >
              ⚡
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
