import { create } from 'zustand';
import {
  newGame,
  perform,
  eat,
  travel,
  buyItem,
  upgradeHousing,
  endDay,
  daySummary,
  exportSave,
  importSave,
  maybeTriggerEvent,
  chooseEvent,
  type GameState,
  type ActionDef,
  type DaySummary,
} from '@warri-vibe/engine';
import { loadContent, type ContentBundle } from '@warri-vibe/content';

export type ModalType = 'none' | 'map' | 'shop' | 'housing' | 'phone' | 'settings' | 'summary';

export interface GameStore {
  state: GameState;
  content: ContentBundle;
  isHydrated: boolean;
  activeModal: ModalType;
  lastSummary: DaySummary | null;
  toastMessage: string | null;

  // Actions
  init: () => void;
  startNewGame: (seed?: number) => void;
  setActiveModal: (modal: ModalType) => void;
  dismissSummary: () => void;
  showToast: (msg: string) => void;

  doAction: (actionId: string) => void;
  eatChop: (price?: number, hungerDelta?: number, moodDelta?: number) => void;
  travelTo: (locationId: string, mode: 'keke' | 'walk', haggle?: boolean) => void;
  purchaseItem: (itemId: string) => void;
  upgradeHouse: () => void;
  advanceDay: () => void;
  respondToEvent: (choiceId: string) => void;

  exportSaveCode: () => string;
  importSaveCode: (code: string) => { ok: boolean; error?: string };
}

const STORAGE_KEY = 'warri_vibe_save_v1';

export const useGameStore = create<GameStore>((set, get) => ({
  state: newGame(12345),
  content: loadContent(),
  isHydrated: false,
  activeModal: 'none',
  lastSummary: null,
  toastMessage: null,

  init: () => {
    try {
      const content = loadContent();
      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (saved) {
        const res = importSave(saved);
        if (res.ok) {
          set({ state: res.state, content, isHydrated: true });
          return;
        }
      }
      const initial = newGame(Date.now() | 0);
      set({ state: initial, content, isHydrated: true });
    } catch {
      set({ state: newGame(Date.now() | 0), content: loadContent(), isHydrated: true });
    }
  },

  startNewGame: (seed?: number) => {
    const s = newGame(seed ?? (Date.now() | 0));
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, exportSave(s));
    }
    set({ state: s, activeModal: 'none', lastSummary: null });
    get().showToast('Fresh journey started in Warri!');
  },

  setActiveModal: (activeModal) => set({ activeModal }),
  dismissSummary: () => set({ lastSummary: null, activeModal: 'none' }),

  showToast: (msg: string) => {
    set({ toastMessage: msg });
    setTimeout(() => {
      if (get().toastMessage === msg) {
        set({ toastMessage: null });
      }
    }, 3200);
  },

  doAction: (actionId: string) => {
    const { state, content } = get();
    const action = content.actions.find((a) => a.id === actionId);
    if (!action) return;

    let nextState = perform(state, action);
    nextState = maybeTriggerEvent(nextState, content);

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, exportSave(nextState));
    }

    set({ state: nextState });
    const latestLog = nextState.log[nextState.log.length - 1];
    if (latestLog) get().showToast(latestLog);
  },

  eatChop: (price = 500, hungerDelta = -35, moodDelta = 2) => {
    const { state } = get();
    const nextState = eat(state, price, hungerDelta, moodDelta);
    if (nextState !== state) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, exportSave(nextState));
      }
      set({ state: nextState });
      get().showToast('Belleful! Hunger dropped.');
    }
  },

  travelTo: (locationId: string, mode: 'keke' | 'walk', haggle?: boolean) => {
    const { state, content } = get();
    let nextState = travel(state, locationId, { mode, haggle });
    nextState = maybeTriggerEvent(nextState, content);

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, exportSave(nextState));
    }

    set({ state: nextState, activeModal: 'none' });
    const latestLog = nextState.log[nextState.log.length - 1];
    if (latestLog) get().showToast(latestLog);
  },

  purchaseItem: (itemId: string) => {
    const { state, content } = get();
    const nextState = buyItem(state, itemId, content);
    if (nextState !== state) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, exportSave(nextState));
      }
      set({ state: nextState });
      const item = content.items.find((i) => i.id === itemId);
      get().showToast(`Purchased ${item?.name || 'item'}!`);
    }
  },

  upgradeHouse: () => {
    const { state } = get();
    const nextState = upgradeHousing(state);
    if (nextState !== state) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, exportSave(nextState));
      }
      set({ state: nextState, activeModal: 'none' });
      get().showToast('Moved into Self-Contain apartment!');
    }
  },

  advanceDay: () => {
    const { state } = get();
    const nextState = endDay(state);
    const summary = daySummary(state, nextState);

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, exportSave(nextState));
    }

    set({ state: nextState, lastSummary: summary, activeModal: 'summary' });
  },

  respondToEvent: (choiceId: string) => {
    const { state, content } = get();
    const nextState = chooseEvent(state, choiceId, content);

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, exportSave(nextState));
    }

    set({ state: nextState });
    const latestLog = nextState.log[nextState.log.length - 1];
    if (latestLog) get().showToast(latestLog);
  },

  exportSaveCode: () => {
    const { state } = get();
    return exportSave(state);
  },

  importSaveCode: (code: string) => {
    const res = importSave(code);
    if (res.ok) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, exportSave(res.state));
      }
      set({ state: res.state, activeModal: 'none' });
      get().showToast('Save restored successfully!');
      return { ok: true };
    }
    return { ok: false, error: res.error };
  },
}));
