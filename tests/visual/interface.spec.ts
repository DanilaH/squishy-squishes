import { returningPlayer } from '../returning-player';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

for (const locale of ['ru-RU', 'en-US']) {
  for (const viewport of [{ width: 320, height: 568 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
    test(`${locale} interface at ${viewport.width}x${viewport.height}`, async ({ browser, baseURL }) => {
      const context = await browser.newContext({ baseURL, locale, viewport, reducedMotion: 'reduce', colorScheme: 'light', deviceScaleFactor: 1 });
      const page = await context.newPage();
      try {
        await returningPlayer(page);
        await page.goto('/squishy-squishes/');
        await expect(page.locator('.is-library-hall')).toBeVisible();
        await expect(page.locator('#app')).toHaveAttribute('data-jelly-ui-ready', '');
        await page.evaluate(() => document.fonts.ready);
        const capture = async (stage: string): Promise<void> => {
          expect(await page.evaluate(() => ({
            x: document.documentElement.scrollWidth > innerWidth,
            y: document.documentElement.scrollHeight > innerHeight,
          }))).toEqual({ x: false, y: false });
          // Test the UI/room separately from GPU physics and canvas rasterization.
          // Keep the test failing, but collect every stage diff in one CI run.
          await expect.soft(page).toHaveScreenshot(`${locale}-${viewport.width}-${stage}.png`, {
            // The Finish canvas extends beneath UI; masking its bounds would
            // erase the very controls this regression must inspect.
            stylePath: fileURLToPath(new URL('./snapshot.css', import.meta.url)),
          });
        };
        await capture('library');
        await page.locator('[data-library-ideas]').click();
        await capture('ideas');
        await page.locator('[data-ideas-back]').click();
        await page.locator('[data-library-new]').first().click();
        await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
        await page.locator('[data-craft-section="paint"]').click();
        await capture('paint');
        await page.locator('[data-craft-section="decor"]').click();
        await capture('decor');
        await page.locator('[data-craft-section="shape"]').click();
        await page.locator('[data-base-tab="material"]').click();
        await capture('material');
      } finally {
        await context.close();
      }
    });
  }
}
