# GDF Roadmap — Gestión del Fin

> Generated: 2026-05-23

## Phases

| #   | Phase                | Goal                                                                                           | Status  |
| --- | -------------------- | ---------------------------------------------------------------------------------------------- | ------- |
| 01  | Tactical UI Redesign | Complete visual transformation: migrate from brutalist/cyberpunk to holographic tactical OS UI | Pending |

## Phase 01 — Tactical UI Redesign

**Status:** Pending
**Goal:** Replace the current brutalist dark / cyberpunk-neon visual system with a modern holographic tactical command-center aesthetic supporting dark and light modes with emotional UI states.

**Depends on:** None (standalone visual layer migration)

### What

- New design token system (dark + light mode CSS variables)
- Glassmorphism component library (Panel, Card, Dialog)
- Reactive holographic background with cursor tracking
- Emotional UI states (stable → alert → critical)
- Tactical map dashboard layout
- Migrate all existing brutalism/cyberpunk components incrementally
- Preserve all business logic, API contracts, and user flows

### Why

The current UI (`docs/AGENT.md` describes a "wrist-mounted military terminal" with phosphor green terminals and CRT scanlines; `docs/DESIGN_SYSTEM.md` describes cyberpunk neon with fuchsia/cyan neon on dark surfaces) targets a retro Fallout-style aesthetic. The product owner wants a modern, cinematic, holographic tactical OS feel that supports both dark and light modes with emotional/ambient UI reactivity.

### Out of Scope

- No backend changes
- No API contract changes
- No new features — pure visual layer
- No functional behavior changes
