import { expect, test } from '@playwright/test';
import { SHAPES, getShape } from '../../src/game/shapes';
import { SquishSimulation } from '../../src/squish/SquishSimulation';
import { containClipAxis, uncontainClipAxis } from '../../src/squish/projection';

const trace = (sim: SquishSimulation) => sim.vertices.flatMap(v => [v.x, v.y, v.vx, v.vy]);

test('viewport containment has a true inverse on the visible range', () => {
  for (const x of [-4, -1.4, -.96, -.9, -.3, 0, .8, .9, 1.6, 4]) expect(uncontainClipAxis(containClipAxis(x))).toBeCloseTo(x, 7);
});

for (const shape of SHAPES) test(`visible triangle UVs and returning edge can be grabbed: ${shape.id}`, () => {
  const sim = new SquishSimulation(shape); sim.setTactileFeatures(true); sim.setViewportFollowEnabled(true);
  expect(sim.begin(1, 0, 0)).toBe(true);
  for (let f = 1; f <= 30; f++) { sim.move(1, .75, .25); sim.advance(16, f * 16); }
  for (const [u, v] of [[.5, .5], [.625, .525], [.575, .625]]) {
    const p = sim.projectUvToLocal(u!, v!), hit = sim.surfacePointToUv(p.x, p.y);
    expect(hit?.u).toBeCloseTo(u!, 6); expect(hit?.v).toBeCloseTo(v!, 6);
  }
  sim.end(1);
  const boundary = shape.boundary.reduce((a, b) => b.x > a.x ? b : a);
  const u = (boundary.x * .985) * .5 + .5, v = (boundary.y * .985) * .5 + .5;
  const edge = sim.projectUvToLocal(u, v), before = trace(sim);
  expect(sim.surfacePointToUv(edge.x, edge.y)).not.toBeNull();
  expect(sim.begin(2, edge.x, edge.y, .05)).toBe(true);
  expect(trace(sim)).toEqual(before); // grabbing must not reset pixels or velocities
  sim.move(2, edge.x + .2, edge.y + .1); sim.advance(16, 496);
  expect(sim.snapshot().active).toBe(true);
  sim.cancel(); expect(sim.snapshot().squeezes).toBe(1);
});

test('edge tolerance follows the deformed silhouette, without grabbing empty space or altering authoring', () => {
  const sim = new SquishSimulation(getShape('mochi')); sim.setTactileFeatures(true);
  const boundary = getShape('mochi').boundary.reduce((a, b) => b.x > a.x ? b : a);
  expect(sim.pointToUv(boundary.x + .02, boundary.y)).toBeNull();
  expect(sim.begin(1, boundary.x + .02, boundary.y, .04)).toBe(true);
  sim.cancel(); expect(sim.begin(2, boundary.x + .10, boundary.y, .04)).toBe(false);
  expect(sim.begin(2, 3, 3, .12)).toBe(false);
});

test('a returning bulge outside the resting shape is caught rather than falling through', () => {
  const sim = new SquishSimulation(getShape('mochi')); sim.setTactileFeatures(true);
  sim.begin(1, .5, 0);
  for (let f = 1; f <= 30; f++) { sim.move(1, 1, .2); sim.advance(16, f * 16); }
  sim.end(1); sim.advance(16, 496);
  const edge = sim.projectUvToLocal(.9, .5);
  expect(sim.pointToUv(edge.x, edge.y)).toBeNull();
  expect(sim.begin(2, edge.x, edge.y)).toBe(true);
  expect(sim.end(2, true)).toBeGreaterThan(0); // regrab itself is a tap, not old drag distance
});

test('release spreads locally through the elastic field and settles for each tactile material', () => {
  for (const material of ['soft', 'jelly', 'marshmallow'] as const) {
    const sim = new SquishSimulation(); sim.setTactileFeatures(true, material);
    sim.vertices[144]!.vx = .5;
    sim.advance(16, 16); sim.advance(16, 32);
    expect(sim.vertices[145]!.vx).toBeGreaterThan(0);
    for (let f = 3; f <= 500; f++) sim.advance(16, f * 16);
    expect(Math.max(...sim.vertices.map(v => Math.hypot(v.x - v.restX, v.y - v.restY)))).toBeLessThan(.002);
  }
});

