---
status: complete
---

# Quick Task 260526-qt3: Permission-driven UI Gating — Summary

## What Changed

### Task 1: Core infrastructure

- `src/types.ts`: Added `permissions?: string[]` to the `User` interface
- `src/lib/permissions.ts`: Added `hasPermission(permissions, permission)` function supporting exact match, `*` wildcard, and namespace wildcards (`inventory.*`) in both directions. Extracted shared `matchPermission` helper. `can()` still works for backward compatibility.
- `src/store/auth.ts`: `setAuth()` now preserves `permissions` from the login response, with JWT payload fallback
- `src/features/auth/LoginPage.tsx`: No changes needed — already passes `res.data.user` to `setAuth`, which now includes `permissions`

### Task 2: Migrate all UI gating from role-based to permission-based

- `src/layouts/DashboardLayout.tsx`: Nav filtering, inventory alerts, and inventory queries now use `hasPermission(user?.permissions, ...)` instead of `can(user?.role, ...)`
- `src/App.tsx`: `ProtectedRoute` now accepts optional `permission` prop using `hasPermission`. Route guards migrated from role arrays to permission strings. Role check kept as coarse fallback.
- `src/features/explorations/ExpeditionList.tsx`: `expeditions.create` via `hasPermission`
- `src/features/explorations/ExpeditionDetail.tsx`: `expeditions.read` via `hasPermission`
- `src/features/people/PopulationRoster.tsx`: `people.profession_reassign.create` via `hasPermission`
- `src/features/people/PersonDetail.tsx`: `people.read` via `hasPermission`
- `src/features/people/NewPersonPage.tsx`: `*` wildcard via `hasPermission`
- `src/features/admission/AdmissionList.tsx`: `admission.create` + `admission.review` via `hasPermission`
- `src/features/camps/CampManagement.tsx`: `camps.delete` via `hasPermission`
- `src/features/camps/CampDetail.tsx`: `camps.read` via `hasPermission`
- `src/features/transfers/TransferList.tsx`: Replaced local `normalizeRole`, `canManageTransfers`, `canCreateTransfers` functions with `hasPermission` from shared lib
- `src/features/dashboard/DashboardOverview.tsx`: Replaced local `ADMIN_ROLES.includes()` + `isAdmin` with `hasPermission(user?.permissions, 'metrics.dashboard')`

### Task 3: Fix un-gated useQuery calls (prevent 403s)

14 additional files — added `enabled: hasPermission(user?.permissions, ...)` to all queries that previously fired with only `!!currentCampId` or no gating at all. This prevents backend 403 Forbidden errors from appearing in the console for non-admin roles.

**Files:** `PopulationRoster.tsx`, `AdmissionList.tsx`, `ExpeditionList.tsx`, `DashboardOverview.tsx`, `InventoryList.tsx`, `InventoryAudit.tsx`, `RationsPage.tsx`, `TransferList.tsx`, `UsersPage.tsx`, `RolesPage.tsx`, `PermissionsPage.tsx`, `ProfessionsPage.tsx`, `ResourcesPage.tsx`, `GamificationWidget.tsx`

## Files Changed (cumulative)

- `src/types.ts` — Added `permissions` field to User
- `src/lib/permissions.ts` — Added `hasPermission()` + `matchPermission()` helper
- `src/store/auth.ts` — Store permissions from login response
- `src/layouts/DashboardLayout.tsx` — Nav/alert/query gating via `hasPermission`
- `src/App.tsx` — `ProtectedRoute` with permission prop
- `src/features/explorations/ExpeditionList.tsx`
- `src/features/explorations/ExpeditionDetail.tsx`
- `src/features/people/PopulationRoster.tsx`
- `src/features/people/PersonDetail.tsx`
- `src/features/people/NewPersonPage.tsx`
- `src/features/admission/AdmissionList.tsx`
- `src/features/camps/CampManagement.tsx`
- `src/features/camps/CampDetail.tsx`
- `src/features/transfers/TransferList.tsx`
- `src/features/dashboard/DashboardOverview.tsx`
- `.planning/STATE.md`
- `.planning/quick/260526-qt3-permission-based-ui-gating/260526-qt3-PLAN.md`
