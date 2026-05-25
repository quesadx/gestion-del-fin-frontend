# Codebase Structure

**Analysis Date:** 2026-05-24

## Directory Layout

```
frontend-remake/                       # Project root
├── server.ts                          # Express backend with in-memory mock database (491 lines)
├── vite.config.ts                     # Vite configuration: React + TailwindCSS plugins, @ alias
├── tsconfig.json                      # TypeScript config: ESNext modules, JSX react-jsx, @/* paths
├── index.html                         # SPA HTML shell; loads /src/main.tsx
├── package.json                       # Dependencies and scripts
├── metadata.json                      # App metadata for Google AI Studio
├── .env.example                       # Environment variable template (GEMINI_API_KEY, APP_URL)
├── .gitignore                         # Ignores node_modules, dist, .env*, build artifacts
├── README.md                          # Setup instructions for AI Studio app
├── ARCH_ANALYSIS.md                   # Pre-existing architecture analysis (design notes)
├── .planning/                         # GSD planning artifacts
│   └── codebase/                      # Codebase analysis documents (this file's destination)
│       └── ARCHITECTURE.md
└── src/                               # Frontend source code
    ├── main.tsx                       # React entry point; mounts <App/> into #root
    ├── App.tsx                        # Root component: QueryClientProvider, BrowserRouter, routes, ProtectedRoute guard, inactivity timer
    ├── types.ts                       # Shared TypeScript types: User, Camp, Resource, Person, Admission, Expedition, enums
    ├── index.css                      # TailwindCSS v4 import, @theme custom design tokens, base layer styles
    ├── components/                    # Shared/reusable UI components
    │   └── Skeleton.tsx               # Loading placeholder components (Skeleton, SkeletonCard, SkeletonList, SkeletonTable)
    ├── features/                      # Feature modules — one directory per domain page
    │   ├── auth/                      # Authentication feature
    │   │   └── LoginPage.tsx          # Login form with Zod validation, session-expiry banner, role hints
    │   ├── dashboard/                 # Dashboard feature
    │   │   └── DashboardOverview.tsx  # KPI stats cards, resource bar chart (recharts), projection indicators
    │   ├── people/                    # Population management feature
    │   │   └── PopulationRoster.tsx   # Survivor table: search/filter, edit modal, transfer modal, delete
    │   ├── inventory/                 # Inventory management feature
    │   │   └── InventoryList.tsx      # Resource cards grid, audit trail modal, manual adjustment modal
    │   ├── admission/                 # Admission/intake feature
    │   │   └── AdmissionList.tsx      # Split-panel: pending list + detail view, AI analysis, approve/reject, create intake modal
    │   ├── explorations/              # Expedition planning feature
    │   │   └── ExpeditionList.tsx     # Mission list with status state machine, create/edit modals
    │   └── camps/                     # Camp management feature
    │       └── CampManagement.tsx     # Multi-camp CRUD grid, create/edit modal with AI context prompt
    ├── layouts/                       # Layout shell components
    │   ├── AuthLayout.tsx             # Unauthenticated layout: dark centered grid, <Outlet/>
    │   └── DashboardLayout.tsx        # Authenticated layout: top header, bottom nav dock, camp switcher, API mode toggle, <Outlet/>
    ├── lib/                           # Shared libraries and utilities
    │   ├── api.ts                     # Axios instance (apiClient), interceptors, API mode switching (local/remote)
    │   └── utils.ts                   # Utility functions: cn() (clsx+tailwind-merge), formatDate(), formatQuantity()
    └── store/                         # Client-side state management (Zustand)
        └── index.ts                   # useAuthStore (auth state + persist), useCampStore (camp selection + persist)
```

## Directory Purposes

**`src/` (root):**
- Purpose: Frontend source code entry; contains `main.tsx`, `App.tsx`, `types.ts`, `index.css`
- Contains: React app bootstrap, routing, global styles, shared type definitions
- Key files: `main.tsx` (DOM mount), `App.tsx` (routing + providers), `types.ts` (all TypeScript interfaces), `index.css` (TailwindCSS theme tokens)

