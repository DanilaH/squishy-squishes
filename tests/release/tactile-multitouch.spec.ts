import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { createDefaultSaveV3 } from '../../src/platform/saveV3';
import { createEmptyDecorDocument } from '../../src/sandbox/decor';
import { createBodyFillStroke } from '../../src/sandbox/appearance';

for (const [locale, width, height, shapeId] of [
  ['ru-RU', 390, 844, 'dumpling'], ['en-US', 320, 568, 'paw'], ['ru-RU', 568, 320, 'mochi'],
] as const) for (const firstUp of [1, 2]) test(`two-finger stretch/compress and handoff ${shapeId} ${width} up=${firstUp}`, async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, locale, viewport: { width, height }, hasTouch: true });
  const page = await context.newPage();
  try {
    await page.goto('/squishy-squishes/');
    await page.evaluate(save => localStorage.setItem('squishy.save.v3', JSON.stringify(save)), {
      ...createDefaultSaveV3(), totalCrafts: 1,
      library: [{ id: 'multi', createdAt: 1700000000000, shapeId, materialId: 'jelly',
        appearance: { v: 1, strokes: [createBodyFillStroke(0xffb7cf)], mixins: [] },
        decor: { ...createEmptyDecorDocument(), eyes: 'dot', mouth: 'smile', blush: true, accessory: 'bow' } }],
    });
    await page.reload(); await page.locator('[data-library-play-id="multi"]').click();
    const shell = page.locator('[data-sandbox-app]'), canvas = page.locator('[data-sandbox-canvas]');
    await expect(canvas).toHaveAttribute('data-phaser-ready', 'true');
    const saved = await page.evaluate(() => localStorage.getItem('squishy.save.v3'));
    const box = (await canvas.boundingBox())!;
    const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const points = (gap: number) => [{ ...center, x: center.x - box.width * gap, id: 1 }, { ...center, x: center.x + box.width * gap, id: 2 }];
    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(.07) });
    await expect(shell).toHaveAttribute('data-squish-pointers', '2');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(.13) });
    await expect.poll(async () => Number(await shell.getAttribute('data-squish-stretch'))).toBeGreaterThan(.5);
    await expect.poll(async () => Number((await shell.getAttribute('data-face-reaction'))?.split(':')[2])).toBeGreaterThan(.5);
    await mkdir('migration-baseline-evidence', { recursive: true });
    await page.screenshot({ path: `migration-baseline-evidence/multi-${width}-${firstUp}-stretch.png` });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(.035) });
    await expect.poll(async () => Number(await shell.getAttribute('data-squish-stretch'))).toBe(0);
    await expect.poll(async () => Number(await shell.getAttribute('data-squish-max-displacement'))).toBeGreaterThan(.05);
    await page.screenshot({ path: `migration-baseline-evidence/multi-${width}-${firstUp}-compress.png` });
    const remaining = points(.035).filter(p => p.id !== firstUp);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: remaining });
    await expect(shell).toHaveAttribute('data-squish-pointers', '1');
    await expect(shell).toHaveAttribute('data-squish-active', 'true');
    await expect(shell).toHaveAttribute('data-sandbox-squeezes', '0');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: remaining.map(p => ({ ...p, y: p.y - box.height * .05 })) });
    await expect(shell).toHaveAttribute('data-squish-active', 'true');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(shell).toHaveAttribute('data-squish-pointers', '0');
    await expect(shell).toHaveAttribute('data-sandbox-squeezes', '1');
    await expect(shell).toHaveAttribute('data-face-reaction', '0:0');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(.07) });
    await expect(shell).toHaveAttribute('data-squish-pointers', '2');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await expect(shell).toHaveAttribute('data-squish-active', 'false');
    await expect(shell).toHaveAttribute('data-sandbox-squeezes', '1');
    expect(await page.evaluate(() => localStorage.getItem('squishy.save.v3'))).toBe(saved);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  } finally { await context.close(); }
});

test('desktop touch stroking and sparse idle blink preserve the saved toy', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, locale: 'en-US', viewport: { width: 1440, height: 900 }, hasTouch: true });
  const page = await context.newPage();
  try {
    await page.goto('/squishy-squishes/');
    await page.evaluate(save => localStorage.setItem('squishy.save.v3', JSON.stringify(save)), {
      ...createDefaultSaveV3(), totalCrafts: 1,
      library: [{ id: 'stroke', createdAt: 1700000000000, shapeId: 'dumpling', materialId: 'marshmallow',
        appearance: { v: 1, strokes: [createBodyFillStroke(0xffb7cf)], mixins: [] },
        decor: { ...createEmptyDecorDocument(), eyes: 'happy', mouth: 'cat', blush: true } }],
    });
    await page.reload(); await page.locator('[data-library-play-id="stroke"]').click();
    const shell = page.locator('[data-sandbox-app]'), canvas = page.locator('[data-sandbox-canvas]');
    await expect(canvas).toHaveAttribute('data-phaser-ready', 'true');
    const saved = await page.evaluate(() => localStorage.getItem('squishy.save.v3'));
    const box = (await canvas.boundingBox())!, cdp = await context.newCDPSession(page);
    const radiusRatio = await canvas.evaluate(el => Number.parseFloat(getComputedStyle(el).getPropertyValue('--squish-radius-ratio')));
    const radius = Math.min(box.width, box.height) * radiusRatio;
    const point = { id: 1, x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    for (let step = 1; step <= 24; step++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...point, x: point.x + radius * .0075 * step }] });
      await page.waitForTimeout(32);
    }
    await expect.poll(async () => Number(await shell.getAttribute('data-squish-stroking'))).toBeGreaterThan(.6);
    await expect.poll(async () => Number((await shell.getAttribute('data-face-reaction'))?.split(':')[1])).toBeGreaterThan(.5);
    await mkdir('migration-baseline-evidence', { recursive: true });
    await page.screenshot({ path: 'migration-baseline-evidence/stroke-desktop.png' });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(shell).toHaveAttribute('data-face-reaction', '0:0');
    await expect(shell).toHaveAttribute('data-squish-stroking', '0.000');
    // Observe the short blink without timing an assertion to a single frame.
    await shell.evaluate(el => {
      const samples: string[] = [], deadline = performance.now() + 5800;
      const record = (): void => {
        samples.push(el.getAttribute('data-face-reaction') ?? '');
        el.setAttribute('data-idle-reactions', JSON.stringify(samples));
        if (performance.now() < deadline) requestAnimationFrame(record);
      }; requestAnimationFrame(record);
    });
    await expect.poll(async () => JSON.parse(await shell.getAttribute('data-idle-reactions') ?? '[]').some((value: string) => value.includes(':b') && Number(value.split(':')[0]) === 0 && Number(value.split(':')[1]) === 0)).toBe(true);
    await expect(shell).toHaveAttribute('data-face-reaction', '0:0');
    expect(await page.evaluate(() => localStorage.getItem('squishy.save.v3'))).toBe(saved);
  } finally { await context.close(); }
});
