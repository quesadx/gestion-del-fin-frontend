import { test, expect, type Page } from '@playwright/test';

const ROUTES_BY_ROLE: Record<string, string[]> = {
  admin: [
    '/dashboard',
    '/camps',
    '/people',
    '/resources',
    '/inventory',
    '/explorations',
    '/transfers',
    '/rations',
    '/users',
    '/professions',
    '/admissions',
  ],
};

async function loginAs(page: Page, _role: string) {
  const username = _role === 'admin' ? 'admin' : `${_role}_test`;
  const password = 'admin123';
  await page.goto('/login');
  await page.getByPlaceholder('Enter your operator ID').fill(username);
  await page.getByPlaceholder('Enter your password').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard', { timeout: 15_000 }).catch(() => {});
}

test.describe('Navigation by Role', () => {
  test('system_admin can access all admin routes', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginAs(page, 'admin');

    for (const route of ROUTES_BY_ROLE.admin) {
      await page.goto(route);
      await page.waitForTimeout(500);
      expect(page.url()).toContain(route);
    }

    await context.close();
  });

  test('sidebar navigation links are visible', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginAs(page, 'admin');

    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    const sidebarLinks = ['Dashboard', 'Camps', 'People', 'Resources'];
    for (const link of sidebarLinks) {
      const navLink = page.getByRole('link', { name: link }).first();
      const button = page.getByRole('button', { name: link }).first();
      const visible =
        (await navLink.isVisible().catch(() => false)) ||
        (await button.isVisible().catch(() => false));
      expect(visible).toBeTruthy();
    }

    await context.close();
  });

  test('unauthenticated access redirects to login', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    const protectedRoutes = ['/dashboard', '/camps', '/people', '/transfers'];
    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('/login');
    }

    await context.close();
  });
});
