import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { SHAPES, isPointInsideShape } from '../../src/game/shapes';
import { getAccessorySeats } from '../../src/sandbox/accessorySeats';
import { createDefaultSaveV3 } from '../../src/platform/saveV3';
import { createEmptyDecorDocument } from '../../src/sandbox/decor';

test('every mold has separate mirrored shoulder roots and a tilted side bow', () => {
  for (const shape of SHAPES) {
    const bow = getAccessorySeats(shape, 'bow')[0]!;
    const ears = getAccessorySeats(shape, 'cat-ears');
    expect(bow.u).toBeLessThan(.5);
    expect(bow.angle).toBeLessThan(0);
    expect(ears[0]!.u).toBeLessThan(ears[1]!.u);
    expect(ears.map(s => s.side)).toEqual(['left', 'right']);
    for (const root of [...ears, bow]) expect(isPointInsideShape(shape, root.u * 2 - 1, root.v * 2 - 1)).toBe(true);
  }
});

for (const locale of ['en-US', 'ru-RU']) for (const viewport of [
  { width: 320, height: 568 }, { width: 568, height: 320 }, { width: 1440, height: 900 },
]) {
  test(`Decor tabs keep controls and body still in ${locale} ${viewport.width}`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, locale, viewport, reducedMotion: 'reduce' });
    const page = await context.newPage();
    try {
      await page.goto('/squishy-squishes/');
      await page.locator('[data-library-new]').first().click();
      await page.locator('[data-action="shape-continue"]').click();
      await page.locator('[data-action="paint-continue"]').click();
      await page.locator('[data-action="mixin-continue"]').click();
      const body = page.locator('[data-sandbox-canvas]');
      const box = (await body.boundingBox())!;
      const x = box.x + box.width / 2, y = box.y + box.height / 2;
      await page.mouse.move(x, y); await page.mouse.down();
      for (let n = 0; n < 38; n++) await page.mouse.move(x + (n % 2 ? -55 : 55), y, { steps: 2 });
      await page.mouse.up();
      await page.locator('[data-action="mix-continue"]').click();
      const tabs = page.locator('.sandbox-decor-tabs'), next = page.locator('[data-action="decor-continue"]');
      const before = { tabs: await tabs.boundingBox(), next: await next.boundingBox(), body: await body.boundingBox() };
      for (const section of ['face', 'stickers', 'accessory', 'face']) {
        await page.locator(`[data-decor-section="${section}"]`).click();
        expect({ tabs: await tabs.boundingBox(), next: await next.boundingBox(), body: await body.boundingBox() }).toEqual(before);
        const panel = page.locator(`[data-decor-panel="${section}"]`);
        expect(await panel.evaluate(el => ({ vertical: el.scrollHeight > el.clientHeight + 1, horizontal: el.scrollWidth > el.clientWidth + 1 }))).toEqual({ vertical: false, horizontal: false });
        for (const button of await panel.getByRole('button').all()) {
          const rect = (await button.boundingBox())!;
          expect(rect.height).toBeGreaterThanOrEqual(44);
          expect(rect.y + rect.height).toBeLessThanOrEqual(viewport.height + 1);
        }
        for (const other of ['face', 'stickers', 'accessory'].filter(s => s !== section)) await expect(page.locator(`[data-decor-panel="${other}"]`)).toBeHidden();
        await mkdir('migration-baseline-evidence', { recursive: true });
        await page.screenshot({ path: `migration-baseline-evidence/decor-tab-${locale}-${viewport.width}-${section}.png` });
      }
      expect(await page.evaluate(() => ({ x: document.documentElement.scrollWidth > innerWidth, y: document.documentElement.scrollHeight > innerHeight }))).toEqual({ x: false, y: false });
    } finally { await context.close(); }
  });
}

