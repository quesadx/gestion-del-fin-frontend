import type { Page } from '@playwright/test';

export class ResourcesPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/resources');
  }

  async waitForResourceList() {
    await this.page.waitForURL('/resources');
    await this.page.waitForResponse(
      (resp) =>
        resp.url().includes('/api-remote/resources') && resp.status() === 200,
    );
  }

  async clickCreateResource() {
    await this.page.getByRole('button', { name: /create|add|new/i }).click();
    await this.page.waitForSelector('[role="dialog"]', {
      state: 'visible',
      timeout: 5_000,
    });
  }

  async isModalOpen(): Promise<boolean> {
    return this.page.locator('[role="dialog"]').isVisible();
  }
}
