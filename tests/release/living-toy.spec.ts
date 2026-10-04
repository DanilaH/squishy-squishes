import { expect, test } from '@playwright/test';
import { REST_TOY, idleToyPose, posePoint, unposePoint, inclusionLag, contactFeedback } from '../../src/sandbox/livingToy';
import { SquishSimulation } from '../../src/squish/SquishSimulation';

test('idle poses are sparse, bounded and preserve coordinate round trips', () => {
  const kinds = new Set<string>(); let moving = 0;
  for (let ms = 0; ms < 37500; ms += 25) {
    const pose = idleToyPose(ms); kinds.add(pose.kind);
    if (pose.kind !== 'rest') moving++;
    expect(Math.abs(pose.rotation)).toBeLessThanOrEqual(.043);
    expect(Math.abs(pose.skew)).toBeLessThanOrEqual(.024);
    const point = posePoint(.6, -.4, pose), rest = unposePoint(point.x, point.y, pose);
    expect(rest.x).toBeCloseTo(.6, 8); expect(rest.y).toBeCloseTo(-.4, 8);
  }
  expect([...kinds].sort()).toEqual(['blink', 'jiggle', 'rest', 'stretch', 'sway']);
  expect(moving).toBeLessThan(180); expect(idleToyPose(4999)).toBe(REST_TOY);
});

test('contact grows with compression; lag stays bounded and settles without input', () => {
  expect(contactFeedback(1, .5, 0, 0).width).toBeGreaterThan(contactFeedback(0, 0, 0, 0).width);
  expect(contactFeedback(0, 0, 1, .1).opacity).toBeLessThan(.76);
  let lag = 0;
  for (let f = 0; f < 30; f++) lag = inclusionLag(lag, 2, 16);
  expect(Math.abs(lag)).toBeLessThanOrEqual(.035); expect(Math.abs(lag)).toBeGreaterThan(.01);
  for (let f = 0; f < 120; f++) lag = inclusionLag(lag, 0, 16);
  expect(Math.abs(lag)).toBeLessThan(.00002);
});

test('short back-and-forth strokes stay strokes and an edge pull stays local', () => {
  const sim = new SquishSimulation(); sim.setTactileFeatures(true); sim.begin(1, 0, 0);
  for (let f = 1; f <= 70; f++) { sim.move(1, Math.sin(f / 18) * .07, 0); sim.advance(16, f * 16); }
  expect(sim.snapshot().stroking).toBeGreaterThan(.6);
  const edge = new SquishSimulation(), broad = new SquishSimulation();
  edge.setTactileFeatures(true);
  for (const toy of [edge, broad]) {
    toy.begin(1, .75, 0);
    for (let f = 1; f <= 40; f++) { toy.move(1, 1.05, 0); toy.advance(16, f * 16); }
  }
  expect(Math.abs(edge.projectUvToLocal(.5, .5).x)).toBeLessThan(Math.abs(broad.projectUvToLocal(.5, .5).x));
  expect(edge.projectUvToLocal(.875, .5).x).toBeGreaterThan(.85);
});

import { mkdir } from 'node:fs/promises';
import { createDefaultSaveV3 } from '../../src/platform/saveV3';
import { createBodyFillStroke } from '../../src/sandbox/appearance';
import { createEmptyDecorDocument } from '../../src/sandbox/decor';

