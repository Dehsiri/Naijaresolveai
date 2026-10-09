import { newGame, perform, eat, travel, endDay, RULES } from '../packages/engine/src/engine.ts';
import { loadContent } from '../packages/content/src/loader.ts';

const content = loadContent();
const actionsMap = new Map(content.actions.map(a => [a.id, a]));

function simulate(strategyPlan, seed) {
  let g = newGame(seed);
  let brokeDays = 0;

  for (let d = 1; d <= 30; d++) {
    // 1. Morning meal
    if (g.money >= 500) {
      g = eat(g, 500, -35, 2);
    } else {
      brokeDays++;
    }

    // 2. Perform actions according to strategy
    for (const actId of strategyPlan) {
      const act = actionsMap.get(actId);
      if (!act) continue;

      // Travel if not at action location
      if (g.location !== act.location && g.slot + 1 <= RULES.slotsPerDay) {
        g = travel(g, act.location, { mode: 'keke' });
      }

      // Check if can do action
      if (g.stats.energy >= act.energy && g.slot + act.slots <= RULES.slotsPerDay) {
        g = perform(g, act);
      }
    }

    // 3. Afternoon / Evening meal if affordable
    if (g.mealsToday < 2 && g.money >= 500) {
      g = eat(g, 500, -35, 2);
    }

    // 4. End Day
    if (g.day === d) {
      g = endDay(g);
    }
  }

  return {
    finalCash: g.money,
    brokeDays,
    housing: g.housing,
    arrears: Number(g.flags.arrears || 0),
  };
}

const strategies = {
  'Shop Shifts Focus': ['shop_shift', 'shop_shift'],
  'Market Delivery Grind': ['delivery_run', 'delivery_run'],
  'Mixed Hustle (Shop + Delivery)': ['shop_shift', 'delivery_run'],
  'Freelance & Market Combo': ['freelance_gig', 'market_resell'],
};

console.log('--- WARRI VIBE ECONOMY SIMULATION (30 DAYS, 200 RUNS) ---');
for (const [name, plan] of Object.entries(strategies)) {
  const runs = Array.from({ length: 200 }, (_, i) => simulate(plan, (i + 1) * 1000 + 42));
  const sortedCash = runs.map(r => r.finalCash).sort((a, b) => a - b);
  const medianCash = sortedCash[100];
  const avgBroke = runs.reduce((acc, r) => acc + r.brokeDays, 0) / runs.length;
  const evictionRate = (runs.filter(r => r.arrears >= 2).length / runs.length) * 100;

  console.log(
    `${name.padEnd(32)} | Median D30 Cash: ₦${medianCash.toLocaleString().padStart(7)} | Avg Broke Days: ${avgBroke.toFixed(1)} | Arrears Risk: ${evictionRate.toFixed(0)}%`
  );
}
