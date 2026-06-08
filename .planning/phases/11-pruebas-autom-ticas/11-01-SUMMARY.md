---
phase: 11-pruebas-autom-ticas
plan: 01
subsystem: testing
tags: [playwright, e2e, ci, github-actions, page-object-model, storage-state]

# Dependency graph
requires: []
provides:
  - Complete Playwright E2E test infrastructure with config, auth setup, and CI integration
  - 5 Page Object Models: LoginPage, DashboardPage, PeopleListPage, PersonDetailPage, ResourcesPage
  - 5 E2E spec files covering 17 test cases across auth, dashboard, people, resources, inventory
  - CI workflow e2e job with Playwright browser install and artifact upload
affects: [ci-pipeline, future-test-phases]

# Tech tracking
tech-stack:
  added: [@playwright/test@1.60.0]
  patterns:
    - "Page Object Model (POM): encapsulated locators and actions in typed classes"
    - "storageState authentication: global setup logs in once, saves JWT session, reused across all tests"
    - "Web-first locators: getByLabel/getByRole/getByText — zero CSS selectors, zero waitForTimeout"
    - "Read-only E2E tests: assert page rendering and navigation without data mutation"
    - "CI-aware Playwright config: forbidOnly in CI, retries: 2, workers: 1, artifact upload on failure"

key-files:
  created:
    - playwright.config.ts — Playwright framework config (webServer, projects, CI settings)
    - e2e/tsconfig.json — TypeScript config for e2e directory (extends root, adds node types)
    - e2e/auth.setup.ts — Global auth setup via storageState pattern
    - e2e/fixtures.ts — Centralized test exports (test, expect, page objects, credentials)
    - e2e/pages/LoginPage.ts — POM for /login (goto, login, getErrorMessage, session banner)
    - e2e/pages/DashboardPage.ts — POM for /dashboard (waitForLoad, navigateTo, selectCamp, logout)
    - e2e/pages/PeopleListPage.ts — POM for /population (search, filter, clickPerson, pagination)
    - e2e/pages/PersonDetailPage.ts — POM for /population/:id (waitForDetailLoad, getPersonName)
    - e2e/pages/ResourcesPage.ts — POM for /resources (waitForList, clickCreateResource, modal)
    - e2e/login.spec.ts — 4 auth tests (success, failure, session expired, unauthenticated redirect)
    - e2e/dashboard.spec.ts — 3 dashboard tests (stat cards, navigation, no-camp state)
    - e2e/people.spec.ts — 4 people tests (list load, search, detail navigate, pagination)
    - e2e/resources.spec.ts — 3 resources tests (list load, create modal, content display)
    - e2e/inventory.spec.ts — 3 inventory tests (list load, stock alerts, audit trail)
    - .env.test.example — Test environment variables template
  modified:
    - package.json — Added test:e2e, test:e2e:ui, test:e2e:debug, test:e2e:headed scripts
    - .gitignore — Added Playwright artifact patterns + .env.test.example negation
    - .github/workflows/ci.yml — Added e2e job with needs:check, browser install, artifacts
    - tsconfig.json — Excluded e2e/ from main build to prevent typecheck conflicts
    - pnpm-lock.yaml — Updated for @playwright/test dependency

key-decisions:
  - "Used storageState pattern for auth reuse — login once per run, not per test"
  - "All locators use getByLabel/getByRole/getByText — zero CSS class selectors for resilience"
  - "Read-only test strategy for Phase 11 — assert rendering and navigation, no data mutation"
  - "CI e2e job uses needs: check to avoid running on broken builds"
  - "E2E tsconfig extends root but overrides exclude to avoid inheriting root's e2e exclusion"
  - "Used fileURLToPath + path.dirname instead of __dirname for ESM compatibility (type: module)"

patterns-established:
  - "POM structure: constructor(private page: Page), async methods wrapping Playwright locators"
  - "Spec imports from centralized fixtures.ts (not direct page object imports)"
  - "API wait pattern: page.waitForResponse() for react-query data loading"
  - "Soft assertions for conditional UI: expect.soft() when data availability varies"
  - "test.use({ storageState: undefined }) for unauthenticated test contexts"

requirements-completed:
  - REQ-01: Login flow E2E (success, failure, session expired, redirect)
  - REQ-02: Auth JWT session reuse via storageState
  - REQ-03: Dashboard E2E (stat cards, navigation, empty states)
  - REQ-04: People CRUD E2E (list, search, detail, pagination)
  - REQ-05: Resources CRUD E2E (list, create modal, content verification)
  - REQ-06: Inventory Audit E2E (list, stock alerts, audit trail)
  - REQ-07: CI integration (GitHub Actions e2e job with browser install)

