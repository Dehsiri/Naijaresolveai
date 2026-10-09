# Contracts

Public engine API: see docs/AGENT_PLAYBOOK.md section 4.

```ts
// packages/engine/src/index.ts
export type { GameState, ActionDef, Stats, Housing, DaySummary, ItemDef, NpcDef, LocationDef, MissionDef, EventDef } from './types';
export { RULES, newGame, rand, successChance, canDo, perform, eat, endDay } from './engine';

export function travel(
  s: GameState, to: string, opts: { mode: 'keke' | 'walk'; haggle?: boolean }
): GameState;

export function buyItem(s: GameState, itemId: string, content: any): GameState;
export function upgradeHousing(s: GameState): GameState;

export function maybeTriggerEvent(s: GameState, content: any): GameState;
export function chooseEvent(s: GameState, choiceId: string, content: any): GameState;

export function daySummary(before: GameState, after: GameState): DaySummary;

export function exportSave(s: GameState): string;
export function importSave(raw: string):
  | { ok: true; state: GameState }
  | { ok: false; error: string };
```

## Contract change requests
<!-- Append only. Format:
### YYYY-MM-DD · requested by [agent] · status: open | accepted | rejected
What and why. -->