for (const [locale, width, height, shapeId] of [
  ['ru-RU', 390, 844, 'dumpling'], ['en-US', 568, 320, 'paw'], ['en-US', 1440, 900, 'mochi'],
] as const) test(`living toy stays aligned, yields to touch and pauses ${locale} ${width}`, async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, locale, viewport: { width, height }, hasTouch: true });
  const page = await context.newPage();
  try {
    await page.goto('/squishy-squishes/');
    await page.evaluate(save => localStorage.setItem('squishy.save.v3', JSON.stringify(save)), {
      ...createDefaultSaveV3(), totalCrafts: 1,
      library: [{ id: 'living', createdAt: 1700000000000, shapeId, materialId: 'jelly',
        appearance: { v: 1, strokes: [createBodyFillStroke(0xffb7cf)], mixins: [
          { x: 112, y: 135, s: 14, r: 50, t: 1 }, { x: 145, y: 119, s: 12, r: 70, t: 3 },
        ] }, decor: { ...createEmptyDecorDocument(), eyes: 'dot', mouth: 'smile', blush: true, accessory: 'bow' } }],
    });
    await page.reload(); await page.locator('[data-library-play-id="living"]').click();
    const shell = page.locator('[data-sandbox-app]'), canvas = page.locator('[data-sandbox-canvas]');
    await expect(canvas).toHaveAttribute('data-phaser-ready', 'true');
    const saved = await page.evaluate(() => localStorage.getItem('squishy.save.v3'));
    const box = (await canvas.boundingBox())!;
    await expect(page.locator('[data-sandbox-hint]')).toContainText(locale === 'ru-RU' ? 'двумя пальцами' : 'two fingers');
    // Frame observation catches brief movements without racing one pose boundary.
    await canvas.evaluate(el => {
      const samples: { rotation: number; skew: number; accessory: string }[] = [], end = performance.now() + 16000;
      const record = (): void => {
        samples.push({ rotation: Number(el.getAttribute('data-toy-rotation')), skew: Number(el.getAttribute('data-toy-skew')), accessory: (document.querySelector('[data-sandbox-accessory]') as HTMLElement)?.style.transform });
        el.setAttribute('data-living-samples', JSON.stringify(samples));
        if (performance.now() < end) requestAnimationFrame(record);
      }; requestAnimationFrame(record);
    });
    await expect.poll(async () => JSON.parse(await canvas.getAttribute('data-living-samples') ?? '[]').some((s: { rotation: number; skew: number }) => Math.abs(s.rotation) > .005 && Math.abs(s.skew) > .003), { timeout: 16000 }).toBe(true);
    await mkdir('migration-baseline-evidence', { recursive: true });
    await page.screenshot({ path: `migration-baseline-evidence/living-${width}-idle.png` });
    expect(await canvas.boundingBox()).toEqual(box);
    const cdp = await context.newCDPSession(page), point = { id: 1, x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    await expect(shell).toHaveAttribute('data-squish-active', 'true');
    await expect(canvas).toHaveAttribute('data-toy-idle', 'rest');
    await expect(canvas).toHaveAttribute('data-toy-rotation', '0.0000');
    await expect(page.locator('[data-sandbox-hint]')).not.toContainText(locale === 'ru-RU' ? 'двумя пальцами' : 'two fingers');
    await expect.poll(async () => Number(await page.locator('.sandbox-stage').evaluate(el => (el as HTMLElement).style.getPropertyValue('--toy-contact-width')))).toBeGreaterThan(1.04);
    await page.screenshot({ path: `migration-baseline-evidence/living-${width}-press.png` });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...point, x: point.x + box.width * .035 }] });
    await page.screenshot({ path: `migration-baseline-evidence/living-${width}-pull.png` });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await expect(shell).toHaveAttribute('data-sandbox-squeezes', '0');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(canvas).toHaveAttribute('data-toy-idle', 'rest');
    await expect(canvas).toHaveAttribute('data-toy-skew', '0.0000');
    await expect(shell).toHaveAttribute('data-face-reaction', '0:0');
    expect(await page.evaluate(() => localStorage.getItem('squishy.save.v3'))).toBe(saved);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    await page.reload(); await page.locator('[data-library-play-id="living"]').click();
    await expect(canvas).toHaveAttribute('data-phaser-ready', 'true');
    expect(await page.evaluate(() => localStorage.getItem('squishy.save.v3'))).toBe(saved);
  } finally { await context.close(); }
});
