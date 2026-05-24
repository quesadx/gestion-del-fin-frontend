---
wave: 3
id: phase-09-person-flows
depends_on:
  - phase-08
files_modified:
  - src/features/people/PersonDetail.tsx
  - src/features/people/PopulationRoster.tsx
autonomous: true
---

# Phase 09 — Person Status Log + Profession Reassignment + Contribution Override

## Objective

Add status change logging, profession reassignment, and contribution override to person detail. These flows exist in legacy but are missing in current app.

## Tasks

### Task 1: Status Log Flow

<read_first>

- src/features/people/PersonDetail.tsx (existing detail page to extend)
- src/features/people/PopulationRoster.tsx (existing status field in edit modal)
- legacy/src/features/people/pages/PersonDetailPage.tsx (reference — status log section, `POST /camps/{campId}/people/status-log`)
  </read_first>

<action>
Add status log section to PersonDetail page:
- Show current status as primary badge
- "Log Status Change" button → opens modal with:
  - new_status select: HEALTHY, SICK, INJURED, AWAY, DEAD, WOUNDED, MISSING, DECEASED
  - reason textarea (optional)
- On submit: `POST /camps/{campId}/people/status-log` with `{ person_id, new_status, reason, changed_by }`
- Show status history below (if endpoint returns logs) or just current status
- Invalidate `['people', campId]` + person detail on change
- Inline TanStack mutation
</action>

<acceptance_criteria>

- "Log Status Change" button visible on PersonDetail
- Modal with status select + reason works
- Submit calls status-log endpoint
- Status badge updates after change
- `pnpm check` passes
  </acceptance_criteria>

### Task 2: Profession Reassignment

<read_first>

- src/types.ts
- src/features/people/PersonDetail.tsx
- legacy/src/features/people/pages/PersonDetailPage.tsx (reference — reassign section, `POST /camps/{campId}/people/profession-reassignments`)
  </read_first>

<action>
Add profession reassignment section to PersonDetail page:
- Show current profession
- "Reassign Profession" button → opens modal with:
  - to_profession_id select from `GET /professions`
  - reason textarea (optional)
  - start_date (optional)
  - end_date (optional)
- On submit: `POST /camps/{campId}/people/profession-reassignments` with payload
- Invalidate person detail + people list on success
- Inline TanStack mutation
</action>

<acceptance_criteria>

- "Reassign Profession" button visible
- Modal with profession select loads from `GET /professions`
- Submit calls reassignment endpoint
- Profession updates in UI after change
- `pnpm check` passes
  </acceptance_criteria>

### Task 3: Contribution Override

<read_first>

- src/features/people/PersonDetail.tsx
- legacy/src/features/people/pages/PersonDetailPage.tsx (reference — contribution override section, `POST /camps/{campId}/people/contribution-overrides`)
  </read_first>

<action>
Add contribution override section to PersonDetail page:
- "Override Contribution" button → opens modal with:
  - resource_type_id select from `GET /resources`
  - amount number input
  - reason textarea (required)
  - start_date (optional)
  - end_date (optional)
- On submit: `POST /camps/{campId}/people/contribution-overrides` with payload
- Inline TanStack mutation
</action>

<acceptance_criteria>

- "Override Contribution" button visible on PersonDetail
- Modal with resource select + amount + reason works
- Submit calls contribution-overrides endpoint
- `pnpm check` passes
  </acceptance_criteria>

## Verification

- `pnpm check` passes
- Manual: change person status → verify log created
- Reassign profession → verify update
- Create contribution override → verify API call succeeds
- Test all from PersonDetail page
