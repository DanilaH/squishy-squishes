import { expect, test } from '@playwright/test';

// Unmasked art evidence supplements the UI baselines: actually inspect toys,
// tabletop, control overlap and gesture feedback rather than hiding GPU output.
const views = [
  { width: 320, height: 568 }, { width: 390, height: 844 },
  { width: 844, height: 390 }, { width: 568, height: 320 },
  { width: 1280, height: 800 }, { width: 1440, height: 900 },
];
for (const locale of ['en-US', 'ru-RU']) for (const viewport of views) {
  test(`cozy workshop ${locale} ${viewport.width}x${viewport.height}`, async ({ browser, baseURL }, info) => {
    const context = await browser.newContext({ baseURL, viewport, locale, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    try {
      await page.goto('/squishy-squishes/');
      await expect(page.locator('.library-hall-scene')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: info.outputPath('cozy-library.png') });
      await page.locator('[data-library-new]').first().click();
      await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
      await expect(page.locator('.studio-env-stage-art')).toBeVisible();
      if (process.env.COZY_BEFORE !== '1') {
        const tabletop = page.locator('.studio-env-stage-art');
        const deskVisible = viewport.width <= viewport.height || viewport.height > 520;
        await expect(tabletop).toHaveAttribute('data-tabletop-visible', String(deskVisible));
        for (const prop of await page.locator('.studio-env-trace').all()) {
          expect(await prop.evaluate((e) => e instanceof HTMLImageElement && e.complete && e.naturalWidth === 256)).toBe(true);
          expect(await prop.evaluate(e => getComputedStyle(e).pointerEvents)).toBe('none');
        }
      }
      const capture = async (stage: string) => {
        expect(await page.evaluate(() => ({
          x: document.documentElement.scrollWidth > innerWidth,
          y: document.documentElement.scrollHeight > innerHeight,
          trays: [...document.querySelectorAll<HTMLElement>('.sandbox-controls, .sandbox-step-panel')]
            .filter(e => e.getClientRects().length && e.scrollHeight > e.clientHeight + 1).length,
        }))).toEqual({ x: false, y: false, trays: 0 });
        for (const button of await page.locator('.sandbox-controls button:visible').all()) {
          expect(await button.evaluate(e => {
            const r = e.getBoundingClientRect();
            const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
            return !!hit && e.contains(hit);
          })).toBe(true);
        }
        await page.screenshot({ path: info.outputPath(`cozy-${stage}.png`) });
      };
      await capture('shape');
      await page.locator('[data-action="shape-continue"]').click();
      await capture('paint');
      await page.locator('[data-action="paint-continue"]').click();
      await page.locator('[data-action="mixin-continue"]').click();
      const box = await page.locator('[data-sandbox-canvas]').boundingBox();
      if (!box) throw new Error('No toy canvas');
      const x = box.x + box.width / 2, y = box.y + box.height / 2;
      await page.mouse.move(x, y); await page.mouse.down();
      for (let n = 0; n < 34; n++) await page.mouse.move(x + (n % 2 ? -55 : 55), y, { steps: 2 });
      await page.mouse.up();
      await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
      await page.locator('[data-action="mix-continue"]').click();
      await capture('decor');
      await page.locator('[data-action="decor-continue"]').click();
      await capture('finish');
      expect(errors).toEqual([]);
    } finally { await context.close(); }
  });
}
