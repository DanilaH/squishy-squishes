import { mkdir } from 'node:fs/promises';
import { reachableControlIssues } from '../phaser-pages/helpers/reachableControls';
import sharp from 'sharp';
import { expect, test } from '@playwright/test';
import { SHAPES, getShape } from '../../src/game/shapes';
import { MATERIALS } from '../../src/game/content';
import { SquishSimulation } from '../../src/squish/SquishSimulation';
import { createDefaultSaveV3 } from '../../src/platform/saveV3';
import { createBodyFillStroke, createMixInPlacement } from '../../src/sandbox/appearance';
import { createEmptyDecorDocument, getDecorFrame } from '../../src/sandbox/decor';

const face = getDecorFrame(getShape('soft-square'));
const document = { v: 1 as const, strokes: [createBodyFillStroke(0xffb7cf)], mixins: [
  createMixInPlacement('pearls', face.eyesLeft, 32, 0),
  createMixInPlacement('pearls', face.mouth, 32, 0),
] };
const savedToy = { id: 'unified', createdAt: 1700000000000, shapeId: 'soft-square' as const, materialId: 'jelly' as const,
  appearance: document, decor: { ...createEmptyDecorDocument(), eyes: 'dot' as const, mouth: 'smile' as const, blush: true, accessory: 'bow' as const } };

test('extreme single and two-finger reversals keep every mold mesh ordered and above its floor', () => {
  for (const shape of SHAPES) for (const material of MATERIALS) {
    const simulation = new SquishSimulation(shape);
    simulation.setTactileFeatures(true, material.id); simulation.setViewportFollowEnabled(true);
    const floor = Math.min(...shape.boundary.map(p => p.y)) - .10;
    for (const [dx, dy] of [[3, 0], [-3, 0], [0, -3], [3, -3]]) {
      const grab = simulation.projectUvToLocal(shape.holes ? .8 : .5, .5);
      expect(simulation.begin(1, grab.x, grab.y), `${shape.id}/${material.id} regrab`).toBe(true);
      let smallestArea = Infinity, lowestFloorMargin = Infinity;
      for (let f = 0; f < 48; f++) {
        simulation.move(1, f % 8 < 4 ? dx! : -dx!, dy!);
        simulation.advance(16, f * 16);
        for (let i = 0; i < simulation.triangleIndices.length; i += 3) {
          const a = simulation.vertices[simulation.triangleIndices[i]!]!, b = simulation.vertices[simulation.triangleIndices[i + 1]!]!, c = simulation.vertices[simulation.triangleIndices[i + 2]!]!;
          smallestArea = Math.min(smallestArea, (b.y - a.y) * (c.x - a.x) - (b.x - a.x) * (c.y - a.y));
        }
        for (const p of shape.boundary) lowestFloorMargin = Math.min(lowestFloorMargin, simulation.projectUvToLocal(p.x * .5 + .5, p.y * .5 + .5).y - floor);
      }
      expect(smallestArea, `${shape.id}/${material.id} triangle`).toBeGreaterThan(.002);
      expect(lowestFloorMargin, `${shape.id}/${material.id} floor`).toBeGreaterThanOrEqual(-.005);
      simulation.cancel();
    }
    const pinch = new SquishSimulation(shape);
    pinch.setTactileFeatures(true, material.id); pinch.setViewportFollowEnabled(true);
    expect(pinch.begin(1, shape.holes ? -.5 : -.15, 0)).toBe(true); expect(pinch.begin(2, shape.holes ? .5 : .15, 0)).toBe(true);
    let smallestArea = Infinity;
    for (let f = 0; f < 48; f++) {
      const gap = f % 8 < 4 ? 3 : .01;
      pinch.move(1, -gap, -3); pinch.move(2, gap, -3); pinch.advance(16, f * 16);
      for (let i = 0; i < pinch.triangleIndices.length; i += 3) {
        const a = pinch.vertices[pinch.triangleIndices[i]!]!, b = pinch.vertices[pinch.triangleIndices[i + 1]!]!, c = pinch.vertices[pinch.triangleIndices[i + 2]!]!;
        smallestArea = Math.min(smallestArea, (b.y - a.y) * (c.x - a.x) - (b.x - a.x) * (c.y - a.y));
      }
    }
    expect(smallestArea, `${shape.id}/${material.id} two fingers`).toBeGreaterThan(.002);
  }
});

test('Hall recovers a failed furniture request and keeps decoded props after readiness', async ({ page }) => {
  let attempts = 0;
  await page.route('**/cabinet-*.webp', async route => {
    if (++attempts === 1) await route.abort('failed'); else await route.continue();
  });
  await page.goto('/squishy-squishes/');
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-hall-mounted', 'true');
  expect(attempts).toBeGreaterThan(1);
  const sources = await page.locator('.library-hall-scene').evaluate(el => ['cabinet', 'shelf', 'plant'].map(name => (el as HTMLElement).style.getPropertyValue(`--hall-${name}`)));
  for (const source of sources) expect(source).toContain('data:image/png;base64,');
  await expect(page.locator('[data-sandbox-library]')).toHaveCSS('--hall-pedestal', /data:image\/png;base64,/);
});

