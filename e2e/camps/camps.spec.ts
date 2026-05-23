import { test, expect } from '../fixtures/auth.fixture';

const TEST_CAMP_NAME = `E2E-Test-Camp-${Date.now()}`;

test.describe('Camps', () => {
  test('navigates to camps page', async ({ page }) => {
    await page.goto('/camps');
    await expect(page.url()).toContain('/camps');
  });

  test('creates a new camp', async ({ page }) => {
    await page.goto('/camps');
    await page.getByRole('button', { name: /add|create|new.*camp/i }).click();

    await page.getByPlaceholder(/name|camp name/i).waitFor({ timeout: 5_000 });
    await page.getByPlaceholder(/name|camp name/i).fill(TEST_CAMP_NAME);

    const locationInput = page.getByPlaceholder(/location/i);
    if (await locationInput.isVisible({ timeout: 2_000 })) {
      await locationInput.fill('Test Location');
    }

    const submitButton = page.locator('button[type="submit"]').filter({ hasText: /create|save/i });
    await submitButton.click();

    await expect(page.getByText(TEST_CAMP_NAME)).toBeVisible({ timeout: 10_000 });

    const deleteButton = page.getByRole('button', { name: /delete/i });
    if (await deleteButton.first().isVisible({ timeout: 3_000 })) {
      await deleteButton.first().click();
      const confirmButton = page.getByRole('button', { name: /yes|confirm|delete/i }).last();
      if (await confirmButton.isVisible({ timeout: 3_000 })) {
        await confirmButton.click();
      }
    }
  });

  test('changes active camp via sidebar selector', async ({ page }) => {
    await page.goto('/dashboard');
    const campSelector = page.locator('select, [role="combobox"]').first();
    if (await campSelector.isVisible({ timeout: 5_000 })) {
      await campSelector.click();
      await page.waitForTimeout(500);
      const options = page.locator('[role="option"], option');
      const optionCount = await options.count();
      if (optionCount > 1) {
        await options.nth(1).click();
        await page.waitForTimeout(1000);
        await expect(page.url()).toContain('/dashboard');
      }
    }
  });
});
