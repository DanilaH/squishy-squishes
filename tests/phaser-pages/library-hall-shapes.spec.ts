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
    for (const shape of SHAPES) {
      const canvas = page.locator(`[data-library-thumbnail="shape-review-${material}-${shape}"]`);
      const output = await canvas.evaluate((node) => {
        const image = node as HTMLCanvasElement;
        const ctx = image.getContext('2d');
        if (!ctx) throw new Error('Missing thumbnail context');
        const center = ctx.getImageData(128, 128, 1, 1).data;
        const corner = ctx.getImageData(0, 0, 1, 1).data;
        return { png: image.toDataURL('image/png').split(',')[1], centerAlpha: center[3], cornerAlpha: corner[3] };
      });
      expect(output.centerAlpha, `blank ${material}/${shape}`).toBeGreaterThan(0);
      expect(output.cornerAlpha, `rectangle leaked for ${material}/${shape}`).toBe(0);
      if (!output.png) throw new Error(`Empty ${material}/${shape} thumbnail`);
      await writeFile(info.outputPath(`library-hall-shape-${material}-${shape}-256.png`), Buffer.from(output.png, 'base64'));
    }
    for (let pageNumber = 1; pageNumber <= 3; pageNumber += 1) {
      await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-hall-room', String(pageNumber));
      await page.screenshot({ path: info.outputPath(`library-hall-shapes-${material}-page-${pageNumber}.png`), animations: 'disabled' });
      if (pageNumber < 3) await page.locator('[data-library-hall-next]').click();
    }
    if (material === 'chrome') await page.setViewportSize({ width: 390, height: 844 });
  }
});
