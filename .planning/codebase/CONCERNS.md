# Codebase Concerns

**Analysis Date:** 2026-05-19

## Tech Debt

### Scaffolding Artifact Leak

- Issue: `temp/neon-nova-dashboard/` directory remains from project scaffolding. Contains ~2,100 lines of duplicate shadcn/ui components (`sidebar.tsx` 738 lines, `chart.tsx` 331 lines, `carousel.tsx` 240 lines) and a 436-line routes file.
- Files: `temp/neon-nova-dashboard/src/**`
- Impact: Build tooling may pick these up; confused devs may edit wrong files; search tools return duplicate results.
- Fix approach: Delete `temp/` directory — it is not imported by `src/` anywhere.

### Pervasive Type Casting Instead of Proper API Response Types

- Issue: Throughout page components, API responses are cast with `as Record<string, unknown>` chains instead of using typed DTO interfaces. Example from `DashboardPage.tsx`:
  ```typescript
  const campsData = (campsQuery.data as Record<string, unknown>)?.data as
    | Record<string, unknown>[]
    | undefined;
  ```
  This pattern appears in 15+ page files. The `PaginationQuery` and `LoginResponse` types exist in `src/shared/api/types.ts`, but domain-specific API response wrappers (pagination envelope, list-response wrapper) are not typed.
- Files: `src/pages/DashboardPage.tsx`, `src/features/people/pages/PeopleListPage.tsx`, `src/features/camps/pages/CampsPage.tsx`, `src/features/explorations/pages/ExplorationsPage.tsx`, `src/features/inventory/pages/InventoryPage.tsx`, `src/features/transfers/pages/TransfersPage.tsx`, `src/layouts/AppShell.tsx`, `src/features/admission/pages/AdmissionsPage.tsx`, `src/features/rations/pages/RationsPage.tsx`
- Impact: Zero type safety on API responses. Refactoring backend response shape silently breaks UI. Autocomplete doesn't work. Property access typos are not caught.
- Fix approach: Define `PaginatedResponse<T>` and `ApiResponse<T>` generic types in `src/shared/api/types.ts`. Propagate through all API modules, hooks, and pages. This is high-effort but foundational.

### Inconsistent Zod Resolver Usage

- Issue: Some forms use `zodResolver` directly (e.g., `LoginPage.tsx` line 32, `ExplorationsPage.tsx` line 142), others use a custom `resolved()` wrapper from `src/shared/lib/form.ts`. The wrapper just re-exports `zodResolver` with a type cast, adding indirection with no benefit.
- Files: `src/shared/lib/form.ts` (7 lines), `src/pages/LoginPage.tsx` (uses zodResolver), `src/features/explorations/pages/ExplorationsPage.tsx` (uses zodResolver), 10+ pages use `resolved()`.
- Impact: Confusion for new developers. Two patterns for the same thing.
- Fix approach: Pick one pattern (prefer `zodResolver` directly, matching AGENTS.md). Remove `src/shared/lib/form.ts`.

### Duplicate API Module Files

- Issue: `src/features/inventory/api/resources.api.ts` and `src/features/resources/api/resources.api.ts` both define `getAll` for resources — likely copy-paste duplicates with different feature paths.
- Files: `src/features/inventory/api/resources.api.ts`, `src/features/resources/api/resources.api.ts`
- Impact: Drift risk — updating one doesn't update the other. Unclear which module "owns" the resources API.
- Fix approach: Consolidate into a single `src/features/resources/api/resources.api.ts`. Inventory should import from resources feature, not duplicate.

## Known Bugs

### Session Lock Not Persisted Across Reload

- Symptoms: `isLocked` state resets to `false` on page refresh because `src/features/auth/store/auth.store.ts` line 59 partializes only `{ user, token, role }`. The lock interval (10s) in `auth-context.tsx` line 33 checks `lastActivity` — which is not persisted either, resetting to `Date.now()` on every reload.
- Files: `src/features/auth/store/auth.store.ts:58-63`, `src/features/auth/auth-context.tsx:28-32`
- Trigger: User is idle for 20 minutes, refreshes the page → session lock is bypassed because `lastActivity` resets.
- Workaround: None. Session timeout is effectively disabled for page refreshes.

### TransfersPage Sends Hardcoded `requested_by: 0`

- Symptoms: In `src/features/transfers/pages/TransfersPage.tsx` line 148, `requested_by: 0` is hardcoded. The page does have access to `useAuthStore` to get `userId`, but doesn't use it.
- Files: `src/features/transfers/pages/TransfersPage.tsx:148`
- Trigger: Creating any transfer.
- Workaround: None — all transfers created from this page will have invalid `requested_by`.

