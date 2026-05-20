<!-- refreshed: 2026-05-19 -->

# Architecture

**Analysis Date:** 2026-05-19

## System Overview

```text
┌──────────────────────────────────────────────────────────────────────┐
│                         Browser (main.tsx)                           │
│                    StrictMode → App → #root                          │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     App.tsx (Provider Layer)                          │
│  QueryClientProvider → AuthProvider → AppRoutes → ToastContainer     │
│                    + ReactQueryDevtools                              │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
         /login          ProtectedRoute     /* → redirect
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                 AppShell (Layout Layer)                               │
│    Sidebar + Header + <Outlet />          `src/layouts/AppShell.tsx`  │
│    - Fixed left sidebar (collapsible w-64 / w-16)                    │
│    - Sticky top header with server clock + status dot                │
│    - Camp selector, user info, logout                                │
│    - Nav items filtered by role (`useNavItems`)                       │
└────────┬──────────────┬──────────┬──────────┬──────────┬─────────────┘
         │              │          │          │          │
         ▼              ▼          ▼          ▼          ▼
    DashboardPage   CampsPage  PeoplePage Inventory  Explorations...
   (lazy loaded)   (lazy)     (lazy)     (lazy)      (lazy)
         │              │          │          │          │
         ▼              ▼          ▼          ▼          ▼
┌──────────────────────────────────────────────────────────────────────┐
│                  Feature Modules (Business Domain)                    │
│   api/  hooks/  pages/  components/  store/  types/   index.ts      │
│         `src/features/{auth,camps,people,inventory,...}`              │
└──────────────────────────────────────────────────────────────────────┘
         │                             │
         ▼                             ▼
┌──────────────────┐     ┌──────────────────────────────────┐
│  Zustand Stores   │     │  TanStack Query (Server Cache)    │
│  Client state     │     │  queryClient                     │
│  - auth.store.ts  │     │  - staleTime: 30s                │
│  - camp.store.ts  │     │  - retry: 2 (queries)            │
│  - toast store    │     │  - refetchOnWindowFocus: true    │
└────────┬──────────┘     └──────────────┬───────────────────┘
         │                               │
         ▼                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   Axios Instance (HTTP Layer)                         │
│  `src/shared/api/axiosInstance.ts`                                    │
│  - baseURL: VITE_API_URL (proxy → http://localhost:3000/api)         │
│  - Request interceptor: Bearer token from authStore                  │
│  - Response interceptor: 401 → auto-logout + redirect                │
└──────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────┐
│               Backend API (NestJS / Express)                          │
│                    http://localhost:3000                              │
└──────────────────────────────────────────────────────────────────────┘
```

## Pattern Overview

**Overall:** Feature-based architecture (vertical slices by business domain)

**Key Characteristics:**

- Feature folders are self-contained: each owns its API calls, hooks, pages, types, and store
- Cross-cutting concerns live in `src/shared/` (Axios, guards, motion variants, queryClient, toast)
- Layout and routing are separated from features: `src/layouts/`, `src/routes/`
- State is strictly split: Zustand for client-only state, TanStack Query for all server data
- All feature pages are lazy-loaded via `React.lazy()` + `Suspense` at the route level
- Barrel exports (`index.ts`) are mandatory per feature — only public API is exported

## Layers

### App Layer (`src/app/`)

- Purpose: Global styles, CSS tokens, font imports
- Location: `src/app/styles/`
- Contains: `globals.css`, `tokens.css`, `fonts.css`, `scanlines.css`
- Depends on: Tailwind
- Used by: `main.tsx` imports `@/app/styles/globals.css`

### Routes Layer (`src/routes/`)

- Purpose: Route definitions, route protection, navigation binding
- Location: `src/routes/`
- Contains: `AppRoutes.tsx`, `ProtectedRoute.tsx`
- Depends on: react-router-dom, `@/features/auth`, `@/shared/lib/roleGuards`, `@/layouts/AppShell`
- Used by: `App.tsx` imports `<AppRoutes />`

### Layouts Layer (`src/layouts/`)

