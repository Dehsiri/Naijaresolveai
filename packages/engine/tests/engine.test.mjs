import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newGame,
  canDo,
  perform,
  eat,
  travel,
  buyItem,
  upgradeHousing,
  endDay,
  daySummary,
  exportSave,
  importSave,
  RULES,
  rand,
  successChance,
  maybeTriggerEvent,
  chooseEvent
} from '../src/engine.ts';

test('1. newGame initializes correct baseline stats and money', () => {
  const g = newGame(42);
  assert.equal(g.day, 1);
  assert.equal(g.slot, 0);
  assert.equal(g.money, 5000);
  assert.equal(g.location, 'udu_home');
  assert.equal(g.housing, 'shared_room');
  assert.equal(g.stats.energy, 80);
  assert.equal(g.stats.mood, 60);
  assert.equal(g.stats.hunger, 20);
});

test('2. Deterministic Mulberry32 RNG produces repeatable sequences', () => {
  const g1 = newGame(100);
  const g2 = newGame(100);
  const r1 = [rand(g1), rand(g1), rand(g1)];
  const r2 = [rand(g2), rand(g2), rand(g2)];
  assert.deepEqual(r1, r2);
});

test('3. canDo prevents actions when not at the correct location', () => {
  const g = newGame(42);
  const action = {
    id: 'shop_shift',
    label: 'Work shop',
    location: 'effurun',
    slots: 2,
    energy: 20,
    money: [1500, 2000],
    successLine: 'ok',
    failLine: 'bad',
    reviewStatus: 'draft'
  };
  assert.equal(canDo(g, action), 'You are not at that place.');
});

test('4. canDo prevents actions when energy is insufficient', () => {
  const g = newGame(42);
  g.location = 'effurun';
  g.stats.energy = 10;
  const action = {
    id: 'shop_shift',
    label: 'Work shop',
    location: 'effurun',
    slots: 2,
    energy: 20,
    money: [1500, 2000],
    successLine: 'ok',
    failLine: 'bad',
    reviewStatus: 'draft'
  };
  assert.equal(canDo(g, action), 'Not enough energy.');
});

test('5. canDo prevents actions when remaining slots in day are insufficient', () => {
  const g = newGame(42);
  g.location = 'effurun';
  g.slot = 4;
  const action = {
    id: 'shop_shift',
    label: 'Work shop',
    location: 'effurun',
    slots: 2,
    energy: 20,
    money: [1500, 2000],
    successLine: 'ok',
    failLine: 'bad',
    reviewStatus: 'draft'
  };
  assert.equal(canDo(g, action), 'Not enough of the day left.');
});

test('6. canDo enforces freelance gig requirements (power or power bank)', () => {
  const g = newGame(42);
  g.light = false;
  g.inventory = {};
  const action = {
    id: 'freelance_gig',
    label: 'Freelance',
    location: 'udu_home',
    slots: 3,
    energy: 30,
    money: [2800, 3600],
    successLine: 'ok',
    failLine: 'bad',
    reviewStatus: 'draft'
  };
  assert.equal(canDo(g, action), 'No light and no power bank.');
});

test('7. canDo allows freelance gig when power bank is in inventory during outage', () => {
  const g = newGame(42);
  g.light = false;
  g.inventory = { power_bank: true };
  const action = {
    id: 'freelance_gig',
    label: 'Freelance',
    location: 'udu_home',
    slots: 3,
    energy: 30,
    money: [2800, 3600],
    successLine: 'ok',
    failLine: 'bad',
    reviewStatus: 'draft'
  };
  assert.equal(canDo(g, action), null);
});

test('8. canDo blocks action when pending event is unresolved', () => {
  const g = newGame(42);
  g.pendingEvent = { id: 'some_event', title: 'Test' };
  const action = {
    id: 'park_chill',
    label: 'Rest',
    location: 'udu_home',
    slots: 1,
    energy: 0,
    money: [0, 0],
    successLine: 'ok',
    failLine: '',
    reviewStatus: 'draft'
  };
  assert.equal(canDo(g, action), 'Finish the current event first.');
});

test('9. perform decrements energy and increments slots', () => {
  let g = newGame(42);
  g.location = 'garden_park';
  const action = {
    id: 'park_chill',
    label: 'Rest in park',
    location: 'garden_park',
    slots: 1,
    energy: 0,
    money: [0, 0],
    effects: { mood: 8, energy: 10 },
    successLine: 'Fresh air.',
    failLine: '',
    reviewStatus: 'draft'
  };
  const next = perform(g, action);
  assert.equal(next.slot, 1);
  assert.equal(next.doneToday['park_chill'], 1);
});

