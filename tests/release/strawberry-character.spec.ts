import { expect, test } from '@playwright/test';
import { getShape, isPointInsideShape } from '../../src/game/shapes';
import { ToyPersonality } from '../../src/sandbox/toyPersonality';
import { SquishSimulation } from '../../src/squish/SquishSimulation';
import { createDefaultSaveV3 } from '../../src/platform/saveV3';
import { createEmptyDecorDocument } from '../../src/sandbox/decor';
import { createBodyFillStroke } from '../../src/sandbox/appearance';

test('berry has a shallow shoulder and a rounded, continuous bottom', () => {
  const shape = getShape('strawberry');
  const top = Math.max(...shape.boundary.map(p => p.y)), bottom = Math.min(...shape.boundary.map(p => p.y));
  expect(isPointInsideShape(shape, 0, top - .06)).toBe(true);
  expect(isPointInsideShape(shape, .04, bottom + .02)).toBe(true);
  expect(isPointInsideShape(shape, 0, 0)).toBe(true);
  expect(isPointInsideShape(shape, .95, 0)).toBe(false);
  expect(Math.abs(Math.max(...shape.boundary.map(p => p.x)) + Math.min(...shape.boundary.map(p => p.x)))).toBeLessThan(.001);
});

test('cheek response follows the caught side, eases out and clears on interruption', () => {
  for (const side of [-1, 1]) {
    const toy = new ToyPersonality(); toy.begin(0);
    for (let t = 0; t <= 320; t += 16) toy.sample(t, true, 0, 0, side * .6, .8);
    const held = toy.sample(336, true, 0, 0, side * .6, .8).cheek!;
    expect(held * side).toBeGreaterThan(.6);
    toy.release(350, .4);
    expect(toy.sample(366, false, 0, 0).cheek! * side).toBeGreaterThan(0);
    for (let t = 382; t < 1200; t += 16) toy.sample(t, false, 0, 0);
    expect(toy.sample(1200, false, 0, 0).cheek).toBeUndefined();
    toy.cancel(); expect(toy.sample(1300, false, 0, 0)).toEqual({ surprise: 0, blink: 0 });
  }
});

test('all material releases stay bounded and the foam memory eventually vanishes', () => {
  const remaining: number[] = [];
  for (const material of ['soft', 'jelly', 'marshmallow'] as const) {
    const sim = new SquishSimulation(getShape('strawberry')); sim.setTactileFeatures(true, material); sim.setViewportFollowEnabled(true);
    expect(sim.begin(1, .35, 0)).toBe(true);
    for (let f = 1; f <= 50; f++) { sim.move(1, .7, .1); sim.advance(16, f * 16); }
    sim.end(1);
    for (let f = 51; f <= 65; f++) sim.advance(16, f * 16);
    remaining.push(sim.snapshot().maxDisplacement);
    for (let f = 66; f <= 550; f++) sim.advance(16, f * 16);
    expect(sim.snapshot().maxDisplacement).toBeLessThan(.002);
    expect(sim.vertices.every(v => Number.isFinite(v.x) && Number.isFinite(v.y))).toBe(true);
  }
  expect(remaining[2]).toBeGreaterThan(remaining[0]!);
  expect(new Set(remaining.map(x => x.toFixed(4))).size).toBe(3);
});

test('cancellation and material changes discard transient foam memory', () => {
  const sims = Array.from({ length: 3 }, () => new SquishSimulation());
  for (const sim of sims) {
    sim.setTactileFeatures(true, 'marshmallow'); sim.begin(1, .35, 0);
    for (let f = 1; f <= 50; f++) { sim.move(1, .7, .1); sim.advance(16, f * 16); }
    sim.end(1);
  }
  sims[1]!.cancel();
  sims[2]!.setTactileFeatures(true, 'soft'); sims[2]!.setTactileFeatures(true, 'marshmallow');
  for (const sim of sims) for (let f = 51; f <= 70; f++) sim.advance(16, f * 16);
  expect(sims[0]!.snapshot().maxDisplacement).toBeGreaterThan(sims[1]!.snapshot().maxDisplacement);
  expect(sims[2]!.snapshot().maxDisplacement).toBeCloseTo(sims[1]!.snapshot().maxDisplacement, 9);
  expect(sims.every(sim => sim.snapshot().squeezes === 1)).toBe(true);
});

for (const [width, height] of [[390, 844], [1440, 900]] as const) test(`berry preview and both cheek gestures preserve old pigment ${width}`, async ({ browser, baseURL }, info) => {
  const context = await browser.newContext({ baseURL, viewport: { width, height } });
  const page = await context.newPage();
  try {
    await page.goto('/squishy-squishes/'); await page.locator('[data-library-new]').first().click();
    await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
    await page.locator('[data-shape="strawberry"]').click();
    await page.screenshot({ path: info.outputPath('berry-shape.png') });
    await page.locator('[data-craft-section="paint"]').click();
    // The starting pink is normal editable pigment, and clears like any fill.
    await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-paint-strokes', '1');
    await page.locator('[data-action="paint-settings"]').click(); await page.locator('[data-action="paint-clear"]').click(); await page.locator('[data-action="tools-close"]').click();
    await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-paint-strokes', '0');
    const save = { ...createDefaultSaveV3(), totalCrafts: 1, library: [{ id: 'berry', createdAt: 1, shapeId: 'strawberry', materialId: 'jelly',
      appearance: { v: 1, strokes: [createBodyFillStroke(0x8acfe0)], mixins: [] },
      decor: { ...createEmptyDecorDocument(), eyes: 'dot', mouth: 'smile', blush: true, accessory: 'bow' } }] };
    await page.evaluate(value => localStorage.setItem('squishy.save.v3', JSON.stringify(value)), save);
    await page.reload(); await page.locator('[data-library-play-id="berry"]').click();
    const shell = page.locator('[data-sandbox-app]'), canvas = page.locator('[data-sandbox-canvas]');
    await expect(canvas).toHaveAttribute('data-phaser-ready', 'true');
    const before = await page.evaluate(() => localStorage.getItem('squishy.save.v3'));
    const box = (await canvas.boundingBox())!, radius = await canvas.evaluate(el => el.clientWidth * parseFloat(getComputedStyle(el).getPropertyValue('--squish-radius-ratio')));
    for (const side of [-1, 1]) {
      const x = box.x + box.width / 2 + radius * .45 * side, y = box.y + box.height / 2;
      await page.mouse.move(x, y); await page.mouse.down();
      await expect.poll(async () => Number((await shell.getAttribute('data-face-reaction'))?.match(/:c(-?[\d.]+)/)?.[1] ?? 0) * side).toBeGreaterThan(.25);
      await page.screenshot({ path: info.outputPath(`berry-cheek-${side}.png`) });
      await page.mouse.up(); await expect(shell).toHaveAttribute('data-face-reaction', '0:0');
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.mouse.move(box.x + box.width / 2 + radius * .45, box.y + box.height / 2); await page.mouse.down();
    await expect(shell).toHaveAttribute('data-face-reaction', '0:0'); await page.mouse.up();
    expect(await page.evaluate(() => localStorage.getItem('squishy.save.v3'))).toBe(before);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  } finally { await context.close(); }
});
