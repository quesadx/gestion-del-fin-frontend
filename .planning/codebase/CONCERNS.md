# Codebase Concerns

**Analysis Date:** 2026-05-24

## Tech Debt

### Monolithic Mock Server
- Issue: All API routes, mock data, and Vite middleware share a single 491-line `server.ts`. Early-stage prototyping pattern with no layering whatsoever.
- Files: `server.ts`
- Impact: Mock data is initialized as mutable `let` variables at module scope (lines 12–46). Every route handler directly mutates shared state. Adding a new domain (e.g., "buildings") requires touching the monolith.
- Fix approach: Extract route handlers into separate domain modules (`server/routes/camps.ts`, `server/routes/people.ts`) with a shared in-memory store module. Use a proper database (SQLite via `better-sqlite3`) as the next evolution step.

### Ephemeral In-Memory Data Store
- Issue: All data (survivors, camps, resources, inventory, admissions, expeditions, audit logs) lives in `let` arrays in `server.ts`. Every server restart wipes all data.
- Files: `server.ts` (lines 12–46)
- Impact: Impossible to persist operational data between dev sessions. Cannot track real inventory changes or admission decisions across restarts.
- Fix approach: Migrate to a file-backed store (low-touch: JSON file per entity) or embedded SQLite. Each route handler should use the store abstraction rather than direct array mutation.

### Mutable Global State Across Routes
- Issue: Multiple route handlers mutate the same arrays concurrently. Inventory adjustment (`POST /api/inventory/adjustment`, line 175) directly pushes to `inventory` and `inventoryLogs` arrays. Camp creation (`POST /api/camps`, line 78) pushes to three different arrays. No transaction isolation or locking.
- Files: `server.ts` (lines 78–107, 175–210, 399–407)
- Impact: Race conditions possible under concurrent requests. Inconsistent state between inventory and audit logs if one push succeeds and another fails.
- Fix approach: Wrap multi-array mutations in helper functions (`addInventoryChange`, `addCampWithDefaults`) that operate atomically. Eventually replace with transactional database operations.

### Large Feature Component Files
- Issue: Several feature components exceed 400 lines, mixing data fetching, form state, modal rendering, and UI markup in a single file.
- Files:
  - `src/features/admission/AdmissionList.tsx` (483 lines)
  - `src/features/people/PopulationRoster.tsx` (476 lines)
  - `src/features/explorations/ExpeditionList.tsx` (469 lines)
  - `src/features/inventory/InventoryList.tsx` (420 lines)
- Impact: Hard to test, hard to refactor, high cognitive load. Each file contains 3–4 "screens" (list view, create modal, edit modal, detail panel) in one component.
- Fix approach: Split each feature into sub-components: `AdmissionList.tsx` → `AdmissionPanel.tsx`, `AdmissionDetail.tsx`, `AdmissionCreateModal.tsx`. Extract hooks (`useAdmissions`, `useExpeditions`) for data fetching logic.

### Widespread `any` Type Usage (12 occurrences)
- Issue: TypeScript's `any` is used to bypass type checking in critical data paths. All audit log data, resource summaries, API error responses, and form state casts use `any`.
- Files:
  - `src/features/dashboard/DashboardOverview.tsx` (lines 151, 163) — resource chart data
  - `src/features/inventory/InventoryList.tsx` (lines 34, 254) — audit log query and rendering
  - `src/features/auth/LoginPage.tsx` (line 44) — API error catch
  - `src/features/people/PopulationRoster.tsx` (lines 60, 420) — status normalization and form state
  - `src/features/explorations/ExpeditionList.tsx` (lines 93, 336, 425) — form state casts
  - `src/features/camps/CampManagement.tsx` (line 236) — status form cast
  - `server.ts` (line 282, 385) — admission data mutation with `(adm as any)`
- Impact: Silent runtime type errors in production. API response shape changes won't be caught at compile time.
- Fix approach: Define proper `AuditLogEntry`, `ResourceMetric`, `ApiErrorResponse` types in `src/types.ts`. Use `z.infer` with Zod schemas for API responses. Replace `as any` casts with explicit type assertions.

### No Test Coverage
- Issue: Zero test files exist. No test runner configured (no jest.config, vitest.config, or test script in package.json). The only "check" is `tsc --noEmit`.
- Files: N/A (missing entirely)
- Impact: All features are untested. Refactoring, dependency upgrades, and new features risk regressions with no safety net.
- Fix approach: Add Vitest (already compatible with Vite ecosystem). Start with integration tests for critical API endpoints and unit tests for state management (`src/store/index.ts`). Add a `npm run test` script.

