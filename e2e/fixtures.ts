import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PeopleListPage } from './pages/PeopleListPage';
import { PersonDetailPage } from './pages/PersonDetailPage';
import { ResourcesPage } from './pages/ResourcesPage';

const TEST_CREDENTIALS = {
  username: process.env.TEST_USERNAME!,
  password: process.env.TEST_PASSWORD!,
};

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

export {
  test,
  expect,
  LoginPage,
  DashboardPage,
  PeopleListPage,
  PersonDetailPage,
  ResourcesPage,
  TEST_CREDENTIALS,
  BASE_URL,
};
