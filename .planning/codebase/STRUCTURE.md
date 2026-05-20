# Codebase Structure

**Analysis Date:** 2026-05-19

## Directory Layout

```
gestion-del-fin-frontend/
├── .planning/codebase/    # Generated codebase maps (this file)
├── .agents/skills/        # Local agent skill definitions
├── docs/                  # Project documentation
│   ├── API_CONTRACT.md    # Backend API contract & implementation rules
│   ├── BACKEND_SCHEMAS.md # Database/entity schemas
│   ├── DESIGN_SYSTEM.md   # Visual design tokens & components
│   ├── ENDPOINT_IMPLEMENTATION_WORKFLOW.md
│   ├── MILESTONES.md      # Project milestones
│   ├── ROLES_ACCESS.md    # RBAC specification
│   └── TOOLING.md         # Dev tools & setup
├── public/                # Static assets (served as-is)
├── src/
│   ├── app/               # Global styles, CSS tokens, fonts
│   │   └── styles/
│   │       ├── globals.css    # Tailwind directives + custom utilities
│   │       ├── tokens.css     # CSS custom properties (colors, typography)
│   │       ├── fonts.css      # @font-face declarations (Inter, JetBrains Mono)
│   │       └── scanlines.css  # CRT scanline overlay effect
│   │
│   ├── components/        # Reusable UI components
│   │   ├── ui/            # shadcn/ui primitives (~47 components)
│   │   ├── cyber/         # Brutalist-themed shared components (~15 files)
│   │   └── navigation/    # ⚠️ Legacy sidebar/navbar (superseded by AppShell)
│   │
│   ├── features/          # Business domain modules (vertical slices)
│   │   ├── admission/     # AI-assisted person admission
│   │   ├── auth/          # Authentication, session, role
│   │   ├── camps/         # Camp management + camp selector store
│   │   ├── explorations/  # Expedition management
│   │   ├── inventory/     # Warehouse inventory + resources API
│   │   ├── people/        # Person management + professions API
│   │   ├── professions/   # Profession definitions
│   │   ├── rations/       # Rations page (minimal)
│   │   ├── resources/     # Resource type definitions
│   │   ├── system/        # Server time query
│   │   ├── transfers/     # Inter-camp transfers
│   │   └── users/         # System user management
│   │
│   ├── hooks/             # Shared React hooks (~2 files)
│   ├── layouts/           # AppShell layout (sidebar + header + outlet)
│   ├── lib/               # Framework-agnostic utilities
│   ├── pages/             # Top-level page components (Login, Dashboard)
│   ├── routes/            # Router config + ProtectedRoute
│   └── shared/            # Cross-cutting infrastructure
│       ├── api/           # Axios instance, shared types, fallback APIs
│       ├── guards/        # RoleGate component
│       ├── hooks/         # Shared hooks (useServerTime sync)
│       ├── lib/           # Shared libraries (toast, queryClient, motion, roleGuards, form)
│       └── utils/         # Logger utility
│
├── AGENTS.md              # Agent instructions (project context)
├── requerimientos-frontend.md  # 10 functional + 7 non-functional requirements
├── package.json           # Dependencies & scripts
├── pnpm-lock.yaml         # Lockfile (pnpm)
├── vite.config.ts         # Vite configuration + API proxy
├── tsconfig.json          # TypeScript config (references)
├── tsconfig.app.json      # App-specific TS config (strict mode)
├── tsconfig.node.json     # Node-specific TS config
├── tailwind.config.js     # Tailwind theme extensions
├── postcss.config.js      # PostCSS plugins
├── eslint.config.js       # ESLint flat config
├── .prettierrc            # Prettier config
├── cspell.json            # CSpell (spell checker)
├── .env.example           # Environment variable template
└── index.html             # HTML entry point
```

## Directory Purposes

**`src/app/styles/`:**

- Purpose: Global stylesheet layer — Tailwind directives, CSS custom properties (color tokens, font stacks), `@font-face` rules, theme utility classes, CRT scanline overlay
- Contains: `.css` files only
- Key files: `globals.css` (Tailwind `@tailwind` directives + `.glass`, `.brutalist-border`, `.font-mono-data` utility classes), `tokens.css` (CSS variables for brand colors, text, backgrounds, status colors)

**`src/components/ui/`:**

