import { expect, test, type Page } from '@playwright/test';

const enter = async (page: Page, stage: string): Promise<void> => {
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', stage);
};

const canvasCenter = async (page: Page): Promise<{ x: number; y: number; radius: number }> => {
  const rect = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!rect || rect.width < 100 || rect.height < 100) throw new Error('Real studio has no visible playfield');
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, radius: Math.min(rect.width, rect.height) * 0.34 };
};

const open = async (page: Page): Promise<void> => {
  await page.goto('/phaser-studio.html?lang=ru');
  await expect(page.locator('#app')).toHaveAttribute('data-phaser-studio-ready', 'true');
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  expect(await page.evaluate(() => window.__squishyRealStudio!.snapshot().canvasCount)).toBe(1);
  expect(await page.evaluate(() => window.__squishyRealStudio!.snapshot().webglReady)).toBe(true);
};

test('M4 real SandboxApp: Paint outside-in, pearls, Mix, Decor, material, actual V3 save and reload', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await enter(page, 'shape');
  await page.locator('[data-shape="heart"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-shape', 'heart');
  await page.locator('[data-action="shape-continue"]').click();
  await enter(page, 'paint');

  const paint = await canvasCenter(page);
  await page.mouse.move(paint.x - paint.radius * 1.3, paint.y);
  await page.mouse.down();
  await page.mouse.move(paint.x - paint.radius * 0.35, paint.y, { steps: 8 });
  await page.mouse.move(paint.x + paint.radius * 0.35, paint.y + paint.radius * 0.1, { steps: 10 });
  await page.mouse.up();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-paint-strokes', '1');
  await page.locator('[data-action="paint-continue"]').click();
  await enter(page, 'mixins');

  await page.locator('[data-mixin="pearls"]').click();
  const mixin = await canvasCenter(page);
  await page.mouse.click(mixin.x, mixin.y);
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-mixin-count', '1');
  await expect(page.locator('[data-sandbox-rigid-mixins]')).toBeVisible();
  await page.locator('[data-action="mixin-continue"]').click();
  await enter(page, 'mix');
  const mixing = await canvasCenter(page);
  await page.mouse.move(mixing.x, mixing.y);
  await page.mouse.down();
  for (let n = 0; n < 22; n += 1) {
    await page.mouse.move(mixing.x + (n % 2 === 0 ? 65 : -65), mixing.y, { steps: 3 });
  }
  await page.mouse.up();
  await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
  await page.locator('[data-action="mix-continue"]').click();
  await enter(page, 'decor');

  await page.locator('[data-decor-eyes="happy"]').click();
  await page.locator('[data-decor-mouth="smile"]').click();
  await page.locator('[data-decor-section="stickers"]').click();
  const decor = await canvasCenter(page);
  await page.mouse.click(decor.x, decor.y);
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-decor-sticker-count', '1');
  await page.locator('[data-decor-section="accessory"]').click();
  await page.locator('[data-decor-accessory="cat-ears"]').click();
  await expect(page.locator('[data-sandbox-accessory]')).toBeVisible();
  await page.locator('[data-action="decor-continue"]').click();
  await enter(page, 'finish');
  await page.locator('[data-material="holo"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-material', 'holo');
  await page.locator('[data-action="save"]').click();
  await enter(page, 'squeeze');
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-save-complete', 'true');

  const saved = await page.evaluate(() => window.__squishyRealStudio!.readSave());
  expect(saved.version).toBe(3);
  expect(saved.library).toHaveLength(1);
  expect(saved.library[0]!.shapeId).toBe('heart');
  expect(saved.library[0]!.materialId).toBe('holo');
  expect(saved.library[0]!.appearance.strokes).toHaveLength(1);
  expect(saved.library[0]!.appearance.mixins).toHaveLength(1);
  expect(saved.library[0]!.decor.stickers).toHaveLength(1);
  expect(saved.library[0]!.decor.accessory).toBe('cat-ears');
  expect(saved.library[0]!.decor.eyes).toBe('happy');
  await page.screenshot({ path: 'phaser-candidate-evidence/real-studio-saved-portrait.png', fullPage: true });
  await info.attach('real-studio-saved-portrait', { body: await page.screenshot(), contentType: 'image/png' });

  await page.reload();
  await expect(page.locator('#app')).toHaveAttribute('data-phaser-studio-ready', 'true');
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  await enter(page, 'home');
  expect((await page.evaluate(() => window.__squishyRealStudio!.readSave())).library[0]!.id).toBe(saved.library[0]!.id);
  await page.locator('[data-action="play-saved"]').click();
  await enter(page, 'squeeze');
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-shape', 'heart');
  await expect(page.locator('[data-sandbox-accessory]')).toBeVisible();
  await expect(page.locator('[data-sandbox-rigid-mixins]')).toBeVisible();
  expect(await page.evaluate(() => window.__squishyRealStudio!.snapshot().canvasCount)).toBe(1);
  await page.evaluate(() => window.__squishyRealStudio!.dispose());
  await expect(page.locator('[data-sandbox-canvas]')).not.toHaveAttribute('data-phaser-ready', 'true');
});

test('M4 real studio: activity blockers cancel gesture and Finish leaves canvas click-through', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 840 });
  await open(page);
  await page.locator('[data-action="shape-continue"]').click();
  await enter(page, 'paint');
  const center = await canvasCenter(page);
  await page.mouse.move(center.x, center.y);
  await page.mouse.down();
  await page.evaluate(() => window.__squishyRealStudio!.setBlocked(true));
  await page.mouse.move(center.x + 40, center.y, { steps: 4 });
  await page.mouse.up();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-paint-strokes', '1');
  await page.evaluate(() => window.__squishyRealStudio!.setBlocked(false));
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();
  const mixing = await canvasCenter(page);
  await page.mouse.move(mixing.x, mixing.y);
  await page.mouse.down();
  for (let n = 0; n < 22; n += 1) await page.mouse.move(mixing.x + (n % 2 === 0 ? 65 : -65), mixing.y, { steps: 3 });
  await page.mouse.up();
  await page.locator('[data-action="mix-continue"]').click();
  await page.locator('[data-action="decor-continue"]').click();
  await enter(page, 'finish');
  await expect(page.locator('[data-sandbox-canvas]')).toHaveCSS('pointer-events', 'none');
  await expect(page.locator('[data-action="save"]')).toBeEnabled();
  await page.evaluate(() => window.__squishyRealStudio!.dispose());
});