test('10. perform applies payout decay when repeated on the same day', () => {
  let g1 = newGame(1234);
  g1.location = 'effurun';
  const action = {
    id: 'shop_shift',
    label: 'Work shop',
    location: 'effurun',
    slots: 1,
    energy: 10,
    money: [2000, 2000],
    successLine: 'ok',
    failLine: 'bad',
    reviewStatus: 'draft'
  };
  const next1 = perform(g1, action);
  const pay1 = next1.money - g1.money;
  const next2 = perform(next1, action);
  const pay2 = next2.money - next1.money;
  assert.equal(pay1, 2000);
  assert.equal(pay2, Math.round(2000 * RULES.decay));
});

test('11. perform caps slots and triggers endDay when reaching 5 slots', () => {
  let g = newGame(42);
  g.location = 'garden_park';
  const action = {
    id: 'park_chill',
    label: 'Rest',
    location: 'garden_park',
    slots: 1,
    energy: 0,
    money: [0, 0],
    successLine: 'ok',
    failLine: '',
    reviewStatus: 'draft'
  };
  g.slot = 4;
  const next = perform(g, action);
  assert.equal(next.day, 2);
  assert.equal(next.slot, 0);
});

test('12. eat restores hunger and increases mood within 3-meal limit', () => {
  let g = newGame(42);
  g.stats.hunger = 60;
  const next = eat(g, 500, -35, 2);
  assert.equal(next.stats.hunger, 25);
  assert.equal(next.stats.mood, 62);
  assert.equal(next.mealsToday, 1);
  assert.equal(next.money, 4500);
});

test('13. eat fails when reaching daily mealCap', () => {
  let g = newGame(42);
  g.mealsToday = 3;
  const next = eat(g);
  assert.equal(next.mealsToday, 3);
  assert.equal(next.money, 5000);
});

test('14. travel with keke spends slots and fare', () => {
  let g = newGame(42);
  const next = travel(g, 'effurun', { mode: 'keke' });
  assert.equal(next.location, 'effurun');
  assert.equal(next.slot, 1);
  assert.equal(next.money, 5000 - RULES.travelCost.keke);
});

test('15. travel by walking takes 2 slots, 0 money, and reduces energy', () => {
  let g = newGame(42);
  const energyBefore = g.stats.energy;
  const next = travel(g, 'effurun', { mode: 'walk' });
  assert.equal(next.location, 'effurun');
  assert.equal(next.slot, 2);
  assert.equal(next.money, 5000);
  assert.equal(next.stats.energy, energyBefore - 10);
});

test('16. travel with keke haggling selects either 200 or 400', () => {
  let g = newGame(777);
  const next = travel(g, 'warri_market', { mode: 'keke', haggle: true });
  const spent = 5000 - next.money;
  assert.ok(spent === 200 || spent === 400);
});

test('17. buyItem adds one-time item to inventory and deducts money', () => {
  let g = newGame(42);
  const content = {
    items: [{ id: 'power_bank', name: 'Power bank', price: 6000, oneTime: true }]
  };
  g.money = 7000;
  const next = buyItem(g, 'power_bank', content);
  assert.equal(next.money, 1000);
  assert.equal(next.inventory.power_bank, true);
});

test('18. buyItem prevents duplicate purchase of oneTime items', () => {
  let g = newGame(42);
  const content = {
    items: [{ id: 'power_bank', name: 'Power bank', price: 6000, oneTime: true }]
  };
  g.money = 15000;
  g.inventory = { power_bank: true };
  const next = buyItem(g, 'power_bank', content);
  assert.equal(next.money, 15000);
});

test('19. upgradeHousing upgrades shared_room to self_contain', () => {
  let g = newGame(42);
  g.money = 50000;
  const next = upgradeHousing(g);
  assert.equal(next.housing, 'self_contain');
  assert.equal(next.money, 50000 - RULES.housingUpgradeCost);
});

test('20. endDay advances day and resets slots, mealsToday, and doneToday', () => {
  let g = newGame(42);
  g.slot = 3;
  g.mealsToday = 2;
  g.doneToday = { shop_shift: 2 };
  const next = endDay(g);
  assert.equal(next.day, 2);
  assert.equal(next.slot, 0);
  assert.equal(next.mealsToday, 0);
  assert.deepEqual(next.doneToday, {});
});

test('21. endDay increases hunger by 30', () => {
  let g = newGame(42);
  g.stats.hunger = 20;
  const next = endDay(g);
  assert.equal(next.stats.hunger, 50);
});

