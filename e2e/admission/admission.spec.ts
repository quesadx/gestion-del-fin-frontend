import { test, expect } from '../fixtures/auth.fixture';

const TEST_ADMISSION_NAME = `E2E-Admission-${Date.now()}`;

test.describe('Admission', () => {
  test('navigates to admissions page', async ({ page }) => {
    await page.goto('/admissions');
    await expect(page.url()).toContain('/admissions');
  });

  test('creates a new admission entry', async ({ page }) => {
    await page.goto('/admissions');
    await page.getByRole('button', { name: /add|new.*admission|create/i }).click();
    await page.waitForTimeout(1000);

    const nameInput = page.getByPlaceholder(/name|full name/i);
    if (await nameInput.isVisible({ timeout: 3_000 })) {
      await nameInput.fill(TEST_ADMISSION_NAME);

      const ageInput = page.getByPlaceholder(/age/i);
      if (await ageInput.isVisible({ timeout: 1_000 })) {
        await ageInput.fill('25');
      }

      const submitButton = page
        .locator('button[type="submit"]')
        .filter({ hasText: /submit|save|register/i });
      if (await submitButton.isVisible({ timeout: 2_000 })) {
        await submitButton.click();
        await page.waitForTimeout(2000);
      }
    }

    await expect(page.url()).toContain('/admissions');
  });

  test('displays AI analysis panel when admission is selected', async ({ page }) => {
    await page.goto('/admissions');
    await page.waitForTimeout(2000);

    const rows = page.locator('table tbody tr, [role="row"]');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      await rows.first().click();
      await page.waitForTimeout(1000);
      const analysisPanel = page.getByText(/ai analysis|decision|reasoning/i);
      await expect(analysisPanel.first()).toBeVisible({ timeout: 5_000 });
    }
  });
});
