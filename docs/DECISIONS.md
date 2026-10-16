# Architecture & Technical Decisions

## 2026-10-09 · Decision 001 · Monorepo & Framework Architecture
- **Decision:** Use monorepo with `packages/engine` (pure TypeScript), `packages/content` (Zod + JSON loaders), and `apps/web` (Next.js App Router static export + Zustand + CSS Modules).
- **Rationale:** Ensures game logic is 100% deterministic, testable in node without DOM dependencies, ready for server portability in v1.1, while providing a fast, mobile-first PWA frontend for web users.

## 2026-10-09 · Decision 002 · Pure Seeded RNG
- **Decision:** Mulberry32 PRNG seeded and stored directly in `GameState.seed`.
- **Rationale:** Guarantees save state reproducibility and prevents unseeded non-deterministic gameplay bugs.

## 2026-10-12 · Decision 003 · 3D Avatar Rendering with Three.js
- **Decision:** Add `three` and `@types/three` dependencies to `apps/web` (as planned in `docs/BUILD_PLAN.md` Section 3).
- **Rationale:** Powers mobile-first, high-performance real-time 3D procedural rendering for male and female avatars with customizable Nigerian cultural attire (Senator, Ankara, Gele, Fila cap, coral beads), animated gestures, and state-reactive posture without heavy asset downloads.
