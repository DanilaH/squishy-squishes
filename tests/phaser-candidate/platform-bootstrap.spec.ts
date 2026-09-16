import { expect, test, type Page } from '@playwright/test';

const PREFIX = 'squishy.phaser-platform-preview.';
const open = async (page: Page): Promise<void> => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/phaser-platform.html');
  await expect(page.locator('#app')).toHaveAttribute('data-phaser-platform-ready', 'true');
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-release-platform', 'mock');
};

const makeToy = async (page: Page): Promise<void> => {
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  await page.locator('[data-shape="heart"]').click();
  await page.locator('[data-action="shape-continue"]').click();
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();
  const rect = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!rect) throw new Error('The original platform maker did not mount its Phaser canvas');
  const x = rect.x + rect.width / 2;
  const y = rect.y + rect.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 0; i < 22; i += 1) await page.mouse.move(x + (i % 2 === 0 ? 65 : -65), y, { steps: 3 });
  await page.mouse.up();
  await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
  await page.locator('[data-action="mix-continue"]').click();
  await page.locator('[data-action="decor-continue"]').click();
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
};

test('M5: the original platform bootstrap runs the real Phaser Library without reading or writing live save keys', async ({ page }) => {
  await open(page);
  expect(await page.evaluate(() => window.__squishyPhaserPlatform?.storageNamespace)).toBe(PREFIX);
  await makeToy(page);
  const save = await page.evaluate((prefix) => ({
    preview: JSON.parse(localStorage.getItem(prefix + 'squishy.save.v3') ?? 'null') as { version: number; library: Array<{ id: string; shapeId: string }> } | null,
    ordinary: localStorage.getItem('squishy.save.v3'),
  }), PREFIX);
  expect(save.preview?.version).toBe(3);
  expect(save.preview?.library).toHaveLength(1);
  expect(save.preview?.library[0]?.shapeId).toBe('heart');
  expect(save.ordinary).toBeNull();
  await page.locator('[data-action="home"]').click();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '1');
  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '1');
  await page.locator('[data-library-play-id]').click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  await page.evaluate(() => window.__squishyPhaserPlatform!.dispose());
  await expect(page.locator('[data-sandbox-canvas]')).toHaveCount(0);
});

test('M5: actual mock platform rewarded adapter grants 8→10 only in namespaced V3', async ({ page }) => {
  await open(page);
  await makeToy(page);
  await page.locator('[data-action="home"]').click();
  await page.evaluate((prefix) => {
    const key = prefix + 'squishy.save.v3';
    const state = JSON.parse(localStorage.getItem(key) ?? 'null') as {
      library: Array<{ id: string; createdAt: number }>;
      libraryCapacity: number;
      totalCrafts: number;
    };
    const original = state.library[0]!;
    state.library = Array.from({ length: 8 }, (_, index) => ({
      ...original,
      id: `platform-preview-${index}`,
      createdAt: original.createdAt + index,
    }));
    state.libraryCapacity = 8;
    state.totalCrafts = 8;
    localStorage.setItem(key, JSON.stringify(state));
  }, PREFIX);
  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '8');
  await page.locator('[data-library-expand-reward]').click();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-capacity', '10');
  const saved = await page.evaluate((prefix) => ({
    preview: JSON.parse(localStorage.getItem(prefix + 'squishy.save.v3') ?? 'null') as {
      libraryCapacity: number;
      unlockedRewardIds: string[];
    },
    ordinary: localStorage.getItem('squishy.save.v3'),
  }), PREFIX);
  expect(saved.preview.libraryCapacity).toBe(10);
  expect(saved.preview.unlockedRewardIds).toHaveLength(1);
  expect(saved.ordinary).toBeNull();
  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-capacity', '10');
  await expect(page.locator('[data-library-expand-reward]')).toHaveCount(0);
});
