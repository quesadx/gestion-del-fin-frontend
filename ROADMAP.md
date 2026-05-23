# GDF Roadmap — Gestión del Fin

> Generated: 2026-05-23

## Phases

| #   | Phase                     | Goal                                                                                                                                                        | Status   |
| --- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 01  | Tactical UI Redesign      | Complete visual transformation: migrate from brutalist/cyberpunk to holographic tactical OS UI                                                              | Complete |
| 02  | Tactical UI Consolidation | Migrate remaining shadcn/ui components to glass styling, standardize interactive elements, deepen immersion                                                 | Complete |
| 03  | Holographic UI Elevation  | Cinematic depth: rounded corners, multilayer translucency, advanced motion system, dynamic ambient background, deep emotional UI, premium microinteractions | Complete |

## Phase 01 — Tactical UI Redesign

**Status:** Complete
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

## Phase 02 — Tactical UI Consolidation

**Status:** Complete
**Goal:** Migrate remaining shadcn/ui components (comboboxes, dropdowns, selects, popovers, command palettes, dialogs, inputs, hover cards) to glass tactical styling. Standardize all interactive elements (hover/focus states, focus rings, borders, overlays). Deepen emotional UI integration and refine microinteractions. Ensure complete dark/light mode consistency across every component.

**Depends on:** Phase 01

### What

- Restyle all 64 shadcn/ui primitives with gdf-\* glass tokens
- Glass styling for combobox, select, dropdown, popover, command, dialog, hover-card, tooltip
- Standardize hover/focus rings/borders across all interactive elements
- Migrate LockScreen splash to glass aesthetic
- Consolidate StockBarChart into tactical/ directory
- Deepen emotional UI: animate transitions, add per-component emotional reactivity
- Refine TacticalBackground: add particle layer, improve cursor glow performance
- Light mode audits: fix contrast issues on overlays, popovers, glass panels
- Responsive: mobile hamburger drawer glass restyle, tablet spacing audit
- Accessibility: focus ring visibility, color contrast ratios, aria labels
- Remove `.terminal-*` legacy CSS classes from globals.css
- Performance: reduce Tailwind purge-size, optimize backdrop-filter GPU layers

### Why

Phase 01 established the design token foundation, created core glass primitives, and migrated all feature pages. However, 64 shadcn/ui components still render with their default Zinc/Tailwind styling, creating immersion-breaking inconsistencies. Comboboxes, popovers, and dropdowns look generic — they don't belong in the holographic tactical OS. The design system needs to reach 100% coverage before it feels truly cohesive.

### Out of Scope

- No backend changes
- No new feature pages
- No data model changes
- No API contract changes
- No new npm packages unless justified by accessibility tooling audits

## Phase 03 — Holographic UI Elevation

**Status:** Pending
**Goal:** Elevate the UI from "modern dashboard" to "cinematic holographic tactical OS" through rounded corners, multilayer translucency, advanced motion, dynamic ambient backgrounds, deep emotional UI integration, and premium microinteractions.

**Depends on:** Phase 02

### What

- Rounded corners system: increase border-radius across design system (md→lg scale)
- Multilayer translucency: stacked glass panels with parallax depth
- Advanced motion system: page transitions, hover animations, floating panels, scanner effects
- Dynamic ambient background: more visible holographic waves, grid lines, nebula gradients, particles
- Deep emotional UI: atmospheric shifts during alert/critical states, color bleeding, ambient transformations
- Premium microinteractions: hover glow, focus rings, smooth state transitions, ripple effects
- Legacy component migration: audit and modernize remaining non-tactical components
- Background performance optimization: GPU-composited layers, reduced-motion support

### Why

Phases 01-02 established the design token foundation and migrated all 64 shadcn/ui components to glass styling. However, the interface still feels like a "modern dashboard" rather than a living holographic system. The corners are too angular, motion is limited, the background is too subtle, and emotional states don't transform the atmosphere enough. This phase bridges the gap from "consistent" to "immersive."

### Out of Scope

- No backend changes
- No API contract changes
- No new feature pages
- No data model changes
