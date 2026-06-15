import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('el formulario de login contiene todos los campos', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'REQUEST AUTHORIZATION' })).toBeVisible();
  });

  test('el campo password es de tipo password', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByLabel('Password')).toHaveAttribute('type', 'password');
  });

  test('el campo username tiene placeholder IDENTIFIER', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByLabel('Username')).toHaveAttribute('placeholder', 'IDENTIFIER');
  });

  test('el campo password tiene placeholder PASSCODE', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByLabel('Password')).toHaveAttribute('placeholder', 'PASSCODE');
  });

  test('el boton de submit esta habilitado inicialmente', async ({ page }) => {
    await page.goto('/login');

    const button = page.getByRole('button', { name: 'REQUEST AUTHORIZATION' });
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
  });

  test('se puede ingresar texto en ambos campos', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('Password').fill('testpassword123');

    await expect(page.getByLabel('Username')).toHaveValue('testuser');
    await expect(page.getByLabel('Password')).toHaveValue('testpassword123');
  });
});
