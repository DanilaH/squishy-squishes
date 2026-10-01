import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

for (const locale of ['ru-RU', 'en-US']) {
  for (const viewport of [{ width: 320, height: 568 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
    test(`${locale} interface at ${viewport.width}x${viewport.height}`, async ({ browser, baseURL }) => {
      const context = await browser.newContext({ baseURL, locale, viewport, reducedMotion: 'reduce', colorScheme: 'light', deviceScaleFactor: 1 });
      const page = await context.newPage();
      try {
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
          await expect(page).toHaveScreenshot(`${locale}-${viewport.width}-${stage}.png`, {
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
        await page.locator('[data-action="shape-continue"]').click();
        await capture('paint');
        await page.locator('[data-action="paint-continue"]').click();
        await page.locator('[data-action="mixin-continue"]').click();
        const box = await page.locator('[data-sandbox-canvas]').boundingBox();
        if (!box) throw new Error('Missing mixing surface');
        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;
        await page.mouse.move(x, y);
        await page.mouse.down();
        for (let n = 0; n < 34; n += 1) await page.mouse.move(x + (n % 2 ? -55 : 55), y, { steps: 2 });
        await page.mouse.up();
        await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
        await page.locator('[data-action="mix-continue"]').click();
        await capture('decor');
        await page.locator('[data-action="decor-continue"]').click();
        await capture('finish');
      } finally {
        await context.close();
      }
    });
  }
}
