# Phase 11: Pruebas automáticas — Pattern Map

**Mapped:** 2026-06-08
**Files analyzed:** 19 (9 new files, 3 modified files, 7 source pages as analogs)
**Analogs found:** 14 / 16 classified items

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `playwright.config.ts` | config | CRUD (config) | `vite.config.ts` | exact (project config) |
| `e2e/tsconfig.json` | config | CRUD (config) | `tsconfig.json` | exact (TS config) |
| `e2e/auth.setup.ts` | fixture/setup | event-driven | `src/store/auth.ts` | role-match (auth logic) |
| `e2e/fixtures.ts` | fixture | CRUD | — | no analog (new pattern) |
| `e2e/pages/LoginPage.ts` | page-object | request-response | `src/features/auth/LoginPage.tsx` | role-match (page structure) |
| `e2e/pages/DashboardPage.ts` | page-object | request-response | `src/features/dashboard/DashboardOverview.tsx` | role-match (page structure) |
| `e2e/pages/PeopleListPage.ts` | page-object | request-response | `src/features/people/PopulationRoster.tsx` | role-match (page structure) |
| `e2e/pages/PersonDetailPage.ts` | page-object | request-response | `src/features/people/PersonDetail.tsx` | role-match (page structure) |
| `e2e/pages/ResourcesPage.ts` | page-object | request-response | `src/features/resources/ResourcesPage.tsx` | role-match (page structure) |
| `e2e/login.spec.ts` | test | request-response | — | no analog (first test file) |
| `e2e/dashboard.spec.ts` | test | request-response | — | no analog (first test file) |
| `e2e/people.spec.ts` | test | request-response | — | no analog (first test file) |
| `e2e/resources.spec.ts` | test | request-response | — | no analog (first test file) |
| `e2e/inventory.spec.ts` | test | request-response | — | no analog (first test file) |
| `.env.test.example` | config | CRUD (config) | `.env.example` | exact (env doc) |
| `package.json` (modify) | config | CRUD (config) | existing `package.json` | exact (config edit) |
| `.github/workflows/ci.yml` (modify) | config | event-driven (CI) | existing `ci.yml` | exact (workflow edit) |
| `.gitignore` (modify) | config | CRUD (config) | existing `.gitignore` | exact (config edit) |

## Pattern Assignments

### `playwright.config.ts` (config, CRUD)

**Analog:** `vite.config.ts`

**Imports pattern** (vite.config.ts lines 1-4):
```typescript
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
```

**Analog pattern to follow for playwright.config.ts** (RESEARCH.md lines 278-320 - reference pattern, adapt to project style):
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

**Key config conventions from project:**
- TypeScript module system: `"type": "module"` in `package.json` (line 10)
- Prettier config: semi=true, singleQuote=true, trailingComma=all (`.prettierrc`)
- ESLint already ignores `e2e/` directory (eslint.config.js line 10)

---

### `e2e/tsconfig.json` (config, CRUD)

**Analog:** `tsconfig.json` (root)

**Imports/extends pattern** (tsconfig.json lines 1-22):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "strict": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowJs": true,
    "paths": {
      "@/*": ["./*"]
    },
    "allowImportingTsExtensions": true,
    "noEmit": true
  },
  "exclude": ["legacy", "node_modules", "dist"]
}
```

**e2e tsconfig pattern** (RESEARCH.md lines 360-368):
```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "types": ["node"]
  },
  "include": ["**/*.ts"]
}
```

Extends root config, adds `node` types (for `process.env`, `__dirname`, `path`).

---

### `e2e/auth.setup.ts` (fixture/setup, event-driven)

**Analog:** `src/store/auth.ts` (auth logic flow)

**Auth login pattern from source** (LoginPage.tsx lines 42-60):
```typescript
const onSubmit = async (data: LoginForm) => {
  setIsLoading(true);
  setError(null);
  try {
    const res = await apiClient.post('/auth/login', data);
    setAuth(res.data.user, res.data.token);
    navigate('/dashboard');
  } catch (err) {
    const authError = err as {
      response?: { data?: { error?: { message?: string } } };
    };
    const message = err instanceof Error ? err.message : authError.response?.data?.error?.message;
    setError(message || 'Authentication failed. Check credentials.');
  } finally {
    setIsLoading(false);
  }
};
```

**Key UI locators from LoginPage.tsx:**
- Username input: `aria-label="Username"` (line 128)
- Password input: `aria-label="Password"` (line 146)
- Submit button text: `'REQUEST AUTHORIZATION'` (line 172)
- Loading text: `'AUTHORIZING...'` (line 172)
- Error container: error rendered inside `<motion.div>` with `className` includes `bg-red-950/20` (line 110)
- Session expired banner text: `'Session Terminated'` (line 94)

**Auth setup pattern** (RESEARCH.md lines 344-357):
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

---

### `e2e/pages/LoginPage.ts` (page-object, request-response)

**Analog:** `src/features/auth/LoginPage.tsx` (source component)

**Page object patterns to follow from RESEARCH.md (lines 139-156):**
```typescript
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

