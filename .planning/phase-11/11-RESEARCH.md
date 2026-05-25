# Phase 11: RBAC Permissions Integration — RESEARCH

**Date:** 2026-05-25
**Status:** Research complete — ready for implementation planning

---

## 1. Permission Store Architecture

### Decision: Extend auth store (not separate store)

**Rationale:**

- Permissions are tightly coupled to authentication — they change when the user changes, expire when the token expires, and reset on logout
- A single store avoids the need to synchronize two Zustand stores (e.g. clearing permissions on logout requires coordination)
- The auth store already handles `persist` and `logout()`; adding `permissions: string[]` and `permissionsLoaded: boolean` keeps the surface minimal
- The existing pattern in this codebase has 4 small stores (auth, camp, connection, gamification) — adding a 5th for 2 fields violates the YAGNI principle

**Alternatives considered:**

- **Separate `permissionStore`:** Cleaner separation of concerns, but requires synchronizing `logout()` across two stores (either via `subscribe` or manual calls in `App.tsx`). Rejected as over-engineering for 2 fields.
- **TanStack Query-only (no store):** Fetch `/roles` with `useQuery` at the `DashboardLayout` level, pass permissions down via React context. Problem: `ProtectedRoute` (in `App.tsx`, outside `DashboardLayout`) needs permissions. We'd need a context provider wrapping the entire route tree. Zustand is simpler and already our pattern for client state.

### Store extension

```ts
// src/store/auth.ts — additions to AuthState
interface AuthState {
  // ... existing fields ...
  permissions: string[]; // [*], [camps.read, camps.create, ...]
  permissionsLoaded: boolean; // false while fetching
  permissionsError: string | null; // error message if fetch failed
  setPermissions: (permissions: string[]) => void;
  setPermissionsError: (error: string | null) => void;
}
```

On `logout()`, reset: `permissions: [], permissionsLoaded: false, permissionsError: null`.

On `setAuth()`, set `permissionsLoaded: false` to trigger a re-fetch.

---

## 2. Data Flow

```
Login → setAuth(user, token) → permissionsLoaded=false
  → App/DashboardLayout mounts → detect !permissionsLoaded && token
  → fetch GET /api/roles, extract permissions for user.role
  → setPermissions([...]) → permissionsLoaded=true
  → can(permission) reads from store, not hardcoded map
  → All UI guards reactive via Zustand selectors
```

**Fetch trigger:** A `useEffect` in `App.tsx` (or a `PermissionsLoader` wrapper component). Check: `token && !permissionsLoaded`. Fetch once. On success, call `setPermissions()`. On failure, call `setPermissionsError()`.

**Re-fetch triggers:**

