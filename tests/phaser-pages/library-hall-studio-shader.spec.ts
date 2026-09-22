import { expect, test } from '@playwright/test';

const key = 'squishy.phaser-pages-preview.squishy.save.v3';

test('one reusable GPU context renders saved Studio material pixels; V3 data survives paging', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    let count = 0;
    Object.defineProperty(window, '__libraryCreatedWebGL', { get: () => count });
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      const result = (original as (...args: unknown[]) => unknown).call(this, type, ...args);
      if (type === 'webgl2' && result) count++;
      return result;
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto('/phaser/');
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  await page.locator('[data-action="shape-continue"]').click();
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();
  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('Missing Studio canvas');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 0; i < 22; i++) await page.mouse.move(x + (i % 2 ? -65 : 65), y, { steps: 3 });
  await page.mouse.up();
  await page.locator('[data-action="mix-continue"]').click();
  await page.locator('[data-action="decor-continue"]').click();
  await page.locator('[data-material="chrome"]').click();
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  await page.evaluate((storageKey) => {
    const save = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
    if (!save?.library?.[0]) throw new Error('Missing genuine saved toy');
    save.library = ['soft', 'jelly', 'holo', 'marshmallow', 'pearl', 'chrome', 'jelly', 'chrome'].map((materialId, index) => ({
      ...save.library[0], id: `shader-audit-${index}`, materialId,
    }));
    localStorage.setItem(storageKey, JSON.stringify(save));
  }, key);
  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '8');
  const before = await page.evaluate((storageKey) => localStorage.getItem(storageKey), key);
  const firstRoomPixels = await page.locator('.sandbox-library-card:visible canvas').first()
    .evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL());
  for (let index = 0; index < 4; index++) {
    const visible = page.locator('.sandbox-library-card:visible canvas');
    await expect(visible).toHaveCount(2);
    await expect(visible.first()).toHaveAttribute('data-library-renderer', 'studio-shader');
    expect(await visible.evaluateAll(canvases => canvases.every(item => (item as HTMLCanvasElement).width === 512 && (item as HTMLCanvasElement).height === 512)),
      'Pages only: 512px backing for each genuine Studio shader thumbnail').toBe(true);
    expect(await visible.evaluateAll((canvases) => canvases.every((item) => item.getAttribute('data-library-renderer') === 'studio-shader'))).toBe(true);
    if (index < 3) {
      await expect(page.locator('[data-library-hall-next]')).toBeEnabled();
      await page.locator('[data-library-hall-next]').click();
    }
  }
  await expect(page.locator('[data-library-hall-next]')).toBeDisabled();
  const stats = await page.evaluate(() => ({
    contexts: (window as unknown as { __libraryCreatedWebGL: number }).__libraryCreatedWebGL,
    canvases: document.querySelectorAll('canvas[data-library-renderer="studio-shader"]').length,
  }));
  expect(stats.contexts, 'one shared WebGL2 context across all saved exhibits').toBe(1);
  expect(stats.canvases).toBeGreaterThan(0);
  for (let index = 0; index < 3; index++) await page.locator('[data-library-hall-prev]').click();
  const firstRoomPixelsAgain = await page.locator('.sandbox-library-card:visible canvas').first()
    .evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL());
  expect(firstRoomPixelsAgain, 'page turn must not mutate previously rendered Studio pixels').toBe(firstRoomPixels);
  expect(await page.evaluate((storageKey) => localStorage.getItem(storageKey), key)).toBe(before);
});

test('missing WebGL2 uses Canvas2D without discarding a genuinely saved V3 toy', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/phaser/');
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  await page.locator('[data-action="shape-continue"]').click();
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();
  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('Missing real Studio canvas');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 0; i < 22; i++) await page.mouse.move(x + (i % 2 ? -65 : 65), y, { steps: 3 });
  await page.mouse.up();
  await page.locator('[data-action="mix-continue"]').click();
  await page.locator('[data-action="decor-continue"]').click();
  await page.locator('[data-material="chrome"]').click();
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  const before = await page.evaluate((storageKey) => localStorage.getItem(storageKey), key);
  expect(before).not.toBeNull();
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      return type === 'webgl2' ? null : (original as (...args: unknown[]) => unknown).call(this, type, ...args);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '1');
  await expect(page.locator('[data-library-thumbnail]')).toHaveAttribute('data-library-renderer', 'canvas2d-fallback');
  expect(await page.locator('[data-library-thumbnail]').evaluate(canvas => (canvas as HTMLCanvasElement).width)).toBe(512);
  expect(await page.evaluate((storageKey) => localStorage.getItem(storageKey), key)).toBe(before);
});
