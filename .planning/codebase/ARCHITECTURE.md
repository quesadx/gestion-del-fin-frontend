<!-- refreshed: 2026-05-24 -->
# Architecture

**Analysis Date:** 2026-05-24

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                           │
│  React 19 SPA: `src/` (Vite + React Router 7 + Tailwind CSS 4)     │
├──────────────┬──────────────┬──────────────┬───────────────────────┤
│  AuthLayout  │ DashboardLayout            │  Feature Pages          │
│  `layouts/`  │ `layouts/DashboardLayout`  │  `features/*/`         │
└──────┬───────┴──────────────┴──────────────┴───────────┬───────────┘
       │                                                  │
       ▼                                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        State Layer                                  │
│  Zustand (client state): `src/store/`                               │
│  TanStack React Query (server state cache): throughout features     │
│  Zustand persist middleware: auth + camp in localStorage            │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Data Access Layer                            │
│  `src/lib/api.ts` — Axios instance with interceptors               │
│  Dual-mode: remote (Railway) / local (Express)                      │
│  Token injection via request interceptor                            │
│  401 auto-redirect via response interceptor                         │
└───────────────┬───────────────────┬─────────────────────────────────┘
                │                   │
                ▼                   ▼
┌───────────────────────────┐ ┌───────────────────────────────────────┐
│  Local Express Backend    │ │  Remote Railway Production API         │
│  `server.ts` (491 lines)  │ │  `https://gestion-del-fin-api-        │
│  In-memory mock DB        │ │   production.up.railway.app/api`      │
│  All REST endpoints       │ │                                       │
│  Vite middleware (dev)    │ │                                       │
│  Static serving (prod)   │ │                                       │
└───────────────────────────┘ └───────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `App` | Root component: providers, routing, inactivity tracking, auth guard | `src/App.tsx` |
| `main` | React DOM entry point, StrictMode wrapper | `src/main.tsx` |
| `AuthLayout` | Login page shell (dark grid layout) | `src/layouts/AuthLayout.tsx` |
| `DashboardLayout` | Authenticated shell: header, nav dock, camp switcher, API mode toggle | `src/layouts/DashboardLayout.tsx` |
| `LoginPage` | Auth form with Zod validation, session-expiry awareness | `src/features/auth/LoginPage.tsx` |
| `DashboardOverview` | KPI cards, resource bar chart (recharts), projection indicators | `src/features/dashboard/DashboardOverview.tsx` |
| `PopulationRoster` | Survivor table: filter, edit, transfer, delete with modal forms | `src/features/people/PopulationRoster.tsx` |
| `InventoryList` | Resource cards grid, audit trail modal, manual adjustment modal | `src/features/inventory/InventoryList.tsx` |
| `AdmissionList` | Split-panel: intake list + detail view with AI analysis, approve/reject | `src/features/admission/AdmissionList.tsx` |
| `ExpeditionList` | Mission list with status transitions, create/edit modals | `src/features/explorations/ExpeditionList.tsx` |
| `CampManagement` | Multi-camp CRUD grid with AI context prompt editor | `src/features/camps/CampManagement.tsx` |
| `useAuthStore` | Auth state (user, token) with persist | `src/store/index.ts` |
| `useCampStore` | Current camp selection with persist | `src/store/index.ts` |
| `apiClient` | Axios instance with interceptors, dual-mode switching | `src/lib/api.ts` |
| `Skeleton` | Loading placeholder components | `src/components/Skeleton.tsx` |
| `server.ts` | Monolith Express backend, in-memory mock database, all REST endpoints | `server.ts` |

## Pattern Overview

**Overall:** Feature-based SPA with co-located backend mock

**Key Characteristics:**
- Single-repo full-stack: React frontend + Express backend in one project
- Feature modules under `src/features/` — each feature is a self-contained page component
- Dual API mode: local Express mock (dev) or remote Railway production API (prod)
- Client state (Zustand) separated from server state (TanStack React Query)
- Modal-heavy UI: create/edit operations use overlay modals rather than separate routes
- Brutalist/industrial design language with dark theme throughout

## Layers

**Presentation Layer:**
- Purpose: Renders UI, manages browser routing, handles user interaction
- Location: `src/features/*/`, `src/layouts/`, `src/components/`
- Contains: React components (page-level features, layout shells, shared UI)
- Depends on: State layer (Zustand + TanStack Query), Data access layer (apiClient)
- Used by: Entry point (`src/main.tsx` → `src/App.tsx`)

**State Layer:**
- Purpose: Manages client-side state and server cache
- Location: `src/store/` (Zustand), implicit in TanStack Query hooks throughout features
- Contains: `useAuthStore` (auth state persisted), `useCampStore` (camp selection persisted), React Query caches
- Depends on: Data access layer (for query/mutation functions)
- Used by: Presentation layer

**Data Access Layer:**
- Purpose: Standardized HTTP communication, auth token injection, error handling
- Location: `src/lib/api.ts`
- Contains: Axios instance `apiClient`, mode switching (`setApiMode`, `getApiMode`), request/response interceptors
- Depends on: External API or local Express backend
- Used by: State layer via TanStack Query

