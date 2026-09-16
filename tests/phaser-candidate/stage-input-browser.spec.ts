import { expect, test, type Page } from '@playwright/test';
import sharp from 'sharp';

const open = async (page: Page): Promise<void> => {
  await page.goto('/phaser-stage-input.html');
  await expect(page.locator('[data-gesture-ready]')).toHaveAttribute('data-gesture-ready', 'ready');
  await expect.poll(() => page.evaluate(() => window.__squishyStageInput?.snapshot().canvasCount ?? 0)).toBe(1);
};

const capture = async (page: Page): Promise<Buffer> => {
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  const box = await page.locator('#gesture-stage canvas').boundingBox();
  if (!box) throw new Error('Missing stage input canvas');
  const frame = await page.screenshot();
  return sharp(frame).extract({ left: Math.round(box.x), top: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) }).png().toBuffer();
};

const changedPixels = async (a: Buffer, b: Buffer): Promise<number> => {
  const first = await sharp(a).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const second = await sharp(b).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  expect(first.info.width).toBe(second.info.width);
  expect(first.info.height).toBe(second.info.height);
  let changes = 0;
  for (let p = 0; p < first.data.length; p += 4) {
    if (Math.max(...[0, 1, 2].map((channel) => Math.abs(first.data[p + channel]! - second.data[p + channel]!))) > 30) changes++;
  }
  return changes;
};

test('M4: Phaser events author real Paint, Mix-in and Decor documents without counting squeezes', async ({ page }, info) => {
  await page.setViewportSize({ width: 900, height: 850 });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await open(page);
  const bounds = await page.locator('#gesture-stage canvas').boundingBox();
  if (!bounds) throw new Error('No WebGL canvas');
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const before = await capture(page);
  await page.locator('[data-gesture-stage="paint"]').click();
  await page.mouse.move(bounds.x + 20, centerY); // inside the canvas, outside the shape
  await page.mouse.down();
  expect((await page.evaluate(() => window.__squishyStageInput!.snapshot())).owner).not.toBeNull();
  await page.mouse.move(centerX + 45, centerY - 10, { steps: 24 });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => window.__squishyStageInput!.snapshot().paintStrokes)).toBe(1);
  const painted = await capture(page);
  expect(await changedPixels(before, painted), 'Actual WebGL appearance must reflect an authored stroke').toBeGreaterThan(80);
  await info.attach('phaser-stage-input-painted', { body: painted, contentType: 'image/png' });
  await page.locator('[data-gesture-stage="mixins"]').click();
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 72, centerY, { steps: 5 });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => window.__squishyStageInput!.snapshot().mixinCount)).toBeGreaterThan(1);
  await page.locator('[data-gesture-stickers]').click();
  await page.mouse.click(centerX, centerY);
  await expect.poll(() => page.evaluate(() => window.__squishyStageInput!.snapshot().stickerCount)).toBe(1);
  expect((await page.evaluate(() => window.__squishyStageInput!.snapshot())).squeezes).toBe(0);
  await page.evaluate(() => window.__squishyStageInput!.destroy());
  await expect(page.locator('[data-gesture-ready]')).toHaveAttribute('data-gesture-ready', 'destroyed');
  expect(await page.locator('#gesture-stage canvas').count()).toBe(0);
  expect(errors).toEqual([]);
});

test('M4: Mix shares one Phaser pointer with Squish; blockers/cancel and Finish prevent false squeezes', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 850 });
  await open(page);
  const bounds = await page.locator('#gesture-stage canvas').boundingBox();
  if (!bounds) throw new Error('No canvas');
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  await page.locator('[data-gesture-stage="squeeze"]').click();
  await page.mouse.move(bounds.x + 20, y);
  await page.mouse.down();
  expect((await page.evaluate(() => window.__squishyStageInput!.snapshot())).active).toBe(false);
  await page.mouse.up();
  await page.mouse.move(x, y);
  await page.mouse.down();
  await expect.poll(() => page.evaluate(() => window.__squishyStageInput!.snapshot().active)).toBe(true);
  await page.evaluate(() => window.__squishyStageInput!.blocked(true));
  await page.mouse.up();
  expect((await page.evaluate(() => window.__squishyStageInput!.snapshot())).squeezes).toBe(0);
  await page.evaluate(() => window.__squishyStageInput!.blocked(false));
  await page.locator('[data-gesture-stage="mix"]').click();
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 0; i < 30; i++) await page.mouse.move(x + (i % 2 === 0 ? 80 : 0), y, { steps: 2 });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => window.__squishyStageInput!.snapshot().mixProgress)).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__squishyStageInput!.snapshot().squeezes)).toBeGreaterThan(0);
  const earned = (await page.evaluate(() => window.__squishyStageInput!.snapshot())).squeezes;
  await page.locator('[data-gesture-stage="finish"]').click();
  expect(await page.locator('#gesture-stage canvas').evaluate((element) => (element as HTMLCanvasElement).style.pointerEvents)).toBe('none');
  await page.mouse.click(x, y);
  expect((await page.evaluate(() => window.__squishyStageInput!.snapshot())).squeezes).toBe(earned);
});
