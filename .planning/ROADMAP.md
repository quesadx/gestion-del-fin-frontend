# ROADMAP — Gestión del Fin Frontend

**Project:** Gestión del Fin — Zombie apocalypse multi-camp resource manager (frontend)
**Last updated:** 2026-05-23

---

### Phase 01: Tactical UI Redesign

**Goal:** Complete visual transformation from brutalist/cyberpunk to holographic tactical OS — maintain all business logic, support dark+light modes, emotional UI states, incremental migration.

**Requirements:** RNF-03, RNF-04

**Plans:** 7 plans

Plans:

- [ ] 01-01-PLAN.md — Design token foundation (tokens.css, tailwind config, globals cleanup)
- [ ] 01-02-PLAN.md — Glass primitives (GlassPanel, TacticalButton, StatusBadge, HoloLoader)
- [ ] 01-03-PLAN.md — Dynamic background + emotional UI + theme toggle
- [ ] 01-04-PLAN.md — Layout migration (AppShell glass restyle, docs update)
- [ ] 01-05-PLAN.md — Page import swap (Panel→GlassPanel, GlitchButton→TacticalButton, ScreenLoader→HoloLoader)
- [ ] 01-06-PLAN.md — Dashboard + Login + ErrorBoundary + StockBarChart restyle
- [ ] 01-07-PLAN.md — Cleanup + polish (delete dead code, toast restyle, final validation)

---

### Phase 02: Tactical UI Consolidation

**Goal:** Restyle all shadcn/ui primitives with gdf-\* glass tokens, standardize interactive element behavior (hover/focus/borders), deepen emotional UI, migrate LockScreen to glass, relocate StockBarChart to tactical/, refine TacticalBackground with particle layer, and perform dark/light mode audit.

**Requirements:** RNF-03, RNF-04

**Plans:** 7 plans

Plans:

- [ ] 02-01-PLAN.md — CSS foundation (shadcn variable mappings, glass overlay utilities, light mode border fixes)
- [ ] 02-02-PLAN.md — Dialog + Sheet + AlertDialog glass overlay restyle (P0-P1)
- [ ] 02-03-PLAN.md — DropdownMenu + Select + Popover glass overlay restyle (P0-P1)
- [ ] 02-04-PLAN.md — Command + Tooltip + HoverCard + Input + Textarea + Toggle glass restyle (P1-P2)
- [ ] 02-05-PLAN.md — Remaining shadcn/ui components gdf token unification (P3-P6)
- [ ] 02-06-PLAN.md — LockScreen glass migration + StockBarChart relocation + emotional UI deepening + particle layer
- [ ] 02-07-PLAN.md — Dark/light mode audit + responsive refinement + legacy CSS removal + final validation

---

### Phase 03: [To be planned]