- Purpose: Application shell — sidebar, header, outlet
- Location: `src/layouts/AppShell.tsx`
- Contains: Collapsible sidebar with role-filtered nav, camp selector, user info, logout, server-time header, `<Outlet />`
- Depends on: `@/hooks/useNavItems`, `@/features/auth`, `@/features/camps`, `@/shared/lib/roleGuards`
- Used by: Route wrapper element in `AppRoutes.tsx`

### Features Layer (`src/features/`)

- Purpose: Business domain modules (vertical slices)
- Location: `src/features/{domain}/`
- Contains: `api/`, `hooks/`, `pages/`, `components/`, `store/`, `types/`, `index.ts`
- Depends on: `@/shared/api/axiosInstance`, `@tanstack/react-query`, `zustand`
- Used by: Routes load feature pages; features cross-reference each other's hooks and types

### Shared Layer (`src/shared/`)

- Purpose: Cross-cutting utilities, guards, API infrastructure
- Location: `src/shared/`
- Contains:
  - `api/` — Axios instance (`axiosInstance.ts`), shared types (`types.ts`), fallback API (`system.api.ts`)
  - `guards/` — `RoleGate.tsx` (conditional rendering guard)
  - `hooks/` — `useServerTime.ts` (syncs server time to camp store)
  - `lib/` — `queryClient.ts`, `roleGuards.ts`, `motion.ts`, `toast.tsx`, `form.ts`
  - `utils/` — `logger.ts`
- Depends on: `axios`, `zustand`, `framer-motion`, `@tanstack/react-query`
- Used by: All feature modules, routes, and layouts

### Components Layer (`src/components/`)

- Purpose: Reusable UI primitives and shared visual components
- Location: `src/components/`
- Contains:
  - `ui/` — shadcn/ui primitives (button, card, dialog, table, form, select, etc.) ~47 components
  - `cyber/` — Brutalist-themed shared components (Panel, GlitchButton, StatusBadge, ScreenLoader, StockBarChart, StatCard, DataChart, SkeletonTable, SkeletonCard, RingMeter, TerminalLine, FileInput, WaveBackground, CyberGrid)
  - `navigation/` — Legacy sidebar/navbar (Sidebar.tsx, Navbar.tsx, DockBar.tsx) — **superseded by AppShell**
- Depends on: `@/lib/utils` (cn helper), `framer-motion`, `recharts`, `lucide-react`
- Used by: Feature pages, layouts, app

### Pages Layer (`src/pages/`)

- Purpose: Top-level pages not grouped into a feature (currently Login and Dashboard)
- Location: `src/pages/`
- Contains: `LoginPage.tsx`, `DashboardPage.tsx`
- Depends on: `@/features/auth`, `@/features/camps`, `@/features/inventory`, `@/components/cyber`
- Used by: Routes

### Hooks Layer (`src/hooks/`)

- Purpose: Shared React hooks
- Location: `src/hooks/`
- Contains: `use-mobile.tsx`, `useNavItems.ts`
- Depends on: react-router-dom, lucide-react, `@/features/auth/types`
- Used by: AppShell, feature components

### Lib Layer (`src/lib/`)

- Purpose: Generic utilities with no React or framework dependency
- Location: `src/lib/`
- Contains: `utils.ts` (cn/classnames), `error-capture.ts` (global error listener + consumer), `error-page.ts` (fallback HTML)
- Depends on: `clsx`, `tailwind-merge`

## Data Flow

### Primary Request Path (Login → Data → UI)

