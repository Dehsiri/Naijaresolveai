# WARRI VIBE — Two-Agent Playbook (Codex + Antigravity)

This playbook sits next to `WARRI_VIBE_BUILD_PLAN.md` (save that one as `docs/BUILD_PLAN.md` in the repo). The build plan says **what** to build. This playbook says **who builds which part, in what order, and how to keep two agents from breaking each other's work.**

Labels: `[VERIFIED]` = confirmed in sources I found (mostly third-party guides, not the vendor's own docs). `[VERIFY]` = check in the tool's current docs before relying on it. `[ASSUMPTION]` = my design choice. `[HUMAN]` = a job for you, the product owner.

---

## 1. What I could and couldn't confirm about the tools

| Claim | Status |
|---|---|
| Antigravity reads a project-root `AGENTS.md` (the same cross-tool file Codex uses) | `[VERIFIED]` by third-party guides; `[VERIFY]` in Antigravity's own docs |
| Antigravity also has its own `GEMINI.md`, and when the two conflict `GEMINI.md` wins | `[VERIFIED]` by third-party guides |
| Antigravity rules files are capped at about 12,000 characters each | `[VERIFIED]` by one third-party guide; `[VERIFY]` |
| The version in which `AGENTS.md` support arrived (sources disagree between 1.20.3 and 1.20.5) | Unclear. If your version is older than early 2026, update it or add a `GEMINI.md` copy of the rules |
| Antigravity's Manager view can run agents in parallel | `[VERIFIED]` by a third-party doc |
| Antigravity can test UI in a built-in browser | `[VERIFY]` (not confirmed in my searches) |
| Free-tier quotas, model limits, and pricing for either tool | Unknown to me. Check before you plan around them. Stages are kept small so they fit inside modest limits |
| Codex reads `AGENTS.md` | `[VERIFIED]` by the same third-party doc; `[VERIFY]` in OpenAI's docs |

Design consequence: keep **one** short `AGENTS.md` (under about 4,000 characters) that both agents read. Put the long material in `docs/` and tell the agents to read it on demand.

## 2. Why two agents, and the one rule that matters

Two agents are useful for **division of labour** (logic versus interface) and for **cross-review** (a second agent catches what the first one missed). They are dangerous when both edit the same files at the same time. So:

> **Rule 1: one writer per path at a time.** Every folder has an owner for the current stage. The other agent may read it, never edit it.
> **Rule 2: contract first.** Before two agents work in parallel, the shared function signatures are written down in `docs/CONTRACTS.md` and merged.
> **Rule 3: CI is the referee.** Nothing merges unless `pnpm typecheck && pnpm lint && pnpm test && pnpm build` passes. You, the human, do the merging.

I don't claim either model is better at either job. The split below is by **type of work** (deterministic logic that is easy to test, versus visual work that benefits from seeing the browser), which holds whichever tool you swap in.

## 3. Ownership map

| Path | Owner | Notes |
|---|---|---|
| `packages/engine/**` | **Agent A (Codex)** | Pure TypeScript rules, tests, save envelope |
| `packages/content/**` | **Agent A (Codex)** | JSON, zod schemas, loader. Writers (you) edit text here too |
| `scripts/**`, `.github/**` | **Agent A (Codex)** | Economy sim, CI |
| `apps/web/src/components/**`, `apps/web/src/app/**`, `apps/web/src/styles/**` | **Agent B (Antigravity)** | Screens, CSS Modules, tokens |
| `apps/web/e2e/**`, `apps/web/public/**` | **Agent B (Antigravity)** | Playwright, PWA, art, models |
| `apps/web/src/store/**` | **Agent B (Antigravity)** | Thin Zustand adapter that calls the engine's public API only |
| `docs/CONTRACTS.md`, `docs/HANDOFF.md`, `docs/DECISIONS.md` | **Both append; never rewrite the other's entries** | |
| Root config (`package.json`, `tsconfig`, lint config) | **Stage 0 agent only**, then change by agreement | |

You may swap A and B. Keep the principle: the logic agent never edits UI files, the UI agent never edits the engine.

## 4. The engine's public API (the contract)

Both agents code against this. Agent A implements it in `packages/engine/src/index.ts`. If either agent needs a signature changed, they append a "contract change request" to `docs/CONTRACTS.md` and stop. They do not edit the other agent's code.

```ts
// packages/engine/src/index.ts  (exports)
export type { GameState, ActionDef, Stats, Housing, DaySummary } from './types';
export { RULES, newGame, rand, successChance, canDo, perform, eat, endDay } from './engine';

export function travel(
  s: GameState, to: string, opts: { mode: 'keke' | 'walk'; haggle?: boolean }
): GameState;                              // spends slots and money, seeded haggle roll

export function buyItem(s: GameState, itemId: string, content: Content): GameState;
export function upgradeHousing(s: GameState): GameState;

export function maybeTriggerEvent(s: GameState, content: Content): GameState;   // sets pendingEvent
export function chooseEvent(s: GameState, choiceId: string, content: Content): GameState;

export function daySummary(before: GameState, after: GameState): DaySummary;

export function exportSave(s: GameState): string;                                // base64 JSON envelope
export function importSave(raw: string):
  | { ok: true; state: GameState }
  | { ok: false; error: string };
```

`Content` is the validated bundle from `packages/content`. The UI never reads raw JSON; it calls `loadContent()`.

## 5. Git workflow (this is what prevents collisions)

1. One repo, protected `main`. Every stage task is one branch and one pull request.
2. **Separate working folders for parallel work** using git worktrees:
   ```bash
   git worktree add ../warri-engine  -b stage-05-engine
   git worktree add ../warri-ui      -b stage-05-ui
   ```
   Point Codex at `../warri-engine` and Antigravity at `../warri-ui`. Never let both agents work in the same folder.
3. Merge order inside a stage: **engine PR first**, then the UI branch rebases onto `main` and finishes.
4. Branch names: `stage-NN-engine`, `stage-NN-ui`, `stage-NN-docs`.
5. Commit style: one logical change per commit, message says what and why.
6. You run the checks locally before merging, even if CI is green.

## 6. Stage assignment

Stages refer to `docs/BUILD_PLAN.md` section 10. "Lead" writes first; "Support" starts after the lead's PR (or the contract) is merged.

| Stage | Task | Lead | Support | Parallel? | Human gate |
|---|---|---|---|---|---|
| 0 | Scaffold, CI, docs | A (Codex) | none | **No. One agent only** | `pnpm build` passes on your machine |
| 1 | Engine core and 30+ tests | A | B reviews | No | Read the tests list |
| 2 | Content package and loader | A | B reviews | No | Check the draft-strings report |
| 3 | Text-first prototype UI | B (Antigravity) | A reviews | No | `[HUMAN]` Play 20 days |
| 4 | Save system | A: `exportSave`/`importSave` + tests | B: Settings UI and store wiring | **Yes after contract** | Export, then import round-trip |
| 5 | Map, travel, haggle, shop, housing | A: `travel`, `buyItem`, `upgradeHousing` | B: screens | **Yes after contract** | Costs shown before confirm |
| 6 | Events and missions | A: triggers, `chooseEvent`, content | B: event modal | **Yes after contract** | `[HUMAN]` Playtest missions; Pidgin review pass 1 |
| 7 | Phone (chat, bank, missions) | A: `LocalNpcTransport`, ledger helpers | B: Phone UI | **Yes after contract** | No network calls |
| 8 | Day Summary and weekly rhythm | A: `daySummary`, gist pool | B: summary screen | **Yes after contract** | Pidgin review pass 2 |
| 9 | Mobile polish and PWA | B | A reviews performance numbers | No | Test on a real cheap Android |
| 10 | Optional 3D backdrop | B | none | No | `[HUMAN]` Only if the loop is proven fun |
| 11 | Economy bot and softlock test | A | B reviews | No | Results table committed |
| 12 | Release hardening | B: e2e | A: CI, privacy page | **Yes** | Fresh deploy works |

## 7. Prompt templates (paste these)

### 7.1 Generic task prompt (works for any stage and either agent)

```
Read AGENTS.md, then docs/BUILD_PLAN.md (section [N] and the sections it cites),
docs/CONTRACTS.md, and docs/HANDOFF.md.

Your role this task: [ENGINE agent | UI agent].
Do ONLY Stage [N], part: [describe].

You may edit: [paths].
You must NOT edit: [paths].
Branch: [branch name].

Contract you implement or consume: [function names from docs/CONTRACTS.md].
If you need a contract change, append a request to docs/CONTRACTS.md and stop.

Done when: [copy the stage's "Done when" lines].

Before finishing run: pnpm typecheck && pnpm lint && pnpm test && pnpm build
Then append an entry to docs/HANDOFF.md (format in the file) and report:
what changed, what you tested, what you were unsure about.

If you are unsure how a library API works, read the installed package's types or docs
in node_modules. Do not guess from memory.
```

### 7.2 Stage 0 (Codex only)

```
Read AGENTS.md and docs/BUILD_PLAN.md sections 2, 3, 4 and 10 (Stage 0).
Do ONLY Stage 0: create the pnpm workspace, Next.js static-export app, packages/engine
and packages/content with placeholder tests, ESLint, Prettier, Vitest, Playwright config
(360x640 and 390x844), the GitHub Actions workflow, and the docs files
(DECISIONS.md, OPEN_QUESTIONS.md, CONTRACTS.md, HANDOFF.md) using the skeletons in
docs/BUILD_PLAN.md and docs/AGENT_PLAYBOOK.md section 11.
Done when: a clean clone passes pnpm install, typecheck, lint, test, build; the home page
renders "WARRI VIBE"; CI is green. Report anything you changed from the plan.
```

### 7.3 Stage 1 (Codex)

```
Role: ENGINE agent. Read AGENTS.md, docs/BUILD_PLAN.md sections 5, 6 and Appendix A,
docs/CONTRACTS.md, docs/HANDOFF.md.
Do ONLY Stage 1. Edit only packages/engine/**. Branch: stage-01-engine.
Implement types.ts and the rules in section 6, starting from Appendix A. Write at least 30
unit tests (list in Stage 1). Export the contract in docs/CONTRACTS.md; stub functions you
have not built yet with a clear TODO that throws.
Done when: tests pass, engine coverage >= 90%, the engine imports nothing from DOM, React or Next.
```

### 7.4 Stage 3 (Antigravity)

```
Role: UI agent. Read AGENTS.md, docs/BUILD_PLAN.md sections 9 and 10 (Stage 3),
docs/CONTRACTS.md, docs/HANDOFF.md.
Do ONLY Stage 3. Edit only apps/web/src/components, apps/web/src/app, apps/web/src/store,
apps/web/src/styles, apps/web/e2e. Do NOT edit packages/engine or packages/content.
Branch: stage-03-ui.
Build the text-first prototype: status bar, current location, action buttons with costs and
disabled reasons, log, End Day. Zustand store calls only the engine's public API.
Verify in a browser at 360x640 and 390x844 and attach screenshots to the PR description.
Done when: a human can play 20 days; reload keeps state; a Playwright smoke test plays 3 days.
```

### 7.5 Stage 5, the parallel pattern (contract first)

Step 1, Codex, branch `stage-05-engine`:
```
Role: ENGINE agent. Do Stage 5 engine part only: implement travel, buyItem and
upgradeHousing exactly as in docs/CONTRACTS.md, with tests for: keke vs walk costs,
seeded haggle outcomes (200/400), cannot overspend, power bank one-time purchase,
housing upgrade cost and comfort changes. Edit only packages/engine/** and packages/content/**.
```
Step 2, merge the engine PR. Step 3, Antigravity, branch `stage-05-ui`, after rebasing on `main`:
```
Role: UI agent. Do Stage 5 UI part only: Map screen (cost shown before confirm, Haggle
option for keke), Shop screen, Housing screen with rent warning 3 days ahead. Use only the
engine's public API. Do NOT edit packages/engine or packages/content.
Verify at 360x640 and 390x844 and attach screenshots.
```
Repeat the same two-step pattern for Stages 4, 6, 7 and 8 using the table in section 6.

## 8. Handoff log (`docs/HANDOFF.md`)

The two agents don't share memory. This file is how work carries over. Each agent appends an entry at the end of every task:

```md
## YYYY-MM-DD · Stage N · [agent] · branch name
- Done: ...
- Tests added: ...
- Contract changes requested: none | see CONTRACTS.md
- Known issues / unsure about: ...
- Next agent should: ...
```

## 9. Cross-review (use after every stage)

Ask the **other** agent to review, with this prompt. It must not change code, only report.

```
Review the diff of branch [name] against main. Do not edit files.
Report only findings, each with file and line, under these headings:
1. Breaks a rule in AGENTS.md or docs/BUILD_PLAN.md section 2
2. Tests that don't really test the behaviour (or missing cases)
3. Determinism problems (any Math.random, Date.now, or unseeded randomness in the engine)
4. Mobile problems (tap targets under 44px, layout at 360x640, text over 3 lines per beat)
5. Performance budget risks (new dependencies, large assets, bundle size)
6. Anything you are unsure about
Say "none" for an empty heading. Do not praise. Do not suggest new features.
```

You decide which findings to act on. Don't let reviewers expand the scope.

## 10. Human gates (your part)

- After **Stage 3:** play 20 days. If you wouldn't play a 4th day, fix the loop before building more.
- After **Stage 6:** play Chapter 1 to the end. Have a Warri Pidgin speaker review all `draft` text (pass 1). Replace `draft` with `approved` yourself, never the agents.
- After **Stage 8:** second Pidgin review pass, and ask 3 to 5 locals to rank the spots and flag anything that feels wrong.
- After **Stage 9:** test on a real low-end Android phone over mobile data.
- Before **Stage 10:** decide whether 3D is worth the time.

## 11. Files to add to the repo

### `AGENTS.md` (root; under 4,000 characters so it fits any rules-file cap)

```md
# AGENTS.md — WARRI VIBE

Before any task read: docs/BUILD_PLAN.md, docs/AGENT_PLAYBOOK.md, docs/CONTRACTS.md, docs/HANDOFF.md.
Do only the stage and paths the user assigns. One writer per path.

## Ownership
- Engine agent edits: packages/engine, packages/content, scripts, .github.
- UI agent edits: apps/web (components, app, store, styles, e2e, public).
- Never edit the other agent's paths. Need a signature change? Append a request to
  docs/CONTRACTS.md and stop.

## Code rules
- packages/engine is pure TypeScript: no DOM, React, Next, Date.now or Math.random.
  Use the seeded RNG in state.
- Game text and data live in packages/content/data/*.json (zod-validated), not in components.
- UI talks to the engine only through its public API (packages/engine/src/index.ts).
- If unsure how a library API works, read the installed package's types or docs. Do not guess.
- No new dependencies without a note in docs/DECISIONS.md.

## Content rules
- Fictional names for all businesses and brands. Never invent facts about real places;
  log unknowns in docs/OPEN_QUESTIONS.md.
- Mark all Pidgin or local-flavour text "reviewStatus": "draft". Never set "approved".
- No jokes about royal institutions, ethnic groups, politics or militancy.

## Scope
- v0.1 is single-player: no accounts, sockets, analytics, payments.
- Mobile first: 360x640 and 390x844; tap targets at least 44px.

## Finish every task with
pnpm typecheck && pnpm lint && pnpm test && pnpm build
Append an entry to docs/HANDOFF.md. Report what changed, what you tested, what you were unsure about.
```

### `GEMINI.md` (root; optional, Antigravity-specific; it wins over `AGENTS.md` on conflicts)

```md
# GEMINI.md — Antigravity-specific
- For any UI change, check it in a browser at 360x640 and 390x844 and include screenshots in the PR description.
- Follow AGENTS.md. This file only adds the browser-verification habit; it does not change ownership rules.
```

### `docs/CONTRACTS.md` skeleton

```md
# Contracts
Public engine API: see docs/AGENT_PLAYBOOK.md section 4 (copy the final signatures here once Stage 1 merges).

## Contract change requests
<!-- Append only. Format:
### YYYY-MM-DD · requested by [agent] · status: open | accepted | rejected
What and why. -->
```

### `docs/AGENT_PLAYBOOK.md`
Save this playbook file itself there.

## 12. Failure modes and recovery

| Problem | What to do |
|---|---|
| An agent edits files it doesn't own | Revert those files, re-prompt with the "You must NOT edit" line, and tell it to read AGENTS.md again |
| Two branches conflict | Merge the engine PR first, rebase the UI branch, and ask the UI agent to resolve conflicts without touching engine files |
| An agent invents a library API | Ask it to read the package's types in `node_modules` and fix its code against them |
| A stage drifts beyond the plan | Paste the "Done when" lines back and say "revert anything not listed" |
| Rules file seems ignored | Check the file is in the repo root, you are on a recent tool version, and the file is under the character cap. Re-state the key rules in the task prompt |
| Quota or rate limit hits mid-stage | Stop at a clean commit, append to `HANDOFF.md`, and resume in the other tool or later |
| Agents disagree on a design choice | Record both options in `DECISIONS.md` and decide yourself |
| Tests pass but the game feels wrong | That is a `[HUMAN]` gate. Playtest, then write a short change request in plain words |

## 13. Cost and time reality `[ASSUMPTION]`

At roughly one stage per work session, a solo owner reviewing every diff should expect the stages to take about 3 to 5 months part-time. That depends heavily on your quotas, review time, and how often the agents drift. Treat the earlier 20-week figure as a best case, not a promise.
