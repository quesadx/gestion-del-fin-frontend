---
phase: 11
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - playwright.config.ts
  - e2e/tsconfig.json
  - e2e/auth.setup.ts
  - e2e/fixtures.ts
  - e2e/pages/LoginPage.ts
  - e2e/pages/DashboardPage.ts
  - e2e/pages/PeopleListPage.ts
  - e2e/pages/PersonDetailPage.ts
  - e2e/pages/ResourcesPage.ts
  - e2e/login.spec.ts
  - e2e/dashboard.spec.ts
  - e2e/people.spec.ts
  - e2e/resources.spec.ts
  - e2e/inventory.spec.ts
  - .env.test.example
  - package.json
  - .gitignore
  - .github/workflows/ci.yml
autonomous: true
requirements: []
must_haves:
  truths:
    - "Playwright dependency installed and configured with webServer + storageState"
    - "Authentication setup reuses JWT session via storageState — no per-test login"
    - "Login flow E2E test: success redirects to /dashboard, bad credentials show error"
    - "Dashboard E2E test: stat cards load, navigation opens /population"
    - "People list E2E test: Population Roster loads with search and pagination"
    - "Resources list E2E test: Resources page loads, create resource modal opens"
    - "Inventory E2E test: inventory list with stock alerts renders"
    - "CI workflow runs pnpm run test:e2e on push/PR to main and dev branches"
  artifacts:
    - path: "playwright.config.ts"
      provides: "Playwright framework configuration (webServer, projects, CI-aware settings)"
      min_lines: 50
    - path: "e2e/tsconfig.json"
      provides: "TypeScript configuration for E2E test directory"
      extends: "../tsconfig.json"
    - path: "e2e/auth.setup.ts"
      provides: "Global authentication setup — logs in once, saves storageState to e2e/.auth/user.json"
      exports: ["setup"]
    - path: "e2e/fixtures.ts"
      provides: "Custom test fixtures extending base test with auth context and API helpers"
    - path: "e2e/pages/LoginPage.ts"
      provides: "Page Object Model for /login — goto, login, getErrorMessage"
      contains: "class LoginPage"
    - path: "e2e/pages/DashboardPage.ts"
      provides: "Page Object Model for /dashboard — waitForDashboardLoad, navigateTo, selectCamp"
      contains: "class DashboardPage"
    - path: "e2e/pages/PeopleListPage.ts"
      provides: "Page Object Model for /population — search, filterByStatus, clickPerson"
      contains: "class PeopleListPage"
    - path: "e2e/pages/PersonDetailPage.ts"
      provides: "Page Object Model for /population/:id — waitForDetailLoad, getPersonName"
      contains: "class PersonDetailPage"
    - path: "e2e/pages/ResourcesPage.ts"
      provides: "Page Object Model for /resources — clickCreateResource, waitForResourceList"
      contains: "class ResourcesPage"
    - path: "e2e/login.spec.ts"
      provides: "E2E test spec — login success, login failure, session expired, unauthenticated redirect"
      contains: "test.describe('Authentication'"
    - path: "e2e/dashboard.spec.ts"
      provides: "E2E test spec — dashboard loads, navigation opens population, stat cards visible"
      contains: "test.describe('Dashboard'"
    - path: "e2e/people.spec.ts"
      provides: "E2E test spec — people list loads, search filters, pagination works, person detail navigates"
      contains: "test.describe('People'"
    - path: "e2e/resources.spec.ts"
      provides: "E2E test spec — resources list loads, create resource modal opens, resource details render"
      contains: "test.describe('Resources'"
    - path: "e2e/inventory.spec.ts"
      provides: "E2E test spec — inventory list loads, stock alert indicators visible, audit trail read-only"
      contains: "test.describe('Inventory'"
    - path: ".env.test.example"
      provides: "Documented test environment variables (TEST_USERNAME, TEST_PASSWORD, TEST_BASE_URL)"
      contains: "TEST_USERNAME"
    - path: "package.json"
      provides: "Updated scripts block with test:e2e, test:e2e:ui, test:e2e:debug, test:e2e:headed"
      contains: "test:e2e"
    - path: ".gitignore"
      provides: "Updated to ignore Playwright artifacts (e2e/.auth/, playwright-report/, test-results/)"
      contains: "e2e/.auth/"
    - path: ".github/workflows/ci.yml"
      provides: "Updated CI workflow with separate e2e job running Playwright on push/PR"
      contains: "playwright"
  key_links:
    - from: "playwright.config.ts"
      to: "e2e/auth.setup.ts"
      via: "projects[setup].testMatch"
      pattern: "testMatch.*\\.setup\\.ts"
    - from: "playwright.config.ts"
      to: "e2e/.auth/user.json"
      via: "projects[chromium].use.storageState"
      pattern: "storageState.*e2e/\\.auth/user\\.json"
    - from: "e2e/pages/LoginPage.ts"
      to: "/login"
      via: "page.goto"
      pattern: "goto.*'/login'"
    - from: "e2e/auth.setup.ts"
      to: "e2e/.auth/user.json"
      via: "page.context().storageState"
      pattern: "storageState.*AUTH_FILE"
    - from: "e2e/login.spec.ts"
      to: "e2e/pages/LoginPage.ts"
      via: "import { LoginPage }"
      pattern: "from.*LoginPage"
    - from: ".github/workflows/ci.yml"
      to: "pnpm run test:e2e"
      via: "e2e job step"
      pattern: "test:e2e"
