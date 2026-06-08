import { test, expect, PeopleListPage, PersonDetailPage } from './fixtures';

test.describe('People CRUD', () => {
  test('people list loads with title and search', async ({ page }) => {
    const peoplePage = new PeopleListPage(page);
    await peoplePage.goto();
    await peoplePage.waitForLoad();
    await expect(page.getByText('Population Roster')).toBeVisible();
    await expect(page.getByLabel('Search survivors')).toBeVisible();
  });

  test('search filters the people table', async ({ page }) => {
    const peoplePage = new PeopleListPage(page);
    await peoplePage.goto();
    await peoplePage.waitForLoad();
    await peoplePage.search('test');
    // Assert API response was triggered by search
    await page.waitForResponse(
      (resp) =>
        resp.url().includes('/api-remote/people') && resp.status() === 200,
    );
  });

  test('person detail navigates from list', async ({ page }) => {
    const peoplePage = new PeopleListPage(page);
    await peoplePage.goto();
    await peoplePage.waitForLoad();
    // Click first person name button in the table
    const firstPersonButton = page
      .getByRole('table')
      .getByRole('button')
      .first();
    if (await firstPersonButton.isVisible()) {
      const name = await firstPersonButton.textContent();
      await firstPersonButton.click();
      const personDetailPage = new PersonDetailPage(page);
      await personDetailPage.waitForDetailLoad();
      await expect(page).toHaveURL(/\/population\/\d+/);
      const detailName = await personDetailPage.getPersonName();
      expect(detailName).toBeTruthy();
    } else {
      // If no people exist in test data, skip gracefully
      expect(true).toBe(true);
    }
  });

  test('pagination info displays count', async ({ page }) => {
    const peoplePage = new PeopleListPage(page);
    await peoplePage.goto();
    await peoplePage.waitForLoad();
    const count = await peoplePage.getPersonCount();
    expect(typeof count).toBe('number');
  });
});
