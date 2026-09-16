import { expect, test } from '@playwright/test';

/** Desktop Firefox may not expose TouchEvent at all. Exercise the published Pages bundle. */
test('Phaser Pages gestures work when TouchEvent is absent', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'TouchEvent', { configurable: true, value: undefined });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/phaser/');
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
  await page.locator('[data-library-new]').first().click();
  const canvas = page.locator('[data-sandbox-canvas]');
  await expect(canvas).toHaveAttribute('data-phaser-ready', 'true');
  await page.locator('[data-action="shape-continue"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'paint');
  let box = await canvas.boundingBox();
  if (!box) throw new Error('Paint canvas missing');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-paint-strokes', '1');
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-mixin="pearls"]').click();
  box = await canvas.boundingBox();
  if (!box) throw new Error('Mix-in canvas missing');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-mixin-count', '1');
  await page.locator('[data-action="mixin-continue"]').click();
  box = await canvas.boundingBox();
  if (!box) throw new Error('Mix canvas missing');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 0; i < 22; i += 1) {
    await page.mouse.move(x + (i % 2 ? -65 : 65), y, { steps: 3 });
  }
  await page.mouse.up();
  await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
  expect(errors).toEqual([]);
});