# Metrics
duration: 5 min
completed: 2026-06-08
---

# Phase 11 Plan 01: Playwright E2E Testing Infrastructure Summary

**Complete Playwright E2E test suite with storageState auth reuse, 5 POMs, 17 spec tests, and CI integration**

## Performance

- **Duration:** 5 min
- **Started:** 2026-06-08T20:59:54Z
- **Completed:** 2026-06-08T21:05:41Z
- **Tasks:** 3
- **Files modified:** 20

## Accomplishments

- Installed @playwright/test 1.60.0 and configured Playwright with webServer, CI-aware settings, and dual-project setup (setup + chromium)
- Built 5 Page Object Models using verified source locators (getByLabel/getByRole/getByText, zero CSS selectors or waitForTimeout)
- Created 5 E2E spec files with 17 test cases covering auth (4), dashboard (3), people (4), resources (3), inventory (3)
- Integrated E2E job into existing GitHub Actions CI workflow with needs:check dependency, Chromium browser install, and artifact upload
- All tests are read-only — no data mutation against production Railway backend
- Auth setup uses storageState pattern: login once via global setup, JWT session reused across all authenticated tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Infraestructura de pruebas** — `c04ec81` (feat(e2e): install Playwright and create test infrastructure)
2. **Task 2: Auth + Dashboard E2E** — `5887d51` (feat(e2e): add auth and dashboard page objects and specs)
3. **Task 3: Feature E2E + CI** — `36f85ec` (feat(e2e): add people, resources, inventory specs and CI integration)

**Plan metadata:** pending final commit

## Files Created/Modified

### New (15 files)
- `playwright.config.ts` — Framework config with webServer, setup/chromium projects, reporter, CI-aware settings
- `e2e/tsconfig.json` — E2E TypeScript config extending root, adding node types, overriding exclude
- `e2e/auth.setup.ts` — Global auth setup: login via UI, save storageState to e2e/.auth/user.json
- `e2e/fixtures.ts` — Centralized exports: test, expect, all 5 POMs, TEST_CREDENTIALS, BASE_URL
- `e2e/pages/LoginPage.ts` — POM: goto, login, loginExpectFailure, getErrorMessage, isSessionExpiredBannerVisible
- `e2e/pages/DashboardPage.ts` — POM: goto, waitForDashboardLoad, navigateTo, selectCamp, isNoCampSelectedVisible, getStockAlertCount, logout
- `e2e/pages/PeopleListPage.ts` — POM: goto, waitForLoad, search, filterByStatus, clickPerson, getPersonCount, isPersonInList, clickNewSurvivor
- `e2e/pages/PersonDetailPage.ts` — POM: waitForDetailLoad, getPersonName, navigateBack
- `e2e/pages/ResourcesPage.ts` — POM: goto, waitForResourceList, clickCreateResource, isModalOpen
- `e2e/login.spec.ts` — 4 tests: login success, bad credentials, session expired banner, unauthenticated redirect
- `e2e/dashboard.spec.ts` — 3 tests: stat cards load, navigation to population, no refuge selected state
- `e2e/people.spec.ts` — 4 tests: list load, search filter, detail navigate, pagination count
- `e2e/resources.spec.ts` — 3 tests: list load, create modal opens, content display
- `e2e/inventory.spec.ts` — 3 tests: list load, stock alerts visible, audit trail read-only
- `.env.test.example` — Test credential template (TEST_USERNAME, TEST_PASSWORD, TEST_BASE_URL)

### Modified (5 files)
- `package.json` — Added test:e2e, test:e2e:ui, test:e2e:debug, test:e2e:headed scripts
- `.gitignore` — Added e2e/.auth/, playwright-report/, test-results/ + .env.test.example negation
- `.github/workflows/ci.yml` — Added e2e job (needs:check, Chromium install, artifact upload, 10min timeout)
- `tsconfig.json` — Excluded e2e/ from main build (prevents typecheck conflicts with page object imports)
- `pnpm-lock.yaml` — Updated for @playwright/test@1.60.0

## Decisions Made

