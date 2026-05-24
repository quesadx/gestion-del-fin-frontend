# Testing Patterns

**Analysis Date:** 2026-05-24

## Test Framework

**Status:** No test framework is configured.

**Runner:**
- No `vitest.config.*`, `jest.config.*`, or any test runner configuration detected
- `package.json` contains no test-related scripts or dependencies (no `vitest`, `jest`, `@testing-library/*`, `playwright`, `cypress`)

**Assertion Library:**
- Not configured — no assertion library detected

**Run Commands:**
```bash
# No test commands available
```

## Test File Organization

**Status:** No test files exist anywhere in the repository.

**Search performed:**
- `**/*.test.{ts,tsx,js,jsx}` — no matches
- `**/*.spec.{ts,tsx,js,jsx}` — no matches
- `**/__tests__/**` — no matches

## Test Structure

**Not applicable** — no tests exist to analyze.

## Mocking

**Status:** No mocking framework configured.

The codebase has several external dependencies that would need mocking in tests:
- `@tanstack/react-query` (queries and mutations)
- `axios` / `apiClient` (HTTP requests)
- `react-router-dom` (navigation, routing)
- `zustand` (state stores)
- `motion/react` (animations)
- `react-hook-form` (form state)
- `lucide-react` (icons)

## Fixtures and Factories

**Status:** No test fixtures or factory files exist.

The codebase uses these in-memory patterns that could be extracted into factories:
- Mock data in `server.ts` lines 12–46 (in-memory arrays for `survivors`, `camps`, `resources`, `inventory`, `admissions`, `expeditions`)
- `src/types.ts` provides TypeScript interfaces that could serve as factory contracts

## Coverage

**Status:** Not configured — no coverage tooling.

**Requirements:** No coverage thresholds enforced.

**View Coverage:**
```bash
# No coverage command available
```

## Test Types

**Unit Tests:**
- Not present. Components like `src/components/Skeleton.tsx` and utilities like `src/lib/utils.ts` (pure functions: `cn`, `formatDate`, `formatQuantity`) are the best candidates for initial unit test coverage.

**Integration Tests:**
- Not present. The `useQuery` + `useMutation` data flows in feature components would benefit from integration tests with mocked API responses.

**E2E Tests:**
- Not present. No Playwright, Cypress, or Selenium configuration detected.

## Recommended Testing Setup

**Immediate actions to enable testing:**

1. **Add test runner:**
   ```bash
   npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
   ```

2. **Add vitest config** (`vitest.config.ts`):
   ```typescript
   import { defineConfig } from 'vitest/config';
   import path from 'path';

   export default defineConfig({
     test: {
       environment: 'jsdom',
       globals: true,
       setupFiles: ['./src/test-setup.ts'],
     },
     resolve: {
       alias: {
         '@': path.resolve(__dirname, '.'),
       },
     },
   });
   ```

3. **Add test scripts** to `package.json`:
   ```json
   "test": "vitest",
   "test:coverage": "vitest --coverage"
   ```

4. **Create setup file** (`src/test-setup.ts`):
   ```typescript
   import '@testing-library/jest-dom';
   ```

**Highest-value targets for first tests:**
| Priority | Target | File | Rationale |
|----------|--------|------|-----------|
| High | `cn()`, `formatDate()`, `formatQuantity()` | `src/lib/utils.ts` | Pure functions, zero dependencies |
| High | `Skeleton`, `SkeletonCard`, `SkeletonList`, `SkeletonTable` | `src/components/Skeleton.tsx` | Simple presentational components |
| Medium | `useAuthStore`, `useCampStore` | `src/store/index.ts` | Core state logic, single dependency (zustand) |
| Medium | `apiClient` interceptor logic | `src/lib/api.ts` | Auth token handling and 401 redirects |
| Low | Feature pages | `src/features/*/` | Complex components with many dependencies |

## Current Testing Gaps

**Complete absence of tests means:**
- No regression safety net for refactors
- No documentation of expected behavior through tests
- No confidence in API integration correctness
- No protection against breaking changes in UI components
- Mutation error states are untested (all `onError` handlers are missing)

**Critical gap:** All `useMutation` calls lack `onError` handling (12 out of 12 mutations across all feature components). Without tests, these silent failure paths cannot be caught.

---

*Testing analysis: 2026-05-24*
