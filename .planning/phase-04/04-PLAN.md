---
wave: 2
id: phase-04-rations
depends_on:
  - phase-01
files_modified:
  - src/App.tsx
  - src/layouts/DashboardLayout.tsx
  - src/lib/permissions.ts
  - src/types.ts
  - src/features/rations/RationsPage.tsx (new)
autonomous: true
---

# Phase 04 — Rations Management Page

## Objective

Dedicated ration disbursement tracking. View ration history (filtered inventory audit with `RATION:` prefix) and create new ration distributions. Based on legacy `legacy/src/features/rations/` but adapted to current architecture.

## Tasks

### Task 1: Create RationsPage

**File:** `src/features/rations/RationsPage.tsx`

<read_first>

- src/features/inventory/InventoryList.tsx (inventory adjustment pattern — rations reuses inventory/adjustment endpoint)
- src/features/resources/ResourcesPage.tsx (CRUD pattern, resource list)
- src/types.ts (Resource, InventoryItem)
- legacy/src/features/rations/pages/RationsPage.tsx (reference logic — RATION: prefix filtering)
  </read_first>

<action>
Create page with:
- History table: read from `GET /inventory/audit/{campId}` filtered client-side for entries where kind/description includes "RATION"
- Columns: date, resource name, quantity (negative = disbursed), description
- Create ration form: select resource from `GET /resources`, enter quantity, optional note
- Create uses `POST /inventory/adjustment` with type MANUAL_OUT and description prefixed "RATION:"
- Inline TanStack hooks: `useQuery(['inventory-audit', campId], ...)`, `useMutation` for adjustment
- Invalidation: on create, invalidate both `['inventory-audit', campId]` and `['inventory', campId]`
- Loading + empty states
- Permission: `inventory.*` (reuses inventory permission — rations is sub-feature)
</action>

<acceptance_criteria>

- Page shows ration history (audit entries with RATION: prefix)
- Create form posts MANUAL_OUT adjustment with RATION: description
- New ration appears in history after create
- `pnpm check` passes
  </acceptance_criteria>

### Task 2: Route + Nav

<read_first>

- src/App.tsx
- src/layouts/DashboardLayout.tsx
  </read_first>

<action>
Add route: `path="rations"` with ProtectedRoute checking `inventory.*`
Add nav item: icon `UtensilsCrossed` (or `BowlFood` as available from lucide-react), label "Rations"
Add permission `"rations": "inventory.read"` in NAV_PERMISSIONS
</action>

<acceptance_criteria>

- `/rations` route renders RationsPage
- Nav visible for resource_manager, worker (inventory.\* perms)
- `pnpm check` passes
  </acceptance_criteria>

## Verification

- `pnpm check` passes
- Manual: create ration → verify in history → check inventory reflects deduction
- Compare against legacy RationsPage behavior
