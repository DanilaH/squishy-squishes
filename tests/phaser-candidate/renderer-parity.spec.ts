import { expect, test, type Page } from '@playwright/test';
import sharp from 'sharp';

type Fixture = 'base' | 'paint' | 'decor' | 'foam' | 'pearl' | 'holo' | 'heart';

const settle = async (page: Page): Promise<void> => {
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
};

const measure = async (first: Buffer, second: Buffer): Promise<{ meanRgbError: number; largePixelFraction: number }> => {
  const [a, b] = await Promise.all([
    sharp(first).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(second).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);
  expect({ width: a.info.width, height: a.info.height, channels: a.info.channels }).toEqual({
    width: b.info.width, height: b.info.height, channels: b.info.channels,
  });
  let sum = 0;
  let large = 0;
  const pixels = a.info.width * a.info.height;
  for (let p = 0; p < pixels; p += 1) {
    const offset = p * 4;
    const red = Math.abs(a.data[offset]! - b.data[offset]!);
    const green = Math.abs(a.data[offset + 1]! - b.data[offset + 1]!);
    const blue = Math.abs(a.data[offset + 2]! - b.data[offset + 2]!);
    sum += red + green + blue;
    if (Math.max(red, green, blue) > 40) large += 1;
  }
  return { meanRgbError: sum / (pixels * 3), largePixelFraction: large / pixels };
};

test('M3 parity: both real WebGL renderers receive identical data and render visually comparable frames', async ({ page }, info) => {
  await page.setViewportSize({ width: 950, height: 620 });
  await page.goto('/phaser-parity.html');
  await expect(page.locator('[data-parity]')).toHaveAttribute('data-parity', 'ready');
  await expect(page.locator('#parity-old')).toBeVisible();
  await expect(page.locator('#parity-new canvas')).toBeVisible();
  expect(await page.locator('canvas').count()).toBe(2);
  const oldAttributes = await page.locator('#parity-old').evaluate((node) => (node as HTMLCanvasElement).getContext('webgl2')?.getContextAttributes()?.alpha);
  const newAttributes = await page.locator('#parity-new canvas').evaluate((node) => (node as HTMLCanvasElement).getContext('webgl2')?.getContextAttributes()?.alpha);
  expect(oldAttributes).toBe(true);
  expect(newAttributes).toBe(true);

  for (const kind of ['base', 'paint', 'decor', 'foam', 'pearl', 'holo', 'heart'] as const satisfies readonly Fixture[]) {
    await page.evaluate((name) => window.__squishyParity!.fixture(name), kind);
    await expect(page.locator('[data-parity]')).toHaveAttribute('data-parity-fixture', kind);
    await settle(page);
    const [oldShot, newShot] = await Promise.all([
      page.locator('#parity-old').screenshot(),
      page.locator('#parity-new canvas').screenshot(),
    ]);
    const result = await measure(oldShot, newShot);
    console.log(`WebGL renderer parity ${kind}: mean RGB error=${result.meanRgbError.toFixed(3)}, large-pixel fraction=${result.largePixelFraction.toFixed(4)}`);
    // Broad *regression* budget; review the actual reported metrics and screenshots
    // before claiming pixel-exact parity or setting a production-level tolerance.
    expect(result.meanRgbError, `${kind}: wrong shape, UV, material or vertical orientation`).toBeLessThan(18);
    expect(result.largePixelFraction, `${kind}: large incorrect area`).toBeLessThan(0.16);
    if (kind === 'decor') {
      await info.attach('original-webgl-decor', { body: oldShot, contentType: 'image/png' });
      await info.attach('phaser-extern-decor', { body: newShot, contentType: 'image/png' });
    }
  }
  await page.evaluate(() => window.__squishyParity!.destroy());
  await expect(page.locator('[data-parity]')).toHaveAttribute('data-parity', 'destroyed');
  expect(await page.locator('#parity-new canvas').count()).toBe(0);
});
