import { expect, test, type Page } from '@playwright/test';

const open = async (page: Page): Promise<void> => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/phaser-platform.html?sdk=stub&lang=en');
  await expect(page.locator('#app')).toHaveAttribute('data-phaser-platform-ready', 'true');
};

const reachFinish = async (page: Page): Promise<void> => {
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  await page.locator('[data-craft-section="paint"]').click();
  await page.locator('[data-craft-section="mixins"]').click();
  await page.locator('[data-action="try-on"]').click();
  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('Missing real Phaser workbench');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let n = 0; n < 22; n += 1) await page.mouse.move(x + (n % 2 ? -65 : 65), y, { steps: 3 });
  await page.mouse.up();
  await expect(page.locator('[data-action="try-return"]')).toBeEnabled();
  await page.locator('[data-action="try-return"]').click();
  await page.locator('[data-craft-section="decor"]').click();
  await page.locator('[data-craft-section="shape"]').click();
  await page.locator('[data-base-tab="material"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'shape');
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
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'shape');
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


test('saved redecorating failure preserves the original and retry updates the same toy', async ({ page }) => {
  await open(page);
  await reachFinish(page);
  await page.locator('[data-action="save"]').click();
  const shell = page.locator('[data-sandbox-app]');
  await expect(shell).toHaveAttribute('data-stage', 'squeeze');
  const before = await page.evaluate(() => window.__squishyPhaserPlatform!.readSave());
  await page.locator('[data-action="edit-saved"]').click();
  await page.locator('[data-decor-section="accessory"]').click();
  await page.locator('[data-decor-accessory="bow"]').click();
  await page.locator('[data-craft-section="shape"]').click();
  await page.locator('[data-base-tab="material"]').click();
  await page.evaluate(() => window.__squishyPhaserPlatform!.setSaveWriteFailure(true));
  await page.locator('[data-action="save"]').click();
  await expect(shell).toHaveAttribute('data-save-complete', 'false');
  await expect(shell).toHaveAttribute('data-stage', 'shape');
  expect(await page.evaluate(() => window.__squishyPhaserPlatform!.readSave())).toEqual(before);
  await page.evaluate(() => window.__squishyPhaserPlatform!.setSaveWriteFailure(false));
  await page.locator('[data-action="save"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'squeeze');
  const after = await page.evaluate(() => window.__squishyPhaserPlatform!.readSave());
  expect(after.library).toHaveLength(1);
  expect(after.totalCrafts).toBe(before.totalCrafts);
  expect(after.library[0]!.id).toBe(before.library[0]!.id);
  expect(after.library[0]!.createdAt).toBe(before.library[0]!.createdAt);
  expect(after.library[0]!.decor.accessory).toBe('bow');
  // Repeated saved edits must not become new completed-craft/ad actions.
  for (let n = 0; n < 2; n++) {
    await page.locator('[data-action="edit-saved"]').click();
    await page.locator('[data-craft-section="shape"]').click();
    await page.locator('[data-base-tab="material"]').click();
    await page.locator('[data-action="save"]').click();
    await expect(shell).toHaveAttribute('data-stage', 'squeeze');
  }
  expect((await page.evaluate(() => window.__squishyPhaserPlatform!.getEvents())).filter(event => event.startsWith('analytics:craft_save:'))).toHaveLength(1);
  await page.locator('[data-action="home"]').click();
  expect(await page.evaluate(() => window.__squishyPhaserPlatform!.getSdkCounters()?.interstitials)).toBe(0);
  await page.reload();
  await page.locator(`[data-library-play-id="${before.library[0]!.id}"]`).click();
  await expect(page.locator('[data-accessory-index="0"]')).toHaveAttribute('data-accessory-id', 'bow');
});

test('rich free-craft edit survives blocked input and refused persistence without replacing its original', async ({ page }) => {
  await open(page);
  const toy = { id: 'rich-durable', createdAt: 1700000000000, shapeId: 'donut', materialId: 'jelly',
    appearance: { v: 1, strokes: [], mixins: [{ t: 7, x: 195, y: 128, s: 28, r: 0 }],
      mixinBrush: { size: 35, density: 1.5 }, light: { preset: 'moon', x: .6, y: .4 } },
    decor: { v: 1, eyes: 'dot', mouth: 'smile', blush: true, accessory: null, stickers: [],
      face: { x: 128, y: 68, s: .8 }, accessories: [
        { a: 'bow', x: 61, y: 207, s: .8, r: -.2, side: 'whole', color: 0xb6e4ce },
        { a: 'wings', x: 198, y: 110, s: .8, r: .6, side: 'right', locked: true },
      ] } };
  await page.evaluate(async value => {
    const control = window.__squishyPhaserPlatform!, save = await control.readSave();
    sessionStorage.setItem(control.storageKey(), JSON.stringify({ ...save, library: [value], totalCrafts: 1 }));
  }, toy);
  await page.reload(); await page.locator('[data-library-play-id="rich-durable"]').click();
  await page.locator('[data-action="edit-saved"]').click();
  await page.locator('[data-decor-section="objects"]').click();
  await page.locator('[data-object="face"]').click();
  const scale = page.locator('[data-object-control="scale"]');
  await scale.fill('0.65'); await scale.dispatchEvent('change');
  await page.evaluate(() => window.__squishyPhaserPlatform!.setBlocked(true));
  await expect(page.locator('[data-sandbox-app]')).toHaveClass(/is-blocked/);
  await page.locator('.free-object-core [data-object-action="reset"]').dispatchEvent('click');
  await page.evaluate(() => window.__squishyPhaserPlatform!.setBlocked(false));
  await expect(scale).toHaveValue('0.65');
  await page.locator('[data-craft-section="shape"]').click();
  await page.locator('[data-base-tab="material"]').click();
  await page.evaluate(() => window.__squishyPhaserPlatform!.setSaveWriteFailure(true));
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'shape');
  expect((await page.evaluate(() => window.__squishyPhaserPlatform!.readSave())).library[0]).toEqual(toy);
  await page.evaluate(() => window.__squishyPhaserPlatform!.setSaveWriteFailure(false));
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  expect((await page.evaluate(() => window.__squishyPhaserPlatform!.readSave())).library[0]).toEqual({ ...toy, decor: { ...toy.decor, face: { ...toy.decor.face, s: .65 } } });
  expect((await page.evaluate(() => window.__squishyPhaserPlatform!.getEvents())).filter(event => event.startsWith('analytics:craft_save:'))).toHaveLength(0);
});
