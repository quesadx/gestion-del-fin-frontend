import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', (msg) => console.log('PAGE LOG>', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.log('PAGE ERROR>', err.message));
  page.on('requestfailed', (req) => console.log('FAILED>', req.url(), req.failure()?.errorText));
  await page.goto('http://localhost:3000/login');
  console.log('LOGIN PAGE READY', await page.url());
  console.log('LOGIN BUTTON COUNT', await page.getByRole('button', { name: /sign in/i }).count());
  await page.getByLabel(/username/i).fill('admin_master');
  await page.getByLabel(/password/i).fill('password');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForTimeout(3000);
  console.log('URL AFTER CLICK', page.url());
  console.log('BODY TEXT', (await page.textContent('body'))?.slice(0, 800));
  await browser.close();
})();
