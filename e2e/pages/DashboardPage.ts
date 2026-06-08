import type { Page } from '@playwright/test';

export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard');
  }

  async waitForDashboardLoad() {
    await this.page.waitForURL('/dashboard');
    await this.page.getByText('Survivors').waitFor({ state: 'visible', timeout: 15_000 });
  }

  async navigateTo(section: string) {
    await this.page
      .getByRole('toolbar', { name: 'Main navigation' })
      .getByRole('button', { name: section })
      .click();
  }

  async selectCamp(campName: string) {
    await this.page.getByLabel(/Current refuge:|Select refuge/).click();
    await this.page.getByText(campName).click();
  }

  async isNoCampSelectedVisible(): Promise<boolean> {
    return this.page.getByText('No Refuge Selected').isVisible();
  }

  async getStockAlertCount(): Promise<number> {
    const alerts = this.page.getByText(/CRITICAL STOCK:|LOW STOCK:/);
    return await alerts.count();
  }

  async logout() {
    await this.page.getByLabel('Terminate Session').click();
    await this.page.getByText('YES, SIGN OUT').click();
    await this.page.waitForURL('/login');
  }
}
