import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { createDefaultSaveV3 } from '../../src/platform/saveV3';
import { createEmptyDecorDocument } from '../../src/sandbox/decor';
import { createBodyFillStroke } from '../../src/sandbox/appearance';

for (const [locale, width, height, shapeId] of [
  ['ru-RU', 390, 844, 'dumpling'], ['en-US', 320, 568, 'paw'],
  ['ru-RU', 568, 320, 'mochi'], ['en-US', 1440, 900, 'dumpling'],
] as const) test(`touch hold, release and cancellation ${locale} ${width} ${shapeId}`, async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, locale, viewport: { width, height }, hasTouch: true });
  const page = await context.newPage();
  try {
    await page.goto('/squishy-squishes/?roomReview=0');
    await page.evaluate(save => localStorage.setItem('squishy.save.v3', JSON.stringify(save)), {
      ...createDefaultSaveV3(), totalCrafts: 1,
      library: [{ id: 'hold', createdAt: 1700000000000, shapeId, materialId: 'jelly',
        appearance: { v: 1, strokes: [createBodyFillStroke(0xffb7cf)], mixins: [] },
        decor: { ...createEmptyDecorDocument(), eyes: 'dot', mouth: 'smile', blush: true, accessory: 'bow' } }],
    });
    await page.reload(); await page.locator('[data-library-play-id="hold"]').click();
    const shell = page.locator('[data-sandbox-app]'), canvas = page.locator('[data-sandbox-canvas]');
    await expect(canvas).toHaveAttribute('data-phaser-ready', 'true');
    const saved = await page.evaluate(() => localStorage.getItem('squishy.save.v3'));
    const box = (await canvas.boundingBox())!;
    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 };
    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    await expect(shell).toHaveAttribute('data-squish-active', 'true');
    await expect.poll(async () => Number((await shell.getAttribute('data-face-reaction'))?.split(':')[0])).toBeGreaterThan(0);
    await mkdir('migration-baseline-evidence', { recursive: true });
    await page.screenshot({ path: `migration-baseline-evidence/hold-${width}-start.png` });
    await expect.poll(async () => Number((await shell.getAttribute('data-face-reaction'))?.split(':')[0])).toBeGreaterThanOrEqual(.75);
    await page.screenshot({ path: `migration-baseline-evidence/hold-${width}-held.png` });
    // Record all frames so an assertion cannot miss the short release expression.
    await shell.evaluate(el => {
      const samples: string[] = [];
      const end = performance.now() + 1200;
      const record = (): void => {
        samples.push(el.getAttribute('data-face-reaction') ?? '');
        el.setAttribute('data-touch-reactions', JSON.stringify(samples));
        if (performance.now() < end) requestAnimationFrame(record);
      };
      requestAnimationFrame(record);
    });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(shell).toHaveAttribute('data-squish-active', 'false');
    await expect.poll(async () => Number(await shell.getAttribute('data-sandbox-squeezes'))).toBe(1);
    await expect.poll(async () => JSON.parse(await shell.getAttribute('data-touch-reactions') ?? '[]').some((v: string) => Number(v.split(':')[0]) === 0 && Number(v.split(':')[1]) > 0)).toBe(true);
    await page.screenshot({ path: `migration-baseline-evidence/hold-${width}-released.png` });
    await expect(shell).toHaveAttribute('data-face-reaction', '0:0');
    const count = await shell.getAttribute('data-sandbox-squeezes');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    await expect(shell).toHaveAttribute('data-squish-active', 'true');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await expect(shell).toHaveAttribute('data-squish-active', 'false');
    await expect(shell).toHaveAttribute('data-face-reaction', '0:0');
    expect(await shell.getAttribute('data-sandbox-squeezes')).toBe(count);
    expect(await page.evaluate(() => localStorage.getItem('squishy.save.v3'))).toBe(saved);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  } finally { await context.close(); }
});