1. **User submits login form** — `LoginPage.tsx` calls `authService.login()` (`src/features/auth/auth.service.ts:9`)
2. **Auth service orchestrates** — Calls `authApi.login()` (`src/features/auth/api/auth.api.ts:5`), extracts role/userId from JWT payload, stores in Zustand via `authStore.setSession()` (`src/features/auth/store/auth.store.ts:35`)
3. **AuthProvider tracks session** — `src/features/auth/auth-context.tsx:19-38` — monitors user activity, auto-locks on 20min inactivity
4. **ProtectedRoute checks access** — `src/routes/ProtectedRoute.tsx:7-29` — verifies auth + role-based path access via `canAccess()`
5. **AppShell loads camp data** — `src/layouts/AppShell.tsx:18` — uses `useCamps()` TanStack Query hook
6. **Page components fetch domain data** — Feature pages use domain hooks (e.g., `usePeople()`, `useInventory()`) → hooks call API functions → API functions use shared Axios instance
7. **Axios attaches auth** — Request interceptor in `src/shared/api/axiosInstance.ts:13-22` reads token from Zustand
8. **Axios handles 401** — Response interceptor (`src/shared/api/axiosInstance.ts:26-51`) — on 401: logout, redirect to `/login`, debounce with `isHandling401` flag

### Server Time Sync Flow

1. `useServerTime()` hook (`src/shared/hooks/useServerTime.ts:5`) periodically fetches `/system/time`
2. Stored in `campStore.syncServerTime()` (`src/features/camps/store/camp.store.ts:24`)
3. Any component calls `getServerNow()` (`src/shared/hooks/useServerTime.ts:24`) which extrapolates: `serverTime + (Date.now() - lastSyncLocal)`
4. Dashboard header displays computed server time, not local time

### Camp Switch Flow

1. User selects camp from dropdown in AppShell → `handleCampChange()` (`src/layouts/AppShell.tsx:27`)
2. Sets `activeCamp` in `campStore` + calls `queryClient.invalidateQueries()` to clear all server cache
3. Redirects to role-appropriate landing page via `ROLE_LANDING` map

### Session Expiry Flow

1. `AuthProvider` runs 10s interval (`src/features/auth/auth-context.tsx:27-33`)
2. Checks: `Date.now() - lastActivity >= SESSION_TIMEOUT_MS` (20 min)
3. On timeout: calls `lock()` + `logout()` → Zustand clears token → ProtectedRoute redirects to `/login`

## State Management

**Zustand (client state only):**

- `auth.store.ts` (`src/features/auth/store/auth.store.ts`) — user, token, role, userId, isLocked, lastActivity. Persisted to localStorage as `gdf.auth`. Partialized: user, token, role only.
- `camp.store.ts` (`src/features/camps/store/camp.store.ts`) — activeCamp, availableCamps, serverTime, lastSyncLocal. Not persisted (in-memory only).
- Toast store (`src/shared/lib/toast.tsx:22`) — toast queue. In-memory, no persistence.

**TanStack Query (server state):**

- `queryClient` (`src/shared/lib/queryClient.ts`) — global config: queries staleTime 30s, retry 2, refetchOnWindowFocus true; mutations retry 0.
- Query key conventions: `['camps']`, `['system-time']`, `['people', campId]`, `['person', campId, personId]`, `['resources']`, `['inventory', campId]`, `['inventory-audit', campId]`, `['explorations']`, `['admissions', campId]`, `['users']`, `['transfers']`
- On camp switch: `queryClient.clear()` → queryClient.invalidateQueries()

**State split (hard rule):**

- Zustand → client state only (auth, UI)
- TanStack Query → server state (all API data)
- Never store API response data in Zustand. Never fetch inside Zustand.

## Route Structure

