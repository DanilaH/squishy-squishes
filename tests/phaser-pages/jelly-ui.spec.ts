import { expect, test } from '@playwright/test';

test('Jelly buttons decode before the Library is playable and keep Shape functional', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/phaser/');
  const root = page.locator('#app');
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
  await expect(root).toHaveAttribute('data-jelly-ui-ready', '');
  const newToy = page.locator('[data-library-new]').first();
  await expect(newToy).toHaveCSS('background-image', /honey-wide.*webp/);

  // Unlike the earlier side-by-side header, the full title and both touch
  // targets must have their own space even on a narrow portrait phone.
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const title = page.locator('.sandbox-library-heading h1');
    const actions = page.locator('.sandbox-library-heading__actions');
    const titleBox = await title.boundingBox();
    const actionsBox = await actions.boundingBox();
    const ideasBox = await actions.locator('button').first().boundingBox();
    const newBox = await actions.locator('button').last().boundingBox();
    expect(titleBox).not.toBeNull();
    expect(actionsBox).not.toBeNull();
    expect(ideasBox).not.toBeNull();
    expect(newBox).not.toBeNull();
    expect(titleBox!.y + titleBox!.height).toBeLessThan(actionsBox!.y);
    expect(ideasBox!.x + ideasBox!.width).toBeLessThan(newBox!.x);
    expect(newBox!.x + newBox!.width).toBeLessThanOrEqual(width);
    expect(ideasBox!.height).toBeGreaterThanOrEqual(44);
    expect(newBox!.height).toBeGreaterThanOrEqual(44);
    const titleLineCount = await title.evaluate((element) =>
      element.getBoundingClientRect().height / parseFloat(getComputedStyle(element).lineHeight));
    expect(titleLineCount).toBeLessThan(1.2);
    await page.screenshot({ path: testInfo.outputPath(`candy-jelly-library-${width}.png`) });
  }

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
