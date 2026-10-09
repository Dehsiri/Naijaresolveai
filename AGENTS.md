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