### `useAuth` Throws on Missing Provider with No Error Boundary

- Symptoms: If `useAuth()` is called outside `AuthProvider`, the hook throws `Error('useAuth must be used inside AuthProvider')` (line 8 of `useAuth.ts`). There is no React Error Boundary wrapping the app — this will crash the entire React tree with an unhandled error.
- Files: `src/features/auth/useAuth.ts:8`, `src/App.tsx` (no ErrorBoundary)
- Trigger: Any component calling `useAuth()` outside the provider tree.
- Workaround: None. Would show a white screen.

### Navigation Ref Race Condition

- Symptoms: `navigationRef` in `src/shared/api/axiosInstance.ts` is a global mutable ref. If multiple 401 responses arrive simultaneously, `isHandling401` gate (line 24) prevents double-logout, but the `setTimeout` reset (2000ms, line 46) creates a window where legitimate 401s from re-login attempts are silently ignored.
- Files: `src/shared/api/axiosInstance.ts:5,24-47`
- Impact: After auto-logout, if user quickly re-logs in and their token is invalid, the 401 handler won't fire again for 2 seconds.

## Security Considerations

### JWT Token in localStorage (XSS Risk)

- Risk: JWT token stored in `localStorage` via Zustand persist middleware (`gdf.auth` key). Any XSS vulnerability grants attacker full access token.
- Files: `src/features/auth/store/auth.store.ts:58-63`
- Current mitigation: No `dangerouslySetInnerHTML` usage in app code (shadcn chart.tsx uses it for SVG, low risk). No eval or innerHTML patterns detected.
- Recommendations: Consider httpOnly cookie approach for token storage. At minimum, add Content-Security-Policy headers.

### Session Timeout Uses Client-Side Clock

- Risk: The lock check at `src/features/auth/auth-context.tsx:28` uses `Date.now()` for elapsed time calculation. User can bypass timeout by changing system clock backward.
- Files: `src/features/auth/auth-context.tsx:27-32`
- Recommendations: Validate session on server side (check token expiry). Use server time (`getServerNow()` from `useServerTime.ts`) instead of `Date.now()`.

### Role Guards Are Client-Only

- Risk: `canAccess()` in `src/shared/lib/roleGuards.ts` and `RoleGate` component in `src/shared/guards/RoleGate.tsx` are purely client-side. API endpoints may still respond to unauthorized requests if backend doesn't enforce same roles. Frontend can be bypassed via browser devtools.
- Files: `src/shared/lib/roleGuards.ts`, `src/shared/guards/RoleGate.tsx`, `src/routes/ProtectedRoute.tsx`
- Current mitigation: Backend should independently enforce role-checking on every endpoint. Frontend guards are UX, not security.
- Recommendations: Document backend role enforcement. Add interceptor-level 403 handling in `axiosInstance.ts`.

### Environment File Present in Repo

- Risk: `.env` file exists (184 bytes). While Vite env vars with `VITE_` prefix are bundled into client-side code intentionally, non-`VITE_` vars could leak.
- Files: `.env` (present), `.env.example` (present)
- Recommendations: Verify `.env` only contains `VITE_*` vars. Ensure `.env` is in `.gitignore` (or add `.env` to gitattributes if it should be committed as example).

### Zero Input Sanitization for User-Generated Content

- Risk: No sanitization library (DOMPurify, etc.) imported. Text inputs (names, notes, skills_summary) are rendered directly in JSX. React's built-in escaping protects against HTML injection in text content, but if any component renders user input as `dangerouslySetInnerHTML`, XSS is possible.
- Files: `src/components/ui/chart.tsx:89` (shadcn default — uses `dangerouslySetInnerHTML` for SVG tooltip labels)
- Current mitigation: React's JSX escaping covers most cases.
- Recommendations: Add `dompurify` if any user content is ever rendered as HTML. Audit chart tooltip if it can render user-provided data.

## Performance Bottlenecks

### Explorations Load All Without Pagination

- Problem: `src/features/explorations/api/explorations.api.ts` line 47: `getAll: () => api.get('/expeditions').then((res) => res.data.data)` — no pagination params. As data grows, this fetches all records.
- Files: `src/features/explorations/api/explorations.api.ts:47`
- Cause: API not designed with pagination; frontend doesn't request it.
- Improvement path: Add `PaginationQuery` param to `getAll()`. Add server-side pagination support.

### Camp Switch Invalidates All Queries

- Problem: `src/layouts/AppShell.tsx` line 35 calls `queryClient.invalidateQueries()` with no filter key — this invalidates EVERY cached query in the app, causing full refetch waterfall.
- Files: `src/layouts/AppShell.tsx:35`
- Cause: Overly broad invalidation to ensure data consistency.
- Improvement path: Invalidate only camp-scoped query keys: `queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] !== 'professions' })` or similar whitelist.

