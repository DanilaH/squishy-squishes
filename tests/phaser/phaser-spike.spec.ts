import { expect, test } from '@playwright/test';
import sharp from 'sharp';

type Snapshot = {
  renderer: string;
  canvasCount: number;
  drawCalls: number;
  compression: number;
  maxDisplacement: number;
  active: boolean;
  squeezes: number;
  disposed: boolean;
};

const snapshot = async (page: import('@playwright/test').Page): Promise<Snapshot | null> =>
  page.evaluate(() => (window as Window & {
    __phaserSquishSpike?: { snapshot(): Snapshot };
  }).__phaserSquishSpike?.snapshot() ?? null);

for (const viewport of [{ name: 'desktop', width: 1100, height: 760 }, { name: 'phone', width: 390, height: 844 }]) {
  test(`Phaser Extern draws one real squishy and takes gestures (${viewport.name})`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/phaser-spike.html');
    await expect.poll(async () => (await snapshot(page))?.drawCalls ?? 0).toBeGreaterThan(3);
    expect(errors).toEqual([]);
    const initial = await snapshot(page);
    expect(initial?.renderer).toBe('phaser-extern-webgl2');
    expect(initial?.canvasCount).toBe(1);
    const contexts = await page.locator('canvas').evaluateAll((nodes) => nodes.map((node) =>
      (node as HTMLCanvasElement).getContext('webgl2') instanceof WebGL2RenderingContext));
    expect(contexts).toEqual([true]);

    const middle = { x: viewport.width / 2, y: viewport.height / 2 };
    await page.mouse.move(middle.x, middle.y);
    await page.mouse.down();
    await page.mouse.move(middle.x + 65, middle.y + 35, { steps: 8 });
    await expect.poll(async () => (await snapshot(page))?.maxDisplacement ?? 0).toBeGreaterThan(0.015);
    expect((await snapshot(page))?.active).toBe(true);
    await page.mouse.up();
    await expect.poll(async () => (await snapshot(page))?.squeezes ?? 0).toBe(1);
    expect((await snapshot(page))?.active).toBe(false);
    expect(errors).toEqual([]);

    const image = await page.screenshot({ path: testInfo.outputPath(`phaser-${viewport.name}.png`) });
    const pixel = await sharp(image).extract({
      left: Math.floor(middle.x), top: Math.floor(middle.y), width: 1, height: 1,
    }).removeAlpha().raw().toBuffer();
    // A real rendered squishy must cover the midpoint, not just a blank Phaser canvas.
    expect((pixel[0] ?? 0) + (pixel[2] ?? 0)).toBeGreaterThan(180);
  });
}

test('Phaser scene tears down one GL canvas without keeping its own RAF', async ({ page }) => {
  await page.goto('/phaser-spike.html');
  await expect.poll(async () => (await snapshot(page))?.drawCalls ?? 0).toBeGreaterThan(2);
  await page.evaluate(() => (window as Window & {
    __phaserSquishSpike?: { destroy(): void };
  }).__phaserSquishSpike?.destroy());
  await expect.poll(async () => page.locator('canvas').count()).toBe(0);
});