**Source page locators (from LoginPage.tsx):**
| Element | Selector Strategy | Source Reference |
|---------|------------------|------------------|
| Username field | `getByLabel('Username')` | line 128: `aria-label="Username"` |
| Password field | `getByLabel('Password')` | line 146: `aria-label="Password"` |
| Submit button | `getByRole('button', { name: 'REQUEST AUTHORIZATION' })` | line 170-173: button text |
| Error message | `getByText()` — error text | line 113: `<p className="text-sm text-red-500 font-medium">{error}</p>` |
| Session banner | `getByText('Session Terminated')` | line 94 |

**Page object additional helpers to derive from source:**
- `async getErrorMessage()` → returns error message text if visible
- `async isSessionExpiredBannerVisible()` → checks for session banner
- `async loginWithBadCredentials(username, password)` → expects no redirect

---

### `e2e/pages/DashboardPage.ts` (page-object, request-response)

**Analog:** `src/features/dashboard/DashboardOverview.tsx`

**Key locators from DashboardOverview.tsx:**
- Dashboard title: `<h1>` with profile.title (line 442-443) — value varies by role
- Stat cards: `.grid > div` children with stat data (lines 458-562)
- "No Refuge Selected" heading: `getByText('No Refuge Selected')` (line 333)
- Chart area: Recharts `BarChart` with stock data (lines 617-666)
- Navigation sidebar: Dock component in `DashboardLayout.tsx` with `aria-label="Main navigation"` (Dock.tsx line 257)

**From DashboardLayout.tsx (navigation + alerts):**
- Logout button: `aria-label="Terminate Session"` (line 531)
- Camp selector: `aria-label` containing `'Current refuge:'` or `'Select refuge'` (lines 478-485)
- Stock alert banner: `getByText('CRITICAL STOCK:')` (line 978) or `getByText('LOW STOCK:')` (line 995)
- Dismiss alert button: `getByText('Dismiss')` (line 983)
- Logout confirm: buttons `'NO, STAY'` and `'YES, SIGN OUT'` (lines 573-583)

**Page object to implement:**
- `async goto()` → `this.page.goto('/dashboard')`
- `async waitForDashboardLoad()` → `this.page.waitForURL('/dashboard')`
- `async getStatCardValue(label: string)` → locator by stat label text
- `async selectCamp(campName: string)` → click camp selector, navigate popup
- `async navigateTo(section: string)` → click dock item by aria-label
- `async isNoCampSelectedVisible()` → check "No Refuge Selected"
- `async getStockAlertCount()` → parse stock alert numbers
- `async logout()` → click logout, confirm

---

### `e2e/pages/PeopleListPage.ts` (page-object, request-response)

**Analog:** `src/features/people/PopulationRoster.tsx`

**Key locators from PopulationRoster.tsx:**
- Page title: `getByText('Population Roster')` (line 396)
- New survivor button: `getByText('NEW SURVIVOR')` (line 409) — only if `people.create` permission
- Register intake button: `getByText('REGISTER INTAKE')` (line 417)
- Search input: `aria-label="Search survivors"` (line 434)
- Status filter: `<select>` with options ALL/HEALTHY/SICK/INJURED/AWAY/DEAD (lines 439-453)
- Survivor table rows: `<table>` with person rows (lines 490-709)
- Person name links: `<button>` that navigates to `/population/:id` (line 576)
- Edit button: `aria-label={`Edit ${person.full_name}`}` (line 686)
- Delete button: `aria-label={`Delete ${person.full_name}`}` (line 696)
- Transfer button: `aria-label={`Transfer ${person.full_name}`}` (line 676)
- Pagination: `<Pagination>` component (line 1066)
- "No personnel records found." — empty state (line 568)
- Profession shortfall alert: `getByText('PROFESSION SHORTFALL DETECTED')` (line 468)
- Edit modal: form within modal with inputs (lines 814-906)
- Confirm delete: `ConfirmDialog` component (lines 913-928)

**Page object helpers:**
- `async search(term: string)` → fill search input
- `async filterByStatus(status: string)` → select status filter
- `async clickPerson(name: string)` → click person name link
- `async clickNewSurvivor()` → click NEW SURVIVOR button
- `async isPersonInList(name: string)` → check table for name
- `async getPersonCount()` → read total from pagination info

---

### `e2e/pages/PersonDetailPage.ts` (page-object, request-response)

**Analog:** `src/features/people/PersonDetail.tsx`

