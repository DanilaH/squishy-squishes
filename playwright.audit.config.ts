import base from './playwright.release.config';
import {defineConfig} from '@playwright/test';
const output=process.env.AUDIT_OUTPUT_DIR??'test-results/audit';
export default defineConfig({
  ...base,
  testDir: './tests/audit',
  testIgnore: [],
  timeout: 180_000,
  expect: { timeout: 20_000 },
  retries: 0,
  use: {...base.use, actionTimeout:20_000, navigationTimeout:30_000},
  reporter: [['list'], ['json', { outputFile: `${output}/report.json` }]],
  outputDir: `${output}/cases`,
});