test('paw pads remain intact throughout a live stroke and adding sprinkles', async ({ page }) => {
  await page.addInitScript(() => {
    const canvases: HTMLCanvasElement[] = [];
    (window as Window & { reliefCanvases?: HTMLCanvasElement[] }).reliefCanvases = canvases;
    const create = document.createElement.bind(document);
    document.createElement = ((...args: Parameters<typeof create>) => {
      const el = create(...args);
      if (el instanceof HTMLCanvasElement) canvases.push(el);
      return el;
    }) as typeof document.createElement;
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/squishy-squishes/');
  await page.locator('[data-library-new]').first().click();
  await page.locator('[data-shape="paw"]').click();
  await page.locator('[data-action="shape-continue"]').click();
  // Find the detached clean UV layer by the pad's actual pixel, independently
  // of implementation field names. On the old path it exists only in paint.
  const pads = await page.evaluate(() => {
    const canvases = (window as Window & { reliefCanvases: HTMLCanvasElement[] }).reliefCanvases;
    return canvases.map((canvas, index) => {
      if (canvas.width !== 256 || canvas.height !== 256) return null;
      const ctx = canvas.getContext('2d'); if (!ctx) return null;
      const pixel = [...ctx.getImageData(99, 61, 1, 1).data];
      return pixel[3]! > 150 && pixel[0]! > pixel[1]! + 35 ? { index, pixel } : null;
    }).filter(Boolean);
  });
  expect(pads).toHaveLength(1);
  const checkPad = async (): Promise<void> => {
    expect(await page.evaluate(index => [...(window as Window & { reliefCanvases: HTMLCanvasElement[] }).reliefCanvases[index]!.getContext('2d')!.getImageData(99, 61, 1, 1).data], pads[0]!.index)).toEqual(pads[0]!.pixel);
  };
  const box = (await page.locator('[data-sandbox-canvas]').boundingBox())!;
  await page.mouse.move(box.x + box.width * .35, box.y + box.height * .3); await page.mouse.down();
  await page.mouse.move(box.x + box.width * .65, box.y + box.height * .3, { steps: 15 });
  await checkPad(); // Before pointer-up, the user's reported failure.
  await page.mouse.up(); await checkPad();
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-mixin="stars"]').click();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-mixin-count', '1');
  await checkPad();
});

test('all mold bows and mirrored ears stay in front in Hall and Squeeze', async ({ page }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/squishy-squishes/');
  for (const accessory of ['bow', 'cat-ears', 'bunny-ears'] as const) {
    await page.evaluate(value => localStorage.setItem('squishy.save.v3', JSON.stringify(value)), {
      ...createDefaultSaveV3(), totalCrafts: 8,
      library: SHAPES.map((shape, n) => ({ id: shape.id, createdAt: 1700000000000 + n, shapeId: shape.id, materialId: 'soft',
        appearance: { v: 1, strokes: [], mixins: [] }, decor: { ...createEmptyDecorDocument(), accessory } })),
    });
    for (const shape of SHAPES) {
      await page.reload();
      const play = page.locator(`[data-library-play-id="${shape.id}"]`);
      await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-hall-mounted', 'true');
      for (let n = 0; n < 3 && !await play.isVisible(); n++) await page.locator('[data-library-hall-next]').click();
      await play.click();
      const gear = page.locator('[data-sandbox-accessory]');
      await expect.poll(() => gear.getAttribute('data-accessory-matrix')).not.toBeNull();
      expect(await gear.evaluate(el => Number(getComputedStyle(el).zIndex))).toBeGreaterThan(await page.locator('[data-sandbox-canvas]').evaluate(el => Number(getComputedStyle(el).zIndex)));
      if (accessory !== 'bow') {
        const right = page.locator('[data-accessory-part="right"]'); await expect(right).toBeVisible();
        expect(Number(await gear.getAttribute('data-accessory-anchor-x'))).toBeLessThan(Number(await right.getAttribute('data-accessory-anchor-x')));
      }
      await mkdir('migration-baseline-evidence', { recursive: true });
      await page.screenshot({ path: `migration-baseline-evidence/decor-seats-${shape.id}-${accessory}.png` });
    }
  }
});
