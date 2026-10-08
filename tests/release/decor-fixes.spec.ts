import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { SHAPES, isPointInsideShape } from '../../src/game/shapes';
import { getAccessorySeats } from '../../src/sandbox/accessorySeats';

test('every mold has separate mirrored shoulder roots and a tilted side bow', () => {
  for (const shape of SHAPES) {
    const bow = getAccessorySeats(shape, 'bow')[0]!;
    const ears = getAccessorySeats(shape, 'cat-ears');
    expect(bow.u).toBeLessThan(.5);
    expect(bow.angle).toBeLessThan(0);
    expect(ears[0]!.u).toBeLessThan(ears[1]!.u);
    expect(ears.map(s => s.side)).toEqual(['left', 'right']);
    for (const root of [...ears, ...getAccessorySeats(shape, 'bunny-ears'), ...getAccessorySeats(shape, 'horns'), bow, ...getAccessorySeats(shape, 'crown')]) expect(isPointInsideShape(shape, root.u * 2 - 1, root.v * 2 - 1)).toBe(true);
  }
});

for (const locale of ['en-US', 'ru-RU']) for (const viewport of [
  { width: 320, height: 568 }, { width: 568, height: 320 }, { width: 1440, height: 900 },
]) {
  test(`Decor tabs keep controls and body still in ${locale} ${viewport.width}`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, locale, viewport, reducedMotion: 'reduce' });
    const page = await context.newPage();
    try {
      await page.goto('/squishy-squishes/?roomReview=0');
      await page.locator('[data-library-new]').first().click();
      await page.locator('[data-craft-section="paint"]').click();
      await page.locator('[data-craft-section="mixins"]').click();
      await page.locator('[data-craft-section="decor"]').click();
      const body = page.locator('[data-sandbox-canvas]');
      if (locale === 'en-US' && viewport.width === 320) {
        const pixels = await page.locator('[data-sticker-icon]').evaluateAll(icons => icons.map(el => {
          const canvas = el as HTMLCanvasElement;
          return [...canvas.getContext('2d')!.getImageData(48, 20, 1, 1).data];
        }));
        expect(pixels[0]![0]!).toBeGreaterThan(pixels[0]![1]! + 4); // Pink heart.
        expect(pixels[1]![0]!).toBeGreaterThan(pixels[1]![2]! + 4); // Gold star.
        expect(pixels[2]![1]!).toBeGreaterThan(pixels[2]![0]! + 4); // Mint flower.
        expect(pixels[3]![2]!).toBeGreaterThan(pixels[3]![1]! + 4); // Lilac sparkle.
      }
      const tabs = page.locator('.sandbox-decor-tabs'), next = page.locator('[data-action="save"]');
      const before = { tabs: await tabs.boundingBox(), next: await next.boundingBox(), body: await body.boundingBox() };
      for (const section of ['face', 'stickers', 'accessory', 'face']) {
        await page.locator(`button[data-decor-section="${section}"]`).click();
        expect({ tabs: await tabs.boundingBox(), next: await next.boundingBox(), body: await body.boundingBox() }).toEqual(before);
        const panel = page.locator(`[data-decor-panel="${section}"]`);
        expect(await panel.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
        if(section === 'accessory') expect(await panel.locator('.sandbox-decor-grid').evaluate(el=>el.scrollHeight>el.clientHeight)).toBe(true);
        for (const button of await panel.getByRole('button').all()) {
          await button.scrollIntoViewIfNeeded();
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
  await page.goto('/squishy-squishes/?roomReview=0');
  await page.locator('[data-library-new]').first().click();
  await page.locator('[data-shape="paw"]').click();
  await page.locator('[data-craft-section="paint"]').click();
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
  expect(pads.length).toBeGreaterThan(0);
  const checkPad = async (): Promise<void> => {
    for (const pad of pads) expect(await page.evaluate(index => [...(window as Window & { reliefCanvases: HTMLCanvasElement[] }).reliefCanvases[index]!.getContext('2d')!.getImageData(99, 61, 1, 1).data], pad!.index)).toEqual(pad!.pixel);
  };
  const box = (await page.locator('[data-sandbox-canvas]').boundingBox())!;
  const transform = await page.locator('[data-sandbox-canvas]').evaluate(el => {
    const style = getComputedStyle(el);
    return { radius: parseFloat(style.getPropertyValue('--squish-radius-ratio')) || .34,
      offset: parseFloat(style.getPropertyValue('--squish-center-offset-y')) || 0 };
  });
  const radius = Math.min(box.width, box.height) * transform.radius;
  const x = box.x + box.width / 2 + (99 / 256 * 2 - 1) * radius;
  const y = box.y + box.height / 2 - ((1 - 61 / 256) * 2 - 1 + transform.offset) * radius;
  await page.locator('[data-action="paint-settings"]').click(); await page.locator('[data-brush-size="56"]').click(); await page.locator('[data-action="tools-close"]').click();
  await page.mouse.move(x - 8, y); await page.mouse.down();
  await page.mouse.move(x + 8, y, { steps: 10 });
  await checkPad(); // Before pointer-up, the user's reported failure.
  await page.mouse.up(); await checkPad();
  await page.locator('[data-craft-section="mixins"]').click();
  await page.locator('[data-mixin="stars"]').click();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-mixin-count', '1');
  await checkPad();
});
