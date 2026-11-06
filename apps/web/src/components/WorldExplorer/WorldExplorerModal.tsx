'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { build3DAvatar, AvatarRig } from '../Avatar3D/AvatarModelBuilder';
import {
  buildWorldScene,
  resolveMovement,
  WorldLocationId,
  WORLD_LOCATIONS,
  WorldHotspot,
} from './WorldScenes';
import { WorldControls } from './WorldControls';
import { WarriGoogleMap } from '../GoogleMap/WarriGoogleMap';
import { playSound } from '../../utils/sound';
import { AvatarConfig, DEFAULT_MALE_AVATAR } from '../../types/avatar';
import styles from './WorldExplorerModal.module.css';

const WORLD_TO_MAP_ID: Record<WorldLocationId, string> = {
  living_room: 'udu_home',
  church: 'garden_park',
  market: 'warri_market',
  junction: 'effurun',
};

const MAP_TO_WORLD_ID: Record<string, WorldLocationId> = {
  udu_home: 'living_room',
  garden_park: 'church',
  warri_market: 'market',
  effurun: 'junction',
};

// Shortest angle lerp helper
function lerpAngle(a: number, b: number, t: number): number {
  const diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  return a + diff * t;
}

export function WorldExplorerModal() {
  const { state, setActiveModal, interactWorld } = useGameStore();

  const [activeLocation, setActiveLocation] = useState<WorldLocationId>('living_room');
  const [activeHotspot, setActiveHotspot] = useState<WorldHotspot | null>(null);
  const [showGoogleMap, setShowGoogleMap] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const moveVectorRef = useRef<{ x: number; z: number; isRunning: boolean }>({
    x: 0,
    z: 0,
    isRunning: false,
  });

  const avatarPosRef = useRef<{ x: number; z: number; rotY: number }>({
    x: 0,
    z: 0.6,
    rotY: Math.PI,
  });

  const reactionPoseRef = useRef<'idle' | 'walk' | 'groove' | 'wave' | 'proud' | 'hustle'>('idle');
  const reactionTimerRef = useRef<any>(null);

  const currentLocMeta = WORLD_LOCATIONS[activeLocation];
  const avatarConfig = (state.flags.avatar as AvatarConfig) || DEFAULT_MALE_AVATAR;

  // Handle Hotspot Interaction
  const handleInteract = useCallback(() => {
    if (!activeHotspot) return;

    // Audio
    if (activeHotspot.sound === 'coin') playSound.coin();
    else if (activeHotspot.sound === 'alert') playSound.alert();
    else if (activeHotspot.sound === 'click') playSound.click();
    else if (activeHotspot.sound === 'eat') playSound.eat();
    else playSound.fanfare();

    // Trigger Avatar Pose Reaction
    if (activeHotspot.poseReaction) {
      reactionPoseRef.current = activeHotspot.poseReaction;
      if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = setTimeout(() => {
        reactionPoseRef.current = 'idle';
      }, 2400);
    }

    // Apply Stat & Money Deltas
    interactWorld(
      activeHotspot.label,
      activeHotspot.statDeltas || {},
      activeHotspot.moneyDelta,
      `${activeHotspot.icon} ${activeHotspot.label}: ${activeHotspot.description}`
    );
  }, [activeHotspot, interactWorld]);

  // Handle Location Switch
  const switchLocation = (locId: WorldLocationId) => {
    if (locId === activeLocation) return;
    playSound.click();
    setActiveLocation(locId);
    setActiveHotspot(null);
    const targetSpawn = WORLD_LOCATIONS[locId].spawn;
    avatarPosRef.current = {
      x: targetSpawn.x,
      z: targetSpawn.z,
      rotY: Math.PI,
    };
  };

  // Three.js Render & Loop Setup
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let width = container.clientWidth || 360;
    let height = container.clientHeight || 500;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(currentLocMeta.skyColor);
    scene.fog = new THREE.FogExp2(currentLocMeta.skyColor, 0.045);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 80);
    const spawn = currentLocMeta.spawn;
    camera.position.set(spawn.x, 3.4, spawn.z + 4.2);
    camera.lookAt(spawn.x, 0.9, spawn.z);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(
      currentLocMeta.ambientColor,
      currentLocMeta.ambientIntensity
    );
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(
      currentLocMeta.dirLightColor,
      currentLocMeta.dirLightIntensity
    );
    dirLight.position.set(...currentLocMeta.dirLightPos);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // 5. Build Location Environment Scene
    const worldScene = buildWorldScene(activeLocation);
    scene.add(worldScene.group);

    // 6. Build Controllable Avatar (without pedestal)
    const rig: AvatarRig = build3DAvatar(avatarConfig, { showPedestal: false });
    rig.root.position.set(spawn.x, 0, spawn.z);
    rig.root.rotation.y = avatarPosRef.current.rotY;
    scene.add(rig.root);

    // 7. Loop Variables
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      // Handle Avatar Motion from Virtual D-Pad / Keyboard
      const moveVec = moveVectorRef.current;
      const isMoving = Math.abs(moveVec.x) > 0.05 || Math.abs(moveVec.z) > 0.05;

      const speed = moveVec.isRunning ? 3.6 : 2.2;

      if (isMoving) {
        // Resolve movement against solid obstacles and room boundaries
        const deltaX = moveVec.x * speed * delta;
        const deltaZ = moveVec.z * speed * delta;
        const resolved = resolveMovement(
          avatarPosRef.current.x,
          avatarPosRef.current.z,
          deltaX,
          deltaZ,
          0.32, // Avatar physical collision radius
          worldScene.obstacles,
          worldScene.boundary
        );

        avatarPosRef.current.x = resolved.x;
        avatarPosRef.current.z = resolved.z;

        // Smooth rotation to face movement direction
        const targetAngle = Math.atan2(moveVec.x, moveVec.z);
        avatarPosRef.current.rotY = lerpAngle(
          avatarPosRef.current.rotY,
          targetAngle,
          14 * delta
        );
      }

      // Sync avatar root
      rig.root.position.x = avatarPosRef.current.x;
      rig.root.position.z = avatarPosRef.current.z;
      rig.root.rotation.y = avatarPosRef.current.rotY;

      // Determine animation pose
      const currentPose = isMoving
        ? 'walk'
        : reactionPoseRef.current !== 'walk'
        ? reactionPoseRef.current
        : 'idle';

      rig.update(delta, time, currentPose, state.stats.energy);
      worldScene.update(delta, time);

      // Smooth Third-Person Camera Following
      const targetCamX = avatarPosRef.current.x;
      const targetCamZ = avatarPosRef.current.z + 3.8;
      const targetCamY = 3.0;

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, 7 * delta);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 7 * delta);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, 7 * delta);
      camera.lookAt(avatarPosRef.current.x, 0.9, avatarPosRef.current.z);

      // Hotspot Distance Check
      let closest: WorldHotspot | null = null;
      let minDistance = 1.15; // Interaction threshold in units

      for (const spot of worldScene.hotspots) {
        const dist = Math.hypot(
          avatarPosRef.current.x - spot.x,
          avatarPosRef.current.z - spot.z
        );
        if (dist < minDistance) {
          closest = spot;
          break;
        }
      }

      setActiveHotspot(closest);

      renderer.render(scene, camera);
    };

    animate();

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newW = entry.contentRect.width;
        const newH = entry.contentRect.height;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      scene.remove(rig.root);
      scene.remove(worldScene.group);
      rig.dispose();
      worldScene.dispose();
      renderer.dispose();
    };
  }, [activeLocation, avatarConfig, currentLocMeta, state.stats.energy]);

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalCard}>
        {/* Top Header */}
        <div className={styles.modalHeader}>
          <div className={styles.titleArea}>
            <span className={styles.mainTitle}>
              <span>{currentLocMeta.icon}</span>
              <span>{currentLocMeta.name}</span>
            </span>
            <span className={styles.subTitle}>{currentLocMeta.tagline}</span>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={`${styles.googleMapToggleBtn} ${showGoogleMap ? styles.googleMapToggleBtnActive : ''}`}
              onClick={() => {
                playSound.click();
                setShowGoogleMap((prev) => !prev);
              }}
              id="btn-toggle-world-google-map"
              aria-label="Toggle Google Map"
            >
              <span>🗺️</span>
              <span>{showGoogleMap ? '3D View' : 'Google Map'}</span>
            </button>

            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setActiveModal('none')}
              aria-label="Close 3D World"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Location Selector Tabs */}
        <div className={styles.locationTabs} role="tablist" aria-label="Select 3D Location">
          <button
            type="button"
            role="tab"
            aria-selected={activeLocation === 'living_room'}
            className={`${styles.locTab} ${activeLocation === 'living_room' ? styles.locTabActive : ''}`}
            onClick={() => switchLocation('living_room')}
          >
            <span>🛋️</span>
            <span>Living Room</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeLocation === 'church'}
            className={`${styles.locTab} ${activeLocation === 'church' ? styles.locTabActive : ''}`}
            onClick={() => switchLocation('church')}
          >
            <span>⛪</span>
            <span>Church</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeLocation === 'market'}
            className={`${styles.locTab} ${activeLocation === 'market' ? styles.locTabActive : ''}`}
            onClick={() => switchLocation('market')}
          >
            <span>🛍️</span>
            <span>Market</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeLocation === 'junction'}
            className={`${styles.locTab} ${activeLocation === 'junction' ? styles.locTabActive : ''}`}
            onClick={() => switchLocation('junction')}
          >
            <span>🚖</span>
            <span>Effurun Junction</span>
          </button>
        </div>

        {/* 3D Viewport */}
        <div ref={containerRef} className={styles.viewportContainer}>
          <canvas ref={canvasRef} className={styles.canvas} />

          {/* Top HUD: Character name + Controls hint */}
          <div className={styles.overlayStatus}>
            <div className={styles.statPill}>
              <span>{avatarConfig.gender === 'male' ? '👨🏾' : '👩🏾'}</span>
              <span>{avatarConfig.name}</span>
              <span>·</span>
              <span style={{ color: '#fbbf24' }}>⚡ {state.stats.energy}% Energy</span>
            </div>

            <div className={styles.controlsTip}>
              <span>🕹️ D-Pad or WASD</span>
            </div>
          </div>

          {/* Virtual D-Pad & Action Trigger */}
          <WorldControls
            activeHotspot={activeHotspot}
            onMoveVectorChange={(vec) => {
              moveVectorRef.current = vec;
            }}
            onInteract={handleInteract}
          />

          {/* Interactive Google Map Drawer Overlay inside 3D World */}
          {showGoogleMap && (
            <div className={styles.googleMapDrawer}>
              <div className={styles.googleMapDrawerHeader}>
                <div className={styles.googleMapDrawerTitle}>
                  <span>🗺️</span>
                  <span>Warri & Effurun GPS Map (Tap pin to teleport 3D Avatar)</span>
                </div>
                <button
                  type="button"
                  className={styles.return3DBtn}
                  onClick={() => setShowGoogleMap(false)}
                >
                  🚶 Back to 3D
                </button>
              </div>

              <WarriGoogleMap
                currentLocationId={WORLD_TO_MAP_ID[activeLocation]}
                selectedLocationId={WORLD_TO_MAP_ID[activeLocation]}
                allowSelectCurrent
                height={260}
                onSelectLocation={(mapLocId) => {
                  const target3D = MAP_TO_WORLD_ID[mapLocId];
                  if (target3D) {
                    switchLocation(target3D);
                    setShowGoogleMap(false);
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
