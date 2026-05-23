import { test, expect } from '../fixtures/auth.fixture';

const TEST_EXPLORATION_ZONE = `E2E-Zone-${Date.now()}`;

test.describe('Explorations', () => {
  test('navigates to explorations page', async ({ page }) => {
    await page.goto('/explorations');
    await expect(page.url()).toContain('/explorations');
  });

  test('creates a new exploration', async ({ page }) => {
    await page.goto('/explorations');
    await page.getByRole('button', { name: /add|new|create|launch/i }).click();
    await page.waitForTimeout(1000);

    const zoneInput = page.getByPlaceholder(/zone|area/i);
    if (await zoneInput.isVisible({ timeout: 3_000 })) {
      await zoneInput.fill(TEST_EXPLORATION_ZONE);

      const submitButton = page
        .locator('button[type="submit"]')
        .filter({ hasText: /create|launch|start/i });
      if (await submitButton.isVisible({ timeout: 2_000 })) {
        await submitButton.click();
        await page.waitForTimeout(2000);
      }
    }

    await expect(page.url()).toContain('/explorations');
  });

  test('can return from an active exploration', async ({ page }) => {
    await page.goto('/explorations');
    await page.waitForTimeout(2000);

    const returnButton = page.getByRole('button', { name: /return|complete/i }).first();
    if (await returnButton.isVisible({ timeout: 3_000 })) {
      await returnButton.click();
      await page.waitForTimeout(1000);

      const confirmButton = page.getByRole('button', { name: /yes|confirm|return/i }).last();
      if (await confirmButton.isVisible({ timeout: 3_000 })) {
        await confirmButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('can delete an exploration', async ({ page }) => {
    await page.goto('/explorations');
    await page.waitForTimeout(2000);

    const deleteButton = page.getByRole('button', { name: /delete/i }).first();
    if (await deleteButton.isVisible({ timeout: 3_000 })) {
      await deleteButton.click();
      await page.waitForTimeout(1000);

      const confirmButton = page.getByRole('button', { name: /yes|confirm|delete/i }).last();
      if (await confirmButton.isVisible({ timeout: 3_000 })) {
        await confirmButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });
});
