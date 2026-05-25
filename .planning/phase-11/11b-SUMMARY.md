# Phase 11b: SUMMARY — Call Site Migration

**Date:** 2026-05-25  
**Status:** Complete

---

## Tasks Executed

### 11b-T01 — DashboardLayout.tsx nav filtering

- Updated import: `{ can }` → `{ can, PERM }`
- Line 206: `can(user?.role, 'inventory.read')` → `can(PERM.INVENTORY_READ)`
- Line 318: `can(user?.role, NAV_PERMISSIONS[item.to])` → `can(NAV_PERMISSIONS[item.to])`
- Line 628: `can(user?.role, 'inventory.read')` → `can(PERM.INVENTORY_READ)`

### 11b-T02 — DashboardOverview.tsx ADMIN_ROLES

- Removed hardcoded `ADMIN_ROLES` array
- Replaced `isAdmin`/`isWorker` logic with `useIsAdmin()` hook
- Removed unused `useAuthStore` import and `user` variable

### 11b-T03 — TransferList.tsx duplicate logic

- Removed `normalizeRole()`, `canManageTransfers()`, `canCreateTransfers()` (17 lines)
- Replaced with `can(PERM.TRANSFERS_ALL)` and `can(PERM.TRANSFERS_CREATE)`
- Removed unused `user` destructuring

### 11b-T04 — ProtectedRoute upgrade + route guards

- Added `permission?: string` prop to `ProtectedRoute`
- Converted 5 route guards from `roles` → `permission`
- Added `permission={PERM.PROFESSIONS_READ}` guard to `/professions`

### Additional: migrated remaining 8 call sites (for clean tsc)

- AdmissionList.tsx, CampDetail.tsx, CampManagement.tsx
- ExpeditionDetail.tsx, ExpeditionList.tsx
- NewPersonPage.tsx, PersonDetail.tsx, PopulationRoster.tsx
- Removed unused `useAuthStore`/`user` from affected files

---

## Verification

| Check                                      | Result                 |
| ------------------------------------------ | ---------------------- |
| `pnpm check` (lint+spell+build)            | PASS                   |
| `pnpm exec tsc --noEmit`                   | PASS (0 errors)        |
| `grep -r canLegacy src/ --include="*.tsx"` | 0 component call sites |
| `grep -rn "can(user" src/`                 | 0 matches              |

---

## Files Modified (11b)

1. `src/layouts/DashboardLayout.tsx`
2. `src/features/dashboard/DashboardOverview.tsx`
3. `src/features/transfers/TransferList.tsx`
4. `src/App.tsx`
5. `src/features/admission/AdmissionList.tsx`
6. `src/features/camps/CampDetail.tsx`
7. `src/features/camps/CampManagement.tsx`
8. `src/features/explorations/ExpeditionDetail.tsx`
9. `src/features/explorations/ExpeditionList.tsx`
10. `src/features/people/NewPersonPage.tsx`
11. `src/features/people/PersonDetail.tsx`
12. `src/features/people/PopulationRoster.tsx`

**Remaining:** `canLegacy` definition + convenience helpers still in `src/lib/permissions.ts` (to be removed in 11d).
