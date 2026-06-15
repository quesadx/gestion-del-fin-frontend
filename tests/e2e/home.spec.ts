import { test, expect } from '@playwright/test';

test('pagina principal carga correctamente', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Gesti/);
});
