---
phase: 09
plan: 01
subsystem: people
tags:
  - status-log
  - profession-reassignment
  - contribution-override
  - person-detail
  - modals
requires: []
provides:
  - Status change logging for person records
  - Profession reassignment workflow
  - Contribution override workflow
affects:
  - src/features/people/PersonDetail.tsx
tech-stack:
  added: []
  patterns:
    - Inline TanStack useMutation per feature
    - AnimatePresence modals with brutalist styling
    - Resources fetched via GET /resources for override select
key-files:
  created: []
  modified:
    - src/features/people/PersonDetail.tsx
decisions: []
metrics:
  duration: ~15min
  completed_date: 2026-05-24
---

# Phase 09 Plan 01: Person Flows — Status Log + Profession Reassignment + Contribution Override

Added three new person management flows to the PersonDetail page: status change logging, profession reassignment, and contribution override. Each flow has its own action button in a new "Personnel Actions" section and its own modal with inline TanStack useMutation.

## Summary

- **Status Log Flow**: "Log Status Change" button → modal with new_status select (HEALTHY, SICK, INJURED, WOUNDED, AWAY, MISSING, DEAD, DECEASED) + optional reason textarea → `POST /camps/{currentCampId}/people/status-log`
- **Profession Reassignment**: "Reassign Profession" button → modal with profession select from `GET /professions` + optional reason + optional start/end dates → `POST /camps/{currentCampId}/people/profession-reassignments`
- **Contribution Override**: "Override Contribution" button → modal with resource_type_id select from `GET /resources` + amount + required reason + optional dates → `POST /camps/{currentCampId}/people/contribution-overrides`
- All mutatations invalidate `['person', currentCampId, personId]` and `['people']` on success
- Resources query added: `GET /resources` for the override resource type select

## Completed Tasks

| Task | Name                             | Commit    | Files                                  |
| ---- | -------------------------------- | --------- | -------------------------------------- |
| 1–3  | Status Log + Reassign + Override | `1711f8d` | `src/features/people/PersonDetail.tsx` |

## Verification

- `vite build` — ✅ Passed
- `pnpm run typecheck` — ✅ No errors in modified files (all pre-existing errors in `legacy/` and `e2e/`)
- `pnpm run spell` — ✅ No new spell issues
- ESLint — ⚠️ Pre-existing config error (flat config format), not blocking

## Deviations from Plan

None. Plan executed as written. All three flows implemented in the single target file as specified.

## Known Stubs

None.

## Self-Check: PASSED

- `src/features/people/PersonDetail.tsx` — ✅ Modified and committed
- Commit `1711f8d` — ✅ Exists in git log
- Build passes — ✅ vite build successful
