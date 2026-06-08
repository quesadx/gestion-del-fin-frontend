# Phase 11: Pruebas automáticas — Research

**Researched:** 2026-06-08
**Domain:** Automated E2E testing with Playwright + CI integration
**Confidence:** HIGH

## Summary

The project has **zero test infrastructure** — no test runner, no test files, no Playwright config. The acceptance criteria require Playwright-based E2E tests for critical flows that run in CI. Fortunately, the environment is well-prepared: Playwright v1.60.0 is globally available with Chromium browsers already cached (`~/.cache/ms-playwright/`), the Nix flake already includes `chromium` with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` set, and ESLint already ignores `e2e/` directory. The existing GitHub Actions CI workflow runs on `main`/`dev` branches.

**Primary recommendation:** Install `@playwright/test` as a dev dependency, configure `playwright.config.ts` with `webServer` pointing to Vite dev server, authenticate once via login API + `storageState`, write tests using Page Object Model pattern, and add a separate Playwright CI job to the existing `.github/workflows/ci.yml`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| E2E test execution | CI / Dev machine | — | Tests run in headless browser; no tier ownership |
| Test authentication setup | E2E test setup | API (login) | Playwright global setup authenticates via API, saves `storageState` |
| Test assertions | E2E test code | — | Playwright web-first assertions compare against real DOM |
| Test data seeding | E2E test setup | API (backend) | Tests create/clean up data via backend API calls |
| CI pipeline trigger | GitHub Actions | — | Push/PR events on `main`/`dev` branches trigger the workflow |

## User Constraints (from CONTEXT.md)

*No CONTEXT.md exists for this phase. Phase was not discussed — planner has full discretion.*
*However, the project ROADMAP.md has clear direction: "Implementar pruebas automáticas E2E con Playwright, cubriendo flujos críticos con integración continua".*

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@playwright/test` | ^1.60.0 | E2E test framework + runner | Official Playwright test runner; auto-waiting, web-first assertions, trace viewer, parallel execution [VERIFIED: npm registry] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `dotenv` | ^17.2.3 | Load test environment variables | Already a dependency; reuse for `TEST_USERNAME`/`TEST_PASSWORD` in CI |
| `@playwright/test` built-in reporters | — | HTML reporter + JUnit reporter | HTML for local viewing, JUnit for CI (ingest into GitHub Actions test summary) |
| `axios` | ^1.16.0 | API calls in test setup/fixtures | Already a dependency; use for direct API authentication and data seeding |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Playwright E2E | Cypress | Playwright is faster, uses same browsers as dev (Chromium in Nix), better CI support. Cypress has different API, weaker parallel support. |
| Playwright E2E | Vitest + jsdom | jsdom doesn't test real browser behavior; E2E acceptance criteria require "pruebas de extremo a extremo". |

**Installation:**
```bash
pnpm add -D @playwright/test
# Playwright browsers are already installed globally at /home/montoshita/.cache/ms-playwright/
# No need to `npx playwright install` — they're ready.
```

**Version verification:**
```bash
npm view @playwright/test version
# → 1.60.0 (verified 2026-06-08)
```

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `@playwright/test` | npm | 5+ yrs | 15M+/wk | github.com/microsoft/playwright | [OK] | Approved |

