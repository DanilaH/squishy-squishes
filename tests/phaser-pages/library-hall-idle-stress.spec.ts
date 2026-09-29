import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const KEY = 'squishy.phaser-pages-preview.squishy.save.v3';

test('30-second idle and 20 page turns retain one GPU context, stable V3 and bounded DOM', async ({ page }, info) => {
  test.setTimeout(120_000);
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
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  await page.evaluate((key) => {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (saved?.library?.length !== 1) throw new Error('Real V3 baseline is missing');
    saved.library = ['soft', 'jelly', 'holo', 'marshmallow', 'pearl', 'chrome', 'soft', 'holo']
      .map((materialId, index) => ({ ...saved.library[0], id: `idle-${index}`, materialId }));
    localStorage.setItem(key, JSON.stringify(saved));
  }, KEY);
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    let count = 0;
    Object.defineProperty(window, '__hallGpuContexts', { get: () => count });
    HTMLCanvasElement.prototype.getContext = function (kind: string, ...args: unknown[]) {
      const context = (original as (...arguments_: unknown[]) => unknown).call(this, kind, ...args);
      if (kind === 'webgl2' && context) count += 1;
      return context;
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '8');
  const before = await page.evaluate((key) => localStorage.getItem(key), KEY);
  const baseline = await page.locator('[data-library-thumbnail="idle-0"]').evaluate((element) => (element as HTMLCanvasElement).toDataURL());
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const idle = await page.evaluate(async () => {
    const perf = performance as Performance & { memory?: { usedJSHeapSize: number } };
    const heapBefore = perf.memory?.usedJSHeapSize ?? null;
    const frames: number[] = [];
    let last = performance.now();
    const start = last;
    await new Promise<void>((resolve) => {
      const frame = (now: number): void => {
        frames.push(now - last);
        last = now;
        if (now - start >= 30_000) { resolve(); return; }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    frames.sort((a, b) => a - b);
    const p95 = frames[Math.floor(frames.length * .95)] ?? null;
    return { sampledSeconds: (last - start) / 1000, frames: frames.length, p95FrameMs: p95,
      heapBefore, heapAfter: perf.memory?.usedJSHeapSize ?? null,
      cards: document.querySelectorAll('.sandbox-library-card').length,
      canvases: document.querySelectorAll('[data-library-thumbnail]').length,
      scene: document.querySelectorAll('.library-hall-scene').length,
      rooms: document.querySelectorAll('.library-hall-nav').length,
      gpuContexts: (window as unknown as { __hallGpuContexts: number }).__hallGpuContexts,
    };
  });
  expect(idle.sampledSeconds).toBeGreaterThanOrEqual(30);
  expect(idle.frames).toBeGreaterThan(100);
  expect(idle.p95FrameMs).not.toBeNull();
  expect(idle.p95FrameMs!).toBeLessThan(120);
  expect(idle).toMatchObject({ cards: 8, canvases: 8, scene: 1, rooms: 1, gpuContexts: 1 });
  await page.screenshot({ path: info.outputPath('library-hall-idle-30-seconds-phone-390.png'), animations: 'disabled' });
  for (let cycle = 0; cycle < 5; cycle++) {
    for (let step = 0; step < 3; step++) await page.locator('[data-library-hall-next]').click();
    for (let step = 0; step < 3; step++) await page.locator('[data-library-hall-prev]').click();
  }
  const after = await page.evaluate(() => ({
    cards: document.querySelectorAll('.sandbox-library-card').length,
    canvases: document.querySelectorAll('[data-library-thumbnail]').length,
    scene: document.querySelectorAll('.library-hall-scene').length,
    rooms: document.querySelectorAll('.library-hall-nav').length,
    gpuContexts: (window as unknown as { __hallGpuContexts: number }).__hallGpuContexts,
  }));
  expect(after).toEqual({ cards: 8, canvases: 8, scene: 1, rooms: 1, gpuContexts: 1 });
  expect(await page.locator('[data-library-thumbnail="idle-0"]').evaluate((element) => (element as HTMLCanvasElement).toDataURL())).toBe(baseline);
  expect(await page.evaluate((key) => localStorage.getItem(key), KEY)).toBe(before);
  expect(errors).toEqual([]);
  await writeFile(info.outputPath('library-hall-idle-and-30-turns-metrics.json'), JSON.stringify({ idle, after, observedPageErrors: errors }, null, 2));
});
