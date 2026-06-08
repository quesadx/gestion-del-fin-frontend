import type { Page } from '@playwright/test';

export class PersonDetailPage {
  constructor(private page: Page) {}

  async waitForDetailLoad() {
    await this.page.waitForURL(/\/population\/\d+/);
    await this.page
      .locator('h1')
      .first()
      .waitFor({ state: 'visible', timeout: 15_000 });
  }

  async getPersonName(): Promise<string | null> {
    return this.page.locator('h1').first().textContent();
  }

  async navigateBack() {
    await this.page.goBack();
    await this.page.waitForURL('/population');
  }
}
