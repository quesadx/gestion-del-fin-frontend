import { test, expect } from '@playwright/test';

test('pagina de login carga correctamente', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'GESTION-DEL-FIN' })).toBeVisible();

  await expect(page.getByLabel('Username')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();

  await expect(page.getByRole('button', { name: 'REQUEST AUTHORIZATION' })).toBeVisible();
});
