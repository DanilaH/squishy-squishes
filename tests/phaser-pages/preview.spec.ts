import { expect, test, type Page } from '@playwright/test';

const openPreview = async (page: Page): Promise<void> => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/phaser/');
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
  expect(await page.evaluate(() => document.body.dataset.releasePlatform)).not.toBe('yandex');
  expect(await page.locator('script[src*="sdk.js"]').count()).toBe(0);
};

test('staged Pages route opens the actual Library and Phaser workbench on mobile', async ({ page }) => {
  await openPreview(page);
  await page.locator('[data-library-new]').first().click();
  const canvas = page.locator('[data-sandbox-canvas]');
  await expect(canvas).toHaveAttribute('data-phaser-ready', 'true');
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('aria-busy', 'true');
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('aria-busy', 'false');
  await expect(canvas).toHaveAttribute('data-phaser-ready', 'true');
});

test('Pages saves persist under a separate key without changing existing web saves', async ({ page }) => {
  await openPreview(page);
  await page.evaluate(() => localStorage.setItem('squishy.save.v3', 'existing-game-sentinel'));
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  await page.locator('[data-shape="heart"]').click();
  await page.locator('[data-action="shape-continue"]').click();
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();
  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('Missing Phaser preview workbench');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let n = 0; n < 22; n += 1) await page.mouse.move(x + (n % 2 ? -65 : 65), y, { steps: 3 });
  await page.mouse.up();
  await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
  await page.locator('[data-action="mix-continue"]').click();
  await page.locator('[data-action="decor-continue"]').click();
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  const saved = await page.evaluate(() => ({
    original: localStorage.getItem('squishy.save.v3'),
    preview: localStorage.getItem('squishy.phaser-pages-preview.squishy.save.v3'),
  }));
  expect(saved.original).toBe('existing-game-sentinel');
  expect(JSON.parse(saved.preview ?? 'null')).toMatchObject({ version: 3, library: [{ shapeId: 'heart' }] });
  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '1');
});
