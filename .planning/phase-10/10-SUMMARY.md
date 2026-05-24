---
phase: 10
plan: resource-alerts
subsystem: alerts
tags:
  - inventory-alerts
  - stock-banner
  - nav-badge
  - dashboard-alerts
  - tanstack-query
  - animate-presence
requires:
  - phase: 01
    provides: Resources CRUD with minimum_stock, inventory.read permission
provides:
  - Global stock alert banner with dismiss
  - Pulsing nav indicator on inventory for critical stock
  - Dashboard stock alerts CRITICAL/LOW breakdown with link
affects:
  - src/layouts/DashboardLayout.tsx
  - src/features/dashboard/DashboardOverview.tsx
tech-stack:
  added: []
  patterns:
    - AnimatePresence alert banners with session-only dismiss
    - Shared TanStack Query key between banner and nav indicator
    - Status-based counts from client-side joined inventory snapshots
key-files:
  created: []
  modified:
    - src/layouts/DashboardLayout.tsx
    - src/features/dashboard/DashboardOverview.tsx
key-decisions:
  - Inventory alert query shared between banner and nav dot via queryKey ['inventory-alerts', currentCampId]
  - Dashboard alert counts computed from resourceSummaries (already queried) rather than a new API call
  - Session-only dismiss via local useState, reset on page reload
patterns-established:
  - 'Alert banners: AnimatePresence + motion.div with height animation, matching disconnected banner pattern'
requirements-completed: []

duration: 4 min
completed: 2026-05-24
---

# Phase 10: Resource Alerts Summary

**Global stock alert banner with red/amber dismissal, pulsing inventory nav dot, and CRITICAL/LOW dashboard breakdown**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-24T16:24:25Z
- **Completed:** 2026-05-24T16:29:05Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Global alert banner below header: red for CRITICAL resources (with names), amber for LOW (with count), session-dismiss via button
- Pulsing red dot on Inventory nav icon when any resources are CRITICAL, disappears when no criticals
- Dashboard Stock Alerts card enhanced with separate CRITICAL (red, pulse) and LOW (amber) counts, green "All stocks optimal" when clear, "View Details →" link to /inventory

## Task Commits

Each task was committed atomically:

1. **Task 1: Global Stock Alert Banner** - `b8d00c2` (feat)
2. **Task 2: Nav-Level Alert Indicator** - `a856242` (feat)
3. **Task 3: Dashboard Alert Emphasis** - `b84b327` (feat)

## Files Created/Modified

- `src/layouts/DashboardLayout.tsx` - Added inventoryAlerts query (30s refetch), alert banner with AnimatePresence, nav dot on Inventory icon (tasks 1 & 2)
- `src/features/dashboard/DashboardOverview.tsx` - Added criticalCount/lowCount computation, enhanced Stock Alerts card with breakdown and /inventory link (task 3)

## Decisions Made

- Inventory alert query (`['inventory-alerts', currentCampId]`) shared between banner and nav dot — single API call, dual consumers
- Dashboard alert counts computed from existing `resourceSummaries` query rather than adding a new API call — zero additional network overhead
- Session-only dismiss (local `useState`) — banner resets on page reload, no server state needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `pnpm check` blocked by pre-existing ESLint flat config migration issue (documented since Phase 01). Vite build, TypeScript check (non-legacy), and CSpell all pass separately.
- esbuild binary incompatible with NixOS — pre-existing environment issue. Vite build completes successfully.
- DashboardLayout.tsx had uncommitted changes before execution (inventoryAlerts query scaffolding) — incorporated into Task 1 as the query foundation.

## Known Stubs

None.

## Threat Flags

None.

## Next Phase Readiness

All resource alert surfaces integrated: banner, nav dot, dashboard card. Ready for verification or next phase.

---

_Phase: 10-resource-alerts_
_Completed: 2026-05-24_