- Purpose: shadcn/ui component library primitives — generated via `npx shadcn@latest add`
- Contains: `.tsx` files, one per component, each self-contained
- Key files: `button.tsx`, `card.tsx`, `dialog.tsx`, `table.tsx`, `form.tsx`, `select.tsx`, `dropdown-menu.tsx`, `sheet.tsx`, `sidebar.tsx`, `pagination.tsx`
- Convention: All use Radix UI primitives + Tailwind styling + `cn()` utility

**`src/components/cyber/`:**

- Purpose: Brutalist-themed visual components shared across the application
- Contains: Panel, GlitchButton, StatusBadge, ScreenLoader, StockBarChart, StatCard, DataChart, SkeletonTable, SkeletonCard, RingMeter, TerminalLine, FileInput, WaveBackground, CyberGrid
- Key files: `Panel.tsx` (card wrapper with corner brackets), `GlitchButton.tsx` (variant-based button: primary/ghost/warning/danger), `StatusBadge.tsx` (colored dot + label), `ScreenLoader.tsx` (brutalist loading spinner)
- Pattern: Each component exports a single named React component, uses `framer-motion` for animations, applies `.glass` / `.brutalist-border` utility classes

**`src/components/navigation/`:**

- Purpose: ⚠️ **Legacy** — Sidebar, Navbar, DockBar were initial navigation components before AppShell was created
- Contains: `Sidebar.tsx`, `Navbar.tsx`, `DockBar.tsx`
- Usage: **None detected** — all navigation now uses `AppShell` (`src/layouts/AppShell.tsx`)
- Generated: No
- Committed: Yes (⚠️ should be deleted to avoid confusion)

**`src/features/{domain}/`:**

- Purpose: Self-contained business domain module following vertical slice architecture
- Contains: `api/`, `hooks/`, `pages/`, `components/`, `store/`, `types/`, `index.ts`
- Key files: `index.ts` (barrel export), `api/` files, `hooks/` files
- Convention: Only `index.ts` imports are allowed from other features; internal files may import from sibling directories within the same feature

**`src/shared/`:**

- Purpose: Cross-cutting concerns — infrastructure used by all features
- Contains: Axios instance, guards, hooks, shared lib utilities, API types
- Key files: `api/axiosInstance.ts`, `lib/roleGuards.ts`, `lib/queryClient.ts`, `lib/toast.tsx`, `lib/motion.ts`, `guards/RoleGate.tsx`

**`src/layouts/`:**

- Purpose: Application shell layout (sidebar + header + content area)
- Contains: `AppShell.tsx` only
- Used by: Route wrapper in `AppRoutes.tsx`

**`src/routes/`:**

- Purpose: Router configuration, route protection, navigation binding
- Contains: `AppRoutes.tsx` (all route definitions with lazy loading), `ProtectedRoute.tsx` (auth + role guard)

**`src/pages/`:**

- Purpose: Top-level pages not belonging to a single feature domain
- Contains: `LoginPage.tsx`, `DashboardPage.tsx`
- Note: All other pages live in feature folders under `features/{domain}/pages/`

**`src/lib/`:**

- Purpose: Framework-agnostic utility functions (no React dependency)
- Contains: `utils.ts` (cn helper), `error-capture.ts`, `error-page.ts`
- Key files: `utils.ts` — `cn()` combining `clsx` + `tailwind-merge`

**`.planning/codebase/`:**

- Purpose: Generated codebase analysis documents consumed by GSD planning commands
- Contains: Architecture maps, structure descriptions, conventions, concerns
- Generated: Yes (by `/gsd-map-codebase`)
- Committed: Yes

## Feature Directory Map

### `src/features/auth/` — Authentication & Session

```
auth/
├── api/auth.api.ts          # POST /auth/login
├── auth.service.ts          # Login orchestrator (API + JWT decode + Zustand)
├── auth-context.tsx         # AuthProvider (session tracking, inactivity)
├── auth-context-store.ts    # React.createContext definition
├── useAuth.ts               # useAuth() consumer hook
├── store/auth.store.ts      # Zustand (persisted: user, token, role)
├── types/auth.types.ts      # Role type, AuthUser interface
└── index.ts                 # Barrel: authApi, authService, AuthProvider, useAuth, useAuthStore, types
```

**Status:** ✅ Fully implemented (login, logout, session timeout, token persistence, role extraction from JWT)

### `src/features/camps/` — Camp Management

