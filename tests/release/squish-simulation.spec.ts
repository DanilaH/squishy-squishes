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

test('M1: the production Phaser sandbox renders, accepts a real drag and reports one squeeze', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/squishy-squishes/?roomReview=0');
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
  await expect(canvas).toHaveAttribute('data-phaser-ready', 'true');
  await expect(canvas).toHaveAttribute('data-phaser-volume', 'deformable');
  const offsetBefore = Number(await canvas.getAttribute('data-squish-body-offset-x'));
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + Math.min(box.width * 0.15, 60), centerY, { steps: 12 });
  await expect.poll(async () => {
    const offset = Number(await canvas.getAttribute('data-squish-body-offset-x'));
    return Math.abs(offset - offsetBefore);
  }).toBeGreaterThan(0.02);
  await page.mouse.up();
  await expect.poll(async () => Number(await shell.getAttribute('data-sandbox-squeezes'))).toBe(1);
  await page.locator('[data-action="home"]').click();
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
});


test('stationary hold releases through the existing spring impulse without the tap kick', () => {
  const held = new SquishSimulation(), ordinary = new SquishSimulation();
  for (const simulation of [held, ordinary]) {
    expect(simulation.begin(1, 0, 0)).toBe(true);
    for (let n = 1; n <= 60; n++) simulation.advance(16, n * 16);
  }
  expect(held.end(1, true)).toBe(ordinary.end(1, false));
  expect(vertexTrace(held)).toEqual(vertexTrace(ordinary));
  expect(held.snapshot().squeezes).toBe(1);
  const tapped = new SquishSimulation(), plain = new SquishSimulation();
  for (const simulation of [tapped, plain]) {
    simulation.begin(1, 0, 0); simulation.advance(16, 16);
  }
  tapped.end(1, true); plain.end(1, false);
  expect(vertexTrace(tapped)).not.toEqual(vertexTrace(plain));
});

for (const shapeId of ['dumpling', 'paw', 'mochi'] as const) test(`two-finger field stays bounded and hands off either pointer: ${shapeId}`, () => {
  for (const firstUp of [1, 2]) {
    const sim = new SquishSimulation(getShape(shapeId));
    sim.setTactileFeatures(true);
    expect(sim.begin(1, -.25, 0)).toBe(true);
    expect(sim.begin(2, .25, 0)).toBe(true);
    expect(sim.begin(3, 0, 0)).toBe(false);
    for (let frame = 1; frame <= 40; frame++) {
      sim.move(1, -.55, 0); sim.move(2, .55, 0);
      const sample = sim.advance(16, frame * 16);
      expect(sample.pointers).toBe(2); expect(sample.stretch).toBeGreaterThan(.5);
      expect(Math.max(...sim.vertices.map(v => Math.hypot(v.x - v.restX, v.y - v.restY)))).toBeLessThanOrEqual(.720001);
    }
    expect(sim.projectUvToLocal(.75, .5).x - sim.projectUvToLocal(.25, .5).x).toBeGreaterThan(1.2);
    const before = vertexTrace(sim);
    expect(sim.end(firstUp, true)).toBeNull();
    expect(vertexTrace(sim)).toEqual(before);
    expect(sim.pointerOwner()).toBe(firstUp === 1 ? 2 : 1);
    expect(sim.snapshot().squeezes).toBe(0);
    expect(sim.end(firstUp === 1 ? 2 : 1, true)).toBeGreaterThan(.08);
    expect(sim.snapshot().squeezes).toBe(1);
    sim.advance(16, 656);
    expect(sim.snapshot().pointers).toBe(0);
  }
});

test('two-finger compression bulges sideways; cancellation never adds a release', () => {
  const sim = new SquishSimulation(); sim.setTactileFeatures(true);
  sim.begin(1, -.4, 0); sim.begin(2, .4, 0);
  for (let f = 1; f <= 40; f++) { sim.move(1, -.2, 0); sim.move(2, .2, 0); sim.advance(16, f * 16); }
  expect(sim.projectUvToLocal(.75, .5).x - sim.projectUvToLocal(.25, .5).x).toBeLessThan(.8);
  expect(sim.projectUvToLocal(.5, .75).y - sim.projectUvToLocal(.5, .25).y).toBeGreaterThan(1.1);
  const before = vertexTrace(sim); sim.cancel(); expect(vertexTrace(sim)).toEqual(before);
  expect(sim.snapshot().squeezes).toBe(0); expect(sim.snapshot().pointers).toBe(0);
});

test('material profiles are distinct, deterministic, bounded and eventually rest', () => {
  const traces: number[][] = [];
  for (const material of ['soft', 'jelly', 'marshmallow'] as const) {
    const left = new SquishSimulation(), right = new SquishSimulation();
    for (const sim of [left, right]) {
      sim.setTactileFeatures(true, material); drive(sim);
      traces.push(vertexTrace(sim));
      for (let f = 25; f <= 500; f++) sim.advance(16, f * 16);
      expect(sim.snapshot().maxDisplacement).toBeLessThan(.002);
      expect(sim.vertices.every(v => Number.isFinite(v.x) && Number.isFinite(v.vx))).toBe(true);
    }
    expect(vertexTrace(left)).toEqual(vertexTrace(right));
  }
  expect(traces[0]).not.toEqual(traces[2]); expect(traces[0]).not.toEqual(traces[4]);
});

test('slow short strokes are distinct from stationary holds and fast pulls', () => {
  const stroke = new SquishSimulation(), hold = new SquishSimulation(), pull = new SquishSimulation();
  for (const sim of [stroke, hold, pull]) { sim.setTactileFeatures(true); sim.begin(1, 0, 0); }
  for (let f = 1; f <= 50; f++) {
    stroke.move(1, f * .003, 0); pull.move(1, f * .018, 0);
    for (const sim of [stroke, hold, pull]) sim.advance(16, f * 16);
  }
  expect(stroke.snapshot().stroking).toBeGreaterThan(.8);
  expect(stroke.snapshot().pressDepth).toBeLessThan(hold.snapshot().pressDepth);
  expect(hold.snapshot().stroking).toBe(0); expect(pull.snapshot().stroking).toBe(0);
});

test('abrupt stretch-to-compression keeps the shared mesh ordered and face readable', () => {
  const sim = new SquishSimulation(); sim.setTactileFeatures(true, 'jelly');
  sim.begin(1, -.25, 0); sim.begin(2, .25, 0);
  for (let f = 1; f <= 120; f++) {
    const gap = f <= 40 ? .55 : .10;
    sim.move(1, -gap, 0); sim.move(2, gap, 0); sim.advance(16, f * 16);
    expect(sim.projectUvToLocal(.75, .5).x - sim.projectUvToLocal(.25, .5).x).toBeGreaterThan(.48);
    expect(sim.projectUvToLocal(.5, .75).y - sim.projectUvToLocal(.5, .25).y).toBeGreaterThan(.65);
    for (let row = 0; row <= 16; row++) {
      const vertices = sim.vertices.slice(row * 17, row * 17 + 17);
      expect(vertices.every((v, i) => i === 0 || v.x > vertices[i - 1]!.x)).toBe(true);
    }
  }
});
