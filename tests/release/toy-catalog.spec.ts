import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { createDefaultSaveV3 } from '../../src/platform/saveV3';
import { createBodyFillStroke, createMixInPlacement, type MixInId } from '../../src/sandbox/appearance';
import { ACCESSORY_IDS, EYE_STYLE_IDS, MOUTH_STYLE_IDS, createEmptyDecorDocument } from '../../src/sandbox/decor';

for (const locale of ['ru-RU', 'en-US']) {
  test(`existing decorated V3 collection renders the toy catalog in ${locale}`, async ({ browser, baseURL }) => {
    test.setTimeout(90_000);
    const context = await browser.newContext({ baseURL, locale, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    try {
      const mixins: MixInId[] = ['glitter', 'stars', 'foam', 'pearls', 'hearts', 'confetti'];
      const shapes = ['mochi', 'heart', 'square', 'paw', 'mushroom'] as const;
      const toys = ACCESSORY_IDS.map((accessory, n) => ({
        id: `catalog-${accessory}`, createdAt: 1700000000000 + n, shapeId: shapes[n], materialId: 'jelly',
        appearance: { v: 1, strokes: [createBodyFillStroke(n % 2 ? 0xb88de9 : 0xff79a8)],
          mixins: mixins.map((id, k) => createMixInPlacement(id, { u: .30 + k % 3 * .2, v: .40 + Math.floor(k / 3) * .2 }, 24, k / 6)) },
        decor: { ...createEmptyDecorDocument(), eyes: EYE_STYLE_IDS[n % 3], mouth: MOUTH_STYLE_IDS[n % 3], blush: true, accessory },
      }));
      await page.goto('/squishy-squishes/');
      await page.evaluate((library) => localStorage.setItem('squishy.save.v3', JSON.stringify({ ...library.save, library: library.toys, totalCrafts: 5 })), { save: createDefaultSaveV3(), toys });
      await page.reload();
      await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '5');
      const savedBefore = await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('squishy.save.v3')!).library));
      await mkdir('migration-baseline-evidence', { recursive: true });
      await page.screenshot({ path: `migration-baseline-evidence/catalog-${locale}-hall.png` });
      for (const accessory of ACCESSORY_IDS) {
        await page.locator(`[data-library-play-id="catalog-${accessory}"]`).click();
        await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
        const overlay = page.locator('[data-sandbox-accessory]');
        await expect(overlay).toHaveAttribute('data-accessory-id', accessory);
        await expect.poll(() => overlay.getAttribute('data-accessory-anchor-x')).not.toBeNull();
        // Real decoded art, not just a successful URL or an empty overlay.
        expect(await overlay.evaluate((canvas: HTMLCanvasElement) => {
          const ctx = canvas.getContext('2d')!; const bytes = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          return bytes.filter((_, i) => i % 4 === 3 && bytes[i]! > 100).length;
        })).toBeGreaterThan(500);
        await page.screenshot({ path: `migration-baseline-evidence/catalog-${locale}-${accessory}.png` });
        expect(await page.evaluate(() => ({ x: document.documentElement.scrollWidth > innerWidth, y: document.documentElement.scrollHeight > innerHeight }))).toEqual({ x: false, y: false });
        await page.reload();
      }
      expect(await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('squishy.save.v3')!).library))).toBe(savedBefore);
    } finally { await context.close(); }
  });
}

test('all accessory formats failing keeps the existing collection usable', async ({ page }) => {
  await page.route('**/assets/toy-polish/*', (route) => route.abort());
  await page.goto('/squishy-squishes/');
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
});