| Path                | Component               | Feature               | Roles                                              | Lazy       |
| ------------------- | ----------------------- | --------------------- | -------------------------------------------------- | ---------- |
| `/`                 | Redirect → `/dashboard` | —                     | —                                                  | —          |
| `/login`            | `LoginPage`             | pages                 | Public                                             | No (eager) |
| `/dashboard`        | `DashboardPage`         | pages                 | system_admin, resource_manager                     | Yes        |
| `/camps`            | `CampsPage`             | features/camps        | system_admin                                       | Yes        |
| `/camps/:id`        | `CampDetailPage`        | features/camps        | system_admin                                       | Yes        |
| `/people`           | `PeopleListPage`        | features/people       | system_admin                                       | Yes        |
| `/people/new`       | `PersonCreatePage`      | features/people       | system_admin                                       | Yes        |
| `/people/:id`       | `PersonDetailPage`      | features/people       | system_admin                                       | Yes        |
| `/resources`        | `ResourcesPage`         | features/resources    | resource_manager                                   | Yes        |
| `/inventory`        | `InventoryPage`         | features/inventory    | resource_manager, worker                           | Yes        |
| `/inventory/audit`  | `InventoryAuditPage`    | features/inventory    | resource_manager                                   | Yes        |
| `/explorations`     | `ExplorationsPage`      | features/explorations | system_admin, travel_coordinator                   | Yes        |
| `/explorations/:id` | `ExplorationDetailPage` | features/explorations | system_admin, travel_coordinator                   | Yes        |
| `/admissions`       | `AdmissionsPage`        | features/admission    | system_admin                                       | Yes        |
| `/users`            | `UsersPage`             | features/users        | system_admin                                       | Yes        |
| `/professions`      | `ProfessionsPage`       | features/professions  | system_admin                                       | Yes        |
| `/transfers`        | `TransfersPage`         | features/transfers    | system_admin, resource_manager, travel_coordinator | Yes        |
| `/rations`          | `RationsPage`           | features/rations      | system_admin, resource_manager                     | Yes        |
| `*`                 | Redirect → `/dashboard` | —                     | —                                                  | —          |

## Route Protection & RBAC

### Route-Level Protection

`ProtectedRoute` (`src/routes/ProtectedRoute.tsx`) is a layout route wrapping all authenticated routes:

1. If `isInitializing` (Zustand rehydration incomplete) → show `ScreenLoader`
2. If `!isAuthenticated` (no token) → redirect to `/login` with `state.from` preserved
3. If authenticated but `canAccess(role, path)` returns false → redirect to role-appropriate landing page via `ROLE_LANDING`
4. If all checks pass → render `<Outlet />` (child routes)

### Role-Based Path Access

Defined in `src/shared/lib/roleGuards.ts`:

```typescript
export const ROLE_ACCESS: Record<string, Role[]> = {
  '/dashboard': ['system_admin', 'resource_manager'],
  '/camps': ['system_admin'],
  '/people': ['system_admin'],
  '/resources': ['resource_manager'],
  '/inventory': ['resource_manager', 'worker'],
  '/explorations': ['system_admin', 'travel_coordinator'],
  '/admissions': ['system_admin'],
  '/users': ['system_admin'],
  '/professions': ['system_admin'],
  '/transfers': ['system_admin', 'resource_manager', 'travel_coordinator'],
  '/rations': ['system_admin', 'resource_manager'],
};
```

Pattern routes with `:id` params are matched via compiled regexes (converts `:id` → `\d+`).

### Role Landing Pages

```typescript
export const ROLE_LANDING: Record<string, string> = {
  system_admin: '/dashboard',
  resource_manager: '/dashboard',
  worker: '/inventory',
  travel_coordinator: '/explorations',
};
```

### Component-Level RBAC

`RoleGate` (`src/shared/guards/RoleGate.tsx`) for conditional rendering within pages:

```typescript
<RoleGate allow={['system_admin', 'resource_manager']}>
  <ResourceChart />
</RoleGate>
```

### Roles

Defined in `src/features/auth/types/auth.types.ts`:

```typescript
export type Role = 'system_admin' | 'resource_manager' | 'worker' | 'travel_coordinator';
```

## Component Hierarchy

```
main.tsx
└── StrictMode
    └── App
        ├── ScreenLoader (while !ready, 600ms boot delay)
        └── QueryClientProvider
            ├── AuthProvider (session tracking, inactivity detection)
            │   └── BrowserRouter
            │       ├── NavigationBinder (binds navigate ref for Axios interceptor)
            │       └── Routes
            │           ├── Route "/login" → LoginPage
            │           ├── Route (ProtectedRoute wrapper)
            │           │   └── AppShell (layout outlet)
            │           │       ├── Sidebar (collapsible, role-filtered nav)
            │           │       │   ├── GF Logo (brand-primary square)
            │           │       │   ├── NavLink items (useNavItems filtered by role)
            │           │       │   ├── Camp selector (<select>)
            │           │       │   ├── User info + collapse toggle
            │           │       │   └── Logout button
            │           │       ├── Header (server clock, status dot)
            │           │       └── <Outlet /> → lazy page components
            │           │           └── Suspense fallback = ScreenLoader
            │           └── Route "*" → redirect to /dashboard
            └── ToastContainer (fixed top-right, AnimatePresence)
            └── ReactQueryDevtools
```