### Fake Authentication with Hardcoded Credentials
- Issue: Login accepts any password. Role assignment is hardcoded: username "admin" → system_admin, "manager" → resource_manager, "travel"/"coordinator" → travel_coordinator, anything else → survivor. The mock JWT token is the literal string `"mock-jwt-token"`.
- Files:
  - `server.ts` (lines 49–58)
  - `src/features/auth/LoginPage.tsx` (lines 130–144) — displays hardcoded credentials in UI
- Impact: Zero actual security. The UI literally shows the valid usernames to anyone visiting the login page.
- Fix approach: Remove credential display from login UI. If this stays as a demo with mock auth, at minimum remove the visible credential hints. For real auth, integrate a proper authentication provider or implement password hashing with bcrypt.

### Unused Dependencies
- Issue: `@google/genai` (^1.29.0) is listed in `dependencies` but never imported in any source file. No Gemini API calls exist in the codebase.
- Files: `package.json` (line 15)
- Impact: Unnecessary package bloat, increased install time, potential supply-chain surface.
- Fix approach: Either remove the dependency or actually implement Gemini API integration (AI admission analysis). The `vite.config.ts` injects `GEMINI_API_KEY` via `process.env`, suggesting the intent exists but code was never written.

### Unused Imports in Feature Components
- Issue: `ArrowRight` is imported from lucide-react in `AdmissionList.tsx` but never used in the JSX.
- Files: `src/features/admission/AdmissionList.tsx` (line 6)
- Impact: Minor bundle size increase. Linting would catch this if configured.
- Fix approach: Add `eslint-plugin-react` with `no-unused-vars` or configure TypeScript's `noUnusedLocals` in tsconfig.json.

## Known Bugs

### Disabled Pagination Controls
- Symptoms: The PREV/NEXT buttons in the Population Roster are permanently disabled with no implementation.
- Files: `src/features/people/PopulationRoster.tsx` (lines 470–471)
- Trigger: Always visible when viewing population list.
- Workaround: None — all records are shown in a single un-paginated table.
- Fix approach: Implement client-side pagination or add server-side `limit`/`offset` query params.

## Security Considerations

### Token Stored in localStorage (XSS-Vulnerable)
- Risk: JWT token is stored in `localStorage` and attached via axios interceptor. Any XSS vulnerability would leak the token.
- Files:
  - `src/store/index.ts` (line 18) — `localStorage.setItem('token', token)`
  - `src/lib/api.ts` (line 27) — reads token from localStorage
- Current mitigation: None. The token is fully accessible to any script running on the page.
- Recommendations: Use httpOnly cookies for token storage (requires server-side cookie setting). At minimum, use sessionStorage instead of localStorage for slightly reduced persistence window.

### Hardcoded External API URL
- Risk: The remote API URL (`https://gestion-del-fin-api-production.up.railway.app/api`) is hardcoded in the frontend source code rather than configured via environment variables.
- Files: `src/lib/api.ts` (line 10)
- Current mitigation: The `api_mode` toggle in localStorage switches between local (`/api`) and remote.
- Recommendations: Move the remote URL to an environment variable (`VITE_API_REMOTE_URL`). Add validation for the URL format at build time.

### No CORS Policy on Mock Server
- Risk: The Express mock server has no CORS middleware configured, meaning it only accepts same-origin requests by default. This is secure but could cause confusion when frontend and API are on different origins.
- Files: `server.ts` (no CORS configuration present)
- Current mitigation: Express's default behavior blocks cross-origin requests.
- Recommendations: If the API is intended to be called from other origins, configure CORS with explicit origin whitelist.

### No CSRF Protection on Mutating Endpoints
- Risk: POST/PUT/PATCH/DELETE endpoints have no CSRF token validation. Since the token is sent via `Authorization` header (Bearer), CSRF is partially mitigated, but this pattern is fragile.
- Files: All mutating routes in `server.ts` (lines 78, 109, 175, 217, 245, 265, 297, 378, 422, 439, 449)
- Current mitigation: Bearer token in Authorization header (same-origin policy prevents header reading).
- Recommendations: Implement CSRF token double-submit cookie pattern if moving to cookie-based auth.

### Input Validation Gaps on Server
- Issue: Several endpoints accept and process user input without type validation or sanitization. The server only checks for `!name` or `!destination` presence, not type/format.
- Files:
  - `server.ts` (line 402) — `applicant_age` cast to Number without range check
  - `server.ts` (line 178) — `quantity` from request body directly used in arithmetic
