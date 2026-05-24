---
phase: 06
plan: 06
subsystem: ui
tags: [react, tanstack-query, camps, detail, routing]

requires:
  - phase: 01
    provides: Resources CRUD pattern (inline TanStack Query hooks, card-style lists)
  - phase: 03
    provides: Route protection pattern with ProtectedRoute
  - phase: 05
    provides: Inventory query endpoints

provides:
  - Camp detail drill-down page at `/camps/:id` with info card, stats, and quick links
  - Navigation from camp list to detail via VIEW DETAILS link

affects: [phase-07]

tech-stack:
  added: []
  patterns: [detail page with inline stats queries, permission guard inside component]

key-files:
  created:
    - src/features/camps/CampDetail.tsx
  modified:
    - src/App.tsx
    - src/features/camps/CampManagement.tsx

key-decisions:
  - Used separate inline useQuery hooks for stats (people, inventory, expeditions) instead of a single metrics endpoint for maximum API compatibility
  - Placed `/camps/:id` route before `/camps` in App.tsx to ensure param route match priority
  - Added VIEW DETAILS link in card footer rather than making entire card clickable, preserving existing edit button interaction

patterns-established: []

requirements-completed: []

duration: 1min
completed: 2026-05-24
---

# Phase 06: Camp Detail Summary

**Drill-down page for individual camps with info card, population/inventory/expedition stats, and quick navigation**

## Performance

- **Duration:** 1 min (64s)
- **Started:** 2026-05-24T08:35:06Z
- **Completed:** 2026-05-24T08:36:10Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- New CampDetail component at `/camps/:id` with full camp info card (name, location, status badge, AI context prompt, created date)
- Stats section with three metric cards: survivors count, inventory items count, active expeditions count
- Camp detail fetched via `GET /camps/{id}` with inline TanStack Query hook; stats from separate API queries
- 404 view for invalid/missing camp IDs with a "Back to Refuges" navigation button
- Loading skeleton during initial data fetch
- `camps.read` permission guard inside the detail component
- VIEW DETAILS link added to each camp card in CampManagement, styled in brand-primary color
- Route registered in App.tsx

## Task Commits

| #   | Task                           | Commit    | Type |
| --- | ------------------------------ | --------- | ---- |
| 1   | Create CampDetail page         | `eb0deaf` | feat |
| 2   | Add View Details link on cards | `e18627d` | feat |

## Files Created/Modified

- `src/features/camps/CampDetail.tsx` - New detail page component with info card, stats section, quick links, loading skeleton, 404 view (created)
- `src/App.tsx` - Added CampDetail import and `/camps/:id` route with ProtectedRoute (modified)
- `src/features/camps/CampManagement.tsx` - Added VIEW DETAILS link on each camp card navigating to `/camps/{id}` (modified)

## Decisions Made

- Used separate inline `useQuery` hooks for stats (people, inventory, expeditions) rather than a single metrics endpoint, for maximum API compatibility across environments
- Placed `/camps/:id` route before `/camps` in App.tsx to ensure path-parameter route takes priority
- Added VIEW DETAILS link in the camp card footer rather than making the entire card clickable, preserving existing edit button interaction
- Active expeditions filtered by `ONGOING` or `ACTIVE` status for the stat count
- Followed existing design patterns: dark theme, brutalist borders, motion animations, monospace metadata, skeleton loading

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Pre-existing esbuild build failure for server-side bundling (`dist/server.cjs`) — unrelated Vite frontend build succeeded without errors

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Camp detail complete with stats and quick links
- Ready for Phase 07 (Exploration Detail — `/expeditions/:id`)

## Self-Check: PASSED

- ✓ `src/features/camps/CampDetail.tsx` exists
- ✓ `.planning/phase-06/06-SUMMARY.md` exists
- ✓ Commit `eb0deaf` (Task 1) exists in git log
- ✓ Commit `e18627d` (Task 2) exists in git log
- ✓ Vite build succeeds
- ✓ No unexpected file deletions

---

_Phase: 06_
_Completed: 2026-05-24_