## Key Abstractions

**Feature Module:**

- Purpose: Self-contained business domain with all related code
- Pattern: `src/features/{domain}/` with subfolders `api/`, `hooks/`, `pages/`, `components/`, `store/`, `types/`, and barrel `index.ts`
- Each feature exports only public API through its index.ts
- Example structure: `src/features/camps/` → `api/camps.api.ts`, `hooks/useCamps.ts`, `pages/CampsPage.tsx`, `store/camp.store.ts`, `types/camp.types.ts`, `index.ts`

**API Module:**

- Purpose: Plain async functions wrapping Axios calls — never hooks, never state
- Pattern: Export a const object with methods (e.g., `campsApi.getAll()`, `campsApi.getById()`)
- Example: `src/features/camps/api/camps.api.ts` — exports `campsApi` with `getAll`, `getById`, `create`, `update`, `remove`

**Query Hook:**

- Purpose: TanStack Query wrapper — one hook per API function
- Pattern: `export function use{Entity}s()` wrapping `useQuery()` / `useMutation()`
- Uses `const KEY = ['entity'] as const` for query key constants
- Mutations invalidate the relevant query key on success
- Example: `src/features/camps/hooks/useCamps.ts` — `useCamps()`, `useCamp(id)`, `useCreateCamp()`, `useUpdateCamp()`, `useDeleteCamp()`

**Auth Service:**

- Purpose: Orchestrates login flow — calls API, decodes JWT, populates Zustand store
- Location: `src/features/auth/auth.service.ts`
- Exported as `authService` object with `login()` and `logout()` methods
- JWT role extraction: splits token, decodes base64 payload, validates role enum

**Auth Context:**

- Purpose: React Context providing `user`, `isAuthenticated`, `isInitializing`, `login`, `logout`
- Provider: `AuthProvider` (`src/features/auth/auth-context.tsx`) — manages inactivity timer, activity listeners
- Context: `AuthContext` created via `createContext` in `src/features/auth/auth-context-store.ts`
- Consumer: `useAuth()` hook in `src/features/auth/useAuth.ts`

**Axios Instance:**

- Purpose: Shared HTTP client with auth and error handling
- Location: `src/shared/api/axiosInstance.ts`
- Exports: `api` (configured Axios instance), `navigationRef` (mutable ref for programmatic navigation)
- Request interceptor: Attaches `Authorization: Bearer {token}` from authStore
- Response interceptor: Catches 401 → logout → redirect, guarded by `isHandling401` flag

**Toast System:**

- Purpose: In-app notification system (Zustand-based, no external dependency)
- Location: `src/shared/lib/toast.tsx`
- Usage: `toast('message', 'error'|'success'|'info')` — auto-dismiss 5s
- Renders via `ToastContainer` in App with framer-motion animations

## Entry Points

**HTML Entry:**

- Location: `index.html` (project root)
- Contains: `#root` mount point, `#splash` element (removed on mount)

**JS Entry:**

- Location: `src/main.tsx`
- Triggers: Browser loads `index.html`
- Responsibilities: Hides splash screen, renders `App` inside `StrictMode`
- Imports global styles: `@/app/styles/globals.css`

**React Entry:**

- Location: `src/App.tsx`
- Triggers: `main.tsx`
- Responsibilities: 600ms boot screen → providers → routes, toast container, devtools

## Error Handling

**Strategy:** Graceful degradation with auto-redirect

**Patterns:**