- Impact: Negative inventory quantities, zero-age applicants, oversized strings could corrupt mock data.
- Fix approach: Add Zod validation schemas to all request bodies on the server side, mirroring the client-side validation pattern already in use.

## Performance Bottlenecks

### Client-Side Filtering on Full Dataset
- Problem: The Population Roster fetches all survivors for a camp and filters client-side via JavaScript (name/profession/status matching). No server-side search.
- Files: `src/features/people/PopulationRoster.tsx` (lines 115–133)
- Cause: No server-side search/filter endpoints exist.
- Improvement path: Add query parameters (`?search=`, `?status=`) to the `/api/camps/:campId/people` endpoint. Enable server-side filtering to reduce payload size as data grows.

### Full Page Reload on API Mode Switch
- Problem: `setApiMode()` calls `window.location.reload()` to switch between local/remote API, causing a full SPA teardown and re-initialization.
- Files: `src/lib/api.ts` (line 19)
- Cause: The axios baseURL is set once at module initialization time (`axios.create()`), making it impossible to change dynamically without a reload.
- Improvement path: Use an axios instance that can be reconfigured at runtime. Store the mode in React context or zustand store, and create a factory function for the axios instance that reads current mode.

### No Data Caching Strategy
- Problem: React Query is configured with `refetchOnWindowFocus: false` and `retry: 1`, but there's no `staleTime` or `gcTime` configured. Every navigation re-fetches data.
- Files: `src/App.tsx` (lines 19–26)
- Cause: Default React Query settings treat all data as immediately stale.
- Improvement path: Set `staleTime: 30000` (30 seconds) as a baseline. Configure per-query `staleTime` for slow-changing data (camps list could have `staleTime: 5 * 60 * 1000`).

## Fragile Areas

### React Router v7 with Nested Protected Routes
- Files: `src/App.tsx` (lines 64–118)
- Why fragile: The `ProtectedRoute` component is used both as a layout wrapper and as individual route wrappers for `population`, `inventory`, `admission`, `expeditions`, and `camps` routes. This dual nesting creates unexpected behavior — the inner `ProtectedRoute` checks auth again but has no `roles` parameter, making the inner check redundant.
- Safe modification: Remove the inner `<ProtectedRoute>` wrappers on lines 81, 89, 97, 105, 113. The outer `<ProtectedRoute>` on line 71 already guards the entire layout.
- Test coverage: No tests exist for routing behavior.

### Complex Status Normalization Logic
- Files: `src/features/people/PopulationRoster.tsx` (lines 60–66, 123–132, 247–273)
- Why fragile: Person status is normalized from backend values (`WOUNDED`, `INJURED`, `MISSING`, `AWAY`, `DECEASED`, `DEAD`) to display labels in THREE separate locations: edit form population (lines 60–66), search filtering (lines 123–132), and table rendering (lines 247–273). Any status enum change requires updating all three locations.
- Safe modification: Extract a `normalizePersonStatus` utility and a `STATUS_CONFIG` map into `src/lib/utils.ts` or a dedicated `src/lib/status.ts`. Update all three locations to use the shared mapping.
- Test coverage: None.

### API Response Shape Divergence
- Files:
  - `server.ts` (line 213–214) — `/api/camps/:campId/people` returns `{ data: [...], total: ... }`
  - `server.ts` (line 75) — `/api/camps` returns bare array
  - `server.ts` (line 124) — `/api/metrics/dashboard` returns flat object
- Why fragile: No consistent response envelope. The frontend must know which endpoints wrap in `data`, which return raw arrays, and which return flat objects.
- Safe modification: Define a standard API response format (`{ data: T, meta?: { total: number } }`) and enforce it server-side with a helper function. Update all frontend queries to expect consistent shapes.
- Test coverage: None.

### Inactivity Timeout Depends on DOM Events Only
- Files: `src/App.tsx` (lines 39–58)
- Why fragile: The 20-minute inactivity logout only resets on `mousemove` and `keydown` events. Touch events on mobile, scroll events, or active API calls won't reset the timer. Browser tab visibility is not checked.
- Safe modification: Add `touchstart`, `scroll`, and `visibilitychange` event listeners. Use `document.addEventListener('visibilitychange', ...)` to check if the tab is still visible.

## Scaling Limits

### In-Memory Array Store
- Current capacity: Unlimited by JavaScript heap (~1.4GB for Node), but no persistence.
- Limit: All data lost on restart. Array operations (`.find`, `.filter`) are O(n) — degrades with thousands of records.
- Scaling path: Replace with SQLite (via `better-sqlite3`) for dev/prototype. Migrate to PostgreSQL for production.

