---
wave: 2
id: phase-05-inventory-audit
depends_on:
  - phase-01
files_modified:
  - src/App.tsx
  - src/layouts/DashboardLayout.tsx
  - src/lib/permissions.ts
  - src/features/inventory/InventoryAudit.tsx (new)
autonomous: true
---

# Phase 05 — Inventory Audit Page

## Objective

Dedicated audit trail page. Current app has audit inline in InventoryList modal. Extract to full page with chronological log, resource name resolution, filtering.

## Tasks

### Task 1: Create InventoryAudit Page

**File:** `src/features/inventory/InventoryAudit.tsx`

<read_first>

- src/features/inventory/InventoryList.tsx (existing audit modal code — lines ~73-100 for audit query, modal rendering)
- src/types.ts (InventorySnapshot)
- legacy/src/features/inventory/pages/InventoryAuditPage.tsx (reference — resource name join, chronological log)
  </read_first>

<action>
Create page with:
- Chronological event table from `GET /inventory/audit/{campId}`
- Columns: timestamp, resource name (resolve via `GET /resources` join or inline map), type (MANUAL_IN/MANUAL_OUT), quantity, description/notes, user
- Resource name fallback: if `entry.resource?.name` unavailable, join from resources query key `['resources']`
- Filter by date range (optional) or resource type (optional)
- Pagination for large audit logs (use existing `src/components/Pagination.tsx`)
- Inline TanStack hook: `useQuery(['inventory-audit', campId], ...)`
- Guard: `inventory.*` permission
- Loading + empty states
</action>

<acceptance_criteria>

- `GET /inventory/audit/{campId}` renders chronological table
- Resource names shown (not numeric IDs) — joined from resources query
- Audit entries show correct type/quantity/description
- Pagination works for 20+ entries
  </acceptance_criteria>

### Task 2: Route + Nav

<read_first>

- src/App.tsx
- src/layouts/DashboardLayout.tsx
  </read_first>

<action>
Add route: `path="inventory/audit"` inside ProtectedRoute for `inventory.*`
No separate nav item — accessible from InventoryList page via link/button
Alternatively add secondary nav item if discoverability needed
</action>

<acceptance_criteria>

- `/inventory/audit` renders full audit page
- Navigation: add link from InventoryList page ("View Audit Trail" button)
- `pnpm check` passes
  </acceptance_criteria>

## Verification

- `pnpm check` passes
- Manual: make inventory adjustments → visit audit → verify entries appear with correct resource names
- Test pagination
