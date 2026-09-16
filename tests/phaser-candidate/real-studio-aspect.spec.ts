import { expect, test, type Page } from '@playwright/test';

const canvasAspectError = async (page: Page): Promise<number> => page.locator('[data-sandbox-canvas]').evaluate((node) => {
  const canvas = node as HTMLCanvasElement;
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 100 || rect.height < 100 || canvas.width < 100 || canvas.height < 100) return 999;
  return Math.abs(canvas.width / canvas.height - rect.width / rect.height);
});

const matchesDisplayedPlayfield = async (page: Page): Promise<void> => {
  // A square CSS playfield with a portrait Phaser backbuffer stretches the heart
  // vertically, even though every document and save E2E assertion still passes.
  await expect.poll(() => canvasAspectError(page), { timeout: 10_000 }).toBeLessThan(0.012);
};

test('M4: real Phaser studio keeps original toy aspect through every responsive stage and rotation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/phaser-studio.html?lang=ru');
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  const shell = page.locator('[data-sandbox-app]');
  await matchesDisplayedPlayfield(page);
  await page.locator('[data-shape="heart"]').click();
  await page.screenshot({ path: 'phaser-candidate-evidence/real-studio-shape-portrait.png', fullPage: true });

  await page.locator('[data-action="shape-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'paint');
  await matchesDisplayedPlayfield(page);
  await page.locator('[data-action="paint-continue"]').click();
  await matchesDisplayedPlayfield(page);
  await page.locator('[data-action="mixin-continue"]').click();
  await matchesDisplayedPlayfield(page);

  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('Missing original studio playfield');
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  for (let n = 0; n < 22; n += 1) {
    await page.mouse.move(centerX + (n % 2 ? -65 : 65), centerY, { steps: 3 });
  }
  await page.mouse.up();
  await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
  await page.locator('[data-action="mix-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'decor');
  await matchesDisplayedPlayfield(page);
  await page.screenshot({ path: 'phaser-candidate-evidence/real-studio-decor-portrait.png', fullPage: true });
  await page.setViewportSize({ width: 844, height: 390 });
  await matchesDisplayedPlayfield(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await matchesDisplayedPlayfield(page);

  await page.locator('[data-action="decor-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'finish');
  await matchesDisplayedPlayfield(page);
  await page.locator('[data-action="save"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'squeeze');
  await matchesDisplayedPlayfield(page);
});
