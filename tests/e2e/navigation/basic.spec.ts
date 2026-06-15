import { test, expect } from '@playwright/test';

test.describe('Navegacion basica', () => {
  test('ruta raiz redirige a login al no estar autenticado', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'GESTION-DEL-FIN' })).toBeVisible();
  });

  test('ruta protegida /dashboard redirige a login', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { name: 'GESTION-DEL-FIN' })).toBeVisible();
  });

  test('ruta protegida /population redirige a login', async ({ page }) => {
    await page.goto('/population');

    await expect(page.getByRole('heading', { name: 'GESTION-DEL-FIN' })).toBeVisible();
  });

  test('ruta inexistente redirige a login', async ({ page }) => {
    await page.goto('/ruta-que-no-existe');

    await expect(page.getByRole('heading', { name: 'GESTION-DEL-FIN' })).toBeVisible();
  });
});
