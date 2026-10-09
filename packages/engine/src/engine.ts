import type {
  GameState,
  ActionDef,
  Stats,
  DaySummary,
  ItemDef,
  ChoiceDef,
  MissionDef,
  EventDef,
} from './types.ts';

export const RULES = {
  slotsPerDay: 5,
  mealCap: 3,
  decay: 0.8,
  rent: {
    shared_room: 30000,
    self_contain: 65000,
  },
  rentEvery: 30,
  outageProb: {
    shared_room: 0.35,
    self_contain: 0.15,
  },
  outageCost: 400,
  outageCostPowerBank: 100,
  wake: {
    shared_room: 80,
    self_contain: 100,
  },
  travelCost: {
    keke: 300,
    kekeHaggleLow: 200,
    kekeHaggleHigh: 400,
    walk: 0,
  },
  travelSlots: {
    keke: 1,
    walk: 2,
  },
  housingUpgradeCost: 35000,
};

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

// Mulberry32 deterministic PRNG
export function rand(s: GameState): number {
  s.seed = (s.seed + 0x6d2b79f5) | 0;
  let t = Math.imul(s.seed ^ (s.seed >>> 15), 1 | s.seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function addMoney(s: GameState, amount: number, label: string) {
  s.money = Math.max(0, s.money + amount);
  s.ledger.push({ day: s.day, label, amount });
  if (s.ledger.length > 100) s.ledger.shift();
}

export function applyStats(s: GameState, e?: Partial<Stats>) {
  for (const [k, v] of Object.entries(e ?? {})) {
    const key = k as keyof Stats;
    if (typeof v === 'number') {
      s.stats[key] = clamp(s.stats[key] + v, 0, 100);
    }
  }
}

export function successChance(s: GameState, a: ActionDef): number {
  if (!a.skill && a.difficulty === undefined) return 1;
  const skill = a.skill ? s.skills[a.skill] ?? 0 : 0;
  const diff = a.difficulty ?? 0;
  const moodFactor = (s.stats.mood - 50) / 50;
  return clamp(0.35 + 0.05 * (skill - diff) + 0.1 * moodFactor, 0.1, 0.9);
}

export function canDo(s: GameState, a: ActionDef): string | null {
  if (s.pendingEvent) return 'Finish the current event first.';
  if (s.location !== a.location) return 'You are not at that place.';
  if (s.stats.energy < a.energy) return 'Not enough energy.';
  if (s.slot + a.slots > RULES.slotsPerDay) return 'Not enough of the day left.';
  if (a.weeklyCap && (s.weeklyCounts[a.id] ?? 0) >= a.weeklyCap) return 'Weekly limit reached.';
  
  if (a.requires?.minSkill) {
    for (const [k, v] of Object.entries(a.requires.minSkill)) {
      if ((s.skills as Record<string, number>)[k] < (v as number)) {
        return `Needs ${k} level ${v}.`;
      }
    }
  }
  if (a.requires?.minMoney && s.money < a.requires.minMoney) {
    return `Needs ₦${a.requires.minMoney}.`;
  }
  if (a.id.startsWith('freelance') && !s.light && !s.inventory.power_bank) {
    return 'No light and no power bank.';
  }
  return null;
}

export function perform(prev: GameState, a: ActionDef): GameState {
  const reason = canDo(prev, a);
  if (reason) return { ...prev, log: [...prev.log, reason].slice(-100) };

  const s: GameState = structuredClone(prev);
  s.stats.energy -= a.energy;
  s.slot += a.slots;
  const n = (s.doneToday[a.id] = (s.doneToday[a.id] ?? 0) + 1);
  s.weeklyCounts[a.id] = (s.weeklyCounts[a.id] ?? 0) + 1;

  const win = rand(s) < successChance(s, a);
  if (win) {
    const [lo, hi] = a.money;
    const pay = Math.round((lo + rand(s) * (hi - lo)) * Math.pow(RULES.decay, n - 1));
    if (pay > 0) {
      addMoney(s, pay, a.label);
    }
    s.log.push(`${a.successLine}${pay > 0 ? ` (+₦${pay})` : ''}`);
    if (a.skill && rand(s) < 0.25) {
      s.skills[a.skill] = Math.min(10, s.skills[a.skill] + 1);
    }
    for (const [k, v] of Object.entries(a.affinity ?? {})) {
      s.affinity[k] = clamp((s.affinity[k] ?? 0) + v, 0, 100);
    }
  } else {
    if (a.failMoney) {
      addMoney(s, -a.failMoney, `${a.label} (failed)`);
    }
    s.log.push(a.failLine);
    applyStats(s, a.failEffects);
  }
  applyStats(s, a.effects);
  s.log = s.log.slice(-100);
  return s.slot >= RULES.slotsPerDay ? endDay(s) : s;
}

export function eat(
  prev: GameState,
  price = 500,
  hungerDelta = -35,
  moodDelta = 2
): GameState {
  if (prev.mealsToday >= RULES.mealCap || prev.money < price) return prev;
  const s: GameState = structuredClone(prev);
  addMoney(s, -price, 'Meal / Chop');
  s.mealsToday += 1;
  s.stats.hunger = clamp(s.stats.hunger + hungerDelta, 0, 100);
  s.stats.mood = clamp(s.stats.mood + moodDelta, 0, 100);
  s.log.push(`Chop belleful! Hunger drops. (-₦${price})`);
  s.log = s.log.slice(-100);
  return s;
}

export function travel(
  prev: GameState,
  to: string,
  opts: { mode: 'keke' | 'walk'; haggle?: boolean }
): GameState {
  if (prev.location === to) return prev;
  const s: GameState = structuredClone(prev);
  const slotsNeeded = opts.mode === 'walk' ? RULES.travelSlots.walk : RULES.travelSlots.keke;

  if (s.slot + slotsNeeded > RULES.slotsPerDay) {
    s.log.push('Day don finish. You cannot travel far now.');
    s.log = s.log.slice(-100);
    return s;
  }

  let fare = 0;
  if (opts.mode === 'keke') {
    if (opts.haggle) {
      const haggleWin = rand(s) < 0.5;
      fare = haggleWin ? RULES.travelCost.kekeHaggleLow : RULES.travelCost.kekeHaggleHigh;
      s.log.push(
        haggleWin
          ? `You price keke driver well! Pay ₦${fare}.`
          : `Driver no gree price! Dem bill you ₦${fare}.`
      );
    } else {
      fare = RULES.travelCost.keke;
      s.log.push(`Entered keke to destination. (-₦${fare})`);
    }

    if (s.money < fare) {
      s.log.push('No money for keke fare! You have to trek.');
      s.log = s.log.slice(-100);
      return s;
    }
    addMoney(s, -fare, 'Keke Fare');
  } else {
    s.stats.energy = clamp(s.stats.energy - 10, 0, 100);
    s.log.push('You trek go your destination. Body hot small.');
  }

  s.slot += slotsNeeded;
  s.location = to;
  s.log = s.log.slice(-100);
  return s.slot >= RULES.slotsPerDay ? endDay(s) : s;
}

export function buyItem(prev: GameState, itemId: string, content: any): GameState {
  const item: ItemDef | undefined = content?.items?.find((i: ItemDef) => i.id === itemId);
  if (!item) return prev;
  if (prev.money < item.price) return prev;
  if (item.oneTime && prev.inventory[itemId]) return prev;

  const s: GameState = structuredClone(prev);
  addMoney(s, -item.price, `Buy: ${item.name}`);

  if (item.oneTime) {
    s.inventory[itemId] = true;
  } else {
    s.inventory[itemId] = (Number(s.inventory[itemId]) || 0) + 1;
  }

  if (item.hungerDelta) s.stats.hunger = clamp(s.stats.hunger + item.hungerDelta, 0, 100);
  if (item.moodDelta) s.stats.mood = clamp(s.stats.mood + item.moodDelta, 0, 100);
  if (item.energyDelta) s.stats.energy = clamp(s.stats.energy + item.energyDelta, 0, 100);

  s.log.push(`Bought ${item.name} for ₦${item.price}.`);
  s.log = s.log.slice(-100);
  return s;
}

export function upgradeHousing(prev: GameState): GameState {
  if (prev.housing === 'self_contain') return prev;
  if (prev.money < RULES.housingUpgradeCost) return prev;

  const s: GameState = structuredClone(prev);
  addMoney(s, -RULES.housingUpgradeCost, 'Upgrade to Self-Contain');
  s.housing = 'self_contain';
  s.flags.arrears = 0;
  s.stats.mood = clamp(s.stats.mood + 15, 0, 100);
  s.log.push('Level up! You moved into a self-contain apartment.');
  s.log = s.log.slice(-100);
  return s;
}

function payRent(s: GameState): number {
  const due = RULES.rent[s.housing];
  const paid = Math.min(s.money, due);
  if (paid > 0) addMoney(s, -paid, 'Rent');
  if (paid < due) {
    const arrears = Number(s.flags.arrears ?? 0) + 1;
    s.flags.arrears = arrears;
    s.stats.mood = clamp(s.stats.mood - 20, 0, 100);
    s.log.push(`Landlord vex! Rent short. Arrears: ${arrears}`);
    if (arrears >= 2 && s.housing === 'self_contain') {
      s.housing = 'shared_room';
      s.log.push('Evicted from self-contain back to shared room due to unpaid rent.');
    }
  } else {
    s.flags.arrears = 0;
    s.log.push('Rent settled in full with landlord.');
  }
  return paid;
}

export function endDay(prev: GameState): GameState {
  const s: GameState = structuredClone(prev);

  if (s.day % RULES.rentEvery === 0) {
    payRent(s);
  }

  s.stats.hunger = clamp(s.stats.hunger + 30, 0, 100);

  const outage = rand(s) < RULES.outageProb[s.housing];
  s.light = !outage;
  if (outage) {
    const cost = s.inventory.power_bank
      ? RULES.outageCostPowerBank
      : RULES.outageCost;
    addMoney(s, -cost, 'Light / Gen Cost');
  }

  s.day += 1;
  s.slot = 0;
  s.doneToday = {};
  s.mealsToday = 0;

  // Reset weekly counts every 7 days (day 1, 8, 15, 22, 29)
  if ((s.day - 1) % 7 === 0) {
    s.weeklyCounts = {};
  }

  const penalty = s.stats.hunger > 70 ? 10 : 0;
  s.stats.energy = clamp(RULES.wake[s.housing] - penalty, 0, 100);

  // Slight reputation & heat drift
  if (s.stats.heat > 0) {
    s.stats.heat = Math.max(0, s.stats.heat - 1);
  }

  s.log.push(`Day ${s.day} don start.${s.light ? ' NEPA bring light.' : ' Light don go.'}`);
  s.log = s.log.slice(-100);
  return s;
}

export function daySummary(before: GameState, after: GameState): DaySummary {
  const dayLedger = after.ledger.filter((e) => e.day === before.day);
  const earnings = dayLedger
    .filter((e) => e.amount > 0)
    .reduce((acc, e) => acc + e.amount, 0);
  const expenses = dayLedger
    .filter((e) => e.amount < 0)
    .reduce((acc, e) => acc + Math.abs(e.amount), 0);

  const gists = [
    'Warri no dey carry last! Another day of hustle completed.',
    'Effurun roundabout traffic was hectic, but you survived.',
    'Mama Tonye said customers were asking for you.',
    'Generator noise was loud last night, but your grind never stops.',
    'Market woman gave discount because you greet well.',
  ];
  const gistHeadline = gists[before.day % gists.length];

  return {
    day: before.day,
    earnings,
    expenses,
    netChange: earnings - expenses,
    lightOutage: !after.light,
    outageCost: !after.light
      ? after.inventory.power_bank
        ? RULES.outageCostPowerBank
        : RULES.outageCost
      : 0,
    rentPaid: before.day % RULES.rentEvery === 0 ? RULES.rent[before.housing] : 0,
    arrearsCount: Number(after.flags.arrears ?? 0),
    logEntries: after.log.slice(-5),
    gistHeadline,
  };
}

export function maybeTriggerEvent(s: GameState, content: any): GameState {
  if (s.pendingEvent) return s;

  // 1. Check for mission triggers first
  const missions: MissionDef[] = content?.missions ?? [];
  for (const m of missions) {
    if (s.completedMissions.includes(m.id)) continue;
    let match = true;
    if (m.trigger.minDay && s.day < m.trigger.minDay) match = false;
    if (m.trigger.location && s.location !== m.trigger.location) match = false;
    if (m.trigger.firstOutage && s.light) match = false;
    if (m.trigger.weekday !== undefined && ((s.day - 1) % 7) !== m.trigger.weekday) match = false;
    if (m.trigger.minMoney && s.money < m.trigger.minMoney) match = false;

    if (match) {
      const next = structuredClone(s);
      next.pendingEvent = { ...m, isMission: true };
      return next;
    }
  }

  // 2. Chance of random event (approx 20% on action/travel)
  if (rand(s) < 0.2) {
    const events: EventDef[] = (content?.events ?? []).filter(
      (e: EventDef) => !e.location || e.location === s.location
    );
    if (events.length > 0) {
      const totalWeight = events.reduce((acc, e) => acc + (e.weight || 1), 0);
      let roll = rand(s) * totalWeight;
      for (const e of events) {
        roll -= e.weight || 1;
        if (roll <= 0) {
          const next = structuredClone(s);
          next.pendingEvent = { ...e, isMission: false };
          return next;
        }
      }
    }
  }

  return s;
}

export function chooseEvent(s: GameState, choiceId: string, content: any): GameState {
  if (!s.pendingEvent) return s;
  const event = s.pendingEvent;
  const choice: ChoiceDef | undefined = event.choices?.find((c: ChoiceDef) => c.id === choiceId);
  if (!choice) return s;

  const next: GameState = structuredClone(s);

  let success = true;
  if (choice.check) {
    const skill = next.skills[choice.check.skill] ?? 0;
    const chance = clamp(0.4 + 0.1 * (skill - choice.check.difficulty), 0.1, 0.9);
    success = rand(next) < chance;
  }

  const result = success ? choice.success : (choice.fail ?? choice.success);

  if (result.effects?.money) {
    addMoney(next, result.effects.money, `${event.title}: ${choice.label}`);
  }
  if (result.effects?.stats) {
    applyStats(next, result.effects.stats);
  }
  if (result.effects?.affinity) {
    for (const [k, v] of Object.entries(result.effects.affinity)) {
      next.affinity[k] = clamp((next.affinity[k] ?? 0) + v, 0, 100);
    }
  }
  if (result.effects?.flags) {
    Object.assign(next.flags, result.effects.flags);
  }

  next.log.push(`[${event.title}] ${result.text}`);
  if (event.isMission) {
    next.completedMissions.push(event.id);
  }

  next.pendingEvent = null;
  next.log = next.log.slice(-100);
  return next;
}

export function exportSave(s: GameState): string {
  const json = JSON.stringify(s);
  return typeof Buffer !== 'undefined'
    ? Buffer.from(json).toString('base64')
    : btoa(unescape(encodeURIComponent(json)));
}

export function importSave(
  raw: string
): { ok: true; state: GameState } | { ok: false; error: string } {
  try {
    const json =
      typeof Buffer !== 'undefined'
        ? Buffer.from(raw.trim(), 'base64').toString('utf8')
        : decodeURIComponent(escape(atob(raw.trim())));
    const s = JSON.parse(json) as GameState;
    if (s.version !== 1 || !s.stats || typeof s.money !== 'number' || typeof s.seed !== 'number') {
      return { ok: false, error: 'Invalid save format.' };
    }
    return { ok: true, state: s };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Corrupt save data.' };
  }
}

export function newGame(seed = (Date.now() & 0x7fffffff) || 12345): GameState {
  return {
    version: 1,
    day: 1,
    slot: 0,
    money: 5000,
    stats: {
      energy: 80,
      mood: 60,
      hunger: 20,
      respect: 10,
      heat: 0,
    },
    skills: {
      charisma: 1,
      street: 1,
      craft: 0,
    },
    location: 'udu_home',
    housing: 'shared_room',
    seed,
    doneToday: {},
    weeklyCounts: {},
    mealsToday: 0,
    light: true,
    inventory: {},
    affinity: {},
    flags: {},
    completedMissions: [],
    pendingEvent: null,
    ledger: [],
    log: ['Welcome to Warri! Hustle begin today.'],
  };
}
