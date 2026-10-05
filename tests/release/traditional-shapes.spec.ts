import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { SHAPES, getShape, isPointInsideShape } from '../../src/game/shapes';
import { createDefaultSaveV3, decodeSaveStateV3 } from '../../src/platform/saveV3';
import { ACCESSORY_IDS, createEmptyDecorDocument } from '../../src/sandbox/decor';

test('traditional molds retain legacy V3 shapes and a continuous touchable body', () => {
  const save = { ...createDefaultSaveV3(), libraryCapacity: 24, library: SHAPES.map((shape, n) => ({
    id: `mold-${shape.id}`, createdAt: 1700000000000 + n, shapeId: shape.id, materialId: 'soft',
    appearance: { v: 1, strokes: [], mixins: [] }, decor: createEmptyDecorDocument(),
  })), totalCrafts: SHAPES.length };
  expect(decodeSaveStateV3(save).library.map(toy => toy.shapeId)).toEqual(SHAPES.map(shape => shape.id));
  for (const id of ['dumpling', 'paw', 'strawberry'] as const) {
    const shape = getShape(id);
    expect(isPointInsideShape(shape, 0, 0)).toBe(true);
    expect(isPointInsideShape(shape, 1, 1)).toBe(false);
    for (const point of shape.boundary) {
      expect(Number.isFinite(point.x) && Number.isFinite(point.y)).toBe(true);
      expect(Math.max(Math.abs(point.x), Math.abs(point.y))).toBeLessThanOrEqual(.95);
    }
  }
  expect(isPointInsideShape(getShape('dumpling'), 0, .86)).toBe(true);
  expect(isPointInsideShape(getShape('paw'), -.23, .75)).toBe(true);
  expect(isPointInsideShape(getShape('paw'), .23, .75)).toBe(true);
  expect(isPointInsideShape(getShape('strawberry'), 0, -.75)).toBe(true);
});

for (const shapeId of ['dumpling', 'paw', 'strawberry'] as const) {
  test(`${shapeId} retains every saved accessory through a real squeeze and reload`, async ({ page }) => {
    test.setTimeout(90_000); // Five real Hall → Squeeze → reload journeys.
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const save = { ...createDefaultSaveV3(), libraryCapacity:24, library: ACCESSORY_IDS.map((accessory, n) => ({
      id: `${shapeId}-${accessory}`, createdAt: 1700000000000 + n, shapeId, materialId: 'soft',
      appearance: { v: 1, strokes: [], mixins: [] },
      decor: { ...createEmptyDecorDocument(), eyes: 'dot', mouth: 'smile', blush: true, accessory },
    })), totalCrafts: 5 };
    decodeSaveStateV3(save);
    await page.goto('/squishy-squishes/');
    await page.evaluate(value => localStorage.setItem('squishy.save.v3', JSON.stringify(value)), save);
    await page.reload();
    const beforeSave = await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('squishy.save.v3')!).library));
    await mkdir('migration-baseline-evidence', { recursive: true });
    for (const accessory of ACCESSORY_IDS) {
      const hall = page.locator('[data-sandbox-library]');
      await expect(hall).toHaveAttribute('data-library-count', String(ACCESSORY_IDS.length));
      await expect(hall).toHaveAttribute('data-library-hall-mounted', 'true');
      const play = page.locator(`[data-library-play-id="${shapeId}-${accessory}"]`);
      for (let room = 0; room < Math.ceil(ACCESSORY_IDS.length / 2) && !await play.isVisible(); room++) await page.locator('[data-library-hall-next]').click();
      await expect(play).toBeVisible();
      await play.click();
      const body = page.locator('[data-sandbox-canvas]');
      const gear = page.locator('[data-sandbox-accessory]');
      await expect(body).toHaveAttribute('data-phaser-ready', 'true');
      await expect(gear).toHaveAttribute('data-accessory-id', accessory);
      await expect.poll(() => gear.getAttribute('data-accessory-matrix')).not.toBeNull();
      await page.screenshot({ path: `migration-baseline-evidence/mold-${shapeId}-${accessory}.png` });
      const matrix = await gear.getAttribute('data-accessory-matrix');
      const anchor = Number(await gear.getAttribute('data-accessory-anchor-x'));
      const box = await body.boundingBox();
      if (!box) throw new Error('Missing live mold body');
      const x = box.x + box.width / 2, y = box.y + box.height / 2;
      await page.mouse.move(x, y); await page.mouse.down();
      await page.mouse.move(x + 70, y + 16, { steps: 12 });
      await expect.poll(async () => Math.abs(Number(await gear.getAttribute('data-accessory-anchor-x')) - anchor) > 1.5 || await gear.getAttribute('data-accessory-matrix') !== matrix).toBe(true);
      await page.screenshot({ path: `migration-baseline-evidence/mold-${shapeId}-${accessory}-pull.png` });
      await page.mouse.up();
      await expect.poll(async () => Number(await page.locator('[data-sandbox-app]').getAttribute('data-sandbox-squeezes'))).toBeGreaterThan(0);
      await page.reload();
    }
    expect(await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('squishy.save.v3')!).library))).toBe(beforeSave);
    expect(errors).toEqual([]);
  });
}