test('22. endDay applies hunger penalty to wake energy if hunger > 70', () => {
  let g = newGame(42);
  g.stats.hunger = 80;
  const next = endDay(g);
  assert.equal(next.stats.energy, RULES.wake.shared_room - 10);
});

test('23. endDay charges rent on day 30', () => {
  let g = newGame(42);
  g.day = 30;
  g.money = 35000;
  const next = endDay(g);
  assert.equal(next.day, 31);
  assert.equal(next.money, 35000 - RULES.rent.shared_room);
});

test('24. endDay tracks arrears if unable to pay rent on rent day', () => {
  let g = newGame(42);
  g.day = 30;
  g.money = 5000;
  const next = endDay(g);
  assert.equal(next.flags.arrears, 1);
  assert.equal(next.money, 0);
});

test('25. daySummary computes earnings, expenses, and net change', () => {
  const before = newGame(42);
  const after = structuredClone(before);
  after.ledger.push({ day: 1, label: 'Work', amount: 3000 });
  after.ledger.push({ day: 1, label: 'Food', amount: -500 });
  const summary = daySummary(before, after);
  assert.equal(summary.earnings, 3000);
  assert.equal(summary.expenses, 500);
  assert.equal(summary.netChange, 2500);
});

test('26. exportSave and importSave round-trip preserves GameState', () => {
  const original = newGame(987);
  original.money = 12345;
  original.skills.craft = 3;
  original.affinity['mama_tonye'] = 45;
  const raw = exportSave(original);
  assert.equal(typeof raw, 'string');
  const res = importSave(raw);
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.state.money, 12345);
    assert.equal(res.state.skills.craft, 3);
    assert.equal(res.state.affinity['mama_tonye'], 45);
  }
});

test('27. importSave handles corrupted base64 gracefully', () => {
  const res = importSave('invalid_non_base64_json');
  assert.equal(res.ok, false);
});

test('28. maybeTriggerEvent triggers mission when conditions match', () => {
  let g = newGame(42);
  g.day = 2;
  g.location = 'effurun';
  const content = {
    missions: [
      {
        id: 'm_keke_fare',
        type: 'mission',
        title: 'Keke Fare Wahala',
        trigger: { minDay: 2, location: 'effurun' },
        text: 'Driver demands double.',
        choices: [
          { id: 'pay', label: 'Pay', success: { text: 'Paid', effects: { money: -300 } } }
        ],
        reviewStatus: 'draft'
      }
    ]
  };
  const next = maybeTriggerEvent(g, content);
  assert.ok(next.pendingEvent);
  assert.equal(next.pendingEvent.id, 'm_keke_fare');
});

test('29. chooseEvent executes chosen outcome and clears pendingEvent', () => {
  let g = newGame(42);
  g.pendingEvent = {
    id: 'm_keke_fare',
    title: 'Keke Fare',
    isMission: true,
    choices: [
      { id: 'pay', label: 'Pay', success: { text: 'Paid', effects: { money: -300 } } }
    ]
  };
  const next = chooseEvent(g, 'pay', {});
  assert.equal(next.pendingEvent, null);
  assert.equal(next.money, 4700);
  assert.ok(next.completedMissions.includes('m_keke_fare'));
});

test('30. successChance scales with skill, difficulty, and mood', () => {
  const g = newGame(42);
  const action = {
    id: 'delivery_run',
    label: 'Delivery',
    location: 'warri_market',
    slots: 2,
    energy: 25,
    skill: 'street',
    difficulty: 2,
    money: [1900, 2500],
    successLine: 'ok',
    failLine: 'fail',
    reviewStatus: 'draft'
  };
  const chanceLow = successChance(g, action);
  g.skills.street = 5;
  g.stats.mood = 90;
  const chanceHigh = successChance(g, action);
  assert.ok(chanceHigh > chanceLow);
});

test('31. Money never drops below zero', () => {
  let g = newGame(42);
  g.money = 100;
  const next = travel(g, 'effurun', { mode: 'keke' });
  // Cannot afford keke, so travel is blocked
  assert.equal(next.money, 100);
});

test('32. Stats stay clamped between 0 and 100', () => {
  let g = newGame(42);
  g.stats.energy = 95;
  g.location = 'garden_park';
  const restAction = {
    id: 'park_chill',
    label: 'Rest',
    location: 'garden_park',
    slots: 1,
    energy: 0,
    money: [0, 0],
    effects: { energy: 30, mood: 50 },
    successLine: 'ok',
    failLine: '',
    reviewStatus: 'draft'
  };
  const next = perform(g, restAction);
  assert.equal(next.stats.energy, 100);
  assert.equal(next.stats.mood, 100);
});
