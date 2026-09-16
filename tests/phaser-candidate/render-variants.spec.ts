import { expect, test } from '@playwright/test';

// Read the rendered canvas, not only the DOM selection state. Candidate WebGL2
// deliberately enables preserveDrawingBuffer until pixel-parity QA is complete.
const renderedImage = async (page: import('@playwright/test').Page): Promise<string> => page.locator('#phaser-candidate-stage canvas').evaluate(
  (node) => (node as HTMLCanvasElement).toDataURL('image/png'),
);

test('M2: all six shapes and six material presets change actual WebGL pixels', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 760 });
  await page.goto('/phaser-candidate.html');
  await expect(page.locator('[data-candidate-stage]')).toHaveAttribute('data-candidate-stage', 'ready');
  await expect.poll(() => page.evaluate(() => window.__squishyPhaserCandidate?.snapshot().drawCalls ?? 0)).toBeGreaterThan(2);

  const shapeImages = new Set<string>();
  for (const shape of ['soft-square', 'heart', 'mochi', 'peach', 'mushroom', 'paw']) {
    await page.locator(`[data-candidate-shape="${shape}"]`).click();
    await expect(page.locator('[data-candidate-stage]')).toHaveAttribute('data-shape', shape);
    await page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
    shapeImages.add(await renderedImage(page));
  }
  expect(shapeImages.size, 'Each canonical shape must have distinct rendered silhouette').toBe(6);

  await page.locator('[data-candidate-shape="soft-square"]').click();
  const materialImages = new Set<string>();
  for (const material of ['soft', 'jelly', 'holo', 'marshmallow', 'pearl', 'chrome']) {
    await page.locator(`[data-candidate-material="${material}"]`).click();
    await expect(page.locator('[data-candidate-stage]')).toHaveAttribute('data-material', material);
    await page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
    materialImages.add(await renderedImage(page));
  }
  expect(materialImages.size, 'Each material must have distinct rendered pixels').toBe(6);
});