*Only one new package needed. Playwright browsers already cached globally — no browser install required.*

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    E2E Test Architecture                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────┐   │
│  │  Global Setup │──▶│  Tests run   │──▶│  CI Artifacts   │   │
│  │ (auth.setup)  │   │  per spec    │   │ (reports,       │   │
│  │               │   │  file        │   │  traces, videos)│   │
│  └──────┬───────┘   └──────┬───────┘   └────────────────┘   │
│         │                  │                                  │
│         ▼                  ▼                                  │
│  ┌──────────────┐   ┌──────────────┐                          │
│  │  API Login    │   │  Playwright  │                          │
│  │  request to   │   │  Browser     │                          │
│  │  /auth/login  │   │  (Chromium)  │                          │
│  └──────────────┘   └──────┬───────┘                          │
│                            │                                  │
│                            ▼                                  │
│  ┌─────────────────────────────────────────────────┐          │
│  │           Vite Dev Server (webServer)            │          │
│  │          http://localhost:5173                   │          │
│  │  ┌───────────────────────────────────────────┐  │          │
│  │  │  React SPA (BrowserRouter)                │  │          │
│  │  │  /login → /dashboard → /people → etc.     │  │          │
│  │  └───────────────────────────────────────────┘  │          │
│  └─────────────────────────────────────────────────┘          │
│                            │                                  │
│                            ▼                                  │
│  ┌─────────────────────────────────────────────────┐          │
│  │        API Proxy (Vite dev)                      │          │
│  │   /api-remote/* → Railway backend                │          │
│  └─────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
e2e/
├── .auth/                  # Auth state files (gitignored)
├── pages/                  # Page Object Model classes
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   ├── PeopleListPage.ts
│   ├── PersonDetailPage.ts
│   ├── ResourcesPage.ts
│   └── ...
├── fixtures.ts             # Custom fixtures (test data, auth)
├── auth.setup.ts           # Global authentication setup
├── login.spec.ts           # Login flow tests
├── dashboard.spec.ts       # Dashboard smoke tests
├── people.spec.ts          # People CRUD tests
├── resources.spec.ts       # Resources CRUD tests
├── inventory.spec.ts       # Inventory list tests
└── tsconfig.json           # E2E-specific TS config (extends root or standalone)
```

### Pattern 1: Page Object Model (POM)
**What:** Encapsulate page locators and actions in typed classes. Tests use high-level methods, not raw locators.
**When to use:** Every page with multiple interactions. Reduces maintenance when UI changes.
**Example:**
```typescript
// e2e/pages/LoginPage.ts
import type { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(username: string, password: string) {
    await this.page.getByLabel('Username').fill(username);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'REQUEST AUTHORIZATION' }).click();
    await this.page.waitForURL('/dashboard');
  }
}
```

### Pattern 2: Storage State Authentication
**What:** Authenticate once in `auth.setup.ts` via the backend API, save the browser context state to disk, and reuse it via `storageState` in every test project.
**When to use:** All authenticated tests. Avoids per-test login.
**Example:**
```typescript
// e2e/auth.setup.ts
import { test as setup } from '@playwright/test';
import path from 'path';

const AUTH_FILE = path.join(__dirname, '.auth/user.json');

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill(process.env.TEST_USERNAME!);
  await page.getByLabel('Password').fill(process.env.TEST_PASSWORD!);
  await page.getByRole('button', { name: 'REQUEST AUTHORIZATION' }).click();
  await page.waitForURL('/dashboard');
  await page.context().storageState({ path: AUTH_FILE });
});
```

### Pattern 3: API-Based Data Seeding
**What:** Use `playwright.request` in test fixtures or `beforeEach` to create/clean up test data via backend API directly. Much faster than UI-based setup.
**When to use:** Any test that depends on specific server state (a camp, a person record, inventory items).

### Anti-Patterns to Avoid
- **Brittle selectors:** Do not use CSS class names or DOM structure selectors. Use `getByRole`, `getByLabel`, `getByText`, `getByTestId` — these are resilient to UI refactors.
- **Arbitrary timeouts:** Never use `page.waitForTimeout(N)`. Playwright auto-waits for elements. Use `toBeVisible`, `waitForURL`, `waitForResponse`, etc.
- **Test interdependency:** Every test must create its own data or use unique accounts. Shared mutable state causes flaky parallel failures.
- **Testing UI state transitions via navigation:** Use `waitForURL` after routing actions (the app uses `BrowserRouter` with lazy-loaded pages).
- **Hardcoded test credentials:** Use environment variables (`TEST_USERNAME`, `TEST_PASSWORD`) injected via `dotenv` or project config.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| E2E test runner | Custom browser automation | `@playwright/test` | Auto-waiting, trace viewer, parallel execution, CI integration — all built-in |
| Auth state sharing | Per-test login | Playwright `storageState` + setup project | Login once per run, save 10-30s per test |
| Test reporting | Custom HTML reporter | Playwright HTML reporter | Built-in trace viewer integration, filtering, retry UI |
| CI test sharding | Manual test splitting | Playwright `--shard` + GitHub Actions matrix | Official support, balanced distribution |
| API mocking | Custom request interceptors | Playwright `page.route()` / `page.waitForResponse()` | Built-in, test-runner aware, no extra deps |

**Key insight:** Playwright's built-in features (auto-waiting, `storageState`, `webServer`, sharding, trace viewer) eliminate the need for almost any custom test infrastructure. The implementation effort is in writing the test specifications and page objects, not building tooling.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Test runner | ✓ | 24.15.0 | — |
| pnpm | Package install | ✓ | 11.1.2 | — |
| Playwright (`@playwright/test`) | Test framework | ✓ (global) | 1.60.0 | — |
| Chromium (Playwright) | Browser engine | ✓ (~/.cache/ms-playwright/) | 148.0.7778.96 | Use Firefox/WebKit |
| Nix (flake.nix) | Dev environment | ✓ | 2.34.7 | Manual `pnpm install` |
| Docker | CI container option | ✓ | 29.5.1 | Skip — use direct runner |
| Railway backend | API backend | ✓ (remote) | — | Run tests against production/CI test user |

**Missing dependencies with no fallback:** None — everything needed is already available.

**Critical env vars for E2E tests:**
- `TEST_USERNAME` — Test account username
- `TEST_PASSWORD` — Test account password
- `CI` — Set to `true` in CI (Playwright reads this; use to reduce workers, adjust output)
- `TEST_BASE_URL` — Optional, defaults to `http://localhost:5173` (Vite dev port)

## Existing Test Infrastructure

**Status: NONE.** No test infrastructure exists.

- **No test runner:** No `vitest`, `jest`, `playwright` in `package.json` dependencies
- **No config files:** No `vitest.config.*`, `jest.config.*`, `playwright.config.*`
- **No test files:** Zero `*.test.*` or `*.spec.*` files in the repository
- **No test scripts:** No `test`, `test:e2e`, or test-related scripts in `package.json`

**What already exists that helps:**
1. **ESLint ignores `e2e/`** — `eslint.config.js` line 10: `ignores: ['dist', 'legacy', 'e2e', '*.config.*']`
2. **Nix flake includes Chromium** — `flake.nix` has `chromium` in `buildInputs` and sets `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. **Global Playwright install** — `npx playwright` v1.60.0 works, browsers cached at `~/.cache/ms-playwright/`
4. **.env pattern** — `.env.example` documents env vars; test env vars follow same pattern
5. **Axios already installed** — can be used in test setup/fixtures for API calls

## Critical Flows to Cover

Based on the app's 15 feature modules and the routing in `App.tsx`, these are the critical user flows to E2E test:

### Priority 1: Authentication & Baseline
| Flow | Routes | Why Critical |
|------|--------|--------------|
| Login success | `/login` → `/dashboard` | Gating flow; everything else depends on it |
| Login failure (bad credentials) | `/login` | Error state UI validation |
| Session idle timeout → redirect to login | `/dashboard` → `/login` via auto-logout | 20-min inactivity timer in App.tsx |
| Protected route redirect (unauthenticated) | `/dashboard` → `/login` | Route guard correctness |
| Permission-denied access | `/users` without `users.read` | Permission UI gating via `ProtectedRoute` |

### Priority 2: Dashboard & Navigation
| Flow | Routes | Why Critical |
|------|--------|--------------|
| Dashboard loads with stat cards | `/dashboard` | Main landing page, multiple API queries |
| Camp selector changes dashboard data | `/dashboard` (with camp switch) | Camp-scoped data flow |
| Navigation sidebar opens all routes | `/dashboard` → all protected routes | Dock navigation works |

### Priority 3: Core CRUD Operations (Representative)
| Flow | Routes | Why Critical |
|------|--------|--------------|
| People list (PopulationRoster) | `/population` | Heavy pagination + search |
| Person detail | `/population/:id` | Complex nested data + modals (status log, profession reassign, contributions) |
| New person form | `/population/new` | Complex form with react-hook-form + zod + file upload |
| Resources CRUD | `/resources` | Create/edit/delete with modal forms |
| Inventory list with stock alerts | `/inventory` | Critical operational data + adjustment requests |

### Priority 4: Operational Flows
| Flow | Routes | Why Critical |
|------|--------|--------------|
| Expeditions list + detail | `/expeditions` → `/expeditions/:id` | Two-page drill-down with resource allocations |
| Admission list + decision | `/admission` | AI-assisted decision workflow |
| Rations management | `/rations` | Core humanitarian operation |
| Inventory audit trail | `/inventory/audit` | Chronological event log with pagination |

## Recommended Setup

### Config: `playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/e2e-junit-results.xml' }],
  ],
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
```

### Scripts: Add to `package.json`
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

### Gitignore: Add to `.gitignore`
```
# Playwright
e2e/.auth/
playwright-report/
test-results/
```

### Auth setup: `e2e/auth.setup.ts`
```typescript
import { test as setup } from '@playwright/test';
import path from 'path';

const AUTH_FILE = path.join(__dirname, '.auth/user.json');

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill(process.env.TEST_USERNAME!);
  await page.getByLabel('Password').fill(process.env.TEST_PASSWORD!);
  await page.getByRole('button', { name: 'REQUEST AUTHORIZATION' }).click();
  await page.waitForURL('/dashboard');
  await page.context().storageState({ path: AUTH_FILE });
});
```

### TypeScript config for Playwright: `e2e/tsconfig.json`
```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "types": ["node"]
  },
  "include": ["**/*.ts"]
}
```

### Test env file: `.env.test.example`
```
# E2E Test Credentials (never commit real values)
TEST_USERNAME="test_admin"
TEST_PASSWORD="test_password"

