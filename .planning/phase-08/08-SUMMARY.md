---
phase: 08
plan: 08
subsystem: people
tags:
  - react
  - typescript
  - react-hook-form
  - zod
  - tanstack-query
  - person-management
requires:
  - phase: 02
    provides: camp context, auth store, permissions, API client patterns
provides:
  - Person detail page with profile card, status badge, stats, edit/delete/transfer
  - New person registration form with react-hook-form + zod validation
  - Person type extended with identification_code, blood_type, admitted_at
affects:
  - population-list
  - dashboard-metrics
tech-stack:
  added: []
  patterns:
    - Inline TanStack queries/mutations for feature-scoped data fetching
    - react-hook-form + zodResolver for form validation
    - Permission guard via can() helper from src/lib/permissions
    - Back-navigation pattern with ArrowLeft button
    - Loading skeleton and 404 page pattern (consistent with CampDetail)
    - Inline edit modal pattern (consistent with PopulationRoster)
key-files:
  created:
    - src/features/people/PersonDetail.tsx
    - src/features/people/NewPersonPage.tsx
  modified:
    - src/types.ts
    - src/App.tsx
    - src/features/people/PopulationRoster.tsx
key-decisions:
  - 'PersonDetail uses dedicated GET endpoint instead of filtering from list for cleaner data flow'
  - 'NewPersonPage uses system_admin permission guard (*) matching existing conventions'
  - 'Form uses simple string-based zod schema (no coercion) with manual type conversion in submit handler for Zod v4 compatibility'
patterns-established:
  - 'Detail page: permission guard → loading skeleton → 404 page → motion-animated info card → stats grid → action buttons'
  - 'Form page: permission guard → back nav → motion-animated form card → react-hook-form with zodResolver'
duration: Xmin
completed: 2026-05-24
---

# Phase 08: Person Detail + New Person Summary

**Person detail profile page with status badge, edit/delete/transfer actions, and new person registration form with react-hook-form + zod validation**

## Performance

- **Duration:** [in progress]
- **Started:** [in progress]
- **Completed:** 2026-05-24
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Added `identification_code`, `blood_type`, `admitted_at` optional fields to Person type
- Created PersonDetail page (`/population/:id`) with profile card, color-coded status badge, stats section, inline edit modal, transfer modal, and delete with confirmation
- Created NewPersonPage (`/population/new`) with react-hook-form + zod validation, profession select dropdown, and inline TanStack mutation
- Added routes for both pages in App.tsx with correct ordering (new before :id)
- Added "View Profile" clickable name links on PopulationRoster rows (navigates to `/population/{id}`)
- Added "NEW SURVIVOR" button in PopulationRoster header (navigates to `/population/new`)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create PersonDetail Page** - `4a3f855` (feat)
2. **Task 2: Create NewPersonPage** - `aa194ec` (feat)
3. **Task 3: Routes + Links** - `5dcb4c5` (feat)

**Plan metadata:** `pending` (docs: complete phase 08)

## Files Created/Modified

- `src/types.ts` - Extended Person interface with `identification_code`, `blood_type`, `admitted_at` optional fields
- `src/features/people/PersonDetail.tsx` - Person detail page with profile card, stats, edit/delete/transfer (new)
- `src/features/people/NewPersonPage.tsx` - New person registration form with react-hook-form + zod validation (new)
- `src/App.tsx` - Added `/population/new` and `/population/:id` routes with proper ordering and permission guards
- `src/features/people/PopulationRoster.tsx` - Added clickable name links and "NEW SURVIVOR" button

## Decisions Made

- **PersonDetail fetch strategy:** Uses dedicated `GET /camps/{campId}/people/{personId}` endpoint instead of filtering from the list query, providing cleaner data flow and enabling the endpoint to return extended person fields
- **Permission model:** PersonDetail guarded by `people.read` (accessible to all roles with that permission), NewPersonPage guarded by `system_admin` only (`can(user?.role, "*")`), matching existing app conventions
- **Zod form validation:** Uses simple string-based zod schema with manual type conversion (Number(), null handling) in submit handler, avoiding Zod v4 coercion complexities while maintaining full validation
- **Edit modal pattern:** Inline within PersonDetail with same fields as PopulationRoster (full_name, age, status, profession_id) plus skills_summary and photo_url for richer editing from the detail page

## Deviations from Plan

None - plan executed exactly as written.

### Pre-existing Issues (noted, not blocking)

- ESLint 10.4.0 flat config compatibility error (pre-existing project-wide issue from phases 03-07)
- esbuild binary compatibility error on Node.js v24 (pre-existing in `pnpm build` script, Vite build succeeds independently)

## Issues Encountered

- None - all tasks completed as specified without blockers

## Known Stubs

None - all components are fully wired with data sources, no placeholder text or hardcoded empty values.

## Threat Flags

No new security-relevant surface introduced beyond what was specified in the plan. Routes are properly permission-guarded.

## Self-Check: PASSED

- `src/features/people/PersonDetail.tsx` - EXISTS
- `src/features/people/NewPersonPage.tsx` - EXISTS
- `4a3f855` - FOUND in git log
- `aa194ec` - FOUND in git log
- `5dcb4c5` - FOUND in git log

## Next Phase Readiness

- Person detail page ready for `/population/:id` navigation
- New person form ready for `/population/new` navigation
- Population roster displays clickable name links and "NEW SURVIVOR" button
- Ready for phase 09 planning

---

_Phase: 08-person-detail-new_
_Completed: 2026-05-24_
