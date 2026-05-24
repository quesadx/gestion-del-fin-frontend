---
phase: 07
plan: 07
subsystem: ui
tags: [react, tanstack-query, expeditions, detail, routing]

requires:
  - phase: 01
    provides: Resources CRUD pattern, Expedition type foundation
  - phase: 06
    provides: Detail page pattern (CampDetail as reference)

provides:
  - Expedition detail drill-down page at `/expeditions/:id` with info card, members table, allocated/found resources
  - Return modal with resource provisioning for ONGOING expeditions
  - Navigation from expedition list to detail via VIEW DETAILS link

affects: [phase-04, phase-05]

tech-stack:
  added: []
  patterns: [detail page with inline status mutation, resource name resolution via /resources query]

key-files:
  created:
    - src/features/explorations/ExpeditionDetail.tsx
  modified:
    - src/types.ts
    - src/App.tsx
    - src/features/explorations/ExpeditionList.tsx

key-decisions:
  - Extended Expedition type with members, allocated_resources, found_resources, actual_return_date fields from legacy Exploration interface
  - Return modal built directly into ExpeditionDetail (duplicate from ExpeditionList pattern) instead of extracting reusable component
  - Placed `/expeditions/:id` route before `/expeditions` in App.tsx like CampDetail pattern

patterns-established: []

requirements-completed: []

duration: 2min
completed: 2026-05-24
---

# Phase 07: Exploration Detail Summary

**Dedicated expedition detail page at `/expeditions/:id` with info card, members/resources tables, status action buttons, and return modal with found resource provisioning**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-24T08:42:10Z
- **Completed:** 2026-05-24T08:44:04Z
- **Tasks:** 2 (Task 1 included return modal; Task 2 for View Details link)
- **Files modified:** 4

## Accomplishments

- New ExpeditionDetail component at `/expeditions/:id` with:
  - Expedition info card: destination, color-coded status badge, date grid (departure, expected return, max return, actual return), mission briefing notes
  - Members table with person ID column (or placeholder if not available)
  - Allocated resources table with resource name resolution via /resources query (or placeholder)
  - Found resources table for RETURNED expeditions (or placeholder)
  - Action buttons: Deploy Squad (PLANNED), Confirm Return + Mark Lost (ONGOING), readonly for RETURNED/CANCELLED
  - Return modal: date input, dynamic found resources rows with resource select + quantity, PATCH /expeditions/{id}/status submit
  - Inline TanStack Query hooks for detail fetch, status mutation, and resource name resolution
  - Cache invalidation for ['expedition', id], ['expeditions', campId], ['dashboard-metrics', campId]
  - Loading skeleton, not-found/error view with back navigation
  - expeditions.read permission guard
- Expedition type extended with members, allocated_resources, found_resources, actual_return_date; added ResourceAllocation and ExplorationMember interfaces
- Route registered in App.tsx at `/expeditions/:id` before `/expeditions`
- VIEW DETAILS link added to each expedition card in ExpeditionList navigating to `/expeditions/{id}`, styled with brand-primary color and border

## Task Commits

| #   | Task                                                            | Commit    | Type |
| --- | --------------------------------------------------------------- | --------- | ---- |
| 1   | Create ExpeditionDetail page with info card, members, resources | `c0566ad` | feat |
| 2   | Add View Details link on expedition cards                       | `da64212` | feat |

**Note:** Task 2 (return modal with resource provisioning) was integrated into Task 1 — built directly into ExpeditionDetail during creation.

## Files Created/Modified

- `src/features/explorations/ExpeditionDetail.tsx` — New detail page component with info card, members table, allocated/found resources tables, action buttons, return modal, loading skeleton, and 404 view (created)
- `src/types.ts` — Added ResourceAllocation and ExplorationMember interfaces; extended Expedition with members, allocated_resources, found_resources, actual_return_date (modified)
- `src/App.tsx` — Added ExpeditionDetail import and `/expeditions/:id` route with ProtectedRoute (modified)
- `src/features/explorations/ExpeditionList.tsx` — Added VIEW DETAILS link navigating to `/expeditions/{id}` on each expedition card (modified)

## Decisions Made

- Extended `Expedition` type with `members`, `allocated_resources`, `found_resources`, `actual_return_date` — covers all fields needed both for the detail view and future API interactions
- Added `ResourceAllocation` and `ExplorationMember` interfaces as standalone types (not nested) for use in mutation payloads
- Return modal duplicated from ExpeditionList pattern rather than extracting a shared component — keeps each feature's modal self-contained per codebase convention
- Resource names in allocated/found resources tables resolved via the same `/resources` query used in ExpeditionList, with fallback display of `Resource #ID`
- Placed `/expeditions/:id` route before `/expeditions` to ensure path-parameter route takes priority (same pattern as CampDetail)

## Deviations from Plan

**1. [Rule 2 - Missing Critical] Added ExpeditionDetail route registration in App.tsx**

- **Found during:** Task 1 (Create ExpeditionDetail page)
- **Issue:** Plan didn't explicitly include adding the route to App.tsx — without the route, the page would never render
- **Fix:** Added import and `/expeditions/:id` route with ProtectedRoute before the `/expeditions` list route
- **Files modified:** src/App.tsx
- **Verification:** Build passes, route follows CampDetail pattern
- **Committed in:** c0566ad (amended into Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 — missing critical functionality)
**Impact on plan:** Essential for component to render. No scope creep.

## Issues Encountered

- Pre-existing esbuild build failure for server-side bundling (`dist/server.cjs`) — unrelated Vite frontend build succeeds without errors (same issue as Phase 06)
- `pnpm check` has pre-existing ESLint configuration error (flat config migration issue) — not introduced by this plan's changes

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Exploration detail is complete with info card, members, resources tables, status actions, and return modal
- Ready for Phase 08 (Person Detail + New — `/population/:id` profile + `/population/new` add person form)

## Self-Check: PASSED

- ✓ `src/features/explorations/ExpeditionDetail.tsx` exists
- ✓ `.planning/phase-07/07-SUMMARY.md` exists
- ✓ Commit `c0566ad` (Task 1) exists in git log
- ✓ Commit `da64212` (Task 2/View Details) exists in git log
- ✓ Vite build succeeds
- ✓ No unexpected file deletions
- ✓ Expedition type has members, allocated_resources, found_resources, actual_return_date
- ✓ VIEW DETAILS link present on expedition cards

---

_Phase: 07_
_Completed: 2026-05-24_
