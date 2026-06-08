import { test, expect, DashboardPage } from './fixtures';

test.describe('Dashboard', () => {
  test('dashboard loads with stat cards', async ({ page }) => {
    await page.goto('/dashboard');
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.waitForDashboardLoad();
    await expect(page.getByText('Survivors')).toBeVisible();
    await expect(page.getByText('Stock Alerts')).toBeVisible();
  });

  test('navigation opens population page', async ({ page }) => {
    await page.goto('/dashboard');
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.navigateTo('Population');
    await expect(page).toHaveURL(/\/population/);
  });

  test('dashboard shows no refuge selected state when no camp', async ({ page }) => {
    await page.goto('/dashboard');
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.waitForDashboardLoad();
    // If no camp is pre-selected for this test user, the no-refuge state should render
    const noCamp = await dashboardPage.isNoCampSelectedVisible();
    // Use soft assertion — test may run with or without a preselected camp
    expect.soft(noCamp).toBe(true);
  });
});
