# Testing Patterns

**Analysis Date:** 2026-05-19

## Current State

**No test infrastructure exists.** This codebase has zero test files, no test runner configuration, and no testing dependencies installed.

### What's Missing

| Layer          | Required (RNF-05)                       | Current                                 |
| -------------- | --------------------------------------- | --------------------------------------- |
| Test framework | Playwright for E2E                      | Not configured                          |
| Unit tests     | Not specified, but expected for quality | No vitest/jest config                   |
| CI pipeline    | Tests run automatically in CI           | No `.github/workflows/*.yml` found      |
| Test files     | Covering critical flows                 | No `*.test.*` or `*.spec.*` files exist |

### Verification

```bash
# No test files of any kind
find src/ -name "*.test.*" -o -name "*.spec.*" -o -name "*.e2e.*"
# → No results

# No test config files
ls vitest.config.* playwright.config.* jest.config.* 2>/dev/null
# → No results

# No CI workflows
ls .github/workflows/*.yml 2>/dev/null
# → No results

# No test directories
ls -d e2e/ tests/ __tests__/ 2>/dev/null
# → No results
```

### Package.json — No Test Dependencies

The `package.json` contains **no test-related packages**:

- No `@playwright/test`
- No `vitest`
- No `@testing-library/react`
- No `@testing-library/jest-dom`
- No `jest`
- No `@vitest/coverage-v8`

The only quality-related devDependencies are `eslint`, `prettier`, and `cspell`.

### Current Quality Gate

The `pnpm check` command runs:

```bash
pnpm run lint && pnpm run spell && pnpm run build
```

This verifies ESLint (passing), CSpell (clean), and TypeScript compilation (succeeds) — but has **no test step**.

## Test Framework (Planned — Playwright E2E)

**Runner:** Playwright (per requirement RNF-05 in `requerimientos-frontend.md`)

- Config: Needs `playwright.config.ts` at repo root
- Not yet configured

**Critical flows to test (RNF-05 requires E2E coverage):**

1. **Authentication flow:** Login → authenticated state → session timeout → re-auth
2. **Role-based access:** Different roles see different nav items / pages
3. **Camp CRUD:** Create camp → view list → view detail → update → delete
4. **Person admission:** Fill admission form → submit → AI decision → accept/correct
5. **Inventory management:** View inventory → manual adjustment → verify audit log
6. **Camp transfers:** Create transfer → approve → verify both camps' inventory
7. **Multi-camp switching:** Select different camp → data changes → session reset

## Test Commands (Recommended Setup)

Once configured, add to `package.json` scripts:

```json
{
  "test": "playwright test",
  "test:ui": "playwright test --ui",
  "test:headed": "playwright test --headed",
  "test:e2e": "playwright test --project=chromium",
  "test:report": "playwright show-report"
}
```

## Test File Organization (Recommended)

**Suggested structure:**

```
e2e/
├── fixtures/           # Shared test fixtures (auth state, test data)
│   └── auth.setup.ts
├── specs/              # Test specifications by domain
│   ├── auth.spec.ts
│   ├── camps.spec.ts
│   ├── people.spec.ts
│   ├── inventory.spec.ts
│   ├── transfers.spec.ts
│   └── roles.spec.ts
├── pages/              # Page Object Models
│   ├── login.page.ts
│   ├── dashboard.page.ts
│   ├── camps.page.ts
│   └── inventory.page.ts
└── utils/              # Test utilities
    └── helpers.ts
```

## CI Integration (Recommended)

Add a GitHub Actions workflow (`.github/workflows/playwright.yml`) that:

1. Checks out code
2. Sets up Node.js + pnpm
3. Installs dependencies
4. Starts the dev server
5. Runs `playwright test` against it
6. Uploads test reports on failure

Example trigger: on push/PR to main, on schedule (nightly).

## Coverage Goals (Recommended)

**Per RNF-05 requirement:**

- Cover all critical user flows (authentication, camp management, inventory, transfers, admissions)
- Verify role-based access control on every protected route
- Test error states (network failures, invalid inputs, empty states)
- Test the session timeout and re-authentication flow
- Test multi-camp switching behavior

**Target metrics (suggested):**

- E2E coverage of all 10 functional requirements (RF-01 through RF-09 + RF-10)
- Smoke test suite: < 5 minutes for CI
- Full suite: < 15 minutes

---

_Testing analysis: 2026-05-19_
