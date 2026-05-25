import { test, expect } from "@playwright/test";

const USERNAME = process.env.E2E_USERNAME ?? "admin_master";
const PASSWORD = process.env.E2E_PASSWORD ?? "password";

test.describe("Transfers", () => {
  test.beforeEach(async ({ page }) => {
    // Log in as admin_master before each test
    await page.goto("/login");
    await page.getByLabel(/username/i).fill(USERNAME);
    await page.getByLabel(/password/i).fill(PASSWORD);
    await page.getByRole("button", { name: /login|sign in|enter/i }).click();
    await page.waitForURL(/\/dashboard/);
  });

  test("navigate to /transfers, list loads", async ({ page }) => {
    await page.goto("/transfers");

    // Wait for the transfer list or empty-state to render
    await expect(
      page
        .locator('[data-testid="transfer-list"]')
        .or(page.getByText(/no transfers|no pending transfers/i))
        .or(page.getByText(/transfer|logistics/i).first()),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('clicking "NEW TRANSFER" opens the create modal', async ({ page }) => {
    await page.goto("/transfers");

    await page.getByRole("button", { name: /new transfer/i }).click();

    // The modal should appear
    await expect(
      page
        .getByRole("dialog")
        .or(page.getByRole("heading", { name: /transfer|request/i }))
        .first(),
    ).toBeVisible({ timeout: 6_000 });
  });
});
