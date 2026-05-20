# MILESTONES.md — Gestión del Fin · Deliverables & Checklists

> Load this when planning work, reviewing progress, or preparing for a deliverable.

---

## GRADING OVERVIEW

| Milestone          | Date           | Weight | Min to pass                        |
| ------------------ | -------------- | ------ | ---------------------------------- |
| Base inicial       | April 27, 2026 | 20%    | —                                  |
| Aplicación base    | May 25, 2026   | 25%    | —                                  |
| Defensa            | June 1, 2026   | 40%    | 80% completion required to present |
| Presentación final | June 15, 2026  | 15%    | —                                  |

Defense note: if the project is below 80% completion at defensa, the presentación final is forfeited and the grade is locked at whatever was accumulated.

---

## MILESTONE 1 — BASE INICIAL · April 27

**What is evaluated:** Architecture, design mockups, data design, API connection working.

### Frontend checklist

**Project setup**

- [x] Vite + React 19 + TypeScript initialized
- [x] ESLint + Prettier + CSpell configured
- [x] TailwindCSS installed with extended config (colors, fonts, shadows)
- [ ] Google Fonts loaded: Press Start 2P, Share Tech Mono, VT323 → replaced by Inter + JetBrains Mono (brutalist theme)
- [x] CSS design tokens defined in `src/app/styles/globals.css`
- [x] Folder structure created: `app/`, `features/`, `shared/`
- [x] Path alias `@/` → `src/` configured in Vite and tsconfig

**Auth & routing**

- [x] `AppRoutes.tsx` with all route definitions (lazy-loaded)
- [x] `ProtectedRoute.tsx` — JWT guard + role redirect
- [x] `auth.store.ts` — Zustand store with persist middleware
- [x] `LoginPage.tsx` connected to real API (`POST /auth/login`)
- [x] JWT stored and sent in Axios interceptor
- [x] `camp.store.ts` — activeCamp field

**Layout & device chrome** _(retro-CRT design replaced by brutalist dark theme)_

- [ ] `DeviceFrame.tsx` → not applicable (brutalist design)
- [ ] `ScreenSurface.tsx` → not applicable (brutalist design)
- [x] Server time display integrated in `AppShell.tsx` header
- [ ] `SessionGuard.tsx` → session timeout inline in `auth-context.tsx`
- [ ] `useInactivity.ts` → inline in `auth-context.tsx`
- [x] `useServerTime.ts` — syncs from `/system/time` every 60s

**At least one page per module (GET + display data)**

- [x] `DashboardPage.tsx` — Recharts widgets (StockBarChart, DataChart, StatCard)
- [x] `PeopleListPage.tsx` — list survivors from API
- [x] `InventoryPage.tsx` — list resources from API
- [x] `ExplorationsPage.tsx` — list explorations from API
- [x] `TransfersPage.tsx` — list transfers from API

**Deployment**

- [x] Repository public on GitHub
- [ ] Deployed and accessible on Vercel
- [ ] Both links (GitHub + Vercel) shared with professors

---

## MILESTONE 2 — APLICACIÓN BASE · May 25

**What is evaluated:** Full feature functionality, security, refactoring.

### Frontend checklist

**People / survivor management**

- [x] `PeopleListPage` — filter by condition and role (client-side, server-side pending B7)
- [x] `PersonDetailPage` — full survivor profile
- [x] `PersonCreatePage` — survivor ingress form
- [ ] AI analysis flow: loading animation → result display → admin override → confirm (B15)
- [x] `StatusBadge` — visual indicator for all conditions
- [x] Condition update form (admin only)
- [ ] Automatic role suggestion from AI result shown to admin (B15)

**Inventory**

- [x] Full inventory table with all resource types
- [x] Resource entry form (resource_manager)
- [ ] Resource exit request form (worker)
- [x] `StockAlertBanner` component — shown when quantity < minThreshold
- [ ] Worker restricted view: only own assigned resources (`/resources/mine`)

**Explorations**

- [x] Schedule exploration form: team selection, days, buffer days
- [x] Exploration status update flow
- [ ] Return log form: resources found per type (B14 placeholder)
- [ ] Resources auto-added to inventory on return confirmation

**Transfers**

- [x] Request transfer form
- [x] Pending transfers list with approve/reject
- [ ] Transfer approval updates both camps' inventories
- [ ] Audit trail visible per transfer

**Dashboard (admin + resource_manager)**

- [x] `StockBarChart` — bar chart of inventory levels
- [ ] `SurvivorStats` — pie/radial chart by role
- [ ] `RationTracker` — area chart: food collected vs consumed over time
- [ ] `ThreatLevel` widget (gamification not implemented)
- [ ] Camp health score metric

**Security & session**

- [ ] `LockScreen` — full UI + password unlock (B22 task)
- [x] `RoleGate` applied to all conditional UI elements
- [x] All pages wrapped in `ProtectedRoute` with correct roles
- [x] Camp switch invalidates scoped queries correctly

**Code quality**

- [ ] No `any` types → `as Record<string, unknown>` in 15+ pages (B20)
- [x] All forms use react-hook-form + zod
- [x] All API calls in `features/[x]/api/` files only
- [x] Barrel exports working for all features
- [x] ESLint passes with 0 errors

---

## MILESTONE 3 — DEFENSA · June 1

**What is evaluated:** Complete system, stress testing with large data, E2E tests, integration.

### Frontend checklist

**Completeness**

- [ ] 100% of M2 checklist done
- [ ] All role-based views work correctly end-to-end
- [x] Multi-camp switching fully functional
- [ ] All animations present (crtOn on every page, stagger on lists, glitch on errors)

**Performance**

- [x] Pagination on people list and inventory
- [x] Lazy loading on routes (`React.lazy` + `Suspense`)
- [ ] No unnecessary re-renders (check with React DevTools)
- [ ] Recharts charts handle 100+ data points without performance issues

**Gamification**

- [ ] Threat Level indicator live in sidebar
- [ ] Days Survived counter in StatusBar
- [ ] Achievement toast system working
- [ ] Survivor proficiency badges on survivor cards

**Playwright E2E tests**

- [ ] Login flow (valid + invalid credentials)
- [ ] Session lock after inactivity
- [ ] Survivor ingress with AI evaluation
- [ ] Resource entry → inventory updates
- [ ] Role-based access: worker cannot access /people
- [ ] Camp switch resets state correctly

**Responsive**

- [ ] Device frame works on mobile viewport
- [ ] No horizontal overflow on any page
- [ ] All forms usable on touch screens

---

## MILESTONE 4 — PRESENTACIÓN FINAL · June 15

**What is evaluated:** Corrections from defensa, presentation to class + professors.

### Frontend checklist

- [ ] All feedback from defensa applied
- [x] Code cleanup — dead code removed, CSS cleaned, modules deduped
- [x] Documentation: README with setup instructions, architecture, stack
- [ ] Presentation slide deck prepared (scope, decisions, conclusions, recommendations)
- [ ] Live demo ready: pre-loaded test data, stable deploy on Vercel

---

## PROFESSORS & SUBMISSION

Deliverable per milestone: one `.txt` file on the Aula Virtual with two links:

1. GitHub repository (public, shared with professor accounts)
2. Vercel deployment URL

Share repository with:

- `rmoravargas@gmail.com`
- `daniel.granados.dev.566@gmail.com`
- `francisco.gamboa.abarca@una.cr`
