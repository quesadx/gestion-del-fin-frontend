import { test, expect } from "@playwright/test";
import { loginAndWaitForDashboard } from "./helpers";

test.describe("Transfers", () => {
  test.beforeEach(async ({ page }) => {
    await loginAndWaitForDashboard(page);
  });

  test("navigate to /transfers, list loads", async ({ page }) => {
    await page.goto("/transfers");

    await expect(
      page
        .locator('[data-testid="transfer-list"]')
        .or(page.getByText(/no transfers|no pending transfers/i))
        .first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('clicking "NEW TRANSFER" opens the create modal', async ({ page }) => {
    await page.goto("/transfers");

    await page.getByRole("button", { name: /new transfer/i }).click();

    await expect(
      page
        .getByRole("dialog")
        .or(page.getByRole("heading", { name: /transfer|request/i }))
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