### Client-Side Filtering on People List

- Problem: `src/features/people/pages/PeopleListPage.tsx` fetches 20 rows per page via API pagination, but then applies client-side `searchTerm`, `statusFilter`, and `professionFilter`. If the matching row is on page 3, the user sees 0 results on page 1 even though data exists.
- Files: `src/features/people/pages/PeopleListPage.tsx:61-72`
- Cause: Server API likely doesn't support these filter params, so frontend does it locally.
- Improvement path: Push filter params to API (add `search`, `status`, `profession_id` to `PaginationQuery`).

### Large Page Components

- Problem: `ExplorationsPage.tsx` (830 lines), `TransfersPage.tsx` (741 lines), `PersonDetailPage.tsx` (740 lines) — each is a "god component" mixing data fetching, form logic, dialog state, and UI rendering.
- Files: `src/features/explorations/pages/ExplorationsPage.tsx`, `src/features/transfers/pages/TransfersPage.tsx`, `src/features/people/pages/PersonDetailPage.tsx`
- Cause: No extraction of sub-components or custom hooks for complex dialogs.
- Improvement path: Extract dialog contents into separate components. Move form logic into custom hooks. This also enables code splitting for dialog content.

### No Image Optimization

- Problem: `src/components/cyber/FileInput.tsx` converts uploaded images to base64 data URLs. No compression, resizing, or lazy loading. Large images bloat form submissions.
- Files: `src/components/cyber/FileInput.tsx:25-29`
- Improvement path: Add canvas-based resize before encoding. Consider uploading to cloud storage instead of base64-encoding in form payload.

## Fragile Areas

### No React Error Boundaries

- Files: Not found anywhere in `src/`
- Why fragile: Any unhandled error in a React component crashes the entire tree (white screen). There is `src/lib/error-capture.ts` (global `error`/`unhandledrejection` listener) but `consumeLastCapturedError()` is never called. `src/lib/error-page.ts` renders a static HTML page — also never invoked from React.
- Safe modification: Wrap each lazy-loaded route in `<ErrorBoundary fallback={ErrorPanel} />`.
- Test coverage: Not testable without tests.

### Pervasive `Record<string, unknown>` Casts

- Files: 20+ page component files
- Why fragile: Changing a single backend field name (e.g., `full_name` → `name`) silently breaks multiple pages with no compile error. Runtime behavior degrades to `undefined` rendering instead of type errors.
- Safe modification: Define proper response types. Use TypeScript `satisfies` or explicit interfaces. Treat current casts as temporary until types are added.
- Test coverage: None.

### Zustand Store for Server Time Violates Architecture Rule

- Files: `src/features/camps/store/camp.store.ts:6-7` (stores `serverTime: number`)
- Why fragile: AGENTS.md hard rule states "Never store API data in Zustand." `serverTime` is fetched from `/system/time` endpoint and stored in Zustand. `useServerTime.ts` hooks into Zustand store. TanStack Query is already available for this.
- Fix: Use TanStack Query for server time with `staleTime: 60_000`. Remove `serverTime`/`lastSyncLocal`/`syncServerTime` from Zustand store.

### Overlapping API Module Domains

- Files: `src/features/resources/api/resources.api.ts` vs `src/features/inventory/api/resources.api.ts`
- Why fragile: Two modules define the same API calls. Changes must be duplicated or will diverge.
- Fix: Delete `src/features/inventory/api/resources.api.ts`. Inventory hooks should import from `@/features/resources/api/resources.api`.

## Scaling Limits

### People List Pagination

- Current capacity: 20 rows per page, client-side filtered
- Limit: Camp with 500+ people — client-side search becomes slow; pagination renders wrong pages after filter
- Scaling path: Push filters/search to API. Increase `PaginationQuery` params.

### All Explorations Fetched at Once

- Current capacity: No limit on `GET /expeditions`
- Limit: Camp with 200+ explorations — payload too large, render time degrades
- Scaling path: Add pagination and filtering to explorations API and frontend.

### Camp Selector in AppShell

- Current capacity: All camps loaded via `useCamps()` in sidebar
- Limit: 50+ camps — sidebar selector becomes unscrollable/unusable
- Scaling path: Add virtualized scrolling or searchable select to camp dropdown.

## Dependencies at Risk

### Zod v4 (Breaking Changes)