---

<objective>
Establish the complete Playwright E2E testing infrastructure for the GDF frontend. Install Playwright, build the test harness (config + auth.setup + page objects + fixtures), write E2E spec files covering all critical flows (auth, dashboard, people, resources, inventory), and integrate into the existing GitHub Actions CI pipeline so every push/PR to `main`/`dev` runs the E2E suite.

Purpose: Accept the acceptance criteria — zero test infrastructure today. After this plan, `pnpm run test:e2e` will execute a full Chromium-based E2E suite covering the 5 critical flow categories identified in RESEARCH.md.

Output: 18 new/modified files forming a complete Playwright E2E test suite with CI integration. The test suite uses storageState JWT reuse (no per-test login), Page Object Model locators keyed on aria-label attributes, and CI-aware config (forced-only mode, retries, artifact upload).
</objective>

<execution_context>
@/home/montoshita/.config/opencode/gsd-core/workflows/execute-plan.md
@/home/montoshita/.config/opencode/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/11-pruebas-autom-ticas/11-RESEARCH.md
@.planning/phases/11-pruebas-autom-ticas/11-PATTERNS.md
@package.json
@tsconfig.json
@.gitignore
@.github/workflows/ci.yml
@.env.example
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1 (Wave 0): Infraestructura de pruebas — Instalación y configuración completa</name>

  <read_first>
@.planning/phases/11-pruebas-autom-ticas/11-RESEARCH.md (lines 30-56, 275-368, 464-486)
@.planning/phases/11-pruebas-autom-ticas/11-PATTERNS.md (lines 32-86, 96-134, 136-186, 425-482, 573-598)
@tsconfig.json (full)
@package.json (lines 11-24)
@.gitignore (full)
@.env.example (full)

Everything this task needs is in RESEARCH.md lines 275-368 (Recommended Setup) and PATTERNS.md lines 32-86 (playwright.config.ts analog), 96-134 (e2e/tsconfig.json analog), 136-186 (auth.setup.ts analog), 425-482 (package.json scripts), and 573-598 (.gitignore). The tsconfig.json root config is the base for e2e/tsconfig.json. The .env.example shows the project's env file convention.
  </read_first>

  <files>
    - playwright.config.ts (NEW — root)
    - e2e/tsconfig.json (NEW — e2e directory)
    - e2e/auth.setup.ts (NEW — global auth setup)
    - e2e/fixtures.ts (NEW — custom test fixtures)
    - .env.test.example (NEW — test env vars template)
    - package.json (MODIFY — add test scripts)
    - .gitignore (MODIFY — add Playwright entries)
  </files>

  <action>
**Install Playwright:** Run `pnpm add -D @playwright/test` to add `@playwright/test` ^1.60.0 as dev dependency. Playwright browsers are already cached globally at `~/.cache/ms-playwright/` — do NOT run `npx playwright install` locally. The `pnpm-lock.yaml` update is a side effect of `pnpm add` — commit it.

**Create playwright.config.ts** at project root using RESEARCH.md lines 278-320 as the canonical template. The config MUST include:
- `testDir: './e2e'` and `timeout: 30_000`
- `fullyParallel: true`, `forbidOnly: !!process.env.CI`, `retries: process.env.CI ? 2 : 0`, `workers: process.env.CI ? 1 : undefined`
- Reporter: HTML (`playwright-report/`) + JUnit (`test-results/e2e-junit-results.xml`)
- `use.baseURL`: `process.env.TEST_BASE_URL || 'http://localhost:5173'`
- `use.trace`: `'on-first-retry'`, `use.screenshot`: `'only-on-failure'`
- Two projects: `setup` (testMatch: `/.*\.setup\.ts/`) and `chromium` (device: `Desktop Chrome`, storageState: `'e2e/.auth/user.json'`, depends on `setup`)
- `webServer` block: command `'pnpm run dev'`, url `'http://localhost:5173'`, `reuseExistingServer: !process.env.CI`, timeout 30_000

Use PATTERNS.md lines 32-86 for the exact project config style (defineConfig import from `@playwright/test`, no extra wrappers).

**Create e2e/tsconfig.json** following PATTERNS.md lines 96-134: extends `../tsconfig.json`, adds `"types": ["node"]`, includes `**/*.ts`. This gives Playwright access to `process.env`, `__dirname`, and `path` while inheriting strict mode from the root config.

**Create e2e/auth.setup.ts** following RESEARCH.md lines 344-357 (the definitive pattern) and PATTERNS.md lines 136-186 (locator-verified version). The setup function:
1. Imports `test as setup` from `@playwright/test` and `path`
2. Defines `AUTH_FILE` as `path.join(__dirname, '.auth/user.json')`
3. Navigates to `/login`, fills `getByLabel('Username')` with `process.env.TEST_USERNAME!`, fills `getByLabel('Password')` with `process.env.TEST_PASSWORD!`
4. Clicks `getByRole('button', { name: 'REQUEST AUTHORIZATION' })` — buttons text is `REQUEST AUTHORIZATION` per LoginPage.tsx line 172
5. Awaits `page.waitForURL('/dashboard')` — accounts for React.lazy + Suspense
6. Saves `page.context().storageState({ path: AUTH_FILE })`

Use the `!` non-null assertion on env vars (tests fail fast with clear error if vars are missing).

