import fs from 'node:fs';

const path = 'tests/release/release.spec.ts';
let source = fs.readFileSync(path, 'utf8');

const replaceOnce = (from, to, label) => {
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one anchor, found ${count}`);
  source = source.replace(from, to);
};

const replaceExpected = (from, to, expected, label) => {
  const count = source.split(from).length - 1;
  if (count !== expected) throw new Error(`${label}: expected ${expected} anchors, found ${count}`);
  source = source.split(from).join(to);
};

replaceOnce(
  "test('Pages production build boots into the recipe-first catalog', async ({ page }) => {",
  "test('Pages production build boots into the toy-first choose screen and shelf', async ({ page }) => {",
  'Pages test name',
);
replaceExpected("name: 'Browse recipes'", "name: 'All squishies'", 2, 'EN shelf actions');
replaceExpected("name: 'Рецепты'", "name: 'Все сквиши'", 2, 'RU shelf actions');
replaceOnce("name: 'Закрыть'", "name: 'Назад'", 'RU shelf close');
replaceOnce("name: 'Выключить звук'", "name: 'Звук выкл.'", 'RU mute');
replaceOnce("name: 'Включить звук'", "name: 'Звук вкл.'", 'RU unmute');
replaceOnce("name: 'Make squishy'", "name: 'MAKE'", 'craft start');
replaceOnce("name: 'Collect'", "name: 'KEEP IT'", 'collect action');
replaceOnce("name: 'Make again'", "name: 'Again'", 'completed repeat action');

replaceOnce(
  "  await expect(page.locator('.recipe-thumb')).toHaveCount(24);\n\n  expect(fatalErrors).toEqual([]);",
  "  await expect(page.locator('.recipe-thumb')).toHaveCount(24);\n  await expect(page.locator('.collection-reset-button')).toBeHidden();\n  const cubeCards = page.locator('.collection-group').first().locator('.collection-card');\n  await expect(cubeCards.nth(0)).toHaveAttribute('data-recipe-id', 'grape-smooth');\n  await expect(cubeCards.nth(1)).toHaveAttribute('data-recipe-id', 'strawberry-smooth');\n  await expect(cubeCards.nth(2)).toHaveAttribute('data-recipe-id', 'grape-beads');\n\n  expect(fatalErrors).toEqual([]);",
  'shelf contract assertions',
);

replaceOnce(
  "    await expectInViewport(page, page.locator('.recipe-dock__actions'));\n    await expectInViewport(page, page.locator('.stage-copy'));\n    expect(fatalErrors).toEqual([]);",
  "    await expectInViewport(page, page.locator('.recipe-dock__actions'));\n    if (viewport.name === 'phone landscape') {\n      await expect(page.locator('.stage-copy')).toBeHidden();\n    } else {\n      await expectInViewport(page, page.locator('.stage-copy'));\n    }\n    expect(fatalErrors).toEqual([]);",
  'responsive stage copy contract',
);

replaceOnce(
  "const finishMold = async (page: Page): Promise<void> => {\n  const shell = page.locator('.lab-shell');\n  const target = page.locator('.mold-target');\n  for (let press = 0; press < 18; press += 1) {\n    if ((await shell.getAttribute('data-stage')) !== 'mold') return;\n    await expect(target).toBeVisible();\n    await target.dispatchEvent('pointerdown', {\n      bubbles: true,\n      pointerId: press + 1,\n      button: 0,\n      buttons: 1,\n      pointerType: 'mouse',\n    });\n    await page.waitForTimeout(160);\n  }\n  if ((await shell.getAttribute('data-stage')) === 'mold') throw new Error('Mold did not complete after critical presses');\n};",
  "const finishMold = async (page: Page): Promise<void> => {\n  const shell = page.locator('.lab-shell');\n  const target = page.locator('.mold-target');\n  for (let press = 0; press < 18; press += 1) {\n    if ((await shell.getAttribute('data-stage')) !== 'mold') return;\n    await page.waitForFunction(() => {\n      const shellElement = document.querySelector('.lab-shell');\n      if (shellElement?.getAttribute('data-stage') !== 'mold') return true;\n      const targetElement = document.querySelector('.mold-target');\n      return targetElement instanceof HTMLButtonElement && !targetElement.hidden && !targetElement.disabled;\n    }, null, { timeout: 800 });\n    if ((await shell.getAttribute('data-stage')) !== 'mold') return;\n    await target.dispatchEvent('pointerdown', {\n      bubbles: true,\n      pointerId: press + 1,\n      button: 0,\n      buttons: 1,\n      pointerType: 'mouse',\n    });\n    await page.waitForTimeout(160);\n  }\n  if ((await shell.getAttribute('data-stage')) === 'mold') throw new Error('Mold did not complete after critical presses');\n};",
  'mold completion race',
);

replaceOnce(
  "  await page.getByRole('button', { name: 'MAKE' }).click();\n  await expect(shell).toHaveAttribute('data-stage', 'pour');",
  "  await page.getByRole('button', { name: 'MAKE' }).click();\n  await expect(shell).toHaveAttribute('data-stage', 'pour');\n  await expect(page.locator('.recipe-dock')).toBeHidden();\n  await expect(page.locator('.lab-topbar')).toHaveCSS('opacity', '0');",
  'active craft chrome contract',
);

replaceOnce(
  "  await page.getByRole('button', { name: 'KEEP IT' }).click();\n  await expect(shell).toHaveAttribute('data-stage', 'select', { timeout: 2_000 });\n  await expect(page.locator('.made-count')).toContainText('1 / 24');",
  "  await page.getByRole('button', { name: 'KEEP IT' }).click();\n  await expect(shell).toHaveAttribute('data-stage', 'collect');\n  await expect(page.locator('.progression-feedback')).toContainText('+100');\n  await expect(shell).toHaveAttribute('data-stage', 'select', { timeout: 2_000 });\n  await expect(page.locator('.progression-feedback')).toBeHidden();\n  await expect(page.locator('.variant-preview')).toHaveText('Berry Heart');\n  await expect(page.getByRole('button', { name: 'MAKE' })).toBeVisible();\n  await expect(page.locator('.made-count')).toContainText('1 / 24');",
  'ownership and next toy contract',
);

replaceOnce(
  "  await expect(page.locator('.collection-card--completed').getByRole('button', { name: 'Again' })).toBeVisible();\n  await expect(page.locator('.collection-card--completed').getByRole('button', { name: 'Squeeze' })).toBeVisible();",
  "  const completedActions = page.locator('.collection-card--completed .collection-card__actions button');\n  await expect(completedActions).toHaveCount(2);\n  await expect(completedActions.nth(0)).toHaveText('Squeeze');\n  await expect(completedActions.nth(1)).toHaveText('Again');",
  'completed action priority',
);

fs.writeFileSync(path, source);
console.log('UI Overhaul 02 Browser QA patch applied.');
