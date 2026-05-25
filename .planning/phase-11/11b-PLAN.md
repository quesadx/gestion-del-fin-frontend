---
phase: 11
sub_phase: b
wave: 2
depends_on: [11a]
files_modified:
  - src/layouts/DashboardLayout.tsx
  - src/features/dashboard/DashboardOverview.tsx
  - src/features/transfers/TransferList.tsx
  - src/App.tsx
autonomous: true
---

# Plan 11b: Call Site Migration

**Goal:** Migrate all existing `can(user?.role, ...)` call sites to the new store-backed `can(PERM.X)` API. Fix `DashboardOverview` hardcoded `ADMIN_ROLES` and `TransferList` duplicate permission logic. Upgrade `ProtectedRoute` to support `permission` prop. Convert route guards from `roles` to `permission`.

**must_haves:**

- `DashboardLayout.tsx` nav filtering uses `can(PERM.X)` — zero `can(user?.role, ...)` or `canLegacy` calls
- `DashboardOverview.tsx` has no `ADMIN_ROLES` hardcoded array — uses `useIsAdmin()` from store
- `TransferList.tsx` has no `normalizeRole`, `canManageTransfers`, `canCreateTransfers` local functions — uses `can(PERM.X)` from `src/lib/permissions.ts`
- `ProtectedRoute` in `App.tsx` supports `permission?: string` prop alongside existing `roles?: string[]`
- All route guards in `App.tsx` use `permission="..."` instead of `roles={['system_admin']}`
- `pnpm check` passes — lint, spell, build succeed
- Zero `canLegacy()` calls remain in the codebase (proving migration complete)

---

## Tasks

---

### 11b-T01 — Migrate `DashboardLayout.tsx` nav filtering to new `can()` API

<task>
<description>Convert all can(user?.role, ...) calls in DashboardLayout.tsx to can(PERM.X) using the new store-backed API</description>

<read_first>

- src/layouts/DashboardLayout.tsx (current state — focus on line 29 import, line 206 query enabled check, line 318 nav filtering, line 628 alert banner check)
- src/lib/permissions.ts (after 11a — PERM constants, new can() signature)
  </read_first>

<action>
In `src/layouts/DashboardLayout.tsx`:

1. Update the import on line 29: keep `import { can } from '../lib/permissions';` and add `import { PERM } from '../lib/permissions';` (or combine: `import { can, PERM } from '../lib/permissions';`)

2. Line 206 — Change `can(user?.role, 'inventory.read')` to `can(PERM.INVENTORY_READ)`:
   - The `enabled` prop of the inventory-alerts query

3. Line 318 — Change `can(user?.role, NAV_PERMISSIONS[item.to])` to `can(NAV_PERMISSIONS[item.to])`:
   - The filter for visible nav items — NAV_PERMISSIONS already maps paths to permission keys, now they flow through store-backed can()

4. Line 628 — Change `can(user?.role, 'inventory.read')` to `can(PERM.INVENTORY_READ)`:
   - The condition for showing the stock alert banner (AnimatePresence block around line 624-628)

The `NAV_PERMISSIONS` map (lines 135-149) stays as-is — its values are already valid permission key strings.
</action>

<acceptance_criteria>

- `src/layouts/DashboardLayout.tsx` contains zero `can(user?.role, ...)` calls
- `src/layouts/DashboardLayout.tsx` line 206 (or equivalent enabled check) contains `can(PERM.INVENTORY_READ)`
- `src/layouts/DashboardLayout.tsx` line 318 (or equivalent filter) contains `can(NAV_PERMISSIONS[item.to])` with no `user?.role` param
- `src/layouts/DashboardLayout.tsx` line ~628 (alert banner condition) contains `can(PERM.INVENTORY_READ)` with no `user?.role` param
- Run `pnpm exec tsc --noEmit` — no type errors in `DashboardLayout.tsx`
  </acceptance_criteria>

</task>

---

### 11b-T02 — Fix `DashboardOverview.tsx` — replace `ADMIN_ROLES` with `useIsAdmin()`