**Create e2e/fixtures.ts** with:
- Re-export `test` and `expect` from `@playwright/test`
- Re-export page object classes (`LoginPage`, `DashboardPage`, `PeopleListPage`, `PersonDetailPage`, `ResourcesPage`) so spec files import from one place
- Export `TEST_CREDENTIALS` constant object reading `process.env.TEST_USERNAME` and `process.env.TEST_PASSWORD` (with `!` assertions)
- Export `BASE_URL` constant: `process.env.TEST_BASE_URL || 'http://localhost:5173'`

The fixtures file centralizes imports so spec files have a single import point and auth credentials are defined once.

**Create .env.test.example** following PATTERNS.md lines 425-451 (analog: .env.example convention). Document `TEST_USERNAME`, `TEST_PASSWORD`, and `TEST_BASE_URL` (commented out). Use the project's existing env file comment style (uppercase descriptions with `#` prefix).

**Update .gitignore** — append the Playwright block from RESEARCH.md lines 336-340 and PATTERNS.md lines 592-598:
```
# Playwright
e2e/.auth/
playwright-report/
test-results/
```

**Update package.json scripts block** — add the four scripts from RESEARCH.md lines 324-332:
```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"test:e2e:debug": "playwright test --debug",
"test:e2e:headed": "playwright test --headed"
```
Insert them after the existing `"check"` script entry, maintaining the same indentation and trailing-comma style (Prettier: semi=true, singleQuote=true, trailingComma=all).

