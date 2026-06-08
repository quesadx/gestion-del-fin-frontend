import type { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(username: string, password: string) {
    await this.page.getByLabel('Username').fill(username);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'REQUEST AUTHORIZATION' }).click();
    await this.page.waitForURL('/dashboard');
  }

  async loginExpectFailure(username: string, password: string) {
    await this.page.getByLabel('Username').fill(username);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'AUTHORIZING...' }).click();
  }

  async getErrorMessage(): Promise<string | null> {
    const errorEl = this.page.getByText(/Authentication failed|Check credentials/i);
    if (await errorEl.isVisible()) return await errorEl.textContent();
    return null;
  }

  async isSessionExpiredBannerVisible(): Promise<boolean> {
    return this.page.getByText('Session Terminated').isVisible();
  }
}
