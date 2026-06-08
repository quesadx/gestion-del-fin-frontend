import type { Page } from '@playwright/test';

export class PeopleListPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/population');
  }

  async waitForLoad() {
    await this.page.waitForURL('/population');
    await this.page
      .getByText('Population Roster')
      .waitFor({ state: 'visible', timeout: 15_000 });
  }

  async search(term: string) {
    await this.page.getByLabel('Search survivors').fill(term);
  }

  async filterByStatus(
    status: 'ALL' | 'HEALTHY' | 'SICK' | 'INJURED' | 'AWAY' | 'DEAD',
  ) {
    await this.page.getByRole('combobox').selectOption(status);
    await this.page.waitForResponse(
      (resp) =>
        resp.url().includes('/api-remote/people') && resp.status() === 200,
    );
  }

  async clickPerson(name: string) {
    await this.page.getByRole('button', { name }).click();
    await this.page.waitForURL(/\/population\/\d+/);
  }

  async getPersonCount(): Promise<number> {
    const infoText = this.page.locator('text=/Showing.*on page/');
    const text = await infoText.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  async isPersonInList(name: string): Promise<boolean> {
    return this.page.getByText(name).first().isVisible();
  }

  async clickNewSurvivor() {
    await this.page.getByRole('button', { name: 'NEW SURVIVOR' }).click();
    await this.page.waitForURL(/\/population\/new/);
  }
}