**`src/components/`:**
- Purpose: Shared, reusable UI components used across multiple features
- Contains: Currently only `Skeleton.tsx` — four loading placeholder variants
- Key files: `Skeleton.tsx` — exports `Skeleton`, `SkeletonCard`, `SkeletonList`, `SkeletonTable`

**`src/features/`:**
- Purpose: Feature modules — each directory is a self-contained page/domain
- Contains: One directory per feature, one page component per directory (no sub-components extracted)
- Key files: See feature list below — each feature is a single large TSX file (280–483 lines)

**`src/layouts/`:**
- Purpose: Layout shells that wrap feature pages via React Router `<Outlet/>`
- Contains: `AuthLayout.tsx` (login page wrapper), `DashboardLayout.tsx` (authenticated app shell)
- Key files: `DashboardLayout.tsx` (157 lines) — handles header, nav dock, camp switcher UI, API mode toggle, logout

**`src/lib/`:**
- Purpose: Shared infrastructure code — HTTP client and utility functions
- Contains: `api.ts` (Axios setup with interceptors), `utils.ts` (cn, formatDate, formatQuantity)
- Key files: `api.ts` (43 lines) — `apiClient` singleton, `setApiMode`/`getApiMode` for local/remote switching

**`src/store/`:**
- Purpose: Global client state managed by Zustand
- Contains: `index.ts` — barrel exporting `useAuthStore` and `useCampStore`
- Key files: `index.ts` (43 lines) — both stores use `persist` middleware with localStorage

**`features/auth/`:**
- Purpose: Authentication — login form and session management UI
- Contains: `LoginPage.tsx` (149 lines) — Zod-validated form, error/session-expiry banners, role hints
- Key files: `LoginPage.tsx`

**`features/dashboard/`:**
- Purpose: Main operational dashboard with KPIs and resource projections
- Contains: `DashboardOverview.tsx` (201 lines) — stat cards, recharts bar chart, resource detail cards
- Key files: `DashboardOverview.tsx`

**`features/people/`:**
- Purpose: Survivor/population roster management
- Contains: `PopulationRoster.tsx` (476 lines) — filterable/searchable table, edit modal, transfer modal, delete with confirmation
- Key files: `PopulationRoster.tsx`

**`features/inventory/`:**
- Purpose: Resource stock management and audit trail
- Contains: `InventoryList.tsx` (420 lines) — resource cards with status/projection, audit trail modal, manual adjustment modal
- Key files: `InventoryList.tsx`

**`features/admission/`:**
- Purpose: Refugee intake screening with AI analysis
- Contains: `AdmissionList.tsx` (483 lines) — split-panel (list + detail), AI reasoning display, approve/reject with role assignment, create intake modal
- Key files: `AdmissionList.tsx`

**`features/explorations/`:**
- Purpose: Scouting/expedition planning and tracking
- Contains: `ExpeditionList.tsx` (469 lines) — mission list with status state machine (PLANNING→ACTIVE→RETURNED/LOST), create/edit modals
- Key files: `ExpeditionList.tsx`

**`features/camps/`:**
- Purpose: Multi-camp refuge management
- Contains: `CampManagement.tsx` (281 lines) — camp CRUD grid, create/edit modal with AI context prompt editor
- Key files: `CampManagement.tsx`

## Key File Locations

**Entry Points:**
- `index.html`: Browser HTML entry — loads `/src/main.tsx` as ES module
- `src/main.tsx`: React entry — creates root, renders `<App/>` in StrictMode
- `server.ts`: Backend entry — Express server on port 3000 with Vite middleware (dev) or static serving (prod)

**Configuration:**
- `vite.config.ts`: Vite plugins (React, TailwindCSS), path alias `@` → `./`, HMR config
- `tsconfig.json`: TypeScript compiler options, path alias `@/*` → `./*`, target ES2022
- `package.json`: Scripts (`dev`, `build`, `start`, `lint`), all dependencies
- `.env.example`: Environment variable template — `GEMINI_API_KEY`, `APP_URL` (never read `.env` contents)
- `metadata.json`: AI Studio app metadata

