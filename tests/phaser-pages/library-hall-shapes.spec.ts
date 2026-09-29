import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const SHAPES = ['soft-square', 'heart', 'mochi', 'peach', 'mushroom', 'paw'] as const;

// Visual review companion: capture all silhouettes with the SAME genuinely
// completed/saved appearance. The test does not generate fake art or bypass
// the real Studio save flow, and never changes the production SaveState codec.
test('chrome and holo volume follow all six saved shape boundaries', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/phaser/');
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  await page.locator('[data-action="shape-continue"]').click();
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();
  const surface = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!surface) throw new Error('No real maker surface');
  const x = surface.x + surface.width / 2;
  const y = surface.y + surface.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 0; i < 22; i += 1) await page.mouse.move(x + (i % 2 ? -65 : 65), y, { steps: 3 });
  await page.mouse.up();
  await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
  await page.locator('[data-action="mix-continue"]').click();
  await page.locator('[data-action="decor-continue"]').click();
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');

  for (const material of ['chrome', 'holo'] as const) {
    await page.evaluate(({ material, shapes }) => {
      const key = 'squishy.phaser-pages-preview.squishy.save.v3';
      const save = JSON.parse(localStorage.getItem(key) ?? 'null');
      if (!save || !save.library.length) throw new Error('Expected a real saved toy');
      const original = save.library[0];
      save.library = shapes.map((shapeId) => ({
        ...original, shapeId, materialId: material, id: `shape-review-${material}-${shapeId}`,
      }));
      localStorage.setItem(key, JSON.stringify(save));
    }, { material, shapes: SHAPES });
    await page.reload();
    await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '6');
    await expect(page.locator('[data-library-hall-stage]')).toBeVisible();
    // Hall thumbnails are eager again: audit all six native canvases directly.
    // Room navigation below remains presentation/paging coverage only.
    await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-hall-room', '1');

    for (const shape of SHAPES) {
      const canvas = page.locator(`[data-library-thumbnail="shape-review-${material}-${shape}"]`);
      const output = await canvas.evaluate((node) => {
        const image = node as HTMLCanvasElement;
        const ctx = image.getContext('2d');
        if (!ctx) throw new Error('Missing thumbnail context');
        const center = ctx.getImageData(image.width / 2, image.height / 2, 1, 1).data;
        const corner = ctx.getImageData(0, 0, 1, 1).data;
        return { width: image.width, height: image.height,
          png: image.toDataURL('image/png').split(',')[1], centerAlpha: center[3], cornerAlpha: corner[3] };
      });
      expect([output.width, output.height]).toEqual([512, 512]);
      expect(output.centerAlpha, `blank ${material}/${shape}`).toBeGreaterThan(0);
      expect(output.cornerAlpha, `rectangle leaked for ${material}/${shape}`).toBe(0);
      if (!output.png) throw new Error(`Empty ${material}/${shape} thumbnail`);
      await writeFile(info.outputPath(`library-hall-shape-${material}-${shape}-512.png`), Buffer.from(output.png, 'base64'));
    }
    for (let pageNumber = 1; pageNumber <= 3; pageNumber += 1) {
      await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-hall-room', String(pageNumber));
      await page.screenshot({ path: info.outputPath(`library-hall-shapes-${material}-page-${pageNumber}.png`), animations: 'disabled' });
      if (pageNumber < 3) await page.locator('[data-library-hall-next]').click();
    }
    if (material === 'chrome') await page.setViewportSize({ width: 390, height: 844 });
  }
});


test('owner regression: painted Holo Paw keeps front art registered with pearls and bunny ears', async ({ page }, info) => {
  test.setTimeout(95_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.goto('/phaser/');
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  await page.locator('button[data-shape="paw"]').click();
  await page.locator('[data-action="shape-continue"]').click();

  // Author real paint on the same concave silhouette that exposed the visual
  // registration bug; do not synthesize V3 appearance bytes for this fixture.
  const paint = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!paint) throw new Error('No Paw paint surface');
  for (const [colorIndex, x, y] of [[1, .30, .54], [2, .50, .50], [3, .70, .56]] as const) {
    await page.locator('[data-paint-color]').nth(colorIndex).click();
    await page.mouse.move(paint.x + paint.width * (x - .06), paint.y + paint.height * y);
    await page.mouse.down();
    await page.mouse.move(paint.x + paint.width * (x + .06), paint.y + paint.height * (y + .02), { steps: 8 });
    await page.mouse.up();
  }
  await page.locator('[data-action="paint-continue"]').click();

  await page.locator('[data-mixin="pearls"]').click();
  const mixin = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!mixin) throw new Error('No Paw mix-in surface');
  await page.mouse.move(mixin.x + mixin.width * .30, mixin.y + mixin.height * .45);
  await page.mouse.down();
  await page.mouse.move(mixin.x + mixin.width * .70, mixin.y + mixin.height * .58, { steps: 8 });
  await page.mouse.up();
  await page.locator('[data-action="mixin-continue"]').click();

  const mix = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!mix) throw new Error('No Paw mix surface');
  const cx = mix.x + mix.width / 2;
  const cy = mix.y + mix.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 0; i < 22; i += 1) await page.mouse.move(cx + (i % 2 ? -70 : 70), cy, { steps: 3 });
  await page.mouse.up();
  await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
  await page.locator('[data-action="mix-continue"]').click();

  await page.locator('[data-decor-eyes="dot"]').click();
  await page.locator('[data-decor-mouth="smile"]').click();
  await page.locator('[data-decor-section="stickers"]').click();
  const decor = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!decor) throw new Error('No Paw decor surface');
  await page.locator('[data-sandbox-canvas]').click({ position: { x: decor.width * .31, y: decor.height * .56 } });
  await page.locator('[data-decor-section="accessory"]').click();
  await page.locator('[data-decor-accessory="bunny-ears"]').click();
  await page.locator('[data-action="decor-continue"]').click();
  await page.locator('button[data-material="holo"]').click();
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');

  await page.locator('[data-action="home"]').click();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '1');
  const thumbnail = page.locator('[data-library-thumbnail]').first();
  await expect(thumbnail).toHaveAttribute('data-library-renderer', 'volume-mesh');
  await expect(thumbnail).toHaveAttribute('data-library-projection', 'front');
  await expect(thumbnail).toHaveAttribute('data-library-material-profile', 'holo');

  const capture = await thumbnail.evaluate((node) => {
    const canvas = node as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Missing Holo Paw thumbnail context');
    const center = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data;
    const corner = ctx.getImageData(0, 0, 1, 1).data;
    return {
      png: canvas.toDataURL('image/png').split(',')[1],
      centerAlpha: center[3],
      cornerAlpha: corner[3],
    };
  });
  expect(capture.centerAlpha).toBeGreaterThan(0);
  expect(capture.cornerAlpha).toBe(0);
  if (!capture.png) throw new Error('Empty Holo Paw owner-regression capture');
  await writeFile(info.outputPath('library-hall-owner-holo-paw-512.png'), Buffer.from(capture.png, 'base64'));
  await page.screenshot({ path: info.outputPath('library-hall-owner-holo-paw-room-390.png'), animations: 'disabled' });
  expect(errors).toEqual([]);
});
