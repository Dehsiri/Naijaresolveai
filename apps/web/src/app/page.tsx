'use client';

import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { StatusBar } from '../components/StatusBar/StatusBar';
import { LocationBanner } from '../components/LocationBanner/LocationBanner';
import { ActionList } from '../components/ActionList/ActionList';
import { BottomNav } from '../components/BottomNav/BottomNav';
import { GameLog } from '../components/GameLog/GameLog';
import { Toast } from '../components/GameLog/Toast';
import { TravelModal } from '../components/Modals/TravelModal';
import { ShopModal } from '../components/Modals/ShopModal';
import { HousingModal } from '../components/Modals/HousingModal';
import { PhoneModal } from '../components/Modals/PhoneModal';
import { SettingsModal } from '../components/Modals/SettingsModal';
import { EventModal } from '../components/Modals/EventModal';
import { DaySummaryModal } from '../components/Modals/DaySummaryModal';
import { VictoryModal } from '../components/Modals/VictoryModal';

export default function GamePage() {
  const { isHydrated, init, activeModal, state } = useGameStore();

  useEffect(() => {
    init();
  }, [init]);

  if (!isHydrated) {
    return (
      <main className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-gold)', fontWeight: 700 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚡ WARRI VIBE ⚡</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Loading street hustle...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="app-container">
      <StatusBar />
      <Toast />
      <LocationBanner />
      <ActionList />
      <GameLog />
      <BottomNav />

      {/* Dynamic Overlays & Modals */}
      {state.pendingEvent && <EventModal />}
      {state.flags.chapter1Done && !state.flags.victoryDismissed && <VictoryModal />}
      {activeModal === 'summary' && <DaySummaryModal />}
      {activeModal === 'map' && <TravelModal />}
      {activeModal === 'shop' && <ShopModal />}
      {activeModal === 'housing' && <HousingModal />}
      {activeModal === 'phone' && <PhoneModal />}
      {activeModal === 'settings' && <SettingsModal />}
    </main>
  );
}
