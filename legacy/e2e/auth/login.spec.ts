import { test, expect } from '../fixtures/auth.fixture';
import { type Page } from '@playwright/test';

async function loginStandalone(page: Page) {
  await page.getByPlaceholder('Enter your operator ID').fill('admin');
  await page.getByPlaceholder('Enter your password').fill('admin123');
  await page.locator('button[type="submit"]').click();
}

test.describe('Authentication', () => {
  test('redirects to login when unauthenticated', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/dashboard');
    await page.waitForURL('**/login', { timeout: 10_000 });
    await expect(page.getByText('Authentication Required')).toBeVisible();
    await context.close();
  });

  test('login with valid credentials redirects to dashboard', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/login');
    await loginStandalone(page);
    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    await expect(page.url()).toContain('/dashboard');
    await context.close();
  });

  test('login with invalid credentials shows error', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/login');
    await page.getByPlaceholder('Enter your operator ID').fill('invalid_user');
    await page.getByPlaceholder('Enter your password').fill('wrong_password');
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText(/invalid|error|failed/i)).toBeVisible({ timeout: 10_000 });
    await context.close();
  });

  test('logout redirects to login page', async ({ page }) => {
    await page.goto('/dashboard');
    const logoutButton = page
      .locator('button')
      .filter({ hasText: /logout/i })
      .first();
    if (await logoutButton.isVisible({ timeout: 3_000 })) {
      await logoutButton.click();
      await page.waitForURL('**/login', { timeout: 10_000 });
      await expect(page.getByText('Authentication Required')).toBeVisible();
    }
  });
});
