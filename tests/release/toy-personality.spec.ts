import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { ToyPersonality, accessoryMotion } from '../../src/sandbox/toyPersonality';
import { REST_TOY } from '../../src/sandbox/livingToy';
import { SquishSimulation } from '../../src/squish/SquishSimulation';
import { StageGestureRouter, type StageGestureHost } from '../../src/sandbox/StageGestureRouter';
import { createDefaultSaveV3 } from '../../src/platform/saveV3';
import { createBodyFillStroke } from '../../src/sandbox/appearance';
import { createEmptyDecorDocument } from '../../src/sandbox/decor';

test('personality follows deliberate gestures, clears cancellation and never starts a saved-state clock', () => {
  const toy = new ToyPersonality();
  expect(toy.sample(0, false, 0, 0)).toEqual({ surprise: 0, blink: 0 });
  for (const now of [100, 300, 500]) { toy.begin(now); toy.release(now + 70, .1); }
  expect(toy.sample(580, false, 0, 0).surprise).toBeGreaterThan(.8);
  expect(toy.sample(1300, false, 0, 0).surprise).toBe(0);
  toy.begin(1500); expect(toy.sample(1510, true, .9, 0).blink).toBe(0);
  expect(toy.sample(1850, true, .3, 0).blink).toBe(0);
  expect(toy.sample(2250, true, .9, 0).blink).toBeGreaterThan(.5);
  toy.sample(2300, true, 0, .8); toy.release(2350, .3);
  expect(toy.releasePose(2400).kind).toBe('jiggle');
  expect(toy.releasePose(3100)).toBe(REST_TOY);
  toy.cancel(); expect(toy.sample(2450, false, 0, 0)).toEqual({ surprise: 0, blink: 0 });
  // A slow renderer must classify queued input using native timestamps, while
  // the visible response begins when that input is actually processed.
  for (let i = 0; i < 3; i++) { toy.begin(5000 + i * 500, 10 + i * 125); toy.release(5350 + i * 500, .1, 75 + i * 125); }
  expect(toy.sample(6360, false, 0, 0).surprise).toBeGreaterThan(.8);
  toy.cancel();
  for (const id of ['bow', 'crown', 'bunny-ears', 'horns'] as const) for (let t = 0; t < 1200; t += 20) {
    const a = accessoryMotion(id, t, 1, 0), b = accessoryMotion(id, t, 1, 1);
    expect(Math.abs(a.angle)).toBeLessThanOrEqual(.11); expect(a.lift).toBeLessThanOrEqual(.035);
    if (id === 'bunny-ears') expect(b.angle).toBeCloseTo(-a.angle * .85, 8);
  }
});

test('material release remains distinct and every fast pinch stays ordered', () => {
  const values: number[] = [];
  for (const material of ['soft', 'jelly', 'marshmallow'] as const) {
    const sim = new SquishSimulation(); sim.setTactileFeatures(true, material);
    sim.begin(1, 0, 0);
    for (let f = 0; f < 40; f++) { sim.move(1, .3, 0); sim.advance(16, f * 16); }
    sim.end(1, false);
    for (let f = 40; f < 52; f++) sim.advance(16, f * 16);
    values.push(sim.snapshot().maxDisplacement);
    sim.cancel(); sim.begin(1, -.15, 0); sim.begin(2, .15, 0);
    let smallestGap = Infinity;
    for (let f = 0; f < 60; f++) {
      const gap = f < 30 ? .30 : .03; sim.move(1, -gap, 0); sim.move(2, gap, 0); sim.advance(16, f * 16);
      for (let i = 0; i < sim.vertices.length - 1; i++) if (i % 17 !== 16) smallestGap = Math.min(smallestGap, sim.vertices[i + 1]!.x - sim.vertices[i]!.x);
    }
    expect(smallestGap).toBeGreaterThan(0);
  }
  expect(values[2]).toBeGreaterThan(values[0]!); expect(new Set(values.map(n => n.toFixed(4))).size).toBe(3);
});

