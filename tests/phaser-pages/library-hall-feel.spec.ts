import { expect, test } from '@playwright/test';

const key = 'squishy.phaser-pages-preview.squishy.save.v3';

test('review: parquet repeats, shelf fits, toys stay still and catalog scrolling keeps the table fixed', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/phaser/');
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  await page.locator('[data-craft-section="paint"]').click();
  await page.locator('[data-craft-section="mixins"]').click();
  await page.locator('[data-action="try-on"]').click();
  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('Missing real Studio canvas');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 0; i < 22; i++) await page.mouse.move(x + (i % 2 ? -65 : 65), y, { steps: 3 });
  await page.mouse.up();
  await page.locator('[data-action="try-return"]').click();
  await page.locator('[data-craft-section="decor"]').click();
  await page.locator('[data-craft-section="shape"]').click();
  await page.locator('[data-base-tab="material"]').click();
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  await page.evaluate((storageKey) => {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
    if (saved?.library?.length !== 1) throw new Error('No real V3 saved fixture');
    saved.library = [saved.library[0], { ...saved.library[0], id: 'feel-second', materialId: 'holo' }, { ...saved.library[0], id: 'feel-third', materialId: 'chrome' }];
    localStorage.setItem(storageKey, JSON.stringify(saved));
  }, key);
  await page.reload();
  const card = page.locator('.sandbox-library-card:visible').first();
  await expect(card).toBeVisible();
  const state = await page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('.sandbox-library-card:not([hidden]) canvas')!;
    const shadow = document.querySelector<HTMLElement>('.sandbox-library-card:not([hidden]) .sandbox-library-card__play')!;
    const floor = document.querySelector<HTMLElement>('.library-hall-scene__floor')!;
    const plane = getComputedStyle(floor, '::before');
    const cabinet = document.querySelector<HTMLElement>('.library-showcase-collection')!;
    const shelf = document.querySelector<HTMLElement>('.library-showcase-workbench')!;
    return {
      toyAnimation: getComputedStyle(canvas).animationName,
      toyFilter: getComputedStyle(canvas).filter,
      shadowAnimation: getComputedStyle(shadow, '::before').animationName,
      floorPerspective: getComputedStyle(floor).perspective,
      planeRepeat: plane.backgroundRepeat,
      planeSize: plane.backgroundSize,
      planeImage: plane.backgroundImage,
      planeTransform: plane.transform,
      cabinetWidth: cabinet.getBoundingClientRect().width,
      shelfWidth: shelf.getBoundingClientRect().width,
    };
  });
  expect(state.toyAnimation).toBe('none');
  expect(state.toyFilter).toBe('none');
  expect(state.shadowAnimation).toBe('none');
  expect(state.floorPerspective).not.toBe('none');
  expect(state.planeRepeat).toBe('repeat');
  expect(state.planeSize).toContain('px');
  expect(state.planeImage).toContain('floor-tile');
  expect(state.planeTransform).toMatch(/^matrix3d\(/);
  expect(state.cabinetWidth).toBeGreaterThanOrEqual(87);
  expect(state.shelfWidth, 'collection shows its catalog while the table is hidden').toBe(0);
  await page.screenshot({ path: info.outputPath('library-hall-perspective-phone-390.png'), animations: 'disabled' });
  const table=await page.locator('.library-showcase-table').boundingBox();
  await page.locator('.sandbox-library-card').last().scrollIntoViewIfNeeded();
  await expect(page.locator('[data-library-play-id="feel-third"]')).toBeVisible();
  expect(await page.locator('.library-showcase-table').boundingBox()).toEqual(table);
  await page.locator('.sandbox-library-card').first().scrollIntoViewIfNeeded();
  await expect.poll(() => card.evaluate(element=>getComputedStyle(element.querySelector('canvas')!).animationName)).toBe('none');
  await page.setViewportSize({ width: 1440, height: 900 });
  const desktop = await page.evaluate(() => ({
    cabinet: document.querySelector('.library-showcase-collection')!.getBoundingClientRect().width,
    shelf: document.querySelector('.library-showcase-workbench')!.getBoundingClientRect().width,
    plant: document.querySelector('.library-showcase-table')!.getBoundingClientRect().width,
    planeRepeat: getComputedStyle(document.querySelector('.library-hall-scene__floor')!, '::before').backgroundRepeat,
  }));
  expect(desktop.cabinet).toBeGreaterThanOrEqual(180);
  expect(desktop.shelf, 'desktop collection also hides the play table').toBe(0);
  expect(desktop.plant, 'play starts only after choosing a toy').toBe(0);
  expect(desktop.planeRepeat).toBe('repeat');
  await page.screenshot({ path: info.outputPath('library-hall-perspective-desktop-1440.png'), animations: 'disabled' });
});
