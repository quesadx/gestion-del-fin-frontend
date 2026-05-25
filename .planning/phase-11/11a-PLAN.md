---
phase: 11
sub_phase: a
wave: 1
depends_on: []
files_modified:
  - src/store/auth.ts
  - src/lib/permissions.ts
  - src/App.tsx
autonomous: true
---

# Plan 11a: Infrastructure (Store, Permissions Engine, Fetch Logic)

**Goal:** Extend the auth store with permission fields, refactor `permissions.ts` with the new store-backed API (side-by-side with `canLegacy`), and add the permissions fetch trigger in `App.tsx`. No call sites change yet — backward compatible during this phase.

**must_haves:**

- Auth store has `permissions`, `permissionsLoaded`, `permissionsError` fields with getters/setters
- `canLegacy()` exists (renamed from old `can`) and compiles — all existing call sites untouched
- New store-backed `can(permission: string): boolean` exists
- `checkPermission()` pure function exists for wildcard/exact/namespace matching
- `PERM` const object with all permission key constants exists and is exported
- `useCan()`, `usePermissions()`, `useIsAdmin()` hooks exist and are exported
- `Can` component exists and renders children only when permission matches
- `isAdmin()` is store-backed (reads `*` via new `can`)
- `App.tsx` fetches permissions via `GET /api/roles` on mount when authenticated and not loaded
- `pnpm check` passes — lint, spell, build succeed
- ALL existing call sites that used `can(user?.role, 'x')` continue to work via `canLegacy`

---

## Tasks

---

### 11a-T01 — Extend auth store with permissions state

<task>
<description>Add permissions, permissionsLoaded, permissionsError, setPermissions, setPermissionsError to the Zustand auth store</description>

<read_first>

- src/store/auth.ts (current state — must preserve all existing fields, setAuth JWT parsing, logout reset pattern, persist middleware config)
- src/types.ts (Permission, Role interfaces — understand the expected shape of fetched data)
  </read_first>

<action>
Add three new fields to `AuthState` interface in `src/store/auth.ts`:
1. `permissions: string[]` — defaults to `[]`
2. `permissionsLoaded: boolean` — defaults to `false`
3. `permissionsError: string | null` — defaults to `null`
4. `setPermissions: (permissions: string[]) => void` — sets `permissions`, `permissionsLoaded: true`, `permissionsError: null`
5. `setPermissionsError: (error: string | null) => void` — sets `permissionsError`, `permissionsLoaded: true`

Update `logout()` (line 48) to also reset `permissions: []`, `permissionsLoaded: false`, `permissionsError: null`.
Update `setAuth()` (line 33) to also set `permissionsLoaded: false` (triggers re-fetch on next app mount).

Do NOT modify the `persist` middleware config (name stays `auth-storage`). The `persist` middleware will automatically persist the new fields.
</action>

<acceptance_criteria>

- `src/store/auth.ts` contains `AuthState` with `permissions: string[]`, `permissionsLoaded: boolean`, `permissionsError: string | null`, `setPermissions`, `setPermissionsError`
- `logout()` function body includes `permissions: [], permissionsLoaded: false, permissionsError: null` in the set call
- `setAuth()` function body includes `permissionsLoaded: false` in the set call
- `persist` middleware `name` remains `'auth-storage'`
- All existing fields (user, token, userId, setAuth, logout) remain unchanged in behavior
- Run `pnpm exec tsc --noEmit` — no type errors in `src/store/auth.ts`
  </acceptance_criteria>

</task>

---

### 11a-T02 — Extract `checkPermission()` pure function + add `PERM` constants

<task>
<description>Extract the wildcard/exact/namespace matching logic into a pure `checkPermission(perms, needed)` function and add the `PERM` constants object</description>

<read_first>

- src/lib/permissions.ts (current state — must preserve can(), isAdmin(), canManageInventory(), ROLES, ROLE_PERMISSIONS)
- .planning/phase-11/11-RESEARCH.md (section 4 `checkPermission()` logic, section 7 PERM constants)
  </read_first>

<action>
Add before the existing `can()` function (before line 50 in current file):

1. Add `export function checkPermission(userPerms: string[], needed: string): boolean` that:
   - Iterates userPerms
   - Returns true if `p === '*'`, or `p === needed` (exact match), or `p.endsWith('.*') && (needed === ns || needed.startsWith(ns + '.'))` where ns is the prefix before `.*`
   - Returns false otherwise
   - This is the same logic currently inline in `can()` lines 56-68

2. Add `export const PERM = { ... } as const;` with all entries from RESEARCH.md section 7 (CAMPS_CREATE through WILDCARD). This goes between `ROLE_PERMISSIONS` and the existing `can()` function.

