import { expect, test } from '@playwright/test';
import { createShapeField, getShape, isPointInsideShape } from '../../src/game/shapes';
import { SquishSimulation } from '../../src/squish/SquishSimulation';
import { createDefaultSaveV3 } from '../../src/platform/saveV3';
import { createEmptyDecorDocument } from '../../src/sandbox/decor';
import { mkdir } from 'node:fs/promises';

test('donut field, authoring and deformed grab agree on a genuine empty hole', () => {
  const shape = getShape('donut'), field = createShapeField(shape, 128);
  expect(isPointInsideShape(shape, 0, 0)).toBe(false);
  expect(field[64 * 128 + 64]).toBeGreaterThan(240);
  expect(field[64 * 128 + 105]).toBeLessThan(30);
  const sim = new SquishSimulation(shape);
  sim.setTactileFeatures(true, 'jelly');
  expect(sim.pointToUv(0, 0)).toBeNull();
  expect(sim.begin(1, 0, 0, .04)).toBe(false);
  expect(sim.begin(1, .65, 0)).toBe(true);
  for (let f = 1; f <= 40; f++) { sim.move(1, 2, .3); sim.advance(16, f * 16); }
  const center = sim.projectUvToLocal(.5, .5);
  expect(sim.surfacePointToUv(center.x, center.y)).toBeNull();
  const skin = sim.projectUvToLocal(.825, .5);
  expect(sim.surfacePointToUv(skin.x, skin.y)?.u).toBeCloseTo(.825, 6);
  sim.end(1);
  expect(sim.begin(2, center.x, center.y, .04)).toBe(false);
  expect(sim.begin(2, skin.x, skin.y)).toBe(true);
  expect(sim.vertices).toHaveLength(289);
});

test('production donut preserves its hole through Hall, Squeeze and reload', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/squishy-squishes/');
  const save = { ...createDefaultSaveV3(), totalCrafts: 1, library: [{
    id: 'hole-proof', createdAt: 1700000000000, shapeId: 'donut', materialId: 'soft',
    appearance: { v: 1, strokes: [], mixins: [] },
    decor: { ...createEmptyDecorDocument(), eyes: 'dot', mouth: 'smile', blush: true, accessory: 'bow' },
  }] };
  await page.evaluate(value => localStorage.setItem('squishy.save.v3', JSON.stringify(value)), save);
  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-hall-mounted', 'true');
  await mkdir('migration-baseline-evidence', { recursive: true });
  await page.screenshot({ path: 'migration-baseline-evidence/free-craft-donut-hall.png' });
  await page.locator('[data-library-play-id="hole-proof"]').click();
  const canvas = page.locator('[data-sandbox-canvas]');
  await expect(canvas).toHaveAttribute('data-phaser-ready', 'true');
  await page.screenshot({ path: 'migration-baseline-evidence/free-craft-donut-squeeze.png' });
  const box = (await canvas.boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + 90, y, { steps: 8 }); await page.mouse.up();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-sandbox-squeezes', '0');
  await page.mouse.move(x + 70, y); await page.mouse.down();
  await page.mouse.move(x + 145, y - 25, { steps: 12 }); await page.mouse.up();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-sandbox-squeezes', '1');
  await page.reload();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('squishy.save.v3')!).library[0].shapeId)).toBe('donut');
});
