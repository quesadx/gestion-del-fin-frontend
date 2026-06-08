import { test, expect, ResourcesPage } from './fixtures';

test.describe('Resources CRUD', () => {
  test('resources list loads', async ({ page }) => {
    const resourcesPage = new ResourcesPage(page);
    await resourcesPage.goto();
    await resourcesPage.waitForResourceList();
    await expect(page).toHaveURL('/resources');
  });

  test('create resource modal opens', async ({ page }) => {
    const resourcesPage = new ResourcesPage(page);
    await resourcesPage.goto();
    await resourcesPage.waitForResourceList();
    await resourcesPage.clickCreateResource();
    await expect(resourcesPage.isModalOpen()).toBe(true);
  });

  test('resource list displays items or empty state', async ({ page }) => {
    const resourcesPage = new ResourcesPage(page);
    await resourcesPage.goto();
    await resourcesPage.waitForResourceList();
    // Page should render content (resources list or empty state message)
    const hasContent =
      (await page.locator('table').isVisible()) ||
      (await page
        .getByText(/no resources|nothing here|empty/i)
        .first()
        .isVisible());
    expect(hasContent).toBe(true);
  });
});
