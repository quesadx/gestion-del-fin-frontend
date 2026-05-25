# Phase 11: RBAC Permissions Integration — Context

**Gathered:** 2026-05-25
**Status:** Ready for planning
**Source:** User specification + codebase analysis

<domain>
## Phase Boundary

Integrate real backend permissions from `GET /api/roles` into the frontend. Replace hardcoded `ROLE_PERMISSIONS` map in `src/lib/permissions.ts` with dynamically fetched permissions. Add comprehensive UI guards (buttons, modals, routes, actions) across all features. Centralize permission validation. No visual regressions — hidden/disabled elements must not break layouts.

This phase does NOT modify the backend API. The endpoint already exists. This is purely frontend integration.
</domain>

<decisions>
## Implementation Decisions

### Architecture

- Permission engine stays in `src/lib/permissions.ts` — refactored, not rewritten
- Fetch permissions from `GET /api/roles` at app startup (after login)
- Cache permissions in Zustand store (new `permissionStore` or extend auth store)
- Replace hardcoded `ROLE_PERMISSIONS` map with backend-driven data
- Centralized `can(permission)` and `hasPermission(permission)` helpers
- Hooks: `usePermissions()`, `useCan(permission: string)`
- Route guard: upgrade `ProtectedRoute` to support permission-key checks
- Component wrapper: `Can` component for declarative permission gating
- TypeScript types for all permission keys as string literal union
- Constants enum for permission keys — no magic strings

### API Integration

- Fetch `GET /api/roles` once on auth (include `permissions` relation)
- Parse response to extract `Permission[]` for the current user's role
- Handle loading state gracefully (skeleton/spinner, not blank screen)
- Handle error state (fallback to empty permissions = nothing allowed)
- Refresh permissions on role change / user switch

### UI Guards — Components to Protect

- **PopulationRoster:** NEW SURVIVOR (`people.create`), edit (`people.update`), delete (`people.delete`), transfer (`transfers.create`)
- **PersonDetail:** EDIT PROFILE (`people.update`), DELETE RECORD (`people.delete`), TRANSFER (`transfers.create`), LOG STATUS (`people.status_log`), OVERRIDE CONTRIBUTION (`people.contribution_override`)
- **InventoryList:** MANUAL ADJUST (`inventory.adjust`), VIEW AUDIT (`inventory.audit`)
- **ResourcesPage:** NEW (`resources.create`), edit (`resources.update`), delete (`resources.delete`)
- **RationsPage:** NEW RATION (`inventory.adjust`)
- **ProfessionsPage:** NEW (`professions.create`), edit (`professions.update`), delete (`professions.delete`)
- **CampManagement:** REGISTER NEW REFUGE (`camps.create`), edit (`camps.update`)
- **ExpeditionList:** DEPLOY (`expeditions.manage`), RETURN/LOST (`expeditions.manage`), edit (`expeditions.update`), delete (`expeditions.delete`)
- **ExpeditionDetail:** edit/status change buttons
- **CampDetail:** edit/delete actions
- **AdmissionList:** APPROVE/REJECT (`admission.review`)
- **TransferList:** REFACTOR to use centralized `can()` instead of local duplicate functions
- **UsersPage:** create (`users.create`), edit (`users.update`), delete (`users.delete`)
- **RolesPage:** create/edit/delete
- **PermissionsPage:** create/edit/delete
- **DashboardOverview:** replace hardcoded `ADMIN_ROLES` with `isAdmin()`

### Route Protection

- Convert `ProtectedRoute` from role-string whitelist to permission-key check
- Block manual URL access for unauthorized routes (redirect with toast)
- Handle unauthorized state with clear UX feedback

### UX/UI Requirements

- Disabled buttons must look intentionally disabled (not just hidden)
- Optional tooltips on disabled actions: "No tienes permiso para realizar esta acción"
- Layout must not break when buttons disappear — use `hidden` not conditional render where layout stability matters, or ensure flexbox/grid handles it
- Tooltips must indicate reason for disabled state

### Consistency Rules

- Fix TransferList duplicate permission logic → use centralized `can()`
- Fix DashboardOverview hardcoded ADMIN_ROLES → use `isAdmin()`
- All permission checks route through `src/lib/permissions.ts` — no exceptions
- No inline permission string duplication — use constants

### Loading/Error States

- Show skeleton/spinner while permissions load (app startup)
- If permissions fail to load, show error state with retry
- Don't flash unauthorized content before permissions resolve

### the agent's Discretion

- Exact Zustand store interface for permissions
- Whether to extend auth store or create separate permission store
- Naming conventions for permission string constants
- Implementation details of `Can` wrapper component
- How to handle permission refresh on role change
- Specific Toast messages for unauthorized actions
  </decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core Permission Engine

