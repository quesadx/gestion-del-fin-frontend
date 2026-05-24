# GDF Roadmap

## Milestones

- ✅ **v1.0-legacy-parity** — Phases 01-10 (shipped 2026-05-24)

## Phases

<details>
<summary>✅ v1.0-legacy-parity (Phases 01-10) — SHIPPED 2026-05-24</summary>

- [x] Phase 01: Resources CRUD (1/1 plans) — completed 2026-05-24
- [x] Phase 02: Professions CRUD (1/1 plans) — completed 2026-05-24
- [x] Phase 03: Users CRUD (1/1 plans) — completed 2026-05-24
- [x] Phase 04: Rations Mgmt (1/1 plans) — completed 2026-05-24
- [x] Phase 05: Inventory Audit (1/1 plans) — completed 2026-05-24
- [x] Phase 06: Camp Detail (1/1 plans) — completed 2026-05-24
- [x] Phase 07: Exploration Detail (1/1 plans) — completed 2026-05-24
- [x] Phase 08: Person Detail + New (1/1 plans) — completed 2026-05-24
- [x] Phase 09: Person Flows (1/1 plans) — completed 2026-05-24
- [x] Phase 10: Resource Alerts (1/1 plans) — completed 2026-05-24

</details>

## Dev Rules

- `pnpm check` before each commit (lint + spell + build)
- Each phase = one commit minimum, more if large
- Keep current patterns: inline TanStack hooks, single TSX per feature, Zustand for client state only
- Use Nix env: `nix develop` then `pnpm` commands
- API proxy via `/api-remote` → Express → Railway (see `src/lib/api.ts`)
- All new routes go in `src/App.tsx`, nav items in `src/layouts/DashboardLayout.tsx`
- Types go in `src/types.ts` (current pattern), not per-feature type files
- Permission helpers in `src/lib/permissions.ts`

---

_See .planning/milestones/v1.0-legacy-parity-ROADMAP.md for full phase details_
