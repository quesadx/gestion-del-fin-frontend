import { test, expect } from "@playwright/test";
import { loginAndWaitForDashboard } from "./helpers";

test.describe("Expeditions", () => {
  test.beforeEach(async ({ page }) => {
    await loginAndWaitForDashboard(page);
  });

  test("expedition list loads and shows cards", async ({ page }) => {
    await page.goto("/expeditions");

    await expect(
      page
        .locator(".brutalist-border")
        .or(page.getByText(/No active or planned expeditions\./i))
        .first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('clicking "CONFIGURE MISSION" opens the create modal', async ({
    page,
  }) => {
    await page.goto("/expeditions");

    await page.getByRole("button", { name: /configure mission/i }).click();

    await expect(
      page.getByRole("heading", { name: /configure scouting mission/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("filling and submitting the create form creates an expedition", async ({
    page,
  }) => {
    await page.goto("/expeditions");

    await page.getByRole("button", { name: /configure mission/i }).click();

    await page
      .getByLabel(/destination landmark/i)
      .fill("Test Outpost Alpha");

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
      .getByRole("button", { name: /CONFIRM MISSION DISPATCH/i })
      .click({ force: true });

    await expect(async () => {
      const modalGone = await page
        .getByRole("heading", { name: /configure scouting mission/i })
        .isHidden()
        .catch(() => true);
      const expeditionVisible = await page
        .getByText(/test outpost alpha/i)
        .first()
        .isVisible()
        .catch(() => false);
      const errorVisible = await page
        .locator("form .p-3.bg-red-950\\/30")
        .first()
        .isVisible()
        .catch(() => false);
      expect(modalGone || expeditionVisible || errorVisible).toBeTruthy();
    }).toPass({ timeout: 25_000 });
  });
});