```
camps/
├── api/camps.api.ts         # CRUD /camps endpoints + DTOs
├── hooks/useCamps.ts        # useCamps, useCamp, useCreateCamp, useUpdateCamp, useDeleteCamp
├── pages/CampsPage.tsx      # Camp list + create form
├── pages/CampDetailPage.tsx # Camp detail + edit form
├── store/camp.store.ts      # Zustand (activeCamp, serverTime)
├── types/camp.types.ts      # Camp interface
└── index.ts                 # Barrel: campsApi, useCampStore, types
```

**Status:** ✅ Fully implemented (CRUD, store, pages)

### `src/features/people/` — Person Management

```
people/
├── api/people.api.ts        # People CRUD, status logs, profession reassignments, contribution overrides
├── api/professions.api.ts   # Professions CRUD (co-located with people)
├── hooks/usePeople.ts       # TanStack Query hooks for people
├── hooks/useProfessions.ts  # TanStack Query hooks for professions
├── pages/PeopleListPage.tsx # Person list
├── pages/PersonDetailPage.tsx # Person detail with status/work tracking
├── pages/PersonCreatePage.tsx # New person form
└── index.ts                 # Barrel: peopleApi, professionsApi, DTOs
```

**Status:** ✅ Fully implemented (CRUD, status logs, reassignments, overrides, pages). Missing: image upload UI (photo_url/id_card_url DTOs exist but file input in form may be minimal), AI integration for admission decisions (RF-04)

### `src/features/inventory/` — Warehouse & Inventory

```
inventory/
├── api/inventory.api.ts     # GET /inventory/:campId, GET /inventory/audit/:campId, POST /inventory/adjustment
├── api/resources.api.ts     # Resources CRUD (co-located)
├── hooks/useInventory.ts    # useInventory, useInventoryAudit, useCreateAdjustment
├── hooks/useResources.ts    # useResources (for stock list)
├── hooks/useStockAlerts.ts  # Stock alert computation
├── components/StockAlertBanner.tsx # Visual alert when stock below minimum
├── pages/InventoryPage.tsx  # Inventory snapshot view
├── pages/InventoryAuditPage.tsx # Audit trail view
├── pages/ResourcesPage.tsx  # Resource type management
└── index.ts                 # Barrel: inventoryApi, DTOs
```

**Status:** ✅ Largely implemented. Missing: automated daily processing of food/water intake per worker (RF-06), consumption processing, contribution override UI integration

### `src/features/explorations/` — Expedition Management

```
explorations/
├── api/explorations.api.ts  # CRUD + status updates for /expeditions
├── hooks/useExplorations.ts # TanStack Query hooks
├── pages/ExplorationsPage.tsx    # Expedition list + create form
├── pages/ExplorationDetailPage.tsx # Expedition detail + status management
└── index.ts                 # Barrel: explorationsApi, DTOs
```

**Status:** ✅ Fully implemented. Coverage: RF-07 (schedule, view, rations consumption implied, return provisions form)

### `src/features/transfers/` — Inter-Camp Transfers

```
transfers/
├── api/transfers.api.ts     # Transfers CRUD + workflow (schedule, approve-source, approve-target, complete, reject)
├── hooks/useTransfers.ts    # TanStack Query hooks
├── pages/TransfersPage.tsx  # Transfer list + create + workflow
├── types/transfer.types.ts  # Transfer, TransferItemEntity interfaces
└── index.ts                 # Barrel: transfersApi, DTOs
```

**Status:** ✅ Fully implemented. Coverage: RF-09 (send requests, view received/sent, approve/reject flow, double approval, audit trail)

### `src/features/admission/` — AI-Assisted Admission

```
admission/
├── api/admission.api.ts     # POST /admission/camps/:campId, GET, GET/:id, PATCH review
├── hooks/useAdmissions.ts   # TanStack Query hooks
├── pages/AdmissionsPage.tsx # Admission list + create + review
└── index.ts                 # Barrel: admissionApi, DTOs
```

**Status:** ⚠️ Partially implemented. CRUD + review flow exists. **Missing:** AI explainability UI (RF-04 — show AI decision criteria transparently), AI-generated report display, correction flow for user to override AI decision, auto-assignment of ID/profession by AI

### `src/features/resources/` — Resource Type Definitions

```
resources/
├── api/resources.api.ts     # Resources CRUD
├── hooks/useResources.ts    # TanStack Query hooks
├── pages/ResourcesPage.tsx  # Resource type list + create
├── types/resource.types.ts  # Resource interface
└── index.ts                 # Barrel: resourcesApi, DTOs
```