test('preview router commits one final position and cancels without editing', () => {
  const edits: unknown[] = [], previews: unknown[] = [];
  const host: StageGestureHost = { pointToUv: (x, y) => x < 0 ? null : { u: x, v: y }, paintPointToUv: () => null,
    beginSquish: () => false, moveSquish: () => {}, endSquish: () => {}, cancelSquish: () => {},
    paintStamp: () => {}, paintSegment: () => {}, paintEnd: () => {}, addMixin: () => {}, mixProgress: () => {},
    addSticker: p => edits.push(p), previewSticker: p => previews.push(p) };
  const router = new StageGestureRouter(host), p = (x: number) => ({ id: 1, x, y: .5, clientX: x, clientY: .5 });
  router.setStage('decor', 'stickers'); router.down(p(.3)); router.move(p(.7)); expect(edits).toHaveLength(0);
  router.up(1); expect(edits).toEqual([{ u: .7, v: .5 }]); expect(previews.at(-1)).toBeNull();
  router.down(p(.4)); router.cancel(); router.up(1); expect(edits).toHaveLength(1);
  router.down(p(.4)); router.move(p(-1)); router.up(1); expect(edits).toHaveLength(1);
});

for (const [locale, width, height] of [['ru-RU', 390, 844], ['en-US', 568, 320], ['en-US', 1440, 900]] as const)
test(`personality, Hall blink and drag preview remain durable ${locale} ${width}`, async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, locale, viewport: { width, height }, hasTouch: true });
  await context.addInitScript(() => {
    const Native = window.AudioContext;
    (window as unknown as { gestureBands: number[] }).gestureBands = [];
    window.AudioContext = class extends Native {
      constructor(options?: AudioContextOptions) {
        super(options); const factory = this.createBiquadFilter.bind(this);
        this.createBiquadFilter = () => {
          const filter = factory(), set = filter.frequency.setValueAtTime.bind(filter.frequency);
          filter.frequency.setValueAtTime = (value, time) => { (window as unknown as { gestureBands: number[] }).gestureBands.push(value); return set(value, time); };
          return filter;
        };
      }
    };
  });
  const page = await context.newPage(), errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto('/squishy-squishes/?roomReview=0');
    await page.evaluate(save => localStorage.setItem('squishy.save.v3', JSON.stringify(save)), {
      ...createDefaultSaveV3(), library: [{ id: 'personality', createdAt: 1700000000000, shapeId: 'dumpling', materialId: 'jelly',
        appearance: { v: 1, strokes: [createBodyFillStroke(0xffb7cf)], mixins: [] },
        decor: { ...createEmptyDecorDocument(), eyes: 'dot', mouth: 'smile', blush: true, accessory: 'crown' } }],
    });
    await page.reload(); const thumb = page.locator('[data-library-thumbnail="personality"]');
    const before = await page.evaluate(() => localStorage.getItem('squishy.save.v3'));
    await thumb.evaluate(el => {
      const observer = new MutationObserver(() => { if (el.getAttribute('data-library-reaction') === 'blink') el.setAttribute('data-saw-blink', 'true'); });
      observer.observe(el, { attributes: true, attributeFilter: ['data-library-reaction'] });
    });
    await expect(thumb).toHaveAttribute('data-saw-blink', 'true', { timeout: 11000 });
    await expect(thumb).toHaveAttribute('data-library-reaction', 'rest');
    expect(await page.evaluate(() => localStorage.getItem('squishy.save.v3'))).toBe(before);
    await page.locator('[data-library-play-id="personality"]').click();
    const shell = page.locator('[data-sandbox-app]'), canvas = page.locator('[data-sandbox-canvas]');
    await expect(canvas).toHaveAttribute('data-phaser-ready', 'true');
    let box = (await canvas.boundingBox())!;
    const cdp = await context.newCDPSession(page), point = { id: 1, x: box.x + box.width / 2, y: box.y + box.height / 2 };
    // Node waits avoid tracing a full WebGL/DOM snapshot between rapid touch events.
    const burstAt = Date.now() / 1000;
    for (let i = 0; i < 3; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point], timestamp: burstAt + i * .125 });
      await new Promise(resolve => setTimeout(resolve, 65)); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [], timestamp: burstAt + i * .125 + .065 });
      await new Promise(resolve => setTimeout(resolve, 60));
    }
    await expect(shell).toHaveAttribute('data-face-reaction', /:s/);
    await mkdir('migration-baseline-evidence', { recursive: true });
    await page.screenshot({ path: `migration-baseline-evidence/personality-${width}-surprise.png` });
    await expect(shell).toHaveAttribute('data-face-reaction', '0:0');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    const radius = Math.min(box.width, box.height) * await canvas.evaluate(el => Number.parseFloat(getComputedStyle(el).getPropertyValue('--squish-radius-ratio')));
    const strokeAt = performance.now();
    for (let f = 0; f < 48; f++) {
      // Constant slow travel in local units, regardless of CDP/GPU delivery latency.
      const phase = ((performance.now() - strokeAt) / 1000 * .18) % .32;
      const travel = phase < .16 ? phase : .32 - phase;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...point, x: point.x + radius * travel }] });
      await new Promise(resolve => setTimeout(resolve, 32));
    }
    await expect(shell).toHaveAttribute('data-face-reaction', /:b/);
    expect(await page.evaluate(() => (window as unknown as { gestureBands: number[] }).gestureBands.some(hz => hz >= 1100))).toBe(true);
    await page.screenshot({ path: `migration-baseline-evidence/personality-${width}-soothe.png` });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(shell).toHaveAttribute('data-face-reaction', '0:0');
    const pair = (gap: number) => [{ ...point, x: point.x - box.width * gap }, { ...point, id: 2, x: point.x + box.width * gap }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pair(.06) });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pair(.12) });
    await expect.poll(async () => Number(await shell.getAttribute('data-squish-stretch'))).toBeGreaterThan(.4);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(canvas).toHaveAttribute('data-toy-idle', 'jiggle');
    await expect(shell).toHaveAttribute('data-workshop-reaction', 'release');
    await page.screenshot({ path: `migration-baseline-evidence/personality-${width}-release.png` });
    await page.locator('[data-action="edit-saved"]').click(); await page.locator('button[data-decor-section="stickers"]').click();
    box = (await canvas.boundingBox())!; const a = { id: 1, x: box.x + box.width * .45, y: box.y + box.height * .55 };
    const b = { ...a, x: a.x + box.width * .07 };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [a] });
    await expect(page.locator('[data-sticker-preview]')).toBeVisible(); await expect(shell).toHaveAttribute('data-decor-sticker-count', '0');
    const preview = page.locator('[data-sticker-preview]');
    const previewColors = new Set([await preview.evaluate(el => (el as HTMLElement).style.backgroundImage)]);
    for (const step of [.015, .035, .055, .07]) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...a, x: a.x + box.width * step }] });
      previewColors.add(await preview.evaluate(el => (el as HTMLElement).style.backgroundImage));
    }
    expect(previewColors.size).toBeGreaterThan(1);
    await page.screenshot({ path: `migration-baseline-evidence/personality-${width}-preview.png` });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await expect(page.locator('[data-sticker-preview]')).toHaveCount(0); await expect(shell).toHaveAttribute('data-decor-sticker-count', '0');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [a] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [b] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(shell).toHaveAttribute('data-decor-sticker-count', '1');
    await page.locator('button[data-decor-section="stickers"]').click(); await page.locator('[data-action="decor-erase"]').click();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [b] });
    await expect(page.locator('[data-sticker-preview]')).toHaveAttribute('data-preview-tool', 'erase');
    await page.screenshot({ path: `migration-baseline-evidence/personality-${width}-eraser.png` });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(shell).toHaveAttribute('data-decor-sticker-count', '0');
    await page.locator('.craft-actions [data-action="draft-undo"]').click(); await expect(shell).toHaveAttribute('data-decor-sticker-count', '1');
    expect(await page.evaluate(() => localStorage.getItem('squishy.save.v3'))).toBe(before);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(canvas).toHaveAttribute('data-toy-idle', 'rest');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    expect(errors).toEqual([]);
  } finally { await context.close(); }
});
