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

const ensureNonblank = async (png: Buffer, name: string): Promise<void> => {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const corner = 4 * (10 * info.width + 10);
  const center = 4 * (210 * info.width + 210);
  const contrast = Math.max(...[0, 1, 2].map((ch) => Math.abs(data[corner + ch]! - data[center + ch]!)));
  expect(contrast, `${name} must contain an actually rendered squishy, not just a cleared canvas`).toBeGreaterThan(40);
};

test('M3 parity: both real WebGL renderers receive identical data and render visually comparable frames', async ({ page }, info) => {
  await page.setViewportSize({ width: 950, height: 620 });
  await page.goto('/phaser-parity.html');
  await expect(page.locator('[data-parity]')).toHaveAttribute('data-parity', 'ready');
  await expect(page.locator('#parity-old')).toBeVisible();
  await expect(page.locator('#parity-new canvas')).toBeVisible();
  expect(await page.locator('canvas').count()).toBe(2);
  const oldBox = await page.locator('#parity-old').boundingBox();
  const newBox = await page.locator('#parity-new canvas').boundingBox();
  if (!oldBox || !newBox) throw new Error('Missing matching renderer viewports');
  expect(oldBox.width).toBe(420);
  expect(newBox.width).toBe(420);
  expect(oldBox.height).toBe(420);
  expect(newBox.height).toBe(420);
  let baseOld: Buffer | null = null;
  let baseNew: Buffer | null = null;

  for (const kind of ['base', 'paint', 'decor', 'foam', 'pearl', 'holo', 'heart'] as const satisfies readonly Fixture[]) {
    await page.evaluate((name) => window.__squishyParity!.fixture(name), kind);
    await expect(page.locator('[data-parity]')).toHaveAttribute('data-parity-fixture', kind);
    await settle(page);
    // Capture ONE browser-composited frame: simultaneous element screenshots
    // previously returned identically cleared WebGL buffers (false zero error).
    const frame = await page.screenshot(kind === 'decor' || kind === 'heart'
      ? { path: `phaser-candidate-evidence/parity-${kind}.png` }
      : {});
    const crop = (box: NonNullable<typeof oldBox>): Promise<Buffer> => sharp(frame).extract({
      left: Math.round(box.x), top: Math.round(box.y), width: 420, height: 420,
    }).png().toBuffer();
    const [oldShot, newShot] = await Promise.all([crop(oldBox), crop(newBox)]);
    await ensureNonblank(oldShot, `${kind} original WebGL`);
    await ensureNonblank(newShot, `${kind} Phaser Extern`);
    if (kind === 'base') {
      baseOld = oldShot;
      baseNew = newShot;
    } else if (kind === 'paint' || kind === 'decor' || kind === 'heart') {
      if (!baseOld || !baseNew) throw new Error('Base comparison frame is missing');
      expect((await measure(baseOld, oldShot)).meanRgbError, `${kind}: original renderer must change`).toBeGreaterThan(0.2);
      expect((await measure(baseNew, newShot)).meanRgbError, `${kind}: Phaser renderer must change`).toBeGreaterThan(0.2);
    }
    const result = await measure(oldShot, newShot);
    console.log(`WebGL renderer parity ${kind}: mean RGB error=${result.meanRgbError.toFixed(3)}, large-pixel fraction=${result.largePixelFraction.toFixed(4)}`);
    expect(result.meanRgbError, `${kind}: wrong shape, UV, material or vertical orientation`).toBeLessThan(18);
    expect(result.largePixelFraction, `${kind}: large incorrect area`).toBeLessThan(0.16);
    if (kind === 'decor' || kind === 'heart') {
      await info.attach(`original-webgl-${kind}`, { body: oldShot, contentType: 'image/png' });
      await info.attach(`phaser-extern-${kind}`, { body: newShot, contentType: 'image/png' });
    }
  }
  await page.evaluate(() => window.__squishyParity!.destroy());
  await expect(page.locator('[data-parity]')).toHaveAttribute('data-parity', 'destroyed');
  expect(await page.locator('#parity-new canvas').count()).toBe(0);
});