(PersonDetail.tsx not fully read — page object will model locators from its source)

---

### `e2e/pages/ResourcesPage.ts` (page-object, request-response)

**Analog:** `src/features/resources/ResourcesPage.tsx`

**Key locators from ResourcesPage.tsx (lines 1-80):**
- Resources listed with pagination (Pagination component)
- Create/Edit/Delete actions with icons: `Package`, `Plus`, `Edit2`, `Trash2`
- Modals for create/edit via `AnimatePresence`
- Action feedback: `ActionFeedbackDialog` component

**Pagination pattern** (from PopulationRoster.tsx lines 1061-1067, shared component):
```typescript
// Page info pattern
<p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
  {personnelCountLabel}: {personnelCount} · Showing {paginatedSurvivors.length} on page{' '}
  {currentPage} of {totalPages}
</p>
<Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
```

---

### `e2e/login.spec.ts` (test, request-response)

**No existing test analog in the project.**
Pattern from RESEARCH.md (standard Playwright spec structure):

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test.describe('Authentication', () => {
  test('login success redirects to dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(process.env.TEST_USERNAME!, process.env.TEST_PASSWORD!);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('login with bad credentials shows error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('invalid_user', 'wrong_password');
    const error = page.getByText(/Authentication failed/i);
    await expect(error).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('session expired banner appears when redirected from timeout', async ({ page }) => {
    // Set localStorage flag before navigation
    await page.goto('/login');
    await page.evaluate(() => localStorage.setItem('session_expired', 'true'));
    await page.reload();
    await expect(page.getByText('Session Terminated')).toBeVisible();
  });

  test('unauthenticated user redirected to login', async ({ page }) => {
    // Clear storageState by starting a new context without auth
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
```

---

### `e2e/dashboard.spec.ts` (test, request-response)

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

test.describe('Dashboard', () => {
  test('dashboard loads with stat cards', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(process.env.TEST_USERNAME!, process.env.TEST_PASSWORD!);
    
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.waitForDashboardLoad();
    
    // Verify dashboard is loaded (stat cards present)
    await expect(page.getByText('Survivors')).toBeVisible();
    await expect(page.getByText('Stock Alerts')).toBeVisible();
  });

  test('navigation opens population page', async ({ page }) => {
    // Logged in via storageState
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Population' }).click();
    await expect(page).toHaveURL(/\/population/);
  });
});
```

---

### `e2e/people.spec.ts` (test, request-response)

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { PeopleListPage } from './pages/PeopleListPage';

test.describe('People CRUD', () => {
  test('people list loads with search', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(process.env.TEST_USERNAME!, process.env.TEST_PASSWORD!);
    
    const peoplePage = new PeopleListPage(page);
    await page.goto('/population');
    await expect(page.getByText('Population Roster')).toBeVisible();
    await expect(page.getByLabel('Search survivors')).toBeVisible();
  });

  test('search filters the people table', async ({ page }) => {
    await page.goto('/population');
    await page.getByLabel('Search survivors').fill('test');
    // Verify table row count updates — implementation varies by data availability
  });
});
```

---

### `.env.test.example` (config, CRUD)

**Analog:** `.env.example` (lines 1-9)

**Existing env file structure:**
```
# GEMINI_API_KEY: Required for Gemini AI API calls.
# AI Studio automatically injects this at runtime from user secrets.
# Users configure this via the Secrets panel in the AI Studio UI.
GEMINI_API_KEY="MY_GEMINI_API_KEY"

# APP_URL: The URL where this applet is hosted.
# AI Studio automatically injects this at runtime with the Cloud Run service URL.
# Used for self-referential links, OAuth callbacks, and API endpoints.
APP_URL="MY_APP_URL"
```

**Pattern for new env file:**
```
# E2E Test Credentials (never commit real values)
TEST_USERNAME="test_admin"
TEST_PASSWORD="test_password"

# Override base URL for CI
# TEST_BASE_URL="https://staging.example.com"
```

---

### `package.json` (modify — config, CRUD)

**Analog:** Existing `package.json` scripts block (lines 11-24)

**Existing scripts pattern:**
```json
"scripts": {
  "dev": "vite",
  "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
  "start": "node dist/server.cjs",
  "preview": "vite preview",
  "clean": "rm -rf dist",
  "format": "prettier --write src/",
  "format:check": "prettier --check src/",
  "lint": "eslint . --max-warnings 0",
  "lint:fix": "eslint . --fix",
  "typecheck": "tsc --noEmit",
  "spell": "cspell src/",
  "check": "pnpm run lint && pnpm run spell && pnpm run build"
}
```

**Scripts to add (from RESEARCH.md lines 324-332):**
```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"test:e2e:debug": "playwright test --debug",
"test:e2e:headed": "playwright test --headed"
```

---

### `.github/workflows/ci.yml` (modify — config, event-driven)

**Analog:** existing `.github/workflows/ci.yml` (lines 1-45)

**Existing workflow structure (single `check` job):**
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
      - name: Lint
        run: pnpm run lint
      - name: Format check
        run: pnpm run format:check
      - name: Type check
        run: pnpm run typecheck
      - name: Spell check
        run: pnpm run spell
      - name: Build
        run: pnpm run build
```

**E2E job to append** (from RESEARCH.md lines 386-448):
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

---

### `.gitignore` (modify — config, CRUD)

**Analog:** existing `.gitignore` (lines 1-21)

**Existing entries pattern:**
```
node_modules/
build/
dist/
coverage/
.DS_Store
*.log
.env*
!.env.example
legacy/
.idea/
...
```

**Playwright entries to append** (from RESEARCH.md lines 336-340):
```
# Playwright
e2e/.auth/
playwright-report/
test-results/
```

---

## Shared Patterns

### Authentication (storageState)
**Source:** RESEARCH.md auth.setup.ts (lines 344-357) + LoginPage.tsx
**Apply to:** All e2e test specs

The login button uses role `button` with name `'REQUEST AUTHORIZATION'`. The loading state shows `'AUTHORIZING...'`. After successful login, the URL changes to `/dashboard`. The auth state is saved as `e2e/.auth/user.json` and reused via `storageState` in playwright.config.ts projects config.

### Locator Strategy
**Source:** Source page components
**Apply to:** All page objects

All interactive elements in the project use `aria-label` attributes — always prefer `getByLabel()` or `getByRole()` for locators. Examples from source:
- `aria-label="Username"` (LoginPage.tsx:128)
- `aria-label="Password"` (LoginPage.tsx:146)
- `aria-label="Search survivors"` (PopulationRoster.tsx:434)
- `aria-label="Sign in"` (LoginPage.tsx:164)
- `aria-label="Terminate Session"` (DashboardLayout.tsx:531)
- `aria-label="Toggle filters"` (PopulationRoster.tsx:456)
- Navigation dock has `role="toolbar"` with `aria-label="Main navigation"` (Dock.tsx:256-258)
- Each dock item has `aria-label={label}` (Dock.tsx:82)

### Web-First Assertions
**Apply to:** All e2e test specs
- Never use `page.waitForTimeout(N)` — use `toBeVisible()`, `waitForURL()`, `waitForResponse()`
- Use `expect(page).toHaveURL()` for route assertions
- Use `expect(locator).toBeVisible()` for element visibility
- Use `page.waitForURL()` after navigation (app uses React.lazy + Suspense)

### Component Reuse (ActionFeedbackDialog)
**Source:** `src/components/ActionFeedbackDialog.tsx`
**Apply to:** People, Resources, Inventory tests

All CRUD operations show success/error feedback via `ActionFeedbackDialog`. Tests should wait for this dialog to appear after mutations.

### API Call Waiting
**Source:** All feature components use @tanstack/react-query
**Apply to:** All e2e test specs

Use `page.waitForResponse()` pattern to wait for specific API calls:
```typescript
await page.waitForResponse(response => 
  response.url().includes('/api-remote/camps/') && response.status() === 200
);
```

## No Analog Found

Files with no close match in the codebase (planner should use RESEARCH.md and Playwright official docs as patterns):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `e2e/fixtures.ts` | fixture | CRUD | No test fixtures exist anywhere in project — new pattern |
| `e2e/login.spec.ts` | test | request-response | No test files exist anywhere in project — first tests |
| `e2e/dashboard.spec.ts` | test | request-response | No test files exist — first tests |
| `e2e/people.spec.ts` | test | request-response | No test files exist — first tests |
| `e2e/resources.spec.ts` | test | request-response | No test files exist — first tests |
| `e2e/inventory.spec.ts` | test | request-response | No test files exist — first tests |

**For all no-analog files:** Use patterns from RESEARCH.md Section "Recommended Setup" (lines 277-368) which provides the canonical Playwright patterns. The Page Object Model structure follows RESEARCH.md lines 134-156. Test structure follows standard `@playwright/test` conventions as documented in the official Playwright docs.

## Metadata

**Analog search scope:** `/src`, `/src/features/*/`, `/src/components/`, `/src/store/`, `/src/layouts/`, `/src/lib/`
**Files scanned:** 35+ (all feature pages, layouts, stores, config files, CI workflow)
**Pattern extraction date:** 2026-06-08
**Key constraint:** Zero existing test infrastructure — all test patterns are new. Analogs come from source components (for locators), project configs (for config style), and RESEARCH.md (for Playwright-specific patterns).