**After all files created:** Run `pnpm exec playwright test --list` to verify Playwright discovers the config and lists specs without errors (it will show "No tests found" if auth.setup is the only matching file — that's OK). Run `pnpm run typecheck` to verify `e2e/tsconfig.json` doesn't break type checking (the root tsconfig excludes `e2e/` from the main build — the e2e tsconfig is standalone). Run `pnpm run lint` to verify no ESLint violations in the new files (e2e/ is already in ESLint ignores per RESEARCH.md line 232).
  </action>

  <verify>
    <automated>
# Verify @playwright/test installed
pnpm ls @playwright/test --depth=0 | grep @playwright/test

# Verify playwright.config.ts is valid TypeScript
npx tsc --noEmit -p e2e/tsconfig.json 2>&1 || true

# Verify Playwright discovers the config
pnpm exec playwright test --list 2>&1 | head -5

# Verify auth.setup.ts parses without syntax errors
npx tsc --noEmit e2e/auth.setup.ts --moduleResolution bundler --target ES2022 --module ESNext --strict --skipLibCheck --types node 2>&1 || true
    </automated>
  </verify>

  <acceptance_criteria>
    <done>
- `@playwright/test` listed in `devDependencies` with `^1.60.0`
- `playwright.config.ts` exists at project root with all required config blocks (webServer, projects, CI-aware settings)
- `e2e/tsconfig.json` exists, extends root config, includes `node` types
- `e2e/auth.setup.ts` exists with storageState pattern matching RESEARCH.md template
- `e2e/fixtures.ts` exists exporting test, expect, page objects, credentials
- `.env.test.example` exists documenting test env vars in project's comment style
- `.gitignore` contains `e2e/.auth/`, `playwright-report/`, `test-results/`
- `package.json` scripts includes `test:e2e`, `test:e2e:ui`, `test:e2e:debug`, `test:e2e:headed`
- `pnpm exec playwright test --list` parses config without errors
- `pnpm run typecheck` still passes (e2e files excluded from main build)
- `pnpm run lint` still passes (e2e directory already in ESLint ignores)
    </done>
  </acceptance_criteria>
</task>

<task type="auto" tdd="false">
  <name>Task 2 (Wave 1): Auth + Dashboard E2E — Page Objects y specs de autenticación y dashboard</name>

  <read_first>
@.planning/phases/11-pruebas-autom-ticas/11-RESEARCH.md (lines 134-186, 240-256, 344-357)
@.planning/phases/11-pruebas-autom-ticas/11-PATTERNS.md (lines 188-258, 320-393)

The POM structure follows RESEARCH.md lines 134-156 (Page Object Model pattern). The LoginPage locators are verified against LoginPage.tsx source in PATTERNS.md lines 213-221. The DashboardPage locators come from DashboardOverview.tsx and DashboardLayout.tsx mapped in PATTERNS.md lines 229-258. The spec file templates live in PATTERNS.md lines 320-393.
  </read_first>

  <files>
    - e2e/pages/LoginPage.ts (NEW)
    - e2e/pages/DashboardPage.ts (NEW)
    - e2e/login.spec.ts (NEW)
    - e2e/dashboard.spec.ts (NEW)
  </files>

  <action>
**Task 2 depends on Task 1** (config, auth.setup, and fixtures must exist before specs can run).

**Create e2e/pages/LoginPage.ts** — Page Object Model for `/login`. Follow RESEARCH.md lines 139-156 for the canonical structure. The class wraps a Playwright `Page`:

```typescript
import type { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() { await this.page.goto('/login'); }

  async login(username: string, password: string) {
    await this.page.getByLabel('Username').fill(username);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'REQUEST AUTHORIZATION' }).click();
    await this.page.waitForURL('/dashboard');
  }

  async loginExpectFailure(username: string, password: string) {
    // Variant for invalid credentials — fills form, clicks submit, does NOT wait for redirect
    await this.page.getByLabel('Username').fill(username);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'AUTHORIZING...' }).click();
  }

  async getErrorMessage(): Promise<string | null> {
    // Error text renders in <p className="text-sm text-red-500 font-medium">
    const errorEl = this.page.getByText(/Authentication failed|Check credentials/i);
    if (await errorEl.isVisible()) return await errorEl.textContent();
    return null;
  }

  async isSessionExpiredBannerVisible(): Promise<boolean> {
    return this.page.getByText('Session Terminated').isVisible();
  }
}
```

Key locator decisions per PATTERNS.md lines 213-221:
- Username: `getByLabel('Username')` — verified against LoginPage.tsx line 128
- Password: `getByLabel('Password')` — verified against LoginPage.tsx line 146
- Submit: `getByRole('button', { name: 'REQUEST AUTHORIZATION' })` — verified against LoginPage.tsx line 172
- Loading state button text: `'AUTHORIZING...'` — per PATTERNS.md line 166
- Error container: `getByText(/Authentication failed|Check credentials/i)` — matches the error message pattern from LoginPage.tsx error handling
- Session expired: `getByText('Session Terminated')` — per PATTERNS.md line 219

**Create e2e/pages/DashboardPage.ts** — Page Object Model for `/dashboard`. Based on DashboardOverview.tsx and DashboardLayout.tsx patterns (PATTERNS.md lines 229-258):

```typescript
import type { Page } from '@playwright/test';

export class DashboardPage {
  constructor(private page: Page) {}

  async goto() { await this.page.goto('/dashboard'); }

  async waitForDashboardLoad() {
    await this.page.waitForURL('/dashboard');
    // Wait for at least one stat card to render
    await this.page.getByText('Survivors').waitFor({ state: 'visible', timeout: 15_000 });
  }

  async navigateTo(section: string) {
    // Dock navigation: role="toolbar" with aria-label="Main navigation"
    // Each item has aria-label matching the section name
    await this.page.getByRole('toolbar', { name: 'Main navigation' })
      .getByRole('button', { name: section })
      .click();
  }

  async selectCamp(campName: string) {
    // Camp selector button has aria-label containing 'Current refuge:' or 'Select refuge'
    await this.page.getByLabel(/Current refuge:|Select refuge/).click();
    // Then select camp from dropdown
    await this.page.getByText(campName).click();
  }

  async isNoCampSelectedVisible(): Promise<boolean> {
    return this.page.getByText('No Refuge Selected').isVisible();
  }

  async getStockAlertCount(): Promise<number> {
    const alerts = this.page.getByText(/CRITICAL STOCK:|LOW STOCK:/);
    return await alerts.count();
  }

  async logout() {
    await this.page.getByLabel('Terminate Session').click();
    await this.page.getByText('YES, SIGN OUT').click();
    await this.page.waitForURL('/login');
  }
}
```

Key locator decisions per PATTERNS.md lines 229-258:
- Dashboard stat cards verify by text content: `'Survivors'`, `'Stock Alerts'`
- Navigation dock: `role="toolbar"` with `aria-label="Main navigation"` (Dock.tsx lines 256-258)
- Dock items: `getByRole('button', { name: section })` inside the toolbar
- Camp selector: `getByLabel(/Current refuge:|Select refuge/)` (DashboardLayout.tsx lines 478-485)
- Logout: `getByLabel('Terminate Session')` then confirm with `getByText('YES, SIGN OUT')` (DashboardLayout.tsx lines 531, 573-583)
- "No Refuge Selected": exact text match (DashboardOverview.tsx line 333)
- Stock alert banners: `getByText(/CRITICAL STOCK:|LOW STOCK:/)` (DashboardLayout.tsx lines 978, 995)

**Create e2e/login.spec.ts** — Auth E2E test spec using the LoginPage POM. Follow the template from PATTERNS.md lines 320-360 with the verified locators:

Four test cases:
1. `test('login success redirects to dashboard')` — uses `LoginPage.goto()` then `LoginPage.login(credentials)`, asserts `expect(page).toHaveURL(/\/dashboard/)`
2. `test('login with bad credentials shows error')` — uses `LoginPage.goto()` then `LoginPage.loginExpectFailure('invalid_user', 'wrong_pass')`, asserts error message is visible with `expect(page.getByText(/Authentication failed|Check credentials/i)).toBeVisible()`, asserts URL still contains `/login`
3. `test('session expired banner appears when redirected from timeout')` — sets localStorage `session_expired` flag before navigation, reloads, asserts `Session Terminated` banner visible
4. `test('unauthenticated user redirected to login')` — navigates directly to `/dashboard` without auth state (uses a separate `test.describe` block or a fresh page without storageState), asserts redirect to `/login`
   - **Implementation note:** This test requires a separate Playwright project or context WITHOUT storageState. Use `test.use({ storageState: undefined })` inside the test to opt out of the global auth state. Per Playwright docs, `test.use({ storageState: undefined })` in a test overrides the project-level storageState, giving a clean unauthenticated context.

Import from `e2e/fixtures.ts`: `test`, `expect`, `LoginPage`, `TEST_CREDENTIALS`.

**Create e2e/dashboard.spec.ts** — Dashboard E2E test spec using DashboardPage POM. Follow template from PATTERNS.md lines 364-393:

Three test cases (all authenticated via storageState — no per-test login):
1. `test('dashboard loads with stat cards')` — `page.goto('/dashboard')`, uses `DashboardPage.waitForDashboardLoad()`, asserts `expect(page.getByText('Survivors')).toBeVisible()` and `expect(page.getByText('Stock Alerts')).toBeVisible()`
2. `test('navigation opens population page')` — `page.goto('/dashboard')`, uses `DashboardPage.navigateTo('Population')`, asserts `expect(page).toHaveURL(/\/population/)`
3. `test('dashboard shows no refuge selected state when no camp')` — (conditional) if test user has no pre-selected camp, asserts `DashboardPage.isNoCampSelectedVisible()` returns true

Import from `e2e/fixtures.ts`: `test`, `expect`, `DashboardPage`.

**After all files created:** Run `pnpm exec playwright test e2e/login.spec.ts e2e/dashboard.spec.ts --reporter=list` (requires TEST_USERNAME and TEST_PASSWORD env vars set — source them from .env or export manually). Verify tests compile and at minimum the test structure parses correctly (tests may fail on actual assertions if no data exists — that's expected for this task; the goal is correct spec structure and locators).
  </action>

  <verify>
    <automated>
# Source test credentials (if .env exists with test vars)
export $(grep -v '^#' .env | grep TEST_ | xargs) 2>/dev/null || true

# Verify page object files compile
npx tsc --noEmit e2e/pages/LoginPage.ts e2e/pages/DashboardPage.ts --moduleResolution bundler --target ES2022 --module ESNext --strict --skipLibCheck --types node 2>&1

# Verify spec files compile
npx tsc --noEmit e2e/login.spec.ts e2e/dashboard.spec.ts --moduleResolution bundler --target ES2022 --module ESNext --strict --skipLibCheck --types node 2>&1

# Verify Playwright discovers the specs
pnpm exec playwright test e2e/login.spec.ts e2e/dashboard.spec.ts --list 2>&1

# TypeScript check on spec files (separate from main build)
npx tsc --noEmit -p e2e/tsconfig.json 2>&1 | head -20
    </automated>
  </verify>

  <acceptance_criteria>
    <done>
- `e2e/pages/LoginPage.ts` exists with `LoginPage` class exporting `goto`, `login`, `loginExpectFailure`, `getErrorMessage`, `isSessionExpiredBannerVisible`
- `e2e/pages/DashboardPage.ts` exists with `DashboardPage` class exporting `goto`, `waitForDashboardLoad`, `navigateTo`, `selectCamp`, `isNoCampSelectedVisible`, `getStockAlertCount`, `logout`
- All locators use `getByLabel`, `getByRole`, or `getByText` — zero CSS class selectors, zero `waitForTimeout` calls
- `e2e/login.spec.ts` has 4 test cases in `test.describe('Authentication')` block
- `e2e/dashboard.spec.ts` has 3 test cases in `test.describe('Dashboard')` block
- Both spec files import from `e2e/fixtures.ts` (not directly from page objects)
- `test.use({ storageState: undefined })` applied in `unauthenticated user` test case
- Spec files compile without TypeScript errors under e2e/tsconfig.json
- `pnpm exec playwright test --list` reports all 7 test cases discovered
    </done>
  </acceptance_criteria>
</task>

<task type="auto" tdd="false">
  <name>Task 3 (Wave 2): Feature E2E + CI — People, Resources, Inventory specs e integración continua</name>

  <read_first>
@.planning/phases/11-pruebas-autom-ticas/11-RESEARCH.md (lines 248-274, 380-448, 458-483)
@.planning/phases/11-pruebas-autom-ticas/11-PATTERNS.md (lines 259-288, 296-318, 396-421, 486-569)
@.github/workflows/ci.yml (full — lines 1-45)

PeopleListPage locators from PATTERNS.md lines 259-288 (PopulationRoster.tsx). ResourcesPage locators from PATTERNS.md lines 296-318 (ResourcesPage.tsx). Spec file templates from PATTERNS.md lines 396-421. CI workflow template from RESEARCH.md lines 386-448 and PATTERNS.md lines 486-569.
  </read_first>

  <files>
    - e2e/pages/PeopleListPage.ts (NEW)
    - e2e/pages/PersonDetailPage.ts (NEW)
    - e2e/pages/ResourcesPage.ts (NEW)
    - e2e/people.spec.ts (NEW)
    - e2e/resources.spec.ts (NEW)
    - e2e/inventory.spec.ts (NEW)
    - .github/workflows/ci.yml (MODIFY — add e2e job)
  </files>

  <action>
**Task 3 depends on Task 2** (page objects and spec patterns established; LoginPage available for per-spec auth in write tests).

### Phase A: Page Objects for Feature Pages

**Create e2e/pages/PeopleListPage.ts** — Page Object Model for `/population` (PopulationRoster page). Based on PATTERNS.md lines 259-288 with verified locators:

```typescript
import type { Page } from '@playwright/test';

export class PeopleListPage {
  constructor(private page: Page) {}

  async goto() { await this.page.goto('/population'); }

  async waitForLoad() {
    await this.page.waitForURL('/population');
    await this.page.getByText('Population Roster').waitFor({ state: 'visible', timeout: 15_000 });
  }

  async search(term: string) {
    await this.page.getByLabel('Search survivors').fill(term);
  }

  async filterByStatus(status: 'ALL' | 'HEALTHY' | 'SICK' | 'INJURED' | 'AWAY' | 'DEAD') {
    await this.page.getByRole('combobox').selectOption(status);
    // Wait for table to update after filter
    await this.page.waitForResponse(resp => resp.url().includes('/api-remote/people') && resp.status() === 200);
  }

  async clickPerson(name: string) {
    await this.page.getByRole('button', { name }).click();
    await this.page.waitForURL(/\/population\/\d+/);
  }

  async getPersonCount(): Promise<number> {
    const infoText = this.page.locator('text=/Showing.*on page/');
    const text = await infoText.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  async isPersonInList(name: string): Promise<boolean> {
    return this.page.getByText(name).first().isVisible();
  }

  async clickNewSurvivor() {
    await this.page.getByRole('button', { name: 'NEW SURVIVOR' }).click();
    await this.page.waitForURL(/\/population\/new/);
  }
}
```

Key locators (PATTERNS.md lines 263-286):
- Page title: `getByText('Population Roster')` (PopulationRoster.tsx line 396)
- Search input: `getByLabel('Search survivors')` (line 434)
- Status filter: `getByRole('combobox')` with options ALL/HEALTHY/SICK/INJURED/AWAY/DEAD (lines 439-453)
- Person name button: `getByRole('button', { name })` — navigates to /population/:id
- "NEW SURVIVOR" button: `getByRole('button', { name: 'NEW SURVIVOR' })` (line 409)
- Pagination info text pattern: `'Showing ... on page'` (PATTERNS.md lines 310-317)
- Use `waitForResponse` for filter operations to wait for API data refresh

**Create e2e/pages/PersonDetailPage.ts** — Page Object Model for `/population/:id`:

```typescript
import type { Page } from '@playwright/test';

export class PersonDetailPage {
  constructor(private page: Page) {}

  async waitForDetailLoad() {
    await this.page.waitForURL(/\/population\/\d+/);
    // Wait for person name heading to appear (details load asynchronously)
    await this.page.locator('h1').first().waitFor({ state: 'visible', timeout: 15_000 });
  }

  async getPersonName(): Promise<string | null> {
    return this.page.locator('h1').first().textContent();
  }

  async navigateBack() {
    await this.page.goBack();
    await this.page.waitForURL('/population');
  }
}
```

No full source analog was read for PersonDetail (PATTERNS.md line 294 notes the source wasn't fully mapped), so keep the page object minimal — waitForDetailLoad, getPersonName, navigateBack. Detail page interactions (status log, profession reassign, contributions) are deferred to future phases.

**Create e2e/pages/ResourcesPage.ts** — Page Object Model for `/resources`:

```typescript
import type { Page } from '@playwright/test';

export class ResourcesPage {
  constructor(private page: Page) {}

  async goto() { await this.page.goto('/resources'); }

  async waitForResourceList() {
    await this.page.waitForURL('/resources');
    // Wait for any resource item or empty state to render
    await this.page.waitForResponse(resp => resp.url().includes('/api-remote/resources') && resp.status() === 200);
  }

  async clickCreateResource() {
    // Create button uses Plus icon — locate by aria-label or role
    await this.page.getByRole('button', { name: /create|add|new/i }).click();
    // Wait for modal/form to appear (AnimatePresence)
    await this.page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 5_000 });
  }

  async isModalOpen(): Promise<boolean> {
    return this.page.locator('[role="dialog"]').isVisible();
  }
}
```

Key locators (PATTERNS.md lines 298-306):
- Resource list wait: `waitForResponse` on `/api-remote/resources`
- Create button: `getByRole('button', { name: /create|add|new/i })` — uses Plus icon (PATTERNS.md line 303)
- Modal: `[role="dialog"]` — AnimatePresence wraps modal content
- Action feedback: `ActionFeedbackDialog` component

### Phase B: Feature E2E Spec Files

**Create e2e/people.spec.ts** — People CRUD E2E spec. Follow template from PATTERNS.md lines 396-421 with the PeopleListPage + PersonDetailPage POMs:

Four test cases in `test.describe('People CRUD')`:
1. `test('people list loads with title and search')` — uses `PeopleListPage.goto()` + `waitForLoad()`, asserts title and search input visible
2. `test('search filters the people table')` — searches for a term, asserts `waitForResponse` on people API call
3. `test('person detail navigates from list')` — clicks a person name, asserts URL matches `/population/:id` and `PersonDetailPage.getPersonName()` returns non-null
4. `test('pagination info displays count')` — asserts `PeopleListPage.getPersonCount()` returns a number > 0

Import from `e2e/fixtures.ts`: `test`, `expect`, `PeopleListPage`, `PersonDetailPage`.

**Create e2e/resources.spec.ts** — Resources CRUD E2E spec:

Three test cases in `test.describe('Resources CRUD')`:
1. `test('resources list loads')` — uses `ResourcesPage.goto()` + `waitForResourceList()`, asserts page URL is `/resources`
2. `test('create resource modal opens')` — uses `ResourcesPage.clickCreateResource()`, asserts `ResourcesPage.isModalOpen()` returns true
3. `test('resource list displays items or empty state')` — asserts page content is not blank (either resource items render or empty state message appears)

Import from `e2e/fixtures.ts`: `test`, `expect`, `ResourcesPage`.

**Create e2e/inventory.spec.ts** — Inventory E2E spec:

Three test cases in `test.describe('Inventory')`:
1. `test('inventory list page loads')` — `page.goto('/inventory')`, waits for URL and API response to `/api-remote/inventory`
2. `test('stock alert indicators are visible')` — asserts `getByText(/CRITICAL STOCK:|LOW STOCK:/)` has count > 0 or the page renders normally if no alerts exist (use `expect.soft()` for alert assertions to avoid false failures when inventory is clean)
3. `test('audit trail page loads read-only')` — `page.goto('/inventory/audit')`, waits for URL, asserts page renders audit event list or empty state

Import from `e2e/fixtures.ts`: `test`, `expect`.

**Design principle for all feature specs:** Tests should be read-only where possible. Do not create test data in this initial phase — assert page renders, navigation works, components appear. Write tests (create/delete resources, create person) are deferred per RESEARCH.md Open Question 1 recommendation (line 600: "Start with read-only tests").

### Phase C: CI Integration

**Update .github/workflows/ci.yml** — add a separate `e2e` job after the existing `check` job. Follow RESEARCH.md lines 386-448 and the exact inline YAML structure from PATTERNS.md lines 486-569:

The existing workflow has:
- `on.push.branches: [main, dev]`, `on.pull_request.branches: [main, dev]`
- `concurrency` block (keep as-is)
- Single `check` job (keep as-is)

Add after the `check` job (same indentation level):

```yaml
  e2e:
    name: E2E Tests (Playwright)
    needs: check
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

Key CI decisions (RESEARCH.md lines 450-455):
- `needs: check` — E2E only runs if lint/format/typecheck/build pass
- `npx playwright install --with-deps chromium` — Only Chromium, not full browser suite
- `CI: 'true'` in env — triggers `forbidOnly`, 2 retries, 1 worker
- Artifacts: HTML report always uploaded unless cancelled; failure traces only on failure
- GitHub Secrets: `TEST_USERNAME` and `TEST_PASSWORD` must be added to repo (documented in .env.test.example, not handled by task)

**After all files created and CI workflow updated:**
- Run `pnpm exec playwright test --list` to verify all 5 spec files (login, dashboard, people, resources, inventory) are discovered (expect ~17 test cases total)
- Run `pnpm exec playwright test --reporter=list 2>&1 | tail -30` (requires test credentials in env) to execute the full suite and verify no Playwright infrastructure errors
- Run `pnpm run typecheck` to confirm no regressions in main TypeScript build
- Verify the CI YAML is valid by checking syntax: the GitHub Actions YAML structure matches the existing workflow patterns
  </action>

  <verify>
    <automated>
# Source test credentials if available
export $(grep -v '^#' .env | grep TEST_ | xargs) 2>/dev/null || true

# Verify all page object files compile
npx tsc --noEmit e2e/pages/PeopleListPage.ts e2e/pages/PersonDetailPage.ts e2e/pages/ResourcesPage.ts --moduleResolution bundler --target ES2022 --module ESNext --strict --skipLibCheck --types node 2>&1

# Verify all spec files compile
npx tsc --noEmit e2e/people.spec.ts e2e/resources.spec.ts e2e/inventory.spec.ts --moduleResolution bundler --target ES2022 --module ESNext --strict --skipLibCheck --types node 2>&1

# Full e2e typecheck
npx tsc --noEmit -p e2e/tsconfig.json 2>&1 | head -20

# Verify all specs discovered
pnpm exec playwright test --list 2>&1

# Verify main typecheck still passes
pnpm run typecheck 2>&1

# Run full E2E suite (if credentials available)
pnpm exec playwright test --reporter=list 2>&1 | tail -30 || true
    </automated>
  </verify>

  <acceptance_criteria>
    <done>
- `e2e/pages/PeopleListPage.ts` exists with `PeopleListPage` class exporting `goto`, `waitForLoad`, `search`, `filterByStatus`, `clickPerson`, `getPersonCount`, `isPersonInList`, `clickNewSurvivor`
- `e2e/pages/PersonDetailPage.ts` exists with `PersonDetailPage` class exporting `waitForDetailLoad`, `getPersonName`, `navigateBack`
- `e2e/pages/ResourcesPage.ts` exists with `ResourcesPage` class exporting `goto`, `waitForResourceList`, `clickCreateResource`, `isModalOpen`
- `e2e/people.spec.ts` has 4 test cases in `test.describe('People CRUD')`
- `e2e/resources.spec.ts` has 3 test cases in `test.describe('Resources CRUD')`
- `e2e/inventory.spec.ts` has 3 test cases in `test.describe('Inventory')`
- All specs use read-only assertions — no test data creation
- `.github/workflows/ci.yml` has new `e2e` job with `needs: check`, Playwright browser install, artifact upload
- `pnpm exec playwright test --list` discovers all 5 spec files (login, dashboard, people, resources, inventory) — ~17 test cases total
- `pnpm run typecheck` still passes with zero errors
- Full e2e TypeScript config: `npx tsc --noEmit -p e2e/tsconfig.json` passes
    </done>
  </acceptance_criteria>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| CI secrets → test runner | Environment variables (TEST_USERNAME, TEST_PASSWORD) passed from GitHub Secrets to Playwright process |
| Test runner → Vite dev server | Playwright browser connects to localhost:5173; server runs in same CI container |
| Vite dev server → Railway backend | API proxy `/api-remote/*` forwards requests to production backend |
| Test output → CI artifacts | playwright-report/ and test-results/ uploaded to GitHub Actions artifacts; may contain traces/videos with auth tokens |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-11-01 | Information Disclosure | Test credentials | mitigate | Use `process.env.TEST_USERNAME`/`TEST_PASSWORD` from CI GitHub Secrets — never hardcode in source. `.env.test.example` documents vars without real values. `.gitignore` pattern `.env*` prevents accidental commit of `.env.test` file. |
| T-11-02 | Information Disclosure | JWT tokens in reports | mitigate | Traces captured `'only-on-failure'` and `'on-first-retry'`. Screenshots `'only-on-failure'`. HTML report artifact retained 14 days in CI. No persistent storage of auth data beyond CI lifecycle. For future hardening: add `storageState` path to `.gitignore` (already done). |
| T-11-03 | Spoofing | Stale auth state | mitigate | auth.setup.ts runs fresh login per test run. `e2e/.auth/` directory gitignored. If auth fails, setup project fails first (dependencies: ['setup']) — no tests execute, clear signal. Playwright config has `retries: 2` in CI for transient auth failures. |
| T-11-04 | Tampering | Test data on production | mitigate | Tests run against Railway production backend by default (dev convenience). CI E2E job uses dedicated `TEST_USERNAME` GitHub Secret. All Phase 11 spec tests are read-only — no data mutation. Write tests deferred to future phase per RESEARCH.md Open Question 1. If production data mutation is a concern, override `TEST_BASE_URL` to staging in CI. |
| T-11-05 | Elevation of Privilege | Test user permissions | mitigate | Document in `.env.test.example` that `TEST_USERNAME` should be a `system_admin` account with full permissions for complete coverage. Tests that rely on specific permissions (e.g., `NEW SURVIVOR` button requires `people.create`) will fail gracefully if the test user lacks them — the assertion checks visibility, not interaction. |
| T-11-06 | Denial of Service | CI resource exhaustion | accept | `timeout-minutes: 10` caps CI job runtime. `concurrency.cancel-in-progress: true` prevents queue buildup. `needs: check` prevents E2E from running on broken builds. Playwright `workers: 1` in CI prevents parallelism spikes. Accept residual risk — 10 minutes of CI time per push is acceptable for E2E coverage. |
| T-11-SC | Tampering | npm install (supply chain) | mitigate | `@playwright/test` package passes Package Legitimacy Audit (RESEARCH.md lines 64-70): npm registry, 5+ years, 15M+ weekly downloads, Microsoft GitHub repo, slopcheck [OK]. `pnpm install --frozen-lockfile` in CI enforces lockfile integrity. No additional packages needed — all other deps already installed and audited. |
</threat_model>

<verification>
## Phase 11 Verification

After all 3 tasks complete, run the full verification:

```bash
# 1. Verify all infrastructure files exist
ls -la playwright.config.ts e2e/tsconfig.json e2e/auth.setup.ts e2e/fixtures.ts .env.test.example

# 2. Verify all page objects exist
ls -la e2e/pages/LoginPage.ts e2e/pages/DashboardPage.ts e2e/pages/PeopleListPage.ts e2e/pages/PersonDetailPage.ts e2e/pages/ResourcesPage.ts

# 3. Verify all spec files exist
ls -la e2e/login.spec.ts e2e/dashboard.spec.ts e2e/people.spec.ts e2e/resources.spec.ts e2e/inventory.spec.ts

# 4. Verify package.json has test scripts
grep -c '"test:e2e"' package.json

# 5. Verify .gitignore has Playwright entries
grep -c 'e2e/.auth/' .gitignore

# 6. Verify CI workflow has e2e job
grep -c 'name: E2E Tests' .github/workflows/ci.yml

# 7. TypeScript compilation check
npx tsc --noEmit -p e2e/tsconfig.json

# 8. Main TypeScript build check
pnpm run typecheck

# 9. Lint check
pnpm run lint

# 10. Playwright test discovery
pnpm exec playwright test --list

# 11. Full E2E suite run (requires credentials)
pnpm exec playwright test --reporter=list 2>&1 | tail -20
```
</verification>

<success_criteria>
## Phase 11 Success Criteria

After all tasks complete:

1. **Infrastructure exists:** `playwright.config.ts`, `e2e/tsconfig.json`, `e2e/auth.setup.ts`, `e2e/fixtures.ts`, `.env.test.example` all present and valid
2. **5 Page Object Models created:** LoginPage, DashboardPage, PeopleListPage, PersonDetailPage, ResourcesPage — all using `getByLabel`/`getByRole`/`getByText` locators (zero CSS selectors, zero `waitForTimeout`)
3. **5 E2E spec files:** login.spec.ts (4 tests), dashboard.spec.ts (3 tests), people.spec.ts (4 tests), resources.spec.ts (3 tests), inventory.spec.ts (3 tests) — total 17 test cases covering all critical flows from RESEARCH.md Priority 1-3
4. **CI integration:** `.github/workflows/ci.yml` has `e2e` job with `needs: check`, browser install, artifact upload, and GitHub Secrets integration
5. **Package scripts:** `pnpm run test:e2e`, `pnpm run test:e2e:ui`, `pnpm run test:e2e:debug`, `pnpm run test:e2e:headed` all functional
6. **No regressions:** `pnpm run typecheck` and `pnpm run lint` pass with zero errors
7. **Git hygiene:** `e2e/.auth/`, `playwright-report/`, `test-results/` gitignored; `.env.test` never committed
8. **Auth reuse works:** `e2e/auth.setup.ts` authenticates via `storageState` pattern — no per-test login in authenticated specs
9. **Read-only tests:** All Phase 11 tests assert page loads, navigation, and component rendering — no data mutation against production backend
</success_criteria>

<output>
Create `.planning/phases/11-pruebas-autom-ticas/11-01-SUMMARY.md` when done
</output>
