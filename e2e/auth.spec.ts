import { test, expect } from "@playwright/test";

const USERNAME = process.env.E2E_USERNAME ?? "admin_master";
const PASSWORD = process.env.E2E_PASSWORD ?? "password";

test.describe("Authentication", () => {
  test("login with valid credentials redirects to /dashboard", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByLabel(/username/i).fill(USERNAME);
    await page.getByLabel(/password/i).fill(PASSWORD);
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
      page.getByText(/invalid|incorrect|unauthorized|error|failed|authentication|credentials/i),
    ).toBeVisible();
  });

  test("inactivity notice appears after session_expired flag is set in localStorage", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.evaluate(() => {
      localStorage.setItem("session_expired", "true");
    });

    await page.reload();

    await expect(
      page.getByText(/session closed|inactivity|logged out/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});
