# WARRI VIBE 🚖⚡

> **A mobile-first, single-player browser life-sim set in a fictionalised Warri and Effurun, Delta State, Nigeria.**

---

## 🌟 Game Overview

In **WARRI VIBE**, you build a life from scratch in the vibrant streets of Warri and Effurun:
- **Hustle with a smile:** Work provision shop shifts, phone repairs, freelance graphic gigs, POS cash kiosks, and wedding party hype sessions.
- **Warri-only systems:** Handle erratic NEPA power outages (*"Light don go!"*), negotiate keke fares, balance street respect vs. police heat, and manage monthly rent with your landlord.
- **Story Missions & NPC Gists:** Complete all 6 Chapter 1 missions, text Mama Tonye and Ejiro on WhatsApp, build friendship affinity, and conclude Chapter 1 by securing your deposit for a prime market table at Warri Main Market!

---

## 🏗️ Monorepo Architecture

```
warri-vibe/
  AGENTS.md                  # Development & ownership rules
  GEMINI.md                  # Mobile viewport verification rules
  docs/
    BUILD_PLAN.md            # Detailed product, rule, and content spec
    AGENT_PLAYBOOK.md        # Two-agent contract and stage workflows
    CONTRACTS.md             # Engine public API contract definition
    DECISIONS.md             # Architectural decision record
    OPEN_QUESTIONS.md        # Local dialect & tuning tracker
    HANDOFF.md               # Task log & progress handoff tracker
  packages/
    engine/                  # Pure TypeScript deterministic engine + tests
      src/types.ts           # Domain models & GameState definition
      src/engine.ts          # Core game logic, Mulberry32 PRNG, math rules
      src/index.ts           # Engine public API
      tests/engine.test.mjs  # 32 unit tests
    content/                 # Zod-validated game JSON data + loader
      data/                  # locations, actions, items, npcs, missions, events
      src/loader.ts          # loadContent() validator & draft string linter
      tests/content.test.mjs # 5 content validation tests
  apps/
    web/                     # Next.js App Router (Static Export) + Zustand
      src/store/             # Zustand store adapter calling engine API
      src/components/        # StatusBar, LocationBanner, ActionCard, BottomNav, Modals
      src/styles/            # tokens.css & global.css (African Delta vibrant theme)
      public/                # PWA manifest, service worker, icons
  scripts/
    econ-sim.mjs             # Monte Carlo 30-day economy simulation (200 runs)
  .github/workflows/
    ci.yml                   # Automated CI check & build pipeline
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Test Suites
```bash
npm run test
```
*Executes all 32 Engine tests and 5 Content validation tests.*

### 3. Typecheck
```bash
npm run typecheck
```

### 4. Run Monte Carlo Economy Simulation
```bash
npm run sim
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser (designed mobile-first at `360×640` and `390×844`).

### 6. Build Production Static Export
```bash
npm run build
```
Generates a static web bundle inside `apps/web/out` (119 kB First Load JS).

---

## 📱 Mobile-First Features

- **Thumb Ergonomics:** Bottom navigation bar and action buttons with $\ge 44\text{px}$ touch targets.
- **Offline PWA:** Fully playable offline via Service Worker and local storage persistence.
- **Portability:** 1-click Base64 Save Code Export and Restore.
- **Web Audio FX:** Pure synthesizer audio feedback without heavy asset downloads.

---

## 📄 License & Content Policy

- Built as a tribute to Warri & Delta State culture.
- Fictionalized business and character names.
- All Pidgin strings are marked `"reviewStatus": "draft"` for community review.