# Override base URL for CI
# TEST_BASE_URL="https://staging.example.com"
```

## CI Integration

The existing `.github/workflows/ci.yml` runs lint → format → typecheck → spell → build. Add a separate job for Playwright E2E tests that runs in parallel with the checks:

### Recommended: Add E2E job to existing workflow (preferred — simpler, one workflow)
```yaml
name: CI

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    name: Lint, Format, Type Check, Spell & Build
    runs-on: ubuntu-latest
    steps:
      # ... existing steps unchanged ...

  e2e:
    name: E2E Tests (Playwright)
    needs: check  # Only run E2E if checks pass
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 11.1.2

      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run Playwright tests
        run: pnpm run test:e2e
        env:
          TEST_USERNAME: ${{ secrets.TEST_USERNAME }}
          TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
          CI: 'true'

      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14

      - uses: actions/upload-artifact@v4
        if: ${{ failure() }}
        with:
          name: test-results
          path: test-results/
          retention-days: 14
```

**Key CI decisions:**
- `needs: check` — E2E only runs if lint/format/typecheck/build pass. Saves CI minutes.
- `npx playwright install --with-deps chromium` — Only Chromium (fastest install). Firefox/WebKit not needed for initial coverage.
- `CI: 'true'` — Reduces workers to 1, adds retries (2 retries enabled in config).
- Artifacts upload HTML report + failure traces for debugging.
- GitHub Secrets: `TEST_USERNAME` + `TEST_PASSWORD` must be configured in the repository.

## Implementation Plan Recommendations

### Wave 0: Foundation (1 plan)
1. Install `@playwright/test`: `pnpm add -D @playwright/test`
2. Create `playwright.config.ts` with webServer, projects, CI-aware settings
3. Create `e2e/tsconfig.json` for Playwright TypeScript
4. Create `e2e/auth.setup.ts` with login flow
5. Create `e2e/fixtures.ts` with custom test fixtures (if needed)
6. Create `.env.test.example` documenting test env vars
7. Update `.gitignore` for Playwright artifacts
8. Add test scripts to `package.json`
9. Update `.github/workflows/ci.yml` with E2E job

### Wave 1: Critical Auth + Dashboard Tests (1 plan)
1. `e2e/login.spec.ts` — Login success, login failure, session expired flow, redirect to login
2. `e2e/dashboard.spec.ts` — Dashboard loads stats, camp selector changes data, navigation works

### Wave 2: Core CRUD Flows (1-2 plans)
1. `e2e/people.spec.ts` — People list loads, pagination works, person detail page loads, new person form validation
2. `e2e/resources.spec.ts` — Resources list loads, create resource modal, success state
3. `e2e/inventory.spec.ts` — Inventory list with stock alerts loads

### Wave 3: Operational Flows (1 plan, stretch goal)
1. `e2e/expeditions.spec.ts` — Expeditions list + detail navigation
2. `e2e/admission.spec.ts` — Admission list loads
3. `e2e/rations.spec.ts` — Rations history page loads
4. `e2e/professions.spec.ts` — Professions CRUD flows

### Priority Recommendation
**Ship Wave 0 + Wave 1 first.** The acceptance criteria say "Existen pruebas E2E para los flujos principales" and "Los errores críticos son detectados antes del despliegue." Authentication and dashboard are the most critical flows — if login breaks, the entire app is unusable.

## Risks and Considerations

### Risk 1: Real Backend Dependency
**What:** Tests hit the real Railway backend. Test data created by tests persists.
**Mitigation:** Use a dedicated test user account that only runs in CI. Design tests to be read-only where possible (assert on existing data). For write tests, clean up created resources via API in `afterAll` or use a test-specific camp.

### Risk 2: API Rate Limits / Flakiness
**What:** The remote Railway backend could be slow, rate-limited, or down.
**Mitigation:** Set generous timeouts (30s default). Add retries (2 in CI). Use `waitForResponse` pattern to wait for specific API calls. Graceful failure handling — tests should fail clearly, not hang.

### Risk 3: Flaky Auth Setup
**What:** The global auth setup fails, causing all tests to fail.
**Mitigation:** The setup project runs first with `dependencies: ['setup']`. If auth fails, no tests run — clear signal. Use `trace: 'on-first-retry'` to capture the failure.

### Risk 4: Permission-Based UI Gating
**What:** Different roles see different UI. A test may fail because the test user lacks a specific permission.
**Mitigation:** Use a `system_admin` test user (has all permissions) as the primary test account. If testing restricted roles, create separate `storageState` files for each role via additional setup projects.

### Risk 5: Vite dev server in CI
**What:** The `webServer` config runs `pnpm run dev` which starts Vite. The build must succeed for this to work.
**Mitigation:** The `needs: check` dependency in CI ensures the build passes first. The E2E job itself also runs `pnpm install`. Use `reuseExistingServer: true` for local development to avoid restarting the dev server.

## Common Pitfalls

### Pitfall 1: Playwright can't find Chromium on Nix
**What goes wrong:** Playwright uses its own browser binaries at `~/.cache/ms-playwright/`. The Nix flake's `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` points to a different Chromium binary.
**Why it happens:** Playwright expects its specific Chromium build (version-matched). System Chromium may not match.
**How to avoid:** Always install Playwright browsers via `npx playwright install chromium --with-deps`. The Nix env variable is for backward compat if needed. Set `PLAYWRIGHT_BROWSERS_PATH=0` in env to use the cached browsers explicitly.
**Warning signs:** Tests fail with `Error: browserType.launch: Executable doesn't exist at ...` or `Failed to launch browser`.