- Axios response interceptor (401): auto-logout + redirect to `/login`
- Axios timeout: 10_000ms default
- Global error capture: `src/lib/error-capture.ts` — listens to `error` and `unhandledrejection` events, exposes `consumeLastCapturedError()` with 5s TTL
- Fallback error page: `src/lib/error-page.ts` — renders static HTML for catastrophic failures
- Query errors: TanStack Query `retry: 2` on queries, `retry: 0` on mutations
- Lazy loading errors: Handled by React.lazy + Suspense — shows `ScreenLoader` while loading, React error boundary needed but **not yet implemented**

**No top-level ErrorBoundary detected.** React.lazy load failures may crash the app.

## Cross-Cutting Concerns

**Logging:** Custom logger at `src/shared/utils/logger.ts`

**Validation:** Zod schemas + react-hook-form resolvers via `src/shared/lib/form.ts` (`resolved()` helper wraps `zodResolver`)

**Authentication:** JWT-based. Token stored in Zustand (persisted to localStorage as `gdf.auth`). Axios interceptor attaches Bearer token. Role extracted from JWT payload.

**Animation:** Framer Motion 12 (via `motion/react`). Motion variants centralized in `src/shared/lib/motion.ts`: `fadeIn`, `crtOn`, `staggerContainer`, `staggerItem`, `glitch`, `scanlineSweep`, `cursorBlink`, `cardStaggerContainer`, `cardStaggerItem`, `listStaggerContainer`, `listStaggerItem`, `modalEnter`, `slideInRight`.

**CSS:** Tailwind 3 with custom brutalist tokens in `src/app/styles/tokens.css` (brand-primary, brand-secondary, brand-accent, surface-base/raised/overlay, tech colors). Custom utility classes: `.brutalist-border`, `.neon-glow-red`, `.glass`, `.glass-heavy`, `.font-mono-data`, `.font-mono-sm`.

## Architectural Constraints

- **Threading:** Single-threaded (browser JavaScript). No Web Workers used.
- **Global state:** Zustand stores accessible via `getState()` for non-React contexts (Axios interceptor, toast utility). `navigationRef` mutable ref for programmatic navigation from interceptor.
- **Circular imports:** Cross-feature imports use barrel `index.ts` files. Feature A imports from `@/features/B` index, not internal paths. No known circular dependency chains detected.
- **No any:** TypeScript strict mode. All DTOs, response types, and function signatures are explicitly typed. `as` casts used sparingly in data unpacking from TanStack Query results.
- **Named exports only:** No default exports anywhere in the codebase.

## Anti-Patterns

### Unprotected Wildcard Route inside ProtectedRoute

**What happens:** The `*` catch-all route is defined **outside** the `ProtectedRoute` wrapper. Users with invalid roles on existing paths are redirected to their role landing. If a non-existent path is accessed by an unauthenticated user, they get redirected to `/dashboard` (which redirects to `/login` through ProtectedRoute) — but this is an unnecessary double-hop.
**Why it's wrong:** The `*` route bypasses the role check since it's at the top-level Routes, not inside ProtectedRoute.
**Do this instead:** Move the `*` route inside the ProtectedRoute wrapper to ensure it also checks auth, or keep it outside but redirect to `/login` for consistency. Current behavior: `Navigate to="/dashboard" replace` which will bounce through ProtectedRoute anyway.

### Legacy Navigation Components

**What happens:** `src/components/navigation/Sidebar.tsx`, `Navbar.tsx`, and `DockBar.tsx` still exist in the codebase but are superseded by `AppShell`.
**Why it's wrong:** Dead code increases bundle size, creates confusion about which navigation to use, and may be exported/imported by accident.
**Do this instead:** Delete `src/components/navigation/` directory after verifying no imports remain, or add deprecation comments at minimum.

### No React Error Boundary

**What happens:** Lazy-loaded route components (17 routes using `React.lazy`) have no error boundary wrapper. If a chunk fails to load (e.g., network error, deployment version mismatch), the entire app crashes with a blank screen.
**Why it's wrong:** The app cannot gracefully recover from lazy-load failures. Users see a white screen instead of a fallback UI.
**Do this instead:** Wrap `<Suspense>` with an error boundary component that shows a retry button. Add `onError` handling in each `lazy()` call.

---

_Architecture analysis: 2026-05-19_
