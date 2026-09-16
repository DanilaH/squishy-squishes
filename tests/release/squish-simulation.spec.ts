import { expect, test } from '@playwright/test';
import { getShape } from '../../src/game/shapes';
import { createDefaultSaveV3, encodeSaveStateV3 } from '../../src/platform/saveV3';
import { createEmptyDecorDocument } from '../../src/sandbox/decor';
import { SquishSimulation } from '../../src/squish/SquishSimulation';

const vertexTrace = (simulation: SquishSimulation): number[] => simulation.vertices.flatMap((vertex) => [
  vertex.x, vertex.y, vertex.vx, vertex.vy,
]);

const drive = (simulation: SquishSimulation): void => {
  expect(simulation.begin(11, 0, 0)).toBe(true);
  for (let frame = 1; frame <= 12; frame += 1) {
    simulation.move(11, frame / 30, -frame / 45);
    simulation.advance(16, frame * 16);
  }
  expect(simulation.end(11)).toBeGreaterThan(0.08);
  for (let frame = 13; frame <= 24; frame += 1) simulation.advance(16, frame * 16);
};

test('M1: one 16×16 mesh, original triangle/line topology, and identity UV projection', () => {
  const simulation = new SquishSimulation();
  expect(simulation.vertices).toHaveLength(289);
  expect(simulation.triangleIndices).toHaveLength(1536);
  expect(simulation.lineIndices).toHaveLength(1088);
  expect(simulation.pointToUv(0, 0)).toEqual({ u: 0.5, v: 0.5 });
  expect(simulation.projectUvToLocal(0.5, 0.5)).toEqual({ x: 0, y: 0 });
  expect(simulation.pointToUv(5, 5)).toBeNull();
});

test('M1: identical time and pointer traces yield identical spring states', () => {
  const left = new SquishSimulation();
  const right = new SquishSimulation();
  drive(left);
  drive(right);
  expect(vertexTrace(left)).toEqual(vertexTrace(right));
  expect(left.snapshot()).toEqual(right.snapshot());
  expect(left.snapshot().squeezes).toBe(1);
  expect(left.snapshot().active).toBe(false);
});

test('M1: other pointers cannot steal or end a gesture; cancellation is not a squeeze', () => {
  const simulation = new SquishSimulation();
  expect(simulation.begin(7, 0, 0)).toBe(true);
  expect(simulation.begin(8, 0, 0)).toBe(false);
  simulation.move(8, 0.6, 0.6);
  expect(simulation.end(8)).toBeNull();
  expect(simulation.snapshot().active).toBe(true);
  simulation.cancel();
  expect(simulation.snapshot().squeezes).toBe(0);
  expect(simulation.begin(8, 0, 0)).toBe(true);
  simulation.advance(16, 16);
  expect(simulation.end(8)).not.toBeNull();
});

test('M1: long tab frame cannot advance springs beyond one 1/30-second step', () => {
  const paused = new SquishSimulation();
  const capped = new SquishSimulation();
  expect(paused.begin(1, 0, 0)).toBe(true);
  expect(capped.begin(1, 0, 0)).toBe(true);
  paused.move(1, 0.4, 0.2);
  capped.move(1, 0.4, 0.2);
  paused.advance(5000, 5000);
  capped.advance(1000 / 30, 5000);
  expect(vertexTrace(paused)).toEqual(vertexTrace(capped));
});

test('M1: shape changes retain mesh but change hit testing without resetting saved state', () => {
  const simulation = new SquishSimulation();
  const mesh = simulation.vertices;
  const before = vertexTrace(simulation);
  simulation.setShape(getShape('heart'));
  expect(simulation.vertices).toBe(mesh);
  expect(vertexTrace(simulation)).toEqual(before);
  expect(simulation.pointToUv(5, 5)).toBeNull();
});

test('M1: the original DOM sandbox still renders, accepts a real drag and reports one squeeze', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/squishy-squishes/');
  const state = {
    ...createDefaultSaveV3(),
    library: [{
      id: 'm1-synthetic-toy',
      createdAt: 1_700_000_000_000,
      shapeId: 'soft-square' as const,
      materialId: 'soft' as const,
      appearance: { v: 1 as const, strokes: [], mixins: [] },
      decor: createEmptyDecorDocument(),
    }],
  };
  await page.evaluate((serialized) => {
    localStorage.setItem('squishy.save.v3', serialized);
  }, JSON.stringify(encodeSaveStateV3(state)));
  await page.reload();
  await page.locator('[data-library-play-id="m1-synthetic-toy"]').click();
  const shell = page.locator('[data-sandbox-app]');
  await expect(shell).toHaveAttribute('data-stage', 'squeeze');
  const canvas = page.locator('[data-sandbox-canvas]');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Missing raw squishy canvas');
  expect(await canvas.evaluate((node) => (node as HTMLCanvasElement).getContext('webgl2')?.getContextAttributes()?.alpha)).toBe(true);
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + Math.min(box.width * 0.15, 60), centerY, { steps: 12 });
  await expect(canvas).toHaveClass(/is-active/);
  await page.mouse.up();
  await expect.poll(async () => Number(await shell.getAttribute('data-sandbox-squeezes'))).toBe(1);
  await expect(canvas).not.toHaveClass(/is-active/);
  await page.locator('[data-action="home"]').click();
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
});