for (const locale of ['ru-RU', 'en-US']) {
  for (const viewport of [{ width: 320, height: 568 }, { width: 568, height: 320 }, { width: 1440, height: 900 }]) {
    test(`all eight mold choices fit ${locale} at ${viewport.width}px`, async ({ browser, baseURL }) => {
      const context = await browser.newContext({ baseURL, locale, viewport });
      const page = await context.newPage();
      try {
        await page.goto('/squishy-squishes/');
        await page.locator('[data-library-new]').first().click();
        const panel = page.locator('[data-panel="shape"]');
        await expect(panel.locator('[data-shape]')).toHaveCount(8);
        for (const choice of await panel.getByRole('button').all()) {
          await expect(choice).toBeVisible();
          const rect = await choice.boundingBox();
          expect(rect).not.toBeNull();
          expect(rect!.width).toBeGreaterThanOrEqual(44);
          expect(rect!.height).toBeGreaterThanOrEqual(44);
          expect(rect!.x).toBeGreaterThanOrEqual(0);
          expect(rect!.x + rect!.width).toBeLessThanOrEqual(viewport.width + 1);
          expect(rect!.y + rect!.height).toBeLessThanOrEqual(viewport.height + 1);
          // The established selection badge is intentionally outside the button.
          // Audit actual text/icons, while tray/page overflow stays strict below.
          const content = await choice.evaluate(el => {
            const button = el.getBoundingClientRect();
            const children = [...el.children].map(child => {
              const bounds = child.getBoundingClientRect();
              return { text: child.textContent, client: child.clientWidth, scroll: child.scrollWidth,
                contained: bounds.left >= button.left - 1 && bounds.right <= button.right + 1 };
            });
            const range = document.createRange(); range.selectNodeContents(el);
            const text = range.getBoundingClientRect();
            return { children, textContained: text.left >= button.left - 1 && text.right <= button.right + 1 };
          });
          expect(content.textContained, JSON.stringify(content)).toBe(true);
          for (const child of content.children) {
            expect(child.contained, JSON.stringify(content)).toBe(true);
            expect(child.scroll <= child.client + 1, JSON.stringify(content)).toBe(true);
          }
        }
        expect(await panel.evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
        expect(await page.evaluate(() => ({ x: document.documentElement.scrollWidth > innerWidth, y: document.documentElement.scrollHeight > innerHeight }))).toEqual({ x: false, y: false });
        await mkdir('migration-baseline-evidence', { recursive: true });
        await page.screenshot({ path: `migration-baseline-evidence/mold-choices-${locale}-${viewport.width}.png` });
        await page.locator('[data-shape="dumpling"]').click();
        await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-shape', 'dumpling');
        await page.locator('[data-action="shape-continue"]').click();
        await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'paint');
      } finally { await context.close(); }
    });
  }
}
