# GDF — Gestión del Fin

## What This Is

A camp management frontend for humanitarian operations — resource tracking, population management, inventory audit, and alerts. Built as a React SPA with TanStack Query, Zustand, and Tailwind CSS 4. Achieved feature parity with the legacy reference.

## Core Value

Complete camp operation management in a single, responsive web interface with real-time data via API proxy.

## Requirements

### Validated

- ✓ Resource types CRUD (create/edit/delete) — v1.0-legacy-parity
- ✓ Profession types CRUD — v1.0-legacy-parity
- ✓ User management with role assignment — v1.0-legacy-parity
- ✓ Ration disbursement tracking (history + create) — v1.0-legacy-parity
- ✓ Inventory audit (chronological event log) — v1.0-legacy-parity
- ✓ Camp detail page with stats + sub-entities — v1.0-legacy-parity
- ✓ Expedition detail page — v1.0-legacy-parity
- ✓ Person detail/profile + registration form — v1.0-legacy-parity
- ✓ Person flows (status logging, profession reassignment, contributions) — v1.0-legacy-parity
- ✓ Resource stock alerts (banner, nav indicator, dashboard emphasis) — v1.0-legacy-parity

### Active

(No active requirements — milestone complete)

### Out of Scope

- Backend/API changes — backend served by separate Express service via Railway
- Mobile app — web-first approach
- Offline mode — requires connectivity to Railway backend
- Unit/integration tests — deferred to next milestone

## Context

Shipped v1.0-legacy-parity with ~27,924 LOC TypeScript/TSX across 42 modified files.
Tech stack: React 19, TanStack Query 5, Zustand, Tailwind CSS 4, react-hook-form + zod.
API proxy: `/api-remote` → Express → Railway.
No backend changes — purely frontend rebuild.

## Key Decisions

| Decision                                                 | Rationale                                           | Outcome |
| -------------------------------------------------------- | --------------------------------------------------- | ------- |
| Single-file features, inline TanStack hooks              | Keep architecture flat, avoid premature abstraction | ✓ Good  |
| Zustand for client-only state (selected camp, nav state) | Minimal, appropriate scope                          | ✓ Good  |
| Types in `src/types.ts` (not per-feature)                | Avoid type fragmentation across files               | ✓ Good  |
| Tailwind CSS 4                                           | Project standard, utility-first                     | ✓ Good  |
| Permission guards via `src/lib/permissions.ts`           | Centralized, composable                             | ✓ Good  |

---

_Last updated: 2026-05-24 after v1.0-legacy-parity milestone_
