import { expect, test, type Page } from '@playwright/test';

const openLibrary = async (page: Page): Promise<void> => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/phaser-library.html?lang=ru');
  await expect(page.locator('#app')).toHaveAttribute('data-phaser-library-ready', 'true');
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
};

const completeMix = async (page: Page): Promise<void> => {
  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('The original maker did not mount its Phaser canvas');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let n = 0; n < 22; n += 1) await page.mouse.move(x + (n % 2 ? -65 : 65), y, { steps: 3 });
  await page.mouse.up();
  await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
  await page.locator('[data-action="mix-continue"]').click();
};

const makeSimpleToy = async (page: Page): Promise<void> => {
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  await page.locator('[data-shape="heart"]').click();
  await page.locator('[data-action="shape-continue"]').click();
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();
  await completeMix(page);
  await page.locator('[data-action="decor-continue"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'finish');
};

test('M5 preview: original Library and Ideas use the real Phaser maker, V3 save/reopen/delete without touching live storage', async ({ page }) => {
  await openLibrary(page);
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '0');
  await page.locator('[data-library-ideas]').click();
  await expect(page.locator('[data-sandbox-ideas]')).toBeVisible();
  await page.locator('[data-ideas-back]').click();
  await makeSimpleToy(page);
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  const saved = await page.evaluate(() => window.__squishyPhaserLibrary!.readSave());
  expect(saved.version).toBe(3);
  expect(saved.library).toHaveLength(1);
  expect(saved.library[0]?.shapeId).toBe('heart');
  expect(await page.evaluate(() => sessionStorage.getItem('squishy.save.v3'))).toBeNull();
  await page.locator('[data-action="home"]').click();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '1');
  await expect(page.locator('[data-sandbox-canvas]')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '1');
  await page.locator('[data-library-play-id]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  await page.locator('[data-action="home"]').click();
  await page.locator('[data-library-delete-id]').click();
  await expect(page.locator('[data-library-delete-overlay]')).toBeVisible();
  await page.locator('[data-library-delete-cancel]').click();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '1');
  await page.locator('[data-library-delete-id]').click();
  await page.locator('[data-library-delete-confirm]').click();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '0');
  expect((await page.evaluate(() => window.__squishyPhaserLibrary!.readSave())).library).toHaveLength(0);
});

test('M5 preview: full eight-slot shelf requires deliberate replacement; a closed ad cannot grant two slots', async ({ page }) => {
  test.setTimeout(90_000);
  await openLibrary(page);
  await makeSimpleToy(page);
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  await page.locator('[data-action="home"]').click();
  const ids = await page.evaluate(async () => {
    const app = window.__squishyPhaserLibrary!;
    const state = await app.readSave();
    const original = state.library[0]!;
    const seeded = Array.from({ length: 8 }, (_, index) => ({
      ...original,
      id: `phaser-seeded-${index}`,
      createdAt: original.createdAt + index,
    }));
    sessionStorage.setItem(app.storageKey(), JSON.stringify({
      ...state,
      library: seeded,
      libraryCapacity: 8,
      totalCrafts: 8,
      updatedAt: Date.now(),
    }));
    return seeded.map((toy) => toy.id);
  });
  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '8');
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-capacity', '8');
  await page.locator('[data-library-expand-reward]').click();
  await expect(page.locator('[data-library-reward-message]')).toBeVisible();
  expect((await page.evaluate(() => window.__squishyPhaserLibrary!.readSave())).libraryCapacity).toBe(8);

  await makeSimpleToy(page);
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-library-replace-overlay]')).toBeVisible();
  await page.locator('[data-library-replace-cancel]').click();
  expect((await page.evaluate(() => window.__squishyPhaserLibrary!.readSave())).library.map((toy) => toy.id)).toEqual(ids);
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-library-replace-overlay]')).toBeVisible();
  await page.locator(`[data-library-replace-id="${ids[0]}"]`).click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  const next = await page.evaluate(() => window.__squishyPhaserLibrary!.readSave());
  expect(next.library).toHaveLength(8);
  expect(next.libraryCapacity).toBe(8);
  expect(next.library.map((toy) => toy.id)).not.toContain(ids[0]);
  expect(next.library[0]?.shapeId).toBe('heart');
  expect(next.totalCrafts).toBe(9);
  await page.locator('[data-action="home"]').click();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '8');
});
