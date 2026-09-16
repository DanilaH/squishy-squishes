import { expect, test } from '@playwright/test';

const openCandidate = async (page: import('@playwright/test').Page): Promise<void> => {
  await page.goto('/phaser-candidate.html');
  await expect(page.locator('[data-candidate-stage]')).toHaveAttribute('data-candidate-stage', 'ready');
  await expect.poll(async () => page.evaluate(() => window.__squishyPhaserCandidate?.snapshot().drawCalls ?? 0)).toBeGreaterThan(2);
};

test('M2: Phaser owns one transparent WebGL2 canvas and actually draws the original shader', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1100, height: 760 });
  await openCandidate(page);
  const state = await page.evaluate(() => window.__squishyPhaserCandidate!.snapshot());
  expect(state.renderer).toBe('phaser-extern-shared-simulation-webgl2');
  expect(state.canvasCount).toBe(1);
  expect(state.active).toBe(false);
  const pixels = await page.locator('#phaser-candidate-stage canvas').evaluate((node) => {
    const canvas = node as HTMLCanvasElement;
    const context = canvas.getContext('webgl2');
    if (!context) throw new Error('Candidate is not WebGL2');
    const scratch = document.createElement('canvas');
    scratch.width = canvas.width;
    scratch.height = canvas.height;
    const ctx = scratch.getContext('2d');
    if (!ctx) throw new Error('Cannot sample candidate image');
    ctx.drawImage(canvas, 0, 0);
    const center = ctx.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data;
    const corner = ctx.getImageData(2, 2, 1, 1).data;
    return { alpha: context.getContextAttributes()?.alpha, center: [...center], corner: [...corner] };
  });
  expect(pixels.alpha).toBe(true);
  expect(pixels.center[3]).toBeGreaterThan(40);
  expect(pixels.corner[3]).toBeLessThan(20);
  const shot = await page.screenshot({ path: 'phaser-candidate-evidence/desktop.png' });
  await testInfo.attach('phaser-candidate-desktop', { body: shot, contentType: 'image/png' });
});

test('M2: all six canonical shapes/materials and a real drag/release work with shared physics', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 760 });
  await openCandidate(page);
  for (const shape of ['heart', 'mochi', 'peach', 'mushroom', 'paw', 'soft-square']) {
    await page.locator(`[data-candidate-shape="${shape}"]`).click();
    await expect(page.locator('[data-candidate-stage]')).toHaveAttribute('data-shape', shape);
  }
  for (const material of ['jelly', 'holo', 'marshmallow', 'pearl', 'chrome', 'soft']) {
    await page.locator(`[data-candidate-material="${material}"]`).click();
    await expect(page.locator('[data-candidate-stage]')).toHaveAttribute('data-material', material);
  }
  const bounds = await page.locator('#phaser-candidate-stage canvas').boundingBox();
  if (!bounds) throw new Error('Candidate canvas missing');
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await expect.poll(() => page.evaluate(() => window.__squishyPhaserCandidate!.snapshot().active)).toBe(true);
  await page.mouse.move(x + 72, y + 32, { steps: 14 });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => window.__squishyPhaserCandidate!.snapshot().squeezes)).toBe(1);
  expect(await page.evaluate(() => window.__squishyPhaserCandidate!.snapshot().active)).toBe(false);
  expect(await page.evaluate(() => window.__squishyPhaserCandidate!.snapshot().releaseEnergy)).toBeGreaterThan(0.08);
  await page.evaluate(() => window.__squishyPhaserCandidate!.destroy());
  await expect(page.locator('[data-candidate-stage]')).toHaveAttribute('data-candidate-stage', 'destroyed');
  expect(await page.locator('#phaser-candidate-stage canvas').count()).toBe(0);
  expect(await page.evaluate(() => window.__squishyPhaserCandidate === undefined)).toBe(true);
});

for (const viewport of [
  { label: 'portrait-phone', width: 390, height: 844 },
  { label: 'existing-landscape', width: 844, height: 390 },
]) {
  test(`M2: original responsive composition has no rotation gate at ${viewport.label}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await openCandidate(page);
    await expect(page.locator('#phaser-candidate-stage canvas')).toBeVisible();
    const layout = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('#phaser-candidate-stage canvas');
      if (!canvas) throw new Error('No canvas');
      const box = canvas.getBoundingClientRect();
      return {
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
        canvasWidth: box.width,
        canvasHeight: box.height,
        visible: box.left >= 0 && box.top >= 0 && box.right <= innerWidth && box.bottom <= innerHeight,
        rotateGate: document.querySelector('#rotate-gate') !== null,
      };
    });
    expect(layout.horizontalOverflow).toBe(false);
    expect(layout.canvasWidth).toBeGreaterThan(200);
    expect(layout.canvasHeight).toBeGreaterThan(200);
    expect(layout.visible).toBe(true);
    expect(layout.rotateGate).toBe(false);
    const shot = await page.screenshot({ path: `phaser-candidate-evidence/${viewport.label}.png` });
    await testInfo.attach(`phaser-candidate-${viewport.label}`, { body: shot, contentType: 'image/png' });
  });
}