- `src/lib/permissions.ts` — Current `can()` function, role map, helpers (REFACTOR TARGET)
- `src/lib/api.ts` — Axios instance, interceptors, token handling

### Auth & State

- `src/store/auth.ts` — Zustand auth store (user, token, userId) — may extend for permissions
- `src/types.ts` — User, Role, Permission interfaces

### Route & Layout

- `src/App.tsx` — ProtectedRoute component, all route definitions (UPGRADE TARGET)
- `src/layouts/DashboardLayout.tsx` — Nav sidebar filtering with `can()`, inventory alert gate

### Features to Guard (sorted by priority)

- `src/features/people/PopulationRoster.tsx` — Multiple missing guards (create/edit/delete/transfer)
- `src/features/people/PersonDetail.tsx` — Multiple missing guards (edit/delete/transfer/status-log/override)
- `src/features/people/NewPersonPage.tsx` — Route guard only
- `src/features/inventory/InventoryList.tsx` — Missing adjust/audit guards
- `src/features/resources/ResourcesPage.tsx` — Missing create/edit/delete guards
- `src/features/rations/RationsPage.tsx` — Missing create guard
- `src/features/professions/ProfessionsPage.tsx` — Missing create/edit/delete guards
- `src/features/camps/CampManagement.tsx` — Missing create/edit guards
- `src/features/explorations/ExpeditionList.tsx` — Missing manage/update/delete guards
- `src/features/explorations/ExpeditionDetail.tsx` — Missing action guards
- `src/features/admission/AdmissionList.tsx` — Missing approve/reject guards
- `src/features/transfers/TransferList.tsx` — Duplicate logic to refactor
- `src/features/users/UsersPage.tsx` — Missing create/update/delete guards
- `src/features/dashboard/DashboardOverview.tsx` — Hardcoded ADMIN_ROLES to fix

### Dev Rules (from ROADMAP.md)

- `pnpm check` before each commit (lint + spell + build)
- Keep current patterns: inline TanStack hooks, single TSX per feature, Zustand for client state only
- Use Nix env: `nix dev` then `pnpm` commands
- Types go in `src/types.ts` (current pattern)
- Permission helpers in `src/lib/permissions.ts`
  </canonical_refs>

<specifics>
## Specific Ideas

### Permission Key Format

Backend returns permissions as dot-notation strings:

- `camps.create`, `camps.read`, `camps.update`, `camps.delete`
- `people.create`, `people.read`, `people.update`, `people.delete`
- `resources.*`, `professions.*`, `users.*`
- `inventory.*`, `transfers.*`, `expeditions.*`, `admission.*`

### TypeScript Literal Type

```ts
export type PermissionKey =
  | 'camps.create'
  | 'camps.read'
  | 'camps.update'
  | 'camps.delete'
  | 'people.create'
  | 'people.read'
  | 'people.update'
  | 'people.delete'
  | 'people.status_log'
  | 'people.profession_reassign.create'
  | 'people.contribution_override'
  | 'resources.*'
  | 'professions.*'
  | 'users.*'
  | 'inventory.adjust'
  | 'inventory.audit'
  | 'inventory.read'
  | 'transfers.create'
  | 'transfers.read'
  | 'transfers.approve'
  | 'transfers.complete'
  | 'expeditions.create'
  | 'expeditions.read'
  | 'expeditions.update'
  | 'expeditions.delete'
  | 'expeditions.manage'
  | 'admission.create'
  | 'admission.read'
  | 'admission.review'
  | 'dashboard.read'
  | 'roles.*'
  | 'permissions.*'
  | '*';
```

### API Response Shape (expected from GET /api/roles)

```ts
interface RoleWithPermissions {
  id: number;
  name: string;
  description: string | null;
  is_system?: boolean;
  permissions: { id: number; name: string; description: string | null }[];
}
```

### Desired End State

- Zero hardcoded permission strings outside `src/lib/permissions.ts`
- Every action button in the app gated by permission check
- Every route gated by permission key (not role string)
- Permissions fetched once from backend, cached in memory
- Clean TypeScript types for all permission keys
  </specifics>

<deferred>
## Deferred Ideas

- Backend-side permission changes (out of scope — backend already has `permissionMiddleware`)
- Unit tests for permission engine (deferred to testing milestone)
- Permission audit logging in frontend
- Real-time permission sync (WebSocket) — not needed for current UX
- Fine-grained field-level permissions (e.g., hide specific form fields)
- Permission-based column hiding in data tables
  </deferred>

---

_Phase: 11-rbac-permissions_
_Context gathered: 2026-05-25 from user specification + codebase analysis_
