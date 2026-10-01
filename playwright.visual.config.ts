import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  outputDir: './test-results/visual',
  timeout: 60_000,
  workers: 1,
  retries: 0,
  reporter: 'line',
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      // Small rasterization differences are tolerated; layout movement is not.
      maxDiffPixelRatio: 0.002,
    },
  },
  use: {
    baseURL: 'http://127.0.0.1:4177',
    reducedMotion: 'reduce',
    colorScheme: 'light',
    deviceScaleFactor: 1,
    trace: 'retain-on-failure',
    launchOptions: { args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  webServer: {
    command: 'node scripts/serve-release-qa.mjs',
    port: 4177,
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },
});
