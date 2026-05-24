---
wave: 1
id: phase-02-professions-crud
depends_on: []
files_modified:
  - src/App.tsx
  - src/layouts/DashboardLayout.tsx
  - src/lib/permissions.ts
  - src/types.ts
  - src/features/professions/ProfessionsPage.tsx (new)
autonomous: true
---

# Phase 02 — Professions CRUD Page

## Objective

Replace current read-only profession fetching with full CRUD page. User can view, create, edit, and delete profession types.

## Tasks

### Task 1: Create ProfessionsPage

**File:** `src/features/professions/ProfessionsPage.tsx`

<read_first>

- src/features/camps/CampManagement.tsx (CRUD pattern)
- src/features/resources/ResourcesPage.tsx (sibling CRUD page if created first, otherwise use camps)
- src/types.ts (check if Profession type exists; add if missing)
- src/lib/permissions.ts
  </read_first>

<action>
Add Profession type to `src/types.ts` if missing: `{ id: number; name: string; description?: string }`
Create feature page with:
- Table/card list from `GET /professions`
- Create modal: name (text), description (textarea optional)
- Edit modal: same fields, pre-filled
- Delete with confirmation
- Inline TanStack hooks: `useQuery(['professions'], ...)`, mutations for CRUD
- API calls via `apiClient`
- Loading + error states
- Guard with `professions.*` permission
</action>

<acceptance_criteria>

- `GET /professions` renders list
- Create submits `POST /professions` → list refreshes
- Edit submits `PUT /professions/{id}` → row updates
- Delete confirmation → `DELETE /professions/{id}` → row removed
  </acceptance_criteria>

### Task 2: Route + Nav

<read_first>

- src/App.tsx
- src/layouts/DashboardLayout.tsx
- src/lib/permissions.ts
  </read_first>

<action>
Add route: `path="professions"` with ProtectedRoute for system_admin only
Add nav item: icon `Wrench` from lucide-react, label "Professions"
Add permission `"professions": "professions.read"` in NAV_PERMISSIONS
Add `"professions.*"` to system_admin role in permissions.ts (or use existing `"*"`)
</action>

<acceptance_criteria>

- `/professions` route renders page
- Only system_admin sees nav item
- `pnpm check` passes
  </acceptance_criteria>

## Verification

- `pnpm check` passes
- Manual: full CRUD cycle with real API
- Verify professions appear in Population edit modal dropdown after create
