import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

const TEST_CREDENTIALS = {
  username: process.env.TEST_USERNAME!,
  password: process.env.TEST_PASSWORD!,
};

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';

export { test, expect, LoginPage, DashboardPage, TEST_CREDENTIALS, BASE_URL };
