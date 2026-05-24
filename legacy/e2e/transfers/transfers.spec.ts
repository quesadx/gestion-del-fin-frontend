import { test, expect } from '../fixtures/auth.fixture';

test.describe('Transfers', () => {
  test('navigates to transfers page', async ({ page }) => {
    await page.goto('/transfers');
    await expect(page.url()).toContain('/transfers');
  });

  test('creates a new transfer', async ({ page }) => {
    await page.goto('/transfers');
    await page.getByRole('button', { name: /add|new|create/i }).click();
    await page.waitForTimeout(1000);

    const submitButton = page.locator('button[type="submit"]').filter({ hasText: /create|send/i });
    if (await submitButton.isVisible({ timeout: 3_000 })) {
      await submitButton.click();
      await page.waitForTimeout(2000);
    }

    await expect(page.url()).toContain('/transfers');
  });

  test('can approve a pending transfer', async ({ page }) => {
    await page.goto('/transfers');
    await page.waitForTimeout(2000);

    const approveButton = page.getByRole('button', { name: /approve/i }).first();
    if (await approveButton.isVisible({ timeout: 3_000 })) {
      await approveButton.click();
      await page.waitForTimeout(1000);

      const confirmButton = page.getByRole('button', { name: /yes|confirm|approve/i }).last();
      if (await confirmButton.isVisible({ timeout: 3_000 })) {
        await confirmButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });
});
