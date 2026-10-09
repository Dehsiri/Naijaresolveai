# WARRI VIBE — Build Plan for a Coding Agent (v0.1)

> Hand this file to the coding agent. It is self-contained: product intent, constraints, stack, data models, game rules, content seeds, UI spec, and a staged task list with acceptance criteria.
>
> **For the human owner:** put this file at `docs/BUILD_PLAN.md` and create the short `AGENTS.md` from Appendix C in the repo root (Codex-style agents read `AGENTS.md`; verify the exact filename convention in the tool's current docs). Give the agent **one stage at a time** (copy the stage block), review the diff, run the checks, then move on. Do not hand over all stages at once.

**Labels used below:** `[RULE]` = must follow. `[TUNE]` = starting value to adjust after playtests. `[REVIEW]` = needs a native Warri speaker or local reviewer before release. `[ASSUMPTION]` = a design choice, not a verified fact.

---

## 1. Product summary

WARRI VIBE is a mobile-first, single-player browser life-sim set in a fictionalised Warri and Effurun, Delta State, Nigeria. The player builds a life from nothing: they work, eat, travel by keke, handle power cuts, build friendships and reputation, pay rent, and finish Chapter 1 by renting a market table (a teaser for business ownership later).

It is inspired by the life-sim genre only. Do not copy any other game's names, art, text, UI layouts, or mechanics.

**Pillars**
1. Hustle with a smile: money is tight, time is tighter, every day is funny.
2. Warri-only systems: power cuts ("light"), keke fare haggling, market-day rhythm, owambe weekends.
3. Short sessions: one in-game day takes 5 to 8 real minutes.
4. People over stats: NPC relationships and reputation drive stories.

## 2. Hard constraints

- `[RULE]` Single-player only in v0.1. **No** multiplayer, **no** accounts, **no** Socket.IO, **no** Supabase, **no** payments, **no** third-party analytics.
- `[RULE]` Game rules are **pure TypeScript functions** in `packages/engine` with no DOM, React, or browser imports, so the same code can run on a server later.
- `[RULE]` Everything random uses the **seeded RNG stored in the save**. Never call `Math.random()` inside the engine.
- `[RULE]` Content (actions, events, missions, NPCs, locations) lives in JSON under `packages/content` and is validated at load time. Writers must be able to edit text without touching code.
- `[RULE]` Use **fictional names for all businesses and brands** (for example "Delta Plaza", never a real mall or retailer). Public landmarks and place names (Effurun, Warri Main Market, Udu) are fine as settings.
- `[RULE]` Do not depict or joke about royal institutions, ethnic groups, politics, or militancy. Keep the cast mixed and respectful. Avoid stereotypes.
- `[RULE]` All Pidgin and local-flavour text is marked `"reviewStatus": "draft"` until a human reviewer changes it to `"approved"`. The build must print a warning listing draft strings and must not fail on them.
- `[RULE]` Do not add dependencies beyond section 3 without recording the reason in `docs/DECISIONS.md`.
- `[RULE]` Never invent facts about real places. If a detail is unknown, use a neutral placeholder and add it to `docs/OPEN_QUESTIONS.md`.
- `[RULE]` Mobile first: design at 360 × 640 px and 390 × 844 px. Tap targets at least 44 × 44 px.

## 3. Stack

| Concern | Choice |
|---|---|
| Package manager / monorepo | pnpm workspaces |
| Front end | Next.js (latest stable, App Router), React, TypeScript `strict: true`. Configure **static export** (`output: 'export'`); use client components for the game |
| Game state | Zustand (with `persist` middleware, `skipHydration: true`, rehydrate in a client effect) |
| Styling | CSS Modules plus CSS custom properties (design tokens). No UI kit |
| Validation | zod (content and save files) |
| Unit tests | Vitest |
| End-to-end tests | Playwright (mobile viewports) |
| Lint / format | ESLint, Prettier |
| 3D (Stage 10 only, optional) | three, @react-three/fiber, @react-three/drei |
| Back end | **Not in v0.1.** Create `apps/server/README.md` only, stating it is reserved for v1.1 (cloud save, Socket.IO chat) |
| CI | GitHub Actions: install, typecheck, lint, test, build |
| Hosting | Static host (Vercel, Netlify, or Cloudflare Pages) |

## 4. Repository structure

```
warri-vibe/
  AGENTS.md
  docs/
    BUILD_PLAN.md        (this file)
    DECISIONS.md
    OPEN_QUESTIONS.md
  apps/
    web/                 Next.js app (static export)
      src/app/           routes
      src/components/    UI components (CSS Modules next to each)
      src/store/         Zustand store (thin; calls engine)
      src/styles/        tokens.css, global.css
      public/            manifest.webmanifest, sw.js, art/, models/
      e2e/               Playwright tests
    server/
      README.md          reserved for v1.1
  packages/
    engine/              pure TS rules + tests
      src/
    content/             JSON content + zod schemas + loader
      src/
      data/
  scripts/
    econ-sim.mjs         economy bot (Appendix B)
```

## 5. Domain model (TypeScript)

Put these in `packages/engine/src/types.ts`. Add fields only with a note in `DECISIONS.md`.

```ts
export type Stats = { energy: number; mood: number; hunger: number; respect: number; heat: number }; // 0..100
export type Housing = 'shared_room' | 'self_contain';

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
  weeklyCounts: Record<string, number>; // action id -> count this week (resets Monday)
  mealsToday: number;
  light: boolean;                    // power available today
  inventory: Record<string, number>;
  affinity: Record<string, number>;  // npc id -> 0..100
  flags: Record<string, boolean | number | string>;
  completedMissions: string[];
  pendingEvent: string | null;       // event id awaiting a choice
  ledger: { day: number; label: string; amount: number }[]; // keep last 50
  log: string[];                     // keep last 100
}

export interface ActionDef {
  id: string;
  label: string;
  location: string;
  slots: number;
  energy: number;
  skill?: 'charisma' | 'street' | 'craft';
  difficulty?: number;
  money: [number, number];           // payout range on success (negative = cost)
  failMoney?: number;                // naira lost on failure
  weeklyCap?: number;
  requires?: { minSkill?: Partial<Record<'charisma' | 'street' | 'craft', number>>; item?: string; flag?: string };
  effects?: Partial<Stats>;          // always applied
  failEffects?: Partial<Stats>;      // applied only on failure
  affinity?: Record<string, number>; // npc id -> delta on success
  successLine: string;
  failLine: string;
  reviewStatus: 'draft' | 'approved';
}
```

Also define `LocationDef`, `NpcDef`, `EventDef`, `ChoiceDef`, `MissionDef`, `ItemDef` with zod schemas in `packages/content`. Shapes are shown by the seed files in section 8.

## 6. Game rules (the engine must implement exactly this)

### 6.1 Time
- A day has **5 slots**. Actions consume slots. Eating consumes **0** slots (max 3 meals per day).
- When `slot >= 5` the day ends automatically (`endDay`). The player can also choose **Sleep** early: it ends the day.
- Day 1 is Monday. `weekday = (day - 1) % 7` (0 = Monday, 5 = Saturday, 6 = Sunday). On Monday, reset `weeklyCounts`.

### 6.2 Travel
- Between hubs: **keke** costs 1 slot and ₦300; **walk** costs 2 slots and ₦0. `[TUNE]`
- Optional **Haggle** before keke: Charisma check (`difficulty 2`). Success: fare ₦200. Failure: fare ₦400.
- Travel is an engine function, not store logic.

### 6.3 Success chance
```
p = clamp(0.35 + 0.05 * (skill - difficulty) + 0.1 * ((mood - 50) / 50), 0.10, 0.90)
```
Actions with no skill use `skill = 0`.

### 6.4 Payout and anti-grind
```
payout = round(random(min, max) * 0.8 ^ (timesDoneToday - 1))
```
On success there is a 25% chance to gain +1 in the action's skill (cap 10).

### 6.5 Energy, hunger, mood
- Wake energy: shared room 80, self-contain 90. If `hunger > 70` at day end, wake energy is reduced by 10.
- Hunger rises by 30 at day end. A basic meal (₦500) lowers hunger by 35 (floor 0) and raises mood by 2. Max 3 meals/day.
- Skipping meals saves money but hurts energy the next morning. That is the intended trade-off.
- All stats clamp to 0..100.

### 6.6 Light (power)
- At each day end roll an outage: probability **0.35** in a shared room, **0.15** in a self-contain. `[TUNE]`
- Outage costs ₦400 (charging, fuel) at day end. If the player owns a **power bank**, it costs ₦100.
- Freelance actions require `light === true` **or** a power bank. On an outage day without one, they are disabled with the reason shown.

### 6.7 Rent and housing
- Rent due when `day % 30 === 0` at day end. Shared room ₦30,000, self-contain ₦60,000. `[TUNE]`
- The UI warns from 3 days before.
- If the player cannot pay in full, take what they have, increase `flags.arrears`, reduce mood by 20, and trigger the landlord event. On two consecutive misses, move them to the shared room. Never game-over the player.

### 6.8 Reputation and relationships
- **Respect** and **Heat** change through actions and event choices. Both drift 1 point per 7 days toward 0 (Respect floors at 10 in v0.1).
- **Heat** at 60 or more locks the delivery job and raises the chance of "wahala" events.
- **Affinity** per NPC: 0..100, stages Stranger (0 to 24), Familiar (25 to 49), Friend (50 to 74), Close (75 to 100). Unvisited NPCs lose 1 per 3 days, never below 25 once Familiar.

### 6.9 Events and missions
- When a slot advances, there is a 25% chance (seeded) that one eligible **random event** triggers at the current location. Events are filtered by location, weekday, minimum day, and flags, then chosen by weight. At most 1 event per day.
- **Missions** are special events with a `trigger` and an `id`. A mission fires once when its trigger is met (even when no random event is eligible). Mission completion is stored in `completedMissions`.
- While `pendingEvent` is set, normal actions are blocked until a choice is made.

### 6.10 Day end order (deterministic)
1. Rent check if due.
2. Hunger +30.
3. Outage roll and light cost.
4. Increment day, reset slot, `doneToday`, `mealsToday`.
5. Weekly reset if Monday.
6. Apply wake energy.
7. Apply reputation drift and affinity decay.
8. Append the Day Summary data (earned, spent, rep changes) to the log.

### 6.11 Economy starting values `[TUNE]`
Start cash ₦5,000 (before background adjustments). Meal ₦500. Keke ₦300 (haggle 200/400). Jobs: shop 1,800 (2 slots, 20 energy, no cap), delivery 2,200 (2 slots, 25 energy, Heat risk), freelance 3,200 (3 slots, 30 energy, cap 3 per week, needs Craft 2 or more).

I checked these in a 200-seed, 30-day simulation using the Appendix B script. All numbers are design values, not real Warri wages or prices:

| Strategy | Median day-30 cash | Avg broke days |
|---|---|---|
| shop x2 per day | about ₦4,800 | 0.0 |
| delivery x2 per day | about ₦26,400 | 0.0 |
| shop + delivery | about ₦27,600 | 0.0 |
| freelance + delivery + shop | about ₦47,200 | 0.0 |

Shop work is survival (you stay afloat but barely progress), delivery is progress, and freelance is a gated bonus. If the agent changes any number, it must re-run the sim and keep: nobody goes broke, shop-only ends near break-even, and no strategy has more than 10x the shop-only result.

### 6.12 Backgrounds (character creation)
| Background | Skill bonus | Start cash |
|---|---|---|
| Job seeker | Charisma +2 | ₦5,000 |
| Student | Craft +2 | ₦4,000 |
| Aspiring entrepreneur | Street +2 | ₦5,000 |

## 7. Chapter 1 missions (v0.1)

Six missions. The first three are given in full in section 8. Implement the other three from this spec.

| # | id | Title | Trigger | Idea |
|---|---|---|---|---|
| 1 | `m_first_hustle` | First Day Hustle | Day 1, home | Tutorial: do one job, eat, end the day |
| 2 | `m_keke_fare` | Keke Fare Wahala | Day 2 or later, Effurun | Driver demands double fare. Haggle / pay / argue |
| 3 | `m_light_go` | Light Don Go | First outage day | Charge phone: pay kiosk, borrow generator, skip |
| 4 | `m_aso_ebi` | Aso-Ebi Pressure | Saturday of week 1, Effurun | Friend wants matching fabric you can't afford |
| 5 | `m_market_day` | Market Day Test | Day 8 or later, Warri Main Market | Earn at least ₦3,000 profit from resale in one day |
| 6 | `m_rent_table` | Rent a Table | Day 14 or later, Warri Main Market, money at least ₦12,000 | Pay a deposit to rent a market table. Ends Chapter 1 and sets `flags.chapter1Done` |

## 8. Content seeds (`packages/content/data/`)

Writers extend these files. All Pidgin lines are `draft` `[REVIEW]`.

`locations.json`
```json
[
  { "id": "udu_home", "name": "Your Room, Udu", "blurb": "Small room, big dreams.", "art": "udu_home" },
  { "id": "effurun", "name": "Effurun Roundabout", "blurb": "Keke, shops, noise. The place never sleeps.", "art": "effurun" },
  { "id": "warri_market", "name": "Warri Main Market", "blurb": "Everything dey here if you get patience.", "art": "warri_market" },
  { "id": "garden_park", "name": "Effurun Garden Park", "blurb": "Cheap peace and fresh air.", "art": "garden_park" }
]
```

`actions.json` (starter set)
```json
[
  { "id": "shop_shift", "label": "Work at provision shop", "location": "effurun",
    "slots": 2, "energy": 20, "skill": "charisma", "difficulty": 1, "money": [1500, 2100],
    "effects": { "mood": -3, "respect": 1 }, "affinity": { "mama_tonye": 3 },
    "successLine": "Mama Tonye smile. Customers no wahala today.",
    "failLine": "Customers vex. E no easy.", "reviewStatus": "draft" },
  { "id": "delivery_run", "label": "Deliver packages", "location": "warri_market",
    "slots": 2, "energy": 25, "skill": "street", "difficulty": 2, "money": [1900, 2500], "failMoney": 300,
    "effects": { "mood": -4 }, "failEffects": { "heat": 2 },
    "successLine": "Parcel reach safe. Customer dey happy.",
    "failLine": "You miss the address. Wahala dey o.", "reviewStatus": "draft" },
  { "id": "freelance_gig", "label": "Do a design gig on your phone", "location": "udu_home",
    "slots": 3, "energy": 30, "skill": "craft", "difficulty": 2, "money": [2800, 3600], "weeklyCap": 3,
    "requires": { "minSkill": { "craft": 2 } }, "effects": { "mood": -2 },
    "successLine": "Client pay. Your hustle dey work.",
    "failLine": "Client no like am. Back to the drawing board.", "reviewStatus": "draft" },
  { "id": "market_resell", "label": "Resell goods at the market", "location": "warri_market",
    "slots": 1, "energy": 15, "skill": "street", "difficulty": 2, "money": [600, 1500], "failMoney": 400,
    "effects": { "heat": 0 }, "successLine": "You bargain well. Profit enter.",
    "failLine": "Buyer waka go. You lose small.", "reviewStatus": "draft" },
  { "id": "park_chill", "label": "Rest in the park", "location": "garden_park",
    "slots": 1, "energy": 0, "money": [0, 0], "effects": { "mood": 8, "energy": 10 },
    "successLine": "Fresh air. Your head clear small.", "failLine": "", "reviewStatus": "draft" }
]
```
(`slots: 1`, `energy: 0` actions with `money: [0,0]` always succeed. Implement `successChance = 1` for actions with no `skill` and no `difficulty`.)

`items.json`
```json
[
  { "id": "power_bank", "name": "Power bank", "price": 6000, "oneTime": true, "blurb": "Light go, phone still dey alive." },
  { "id": "meal_basic", "name": "Basic meal", "price": 500, "hungerDelta": -35, "moodDelta": 2 }
]
```

`npcs.json` (names are placeholders `[REVIEW]`)
```json
[
  { "id": "mama_tonye", "name": "Mama Tonye", "role": "Provision shop owner", "home": "effurun" },
  { "id": "ejiro", "name": "Ejiro", "role": "Keke rider and friend", "home": "effurun" }
]
```

`missions.json` (three in full; each mission is an event with an `id` and `trigger`)
```json
[
  { "id": "m_keke_fare", "type": "mission", "title": "Keke Fare Wahala",
    "trigger": { "minDay": 2, "location": "effurun" },
    "text": "The keke rider says the fare is now double. You know say e no be so.",
    "choices": [
      { "id": "haggle", "label": "Haggle",
        "check": { "skill": "charisma", "difficulty": 2 },
        "success": { "text": "You bargain well. Normal fare.", "effects": { "stats": { "respect": 2 } } },
        "fail": { "text": "He no gree. You pay extra.", "effects": { "money": -200, "stats": { "mood": -3 } } } },
      { "id": "pay", "label": "Just pay", "success": { "text": "You pay. No stress.", "effects": { "money": -300 } } },
      { "id": "argue", "label": "Argue", "success": { "text": "Loud talk. People dey look you.", "effects": { "stats": { "heat": 3, "mood": -3 } } } }
    ],
    "reviewStatus": "draft" },
  { "id": "m_light_go", "type": "mission", "title": "Light Don Go",
    "trigger": { "firstOutage": true },
    "text": "No light, and your phone dey 4%. You get one important message to answer.",
    "choices": [
      { "id": "kiosk", "label": "Pay a kiosk to charge", "success": { "text": "Phone dey alive again.", "effects": { "money": -300 } } },
      { "id": "borrow", "label": "Borrow a neighbour's generator", "success": { "text": "E help. You owe am a favour.", "effects": { "stats": { "mood": 2 }, "flags": { "owes_neighbour": true } } } },
      { "id": "skip", "label": "Skip it", "success": { "text": "You miss the message.", "effects": { "stats": { "mood": -5 } } } }
    ],
    "reviewStatus": "draft" },
  { "id": "m_aso_ebi", "type": "mission", "title": "Aso-Ebi Pressure",
    "trigger": { "weekday": 5, "minDay": 6, "location": "effurun" },
    "text": "Ejiro wants you to buy matching fabric for Saturday. Your pocket no ready.",
    "choices": [
      { "id": "buy", "label": "Buy the fabric (₦4,000)", "requires": { "minMoney": 4000 },
        "success": { "text": "You turn up fine fine.", "effects": { "money": -4000, "affinity": { "ejiro": 8 }, "stats": { "respect": 3, "mood": 5 } } } },
      { "id": "negotiate", "label": "Negotiate a cheaper cut",
        "check": { "skill": "charisma", "difficulty": 3 },
        "success": { "text": "Cheaper cut work.", "effects": { "money": -2000, "affinity": { "ejiro": 4 } } },
        "fail": { "text": "Tailor no gree.", "effects": { "money": -300, "affinity": { "ejiro": -2 } } } },
      { "id": "decline", "label": "Politely decline", "success": { "text": "Ejiro hear you, small vex.", "effects": { "affinity": { "ejiro": -3 } } } }
    ],
    "reviewStatus": "draft" }
]
```

`events.json` (random events, weight-based; add at least 8 for v0.1; example)
```json
[
  { "id": "e_generator_noise", "type": "random", "weight": 5, "location": "udu_home",
    "title": "Generator Orchestra",
    "text": "Your neighbour's generator starts at 6am. Sleep is gone.",
    "choices": [
      { "id": "endure", "label": "Endure", "success": { "text": "You rise tired.", "effects": { "stats": { "energy": -5 } } } },
      { "id": "buy_earplugs", "label": "Buy earplugs (₦200)", "success": { "text": "Peace, small.", "effects": { "money": -200 } } }
    ],
    "reviewStatus": "draft" }
]
```

**Content validation:** the loader must reject duplicate ids, unknown location/npc/item references, negative payouts on `money` ranges where `min > max`, and missing `reviewStatus`.

## 9. UI / UX specification (v0.1)

Layout: single column, max width 480 px, centred on desktop. A persistent top status bar (Day and weekday, slot pips, money, Energy/Mood/Hunger chips). Primary actions at the bottom, within thumb reach. No more than 3 lines of body text per dialogue beat.

Design tokens in `src/styles/tokens.css` (placeholder palette, adjust later):

```css
:root {
  --bg: #fff6e5; --surface: #ffffff; --ink: #1f1b16; --muted: #6b6258;
  --accent: #e8590c; --good: #2f9e44; --water: #1c7ed6; --danger: #c92a2a;
  --radius: 14px; --gap: 12px;
  --font: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root { --bg: #17130f; --surface: #221d17; --ink: #f4ede3; --muted: #a39887; }
}
```

| # | Screen | Contents | Acceptance |
|---|---|---|---|
| 1 | Title | Logo, New Game, Continue (shows day and money), Settings | Loads in under 2 s; Continue hidden if no save |
| 2 | Character creation | Name, 6 look presets, 3 backgrounds | Cannot proceed without a name; shows each background's bonus |
| 3 | Home hub | Status bar, location name, 3 suggested actions, End Day | All status numbers visible without scrolling |
| 4 | Map | 4 hubs with keke and walk cost (slots, ₦) | Cost shown before confirming; Haggle option for keke |
| 5 | Location | Action list with cost (slots, energy, ₦) and success hint | Disabled actions state why |
| 6 | Event modal | Speaker, text, 2 to 3 choices with consequence tags | Blocks other actions until chosen |
| 7 | Phone | Tabs: Chats (NPCs), Bank (ledger), Missions | Unread badge; chat replies are tap-to-send options |
| 8 | Shop | Meals, power bank | Purchase updates money instantly; cannot overspend |
| 9 | Profile | Skills, Respect, Heat, relationships | Each stat has a tap-for-explanation |
| 10 | Housing | Tier, rent due date, upgrade option | Warns 3 days before rent |
| 11 | Day Summary | Earned, spent, rep changes, one Daily Gist headline, Next Day | Fits one screen |
| 12 | Settings | Sound (placeholder), text size, Pidgin level (more or lighter), Lite mode, export/import save, reset | Export then import round-trips exactly |

Accessibility: semantic HTML, visible focus, labels on icon buttons, `prefers-reduced-motion` respected, contrast at least 4.5:1.

Chat: build the Phone's chat against this interface so Socket.IO can plug in later:
```ts
export interface ChatMessage { id: string; from: string; to: string; text: string; ts: number }
export interface ChatTransport {
  send(m: { to: string; text: string }): Promise<void>;
  onMessage(cb: (m: ChatMessage) => void): () => void;
}
```
Ship only `LocalNpcTransport` (replies from a content table with a short delay). Do not install socket.io.

## 10. Staged task list

For every stage: finish by running `pnpm typecheck && pnpm lint && pnpm test && pnpm build`. Commit with a clear message. Update `DECISIONS.md` for any deviation. Do not start the next stage in the same session unless told.

### Stage 0 — Scaffold
Create the pnpm workspace per section 4. Next.js App Router with TypeScript strict and static export. Configure ESLint, Prettier, Vitest (engine and content packages), Playwright (viewports 360×640 and 390×844), the CI workflow, `AGENTS.md`, and the docs files.
**Done when:** a clean clone passes install, typecheck, lint, test (even with one placeholder test), and build; CI is green; the home page renders "WARRI VIBE".

### Stage 1 — Engine core
Implement `types.ts` and the rules in section 6 for: RNG, success chance, `perform`, eating, `endDay` (order in 6.10), rent, light, weekly reset. Use Appendix A as a starting point and extend it.
**Tests (at least 30):** RNG determinism; success chance bounds 0.10 to 0.90; payout decay 0.8; slot and energy rejection; cannot overspend; meal cap 3; hunger penalty on wake energy; rent paid, partial, missed once, missed twice (moves to shared room); outage rolls follow seed; power bank reduces outage cost; weekly cap; Monday reset; day auto-ends at slot 5; save state is JSON-serialisable; same seed plus same actions gives identical state.
**Done when:** all tests pass, engine coverage at least 90%, and `packages/engine` imports nothing from DOM, React, or Next.

### Stage 2 — Content package and loader
Implement zod schemas, the loader, the validation rules in section 8, and the seed files. Add a build script that lists all `draft` strings as warnings.
**Done when:** valid content loads; tests prove each validation rule rejects bad data; the draft-strings report prints.

### Stage 3 — Text-first prototype UI
Zustand store (thin) wrapping the engine; one plain page with status bar, current location, action buttons with costs and disabled reasons, log, and End Day. `skipHydration` persistence with client rehydrate.
**Done when:** a human can play 20 days in the browser; reload keeps the state; a Playwright smoke test plays 3 days.

### Stage 4 — Save system
Versioned save envelope (`{ version, savedAt, state }`), zod validation on load, a migration hook, export to a copyable string (base64 JSON), import with validation and an error message, and a confirm-before-reset.
**Done when:** export then import yields a byte-identical state; corrupted or wrong-version input shows a friendly error and does not crash or overwrite the current save.

### Stage 5 — Map, travel, haggle, shop, housing
Map screen, keke versus walk, Haggle, Shop (meals, power bank), Housing screen with rent warning.
**Done when:** costs are shown before confirmation; haggling outcomes are seeded; overspending is impossible in the UI and the engine; rent warning appears 3 days before.

### Stage 6 — Events and missions
Event modal, random-event trigger (25% per slot advance), mission triggers, `pendingEvent` blocking, outcomes applying `money`, `stats`, `affinity`, `flags`. Implement missions 1 to 6 (section 7) and at least 8 random events.
**Done when:** a seeded 14-day run triggers at least 3 missions in the expected order; events never fire twice in one day; a blocked action explains why.

### Stage 7 — Phone (chat, bank, missions)
Chat screen via `LocalNpcTransport`, Bank (ledger of the last 50 transactions), Missions tab.
**Done when:** the ledger totals match the money change; unread badges work; no network calls occur.

### Stage 8 — Day Summary and weekly rhythm
Day Summary screen, a Daily Gist headline pool (at least 20 short headlines, `draft`), Saturday owambe invitation event, Sunday rest event.
**Done when:** the summary matches ledger and stat changes exactly; Saturday and Sunday events fire on the right weekdays.

### Stage 9 — Mobile polish and PWA
Apply design tokens, finish all 12 screens, add a manifest and a hand-written `sw.js` (cache-first for static assets, no extra dependency), Lite mode toggle, and an error boundary with a "reload and keep my save" option.
**Done when:** layout is usable at 360×640 and 390×844; tap targets are at least 44 px; Lighthouse mobile performance is 85 or more; first load is under 300 KB gzipped `[TUNE]`; the game loads offline after the first visit.

### Stage 10 — Optional 3D backdrop (only after a human playtest says the loop is fun)
Add three, @react-three/fiber, and drei. Build `LocationScene` for `warri_market` only, with a placeholder scene made of simple primitives (a human will replace it with a modelled glTF). Use `frameloop="demand"`, `dpr={[1, 1.5]}`, an orthographic camera, and `dynamic(..., { ssr: false })`. Add `canUse3D()` (WebGL check, `hardwareConcurrency` of at least 4, `deviceMemory` of at least 3 where available) and fall back to a static WebP image. Budgets: under 30k triangles, under 20 draw calls, textures at most 1024 px.
**Done when:** the fallback renders on devices or browsers without WebGL; Lite mode forces the image; the 3D chunk is lazy-loaded and does not count toward the initial bundle.

### Stage 11 — Economy bot and softlock test
Add `scripts/econ-sim.mjs` (Appendix B, ported to import the real engine). Run 1,000 seeded 30-day games with several scripted strategies.
**Done when:** no run reaches a state with no legal action (always provide a free fallback such as resting at home); no one is broke for long; the results table in section 6.11 is regenerated and committed; CI runs a reduced version.

### Stage 12 — Release hardening
Full Playwright playthrough from title to Chapter 1 complete; no console errors; privacy page stating that v0.1 stores data only in the player's browser and collects nothing; a README with run, test, and deploy steps.
**Done when:** the e2e test passes on both viewports; a fresh deployment works from a public link.

## 11. Performance and quality budgets

Initial JS under 300 KB gzipped, no render-blocking third-party scripts, images as WebP, 60 fps UI interactions, no layout shifts on load, and playable on throttled slow 3G within about 5 seconds `[TUNE]`.

## 12. Exploit and risk checklist (the agent must keep these true)

| Risk | Control |
|---|---|
| Repeat-action grinding | 0.8 payout decay per repeat; weekly caps |
| Save-scumming rerolls | RNG state lives in the save, so identical actions give identical results |
| Save tampering | Accepted in single-player; the engine is pure so the server can re-validate in v1.1 |
| Economy runaway | Sim in CI; sinks (food, keke, rent, light) |
| Softlock | Always one free legal action; the bot test enforces this |
| Long text | Max 3 lines per beat; lint content length |
| Culture and language errors | `draft` flags plus human review before release |
| Real brands and people | Fictional names only |

## 13. Out of scope for v0.1

Multiplayer, accounts, cloud save, Socket.IO chat, payments or ads, business ownership beyond the Chapter 1 teaser, more than 4 hubs, a clothing system beyond cosmetic presets, voice acting, native apps, analytics.

## 14. Definition of done for v0.1

A new player can create a character, play through Chapter 1 (6 missions), pay rent, survive power cuts, and reach the "Rent a Table" ending on a phone, offline, with a persistent save. All tests pass, the economy sim shows no softlocks, and a native reviewer has moved the Pidgin text from `draft` to `approved`.

---

## Appendix A — Engine reference (starting point; extend and test)

```ts
// packages/engine/src/engine.ts
import type { ActionDef, GameState, Stats } from './types';

export const RULES = {
  slotsPerDay: 5,
  rentEvery: 30,
  rent: { shared_room: 30000, self_contain: 60000 },
  wake: { shared_room: 80, self_contain: 90 },
  outageProb: { shared_room: 0.35, self_contain: 0.15 },
  outageCost: 400,
  outageCostPowerBank: 100,
  mealCap: 3,
  decay: 0.8,
} as const;

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

// mulberry32; seed lives in state
export function rand(s: GameState): number {
  s.seed = (s.seed + 0x6d2b79f5) | 0;
  let t = s.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function addMoney(s: GameState, amount: number, label: string) {
  s.money = Math.max(0, s.money + amount);
  s.ledger.push({ day: s.day, label, amount });
  if (s.ledger.length > 50) s.ledger.shift();
}

export function successChance(s: GameState, a: ActionDef): number {
  if (!a.skill && a.difficulty === undefined) return 1;
  const skill = a.skill ? s.skills[a.skill] : 0;
  const diff = a.difficulty ?? 0;
  return clamp(0.35 + 0.05 * (skill - diff) + 0.1 * ((s.stats.mood - 50) / 50), 0.1, 0.9);
}

export function canDo(s: GameState, a: ActionDef): string | null {
  if (s.pendingEvent) return 'Finish the current event first.';
  if (s.location !== a.location) return 'You are not at that place.';
  if (s.stats.energy < a.energy) return 'Not enough energy.';
  if (s.slot + a.slots > RULES.slotsPerDay) return 'Not enough of the day left.';
  if (a.weeklyCap && (s.weeklyCounts[a.id] ?? 0) >= a.weeklyCap) return 'Weekly limit reached.';
  if (a.requires?.minSkill) {
    for (const [k, v] of Object.entries(a.requires.minSkill)) {
      if ((s.skills as Record<string, number>)[k] < (v as number)) return `Needs ${k} ${v}.`;
    }
  }
  if (a.id.startsWith('freelance') && !s.light && !s.inventory.power_bank) return 'No light and no power bank.';
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
    if (pay !== 0) addMoney(s, pay, a.label);
    s.log.push(`${a.successLine}${pay ? ` (₦${pay})` : ''}`);
    if (a.skill && rand(s) < 0.25) s.skills[a.skill] = Math.min(10, s.skills[a.skill] + 1);
    for (const [k, v] of Object.entries(a.affinity ?? {})) {
      s.affinity[k] = clamp((s.affinity[k] ?? 0) + v, 0, 100);
    }
  } else {
    if (a.failMoney) addMoney(s, -a.failMoney, `${a.label} (failed)`);
    s.log.push(a.failLine);
    applyStats(s, a.failEffects);
  }
  applyStats(s, a.effects);
  s.log = s.log.slice(-100);
  return s.slot >= RULES.slotsPerDay ? endDay(s) : s;
}

function applyStats(s: GameState, e?: Partial<Stats>) {
  for (const [k, v] of Object.entries(e ?? {})) {
    const key = k as keyof Stats;
    s.stats[key] = clamp(s.stats[key] + (v as number), 0, 100);
  }
}

export function eat(prev: GameState, price = 500, hungerDelta = -35, moodDelta = 2): GameState {
  if (prev.mealsToday >= RULES.mealCap || prev.money < price) return prev;
  const s: GameState = structuredClone(prev);
  addMoney(s, -price, 'Meal');
  s.mealsToday += 1;
  s.stats.hunger = clamp(s.stats.hunger + hungerDelta, 0, 100);
  s.stats.mood = clamp(s.stats.mood + moodDelta, 0, 100);
  return s;
}

function payRent(s: GameState) {
  const due = RULES.rent[s.housing];
  const paid = Math.min(s.money, due);
  if (paid > 0) addMoney(s, -paid, 'Rent');
  if (paid < due) {
    const arrears = Number(s.flags.arrears ?? 0) + 1;
    s.flags.arrears = arrears;
    s.stats.mood = clamp(s.stats.mood - 20, 0, 100);
    if (arrears >= 2) s.housing = 'shared_room';
  } else {
    s.flags.arrears = 0;
  }
}

export function endDay(prev: GameState): GameState {
  const s: GameState = structuredClone(prev);
  if (s.day % RULES.rentEvery === 0) payRent(s);                       // 1
  s.stats.hunger = clamp(s.stats.hunger + 30, 0, 100);                 // 2
  const outage = rand(s) < RULES.outageProb[s.housing];                // 3
  s.light = !outage;
  if (outage) {
    addMoney(s, -(s.inventory.power_bank ? RULES.outageCostPowerBank : RULES.outageCost), 'Light cost');
  }
  s.day += 1; s.slot = 0; s.doneToday = {}; s.mealsToday = 0;          // 4
  if ((s.day - 1) % 7 === 0) s.weeklyCounts = {};                      // 5
  const penalty = s.stats.hunger > 70 ? 10 : 0;                        // 6
  s.stats.energy = clamp(RULES.wake[s.housing] - penalty, 0, 100);
  // 7: reputation drift and affinity decay: implement per section 6.8
  // 8: append Day Summary data to the log
  s.log.push(`Day ${s.day} don start.${s.light ? '' : ' Light don go.'}`);
  s.log = s.log.slice(-100);
  return s;
}

export function newGame(seed = Date.now() | 0): GameState {
  return {
    version: 1, day: 1, slot: 0, money: 5000,
    stats: { energy: 80, mood: 60, hunger: 20, respect: 10, heat: 0 },
    skills: { charisma: 1, street: 1, craft: 0 },
    location: 'udu_home', housing: 'shared_room', seed,
    doneToday: {}, weeklyCounts: {}, mealsToday: 0, light: true,
    inventory: {}, affinity: {}, flags: {}, completedMissions: [],
    pendingEvent: null, ledger: [], log: [],
  };
}
```

## Appendix B — Economy simulation (standalone, used to tune section 6.11)

```js
// scripts/econ-sim.mjs  (Stage 11 ports this to call the real engine)
const cfg = {
  start: 5000, meal: 500, meals: 3, keke: 300, rent: 30000, rentEvery: 30,
  outageProb: 0.35, outageCost: 400, slots: 5, wake: 80, days: 30, decay: 0.8,
  jobs: {
    shop:      { slots: 2, energy: 20, pay: 1800 },
    delivery:  { slots: 2, energy: 25, pay: 2200 },
    freelance: { slots: 3, energy: 30, pay: 3200 },
  },
  freelanceCapPerWeek: 3,
};
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function sim(plan, seed){
  const r=mulberry(seed); let cash=cfg.start, broke=0, fl=0;
  for(let d=1; d<=cfg.days; d++){
    if((d-1)%7===0) fl=0;
    let slots=cfg.slots, energy=cfg.wake, done={};
    cash-=cfg.meal*cfg.meals;
    if(r()<cfg.outageProb) cash-=cfg.outageCost;
    for(const j of plan){
      const J=cfg.jobs[j];
      if(j==='freelance' && fl>=cfg.freelanceCapPerWeek) continue;
      if(slots<J.slots || energy<J.energy) continue;
      const n=(done[j]=(done[j]||0)+1);
      cash+=J.pay*Math.pow(cfg.decay,n-1)-cfg.keke;
      slots-=J.slots; energy-=J.energy; if(j==='freelance') fl++;
    }
    if(d%cfg.rentEvery===0) cash-=cfg.rent;
    if(cash<0){broke++; cash=0;}
  }
  return {cash, broke};
}
const strategies = {
  'shop x2': ['shop','shop'],
  'delivery x2': ['delivery','delivery'],
  'shop + delivery': ['shop','delivery'],
  'freelance + delivery + shop': ['freelance','delivery','shop'],
};
for(const [name,plan] of Object.entries(strategies)){
  const runs=Array.from({length:200},(_,i)=>sim(plan,i+1));
  const cash=runs.map(x=>x.cash).sort((a,b)=>a-b);
  const broke=runs.reduce((a,x)=>a+x.broke,0)/200;
  console.log(name.padEnd(30),'median d30:',Math.round(cash[100]),'| avg broke days:',broke.toFixed(1));
}
```

## Appendix C — `AGENTS.md` (repo root)

```md
# AGENTS.md — WARRI VIBE

Read `docs/BUILD_PLAN.md` before changing anything. Work **one stage at a time** as the user directs.

## Rules
- Engine code (`packages/engine`) is pure TypeScript: no DOM, React, Next, or `Math.random()`. Use the seeded RNG in state.
- Content lives in `packages/content/data/*.json` and is validated with zod. Do not hard-code game text in components.
- Fictional names for all businesses and brands. Never invent facts about real places. Log unknowns in `docs/OPEN_QUESTIONS.md`.
- Mark all Pidgin or local-flavour text `"reviewStatus": "draft"`. Never set it to `"approved"`.
- No new dependencies without a note in `docs/DECISIONS.md`.
- v0.1 is single-player: no accounts, sockets, analytics, or payments.
- Mobile first: 360×640 and 390×844; tap targets at least 44 px.

## Before finishing any task
Run `pnpm typecheck && pnpm lint && pnpm test && pnpm build`. Report what changed, what you tested, and anything you were unsure about.
```
