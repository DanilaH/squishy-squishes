import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { createDefaultSaveV3, decodeSaveStateV3 } from '../../src/platform/saveV3';
import { createBodyFillStroke, createMixInPlacement, type MixInId } from '../../src/sandbox/appearance';
import { ACCESSORY_IDS, EYE_STYLE_IDS, MOUTH_STYLE_IDS, createEmptyDecorDocument } from '../../src/sandbox/decor';

for (const locale of ['ru-RU', 'en-US']) {
  test(`existing decorated V3 collection renders the toy catalog in ${locale}`, async ({ browser, baseURL }) => {
    test.setTimeout(90_000);
    const context = await browser.newContext({ baseURL, locale, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    try {
      const mixins: MixInId[] = ['glitter', 'stars', 'foam', 'pearls', 'hearts', 'confetti'];
      const shapes = ['mochi', 'heart', 'soft-square', 'paw', 'mushroom'] as const;
      const toys = ACCESSORY_IDS.map((accessory, n) => ({
        id: `catalog-${accessory}`, createdAt: 1700000000000 + n, shapeId: shapes[n % shapes.length], materialId: 'jelly',
        appearance: { v: 1, strokes: [createBodyFillStroke(n % 2 ? 0xb88de9 : 0xff79a8)],
          mixins: mixins.map((id, k) => createMixInPlacement(id, { u: .30 + k % 3 * .2, v: .40 + Math.floor(k / 3) * .2 }, 24, k / 6)) },
        decor: { ...createEmptyDecorDocument(), eyes: EYE_STYLE_IDS[n % 3], mouth: MOUTH_STYLE_IDS[n % 3], blush: true, accessory },
      }));
      // Validate fixtures through the production codec before browser injection.
      decodeSaveStateV3({ ...createDefaultSaveV3(), libraryCapacity:24, library: toys, totalCrafts: 5 });
      await page.goto('/squishy-squishes/');
      await page.evaluate((library) => localStorage.setItem('squishy.save.v3', JSON.stringify({ ...library.save, libraryCapacity:24, library: library.toys, totalCrafts: 5 })), { save: createDefaultSaveV3(), toys });
      await page.reload();
      await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', String(ACCESSORY_IDS.length));
      const savedBefore = await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('squishy.save.v3')!).library));
      await mkdir('migration-baseline-evidence', { recursive: true });
      await page.screenshot({ path: `migration-baseline-evidence/catalog-${locale}-hall.png` });
      for (const accessory of ACCESSORY_IDS) {
        // A hosted reload can finish before the asynchronous Hall mount. Wait
        // before choosing a room, otherwise the first click can skip the toy.
        await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-hall-mounted', 'true');
        const play = page.locator(`[data-library-play-id="catalog-${accessory}"]`);
        await play.scrollIntoViewIfNeeded();
        await expect(play).toBeVisible();
        await play.click();
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

test('actual face and catalog choices stay visible on short phone screens', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/squishy-squishes/');
  await page.locator('[data-library-new]').first().click();
  await page.locator('[data-action="shape-continue"]').click();
  await page.locator('[data-action="paint-continue"]').click();
  await mkdir('migration-baseline-evidence', { recursive: true });
  await page.screenshot({ path: 'migration-baseline-evidence/catalog-choices-mixins-320.png' });
  await page.locator('[data-action="mixin-continue"]').click();
  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('Missing mixing surface');
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  for (let n = 0; n < 38; n++) await page.mouse.move(x + (n % 2 ? -55 : 55), y, { steps: 2 });
  await page.mouse.up();
  await page.locator('[data-action="mix-continue"]').click();
  for (let n = 0; n < 3; n++) {
    await page.locator(`[data-decor-eyes="${EYE_STYLE_IDS[n]}"]`).click();
    await page.locator(`[data-decor-mouth="${MOUTH_STYLE_IDS[n]}"]`).click();
    await page.screenshot({ path: `migration-baseline-evidence/catalog-face-${n}-320.png` });
  }
  for (const viewport of [{ width: 320, height: 568 }, { width: 568, height: 320 }]) {
    await page.setViewportSize(viewport);
    for (const section of ['face', 'stickers', 'accessory']) {
      await page.locator(`[data-decor-section="${section}"]`).click();
      const panel = page.locator(`[data-decor-panel="${section}"]`);
      for (const button of await panel.getByRole('button').all()) {
        await button.scrollIntoViewIfNeeded();
        const rect = await button.boundingBox();
        expect(rect).not.toBeNull();
        expect(rect!.x).toBeGreaterThanOrEqual(0);
        expect(rect!.x + rect!.width).toBeLessThanOrEqual(viewport.width + 1);
        expect(rect!.y + rect!.height).toBeLessThanOrEqual(viewport.height + 1);
        expect(await button.evaluate((el) => el.scrollWidth <= el.clientWidth + 2)).toBe(true);
      }
      const bounds = await panel.evaluate((el) => ({
        client: el.clientHeight, scroll: el.scrollHeight, rect: el.getBoundingClientRect().toJSON(),
        children: [...el.children].map((child) => ({ tag: child.tagName, rect: child.getBoundingClientRect().toJSON(), position: getComputedStyle(child).position })),
      }));
      expect(bounds.scroll <= bounds.client + 1, JSON.stringify({ viewport, section, bounds })).toBe(true);
      await page.screenshot({ path: `migration-baseline-evidence/catalog-choices-${section}-${viewport.width}.png` });
    }
  }
});
