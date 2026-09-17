import { expect, test } from '@playwright/test';

test('studio back navigation retains creative work and completed Mix, then resets for a new toy', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/phaser/');
  await page.evaluate(() => localStorage.setItem('squishy.save.v3', 'original-save-untouched'));
  await page.locator('[data-library-new]').first().click();
  const shell = page.locator('[data-sandbox-app]');
  const canvas = page.locator('[data-sandbox-canvas]');
  const back = page.locator('[data-action="stage-back"]');
  await expect(canvas).toHaveAttribute('data-phaser-ready', 'true');
  await expect(back).toBeHidden();
  await page.locator('button[data-shape="heart"]').click();
  await page.locator('[data-action="shape-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'paint');
  await expect(back).toBeVisible();
  await expect(page.locator('[data-action="paint-undo"]')).toBeDisabled();
  await expect(page.locator('[data-action="paint-clear"]')).toBeDisabled();

  const center = async (): Promise<{ x: number; y: number }> => {
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Missing Phaser canvas');
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };
  const paint = await center();
  await page.mouse.move(paint.x, paint.y);
  await page.mouse.down();
  await page.mouse.move(paint.x + 28, paint.y + 12, { steps: 8 });
  await page.mouse.up();
  await expect(shell).toHaveAttribute('data-paint-strokes', '1');
  await expect(page.locator('[data-action="paint-undo"]')).toBeEnabled();
  await page.locator('[data-action="paint-continue"]').click();
  await expect(page.locator('[data-action="mixin-undo"]')).toBeDisabled();
  await page.locator('[data-mixin="pearls"]').click();
  const mixin = await center();
  await page.mouse.click(mixin.x, mixin.y);
  await expect(shell).toHaveAttribute('data-mixin-count', '1');
  await expect(page.locator('[data-action="mixin-clear"]')).toBeEnabled();

  await back.click();
  await expect(shell).toHaveAttribute('data-stage', 'paint');
  await expect(shell).toHaveAttribute('data-paint-strokes', '1');
  await expect(shell).toHaveAttribute('data-mixin-count', '1');
  await back.click();
  await expect(shell).toHaveAttribute('data-stage', 'shape');
  await expect(back).toBeHidden();
  await expect(page.locator('button[data-shape="heart"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-action="shape-continue"]').click();
  await page.locator('[data-action="paint-continue"]').click();
  await expect(shell).toHaveAttribute('data-mixin-count', '1');
  await page.locator('[data-action="mixin-continue"]').click();

  const mix = await center();
  await page.mouse.move(mix.x, mix.y);
  await page.mouse.down();
  for (let n = 0; n < 34; n += 1) {
    await page.mouse.move(mix.x + (n % 2 ? -55 : 55), mix.y, { steps: 2 });
  }
  await page.mouse.up();
  await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
  await expect(shell).toHaveAttribute('data-mix-progress', '1.000');
  await back.click();
  await expect(shell).toHaveAttribute('data-stage', 'mixins');
  await page.locator('[data-action="mixin-continue"]').click();
  await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
  await expect(shell).toHaveAttribute('data-mix-progress', '1.000');
  await page.locator('[data-action="mix-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'decor');
  await page.locator('[data-decor-section="stickers"]').click();
  await expect(page.locator('[data-action="decor-undo"]')).toBeDisabled();
  const decor = await center();
  await page.mouse.click(decor.x, decor.y);
  await expect(shell).toHaveAttribute('data-decor-sticker-count', '1');
  await expect(page.locator('[data-action="decor-undo"]')).toBeEnabled();
  await back.click();
  await expect(shell).toHaveAttribute('data-stage', 'mix');
  await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
  await page.locator('[data-action="mix-continue"]').click();
  await expect(shell).toHaveAttribute('data-decor-sticker-count', '1');
  await page.locator('[data-action="decor-continue"]').click();
  await page.locator('[data-material="holo"]').click();
  await page.locator('[data-action="save"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'squeeze');

  const saved = await page.evaluate(() => ({
    original: localStorage.getItem('squishy.save.v3'),
    preview: localStorage.getItem('squishy.phaser-pages-preview.squishy.save.v3'),
  }));
  expect(saved.original).toBe('original-save-untouched');
  const parsed = JSON.parse(saved.preview ?? 'null');
  expect(parsed.library[0]).toMatchObject({ shapeId: 'heart', materialId: 'holo' });
  expect(parsed.library[0].appearance.strokes).toHaveLength(1);
  expect(parsed.library[0].appearance.mixins).toHaveLength(1);
  expect(parsed.library[0].decor.s).toHaveLength(1);

  await page.locator('[data-panel="squeeze"] [data-action="new"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'shape');
  await page.locator('[data-action="shape-continue"]').click();
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();
  await expect(shell).toHaveAttribute('data-mix-progress', '0.000');
  await expect(page.locator('[data-action="mix-continue"]')).toBeDisabled();
  expect(errors).toEqual([]);
});
