import { test, expect, LoginPage, TEST_CREDENTIALS } from './fixtures';

test.describe('Authentication', () => {
  test('login success redirects to dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_CREDENTIALS.username, TEST_CREDENTIALS.password);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('login with bad credentials shows error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginExpectFailure('invalid_user', 'wrong_pass');
    await expect(page.getByText(/Authentication failed|Check credentials/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('session expired banner appears when redirected from timeout', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.setItem('session_expired', 'true'));
    await page.reload();
    await expect(page.getByText('Session Terminated')).toBeVisible();
  });
});

test.describe('Unauthenticated', () => {
  test.use({ storageState: undefined });

  test('unauthenticated user redirected to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
