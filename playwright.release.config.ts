import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/release',
  timeout: 45_000,
  expect: {
    timeout: 6_000,
  },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['line'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
    : [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://127.0.0.1:4177',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  webServer: {
    command: 'node scripts/serve-release-qa.mjs',
    port: 4177,
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },
});
