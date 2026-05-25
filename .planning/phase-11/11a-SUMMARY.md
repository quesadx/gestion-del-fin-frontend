# Phase 11a Summary — Infrastructure

**Date:** 2026-05-25
**Status:** Complete

## Tasks Completed

| Task    | Description                                                                                | Commit                                                                |
| ------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| 11a-T01 | Extended auth store with permissions state                                                 | `04bf449` feat(auth): add permissions state to Zustand store          |
| 11a-T02 | Added `checkPermission()`, `PERM` constants, type                                          | `d8f72b3` feat(permissions): add checkPermission(), PERM constants... |
| 11a-T03 | Renamed `can()` to `canLegacy()`, added new `can()`                                        | `40962a9` feat(permissions): rename can() to canLegacy()...           |
| 11a-T04 | Added hooks (`useCan`, `usePermissions`, `useIsAdmin`, `Can`) and store-backed `isAdmin()` | `4891f40` feat(permissions): add useCan, usePermissions...            |
| 11a-T05 | Added permissions fetch in `App.tsx`                                                       | `59daac8` feat(permissions): add GET /api/roles fetch on mount...     |

## Files Modified

| File                     | Changes                                                                                                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/store/auth.ts`      | +`permissions`, `permissionsLoaded`, `permissionsError`, `setPermissions`, `setPermissionsError`                                                                                                                   |
| `src/lib/permissions.ts` | +`checkPermission()`, `PERM`, `PermissionKey`, `canLegacy()`, new `can()`, `hasPermission()`, `useCan()`, `usePermissions()`, `useIsAdmin()`, `Can`, store-backed `isAdmin()`; renamed old `isAdmin(role)` removed |
| `src/App.tsx`            | +`useEffect` fetching `GET /api/roles` on mount + `window.focus` re-fetch                                                                                                                                          |

## TypeScript Status

**12 expected compile errors** — all `TS2554: Expected 1 arguments, but got 2` at old `can(user?.role, 'x')` call sites. These will be fixed in 11b.

Affected files: `AdmissionList.tsx`, `CampDetail.tsx`, `CampManagement.tsx`, `ExpeditionDetail.tsx`, `ExpeditionList.tsx`, `NewPersonPage.tsx`, `PersonDetail.tsx`, `PopulationRoster.tsx`, `DashboardLayout.tsx`.

## Backward Compatibility

- All existing call sites that used `can(user?.role, 'x')` break at compile time (intentional — TypeScript guides migration)
- `canLegacy()` with the old signature remains available for convenience helpers
- `ROLE_PERMISSIONS` map still exists for legacy helpers
- No visual changes — infrastructure only, functional in 11b/11c