for (const [width, height, stage] of [[390, 844, 'squeeze'], [1440, 900, 'finish']] as const) {
  test(`real mouse catches the visible edge and returning protrusion in ${stage}`, async ({ browser, baseURL }, info) => {
    const context = await browser.newContext({ baseURL, viewport: { width, height }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    try {
      await page.goto('/squishy-squishes/');
      await page.evaluate(() => localStorage.setItem('squishy.save.v3', JSON.stringify({ version: 3, libraryCapacity: 8, totalCrafts: 1, completedRecipeIds: [], unlockedRewardIds: [], updatedAt: 1,
        library: [{ id: 'catch', createdAt: 1, shapeId: 'mochi', materialId: 'soft', appearance: { v: 1, strokes: [], mixins: [] }, decor: { v: 1, eyes: 'dot', mouth: 'smile', blush: true, stickers: [], accessory: 'bow' } }] })));
      await page.reload(); await page.locator('[data-library-play-id="catch"]').click();
      const canvas = page.locator('[data-sandbox-canvas]'), shell = page.locator('[data-sandbox-app]');
      await expect(canvas).toHaveAttribute('data-phaser-ready', 'true');
      if (stage === 'finish') { await page.locator('[data-action="edit-saved"]').click(); await page.locator('[data-action="decor-continue"]').click(); }
      await expect(shell).toHaveAttribute('data-stage', stage);
      const box = (await canvas.boundingBox())!, radius = await canvas.evaluate(el => el.clientWidth * parseFloat(getComputedStyle(el).getPropertyValue('--squish-radius-ratio')));
      const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
      const edge = async () => canvas.evaluate(el => new Promise<{ x: number; y: number }>(resolve => requestAnimationFrame(() => {
        const source = el as HTMLCanvasElement, copy = document.createElement('canvas'); copy.width = source.width; copy.height = source.height;
        const ctx = copy.getContext('2d')!; ctx.drawImage(source, 0, 0); const pixels = ctx.getImageData(0, 0, copy.width, copy.height).data;
        let right = 0, bestY = copy.height / 2;
        for (let y = Math.floor(copy.height / 2 - 8); y < copy.height / 2 + 8; y++) for (let x = Math.floor(copy.width / 2); x < copy.width; x++) {
          if (pixels[(y * copy.width + x) * 4 + 3]! > 200 && x > right) { right = x; bestY = y; }
        }
        const r = el.getBoundingClientRect(); resolve({ x: r.x + right * r.width / copy.width, y: r.y + bestY * r.height / copy.height });
      })));
      const resting = await edge();
      await page.mouse.move(resting.x + 4, resting.y); await page.mouse.down();
      await expect(shell).toHaveAttribute('data-squish-active', 'true');
      await page.mouse.up();
      await page.mouse.move(cx + radius * .5, cy); await page.mouse.down();
      await page.mouse.move(cx + radius * 1.05, cy, { steps: 12 });
      await expect.poll(async () => (await edge()).x - resting.x).toBeGreaterThan(12);
      await page.mouse.up();
      const returning = await edge();
      expect(returning.x).toBeGreaterThan(resting.x + 8);
      await page.mouse.move(returning.x - 3, returning.y); await page.mouse.down();
      await expect(shell).toHaveAttribute('data-squish-active', 'true');
      await page.mouse.move(Math.min(width - 20, returning.x + 20), returning.y - 15, { steps: 5 });
      await page.screenshot({ path: info.outputPath(`returning-edge-${stage}.png`) });
      await page.mouse.up(); await expect(shell).toHaveAttribute('data-squish-active', 'false');
      await page.mouse.move(15, height / 2); await page.mouse.down();
      await expect(shell).toHaveAttribute('data-squish-active', 'false'); await page.mouse.up();
    } finally { await context.close(); }
  });
}

test('a held regrab retains its local protrusion while a stationary press stays localized', () => {
  const sim = new SquishSimulation(getShape('mochi')); sim.setTactileFeatures(true);
  sim.begin(1, .5, 0);
  for (let f = 1; f <= 30; f++) { sim.move(1, 1, .2); sim.advance(16, f * 16); }
  sim.end(1); const caught = sim.projectUvToLocal(.9, .5);
  sim.begin(2, caught.x, caught.y);
  for (let f = 31; f <= 40; f++) sim.advance(16, f * 16);
  expect(sim.projectUvToLocal(.9, .5).x).toBeGreaterThan(.8 + .08);
  const press = new SquishSimulation(); press.setTactileFeatures(true); press.begin(1, 0, 0);
  for (let f = 1; f <= 60; f++) press.advance(16, f * 16);
  expect(press.projectUvToLocal(.5625, .5).x).toBeLessThan(.124);
  expect(press.projectUvToLocal(.875, .5).x).toBeCloseTo(.75, 2);
});
