import { expect, test } from '@playwright/test';

test('Jelly buttons decode before the Library is playable and keep Shape functional', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/phaser/');
  const root = page.locator('#app');
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
  await expect(root).toHaveAttribute('data-jelly-ui-ready', '');
  const newToy = page.locator('[data-library-new]').first();
  await expect(newToy).toHaveCSS('background-image', /honey-wide.*webp/);
  await page.screenshot({ path: testInfo.outputPath('candy-jelly-library-phone.png') });
  await newToy.click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'shape');
  await expect(page.locator('[data-action="shape-continue"]')).toHaveCSS('background-image', /honey-wave.*webp/);
  await page.locator('button[data-shape="heart"]').click();
  await expect(page.locator('button[data-shape="heart"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-action="shape-continue"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'paint');
  await expect(page.locator('[data-action="paint-clear"]')).toHaveCSS('background-image', /red-wide.*webp/);
});

test('A missing jelly asset leaves all original CSS controls usable', async ({ page }) => {
  await page.route('**/*honey-wide*.webp', (route) => route.abort());
  await page.goto('/phaser/');
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
  await expect(page.locator('#app')).not.toHaveAttribute('data-jelly-ui-ready', '');
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'shape');
  await expect(page.locator('[data-panel="shape"] .sandbox-shape')).toHaveCount(6);
});
