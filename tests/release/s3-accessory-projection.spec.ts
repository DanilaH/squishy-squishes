import { expect, test } from '@playwright/test';

const PAGES_URL = '/squishy-squishes/';

test('S3 head accessory follows real mesh deformation without intercepting squeeze input', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('squishy.save.v3', JSON.stringify({
      version: 3,
      library: [{
        id: 'projection-toy',
        createdAt: 1,
        shapeId: 'soft-square',
        materialId: 'soft',
        appearance: { v: 1, strokes: [], mixins: [] },
        decor: { v: 1, eyes: 'dot', mouth: 'smile', blush: true, stickers: [], accessory: 'crown' },
      }],
      libraryCapacity: 8,
      completedRecipeIds: [],
      unlockedRewardIds: [],
      totalCrafts: 1,
      updatedAt: 1,
    }));
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(PAGES_URL);

  await page.locator('[data-library-play-id="projection-toy"]').click();
  const shell = page.locator('[data-sandbox-app]');
  await expect(shell).toHaveAttribute('data-stage', 'squeeze');
  const accessory = page.locator('[data-sandbox-accessory]');
  await expect(accessory).toBeVisible();
  await expect(accessory).toHaveAttribute('data-accessory-id', 'crown');
  expect(await accessory.evaluate((node) => getComputedStyle(node).pointerEvents)).toBe('none');
  await expect.poll(async () => accessory.getAttribute('data-accessory-matrix')).not.toBeNull();

  const before = await accessory.evaluate((node) => ({
    x: Number((node as HTMLElement).dataset.accessoryAnchorX),
    y: Number((node as HTMLElement).dataset.accessoryAnchorY),
    matrix: (node as HTMLElement).dataset.accessoryMatrix ?? '',
  }));

  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('Missing squishy canvas');
  const startX = box.x + box.width * 0.50;
  const startY = box.y + box.height * 0.34;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + Math.min(82, box.width * 0.22), startY + 18, { steps: 12 });

  await expect.poll(async () => accessory.evaluate((node) => {
    const element = node as HTMLElement;
    const x = Number(element.dataset.accessoryAnchorX);
    const y = Number(element.dataset.accessoryAnchorY);
    const matrix = element.dataset.accessoryMatrix ?? '';
    return Math.hypot(x - before.x, y - before.y) > 1.5 || matrix !== before.matrix;
  })).toBe(true);

  await page.mouse.up();
  await expect.poll(async () => Number(await shell.getAttribute('data-sandbox-squeezes'))).toBeGreaterThan(0);
  await expect(accessory).toBeVisible();
});
