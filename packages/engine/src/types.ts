export type Stats = {
  energy: number;
  mood: number;
  hunger: number;
  respect: number;
  heat: number;
}; // 0..100

export type Housing = 'shared_room' | 'self_contain';

export interface LedgerEntry {
  day: number;
  label: string;
  amount: number;
}

export interface DaySummary {
  day: number;
  earnings: number;
  expenses: number;
  netChange: number;
  lightOutage: boolean;
  outageCost: number;
  rentPaid: number;
  arrearsCount: number;
  logEntries: string[];
  gistHeadline: string;
}

export interface GameState {
  version: 1;
  day: number;                       // starts at 1. Day 1 is a Monday
  slot: number;                      // 0..4 (Morning, Afternoon, Evening, Night, Late)
  money: number;                     // naira, integer, never negative
  stats: Stats;
  skills: Record<'charisma' | 'street' | 'craft', number>; // 0..10
  location: string;                  // location id
  housing: Housing;
  seed: number;                      // RNG state, int32
  doneToday: Record<string, number>; // action id -> count today
  weeklyCounts: Record<string, number>;
  mealsToday: number;
  light: boolean;                    // true = power is available today
  inventory: Record<string, boolean | number>;
  affinity: Record<string, number>;  // npcId -> affinity 0..100
  flags: Record<string, any>;
  completedMissions: string[];
  pendingEvent: any | null;          // event or mission object waiting for choice
  ledger: LedgerEntry[];
  log: string[];                     // last 100 log entries
}

export interface ActionDef {
  id: string;
  label: string;
  location: string;
  slots: number;
  energy: number;
  skill?: 'charisma' | 'street' | 'craft';
  difficulty?: number;
  money: [number, number];           // [min, max]
  failMoney?: number;
  weeklyCap?: number;
  requires?: {
    minSkill?: Partial<Record<'charisma' | 'street' | 'craft', number>>;
    minMoney?: number;
    inventory?: string[];
  };
  effects?: Partial<Stats>;
  failEffects?: Partial<Stats>;
  affinity?: Record<string, number>;
  successLine: string;
  failLine: string;
  reviewStatus: 'draft' | 'approved';
}

export interface ItemDef {
  id: string;
  name: string;
  price: number;
  blurb?: string;
  oneTime?: boolean;
  hungerDelta?: number;
  moodDelta?: number;
  energyDelta?: number;
  reviewStatus?: 'draft' | 'approved';
}

export interface NpcDef {
  id: string;
  name: string;
  role: string;
  home: string;
  bio?: string;
  reviewStatus?: 'draft' | 'approved';
}

export interface LocationDef {
  id: string;
  name: string;
  blurb: string;
  art: string;
  reviewStatus?: 'draft' | 'approved';
}

export interface ChoiceDef {
  id: string;
  label: string;
  requires?: {
    minMoney?: number;
    minSkill?: Partial<Record<'charisma' | 'street' | 'craft', number>>;
    inventory?: string[];
  };
  check?: {
    skill: 'charisma' | 'street' | 'craft';
    difficulty: number;
  };
  success: {
    text: string;
    effects?: {
      money?: number;
      stats?: Partial<Stats>;
      affinity?: Record<string, number>;
      flags?: Record<string, any>;
      inventory?: Record<string, boolean | number>;
    };
  };
  fail?: {
    text: string;
    effects?: {
      money?: number;
      stats?: Partial<Stats>;
      affinity?: Record<string, number>;
      flags?: Record<string, any>;
      inventory?: Record<string, boolean | number>;
    };
  };
}

export interface MissionDef {
  id: string;
  type: 'mission';
  title: string;
  trigger: {
    minDay?: number;
    location?: string;
    firstOutage?: boolean;
    weekday?: number;
    minMoney?: number;
  };
  text: string;
  choices: ChoiceDef[];
  reviewStatus: 'draft' | 'approved';
}

export interface EventDef {
  id: string;
  type: 'random';
  weight: number;
  location?: string;
  title: string;
  text: string;
  choices: ChoiceDef[];
  reviewStatus: 'draft' | 'approved';
}
