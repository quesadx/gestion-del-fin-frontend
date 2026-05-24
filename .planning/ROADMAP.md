# GDF Roadmap — Legacy Feature Parity

**Goal:** Bring current app (`chore/frontend-remake`) to feature parity with `legacy/` reference. Keep current architecture (single-file features, inline TanStack hooks, Zustand stores, Tailwind CSS 4). Improve, don't copy blindly.

## Phases

| #   | Phase               | Goal                                                                      | Status                |
| --- | ------------------- | ------------------------------------------------------------------------- | --------------------- |
| 01  | Resources CRUD      | Resource types page — create/edit/delete resource definitions             | Complete (2026-05-24) |
| 02  | Professions CRUD    | Profession types page — create/edit/delete professions                    | Pending               |
| 03  | Users CRUD          | System users management page — create/edit/delete users + role assignment | Pending               |
| 04  | Rations Mgmt        | Ration disbursement tracking page — history + create                      | Pending               |
| 05  | Inventory Audit     | Dedicated inventory audit page — full chronological event log             | Pending               |
| 06  | Camp Detail         | `/camps/:id` detail page — camp-specific stats + sub-entities             | Pending               |
| 07  | Exploration Detail  | `/expeditions/:id` detail page — full expedition view                     | Pending               |
| 08  | Person Detail + New | `/population/:id` profile + `/population/new` add person form             | Pending               |
| 09  | Person Flows        | Status logging, profession reassignment, contribution overrides           | Pending               |
| 10  | Resource Alerts     | Prominent stock alerts system — critical/low banners + nav indicator      | Pending               |

## Dev Rules

- `pnpm check` before each commit (lint + spell + build)
- Each phase = one commit minimum, more if large
- Keep current patterns: inline TanStack hooks, single TSX per feature, Zustand for client state only
- Use Nix env: `nix develop` then `pnpm` commands
- API proxy via `/api-remote` → Express → Railway (see `src/lib/api.ts`)
- All new routes go in `src/App.tsx`, nav items in `src/layouts/DashboardLayout.tsx`
- Types go in `src/types.ts` (current pattern), not per-feature type files
- Permission helpers in `src/lib/permissions.ts`