**Backend/Server Layer:**
- Purpose: REST API with mock database for local development; Vite dev middleware integration
- Location: `server.ts` (root)
- Contains: Express app, in-memory arrays (survivors, camps, resources, inventory, inventoryLogs, admissions, expeditions), all REST endpoint handlers
- Depends on: Vite (dev mode), Express static serving (prod mode)
- Used by: Data access layer (when `api_mode === 'local'`)

**Type Layer:**
- Purpose: Shared TypeScript interfaces and enums
- Location: `src/types.ts`
- Contains: `User`, `UserRole`, `Camp`, `Resource`, `InventorySnapshot`, `Person`, `Admission`, `Expedition`
- Depends on: Nothing
- Used by: All other layers

## Data Flow

### Primary Request Path (Dashboard Metrics Load)

1. User selects camp → `useCampStore.setCurrentCamp()` triggers state change (`src/store/index.ts:38`)
2. `DashboardOverview` renders, TanStack Query fires `useQuery` with `currentCampId` in query key (`src/features/dashboard/DashboardOverview.tsx:13-21`)
3. Query function calls `apiClient.get('/metrics/dashboard?campId=X')` (`src/features/dashboard/DashboardOverview.tsx:16`)
4. Request interceptor injects `Bearer` token from localStorage (`src/lib/api.ts:26-32`)
5. Request reaches Express backend (local) or Railway API (remote) → JSON response
6. React Query caches response, component re-renders with data

### Auth Flow

1. User submits login form → `react-hook-form` validates via Zod schema (`src/features/auth/LoginPage.tsx:11-14,36-49`)
2. `apiClient.post('/auth/login', data)` called
3. Backend returns `{ user, token }` (`server.ts:49-58` — mock JWT with role inference)
4. `useAuthStore.setAuth(user, token)` stores in Zustand + localStorage (`src/store/index.ts:17-19`)
5. User navigated to `/dashboard`
6. `ProtectedRoute` checks `useAuthStore().user` — redirects to `/login` if null (`src/App.tsx:28-33`)

### Inactivity Auto-Logout

1. `App` component mounts `useEffect` with mousemove/keydown listeners (`src/App.tsx:39-58`)
2. On each event, 20-minute timeout reset via `setTimeout`
3. When timeout fires: `logout()` + `localStorage.setItem('session_expired', 'true')`
4. `LoginPage` detects `session_expired` flag on mount and shows warning banner (`src/features/auth/LoginPage.tsx:23-30,62-74`)

### Manual Inventory Adjustment

1. User clicks "MANUAL ADJUST" in `InventoryList` → modal opens (`src/features/inventory/InventoryList.tsx:88-93`)
2. Form collects resource, type (IN/OUT), quantity, description (`src/features/inventory/InventoryList.tsx:20-23,322-395`)
3. `adjustMutation` fires `apiClient.post('/inventory/adjustment', payload)` (`src/features/inventory/InventoryList.tsx:43-56`)
4. Backend updates in-memory inventory + creates audit log entry (`server.ts:175-210`)
5. `onSuccess`: invalidates `['inventory']`, `['dashboard-metrics']`, `['resource-metrics']` query caches

**State Management:**
- **Client state** (Zustand): auth user/token, selected camp — persisted to localStorage via `zustand/middleware/persist`
- **Server state** (TanStack React Query): all API data — cached with `staleTime` defaults, manual invalidation after mutations
- State flows: Zustand for what the user "is" and "is looking at"; React Query for what the server "has"

## Key Abstractions

**`apiClient` (Axios instance):**
- Purpose: Single HTTP client with auth token injection and 401 handling
- Examples: Used by every feature file via `import { apiClient } from '../../lib/api'`
- Pattern: Module-level singleton with interceptors; not dependency-injected

**`ProtectedRoute` (auth guard):**
- Purpose: Wraps routes that require authentication and optional role checks
- Examples: Used in `src/App.tsx:28-33` and throughout route definitions
- Pattern: Render-prop component checking `useAuthStore().user`; redirects to `/login` if unauthenticated

**Zustand stores (`useAuthStore`, `useCampStore`):**
- Purpose: Persistent client state for auth session and active camp context
- Examples: `src/store/index.ts` — both stores use `persist` middleware with localStorage
- Pattern: Single-file barrel export, hook-based access, no providers needed

**Feature modules (page components):**
- Purpose: Each directory under `src/features/` is a self-contained page with local state, mutations, and UI
- Examples: `src/features/people/PopulationRoster.tsx` (476 lines), `src/features/admission/AdmissionList.tsx` (483 lines)
- Pattern: One file per page, imports shared types/stores/api, manages its own modal/form state with `useState`

## Entry Points

**Browser/SPA Entry:**
- Location: `index.html` → `<script type="module" src="/src/main.tsx"></script>`
- Triggers: Browser loads page
- Responsibilities: Mounts React app into `#root` div

**React Entry:**
- Location: `src/main.tsx`
- Triggers: Vite module loader after `index.html` parse
- Responsibilities: Renders `<App />` inside `StrictMode`