3. Add `export type PermissionKey = (typeof PERM)[keyof typeof PERM];`

Do NOT modify `can()`, `isAdmin()`, `canManageInventory()`, `canManageTransfers()`, `canManageExpeditions()`, `canManageAdmissions()`, or the `ROLE_PERMISSIONS` map yet.
</action>

<acceptance_criteria>

- `src/lib/permissions.ts` exports `checkPermission`
- `checkPermission(['*'], 'anything')` returns true
- `checkPermission(['camps.*'], 'camps.create')` returns true
- `checkPermission(['camps.*'], 'camps')` returns true
- `checkPermission(['camps.read'], 'camps.delete')` returns false
- `checkPermission([], 'anything')` returns false
- `src/lib/permissions.ts` exports `PERM` const with keys: `PERM.CAMPS_CREATE === 'camps.create'`, `PERM.PEOPLE_CREATE === 'people.create'`, `PERM.INVENTORY_ADJUST === 'inventory.adjust'`, `PERM.TRANSFERS_CREATE === 'transfers.create'`, `PERM.WILDCARD === '*'`, etc. (all entries from RESEARCH section 7)
- `src/lib/permissions.ts` exports `PermissionKey` type
- Existing `can()`, `ROLE_PERMISSIONS`, `ROLES` remain unchanged and functional
  </acceptance_criteria>

</task>

---

### 11a-T03 — Rename `can()` to `canLegacy()` and add new store-backed `can()`

<task>
<description>Rename the old role-param-based can() to canLegacy() and add new can(permission) that reads from the Zustand store</description>

<read_first>

- src/lib/permissions.ts (current state after T02 — with checkPermission and PERM added)
- src/store/auth.ts (after T01 — understand useAuthStore shape for getState())
  </read_first>

<action>
1. Rename `export function can(role: string | null | undefined, permission: string): boolean` (currently line 50) to `export function canLegacy(role: string | null | undefined, permission: string): boolean`
   - In the function body, replace the inline matching loop (lines 56-68) with a call to `checkPermission(perms, permission)` while keeping the `if (!role) return false; const perms = ROLE_PERMISSIONS[role];` prefix

2. Add new `export function can(permission: string): boolean` after `canLegacy`:
   - Get `useAuthStore.getState().permissions`
   - Get `useAuthStore.getState().permissionsLoaded`
   - If `permissions.length === 0` return false
   - Return `checkPermission(permissions, permission)`

3. Add `export function hasPermission(permission: string): boolean` as an alias: `return can(permission);`
   </action>

<acceptance_criteria>

- `src/lib/permissions.ts` exports `canLegacy` with signature `(role: string | null | undefined, permission: string): boolean`
- `src/lib/permissions.ts` exports `can` with signature `(permission: string): boolean`
- `src/lib/permissions.ts` exports `hasPermission` as alias
- Old call sites that use `can(user?.role, 'x')` now reference `canLegacy` — they are compile errors that will be fixed in 11b
- New `can()` returns false when `permissions` array is empty
- New `can()` returns true when `permissions` contains `'*'`
- New `can()` delegates to `checkPermission()` for matching logic
- Run `pnpm exec tsc --noEmit` — TypeScript reports errors on old call sites referencing `can()` with 2 args (expected at this stage)
  </acceptance_criteria>

</task>

---

### 11a-T04 — Add React hooks and `Can` component

<task>
<description>Add useCan, usePermissions, useIsAdmin hooks and the Can declarative component</description>

<read_first>

- src/lib/permissions.ts (current state after T03)
- src/lib/permissions.ts (ROLES const, current isAdmin function at line 75-77)
  </read_first>

<action>
Add the following at the end of `src/lib/permissions.ts` (or after the new `can()` function):

1. `export function useCan(permission: string): boolean` — React hook:
   - `const permissions = useAuthStore((s) => s.permissions);`
   - `const loaded = useAuthStore((s) => s.permissionsLoaded);`
   - `if (!loaded) return false;`
   - `return checkPermission(permissions, permission);`
   - Import `useAuthStore` from '../store/auth' (or `'../store'`)

2. `export function usePermissions()` — React hook returning `{ can, loaded, error, isAdmin }`:
   - `const permissions = useAuthStore((s) => s.permissions);`
   - `const loaded = useAuthStore((s) => s.permissionsLoaded);`
   - `const error = useAuthStore((s) => s.permissionsError);`
   - `return { can: (p: string) => checkPermission(permissions, p), loaded, error, isAdmin: checkPermission(permissions, '*') };`