<task>
<description>Remove the hardcoded ADMIN_ROLES array and replace the admin check with useIsAdmin() from permissions</description>

<read_first>

- src/features/dashboard/DashboardOverview.tsx (current state — focus on lines 24, 30-31, 62, 71)
- src/lib/permissions.ts (after 11a — useIsAdmin() hook, usePermissions() hook)
  </read_first>

<action>
In `src/features/dashboard/DashboardOverview.tsx`:

1. Add import: `import { useIsAdmin, PERM } from '../../lib/permissions';` (line ~7 area, after existing imports)

2. Delete line 24: `const ADMIN_ROLES = ['system_admin', 'resource_manager', 'travel_coordinator'];`

3. Replace lines 30-31:
   - Old: `const isWorker = user?.role === 'worker';`
   - Old: `const isAdmin = user?.role ? ADMIN_ROLES.includes(user.role) : false;`
   - New: `const isAdmin = useIsAdmin();`
   - New: `const isWorkerLogic = !isAdmin;` (rename variable to `isWorkerLogic` or keep `isWorker`)

4. Line 62: Change `enabled: !!currentCampId && isAdmin,` to `enabled: !!currentCampId && isAdmin,` (stays same — `isAdmin` is now from `useIsAdmin()`)

5. Line 71: Change `enabled: !!currentCampId && isWorker,` to `enabled: !!currentCampId && !isAdmin,` (use `!isAdmin` since `isWorker` was based on role name, now it's anyone without admin perms)

6. Update all references to `isWorker` variable: since we're replacing `isWorker` with `!isAdmin`, we may keep the `isWorker` variable alias for readability. Option: `const isWorker = !isAdmin;` — keep the variable name for minimal diff.

The layout/render logic stays the same — `isWorker ? workerCards : adminCards` → same behavior, different basis.
</action>

<acceptance_criteria>

- `src/features/dashboard/DashboardOverview.tsx` does NOT contain the string `ADMIN_ROLES`
- `src/features/dashboard/DashboardOverview.tsx` does NOT contain `'system_admin'`, `'resource_manager'`, or `'travel_coordinator'` as string literals in admin-check logic
- `src/features/dashboard/DashboardOverview.tsx` contains `useIsAdmin()` usage
- `isAdmin` value comes from `useIsAdmin()` — truthy when store permissions include `'*'`
- Run `pnpm exec tsc --noEmit` — no type errors in `DashboardOverview.tsx`
  </acceptance_criteria>

</task>

---

### 11b-T03 — Refactor `TransferList.tsx` — remove duplicate logic, use centralized `can()`

<task>
<description>Remove normalizeRole, canManageTransfers, canCreateTransfers local functions and replace with can(PERM.X) from permissions.ts</description>

<read_first>

- src/features/transfers/TransferList.tsx (current state — focus on lines 107-123 local helpers, lines 404-407 usage, lines 757-764 read-only notice, line 768 canManage check)
- src/lib/permissions.ts (after 11a — can() function, PERM constants)
  </read_first>

<action>
In `src/features/transfers/TransferList.tsx`:

1. Add import: `import { can, PERM } from '../../lib/permissions';`

2. Delete lines 107-123 entirely: `normalizeRole()`, `canManageTransfers()`, `canCreateTransfers()`

3. Replace lines 404-407:
   - Old: `const canManage = canManageTransfers(user?.role);` / `const canCreate = canCreateTransfers(user?.role);`
   - New: `const canManage = can(PERM.TRANSFERS_ALL);` (covers approve-source, approve-target, complete, reject, schedule)
   - New: `const canCreate = can(PERM.TRANSFERS_CREATE);`

4. Line ~758 (`!canManage`) in the read-only notice: This still works — `canManage` is now from new `can()`

5. Line ~768 (`canManage && detail.status !== ...`): This still works — same variable, different source

6. Remove unused `user` variable if no longer needed — keep if used elsewhere in the component
   </action>

<acceptance_criteria>

- `src/features/transfers/TransferList.tsx` does NOT contain `normalizeRole`, `canManageTransfers`, or `canCreateTransfers` function definitions
- `src/features/transfers/TransferList.tsx` uses `can(PERM.TRANSFERS_ALL)` for management permissions
- `src/features/transfers/TransferList.tsx` uses `can(PERM.TRANSFERS_CREATE)` for create permission
- The NEW TRANSFER button (line ~421-428) is gated by `canCreate` which now reads from store
- Action buttons (approve source, approve target, complete, reject, schedule) are gated by `canManage` which now reads from store
- Run `pnpm exec tsc --noEmit` — no type errors in `TransferList.tsx`
  </acceptance_criteria>

</task>

---

### 11b-T04 — Upgrade `ProtectedRoute` to support `permission` prop + convert route guards

<task>
<description>Add permission prop support to ProtectedRoute in App.tsx and convert all route guards from roles to permission keys</description>

<read_first>

- src/App.tsx (current state — ProtectedRoute at lines 83-88, all route definitions at lines 150-296)
- src/lib/permissions.ts (after 11a — can() function, PERM constants)
  </read_first>

<action>
In `src/App.tsx`:

1. Add import: `import { can, PERM } from './lib/permissions';`

2. Update `ProtectedRoute` (lines 83-88):
   - Add `permission?: string` to props destructuring
   - After the existing `roles` check, add: `if (permission && !can(permission)) return <Navigate to="/" replace />;`
   - The function now accepts `{ children, roles, permission }` with both optional

3. Convert all route guards from `roles` to `permission`:

| Route path                   | Old                                            | New                          |
| ---------------------------- | ---------------------------------------------- | ---------------------------- |
| `/population/new` (line 171) | `roles={['system_admin']}`                     | `permission="people.create"` |
| `/resources` (line 251)      | `roles={['system_admin', 'resource_manager']}` | `permission="resources.*"`   |
| `/users` (line 275)          | `roles={['system_admin']}`                     | `permission="users.*"`       |
| `/roles` (line 283)          | `roles={['system_admin']}`                     | `permission="roles.*"`       |
| `/permissions` (line 291)    | `roles={['system_admin']}`                     | `permission="permissions.*"` |

4. Add permission guards to routes that currently have no role check but should be protected:
   - `/professions` (line 267): Add `permission="professions.read"`
   - These routes are already subject to nav filtering in `DashboardLayout`, but direct URL access is possible — `ProtectedRoute` with `permission` closes this gap.

5. Use `PERM` constants for the permission strings where practical (keep string literals for brevity, but reference PERM values): Replace string literals with `PERM.PEOPLE_CREATE`, `PERM.RESOURCES_ALL`, `PERM.USERS_ALL`, `PERM.ROLES_ALL`, `PERM.PERMISSIONS_ALL`, `PERM.PROFESSIONS_READ`
   </action>

<acceptance_criteria>

- `src/App.tsx` `ProtectedRoute` accepts `permission?: string` prop
- `ProtectedRoute` with `permission="people.create"` blocks access when user lacks `people.create` permission (redirects to `/`)
- `/population/new` route uses `permission={PERM.PEOPLE_CREATE}`
- `/resources` route uses `permission={PERM.RESOURCES_ALL}`
- `/users` route uses `permission={PERM.USERS_ALL}`
- `/roles` route uses `permission={PERM.ROLES_ALL}`
- `/permissions` route uses `permission={PERM.PERMISSIONS_ALL}`
- `/professions` route uses `permission={PERM.PROFESSIONS_READ}`
- Run `pnpm exec tsc --noEmit` — no type errors in `src/App.tsx`
  </acceptance_criteria>

</task>

---

## Verification

After all 11b tasks are complete:

```bash
pnpm exec tsc --noEmit
```

Expected: Zero TypeScript errors across the entire codebase. All old `can(user?.role, ...)` call sites are migrated.

```bash
pnpm check
```

Expected: Lint, spell, and build pass. Zero errors.

Verify that zero `canLegacy()` calls remain by searching:

```bash
grep -r "canLegacy" src/ --include="*.tsx" --include="*.ts"
```

Expected: No matches (empty output).
