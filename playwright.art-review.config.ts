import { defineConfig } from '@playwright/test';
import releaseConfig from './playwright.release.config';

// Reuse the same release server/browser; isolate only the unmasked art camera.
export default defineConfig({
  ...releaseConfig,
  testMatch: 'cozy-workshop.spec.ts',
  testIgnore: [],
  retries: 0,
});