**Core Logic:**
- `src/App.tsx`: Routing tree, auth guard (`ProtectedRoute`), inactivity timer, QueryClient instantiation
- `src/types.ts`: All shared TypeScript types and enums (`UserRole`, `User`, `Camp`, `Resource`, `InventorySnapshot`, `Person`, `Admission`, `Expedition`)
- `src/lib/api.ts`: Axios HTTP client, token injection interceptor, 401 redirect interceptor, dual-mode switching
- `src/store/index.ts`: Zustand stores with localStorage persistence

**Shared Utilities:**
- `src/lib/utils.ts`: `cn()` (clsx + tailwind-merge), `formatDate()`, `formatQuantity()`
- `src/components/Skeleton.tsx`: Four skeleton loading components

**Testing:**
- No test files detected in the codebase
- No test runner configuration (no jest.config, vitest.config, etc.)

## Naming Conventions

**Files:**
- PascalCase for components: `LoginPage.tsx`, `DashboardLayout.tsx`, `Skeleton.tsx`, `App.tsx`
- camelCase for non-component modules: `api.ts`, `utils.ts`, `types.ts`, `main.tsx`
- Lowercase with hyphens for config: `vite.config.ts`, `tailwind.config` (not used — v4), `package.json`, `index.html`
- Feature directories: lowercase, one word per domain: `auth/`, `dashboard/`, `people/`, `inventory/`, `admission/`, `explorations/`, `camps/`

**Directories:**
- `features/` — one subdirectory per domain, each containing a single page component
- `layouts/` — layout shell components
- `components/` — shared UI primitives
- `lib/` — infrastructure and utilities
- `store/` — state management stores

**Components:**
- Default exports for page and layout components: `export default function LoginPage()`
- Named exports for utility components: `export function Skeleton()`, `export function SkeletonCard()`
- Named exports for hooks (Zustand): `export const useAuthStore`, `export const useCampStore`

**Types:**
- PascalCase interfaces: `User`, `Camp`, `Resource`, `Person`, `Admission`, `Expedition`
- PascalCase enums: `UserRole` (UPPER_SNAKE_CASE values: `SYSTEM_ADMIN`, `RESOURCE_MANAGER`)

## Where to Add New Code

**New Feature (e.g., messaging, events):**
- Primary code: `src/features/{feature-name}/{FeaturePage}.tsx`
- Route: Add to `src/App.tsx` routes inside `DashboardLayout` with `ProtectedRoute` wrapper
- Types: Add interfaces to `src/types.ts`
- API client: Use existing `apiClient` from `src/lib/api.ts` — add endpoints as needed to `server.ts`

**New Component/Module:**
- Shared UI component: `src/components/{ComponentName}.tsx`
- Layout variant: `src/layouts/{LayoutName}.tsx`
- Utility function: `src/lib/utils.ts` (if small) or `src/lib/{new-module}.ts` (if substantial)
- State store: `src/store/{store-name}.ts` and export from `src/store/index.ts`

**New API Endpoint (local dev):**
- Add route handler to `server.ts` following existing patterns (e.g., `app.get('/api/...')`)
- Use in-memory arrays as data store
- Mirror the Railway production API contract

**Adding a New Route:**
- Import page component in `src/App.tsx`
- Add `<Route>` inside the `DashboardLayout` `<Route>` wrapper
- Wrap in `<ProtectedRoute>` if authentication required
- Add nav item in `src/layouts/DashboardLayout.tsx` `navItems` array (lines 36-43)

**Adding a Zustand Store:**
- Create `src/store/{name}.ts`
- Use `create<T>()(persist(...))` pattern matching existing stores
- Re-export from `src/store/index.ts`

**Adding Type Definitions:**
- Add interface/enum to `src/types.ts`
- Keep all types in this single file (current convention is single-file types)

## Special Directories

**`.planning/`:**
- Purpose: GSD planning artifacts and codebase analysis documents
- Generated: Yes (by GSD commands)
- Committed: Yes (tracked in git)

**`dist/`:**
- Purpose: Production build output (Vite bundle + esbuild server bundle)
- Generated: Yes (by `npm run build`)
- Committed: No (in `.gitignore`)

**`node_modules/`:**
- Purpose: Installed npm dependencies
- Generated: Yes (by `npm install`)
- Committed: No (in `.gitignore`)

---

*Structure analysis: 2026-05-24*
