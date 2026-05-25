---
wave: 2
id: phase-06-camp-detail
depends_on:
  - phase-01
files_modified:
  - src/App.tsx
  - src/types.ts
  - src/features/camps/CampDetail.tsx (new)
  - src/features/camps/CampManagement.tsx (add link to detail)
autonomous: true
---

# Phase 06 — Camp Detail Page

## Objective

Drill-down page for individual camp. Shows camp info, population stats, inventory snapshot summary, expeditions list for that camp.

## Tasks

### Task 1: Create CampDetail Page

**File:** `src/features/camps/CampDetail.tsx`

<read_first>

- src/features/camps/CampManagement.tsx (camp CRUD pattern, Camp type)
- src/types.ts (Camp type — add location, ai_context_prompt fields)
- src/features/dashboard/DashboardOverview.tsx (metrics query pattern for stats)
  </read_first>

<action>
Create page with route `/camps/:id`:
- Read `id` from `useParams()`
- Fetch camp detail: `GET /camps/{id}` (or filter from `GET /camps`)
- Show camp info card: name, location, status (ACTIVE/ABANDONED badge), ai_context_prompt, created_at
- Stats section: people count, inventory item count, active expeditions count (via metrics endpoint or separate queries)
- Quick links: "View Population" → `/population`, "View Inventory" → `/inventory`
- If camp not found: 404 message + link back to camps list
- Inline TanStack Query hooks
- Loading skeleton
- Guard: `camps.read` permission
</action>

<acceptance_criteria>

- `/camps/1` renders camp detail with name, location, status, AI context
- Stats section shows aggregate counts
- Quick links navigate correctly
- Invalid camp ID shows 404 message
  </acceptance_criteria>

### Task 2: Link from Camps List

<read_first>

- src/features/camps/CampManagement.tsx
  </read_first>

<action>
Add clickable behavior on camp cards in CampManagement — clicking navigates to `/camps/{id}`
Or add "View Details" button on each camp card
</action>

<acceptance_criteria>

- Clicking camp card or "View Details" navigates to CampDetail
- `pnpm check` passes
  </acceptance_criteria>

## Verification

- `pnpm check` passes
- Manual: open camps list → click camp → see detail page with stats
- Test with invalid ID
