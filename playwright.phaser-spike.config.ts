import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/phaser',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'line' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4181',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  webServer: {
    command: 'npx vite preview --outDir dist-phaser-spike --host 127.0.0.1 --port 4181 --strictPort',
    port: 4181,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