1. **ESM __dirname fix:** Used `fileURLToPath(import.meta.url)` + `path.dirname()` instead of `__dirname` because the project has `"type": "module"` in package.json
2. **e2e tsconfig exclude override:** Set `"exclude": []` in e2e/tsconfig.json to counteract the root's `"exclude": ["e2e"]` — necessary so `include: ["**/*.ts"]` actually picks up files
3. **Incremental fixtures.ts:** Task 1 created fixtures.ts with only available exports (test, expect, credentials). Task 2 added LoginPage + DashboardPage exports. Task 3 added PeopleListPage + PersonDetailPage + ResourcesPage exports. This avoids broken imports mid-plan
4. **Soft assertions in conditional tests:** Used `expect.soft()` in the dashboard "no camp" test and inventory stock alerts test — these depend on test data availability and should not block the suite
5. **No `npx playwright install` locally:** Browsers are already cached globally at `~/.cache/ms-playwright/` via Nix flake. `npx playwright install --with-deps chromium` only runs in CI

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed __dirname not available in ESM module scope**
- **Found during:** Task 1 (auth.setup.ts creation)
- **Issue:** `path.join(__dirname, '.auth/user.json')` fails with `ReferenceError: __dirname is not defined in ES module scope` because package.json has `"type": "module"`
- **Fix:** Used `fileURLToPath(import.meta.url)` + `path.dirname(__filename)` to compute directory path
- **Files modified:** e2e/auth.setup.ts
- **Verification:** `pnpm exec playwright test --list` parses config and discovers setup test without errors
- **Committed in:** c04ec81

**2. [Rule 3 - Blocking] Root tsconfig did not exclude e2e/, causing typecheck to fail on incomplete page objects**
- **Found during:** Task 1 (pnpm run typecheck verification)
- **Issue:** Root tsconfig.json had `"exclude": ["legacy", "node_modules", "dist"]` but not `"e2e"`. TypeScript scanned e2e/fixtures.ts which imported page objects not yet created (Task 2-3), causing `pnpm run typecheck` to fail
- **Fix:** Added `"e2e"` to root tsconfig.json `exclude` array. Then updated e2e/tsconfig.json to override exclude with `[]` so the e2e config can still find its own files
- **Files modified:** tsconfig.json, e2e/tsconfig.json
- **Verification:** `pnpm run typecheck` passes with zero errors; `npx tsc --noEmit -p e2e/tsconfig.json` finds e2e files correctly
- **Committed in:** c04ec81

**3. [Rule 3 - Blocking] .env.test.example caught by .gitignore .env* pattern**
- **Found during:** Task 1 (git add for commit)
- **Issue:** `.gitignore` had `.env*` pattern with `!.env.example` negation, but `.env.test.example` matched the wildcard and was ignored
- **Fix:** Added `!.env.test.example` negation rule to `.gitignore`
- **Files modified:** .gitignore
- **Verification:** `git add .env.test.example` succeeds without force flag
- **Committed in:** c04ec81

**4. [Rule 3 - Blocking] fixtures.ts imported page objects not yet created, breaking Playwright test discovery**
- **Found during:** Task 2 (pnpm exec playwright test --list)
- **Issue:** Task 1's fixtures.ts imported PeopleListPage, PersonDetailPage, and ResourcesPage which weren't created until Task 3. Playwright's test discovery failed on the import error: `Cannot find module './pages/PeopleListPage'`
- **Fix:** Updated fixtures.ts to only export available page objects incrementally: Task 1: base exports; Task 2: +LoginPage, +DashboardPage; Task 3: +PeopleListPage, +PersonDetailPage, +ResourcesPage
- **Files modified:** e2e/fixtures.ts (updated in Tasks 2 and 3)
- **Verification:** `pnpm exec playwright test --list` discovers 8 tests after Task 2, 18 tests after Task 3
- **Committed in:** 5887d51 (Task 2 update), 36f85ec (Task 3 update)

---

**Total deviations:** 4 auto-fixed (1 Rule 1 bug, 3 Rule 3 blocking)
**Impact on plan:** All auto-fixes were necessary for correct execution. No scope creep. The incremental fixtures.ts approach is consistent with test file lifecycles — page objects can't be imported before they exist.

## Issues Encountered

- None — all issues were detected and auto-fixed within their originating tasks

## User Setup Required

**GitHub Secrets must be configured** before the CI e2e job can run:

1. Go to repository Settings → Secrets and variables → Actions
2. Add `TEST_USERNAME` — test account username (should be a `system_admin` role for full coverage)
3. Add `TEST_PASSWORD` — test account password

**Local testing requires environment variables:**
```bash
export TEST_USERNAME="your_test_user"
export TEST_PASSWORD="your_test_password"
pnpm run test:e2e
```

Or create a `.env` file (already gitignored) with the values above.

## Next Phase Readiness

- Phase 11 (pruebas-autom-ticas) is the final phase in milestone v1.0-legacy-parity
- E2E test infrastructure is complete and CI-integrated
- Future phases can add: write tests (create/delete resources), expedition/admission/rations specs, permission-based role testing, and test data seeding via API
- Ready for `/gsd-verify-work` to run UAT verification

---
*Phase: 11-pruebas-autom-ticas*
*Completed: 2026-06-08*