for (const [locale, width, height] of [['ru-RU', 320, 568], ['en-US', 390, 844], ['ru-RU', 568, 320], ['en-US', 1440, 900]] as const) {
  test(`one stable editor grid and preview physics ${locale} ${width}`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, locale, viewport: { width, height }, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage(); const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
    try {
      await page.goto('/squishy-squishes/');
      await page.evaluate(save => localStorage.setItem('squishy.save.v3', JSON.stringify(save)), { ...createDefaultSaveV3(), library: [savedToy] });
      await page.reload(); await page.locator('[data-library-play-id="unified"]').click();
      const canvas = page.locator('[data-sandbox-canvas]'), shell = page.locator('[data-sandbox-app]');
      await expect(canvas).toHaveAttribute('data-phaser-ready', 'true');
      await page.locator('[data-action="edit-saved"]').click();
      const geometry = async () => canvas.evaluate(el => {
        const r = el.getBoundingClientRect(), desk = document.querySelector('[data-studio-desk]')!.getBoundingClientRect();
        return [r.x + r.width / 2, r.y + r.height / 2, r.width * parseFloat(getComputedStyle(el).getPropertyValue('--squish-radius-ratio')), desk.x, desk.y, desk.width, desk.height];
      });
      const stable = await geometry();
      await mkdir('migration-baseline-evidence', { recursive: true });
      for (const section of ['face', 'stickers', 'accessory']) {
        await page.locator(`button[data-decor-section="${section}"]`).click();
        for (const choice of await page.locator(`[data-decor-panel="${section}"] button`).all()) {
          await choice.scrollIntoViewIfNeeded();
          await expect(choice).toBeInViewport();
        }
        const measurements = await page.evaluate(() => {
          const shell = document.querySelector('[data-sandbox-app]')!, exit = shell.querySelector('[data-action="exit-craft"]')!.getBoundingClientRect();
          return { exitCenter: exit.x + exit.width / 2, scroll: document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight };
        });
        expect(await reachableControlIssues(page)).toEqual([]); expect(measurements.exitCenter).toBeCloseTo(width / 2, 0); expect(measurements.scroll).toBe(false);
        expect(await geometry()).toEqual(stable);
        await page.screenshot({ path: `migration-baseline-evidence/editor-${width}-${section}.png` });
      }
      await page.locator('[data-craft-section="shape"]').click(); await page.locator('[data-base-tab="material"]').click(); await page.locator('[data-action="try-on"]').click();
      await expect.poll(geometry).toEqual(stable);
      await page.screenshot({ path: `migration-baseline-evidence/editor-${width}-finish.png` });
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      const r = (await canvas.boundingBox())!, cdp = await context.newCDPSession(page);
      const points = (gap: number) => [{ id: 1, x: r.x + r.width * (.5 - gap), y: r.y + r.height * .5 }, { id: 2, x: r.x + r.width * (.5 + gap), y: r.y + r.height * .5 }];
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(.04) });
      await expect(shell).toHaveAttribute('data-squish-pointers', '2');
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(.10) });
      await expect.poll(async () => Number(await shell.getAttribute('data-squish-stretch'))).toBeGreaterThan(.5);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
      await expect(shell).toHaveAttribute('data-squish-pointers', '0');
      expect(errors).toEqual([]);
    } finally { await context.close(); }
  });
}

test('Hall and Squeeze share material pixels and face ink covers existing pearls', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  try {
    await page.goto('/squishy-squishes/');
    for (const material of MATERIALS) {
      await page.evaluate(save => localStorage.setItem('squishy.save.v3', JSON.stringify(save)), { ...createDefaultSaveV3(), library: [{ ...savedToy, materialId: material.id, decor: { ...savedToy.decor, accessory: null } }] });
      await page.reload(); await expect(page.locator('[data-library-thumbnail]')).toHaveAttribute('data-library-renderer', 'volume-mesh');
      const hall = await page.locator('[data-library-thumbnail]').evaluate(el => (el as HTMLCanvasElement).toDataURL());
      await page.locator('[data-library-play-id="unified"]').click(); const canvas = page.locator('[data-sandbox-canvas]');
      await expect(canvas).toHaveAttribute('data-phaser-ready', 'true');
      const live = await canvas.evaluate(el => new Promise<string>(resolve => requestAnimationFrame(() => resolve((el as HTMLCanvasElement).toDataURL()))));
      const decode = async (uri: string) => sharp(Buffer.from(uri.split(',')[1]!, 'base64')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const a = await decode(hall), b = await decode(live);
      const pixel = (image: typeof a, u: number, v: number, radius: number) => {
        const x = Math.round(image.info.width / 2 + (u * 2 - 1) * radius * 1.075), y = Math.round(image.info.height / 2 - ((v * 2 - 1) * .905 - .018) * radius);
        const offset = (y * image.info.width + x) * 4; return [...image.data.subarray(offset, offset + 4)];
      };
      const radius = await canvas.evaluate(el => el.clientWidth * parseFloat(getComputedStyle(el).getPropertyValue('--squish-radius-ratio')));
      for (const [u, v] of [[.3, .3], [.7, .3], [.3, .7], [.7, .7], [face.eyesLeft.u, face.eyesLeft.v]]) {
        const p = pixel(a, u!, v!, a.info.width * .4), q = pixel(b, u!, v!, radius);
        expect(q[3]).toBeGreaterThan(180);
        for (let c = 0; c < 3; c++) expect(Math.abs(p[c]! - q[c]!), `${material.id} channel ${c}`).toBeLessThan(18);
      }
      const eye = pixel(b, face.eyesLeft.u, face.eyesLeft.v, radius);
      expect((eye[0]! + eye[1]! + eye[2]!) / 3, `${material.id}: eye above pearl`).toBeLessThan(120);
      await page.locator('[data-action="home"]').click();
    }
  } finally { await context.close(); }
});