- Risk: Package is at `"zod": "^4.3.6"`. Zod v4 changed API surface significantly from v3. `@hookform/resolvers` v5 supports it, but community examples and LLM training data are mostly Zod v3.
- Impact: `z.object({}).refine()` pattern may have subtle differences. Debugging validation behavior requires Zod v4-specific docs.
- Migration plan: Verify all `.refine()`, `.superRefine()`, and error formatting works as expected. Consider pinning to exact version.

### React Router v7 (New API)

- Risk: `"react-router-dom": "^7.13.2"` — v7 introduced breaking route config changes from v6. Code currently uses v6-style `<BrowserRouter>`, `<Routes>`, `<Route>` JSX API, which React Router v7 still supports in "compat mode."
- Impact: Future v7.x updates may deprecate compat API. Migration to `createBrowserRouter` data-router pattern required.
- Migration plan: Plan migration to `createBrowserRouter` with loaders for TanStack Query prefetching (better UX with suspense).

## Missing Critical Features

### RF-04 / RF-05: AI-Powered Admission Evaluation

- Problem: AGENTS.md requirements specify "people management with AI" and "AI explainability" (RNF). The only "AI" implementation is a `ai_context_prompt` text field in camp create/edit forms (`src/features/camps/pages/CampsPage.tsx:360-367`). No actual LLM integration, no AI evaluation of admissions, no explainability UI.
- Blocks: AI-driven admission scoring, AI-assisted person profiling, explainability dashboard.
- Files: `src/features/camps/pages/CampsPage.tsx:360-367`, `src/features/camps/pages/CampDetailPage.tsx:159-166`
- Priority: High — core differentiator requirement, currently completely absent.

### RF-07: Exploration Provisioning / Resource Allocation

- Problem: `ExplorationsPage.tsx` lines 577-583 show placeholder text: "Resource allocation pending inventory integration" and "Found resources can be recorded when return flow is connected." The `CreateExplorationDto` supports `allocated_resources` but the UI never populates it. Return flow dialog exists (lines 610-754) but resource selection dropdown comes from a generic `resourcesArray` that may not be camp-scoped.
- Blocks: Complete exploration workflow. Provisioning supplies before departure.
- Priority: High — makes exploration feature incomplete.

### RNF: Playwright E2E Tests

- Problem: Zero test files found anywhere in repo (`*.spec.ts`, `*.test.ts`, `*.e2e.*`, `playwright*`). No Playwright config, no test runner.
- Blocks: Quality assurance, regression detection, CI validation.
- Priority: High — listed as non-functional requirement, completely absent.

### RNF: AI Explainability UI

- Problem: No UI exists to show AI decision rationale. The `ai_context_prompt` field accepts input but there's no output display for AI evaluation results.
- Blocks: User trust in AI evaluations, requirement acceptance.
- Priority: Medium — depends on RF-04/RF-05 AI integration being built first.

### RNF: Gamification

- Problem: No gamification elements (achievements, scoring, badges, leaderboards, streak tracking) exist. Search for "gamif", "achievement", "badge", "score", "leaderboard" returned zero results except shadcn/ui Badge component styling.
- Blocks: User engagement, requirement acceptance.
- Priority: Low-Medium — can be incrementally added after core features stabilize.

### RF-03: Role-Specific Dashboard Metrics

- Problem: Dashboard (`src/pages/DashboardPage.tsx`) shows basic counts (camps, resources, auto-supply). Worker role gets only "INVENTORY" and "RATIONS" navigation cards — no actual dashboard metrics for workers (e.g., pending tasks, stock they manage, recent rations). `travel_coordinator` role gets only "EXPEDITIONS" card with no metrics.
- Blocks: Complete dashboard experience for non-admin roles.
- Priority: Medium — basic navigation works but doesn't meet "role-specific views" requirement.

### No Responsive Mobile Layout

- Problem: AppShell sidebar is fixed but not responsive — no drawer/mobile menu pattern for small screens. Main content uses responsive padding (`p-4 md:p-6 lg:p-8`) but sidebar always takes 64-256px. `use-mobile.tsx` hook exists (detects mobile viewport) but isn't used in AppShell.
- Files: `src/layouts/AppShell.tsx`, `src/hooks/use-mobile.tsx`
- Priority: Medium — reduces usability on mobile/tablet.

## Test Coverage Gaps

### Entire Codebase Has Zero Tests

- What's not tested: Authentication flow, RBAC guards, form validation, API integration, TanStack Query hooks, Zustand stores, component rendering, error states, loading states, empty states.
- Files: Every file in `src/`
- Risk: Every change is deployed untested. Regression detection is manual. Refactoring large pages (830-line ExplorationsPage) is dangerous.
- Priority: High — start with critical path: auth flow, camp CRUD, inventory CRUD.

---

_Concerns audit: 2026-05-19_