**Status:** ✅ Fully implemented

### `src/features/users/` — System User Management

```
users/
├── api/users.api.ts         # Users CRUD
├── hooks/useUsers.ts        # TanStack Query hooks
├── pages/UsersPage.tsx      # User list + create
└── index.ts                 # Barrel: usersApi, DTOs
```

**Status:** ✅ Fully implemented

### `src/features/professions/` — Profession Definitions

```
professions/
├── api/professions.api.ts   # Professions CRUD
├── hooks/useProfessions.ts  # TanStack Query hooks
├── pages/ProfessionsPage.tsx # Profession list + create
├── types/profession.types.ts # Profession interface
└── index.ts                 # Barrel: professionsApi, DTOs
```

**Status:** ✅ Fully implemented

### `src/features/system/` — System Utilities

```
system/
├── api/system.api.ts        # GET /system/time
├── hooks/useServerTime.ts   # TanStack Query wrapper (refetch every 60s)
└── index.ts                 # Barrel: systemApi, useServerTime
```

**Status:** ✅ Fully implemented. Coverage: RF-10 (server time consistency)

### `src/features/rations/` — Rations Management

```
rations/
└── pages/RationsPage.tsx    # Single page (no api/hooks subfolder)
```

**Status:** ⚠️ Minimally implemented — only one page, missing API layer, no hooks. Likely uses resources/inventory APIs. Missing: daily consumption processing per person (RF-06), food/water intake per worker display

## Naming Conventions

**Files:**

- kebab-case: `use-server-time.ts`, `auth-context.tsx`, `error-capture.ts`
- PascalCase for components: `AppRoutes.tsx`, `ProtectedRoute.tsx`, `LoginPage.tsx`, `GlitchButton.tsx`
- camelCase for utilities/hooks: `useAuth.ts`, `useNavItems.ts`, `useCamps.ts`
- Feature API files: `{domain}.api.ts` (e.g., `camps.api.ts`, `people.api.ts`)
- Type files: `{domain}.types.ts` (e.g., `camp.types.ts`, `auth.types.ts`)
- Store files: `{domain}.store.ts` (e.g., `auth.store.ts`, `camp.store.ts`)

**Directories:**

- kebab-case for feature names: `camps`, `people`, `inventory`, `explorations`
- Plural for collection domains: `people`, `camps`, `explorations`

**Exports:**

- Named exports only — no default exports anywhere
- Components: `export function ComponentName()`
- API modules: `export const domainApi = { ... }`
- Types: `export interface XxxDto {}`, `export type Xxx =`
- Stores: `export const useXxxStore = create<State>()(...)`

**Interfaces/Types:**

- DTOs: `Create{Entity}Dto`, `Update{Entity}Dto`, `{Entity}Response`
- Status enums: `{Entity}Status` type union (e.g., `PersonStatus`, `ExpeditionStatus`, `TransferStatus`)
- Feature domain types: PascalCase entity name (e.g., `Camp`, `Resource`, `Transfer`)

**Barrel Exports:**

- Every feature has `index.ts` exporting only its public API
- Re-exports API functions, hooks, types, and DTOs
- Internal modules (pages, internal hooks) are NOT exported from index — only what other features need

## Where to Add New Code

**New Feature (e.g., "Reports"):**

- Primary code: `src/features/reports/` — create folder with `api/`, `hooks/`, `pages/`, `types/`, `index.ts`
- Tests: (co-located pattern) — `src/features/reports/__tests__/` or `*.test.ts` next to source files
- Routes: Add route in `src/routes/AppRoutes.tsx`
- Nav: Add item to `NAV_ITEMS` array in `src/hooks/useNavItems.ts`
- RBAC: Add path-to-role mapping in `src/shared/lib/roleGuards.ts`

**New Component (shared/cyber):**

- Implementation: `src/components/cyber/NewComponent.tsx`
- If UI primitive: `src/components/ui/` (shadcn convention)

**New Utility:**

- React-related: `src/shared/lib/` or `src/shared/hooks/`
- Framework-agnostic: `src/lib/`

**New API Integration:**

- API function: `src/features/{domain}/api/{domain}.api.ts`
- Query hooks: `src/features/{domain}/hooks/use{Domain}.ts`
- Types/DTOs: In the API file itself (DTOs are co-located with the API functions that use them)

**New Zustand Store:**

- Client-only state: `src/features/{domain}/store/{domain}.store.ts`
- Follow pattern: `import { create } from 'zustand'`
- Export hook: `export const useXxxStore = create<State>()(…)`

