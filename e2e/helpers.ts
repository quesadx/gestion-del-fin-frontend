import { test, expect, Page } from "@playwright/test";

const USERNAME = process.env.E2E_USERNAME ?? "admin_master";
const PASSWORD = process.env.E2E_PASSWORD ?? "password";

export async function loginAndWaitForDashboard(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto("/login");
    await page.getByLabel(/username/i).fill(USERNAME);
    await page.getByLabel(/password/i).fill(PASSWORD);
    await page.getByLabel(/sign in/i).click();

    try {
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 12_000 });
      await expect(page.getByRole('button', { name: /dashboard/i })).toBeVisible({ timeout: 20_000 });
      return;
    } catch {
      if (attempt === 2) throw new Error("Login failed after 3 attempts (rate limited?)");
      await page.waitForTimeout(5_000);
    }
  }
}
