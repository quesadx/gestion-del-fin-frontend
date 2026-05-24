import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("login with valid credentials redirects to /dashboard", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByLabel(/username/i).fill("admin_master");
    await page.getByLabel(/password/i).fill("password");
    await page.getByRole("button", { name: /login|sign in|enter/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("login with invalid credentials shows error message", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByLabel(/username/i).fill("wrong_user");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /login|sign in|enter/i }).click();

    await expect(
      page.getByText(/invalid|incorrect|unauthorized|error/i),
    ).toBeVisible();
  });

  test("inactivity notice appears after session_expired flag is set in localStorage", async ({
    page,
  }) => {
    await page.goto("/login");

    // Simulate the session_expired flag being set (e.g. by a previous tab timeout)
    await page.evaluate(() => {
      localStorage.setItem("session_expired", "true");
    });

    // Reload so the app can read the flag on mount
    await page.reload();

    await expect(
      page.getByText(/session expired|inactivity|logged out/i),
    ).toBeVisible();
  });
});
