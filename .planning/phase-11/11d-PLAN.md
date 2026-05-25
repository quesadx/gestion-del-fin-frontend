---
phase: 11
sub_phase: d
wave: 4
depends_on: [11c]
files_modified:
  - src/lib/permissions.ts
  - src/App.tsx
autonomous: true
---

# Plan 11d: Cleanup & Verification

**Goal:** Remove all legacy/deprecated code — `canLegacy()`, `ROLE_PERMISSIONS`, old convenience helpers, and the deprecated `roles` prop from `ProtectedRoute`. Validate the entire build passes cleanly.

**must_haves:**

- `canLegacy()` function removed from `src/lib/permissions.ts`
- `ROLE_PERMISSIONS` object removed from `src/lib/permissions.ts`
- Deprecated convenience helpers (`canManageInventory`, `canManageTransfers`, `canManageExpeditions`, `canManageAdmissions`) removed — they used `canLegacy` internally
- `ProtectedRoute` no longer accepts `roles` prop (all routes use `permission`)
- `ROLES` const object removed from `src/lib/permissions.ts` if no longer used
- `pnpm check` passes — lint, spell, build with zero errors
- Zero references to `canLegacy`, `ROLE_PERMISSIONS`, or `canManageInventory`/etc. in the entire codebase

---

## Tasks

---

### 11d-T01 — Remove `canLegacy()`, `ROLE_PERMISSIONS`, and deprecated helpers

<task>
<description>Remove all legacy permission code from src/lib/permissions.ts after confirming zero references</description>

<read_first>

- src/lib/permissions.ts (current state after 11c — contains canLegacy, ROLE_PERMISSIONS, ROLES, canManageInventory, canManageTransfers, canManageExpeditions, canManageAdmissions alongside new API)
  </read_first>

<action>
In `src/lib/permissions.ts`:

1. Delete `ROLE_PERMISSIONS` object (lines ~16-43). This includes the entire `Record<string, string[]>` and all role entries (system_admin, resource_manager, travel_coordinator, worker with their permission arrays).

2. Delete `canLegacy()` function (the renamed old `can` with role param). Its import was `useAuthStore` — remove if only used by `canLegacy`. It references `ROLE_PERMISSIONS[role]` which no longer exists.

3. Delete `canManageInventory(role)` function (lines ~79-81) — uses `canLegacy` internally. Components now use `can(PERM.INVENTORY_ALL)` or `can(PERM.INVENTORY_ADJUST)`.

4. Delete `canManageTransfers(role)` function (lines ~83-85) — uses `canLegacy` internally. `TransferList.tsx` now uses `can(PERM.TRANSFERS_ALL)`.

5. Delete `canManageExpeditions(role)` function (lines ~87-89) — uses `canLegacy` internally. Components now use `can(PERM.EXPEDITIONS_MANAGE)`.

6. Delete `canManageAdmissions(role)` function (lines ~91-93) — uses `canLegacy` internally. Components now use `can(PERM.ADMISSION_REVIEW)`.

7. Keep `ROLES` const object (lines 1-6) IF it is still referenced by any other file. Check: `grep -r "ROLES\." src/ --include="*.tsx" --include="*.ts" | grep -v permissions.ts`. If no references, also delete `ROLES` and its `Role` type export.

8. Keep `checkPermission`, `PERM`, `PermissionKey` type, `can`, `hasPermission`, `isAdmin`, `useCan`, `usePermissions`, `useIsAdmin`, `Can` — these are the new API.

9. Remove unused imports that were only needed by deleted functions.
   </action>

<acceptance_criteria>

- `src/lib/permissions.ts` does NOT contain `ROLE_PERMISSIONS`
- `src/lib/permissions.ts` does NOT export `canLegacy`
- `src/lib/permissions.ts` does NOT export `canManageInventory`
- `src/lib/permissions.ts` does NOT export `canManageTransfers`
- `src/lib/permissions.ts` does NOT export `canManageExpeditions`
- `src/lib/permissions.ts` does NOT export `canManageAdmissions`
- `src/lib/permissions.ts` still exports: `checkPermission`, `PERM`, `PermissionKey`, `can`, `hasPermission`, `isAdmin`, `useCan`, `usePermissions`, `useIsAdmin`, `Can`
- Run `pnpm exec tsc --noEmit` — zero type errors across the entire codebase
- Run `grep -r "canLegacy\|ROLE_PERMISSIONS\|canManageInventory\|canManageTransfers\|canManageExpeditions\|canManageAdmissions" src/ --include="*.tsx" --include="*.ts"` returns empty
  </acceptance_criteria>

