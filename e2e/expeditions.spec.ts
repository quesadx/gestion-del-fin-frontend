import { test, expect } from "@playwright/test";

test.describe("Expeditions", () => {
  test.beforeEach(async ({ page }) => {
    // Log in as admin_master before each test
    await page.goto("/login");
    await page.getByLabel(/username/i).fill("admin_master");
    await page.getByLabel(/password/i).fill("password");
    await page.getByRole("button", { name: /login|sign in|enter/i }).click();
    await page.waitForURL(/\/dashboard/);
  });

  test("expedition list loads and shows cards", async ({ page }) => {
    await page.goto("/expeditions");

    // Wait for the expedition cards to appear (or the empty-state message)
    await expect(
      page
        .locator(".brutalist-border")
        .or(page.getByText(/no expeditions|no missions/i))
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('clicking "CONFIGURE MISSION" opens the create modal', async ({
    page,
  }) => {
    await page.goto("/expeditions");

    await page.getByRole("button", { name: /configure mission/i }).click();

    await expect(
      page.getByRole("heading", { name: /configure scouting mission/i }),
    ).toBeVisible();
  });

  test("filling and submitting the create form creates an expedition", async ({
    page,
  }) => {
    await page.goto("/expeditions");

    await page.getByRole("button", { name: /configure mission/i }).click();

    // Fill destination
    await page
      .getByLabel(/destination landmark/i)
      .fill("Test Outpost Alpha");

    // Fill dates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const returnDay = new Date();
    returnDay.setDate(returnDay.getDate() + 5);
    const maxDay = new Date();
    maxDay.setDate(maxDay.getDate() + 7);

    const fmt = (d: Date) => d.toISOString().split("T")[0];

    await page.getByLabel(/departure date/i).fill(fmt(tomorrow));
    await page.getByLabel(/expected return/i).fill(fmt(returnDay));
    await page.getByLabel(/max return/i).fill(fmt(maxDay));

    await page
      .getByRole("button", { name: /confirm mission dispatch/i })
      .click();

    // Modal should close and the new expedition should appear
    await expect(
      page.getByRole("heading", { name: /configure scouting mission/i }),
    ).not.toBeVisible({ timeout: 8_000 });

    await expect(
      page.getByText(/test outpost alpha/i).first(),
    ).toBeVisible({ timeout: 8_000 });
  });
});
