import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'short-landscape', width: 844, height: 390 },
  { name: 'desktop', width: 1280, height: 800 },
] as const;

for (const viewport of viewports) {
  test(`Phaser candy Shape and Finish stay playable on ${viewport.name}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto('/phaser/');
    await page.locator('[data-library-new]').first().click();
    await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');

    const shell = page.locator('[data-sandbox-app]');
    await expect(shell).toHaveAttribute('data-stage', 'shape');
    await expect(page.locator('[data-panel="shape"] .sandbox-shape')).toHaveCount(6);
    await page.locator('[data-shape="heart"]').click();
    await expect(page.locator('[data-shape="heart"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-shape="heart"]')).toHaveCSS('border-top-width', '2px');
    await page.screenshot({ path: testInfo.outputPath(`candy-shape-${viewport.name}.png`) });

    await page.locator('[data-action="shape-continue"]').click();
    await page.locator('[data-action="paint-continue"]').click();
    await page.locator('[data-action="mixin-continue"]').click();
    const box = await page.locator('[data-sandbox-canvas]').boundingBox();
    if (!box) throw new Error('Phaser canvas is missing');
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let n = 0; n < 22; n += 1) {
      await page.mouse.move(x + (n % 2 ? -65 : 65), y, { steps: 3 });
    }
    await page.mouse.up();
    await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
    await page.locator('[data-action="mix-continue"]').click();
    await page.locator('[data-action="decor-continue"]').click();
    await expect(shell).toHaveAttribute('data-stage', 'finish');
    await expect(page.locator('[data-panel="finish"] .sandbox-material')).toHaveCount(6);
    await page.locator('[data-material="pearl"]').click();
    await expect(shell).toHaveAttribute('data-material', 'pearl');
    await expect(page.locator('[data-material="pearl"]')).toHaveAttribute('aria-pressed', 'true');
    await page.screenshot({ path: testInfo.outputPath(`candy-finish-${viewport.name}.png`) });
    await expect(page.locator('[data-action="save"]')).toBeVisible();
  });
}
