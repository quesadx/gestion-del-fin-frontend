import { test as base, type Page } from '@playwright/test';

const TEST_USERNAME = process.env.E2E_USERNAME || 'admin';
const TEST_PASSWORD = process.env.E2E_PASSWORD || 'admin123';

let authenticatedPage: Page | null = null;

async function login(page: Page) {
  await page.goto('/login');
  await page.getByPlaceholder('Enter your operator ID').waitFor({ timeout: 10_000 });
  await page.getByPlaceholder('Enter your operator ID').fill(TEST_USERNAME);
  await page.getByPlaceholder('Enter your password').fill(TEST_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
}

export const test = base.extend({
  page: async ({ browser }, use) => {
    if (!authenticatedPage) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await login(page);
      authenticatedPage = page;
    }
    await use(authenticatedPage);
  },
});

export { expect } from '@playwright/test';