**Server Entry:**
- Location: `server.ts` (invoked via `npm run dev` → `tsx server.ts`)
- Triggers: `npm run dev` (development) or `npm start` → `node dist/server.cjs` (production)
- Responsibilities: Starts Express on port 3000, serves API + Vite middleware (dev) or static files (prod)

**Routes:**
| Path | Component | Auth Required | Layout |
|------|-----------|---------------|--------|
| `/login` | `LoginPage` | No | `AuthLayout` |
| `/` | Redirect → `/dashboard` | Yes | `DashboardLayout` |
| `/dashboard` | `DashboardOverview` | Yes | `DashboardLayout` |
| `/population` | `PopulationRoster` | Yes | `DashboardLayout` |
| `/inventory` | `InventoryList` | Yes | `DashboardLayout` |
| `/admission` | `AdmissionList` | Yes | `DashboardLayout` |
| `/expeditions` | `ExpeditionList` | Yes | `DashboardLayout` |
| `/camps` | `CampManagement` | Yes | `DashboardLayout` |
| `*` | Redirect → `/` | — | — |

## Architectural Constraints

- **Threading:** Single-threaded Node.js event loop; no worker threads; Vite dev server runs in same process as Express via middleware mode
- **Global state:** Two Zustand stores with persist middleware (`src/store/index.ts`) — `useAuthStore` (auth) and `useCampStore` (camp selection). Axios singleton `apiClient` as module-level global. `session_expired` flag in localStorage.
- **Circular imports:** Not detected — all imports flow downward from features → store/lib → types
- **Database:** No persistent database — all data lives in in-memory arrays in `server.ts`; lost on restart. Remote Railway API has real persistence.
- **Auth:** Mock JWT, no actual token validation; role inferred from username string match; no password validation
- **CSS:** Tailwind CSS v4 with `@import "tailwindcss"` and `@theme` directive (no `tailwind.config.js`); custom brutalist design tokens defined in `src/index.css`
- **Path alias:** `@/*` → `./*` configured in both `tsconfig.json:18-22` and `vite.config.ts:14-16`; not actively used in current source

## Anti-Patterns

### Giant Feature Files

**What happens:** Feature page components are single monolithic files with all state, mutations, modals, and UI in one file. `PopulationRoster.tsx` is 476 lines, `AdmissionList.tsx` is 483 lines, `ExpeditionList.tsx` is 469 lines.
**Why it's wrong:** Hard to test individual pieces, difficult to reuse form logic, mixing concerns (data fetching + presentation + modal state).
**Do this instead:** Extract modal forms into separate components (e.g., `TransferModal.tsx`, `EditPersonForm.tsx`), extract custom hooks for complex mutation logic.

### Client State Duplication

**What happens:** `src/types.ts` defines `Person.status` as `'HEALTHY' | 'WOUNDED' | 'SICK' | 'MISSING' | 'DECEASED' | 'INJURED' | 'AWAY' | 'DEAD'` but the backend `server.ts` uses a different set (`'HEALTHY'` only in mock data). Feature components manually normalize status values with switch/if-else chains (e.g., `PopulationRoster.tsx:60-67,247-273`).
**Why it's wrong:** Type definitions drift from reality; normalization logic duplicated across components.
**Do this instead:** Define canonical status enum in `types.ts`, use a single normalization utility in `lib/utils.ts`, enforce consistent status values in mock backend.

### Direct localStorage Access Mixed with Zustand

**What happens:** `apiClient` reads `localStorage.getItem('api_mode')` and `localStorage.getItem('token')` directly (`src/lib/api.ts:5,27`), while auth state is also managed by Zustand persist middleware. `App.tsx` writes `session_expired` directly to localStorage (`src/App.tsx:45`).
**Why it's wrong:** Multiple sources of truth for localStorage keys, making it unclear what's managed by Zustand vs ad-hoc reads/writes.
**Do this instead:** Centralize all localStorage access through Zustand stores with persist middleware; use store methods for token and mode access.

## Error Handling

**Strategy:** Fire-and-forget with UI feedback. No global error boundary.

**Patterns:**
- Mutations catch errors in `.catch()` or rely on React Query's `onError` (not consistently set)
- `apiClient` response interceptor auto-redirects to `/login` on 401 (`src/lib/api.ts:34-42`)
- Login page catches errors and sets `error` state for display (`src/features/auth/LoginPage.tsx:44-46`)
- Individual feature components display inline error states via `mutation.isError` (implicit via disabled state)
- No toast notification system, no error boundary component

## Cross-Cutting Concerns

**Logging:** Console-based only; `server.ts` logs startup message (`server.ts:487`); no structured logging
**Validation:** Zod schema on login form (`src/features/auth/LoginPage.tsx:11-14`); HTML5 `required` attributes on most form inputs; `min`/`type="number"` constraints; no consistent Zod schemas for create/edit forms
**Authentication:** Mock JWT token in localStorage; no refresh mechanism; 20-minute inactivity auto-logout; role-based route guard (`ProtectedRoute roles` prop in `src/App.tsx:28-33` — defined but not enforced on all routes); role inferred from username string prefix match in backend (`server.ts:51-53`)

---

*Architecture analysis: 2026-05-24*
