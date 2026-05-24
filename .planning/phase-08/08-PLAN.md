---
wave: 2
id: phase-08-person-detail-new
depends_on:
  - phase-02
files_modified:
  - src/App.tsx
  - src/types.ts
  - src/features/people/PersonDetail.tsx (new)
  - src/features/people/NewPersonPage.tsx (new)
  - src/features/people/PopulationRoster.tsx (add links)
autonomous: true
---

# Phase 08 — Person Detail + New Person Pages

## Objective

Add dedicated person profile page and standalone new-person form. Current app has only list with inline edit modal.

## Tasks

### Task 1: Create PersonDetail Page

**File:** `src/features/people/PersonDetail.tsx`

<read_first>

- src/features/people/PopulationRoster.tsx (Person type usage, edit modal fields, status, profession)
- src/types.ts (Person type — may need: photo_url, skills_summary, identification_code, blood_type, admitted_at)
- src/features/admission/AdmissionList.tsx (person create/update mutation pattern)
- legacy/src/features/people/pages/PersonDetailPage.tsx (reference — status log, profession reassign, contribution override sections)
  </read_first>

<action>
Create page with route `/population/:id`:
- Fetch person detail: `GET /camps/{campId}/people/{id}` (or filter from list)
- Profile card: full_name, age, photo (if photo_url), status badge (color-coded), profession, camp
- Stats section: skills_summary, identification_code, blood_type (if available), admitted_at
- Edit button → inline edit modal (reuse edit pattern from PopulationRoster or create separate)
- Delete button → confirmation → `DELETE /camps/{campId}/people/{id}` → redirect to `/population`
- Transfer button → transfer modal (reuse from PopulationRoster)
- Back link to `/population`
- Inline TanStack hooks
- Loading skeleton
- Guard: `people.read` permission
</action>

<acceptance_criteria>

- `/population/1` renders person detail with all fields
- Edit opens modal → save updates person → page refreshes
- Delete with confirmation → redirects to list
- Missing person ID shows 404
  </acceptance_criteria>

### Task 2: Create NewPersonPage

**File:** `src/features/people/NewPersonPage.tsx`

<read_first>

- src/features/people/PopulationRoster.tsx (existing person fields, professions query)
- src/features/admission/AdmissionList.tsx (create mutation pattern)
- legacy/src/features/people/pages/PersonCreatePage.tsx (reference form fields)
  </read_first>

<action>
Create page with route `/population/new`:
- Form fields: full_name (required), age (number), profession_id (select from `GET /professions`), status (select), photo_url (text), skills_summary (textarea), identification_code (text, optional)
- react-hook-form + zod validation
- On submit: `POST /camps/{campId}/people` with payload
- On success: invalidate `['people', campId]` + `['dashboard-metrics', campId]` → navigate to `/population`
- Cancel button → `/population`
- Inline TanStack mutation
- Loading state during submit
- Guard: system_admin only
</action>

<acceptance_criteria>

- `/population/new` renders form with all fields
- Zod validation: full_name required, age must be number, etc.
- Submit creates person → redirects to population list
- Cancel navigates back
  </acceptance_criteria>

### Task 3: Routes + Links

<read_first>

- src/App.tsx
- src/features/people/PopulationRoster.tsx
  </read_first>

<action>
Add routes:
- `path="population/new"` — before `:id` to avoid route conflict
- `path="population/:id"`

In PopulationRoster:

- Add "View Profile" or clickable row → navigate `/population/{id}`
- Add "Register New Survivor" button → navigate `/population/new`
  </action>

<acceptance_criteria>

- Routes work: `/population/new`, `/population/1`
- Links from list page work correctly
- `pnpm check` passes
  </acceptance_criteria>

## Verification

- `pnpm check` passes
- Manual: create person via new page → view detail → edit → delete
- Test with invalid person ID
- Verify profession dropdown loads professions
