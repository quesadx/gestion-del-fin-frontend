---
phase: 11
slug: pruebas-autom-ticas
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-08
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.60+ |
| **Config file** | `playwright.config.ts` — Wave 0 creates |
| **Quick run command** | `pnpm exec playwright test --ui` |
| **Full suite command** | `pnpm exec playwright test --reporter=list` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm exec playwright test --ui --grep @smoke`
- **After every plan wave:** Run `pnpm exec playwright test --reporter=list`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 180 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 0 | — | — | N/A (infra) | setup | `pnpm add -D @playwright/test && npx playwright install` | ❌ W0 | ⬜ pending |
| 11-01-02 | 01 | 1 | — | T-11-01 | JWT session reuse | e2e | `pnpm exec playwright test tests/auth.setup.spec.ts` | ❌ W0 | ⬜ pending |
| 11-01-03 | 01 | 1 | — | — | N/A | e2e | `pnpm exec playwright test tests/dashboard.spec.ts` | ❌ W0 | ⬜ pending |
| 11-01-04 | 01 | 2 | — | — | N/A | e2e | `pnpm exec playwright test tests/people/` | ❌ W0 | ⬜ pending |
| 11-01-05 | 01 | 2 | — | — | N/A | e2e | `pnpm exec playwright test tests/resources/` | ❌ W0 | ⬜ pending |
| 11-01-06 | 01 | 3 | — | — | N/A | e2e | `pnpm exec playwright test tests/ci-workflow.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `playwright.config.ts` — Playwright configuration with webServer, storageState, project for CI
- [ ] `e2e/tsconfig.json` — TypeScript config for test files
- [ ] `e2e/pages/` — Page Object Model base classes (LoginPage, DashboardPage, etc.)
- [ ] `e2e/fixtures/` — Shared test fixtures and test data
- [ ] `e2e/auth.setup.ts` — Global authentication setup (storageState)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CI pipeline integration | — | Requires GitHub Actions runner with secrets | Verify `.github/workflows/playwright.yml` triggers on PR to `main`/`dev` and passes |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 180s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
