import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/release',
  testMatch: 'free-paint.spec.ts',
  timeout: 45000,
  expect: { timeout: 6000 },
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [['line'], ['html', {open:'never'}]],
  use: {
    baseURL: 'https://danilah.github.io',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
});
