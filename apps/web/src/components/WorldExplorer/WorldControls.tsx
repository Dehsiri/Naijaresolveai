'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { WorldHotspot } from './WorldScenes';
import styles from './WorldExplorerModal.module.css';

interface WorldControlsProps {
  activeHotspot: WorldHotspot | null;
  onMoveVectorChange: (vec: { x: number; z: number; isRunning: boolean }) => void;
  onJump: () => void;
  onInteract: () => void;
}

export function WorldControls({
  activeHotspot,
  onMoveVectorChange,
  onJump,
  onInteract,
}: WorldControlsProps) {
  const [isRunning, setIsRunning] = useState(true); // Default to agile Run/Hustle mode!
  const activeKeysRef = useRef<Set<string>>(new Set());
  const touchDirectionRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;

  const dpadRef = useRef<HTMLDivElement>(null);
  const isDraggingDpadRef = useRef(false);

  // Dispatch current combined movement vector
  const updateVector = useCallback(() => {
    let kx = 0;
    let kz = 0;

    const keys = activeKeysRef.current;
    if (keys.has('KeyW') || keys.has('ArrowUp')) kz -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) kz += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) kx -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) kx += 1;

    // Combine keyboard + touch D-Pad / analog stick
    let vx = kx + touchDirectionRef.current.x;
    let vz = kz + touchDirectionRef.current.z;

    // Normalize diagonal / analog vector
    const len = Math.hypot(vx, vz);
    if (len > 1) {
      vx /= len;
      vz /= len;
    }

    const shiftHeld = keys.has('ShiftLeft') || keys.has('ShiftRight');

    onMoveVectorChange({
      x: vx,
      z: vz,
      isRunning: isRunningRef.current || shiftHeld,
    });
  }, [onMoveVectorChange]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (
        [
          'KeyW',
          'KeyS',
          'KeyA',
          'KeyD',
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'ShiftLeft',
          'ShiftRight',
        ].includes(e.code)
      ) {
        activeKeysRef.current.add(e.code);
        updateVector();
      }

      if (e.code === 'KeyR') {
        setIsRunning((prev) => {
          const next = !prev;
          isRunningRef.current = next;
          updateVector();
          return next;
        });
      }

      if (e.code === 'Space') {
        e.preventDefault();
        onJump();
      }

      if (e.code === 'KeyE' || e.code === 'Enter') {
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
  }, [activeHotspot, onInteract, onJump, updateVector]);

  // Touch D-Pad & 360° Analog Drag handlers
  const handleTouchDirStart = (dx: number, dz: number) => {
    const len = Math.hypot(dx, dz) || 1;
    touchDirectionRef.current = { x: dx / len, z: dz / len };
    updateVector();
  };

  const handleTouchDirEnd = () => {
    isDraggingDpadRef.current = false;
    touchDirectionRef.current = { x: 0, z: 0 };
    updateVector();
  };

  const handleDpadPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingDpadRef.current || !dpadRef.current) return;
    const rect = dpadRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist < 10) {
      touchDirectionRef.current = { x: 0, z: 0 };
    } else {
      touchDirectionRef.current = { x: dx / dist, z: dy / dist };
    }
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
        {/* Virtual 8-Way D-Pad & 360° Touch Stick */}
        <div
          ref={dpadRef}
          className={styles.dpadContainer}
          aria-label="Virtual 3D Movement Pad"
          onPointerDown={(e) => {
            isDraggingDpadRef.current = true;
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              // ignore capture error on synthetic events
            }
            handleDpadPointerMove(e);
          }}
          onPointerMove={handleDpadPointerMove}
          onPointerUp={handleTouchDirEnd}
          onPointerCancel={handleTouchDirEnd}
        >
          {/* Row 1: Up-Left, Up, Up-Right */}
          <button
            type="button"
            className={styles.dpadBtnDiag}
            onPointerDown={(e) => {
              e.stopPropagation();
              handleTouchDirStart(-1, -1);
            }}
            onPointerUp={handleTouchDirEnd}
            onPointerLeave={handleTouchDirEnd}
            aria-label="Move Forward Left"
          >
            ↖
          </button>
          <button
            type="button"
            className={styles.dpadBtn}
            onPointerDown={(e) => {
              e.stopPropagation();
              handleTouchDirStart(0, -1);
            }}
            onPointerUp={handleTouchDirEnd}
            onPointerLeave={handleTouchDirEnd}
            aria-label="Move Forward"
            id="btn-move-forward"
          >
            ⬆️
          </button>
          <button
            type="button"
            className={styles.dpadBtnDiag}
            onPointerDown={(e) => {
              e.stopPropagation();
              handleTouchDirStart(1, -1);
            }}
            onPointerUp={handleTouchDirEnd}
            onPointerLeave={handleTouchDirEnd}
            aria-label="Move Forward Right"
          >
            ↗
          </button>

          {/* Row 2: Left, Stick Center, Right */}
          <button
            type="button"
            className={styles.dpadBtn}
            onPointerDown={(e) => {
              e.stopPropagation();
              handleTouchDirStart(-1, 0);
            }}
            onPointerUp={handleTouchDirEnd}
            onPointerLeave={handleTouchDirEnd}
            aria-label="Move Left"
            id="btn-move-left"
          >
            ⬅️
          </button>
          <div className={styles.dpadCenter} aria-hidden="true">
            🕹️
          </div>
          <button
            type="button"
            className={styles.dpadBtn}
            onPointerDown={(e) => {
              e.stopPropagation();
              handleTouchDirStart(1, 0);
            }}
            onPointerUp={handleTouchDirEnd}
            onPointerLeave={handleTouchDirEnd}
            aria-label="Move Right"
            id="btn-move-right"
          >
            ➡️
          </button>

          {/* Row 3: Down-Left, Down, Down-Right */}
          <button
            type="button"
            className={styles.dpadBtnDiag}
            onPointerDown={(e) => {
              e.stopPropagation();
              handleTouchDirStart(-1, 1);
            }}
            onPointerUp={handleTouchDirEnd}
            onPointerLeave={handleTouchDirEnd}
            aria-label="Move Backward Left"
          >
            ↙
          </button>
          <button
            type="button"
            className={styles.dpadBtn}
            onPointerDown={(e) => {
              e.stopPropagation();
              handleTouchDirStart(0, 1);
            }}
            onPointerUp={handleTouchDirEnd}
            onPointerLeave={handleTouchDirEnd}
            aria-label="Move Backward"
            id="btn-move-backward"
          >
            ⬇️
          </button>
          <button
            type="button"
            className={styles.dpadBtnDiag}
            onPointerDown={(e) => {
              e.stopPropagation();
              handleTouchDirStart(1, 1);
            }}
            onPointerUp={handleTouchDirEnd}
            onPointerLeave={handleTouchDirEnd}
            aria-label="Move Backward Right"
          >
            ↘
          </button>
        </div>

        {/* Right Side Action Buttons: Run/Sprint, 3D Jump & Hotspot Interact */}
        <div className={styles.sideActions}>
          <div className={styles.actionRowBtns}>
            <button
              type="button"
              className={styles.jumpBtn}
              onClick={onJump}
              id="btn-world-jump"
              aria-label="Jump in 3D"
              title="Jump (Spacebar)"
            >
              <span>🦘</span>
              <span>Jump</span>
            </button>

            <button
              type="button"
              className={`${styles.speedToggleBtn} ${isRunning ? styles.speedActive : ''}`}
              onClick={() => {
                setIsRunning((prev) => {
                  const next = !prev;
                  isRunningRef.current = next;
                  updateVector();
                  return next;
                });
              }}
              id="btn-world-run-toggle"
              aria-label="Toggle Sprint Run"
              title="Toggle Run / Walk (R or Shift)"
            >
              <span>{isRunning ? '🏃 SPRINT (2x)' : '🚶 Walk (1x)'}</span>
            </button>
          </div>

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
