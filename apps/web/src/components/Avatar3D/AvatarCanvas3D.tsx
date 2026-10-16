'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { AvatarConfig } from '../../types/avatar';
import { build3DAvatar, AvatarRig } from './AvatarModelBuilder';
import { playSound } from '../../utils/sound';
import styles from './AvatarCanvas3D.module.css';

interface AvatarCanvas3DProps {
  config: AvatarConfig;
  pose?: 'idle' | 'groove' | 'wave' | 'proud' | 'hustle';
  energy?: number;
  light?: boolean;
  autoRotate?: boolean;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showOverlay?: boolean;
  onTap?: () => void;
}

export function AvatarCanvas3D({
  config,
  pose = 'idle',
  energy = 100,
  light = true,
  autoRotate = false,
  interactive = true,
  size = 'lg',
  showOverlay = true,
  onTap,
}: AvatarCanvas3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isRotating, setIsRotating] = useState(autoRotate);
  const [activePose, setActivePose] = useState(pose);

  useEffect(() => {
    setActivePose(pose);
  }, [pose]);

  // Pointer Drag State
  const isDraggingRef = useRef(false);
  const prevPointerRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ y: 0, x: 0 });
  const velocityRef = useRef({ y: 0, x: 0 });
  const autoRotateRef = useRef(isRotating);
  autoRotateRef.current = isRotating;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    isDraggingRef.current = true;
    prevPointerRef.current = { x: e.clientX, y: e.clientY };
    velocityRef.current = { y: 0, x: 0 };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !interactive) return;
    const dx = e.clientX - prevPointerRef.current.x;
    const dy = e.clientY - prevPointerRef.current.y;

    const rotSpeed = 0.008;
    rotationRef.current.y += dx * rotSpeed;
    rotationRef.current.x = Math.max(-0.25, Math.min(0.35, rotationRef.current.x + dy * rotSpeed));

    velocityRef.current = { y: dx * rotSpeed, x: dy * rotSpeed };
    prevPointerRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!interactive) return;
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleTapReaction = useCallback(() => {
    playSound.click();
    if (activePose === 'idle') {
      setActivePose('wave');
      setTimeout(() => setActivePose('idle'), 2400);
    } else if (activePose === 'wave') {
      setActivePose('groove');
      setTimeout(() => setActivePose('idle'), 3000);
    }
    if (onTap) onTap();
  }, [activePose, onTap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let width = container.clientWidth || 300;
    let height = container.clientHeight || 300;

    // 1. Scene Setup
    const scene = new THREE.Scene();

    // 2. Camera Setup
    const isPortrait = size === 'sm';
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    if (isPortrait) {
      // Zoomed in on head & bust
      camera.position.set(0, 1.28, 0.95);
      camera.lookAt(0, 1.22, 0);
    } else {
      // Full body view
      camera.position.set(0, 0.95, 2.45);
      camera.lookAt(0, 0.88, 0);
    }

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Lighting Setup
    const ambientLight = new THREE.AmbientLight(
      light ? 0xfff3e0 : 0x1e293b,
      light ? 1.4 : 0.6
    );
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(
      light ? 0xfffbeb : 0xf59e0b,
      light ? 2.0 : 1.2
    );
    keyLight.position.set(2, 4, 3);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x06b6d4, light ? 0.8 : 0.3);
    fillLight.position.set(-3, 1, 1);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 1.5);
    rimLight.position.set(0, 2, -3);
    scene.add(rimLight);

    // 5. Floating Ambient Sparkles/Dust in Background
    const particleCount = isPortrait ? 15 : 45;
    const particleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 3;
      positions[i * 3 + 1] = Math.random() * 2.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: isPortrait ? 0.03 : 0.045,
      transparent: true,
      opacity: 0.65,
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    // 6. Build Avatar 3D Model
    let rig: AvatarRig = build3DAvatar(config);
    scene.add(rig.root);

    // 7. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Handle Inertia and Auto-Rotation
      if (!isDraggingRef.current) {
        if (autoRotateRef.current) {
          rotationRef.current.y += delta * 0.85;
        } else {
          // Inertial damping
          rotationRef.current.y += velocityRef.current.y;
          rotationRef.current.x += velocityRef.current.x;
          velocityRef.current.y *= 0.92;
          velocityRef.current.x *= 0.92;
        }
      }

      // Apply Rotation to Avatar Root
      rig.root.rotation.y = rotationRef.current.y;
      rig.root.rotation.x = rotationRef.current.x;

      // Update Procedural Rig Animations
      rig.update(delta, time, activePose, energy);

      // Float background particles
      const posAttr = particleGeom.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        let y = posAttr.getY(i) + delta * 0.12;
        if (y > 2.2) y = 0;
        posAttr.setY(i, y);
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        const newHeight = entry.contentRect.height;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      scene.remove(rig.root);
      rig.dispose();
      particleGeom.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, [config, activePose, energy, light, size]);

  const sizeClass =
    size === 'sm'
      ? styles.sizeSm
      : size === 'md'
      ? styles.sizeMd
      : size === 'hero'
      ? styles.sizeHero
      : styles.sizeLg;

  return (
    <div
      ref={containerRef}
      className={`${styles.canvasWrapper} ${sizeClass}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleTapReaction}
    >
      <canvas ref={canvasRef} className={styles.canvas} />

      {/* Floating Badges & Controls for Hero/Large Studio View */}
      {showOverlay && size !== 'sm' && (
        <>
          <div className={styles.genderPill}>
            <span>{config.gender === 'male' ? '👨🏾 Bros (Male)' : '👩🏾 Sisi (Female)'}</span>
            <span>·</span>
            <span>{config.name}</span>
          </div>

          <div className={styles.interactionHint}>
            <span>🔄 Drag to rotate 360° · Double-tap to vibe</span>
          </div>

          <button
            type="button"
            className={styles.rotateControlBtn}
            onClick={() => setIsRotating((prev) => !prev)}
            title={isRotating ? 'Pause spin' : 'Auto-spin 360°'}
            aria-label="Toggle 360 Spin"
          >
            {isRotating ? '⏸️' : '🎡'}
          </button>
        </>
      )}
    </div>
  );
}