3. `export function useIsAdmin(): boolean` — React hook: `return useCan('*');`

4. `export function Can({ permission, fallback, children }: { permission: string; fallback?: ReactNode; children: ReactNode }): ReactNode`:
   - `const allowed = useCan(permission);`
   - `if (!allowed) return <>{fallback ?? null}</>;`
   - `return <>{children}</>;`
   - Import ReactNode from 'react'

5. Update `isAdmin()` (line 75-77) to be store-backed:
   - Current: `export function isAdmin(role: string | null | undefined): boolean { return can(role, '*') || role === ROLES.SYSTEM_ADMIN; }`
   - Change to: `export function isAdmin(): boolean { return can('*'); }`
   - This will be a breaking change at call sites using `isAdmin(user?.role)` — fix those in 11b/11c
     </action>

<acceptance_criteria>

- `src/lib/permissions.ts` exports `useCan`, `usePermissions`, `useIsAdmin`, `Can`
- `useCan('*')` returns false when `permissionsLoaded` is false
- `useCan('*')` returns true when `permissions` contains `'*'` and `permissionsLoaded` is true
- `usePermissions().loaded` returns false when `permissionsLoaded` is false
- `usePermissions().isAdmin` returns true when `permissions` contains `'*'`
- `usePermissions().error` returns the error string when `permissionsError` is set
- `Can` component renders children when permission matches, renders `fallback` prop when provided and denied, renders null when denied and no fallback
- `isAdmin()` signature changed from `(role)` to `()` — reads from store
- Run `pnpm exec tsc --noEmit` — type errors on old `isAdmin(user?.role)` call sites are expected
  </acceptance_criteria>

</task>

---

### 11a-T05 — Add permissions fetch logic to `App.tsx`

<task>
<description>Add a permissions fetch useEffect in App.tsx that calls GET /api/roles on mount when authenticated and not yet loaded</description>

<read_first>

- src/App.tsx (current state — must understand the component structure, auth store usage, existing useEffect for session timeout at lines 111-133)
- src/store/auth.ts (after T01 — understand setPermissions, setPermissionsError signatures)
- src/lib/api.ts (apiClient, unwrapList)
- src/types.ts (Role interface with permissions[])
  </read_first>

<action>
Add a new `useEffect` in the `App` component (inside the default export function, before the return statement, after the session timeout useEffect at line 133):

1. Get `token`, `permissionsLoaded`, `setPermissions`, `setPermissionsError` from `useAuthStore()`
2. Add `useEffect(() => { ... }, [token, permissionsLoaded, setPermissions, setPermissionsError])`:
   - `if (!token || permissionsLoaded) return;`
   - Define `async function fetchPermissions() { ... }`:
     - Call `apiClient.get('/roles')`
     - `const roles = unwrapList<Role>(res.data);`
     - Get the `user.role` from `useAuthStore.getState().user?.role`
     - `const userRole = roles.find((r) => r.name === user.role);`
     - Extract: `const permissionNames = userRole?.permissions?.map((p) => p.name) ?? [];`
     - Call `setPermissions(permissionNames);`
   - Call `fetchPermissions()` and catch errors:
     - On catch, call `setPermissionsError('Failed to load permissions')`
   - Use a cleanup flag `let cancelled = false` to avoid setting state after unmount
3. Add a `window.focus` event listener in the same useEffect that re-fetches permissions (handles stale permissions after role change in another tab):
   - On focus, if `token` exists and `permissionsLoaded`, call `fetchPermissions()`
   - Cleanup removes event listener

Do NOT modify the session timeout useEffect, the ProtectedRoute component, or any routes.
</action>

<acceptance_criteria>

- `src/App.tsx` contains a `useEffect` that fetches `GET /api/roles`
- The fetch only triggers when `token` is truthy AND `permissionsLoaded` is false
- On success, `setPermissions([...])` is called with extracted permission name strings
- On network error, `setPermissionsError('Failed to load permissions')` is called
- On successful fetch, `useAuthStore.getState().permissionsLoaded` becomes true
- `window.focus` event re-triggers the fetch when token exists
- Cleanup cancels in-flight state updates on unmount
- Run `pnpm exec tsc --noEmit` — no new type errors introduced in `src/App.tsx`
  </acceptance_criteria>

</task>

---

## Verification

After all 11a tasks are complete:

```bash
pnpm exec tsc --noEmit
```

Expected result: TypeScript reports compile errors on call sites that use the old `can(user?.role, 'x')` signature (these will be fixed in 11b). No other errors.

```bash
pnpm check
```

Expected result: Lint and spell checks pass. Build may fail due to 11b migrations not yet done — that's expected and will be resolved in 11b.
