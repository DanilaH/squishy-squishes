import { expect, test } from '@playwright/test';

const SHAPES = ['soft-square', 'heart', 'mochi', 'peach', 'mushroom', 'paw', 'dumpling', 'strawberry'] as const;

test('M4: studio input and renderer share canonical shape UV for all eight shapes', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 850 });
  await page.goto('/phaser-stage-input.html');
  await expect(page.locator('[data-gesture-ready]')).toHaveAttribute('data-gesture-ready', 'ready');
  for (const shapeId of SHAPES) {
    const result = await page.evaluate((id) => {
      const fixture = window.__squishyStageInput!;
      fixture.shape(id);
      const projected = fixture.projectUvToCanvas(0.5, 0.5);
      const middle = fixture.pointToUv(projected.x, projected.y);
      const upperLeft = fixture.pointToUv(10, 10);
      return { middle, upperLeft, projected, canvasCount: fixture.snapshot().canvasCount };
    }, shapeId);
    expect(result.canvasCount, `${shapeId}: one Phaser renderer`).toBe(1);
    expect(result.middle, `${shapeId}: center must be in silhouette`).not.toBeNull();
    expect(result.middle?.u, `${shapeId}: centered U`).toBeCloseTo(0.5, 4);
    expect(result.middle?.v, `${shapeId}: centered V`).toBeCloseTo(0.5, 4);
    expect(result.upperLeft, `${shapeId}: avoid painting outside the canonical boundary`).toBeNull();
    expect(result.projected.x, `${shapeId}: mesh center X`).toBeCloseTo(210, 2);
    expect(result.projected.y, `${shapeId}: molded mesh center Y`).toBeCloseTo(210 + 420 * .34 * .018, 2);
  }
});

test('M4: UV projection follows the same animated spring mesh, not a static overlay', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 850 });
  await page.goto('/phaser-stage-input.html');
  await expect(page.locator('[data-gesture-ready]')).toHaveAttribute('data-gesture-ready', 'ready');
  const canvas = page.locator('#gesture-stage canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Phaser studio canvas not found');
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const anchor = await page.evaluate(() => window.__squishyStageInput!.projectUvToCanvas(0.65, 0.5));
  await page.locator('[data-gesture-stage="squeeze"]').click();
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 90, centerY - 35, { steps: 20 });
  await expect.poll(async () => {
    const projected = await page.evaluate(() => window.__squishyStageInput!.projectUvToCanvas(0.65, 0.5));
    return Math.hypot(projected.x - anchor.x, projected.y - anchor.y);
  }, { timeout: 4_000 }).toBeGreaterThan(2);
  const uv = await page.evaluate(() => window.__squishyStageInput!.pointToUv(210, 210));
  // Input inverts the shader's mold, while attachment projection follows deformation.
  expect(uv?.u).toBeCloseTo(.5, 4);
  expect(uv?.v).toBeCloseTo(.5 + .018 / .905 / 2, 4);
  await page.mouse.up();
  await page.evaluate(() => window.__squishyStageInput!.destroy());
  expect(await canvas.count()).toBe(0);
});
