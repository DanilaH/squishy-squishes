import { defineConfig } from '@playwright/test';
import release from './playwright.release.config';
export default defineConfig({ ...release, testDir: './tests/android', testIgnore: [], timeout: 60_000 });