- User role changes (admin edits the user's role in `UsersPage`): detect by polling `GET /users/me` or by comparing role after any user edit. For simplicity, re-fetch on `window.focus` or via a `refetchInterval: 5 * 60_000`.
- Token refresh (not applicable — no refresh token in this app).
- Manual logout/login (handled by `setAuth` resetting `permissionsLoaded`).

### Loading state flow

```
start: permissionsLoaded=false, permissions=[]
  → UI shows skeleton/spinner (no flash of unauthorized content)
  → fetch completes → permissionsLoaded=true
  → UI renders with guards active
```

**Critical invariant:** Components must treat `permissionsLoaded=false` as "not authorized yet" — don't render action buttons. Use `useCan()` which returns `false` when not loaded.

---

## 3. API Integration

### Endpoint

```
GET /api/roles
Response: Role[]  (paginated or array via unwrapList)
Each Role has: { id, name, permissions: [{ id, name, description }] }
```

### Extraction logic

Since the current user's role is `user.role` (a string like `"system_admin"`), we match it against the roles array:

```ts
const roles = await apiClient.get('/roles');
const rolesList = unwrapList<Role>(roles.data);
const userRole = rolesList.find((r) => r.name === user.role);
const permissionNames = userRole?.permissions?.map((p) => p.name) ?? [];
store.setPermissions(permissionNames);
```

### Edge case: role name mismatch

The API returns roles with `name` like `system_admin`, matching `UserRole` enum. But `User.role` might be `ADMIN` or `SYSTEM_ADMIN` depending on API version. Mitigation: normalize to lowercase+underscore before matching, or query `/users/me` which should embed the role with permissions.

**Recommended:** Add a dedicated endpoint check: if `GET /users/me` returns user with populated role+permissions, use that instead. If not, `GET /roles` is sufficient. The implementation should try `/users/me` first, fallback to `/roles` matching.

### Error handling

| Scenario                          | Behavior                                                     |
| --------------------------------- | ------------------------------------------------------------ |
| 401 Unauthorized                  | Already handled by axios interceptor → logout                |
| 403 Forbidden                     | User has no permission to read roles → set empty permissions |
| Network error                     | set `permissionsError`, show banner with retry button        |
| Role not found in roles list      | Set empty permissions, log warning                           |
| Response has no permissions array | Set empty permissions                                        |

**Fallback policy:** Empty permissions = nothing allowed (most restrictive). This is safer than the current hardcoded map which could grant access the backend would reject anyway.

---

## 4. `can()` / `hasPermission()` Migration Path

### Current signature

```ts
can(role: string | null | undefined, permission: string): boolean
// Usage: can(user?.role, 'people.create')
```

### Target signature (store-backed)

```ts
can(permission: string): boolean
// Usage: can('people.create')
// Reads role permissions from useAuthStore.getState().permissions
```

### Migration strategy: Dual-mode during transition

**Phase A: Add new `can(permission)` alongside old one**

```ts
// Old — keep for backward compat during migration
export function canWithRole(role: string | null | undefined, permission: string): boolean {
  // same logic as current can(), but uses store permissions instead of ROLE_PERMISSIONS
}

// New — store-backed, no role param
export function can(permission: string): boolean {
  const perms = useAuthStore.getState().permissions;
  if (perms.length === 0) return false;
  return checkPermission(perms, permission);
}
```

**Wait — this causes a signature conflict.** The old `can(role, perm)` and new `can(perm)` have different arity. TypeScript won't catch the mismatch at call sites that only pass one arg.

**Better approach: Rename old, add new side-by-side**

```ts
// Step 1: Rename current can() to canLegacy()
export function canLegacy(role: string | null | undefined, permission: string): boolean { ... }

// Step 2: Add new store-backed can()
export function can(permission: string): boolean { ... }

// Step 3: All old call sites break at compile time → migrate them
// Step 4: Remove canLegacy() + ROLE_PERMISSIONS
```

**Rationale:** TypeScript compile errors are better than silent bugs. Every `can(user?.role, 'x')` becomes a compile error → we fix each one → we know migration is complete.

**Implementation timeline:**

1. Add `permissions` to auth store, add fetch logic
2. Rename `can()` → `canLegacy()`, add new `can()`
3. Migrate all call sites (compile errors guide us)
4. Remove `canLegacy()` and `ROLE_PERMISSIONS`

### `checkPermission()` — pure logic, shared by store-backed and legacy

```ts
function checkPermission(userPerms: string[], needed: string): boolean {
  for (const p of userPerms) {
    if (p === '*') return true;
    if (p === needed) return true;
    if (p.endsWith('.*')) {
      const ns = p.slice(0, -2);
      if (needed === ns || needed.startsWith(`${ns}.`)) return true;
    }
  }
  return false;
}
```

### `isAdmin()` migration

Current:

```ts
export function isAdmin(role: string | null | undefined): boolean {
  return can(role, '*') || role === ROLES.SYSTEM_ADMIN;
}
```

New:

```ts
export function isAdmin(): boolean {
  return can('*');
}
```

Any role with `*` permission is an admin. We no longer hardcode `ROLES.SYSTEM_ADMIN`.

---

## 5. Hook & Component API Design

### `useCan(permission: string): boolean`

```ts
import { useAuthStore } from '../store';

export function useCan(permission: string): boolean {
  const permissions = useAuthStore((s) => s.permissions);
  const loaded = useAuthStore((s) => s.permissionsLoaded);
  if (!loaded) return false;
  return checkPermission(permissions, permission);
}
```

**Re-render optimization:** The selector picks `permissions` (string array). Zustand uses reference equality by default — the array reference changes on every `setPermissions()` call, which only happens once (on fetch) or rarely (on re-fetch). This is acceptable.

For `isAdmin()`, a dedicated `useIsAdmin()` hook is better:

```ts
export function useIsAdmin(): boolean {
  return useCan('*');
}
```

### `usePermissions(): { can: (p: string) => boolean; loaded: boolean; error: string | null; isAdmin: boolean }`

Convenience hook for components that need multiple checks:

```ts
export function usePermissions() {
  const permissions = useAuthStore((s) => s.permissions);
  const loaded = useAuthStore((s) => s.permissionsLoaded);
  const error = useAuthStore((s) => s.permissionsError);

  return {
    can: (p: string) => checkPermission(permissions, p),
    loaded,
    error,
    isAdmin: checkPermission(permissions, '*'),
  };
}
```

### `Can` component

Declarative wrapper for JSX-level gating:

```tsx
interface CanProps {
  permission: string;
  fallback?: ReactNode; // hidden by default
  children: ReactNode;
}

export function Can({ permission, fallback, children }: CanProps) {
  const allowed = useCan(permission);
  if (!allowed) return <>{fallback ?? null}</>;
  return <>{children}</>;
}
```

Usage:

```tsx
<Can permission="people.create">
  <button onClick={...}>NEW SURVIVOR</button>
</Can>
```

**Behavior:** Hidden by default (returns null). To show disabled, pass `fallback`:

```tsx
<Can permission="people.create" fallback={<button disabled title="No permission">NEW SURVIVOR</button>}>
  <button onClick={...}>NEW SURVIVOR</button>
</Can>
```

---

## 6. Route Guard Upgrade

### Current

```tsx
const ProtectedRoute = ({ children, roles }: { children: ReactNode; roles?: string[] }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};
```

### New: Permission-key based

```tsx
interface ProtectedRouteProps {
  children: ReactNode;
  permission?: string; // replaces `roles`
  roles?: string[]; // keep for backward compat during migration
}

const ProtectedRoute = ({ children, permission, roles }: ProtectedRouteProps) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;

  // Backward compat: roles-based check
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // New: permission-key check
  if (permission) {
    const allowed = can(permission); // store-backed
    if (!allowed) return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
```

### Migration of existing routes

| Current `roles`                                | New `permission`                                      |
| ---------------------------------------------- | ----------------------------------------------------- |
| `roles={['system_admin']}`                     | `permission="users.*"` or `permission="users.create"` |
| `roles={['system_admin', 'resource_manager']}` | `permission="resources.*"` (already gated at nav)     |
| No roles (any authenticated)                   | No permission (any authenticated user)                |

**Routes that keep `roles` during migration (then convert):**

- `/population/new` → `permission="people.create"`
- `/resources` → `permission="resources.*"`
- `/users` → `permission="users.*"`
- `/roles` → `permission="roles.*"`
- `/permissions` → `permission="permissions.*"`

**Routes that currently have no role whitelist but need one:**

- `/professions` → `permission="professions.read"` (already in nav filter)
- The nav filter already hides these from the UI, but manual URL access still works. Adding `permission` to `ProtectedRoute` closes this gap.

---

## 7. Permission Constants

### Decision: `PermissionKey` in `src/lib/permissions.ts` as `const` object

```ts
export const PERM = {
  CAMPS_CREATE: 'camps.create',
  CAMPS_READ: 'camps.read',
  CAMPS_UPDATE: 'camps.update',
  CAMPS_DELETE: 'camps.delete',
  PEOPLE_CREATE: 'people.create',
  PEOPLE_READ: 'people.read',
  PEOPLE_UPDATE: 'people.update',
  PEOPLE_DELETE: 'people.delete',
  PEOPLE_STATUS_LOG: 'people.status_log',
  PEOPLE_PROFESSION_REASSIGN_CREATE: 'people.profession_reassign.create',
  PEOPLE_CONTRIBUTION_OVERRIDE: 'people.contribution_override',
  RESOURCES_ALL: 'resources.*',
  RESOURCES_READ: 'resources.read',
  RESOURCES_CREATE: 'resources.create',
  RESOURCES_UPDATE: 'resources.update',
  RESOURCES_DELETE: 'resources.delete',
  PROFESSIONS_ALL: 'professions.*',
  PROFESSIONS_READ: 'professions.read',
  PROFESSIONS_CREATE: 'professions.create',
  PROFESSIONS_UPDATE: 'professions.update',
  PROFESSIONS_DELETE: 'professions.delete',
  USERS_ALL: 'users.*',
  USERS_READ: 'users.read',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  INVENTORY_ADJUST: 'inventory.adjust',
  INVENTORY_AUDIT: 'inventory.audit',
  INVENTORY_READ: 'inventory.read',
  INVENTORY_ALL: 'inventory.*',
  TRANSFERS_CREATE: 'transfers.create',
  TRANSFERS_READ: 'transfers.read',
  TRANSFERS_APPROVE: 'transfers.approve',
  TRANSFERS_COMPLETE: 'transfers.complete',
  TRANSFERS_ALL: 'transfers.*',
  EXPEDITIONS_CREATE: 'expeditions.create',
  EXPEDITIONS_READ: 'expeditions.read',
  EXPEDITIONS_UPDATE: 'expeditions.update',
  EXPEDITIONS_DELETE: 'expeditions.delete',
  EXPEDITIONS_MANAGE: 'expeditions.manage',
  EXPEDITIONS_ALL: 'expeditions.*',
  ADMISSION_CREATE: 'admission.create',
  ADMISSION_READ: 'admission.read',
  ADMISSION_REVIEW: 'admission.review',
  ADMISSION_ALL: 'admission.*',
  DASHBOARD_READ: 'dashboard.read',
  ROLES_ALL: 'roles.*',
  ROLES_READ: 'roles.read',
  PERMISSIONS_ALL: 'permissions.*',
  PERMISSIONS_READ: 'permissions.read',
  WILDCARD: '*',
} as const;

export type PermissionKey = (typeof PERM)[keyof typeof PERM];
```

**Why `const` object, not `enum`:**

- TypeScript `const` objects preserve literal types better for string-based use
- Can use `PERM.PEOPLE_CREATE` in both JSX (`can(PERM.PEOPLE_CREATE)`) and as object keys
- Matches the pattern of `ROLES` already in the file (exported as `const` object)

**Where:** `src/lib/permissions.ts` — same file as `can()`, `isAdmin()`, etc. Keeps all permission-related code in one module. Types are already in `src/types.ts` (`Permission`, `Role` interfaces).

---

## 8. Migration Plan (Ordered)

### Phase 11a: Infrastructure (no visual changes)

1. **Extend `useAuthStore`** with `permissions`, `permissionsLoaded`, `permissionsError` fields
2. **Add permission fetch logic** in `App.tsx` (or a `<PermissionsLoader>` wrapper) — fetch on mount when token exists and not loaded
3. **Refactor `src/lib/permissions.ts`:**
   - Rename `can()` → `canLegacy()`
   - Extract `checkPermission()` pure function
   - Add new store-backed `can(permission: string)`
   - Add `useCan()`, `usePermissions()` hooks
   - Add `Can` component
   - Add `PERM` constants
   - Update `isAdmin()` to use store
4. **Verify:** Build passes, no runtime errors (all old call sites still use `canLegacy`)

### Phase 11b: Call site migration (one component at a time)

5. **`DashboardLayout.tsx`** — nav filtering already uses `can(user?.role, ...)`. Convert to `can(PERM.DASHBOARD_READ)`, etc. `NAV_PERMISSIONS` map stays, just changes how it calls `can`.
6. **`DashboardOverview.tsx`** — Replace `ADMIN_ROLES` with `useIsAdmin()`. Remove hardcoded array.
7. **`App.tsx`** — Upgrade `ProtectedRoute` to support `permission` prop. Convert all `roles={[...]}` route guards to `permission="..."`. Add permission to routes that currently have no guard but need one (`/professions`, etc.).
8. **`TransferList.tsx`** — Remove `normalizeRole()`, `canManageTransfers()`, `canCreateTransfers()`. Replace with `can(PERM.TRANSFERS_ALL)` and `can(PERM.TRANSFERS_CREATE)`. This is the most impactful refactor.

### Phase 11c: Add missing guards

9. **`PopulationRoster.tsx`** — Guard NEW SURVIVOR (`PERM.PEOPLE_CREATE`), edit button (`PERM.PEOPLE_UPDATE`), delete button (`PERM.PEOPLE_DELETE`), transfer button (`PERM.TRANSFERS_CREATE`), REASSIGN button (already guarded via `canReassign` but should use new API)
10. **`PersonDetail.tsx`** — Guard EDIT PROFILE (`PERM.PEOPLE_UPDATE`), DELETE RECORD (`PERM.PEOPLE_DELETE`), TRANSFER (`PERM.TRANSFERS_CREATE`), LOG STATUS CHANGE (`PERM.PEOPLE_STATUS_LOG`), REASSIGN PROFESSION (`PERM.PEOPLE_PROFESSION_REASSIGN_CREATE`), OVERRIDE CONTRIBUTION (`PERM.PEOPLE_CONTRIBUTION_OVERRIDE`)
11. **`InventoryList.tsx`** — Guard MANUAL ADJUST (`PERM.INVENTORY_ADJUST`), VIEW AUDIT TRAIL (`PERM.INVENTORY_AUDIT`)
12. **`ResourcesPage.tsx`** — Guard NEW RESOURCE TYPE (`PERM.RESOURCES_CREATE`), edit buttons (`PERM.RESOURCES_UPDATE`), delete buttons (`PERM.RESOURCES_DELETE`)
13. **`RationsPage.tsx`** — Guard NEW RATION (`PERM.INVENTORY_ADJUST`)
14. **`ProfessionsPage.tsx`** — Guard NEW PROFESSION (`PERM.PROFESSIONS_CREATE`), edit/delete buttons
15. **`CampManagement.tsx`** — Guard REGISTER NEW REFUGE (`PERM.CAMPS_CREATE`), edit button (`PERM.CAMPS_UPDATE`), delete (already guarded with `canDelete`)
16. **`CampDetail.tsx`** — Guard edit/delete actions
17. **`ExpeditionList.tsx`** — Guard DEPLOY (`PERM.EXPEDITIONS_MANAGE`), RETURN/LOST (`PERM.EXPEDITIONS_MANAGE`), edit (`PERM.EXPEDITIONS_UPDATE`), delete (`PERM.EXPEDITIONS_DELETE`), CONFIGURE MISSION (already guarded with `canCreate`)
18. **`ExpeditionDetail.tsx`** — Guard status change buttons, edit actions
19. **`AdmissionList.tsx`** — Guard APPROVE/REJECT (`PERM.ADMISSION_REVIEW`), REGISTER INTAKE (`PERM.ADMISSION_CREATE`)
20. **`UsersPage.tsx`** — Guard NEW USER (`PERM.USERS_CREATE`), edit/delete buttons
21. **`RolesPage.tsx`** — Guard NEW ROLE (`PERM.ROLES_ALL`), edit/delete buttons
22. **`PermissionsPage.tsx`** — Guard NEW PERMISSION (`PERM.PERMISSIONS_ALL`), edit/delete buttons

### Phase 11d: Cleanup

23. Remove `canLegacy()`, `ROLE_PERMISSIONS` map, old `ROLES` type (if unused)
24. Remove deprecated `roles` prop from `ProtectedRoute` (after all routes migrated)
25. Run `pnpm check` — ensure lint, spell, build pass

---

## 9. UX Patterns

### Decision: Hidden by default, disabled with tooltip on critical actions

The spec says:

> "Disabled buttons must look intentionally disabled (not just hidden)"
> "Layout must not break when buttons disappear"

**Pattern per context:**

| Context                                                         | Pattern                                           | Rationale                                                                          |
| --------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Primary action buttons** (page header)                        | Hidden (`Can` component, returns null)            | The flexbox container handles missing children naturally                           |
| **Row action buttons** (edit/delete in tables)                  | Hidden                                            | The `justify-end flex gap-1` container collapses remaining buttons neatly          |
| **Modal submit buttons**                                        | Disabled (with tooltip)                           | User is already in a flow — hiding the submit button would be confusing            |
| **Navigation items**                                            | Hidden (already implemented in `DashboardLayout`) | Nav dock handles missing items                                                     |
| **Form fields**                                                 | Hidden                                            | Out of scope for this phase (deferred: field-level permissions)                    |
| **Status action buttons** (expedition deploy, transfer approve) | Disabled + tooltip                                | These are critical operational actions; hiding them silently would cause confusion |

### Tooltip implementation

The project already uses native `title` attributes on some buttons (e.g. `PopulationRoster.tsx:474`). We'll standardize on:

```tsx
// Disabled with title
<button disabled title="No tienes permiso para realizar esta acción">
  EDIT
</button>

// Via Can component with fallback
<Can
  permission={PERM.PEOPLE_UPDATE}
  fallback={<button disabled title="No tienes permiso para realizar esta acción">EDIT</button>}
>
  <button onClick={...}>EDIT</button>
</Can>
```

**Why not a custom Tooltip component:** The project doesn't have one, and `title` is sufficient for this phase. A custom tooltip component can be added later if desired (deferred).

### Loading state

Before permissions load, all permission-gated UI should show nothing (or skeleton). The `useCan()` hook returns `false` when `!loaded`, so action buttons naturally hide. The main content should still render (the user can see read-only data at minimum).

---

## 10. Edge Cases & Error States

| Edge Case                                                      | Handling                                                                                                                                                                                                                                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Token exists but user.role is null/undefined**               | `can()` returns false — no permissions granted                                                                                                                                                                                                                      |
| **GET /api/roles returns empty array**                         | `permissions = []`, `permissionsLoaded = true`. All `can()` calls return false. UI shows empty state — user sees only dashboard (which requires `dashboard.read`, so they'd see nothing useful). Add a banner: "No permissions assigned. Contact an administrator." |
| **GET /api/roles returns 403**                                 | Set `permissionsError`, show error banner. Keep `permissionsLoaded = false`. Retry on manual trigger.                                                                                                                                                               |
| **GET /api/roles returns stale data after role change**        | Re-fetch on `window.focus` + every 5 minutes via `refetchInterval` in a TanStack query wrapper. Or: after any user edit in `UsersPage`, invalidate the permissions query.                                                                                           |
| **User manually navigates to URL**                             | `ProtectedRoute` with `permission` prop blocks access → redirect to `/` with toast.                                                                                                                                                                                 |
| **Admin changes own role**                                     | Edge: could de-admin themselves. The `setPermissions([])` would trigger, and `ProtectedRoute` would redirect. Acceptable — the backend would also reject subsequent requests.                                                                                       |
| **Multiple browser tabs**                                      | Zustand `persist` middleware uses `localStorage`. Cross-tab sync via `storage` event is not implemented in current auth store. Acceptable for now — permissions will sync on next page load.                                                                        |
| **Fast logout/login as different user**                        | `logout()` resets `permissions`, `setAuth()` sets `permissionsLoaded = false` → fetch triggers again. Works correctly.                                                                                                                                              |
| **Session timeout (20min inactivity)**                         | `logout()` is called → `permissions` reset. On re-login, fresh fetch.                                                                                                                                                                                               |
| **Backend permission format changes** (e.g. `*` becomes `all`) | The `checkPermission()` function handles `*`, `ns.*`, and exact matches. New format strings would need to be added to `PERM` constants. If backend introduces a new wildcard format, `checkPermission()` would need updating — but that's unlikely.                 |

---

## 11. Role Change Handling

### Detection strategy

**Option A: Polling** — Refetch permissions on `window.focus` + every 5 minutes.
**Option B: Invalidate on user edit** — After any call to `PUT /users/:id` that changes the current user's role, immediately re-fetch permissions.

**Recommendation: Use both.** Option B for fast response, Option A as safety net.

```ts
// In UsersPage, after editing the current user:
if (editingUser.id === currentUserId) {
  fetchPermissions();
}

// In App.tsx or a hook:
useEffect(() => {
  const onFocus = () => {
    if (token) fetchPermissions();
  };
  window.addEventListener('focus', onFocus);
  return () => window.removeEventListener('focus', onFocus);
}, [token]);
```

---

## 12. TransferList Refactor

### Current duplicate logic

```ts
// Transfers/TransferList.tsx:107-123
function normalizeRole(role: string): string { ... }
function canManageTransfers(role: string | undefined): boolean { ... }
function canCreateTransfers(role: string | undefined): boolean { ... }
```

### Target

```ts
import { can } from '../../lib/permissions';
import { PERM } from '../../lib/permissions';

// In component:
const canManage = can(PERM.TRANSFERS_ALL); // approve, complete, reject
const canCreate = can(PERM.TRANSFERS_CREATE); // create new transfers
```

**Additional transfers permissions to guard:**

- Approve source: `transfers.approve` (or `transfers.*`)
- Approve target: `transfers.approve`
- Complete: `transfers.complete`
- Reject: `transfers.approve` (same as approve — rejecting is part of managing)
- Schedule: `transfers.*` (management action)

These are all covered by `transfers.*` — no need for individual guards unless fine-grained control is desired. The existing `canManage` check already covers all of them. The refactor is purely about removing the local duplicate functions and using the centralized `can()`.

---

## 13. DashboardOverview Fix

### Current

```ts
const ADMIN_ROLES = ['system_admin', 'resource_manager', 'travel_coordinator'];
const isWorker = user?.role === 'worker';
const isAdmin = user?.role ? ADMIN_ROLES.includes(user.role) : false;
```

### Target

```ts
const { can } = usePermissions();
const isAdmin = can('*'); // or useIsAdmin()
const isWorker = !isAdmin && can('dashboard.read');
```

**Problem:** The current code assumes `worker` role = read-only dashboard. With RBAC, a custom role might have `dashboard.read` but not be a "worker." The `isWorker` / `isAdmin` distinction should be based on capabilities, not role names.

**Better approach:**

```ts
const isAdmin = can('*'); // full access
// Otherwise, everyone with dashboard.read sees the same view
// The admin/worker split was a UI pattern from before RBAC
```

Since the spec says "Replace hardcoded ADMIN_ROLES with isAdmin()", the simplest fix is:

```ts
import { isAdmin } from '../../lib/permissions';
const adminView = isAdmin();
```

But with store-backed `isAdmin()`, it no longer takes a `role` param — it reads from the store directly.

---

## 14. Backward Compatibility

### Migration approach: Compile-time breaking change

1. Rename `can()` → `canLegacy()` (all 20+ call sites break at compile time)
2. Add new `can(permission: string)`
3. Fix each call site one by one — TypeScript tells us exactly where they are
4. Delete `canLegacy()` and `ROLE_PERMISSIONS`

**Call sites to migrate:**

| File                          | Current Usage                                                                | New Usage                                                  |
| ----------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `DashboardLayout.tsx:206`     | `can(user?.role, 'inventory.read')`                                          | `can(PERM.INVENTORY_READ)`                                 |
| `DashboardLayout.tsx:318`     | `can(user?.role, NAV_PERMISSIONS[item.to])`                                  | `can(NAV_PERMISSIONS[item.to])`                            |
| `DashboardLayout.tsx:628`     | `can(user?.role, 'inventory.read')`                                          | `can(PERM.INVENTORY_READ)`                                 |
| `PopulationRoster.tsx:199`    | `can(user?.role, 'people.profession_reassign.create')`                       | `can(PERM.PEOPLE_PROFESSION_REASSIGN_CREATE)`              |
| `PersonDetail.tsx:44`         | `can(user?.role, 'people.read')`                                             | `can(PERM.PEOPLE_READ)`                                    |
| `AdmissionList.tsx:32`        | `can(user?.role, 'admission.create') && can(user?.role, 'admission.review')` | `can(PERM.ADMISSION_CREATE) && can(PERM.ADMISSION_REVIEW)` |
| `TransferList.tsx:111-123`    | Local `canManageTransfers()`, `canCreateTransfers()`                         | `can(PERM.TRANSFERS_ALL)`, `can(PERM.TRANSFERS_CREATE)`    |
| `ExpeditionList.tsx:33`       | `can(user?.role, 'expeditions.create')`                                      | `can(PERM.EXPEDITIONS_CREATE)`                             |
| `ExpeditionDetail.tsx:44`     | `can(user?.role, 'expeditions.read')`                                        | `can(PERM.EXPEDITIONS_READ)`                               |
| `CampManagement.tsx:60`       | `can(user?.role, 'camps.delete')`                                            | `can(PERM.CAMPS_DELETE)`                                   |
| `CampDetail.tsx:17`           | `can(user?.role, 'camps.read')`                                              | `can(PERM.CAMPS_READ)`                                     |
| `permissions.ts:76`           | `can(role, '*')` in `isAdmin()`                                              | Store-backed `can('*')`                                    |
| `permissions.ts:80-91`        | `canManageInventory()`, etc.                                                 | Keep helpers but use store-backed `can()`                  |
| `DashboardOverview.tsx:24-31` | Hardcoded `ADMIN_ROLES`                                                      | `useIsAdmin()`                                             |

**Total call sites to fix: ~15-20.** Manageable in a single session.

### `canManageInventory()`, `canManageTransfers()`, etc.

These convenience helpers in `permissions.ts` are used sparingly:

- `canManageInventory`: Not used directly in any component (inventory checks use inline `can()`)
- `canManageTransfers`: Only in `DashboardLayout` (not found in current code — TransferList has its own)
- `canManageExpeditions`: Not used
- `canManageAdmissions`: Not used

**Decision:** Deprecate these helpers. They were pre-RBAC conveniences. With `PERM` constants, inline `can(PERM.INVENTORY_ALL)` is just as readable and more explicit. If a component calls `canManageInventory()`, it should be migrated to `can(PERM.INVENTORY_ALL)`.

---

## TypeScript Types & Constants

### Additions to `src/types.ts`

No changes needed. The existing `Permission` and `Role` interfaces (lines 143-161) already match the API response shape:

```ts
interface Permission {
  id: number;
  name: string; // "camps.create", "people.read", etc.
  description: string | null;
}

interface Role {
  id: number;
  name: string;
  description: string | null;
  is_system?: boolean;
  permissions?: Permission[];
}
```

### Additions to `src/lib/permissions.ts`

Full export list after migration:

```ts
// Constants
export const PERM = { ... } as const;
export type PermissionKey = (typeof PERM)[keyof typeof PERM];

// Pure logic
export function checkPermission(perms: string[], needed: string): boolean;

// Store-backed (use in non-React contexts)
export function can(permission: string): boolean;
export function isAdmin(): boolean;
export function hasPermission(permission: string): boolean; // alias for can()

// React hooks (use in components)
export function useCan(permission: string): boolean;
export function usePermissions(): { can, loaded, error, isAdmin };
export function useIsAdmin(): boolean;

// Declarative component
export function Can({ permission, fallback, children }: CanProps): ReactNode;

// Deprecated — remove after migration
// export function canLegacy(role, permission): boolean;
// export const ROLE_PERMISSIONS: Record<string, string[]>;
```

### Additions to `src/store/auth.ts`

```ts
interface AuthState {
  // ... existing ...
  permissions: string[];
  permissionsLoaded: boolean;
  permissionsError: string | null;
  setPermissions: (permissions: string[]) => void;
  setPermissionsError: (error: string | null) => void;
}
```

### Additions to `src/store/index.ts`

```ts
export { useAuthStore } from './auth'; // already exists — no change needed
```

---

## Files to Create / Modify

| File                                             | Action  | Purpose                                              |
| ------------------------------------------------ | ------- | ---------------------------------------------------- |
| `src/store/auth.ts`                              | MODIFY  | Add permissions fields + actions                     |
| `src/lib/permissions.ts`                         | REWRITE | New `can()`, hooks, `Can`, `PERM`, `checkPermission` |
| `src/App.tsx`                                    | MODIFY  | Add permissions fetch, upgrade `ProtectedRoute`      |
| `src/layouts/DashboardLayout.tsx`                | MODIFY  | Convert `can()` calls to new API                     |
| `src/features/dashboard/DashboardOverview.tsx`   | MODIFY  | Replace `ADMIN_ROLES` with `useIsAdmin()`            |
| `src/features/transfers/TransferList.tsx`        | MODIFY  | Remove duplicate functions, use `can()`              |
| `src/features/people/PopulationRoster.tsx`       | MODIFY  | Add guards to action buttons                         |
| `src/features/people/PersonDetail.tsx`           | MODIFY  | Add guards to all action buttons                     |
| `src/features/inventory/InventoryList.tsx`       | MODIFY  | Guard MANUAL ADJUST, VIEW AUDIT                      |
| `src/features/resources/ResourcesPage.tsx`       | MODIFY  | Guard NEW, edit, delete buttons                      |
| `src/features/rations/RationsPage.tsx`           | MODIFY  | Guard NEW RATION button                              |
| `src/features/professions/ProfessionsPage.tsx`   | MODIFY  | Guard NEW, edit, delete buttons                      |
| `src/features/camps/CampManagement.tsx`          | MODIFY  | Guard REGISTER, edit buttons                         |
| `src/features/camps/CampDetail.tsx`              | MODIFY  | Guard edit/delete actions                            |
| `src/features/explorations/ExpeditionList.tsx`   | MODIFY  | Guard status actions, edit, delete                   |
| `src/features/explorations/ExpeditionDetail.tsx` | MODIFY  | Guard action buttons                                 |
| `src/features/admission/AdmissionList.tsx`       | MODIFY  | Guard APPROVE/REJECT, REGISTER                       |
| `src/features/users/UsersPage.tsx`               | MODIFY  | Guard NEW USER, edit/delete                          |
| `src/features/roles/RolesPage.tsx`               | MODIFY  | Guard NEW ROLE, edit/delete                          |
| `src/features/permissions/PermissionsPage.tsx`   | MODIFY  | Guard NEW PERMISSION, edit/delete                    |

**Total: 20 files** (1 new: `usePermissions` hook lives in `permissions.ts`; 19 modified).

---

## RESEARCH COMPLETE