### Pitfall 2: Tests pass locally but fail in CI
**What goes wrong:** CI has no display server, no fonts, no system dependencies.
**Why it happens:** Playwright browsers require system libraries (libnss3, libatk-bridge, etc.).
**How to avoid:** Use `npx playwright install --with-deps chromium` in CI (installs system deps). Set `PLAYWRIGHT_BROWSERS_PATH=0` for CI caching.
**Warning signs:** CI job fails with missing shared library errors.

### Pitfall 3: Tests fail because of lazy-loaded React components
**What goes wrong:** Playwright clicks a link but the target page hasn't mounted yet.
**Why it happens:** The app uses `React.lazy` + `Suspense` for all pages. The page chunk loads asynchronously.
**How to avoid:** Always use `waitForURL` after navigation. Use `waitForResponse` to wait for API data to load. Never assume navigation is instant.
**Warning signs:** Tests click a nav item but assertions on the new page fail intermittently.

### Pitfall 4: Zustand persisted state interferes between tests
**What goes wrong:** Tests share localStorage state (auth token, selected camp) across browser contexts.
**Why it happens:** Zustand persist middleware saves to `localStorage`. Playwright contexts are isolated, but localStorage persists per origin unless cleared.
**How to avoid:** Use `storageState` properly (fresh state per test file). Don't rely on `localStorage` cleanups. Each test context starts fresh with the authenticated `storageState`.
**Warning signs:** Tests unexpectedly skip login screens or see stale camp selections.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `@playwright/test` v1.60.0 |
| Config file | `playwright.config.ts` (root) |
| Quick run command | `pnpm run test:e2e` |
| Full suite command | `pnpm run test:e2e` |
| UI mode (dev) | `pnpm run test:e2e:ui` |
| Debug mode | `pnpm run test:e2e:debug` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-01 | Login success | E2E | `npx playwright test e2e/login.spec.ts` | ❌ Wave 0 |
| REQ-02 | Login failure | E2E | `npx playwright test e2e/login.spec.ts` | ❌ Wave 0 |
| REQ-03 | Dashboard loads | E2E | `npx playwright test e2e/dashboard.spec.ts` | ❌ Wave 1 |
| REQ-04 | People list with pagination | E2E | `npx playwright test e2e/people.spec.ts` | ❌ Wave 1 |
| REQ-05 | Resources CRUD flow | E2E | `npx playwright test e2e/resources.spec.ts` | ❌ Wave 2 |
| REQ-06 | Inventory stock alerts display | E2E | `npx playwright test e2e/inventory.spec.ts` | ❌ Wave 2 |
| REQ-07 | CI runs E2E on push/PR | CI | GitHub Actions workflow | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm run test:e2e` (quick smoke)
- **Per wave merge:** Full `pnpm run test:e2e` suite
- **Phase gate:** Full suite green in CI before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `playwright.config.ts` — framework configuration
- [ ] `e2e/auth.setup.ts` — authentication setup project
- [ ] `e2e/tsconfig.json` — TypeScript config for e2e tests
- [ ] Updated `.github/workflows/ci.yml` — E2E job

## Sources

### Primary (HIGH confidence)
- [Playwright CI docs](https://playwright.dev/docs/ci) — GitHub Actions configuration patterns, caching, sharding
- [Playwright Auth docs](https://playwright.dev/docs/auth) — storageState pattern, global setup, multiple roles
- [Playwright Best Practices](https://playwright.dev/docs/best-practices) — locator strategies, POM, isolation
- Codebase audit — package.json, tsconfig.json, eslint.config.js, flake.nix, existing CI workflow

### Secondary (MEDIUM confidence)
- [Playwright Page Object Model Guide 2026](https://qaskills.sh/blog/playwright-page-object-model-guide-2026) — POM patterns for Playwright TypeScript
- [React Testing Strategy 2026](https://softaims.com/blog/react-testing-strategy-vitest-playwright-2026) — Modern React testing pyramid guidance

### Tertiary (LOW confidence)
- None — all critical claims verified against Playwright official docs or project files

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Tests can authenticate against the real Railway production backend | CI Integration | Medium — could use a test staging environment instead |
| A2 | The test user account exists with `system_admin` role | Critical Flows | Medium — need to document setup process for test credentials |
| A3 | Vite dev server starts fast enough for 30s `webServer` timeout | CI Integration | Low — Vite is fast, 30s is generous |

## Open Questions (RESOLVED)

1. **Test data strategy**
   - What we know: Tests need *some* data to exist (at least one camp, some people, resources, etc.)
   - What's unclear: Should we seed test data via API in `globalSetup`? Or rely on existing production data with a read-only test user?
   - RESOLVED: Start with read-only tests (assert page renders, navigation works). Add write tests (create resource, etc.) in Wave 2.

2. **Test user credentials**
   - What we know: Need `TEST_USERNAME`/`TEST_PASSWORD` GitHub Secrets
   - What's unclear: Who provisions the test user? What permissions does it have?
   - RESOLVED: Use an existing admin-level account from the production Railway backend during development. Document credential provisioning for CI.

3. **E2E test scope balance**
   - What we know: The acceptance criteria say "flujos principales" (main flows)
   - What's unclear: How many tests is "enough" for the initial milestone?
   - RESOLVED: Start with 5-10 specs covering authentication, dashboard, and 2-3 CRUD flows. Expand in future phases.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Playwright is the stated requirement; version verified via npm registry and Playwright official docs
- Architecture: HIGH — POM + storageState + webServer patterns are Playwright official recommendations
- Pitfalls: HIGH — All documented pitfalls are based on verified project characteristics (lazy loading, Nix, Zustand persist)

**Research date:** 2026-06-08
**Valid until:** 2026-07-08 (30 days — Playwright evolves fast)
