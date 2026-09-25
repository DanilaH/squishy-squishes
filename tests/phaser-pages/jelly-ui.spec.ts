import { expect, test } from '@playwright/test';

test('Jelly buttons decode before the Library is playable and keep Shape functional', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/phaser/');
  const root = page.locator('#app');
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
  await expect(root).toHaveAttribute('data-jelly-ui-ready', '');
  const newToy = page.locator('[data-library-new]').first();
  await expect(newToy).toHaveCSS('background-image', /honey-wide.*webp/);

  // Font must be part of the offline Pages bundle, including Cyrillic; a
  // fallback system font must not silently pass our visual QA.
  await expect(page.locator('.sandbox-library-heading h1')).toHaveCSS('font-family', /Nunito Variable/);
  const loadedFontCount = await page.evaluate(async () => {
    const faces = await document.fonts.load('900 14px "Nunito Variable"', 'Continue Продолжить');
    return faces.filter((face) => face.family.includes('Nunito') && face.status === 'loaded').length;
  });
  expect(loadedFontCount).toBeGreaterThan(0);

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
  const continueButton = page.locator('[data-action="shape-continue"]');
  await expect(continueButton).toHaveCSS('background-image', /honey-wave.*webp/);
  await expect(continueButton).toHaveCSS('background-size', 'contain');
  const buttonBox = await continueButton.boundingBox();
  expect(buttonBox).not.toBeNull();
  expect(buttonBox!.width / buttonBox!.height).toBeGreaterThan(2.7);
  expect(buttonBox!.width / buttonBox!.height).toBeLessThan(3.1);
  expect(buttonBox!.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: testInfo.outputPath('candy-jelly-shape-390.png') });

  await page.locator('button[data-shape="heart"]').click();
  await expect(page.locator('button[data-shape="heart"]')).toHaveAttribute('aria-pressed', 'true');
  await continueButton.click();
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


test('dirty craft exit confirms, and appearance limit stays explicit without blocking Continue', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/phaser/');
  await page.locator('[data-library-new]').first().click();
  const shell = page.locator('[data-sandbox-app]');
  await page.locator('[data-shape="heart"]').click();
  await page.locator('[data-action="shape-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'paint');

  await page.locator('[data-action="exit-craft"]').click();
  await expect(page.locator('[data-exit-overlay]')).toBeVisible();
  await page.locator('[data-action="exit-cancel"]').click();
  await expect(page.locator('[data-exit-overlay]')).toBeHidden();
  await expect(shell).toHaveAttribute('data-stage', 'paint');

  await page.locator('[data-paint-tool="fill"]').click();
  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('Missing paint canvas');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.click(box.x + 8, box.y + 8);
  await expect(shell, 'Fill ignores transparent playfield outside the canonical shape').toHaveAttribute('data-paint-strokes', '0');
  await page.mouse.click(x, y);
  await expect(shell).toHaveAttribute('data-paint-strokes', '1');
  for (let index = 1; index < 110; index += 1) {
    await page.mouse.click(x, y);
    if (index % 20 === 19) await page.waitForTimeout(20);
  }

  await expect(shell).toHaveAttribute('data-appearance-full', 'true');
  await expect(page.locator('[data-sandbox-status]')).toHaveAttribute('data-limit', '');
  await expect(page.locator('[data-sandbox-status]')).toContainText(/Detail limit|Лимит деталей/);
  await expect(page.locator('[data-paint-tool="fill"]')).toBeDisabled();
  await expect(page.locator('[data-action="paint-continue"]')).toBeEnabled();

  await page.locator('[data-action="paint-clear"]').click();
  await expect(shell).toHaveAttribute('data-appearance-full', 'false');
  await expect(page.locator('[data-paint-tool="fill"]')).toBeEnabled();

  await page.locator('[data-action="exit-craft"]').click();
  await expect(page.locator('[data-exit-overlay]')).toBeVisible();
  await page.locator('[data-action="exit-confirm"]').click();
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
});
