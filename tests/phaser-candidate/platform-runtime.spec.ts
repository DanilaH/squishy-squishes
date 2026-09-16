import { expect, test, type Page } from '@playwright/test';

const open = async (page: Page): Promise<void> => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/phaser-platform.html?sdk=stub&lang=ru');
  await expect(page.locator('#app')).toHaveAttribute('data-phaser-platform-ready', 'true');
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
  expect(await page.evaluate(() => window.__squishyPhaserPlatform!.getReadyCalls())).toBe(1);
  expect(await page.evaluate(() => window.__squishyPhaserPlatform!.getSdkCounters()?.ready)).toBe(1);
};

const completeMix = async (page: Page): Promise<void> => {
  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('Phaser platform candidate has no workbench');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let n = 0; n < 22; n += 1) await page.mouse.move(x + (n % 2 ? -65 : 65), y, { steps: 3 });
  await page.mouse.up();
  await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
  await page.locator('[data-action="mix-continue"]').click();
};

const saveOne = async (page: Page): Promise<void> => {
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  await page.locator('[data-shape="heart"]').click();
  await page.locator('[data-action="shape-continue"]').click();
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();
  await completeMix(page);
  await page.locator('[data-action="decor-continue"]').click();
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  await page.locator('[data-action="home"]').click();
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
};

test('M5: real bootstrap routes overlapping Yandex pauses and activity blockers to the Phaser studio', async ({ page }) => {
  await open(page);
  expect(await page.evaluate(() => window.__squishyPhaserPlatform!.getSdkCounters()?.starts)).toBe(1);
  await page.locator('[data-library-new]').first().click();
  await page.locator('[data-action="shape-continue"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'paint');
  const canvas = page.locator('[data-sandbox-canvas]');
  await expect(canvas).toHaveAttribute('data-phaser-ready', 'true');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Missing Phaser canvas');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.evaluate(() => window.__squishyPhaserPlatform!.pause());
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('aria-busy', 'true');
  const stopped = await page.evaluate(() => window.__squishyPhaserPlatform!.getSdkCounters()?.stops);
  expect(stopped).toBe(1);
  await page.evaluate(() => window.__squishyPhaserPlatform!.setBlocked(true));
  await page.evaluate(() => window.__squishyPhaserPlatform!.resume());
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('aria-busy', 'true');
  expect(await page.evaluate(() => window.__squishyPhaserPlatform!.getSdkCounters()?.starts)).toBe(1);
  await page.mouse.up();
  await page.evaluate(() => window.__squishyPhaserPlatform!.setBlocked(false));
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('aria-busy', 'false');
  expect(await page.evaluate(() => window.__squishyPhaserPlatform!.getSdkCounters()?.starts)).toBe(2);
  expect(await page.evaluate(() => window.__squishyPhaserPlatform!.getSdkCounters()?.interstitials)).toBe(0);
  expect(await page.evaluate(() => window.__squishyPhaserPlatform!.getReadyCalls())).toBe(1);
});

test('M5: real bootstrap persists V3 and rewards only after an SDK grant; duplicates never expand twice', async ({ page }) => {
  await open(page);
  await saveOne(page);
  const initial = await page.evaluate(() => window.__squishyPhaserPlatform!.readSave());
  expect(initial.version).toBe(3);
  expect(initial.library).toHaveLength(1);
  expect(initial.totalCrafts).toBe(1);
  expect(await page.evaluate(() => sessionStorage.getItem('squishy.save.v3'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('squishy.save.v3'))).toBeNull();
  expect((await page.evaluate(() => window.__squishyPhaserPlatform!.getEvents())).some((event) => event.startsWith('analytics:craft_save:'))).toBe(true);
  expect(await page.evaluate(() => window.__squishyPhaserPlatform!.getSdkCounters()?.interstitials)).toBe(0);

  const ids = await page.evaluate(() => {
    const control = window.__squishyPhaserPlatform!;
    const saved = JSON.parse(sessionStorage.getItem(control.storageKey())!) as { library: { id: string; createdAt: number }[]; libraryCapacity: number; totalCrafts: number; updatedAt: number };
    const original = saved.library[0]!;
    saved.library = Array.from({ length: 8 }, (_, index) => ({ ...original, id: `sdk-stub-toy-${index}`, createdAt: original.createdAt + index }));
    saved.libraryCapacity = 8;
    saved.totalCrafts = 8;
    saved.updatedAt = Date.now();
    sessionStorage.setItem(control.storageKey(), JSON.stringify(saved));
    return saved.library.map((toy) => toy.id);
  });
  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '8');
  await page.locator('[data-library-expand-reward]').click();
  await expect(page.locator('[data-library-reward-message]')).toBeVisible();
  expect((await page.evaluate(() => window.__squishyPhaserPlatform!.readSave())).libraryCapacity).toBe(8);
  await page.evaluate(() => window.__squishyPhaserPlatform!.setRewardMode('duplicate'));
  await page.locator('[data-library-expand-reward]').click();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-capacity', '10');
  const granted = await page.evaluate(() => window.__squishyPhaserPlatform!.readSave());
  expect(granted.library.map((toy) => toy.id)).toEqual(ids);
  expect(granted.libraryCapacity).toBe(10);
  expect(granted.unlockedRewardIds).toHaveLength(1);
  expect(granted.totalCrafts).toBe(8);
  expect((await page.evaluate(() => window.__squishyPhaserPlatform!.getEvents())).filter((event) => event.startsWith('analytics:shelf_reward_granted:'))).toHaveLength(1);
  expect(await page.evaluate(() => window.__squishyPhaserPlatform!.getSdkCounters()?.rewarded)).toBe(2);
  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-capacity', '10');
});
