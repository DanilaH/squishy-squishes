import { expect, test, type Page } from '@playwright/test';

const open = async (page: Page): Promise<void> => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/phaser-platform.html?sdk=stub&lang=en');
  await expect(page.locator('#app')).toHaveAttribute('data-phaser-platform-ready', 'true');
};

const reachFinish = async (page: Page): Promise<void> => {
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  await page.locator('[data-action="shape-continue"]').click();
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();
  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('Missing real Phaser workbench');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let n = 0; n < 22; n += 1) await page.mouse.move(x + (n % 2 ? -65 : 65), y, { steps: 3 });
  await page.mouse.up();
  await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
  await page.locator('[data-action="mix-continue"]').click();
  await page.locator('[data-action="decor-continue"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'finish');
};

const seedFullShelf = async (page: Page): Promise<void> => {
  await reachFinish(page);
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  await page.locator('[data-action="home"]').click();
  await page.evaluate(() => {
    const control = window.__squishyPhaserPlatform!;
    const state = JSON.parse(sessionStorage.getItem(control.storageKey())!) as {
      library: { id: string; createdAt: number }[];
      libraryCapacity: number;
      totalCrafts: number;
      updatedAt: number;
    };
    const original = state.library[0]!;
    state.library = Array.from({ length: 8 }, (_, index) => ({
      ...original, id: `failure-fixture-${index}`, createdAt: original.createdAt + index,
    }));
    state.libraryCapacity = 8;
    state.totalCrafts = 8;
    state.updatedAt = Date.now();
    sessionStorage.setItem(control.storageKey(), JSON.stringify(state));
  });
  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '8');
};

test('M5: a failed durable save stays on Finish and never emits a completed craft', async ({ page }) => {
  await open(page);
  await reachFinish(page);
  await page.evaluate(() => window.__squishyPhaserPlatform!.setSaveWriteFailure(true));
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-save-complete', 'false');
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'finish');
  expect((await page.evaluate(() => window.__squishyPhaserPlatform!.readSave())).library).toHaveLength(0);
  expect((await page.evaluate(() => window.__squishyPhaserPlatform!.getEvents())).filter((event) => event.startsWith('analytics:craft_save:'))).toHaveLength(0);
  await page.evaluate(() => window.__squishyPhaserPlatform!.setSaveWriteFailure(false));
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  expect((await page.evaluate(() => window.__squishyPhaserPlatform!.readSave())).library).toHaveLength(1);
  await expect.poll(async () => (await page.evaluate(() => window.__squishyPhaserPlatform!.getEvents())).filter((event) => event.startsWith('analytics:craft_save:')).length).toBe(1);
});

test('M5: failed reward persistence cannot unlock slots; ad close cannot resume through a platform pause', async ({ page }) => {
  await open(page);
  await seedFullShelf(page);
  await page.evaluate(() => {
    const control = window.__squishyPhaserPlatform!;
    control.setRewardMode('grant');
    control.setSaveWriteFailure(true);
  });
  await page.locator('[data-library-expand-reward]').click();
  await expect(page.locator('[data-library-reward-message]')).toBeVisible();
  expect((await page.evaluate(() => window.__squishyPhaserPlatform!.readSave())).libraryCapacity).toBe(8);
  expect((await page.evaluate(() => window.__squishyPhaserPlatform!.getEvents())).filter((event) => event.startsWith('analytics:shelf_reward_granted:'))).toHaveLength(0);

  await page.evaluate(() => {
    const control = window.__squishyPhaserPlatform!;
    control.setSaveWriteFailure(false);
    control.setRewardMode('pending');
  });
  await page.locator('[data-library-expand-reward]').click();
  await expect(page.locator('[data-sandbox-library]')).toHaveClass(/is-blocked/);
  await page.evaluate(() => window.__squishyPhaserPlatform!.pause());
  await page.evaluate(() => window.__squishyPhaserPlatform!.finishPendingReward(true));
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-capacity', '10');
  await expect(page.locator('[data-sandbox-library]')).toHaveClass(/is-blocked/);
  await page.evaluate(() => window.__squishyPhaserPlatform!.resume());
  await expect(page.locator('[data-sandbox-library]')).not.toHaveClass(/is-blocked/);
  const state = await page.evaluate(() => window.__squishyPhaserPlatform!.readSave());
  expect(state.libraryCapacity).toBe(10);
  expect(state.unlockedRewardIds).toHaveLength(1);
  expect((await page.evaluate(() => window.__squishyPhaserPlatform!.getEvents())).filter((event) => event.startsWith('analytics:shelf_reward_granted:'))).toHaveLength(1);
});