### No Pagination on Any Endpoint
- Current capacity: All GET endpoints return full datasets. Dashboard metrics always compute from full inventory/survivor arrays.
- Limit: With 10,000+ survivors or 100,000+ inventory records, response times degrade and payload sizes become impractical.
- Scaling path: Add `?page=` and `?limit=` query parameters to all list endpoints. Add database-level `LIMIT`/`OFFSET` when migrating to SQL.

### Client-Side Filtering
- Current capacity: Filters process entire dataset in JavaScript.
- Limit: Same as above — degrades with large datasets.
- Scaling path: Move filtering to server-side query parameters.

## Dependencies at Risk

### `@google/genai` Unused Dependency
- Risk: This package is in `dependencies` (not devDependencies) but has zero imports in the source code. It adds ~2–5MB to install size and increases supply-chain attack surface.
- Impact: None currently — no functionality depends on it. But it may be expected by the AI Studio platform at runtime.
- Migration plan: Verify with AI Studio docs whether `@google/genai` is injected at runtime by the platform. If not, remove it. If yes, document why it's needed and add an `import` that calls it so tree-shaking can't remove it.

### `react-router-dom` v7 (Major Version with Breaking Changes)
- Risk: The app uses React Router v7 (`^7.15.0`), which introduced breaking changes from v6 (new data APIs, changed `Route` component API). The current usage pattern (`BrowserRouter`, `Routes`, `Route`) is v6-compatible but may not leverage v7 improvements.
- Impact: Future v7 minor updates could deprecate the v6-compatible API surface used here.
- Migration plan: Monitor React Router v7 changelog. Consider migrating to v7's `createBrowserRouter` + `RouterProvider` pattern for better data loading and error handling.

### `vite` Listed in Both `dependencies` and `devDependencies`
- Risk: `vite` appears in both `dependencies` (line 32) and `devDependencies` (line 44) of `package.json`. This causes version conflict potential and unnecessary production bundle inclusion.
- Files: `package.json` (lines 32, 44)
- Impact: Redundant install, potential version mismatch.
- Migration plan: Remove `vite` from `dependencies`. It should only be in `devDependencies`. The `build` script uses `tsx` and `esbuild` for production, not `vite`.

## Missing Critical Features

### No Error Boundaries
- Problem: No React Error Boundary is defined anywhere in the component tree. Any uncaught render error will unmount the entire React tree, showing a blank white screen.
- Blocks: Graceful error recovery for users. Debug information for developers.
- Fix approach: Add a root-level `<ErrorBoundary>` component in `src/components/ErrorBoundary.tsx` wrapping `<App />` in `main.tsx`. Add feature-level error boundaries for critical sections.

### No Accessibility Support
- Problem: Zero ARIA attributes, no keyboard navigation in modals (no focus trapping, no Escape-to-close on all modals), no screen reader labels on interactive elements.
- Blocks: Usability for keyboard-only and screen-reader users. Compliance with accessibility standards.
- Fix approach: Add `role`, `aria-label`, and `aria-describedby` to form inputs. Implement focus trapping in modal components. Add keyboard event handlers (Escape closes modals).

### No Loading State for Initial App Boot
- Problem: When the app first loads, there's no loading indicator while camps data is fetched. The user sees "No Refuge Selected" until data arrives.
- Files: `src/features/dashboard/DashboardOverview.tsx` (lines 31–41)
- Blocks: Poor initial UX. User sees error-like state briefly.
- Fix approach: Show a skeleton or spinner in the dashboard layout while `camps` query is loading. Wait until camps are available before rendering the Outlet.

## Test Coverage Gaps

### Entire Codebase Untested
- What's not tested: Authentication flow, route protection, all CRUD operations, form validation, state management, API error handling, modal interactions, data rendering, status normalization, inventory math, chart rendering.
- Files: All 17 source files in `src/` and `server.ts`.
- Risk: Any change can silently break functionality. Refactoring is high-risk.
- Priority: High

### Critical Untested Flows
- **Login/Authentication**: No test verifies that invalid credentials are rejected, that protected routes redirect, or that the inactivity timer works.
- **Inventory Adjustment Math**: The `MANUAL_IN`/`MANUAL_OUT` logic with `Math.max(0, ...)` floor in `server.ts` (line 192) has no test coverage.
- **Admission AI Screening Logic**: The skill-based classification chain in `server.ts` (lines 306–339) has complex branching with no tests.
- **Cross-Camp Transfer**: Person transfer between camps (`POST /api/people/:id/transfer`) has no validation that target camp exists.
- Priority: High — these are the most business-critical and error-prone code paths.

---

*Concerns audit: 2026-05-24*
