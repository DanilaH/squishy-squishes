import { expect, test, type Page } from '@playwright/test';
import sharp from 'sharp';

const settle = async (page: Page): Promise<void> => {
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
};

const captureCanvas = async (page: Page): Promise<Buffer> => {
  await settle(page);
  // A single browser-composited screenshot is essential: element screenshots
  // of WebGL can silently capture a cleared drawing buffer and falsely pass.
  const box = await page.locator('#compositing-stage canvas').boundingBox();
  if (!box) throw new Error('Compositing canvas not visible');
  const frame = await page.screenshot();
  return sharp(frame).extract({
    left: Math.round(box.x), top: Math.round(box.y), width: 420, height: 420,
  }).png().toBuffer();
};

const pixel = async (png: Buffer, x: number, y: number): Promise<readonly number[]> => {
  const { data } = await sharp(png).extract({ left: x, top: y, width: 1, height: 1 })
    .removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return [data[0]!, data[1]!, data[2]!];
};

test('M3: Phaser sprites and text survive raw Squish Extern rendering on the same WebGL2 canvas', async ({ page }, info) => {
  await page.setViewportSize({ width: 900, height: 660 });
  await page.goto('/phaser-compositing.html');
  await expect(page.locator('[data-compositing]')).toHaveAttribute('data-compositing', 'ready');
  await expect.poll(() => page.evaluate(() => window.__squishyCompositing?.snapshot().draws ?? 0)).toBeGreaterThan(2);
  const state = await page.evaluate(() => window.__squishyCompositing!.snapshot());
  expect(state.canvasCount).toBe(1);
  expect(state.renderer).toBe('phaser-extern-shared-simulation-webgl2');
  expect(state.glError).toBe(0);

  const visible = await captureCanvas(page);
  const before = await pixel(visible, 38, 38);
  const after = await pixel(visible, 382, 38);
  const overlaidCenter = await pixel(visible, 210, 210);
  // Real Phaser objects before AND after Extern; a cleared buffer cannot pass.
  expect(before[0], `Before Extern sprite: ${before}`).toBeGreaterThan(175);
  expect(before[2], `Before Extern sprite: ${before}`).toBeGreaterThan(175);
  expect(before[1], `Before Extern sprite: ${before}`).toBeLessThan(90);
  expect(after[1], `After Extern sprite: ${after}`).toBeGreaterThan(150);
  expect(after[0], `After Extern sprite: ${after}`).toBeLessThan(90);
  expect(after[2], `After Extern sprite: ${after}`).toBeLessThan(90);
  await expect(page.getByText('BEFORE', { exact: true })).toHaveCount(0); // Phaser canvas text, not DOM text.
  await info.attach('phaser-compositing-overlay-visible', { body: visible, contentType: 'image/png' });

  await page.evaluate(() => window.__squishyCompositing!.setOverlayVisible(false));
  const noOverlay = await captureCanvas(page);
  const bareCenter = await pixel(noOverlay, 210, 210);
  expect(Math.abs(overlaidCenter[0]! - bareCenter[0]!) +
    Math.abs(overlaidCenter[1]! - bareCenter[1]!) +
    Math.abs(overlaidCenter[2]! - bareCenter[2]!),
  `Post-Extern transparent overlay must alter squishy pixels: ${overlaidCenter} vs ${bareCenter}`).toBeGreaterThan(45);
  const corner = await pixel(noOverlay, 5, 5);
  expect(Math.max(...bareCenter) - Math.min(...corner), 'Squishy must really render below Phaser overlay').toBeGreaterThan(35);
  expect((await page.evaluate(() => window.__squishyCompositing!.snapshot())).glError).toBe(0);
  await info.attach('phaser-compositing-overlay-hidden', { body: noOverlay, contentType: 'image/png' });

  await page.evaluate(() => window.__squishyCompositing!.setShape('paw'));
  const paw = await captureCanvas(page);
  await page.evaluate(() => window.__squishyCompositing!.setShape('heart'));
  const heart = await captureCanvas(page);
  const { data: a } = await sharp(paw).extract({ left: 100, top: 100, width: 220, height: 220 }).raw().toBuffer({ resolveWithObject: true });
  const { data: b } = await sharp(heart).extract({ left: 100, top: 100, width: 220, height: 220 }).raw().toBuffer({ resolveWithObject: true });
  let changes = 0;
  for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i]! - b[i]!) > 40) changes++;
  expect(changes, 'Distinct canonical shapes must change actual visible WebGL pixels').toBeGreaterThan(600);
  await page.evaluate(() => window.__squishyCompositing!.destroy());
  await expect(page.locator('[data-compositing]')).toHaveAttribute('data-compositing', 'destroyed');
  expect(await page.locator('#compositing-stage canvas').count()).toBe(0);
});