</task>

---

### 11d-T02 — Remove deprecated `roles` prop from `ProtectedRoute`

<task>
<description>Remove the roles prop support from ProtectedRoute now that all routes use permission</description>

<read_first>

- src/App.tsx (current state after 11b/11c — ProtectedRoute at lines ~83-88, all routes use permission prop only)
  </read_first>

<action>
In `src/App.tsx`:

1. Verify no route still uses `roles={...}` — search for `roles={` in the Routes block (lines ~150-296). Expected: zero matches (all using `permission=`).

2. Update `ProtectedRoute` signature:
   - Old: `const ProtectedRoute = ({ children, roles, permission }: { children: ReactNode; roles?: string[]; permission?: string }) => {`
   - New: `const ProtectedRoute = ({ children, permission }: { children: ReactNode; permission?: string }) => {`

3. Remove the `roles` check block (lines ~86):
   - Old: `if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;`
   - Remove entirely.

4. The `ProtectedRoute` should now only:
   - Redirect to `/login` if no user
   - Redirect to `/` if `permission` provided and `can(permission)` returns false
   - Render children otherwise
     </action>

<acceptance_criteria>

- `src/App.tsx` `ProtectedRoute` does NOT accept `roles` in its props type
- `src/App.tsx` `ProtectedRoute` body does NOT contain `roles.includes(user.role)`
- `src/App.tsx` routes (lines ~150-296) do NOT contain `roles={` — all use `permission={...}`
- Run `pnpm exec tsc --noEmit` — zero type errors
  </acceptance_criteria>

</task>

---

### 11d-T03 — Final verification: `pnpm check` clean pass

<task>
<description>Run the full check suite and verify zero errors</description>

<read_first>

- src/lib/permissions.ts (after T01 cleanup)
- src/App.tsx (after T02 cleanup)
  </read_first>

<action>
Execute the following commands sequentially:

1. `pnpm exec tsc --noEmit` — verify zero TypeScript errors

2. `pnpm run lint` — verify zero lint errors (or `pnpm exec eslint . --ext .ts,.tsx` if no lint script)

3. `pnpm exec cspell .` (or whatever spell check is in `pnpm check`) — verify zero spelling errors

4. `pnpm run build` — verify production build succeeds with zero errors

5. `grep -r "canLegacy" src/ --include="*.tsx" --include="*.ts"` — must return empty

6. `grep -r "ROLE_PERMISSIONS" src/ --include="*.tsx" --include="*.ts"` — must return empty

7. `grep -rP "can\(.*\?\.role" src/ --include="*.tsx"` — must return empty (no old signature calls)

8. `grep -r "'system_admin'\s*\]" src/App.tsx` — must return empty (no hardcoded role arrays in routes)

If any checks fail, report the exact error messages and file locations.
</action>

<acceptance_criteria>

- `pnpm exec tsc --noEmit` exits 0
- `pnpm run lint` exits 0
- `pnpm run build` exits 0 and produces a valid build output
- `grep -r "canLegacy" src/ --include="*.tsx" --include="*.ts"` returns empty (zero characters)
- `grep -r "ROLE_PERMISSIONS" src/ --include="*.tsx" --include="*.ts"` returns empty
- `grep -rP "can\(.*\?\.role" src/ --include="*.tsx"` returns empty
- `grep -r "'system_admin'\s*\]" src/App.tsx` returns empty
  </acceptance_criteria>

</task>

---

## Verification

After all 11d tasks are complete, the final verification is the same as `pnpm check`:

```bash
pnpm check
```

Expected: Zero errors. Lint, spell, and build all pass.

The permissions engine is now:

- Fully store-backed (reads from `useAuthStore.getState().permissions`)
- Fetched from `GET /api/roles` at app startup
- Zero hardcoded permission strings outside `PERM` constants in `src/lib/permissions.ts`
- Every action button gated by permission check
- Every route protected by permission key
- All legacy code removed
