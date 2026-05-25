---
wave: 2
id: phase-07-expedition-detail
depends_on:
  - phase-01
files_modified:
  - src/App.tsx
  - src/types.ts
  - src/features/explorations/ExpeditionDetail.tsx (new)
  - src/features/explorations/ExpeditionList.tsx (add link to detail)
autonomous: true
---

# Phase 07 — Exploration Detail Page

## Objective

Dedicated expedition detail page. Shows full expedition info, members, allocated resources, found resources, status timeline.

## Tasks

### Task 1: Create ExpeditionDetail Page

**File:** `src/features/explorations/ExpeditionDetail.tsx`

<read_first>

- src/features/explorations/ExpeditionList.tsx (expedition query pattern, status transitions, return modal)
- src/types.ts (Expedition type — may need fields: members, allocated_resources, found_resources)
- legacy/src/features/explorations/pages/ExplorationDetailPage.tsx (reference — members list, resources tables, status log)
  </read_first>

<action>
Create page with route `/expeditions/:id`:
- Fetch expedition detail: `GET /expeditions/{id}` (or filter from list)
- Show expedition info card: destination, status (color-coded badge), dates (departure, expected/max return), notes
- Members section (if backend returns members array): table with name, role, status
- Allocated resources table: resource name, quantity allocated
- Found resources table (if expedition RETURNED): resource name, quantity found
- Status timeline: show status history if available, or current status prominently
- Action buttons based on current status:
  - PLANNED → "Deploy Squad" (PATCH status to ONGOING)
  - ONGOING → "Confirm Return" (opens return modal) + "Mark Lost"
  - RETURNED → readonly
  - CANCELLED → readonly
- Inline TanStack Query hooks
- Loading + error states
- Guard: `expeditions.read` permission
</action>

<acceptance_criteria>

- `/expeditions/1` renders full expedition detail
- Status shown with color-coded badge
- Members table renders (or placeholder if not available)
- Resources tables render (or placeholder)
- Status action buttons work correctly
  </acceptance_criteria>

### Task 2: Return Modal + Resource Provisioning

<read_first>

- src/features/explorations/ExpeditionList.tsx (existing return modal code — lines with found_resources, status transition)
- legacy/src/features/explorations/pages/ExplorationsPage.tsx (reference return flow)
  </read_first>

<action>
Extract return modal from ExpeditionList into reusable pattern or duplicate in ExpeditionDetail:
- Input for actual return date
- Dynamic rows for found resources (name + quantity)
- On submit: `PATCH /expeditions/{id}/status` with status RETURNED + found_resources payload
- Invalidate `['expeditions', campId]` + `['dashboard-metrics', campId]`
</action>

<acceptance_criteria>

- Return modal opens from detail page for ONGOING expeditions
- Return modal has resource rows + date input
- Submitting return transitions status to RETURNED
- `pnpm check` passes
  </acceptance_criteria>

### Task 3: Link from Expedition List

<read_first>

- src/features/explorations/ExpeditionList.tsx
  </read_first>

<action>
Add "View Details" button or clickable behavior on expedition cards → navigate to `/expeditions/{id}`
</action>

<acceptance_criteria>

- Clicking expedition card navigates to detail page
- `pnpm check` passes
  </acceptance_criteria>

## Verification

- `pnpm check` passes
- Manual: create expedition → view detail → deploy → confirm return
- Verify all status transitions work from detail page
