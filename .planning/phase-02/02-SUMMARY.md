---
phase: 02
plan: 02
subsystem: professions
tags: [crud, ui, permissions, routing]
key-files:
  - src/features/professions/ProfessionsPage.tsx
  - src/types.ts
  - src/App.tsx
  - src/layouts/DashboardLayout.tsx
metrics:
  files-changed: 4
  files-created: 1
  commits: 2
---

# Phase 02 — Professions CRUD Page

## Commits

| #   | Hash      | Description                                      |
| --- | --------- | ------------------------------------------------ |
| 1   | `1bb2ee3` | feat(02-01): add Profession type and CRUD page   |
| 2   | `6c4f1d8` | feat(02-02): add /professions route and nav item |

## Changes

- **Profession type** added to `src/types.ts` (`id`, `name`, `description?`)
- **ProfessionsPage** created at `src/features/professions/ProfessionsPage.tsx`:
  - Full CRUD: list cards, create modal, edit modal, delete confirmation
  - Inline TanStack hooks (`useQuery`, `useMutation`) for `/professions` endpoints
  - Loading skeleton, empty state, error handling via API interceptors
  - Permission guard via route-level `ProtectedRoute`
- **Route** added at `/professions` in `App.tsx` (system_admin only)
- **Nav item** added in `DashboardLayout.tsx` with `Wrench` icon and `professions.read` permission

## Deviations

- None. Followed existing ResourcesPage/CampManagement patterns exactly.

## Self-Check

**PASSED**

- [x] All tasks executed and committed individually
- [x] `pnpm vite build` passes (frontend compiles clean)
- [x] Empty state renders when no professions exist
- [x] Create → POST /professions → list refreshes
- [x] Edit → PUT /professions/{id} → row updates
- [x] Delete confirmation → DELETE /professions/{id} → row removed
- [x] Route gated to system_admin via ProtectedRoute
