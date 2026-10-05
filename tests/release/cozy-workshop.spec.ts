import { reachableControlIssues } from '../phaser-pages/helpers/reachableControls';
import { expect, test } from '@playwright/test';
import { createDefaultSaveV3 } from '../../src/platform/saveV3';
import { createEmptyDecorDocument } from '../../src/sandbox/decor';
import { createBodyFillStroke } from '../../src/sandbox/appearance';

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
        expect(await reachableControlIssues(page)).toEqual([]);
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

// One seeded, already saved toy isolates material/gesture rendering from craft
// progress. Capture all six identities with the same pose and pink pigment.
for (const materialId of ['soft', 'jelly', 'holo', 'marshmallow', 'pearl', 'chrome']) {
  test(`cozy material touch ${materialId}`, async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/squishy-squishes/');
    const toy = { id: 'cozy-material', createdAt: 1700000000000,
      shapeId: 'dumpling', materialId,
      appearance: { v: 1, strokes: [createBodyFillStroke(0xffb7cf)], mixins: [
        { t: 1, x: 88, y: 139, s: 23, r: 0 }, { t: 1, x: 164, y: 151, s: 21, r: 24 },
      ] },
      decor: { ...createEmptyDecorDocument(), eyes: 'dot', mouth: 'smile', blush: true, accessory: 'bow' } };
    await page.evaluate(save => localStorage.setItem('squishy.save.v3', JSON.stringify(save)),
      { ...createDefaultSaveV3(), library: [toy], totalCrafts: 1 });
    await page.reload();
    await page.locator('[data-library-play-id="cozy-material"]').click();
    const shell = page.locator('[data-sandbox-app]'), canvas = page.locator('[data-sandbox-canvas]');
    await expect(canvas).toHaveAttribute('data-phaser-ready', 'true');
    await expect(shell).toHaveAttribute('data-material', materialId);
    const saved = await page.evaluate(() => localStorage.getItem('squishy.save.v3'));
    await page.screenshot({ path: info.outputPath(`cozy-${materialId}-rest.png`) });
    const b = (await canvas.boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await expect(shell).toHaveAttribute('data-squish-active', 'true');
    // Wait for the existing press attack to settle; do not change its constants.
    await page.waitForTimeout(350);
    await page.screenshot({ path: info.outputPath(`cozy-${materialId}-press.png`) });
    await page.mouse.move(b.x + b.width / 2 + 65, b.y + b.height / 2 - 20, { steps: 12 });
    await page.screenshot({ path: info.outputPath(`cozy-${materialId}-stretch.png`) });
    await page.mouse.up();
    await expect(shell).toHaveAttribute('data-squish-active', 'false');
    expect(await page.evaluate(() => localStorage.getItem('squishy.save.v3'))).toBe(saved);
  });
}
