# Phase 11d — SUMMARY

**Status:** COMPLETE
**Date:** 2026-05-25

## What was done

### T01 — Removed legacy code from `src/lib/permissions.ts`

- Removed `ROLES` const object and `Role` type (zero external references)
- Removed `ROLE_PERMISSIONS` hardcoded role-permission map
- Removed `canLegacy()` function (deprecated role-param-based check)
- Removed convenience helpers: `canManageInventory`, `canManageTransfers`, `canManageExpeditions`, `canManageAdmissions`
- **Kept:** `checkPermission`, `PERM`, `PermissionKey`, `can`, `hasPermission`, `isAdmin`, `useCan`, `usePermissions`, `useIsAdmin`, `Can`

### T02 — Removed deprecated `roles` prop from `ProtectedRoute`

- Removed `roles` from `ProtectedRoute` props type
- Removed `roles.includes(user.role)` check block
- All routes use `permission` prop exclusively

## Verification

| Check                                 | Result       |
| ------------------------------------- | ------------ |
| `pnpm exec tsc --noEmit`              | PASS         |
| `pnpm run lint`                       | PASS         |
| `pnpm run spell`                      | PASS         |
| `pnpm run build`                      | PASS         |
| `grep canLegacy` (src/)               | Zero matches |
| `grep ROLE_PERMISSIONS` (src/)        | Zero matches |
| `grep canManageInventory\|...` (src/) | Zero matches |
| `grep roles={` (App.tsx)              | Zero matches |

## Files modified

- `src/lib/permissions.ts` — stripped 76 lines of legacy code
- `src/App.tsx` — removed `roles` prop from `ProtectedRoute`