**Configuration:**

- Env vars: `.env.example` (template only) — never commit `.env` files
- Tailwind: `tailwind.config.js` for theme extensions
- TypeScript: `tsconfig.app.json` for app-level settings

## Key File Locations

**Entry Points:**

- `src/main.tsx`: JavaScript entry, mounts React root
- `src/App.tsx`: React entry, providers + routes
- `index.html`: HTML entry, #root mount + splash element

**Configuration:**

- `vite.config.ts`: Vite config (API proxy `/api` → `http://localhost:3000`)
- `tailwind.config.js`: Theme colors, font stacks, animations
- `tsconfig.app.json`: Strict TypeScript, path aliases (`@/` → `src/`)
- `eslint.config.js`: ESLint flat config
- `.prettierrc`: Prettier formatting rules
- `cspell.json`: Spell check dictionary

**Core Logic:**

- `src/shared/api/axiosInstance.ts`: HTTP client with auth interceptors
- `src/features/auth/store/auth.store.ts`: Session persistence
- `src/shared/lib/roleGuards.ts`: Route-level RBAC
- `src/shared/lib/queryClient.ts`: Server state cache config
- `src/features/auth/auth.service.ts`: Login orchestrator

**State Stores:**

- `src/features/auth/store/auth.store.ts`: Auth session (persisted)
- `src/features/camps/store/camp.store.ts`: Active camp + server time (in-memory)
- `src/shared/lib/toast.tsx`: Toast notifications (in-memory)

**Testing:**

- No test files detected in `src/` — testing infrastructure not yet set up
- `package.json` should be checked for test runner config

## Requirements Coverage Summary

| Requirement                 | Status         | Feature Location                                                       |
| --------------------------- | -------------- | ---------------------------------------------------------------------- |
| RF-01 Auth & Session        | ✅ Implemented | `src/features/auth/`                                                   |
| RF-02 Roles & Permissions   | ✅ Implemented | `src/shared/lib/roleGuards.ts`, `RouteGate`                            |
| RF-03 Dashboard             | ✅ Implemented | `src/pages/DashboardPage.tsx`                                          |
| RF-04 People Ingres (AI)    | ⚠️ Partial     | `src/features/admission/` — missing AI explainability UI               |
| RF-05 People Status & Work  | ✅ Implemented | `src/features/people/`                                                 |
| RF-06 Warehouse & Resources | ⚠️ Partial     | `src/features/inventory/` — missing automated daily processing display |
| RF-07 Explorations          | ✅ Implemented | `src/features/explorations/`                                           |
| RF-08 Multi-Camp            | ✅ Implemented | Camp selector in `AppShell`, separate data per camp                    |
| RF-09 Inter-Camp Requests   | ✅ Implemented | `src/features/transfers/`                                              |
| RF-10 Server Time           | ✅ Implemented | `src/shared/hooks/useServerTime.ts`, `src/features/system/`            |
| RNF-01 Tech Stack           | ✅ Compliant   | React 19, TS strict, Vite, feature-based structure                     |
| RNF-02 Code Quality         | ✅ Compliant   | ESLint, Prettier, CSpell, TS strict                                    |
| RNF-03 UX/Animations        | ⚠️ Partial     | Brutalist dark theme ✅, animations ✅, gamification not yet visible   |
| RNF-04 Performance          | ⚠️ Partial     | Lazy loading ✅, pagination partial, responsive ✅                     |
| RNF-05 E2E Tests            | ❌ Missing     | No Playwright tests detected                                           |
| RNF-06 Deploy               | ⚠️ Partial     | GitHub ✅, Vercel status unknown                                       |
| RNF-07 AI Explainability    | ❌ Missing     | AI admission has review endpoint, but no explainability UI             |

## Special Directories

**`node_modules/`:**

- Purpose: Installed dependencies (pnpm)
- Generated: Yes (by `pnpm install`)
- Committed: No

**`dist/`:**

- Purpose: Vite build output
- Generated: Yes (by `pnpm build`)
- Committed: No

**`temp/`:**

- Purpose: Temporary/scratch files
- Generated: Possibly manual
- Committed: Yes (but probably should not be)

**`.planning/`:**

- Purpose: GSD planning artifacts (codebase maps, phase plans)
- Generated: Yes (by GSD commands)
- Committed: Yes

---

_Structure analysis: 2026-05-19_
