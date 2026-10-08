import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { createDefaultSaveV3, decodeSaveStateV3 } from '../../src/platform/saveV3';
import { createBodyFillStroke, createMixInPlacement } from '../../src/sandbox/appearance';
import { createEmptyDecorDocument } from '../../src/sandbox/decor';

const sample = {
  id: 'jelly-pearl-bow-sample', createdAt: 1700000000000,
  shapeId: 'mochi', materialId: 'jelly',
  appearance: { v: 1, strokes: [createBodyFillStroke(0xff79a8)], mixins: [
    createMixInPlacement('stars', { u: .35, v: .6 }, 19, .1),
    createMixInPlacement('stars', { u: .63, v: .57 }, 23, .3),
    createMixInPlacement('stars', { u: .47, v: .35 }, 17, .6),
    createMixInPlacement('stars', { u: .67, v: .37 }, 14, .8),
  ] },
  decor: { ...createEmptyDecorDocument(), eyes: 'dot', mouth: 'smile', blush: true, accessory: 'bow' },
};

for (const locale of ['ru-RU', 'en-US']) {
  test(`jelly bow sample retains V3 and follows real squeeze in ${locale}`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, locale, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    try {
      await page.goto('/squishy-squishes/');
      await page.evaluate((toy) => localStorage.setItem('squishy.save.v3', JSON.stringify({
        ...toy.save, library: [toy.sample], totalCrafts: 1,
      })), { sample, save: createDefaultSaveV3() });
      await page.reload();
      await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '1');
      const savedBefore = await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('squishy.save.v3')!).library));
      await mkdir('migration-baseline-evidence', { recursive: true });
      await page.screenshot({ path: `migration-baseline-evidence/toy-sample-${locale}-hall.png` });
      await page.locator('[data-library-play-id="jelly-pearl-bow-sample"]').click();
      const body = page.locator('[data-sandbox-canvas]');
      const bow = page.locator('[data-sandbox-accessory]');
      await expect(body).toHaveAttribute('data-phaser-ready', 'true');
      await expect(bow).toHaveAttribute('data-accessory-id', 'bow');
      await expect.poll(() => bow.getAttribute('data-accessory-anchor-x')).not.toBeNull();
      expect(await page.evaluate(() => performance.getEntriesByType('resource').some((r) => /puffy-bow\.(avif|webp)/.test(r.name)))).toBe(true);
      expect(await bow.evaluate((c) => getComputedStyle(c).pointerEvents)).toBe('none');
      await page.screenshot({ path: `migration-baseline-evidence/toy-sample-${locale}-squeeze.png` });
      const box = await body.boundingBox();
      if (!box) throw new Error('Missing sample body');
      const before = Number(await bow.getAttribute('data-accessory-anchor-x'));
      await page.mouse.move(box.x + box.width * .5, box.y + box.height * .5);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * .7, box.y + box.height * .48, { steps: 12 });
      await expect.poll(async () => Math.abs(Number(await bow.getAttribute('data-accessory-anchor-x')) - before)).toBeGreaterThan(1);
      await page.screenshot({ path: `migration-baseline-evidence/toy-sample-${locale}-pull.png` });
      await page.mouse.up();
      expect(await page.evaluate(() => ({ x: document.documentElement.scrollWidth > innerWidth, y: document.documentElement.scrollHeight > innerHeight }))).toEqual({ x: false, y: false });
      expect(await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('squishy.save.v3')!).library))).toBe(savedBefore);
      await page.reload();
      await page.locator('[data-library-play-id="jelly-pearl-bow-sample"]').click();
      await expect(bow).toHaveAttribute('data-accessory-id', 'bow');
      await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-material', 'jelly');
    } finally { await context.close(); }
  });
}

test('bow image failure retains usable maker entry', async ({ page }) => {
  await page.route('**/assets/toy-polish/puffy-bow.*', (route) => route.abort());
  await page.goto('/squishy-squishes/');
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
});

test('real creation saves pearl stars and bow, with reduced motion and WebP fallback', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/assets/toy-polish/puffy-bow.avif', (route) => route.abort());
  await page.goto('/squishy-squishes/');
  await page.locator('[data-library-new]').first().click();
  await page.locator('[data-shape="mochi"]').click();
  await page.locator('[data-craft-section="paint"]').click();
  await page.locator('[data-paint-color="16742824"]').click();
  await page.locator('[data-paint-tool="fill"]').click();
  const body = page.locator('[data-sandbox-canvas]');
  const box = await body.boundingBox();
  if (!box) throw new Error('Missing maker surface');
  const x = box.x + box.width * .5;
  const y = box.y + box.height * .5;
  await page.mouse.click(x, y);
  await page.locator('[data-craft-section="mixins"]').click();
  await page.locator('[data-mixin="stars"]').click();
  for (const choice of await page.locator('.sandbox-mixin').all()) {
    expect(await choice.evaluate((el) => el.scrollWidth <= el.clientWidth + 2)).toBe(true);
  }
  for (const dx of [-25, 0, 25]) await page.mouse.click(x + dx, y + 15);
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-mixin-count', '3');
  await expect(page.locator('.toy-star-sprinkle')).toHaveCount(0);
  await mkdir('migration-baseline-evidence', { recursive: true });
  await page.screenshot({ path: 'migration-baseline-evidence/toy-sample-mixins-320.png' });
  await page.locator('[data-craft-section="decor"]').click();
  await page.locator('button[data-decor-section="accessory"]').click(); await page.locator('[data-decor-accessory="bow"]').click();
  expect(await page.locator('[data-sandbox-accessory]').evaluate((el) => el.getAnimations().length)).toBe(0);
  await page.locator('[data-craft-section="shape"]').click(); await page.locator('[data-base-tab="material"]').click();
  await page.locator('[data-material="jelly"]').click();
  await mkdir('migration-baseline-evidence', { recursive: true });
  await page.screenshot({ path: 'migration-baseline-evidence/toy-sample-created-320.png' });
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  const raw = await page.evaluate(() => JSON.parse(localStorage.getItem('squishy.save.v3')!));
  const saved = decodeSaveStateV3(raw).library[0]!;
  expect(saved.materialId).toBe('jelly');
  expect(saved.appearance.mixins).toHaveLength(3);
  expect(saved.decor.accessory).toBe('bow');
  expect(await page.evaluate(() => performance.getEntriesByType('resource').some((r) => r.name.includes('puffy-bow.webp')))).toBe(true);
});
