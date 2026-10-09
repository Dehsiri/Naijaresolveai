# Architecture & Technical Decisions

## 2026-10-09 · Decision 001 · Monorepo & Framework Architecture
- **Decision:** Use monorepo with `packages/engine` (pure TypeScript), `packages/content` (Zod + JSON loaders), and `apps/web` (Next.js App Router static export + Zustand + CSS Modules).
- **Rationale:** Ensures game logic is 100% deterministic, testable in node without DOM dependencies, ready for server portability in v1.1, while providing a fast, mobile-first PWA frontend for web users.

## 2026-10-09 · Decision 002 · Pure Seeded RNG
- **Decision:** Mulberry32 PRNG seeded and stored directly in `GameState.seed`.
- **Rationale:** Guarantees save state reproducibility and prevents unseeded non-deterministic gameplay bugs.
