---
wave: 1
id: phase-01-resources-crud
depends_on: []
files_modified:
  - src/App.tsx
  - src/layouts/DashboardLayout.tsx
  - src/lib/permissions.ts
  - src/types.ts
  - src/features/resources/ResourcesPage.tsx (new)
autonomous: true
---

# Phase 01 — Resources CRUD Page

## Objective

Replace current read-only resource fetching with full CRUD page. User can view, create, edit, and delete resource types (name, unit, daily_ration, minimum_stock, auto_daily flag).

## Tasks

### Task 1: Create ResourcesPage

**File:** `src/features/resources/ResourcesPage.tsx`

<read_first>

- src/features/inventory/InventoryList.tsx (existing pattern for inline queries + mutations)
- src/features/camps/CampManagement.tsx (CRUD pattern — create/edit modal)
- src/types.ts (Resource type)
- src/lib/permissions.ts
  </read_first>

<action>
Create feature page with:
- Table/card list of all resources from `GET /resources`
- Create modal: name (text), unit (text), daily_ration (number), minimum_stock (number), auto_daily (checkbox)
- Edit modal: same fields, pre-filled
- Delete with confirmation dialog
- Inline TanStack Query hooks: `useQuery(['resources'], ...)`, `useMutation` for create/update/delete
- API calls via `apiClient` from `src/lib/api.ts`
- Guard with `resources.*` permission
- Loading skeleton states
- Error handling with try-catch + user feedback (console or inline error)
</action>

<acceptance_criteria>

- `GET /resources` returns list → renders table/cards
- Create modal submits `POST /resources` → list refreshes
- Edit modal submits `PUT /resources/{id}` → row updates
- Delete shows confirmation → submits `DELETE /resources/{id}` → row removed
- auto_daily checkbox visible and submits boolean
- Page accessible only to roles with `resources.*` permission
  </acceptance_criteria>

### Task 2: Route + Nav

<read_first>

- src/App.tsx
- src/layouts/DashboardLayout.tsx
- src/lib/permissions.ts
  </read_first>

<action>
Add route: `path="resources" element={<ProtectedRoute roles={[...]}><ResourcesPage /></ProtectedRoute>}` in App.tsx
Add nav item: `{ to: "/resources", icon: Package, label: "Resources" }` in DashboardLayout.tsx
Add permission: `"resources": "resources.*"` in NAV_PERMISSIONS
Add `resources.*` to relevant roles in permissions.ts (system_admin, resource_manager)
Import icon: `Package` from lucide-react
</action>

<acceptance_criteria>

- `/resources` route renders ResourcesPage
- Nav item visible for system_admin + resource_manager
- Nav item hidden for survivor, travel_coordinator
- `pnpm check` passes
  </acceptance_criteria>

## Verification

- `pnpm check` passes
- Manual: visit `/resources` → see list → create → edit → delete
- Test all 4 CRUD operations with the real API
