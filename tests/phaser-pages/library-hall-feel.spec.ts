import { expect, test } from '@playwright/test';

const key = 'squishy.phaser-pages-preview.squishy.save.v3';

test('review: owner parquet repeats in projected plane, props fit, toys stay still, paging fades', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/phaser/');
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  await page.locator('[data-action="shape-continue"]').click();
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();
  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('Missing real Studio canvas');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 0; i < 22; i++) await page.mouse.move(x + (i % 2 ? -65 : 65), y, { steps: 3 });
  await page.mouse.up();
  await page.locator('[data-action="mix-continue"]').click();
  await page.locator('[data-action="decor-continue"]').click();
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
    const cabinet = document.querySelector<HTMLElement>('.library-hall-scene__cabinet')!;
    const shelf = document.querySelector<HTMLElement>('.library-hall-scene__shelf')!;
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
  expect(state.shelfWidth).toBeGreaterThanOrEqual(119);
  await page.screenshot({ path: info.outputPath('library-hall-perspective-phone-390.png'), animations: 'disabled' });
  await page.evaluate(() => {
    (window as unknown as { __hallPageStarts: { name: string; translate: string; filter: string }[] }).__hallPageStarts = [];
    window.addEventListener('animationstart', (event) => {
      if (event.animationName === 'library-toy-page-enter' && event.target instanceof Element) {
        const style = getComputedStyle(event.target);
        (window as unknown as { __hallPageStarts: { name: string; translate: string; filter: string }[] }).__hallPageStarts.push({
          name: event.animationName, translate: style.translate, filter: style.filter,
        });
      }
    });
  });
  await page.locator('[data-library-hall-next]').click();
  await expect(page.locator('[data-library-hall-page]')).toHaveText('2 / 2');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __hallPageStarts: unknown[] }).__hallPageStarts.length)).toBeGreaterThan(0);
  expect(await page.evaluate(() => (window as unknown as { __hallPageStarts: { name: string; translate: string; filter: string }[] }).__hallPageStarts[0])).toMatchObject({
    name: 'library-toy-page-enter', translate: 'none', filter: 'none',
  });
  await page.locator('[data-library-hall-prev]').click();
  await expect(page.locator('[data-library-hall-page]')).toHaveText('1 / 2');
  await expect.poll(() => card.evaluate((element) => getComputedStyle(element.querySelector('canvas')!).animationName)).toBe('none');
  await page.setViewportSize({ width: 1440, height: 900 });
  const desktop = await page.evaluate(() => ({
    cabinet: document.querySelector('.library-hall-scene__cabinet')!.getBoundingClientRect().width,
    shelf: document.querySelector('.library-hall-scene__shelf')!.getBoundingClientRect().width,
    plant: document.querySelector('.library-hall-scene__plant')!.getBoundingClientRect().width,
    planeRepeat: getComputedStyle(document.querySelector('.library-hall-scene__floor')!, '::before').backgroundRepeat,
  }));
  expect(desktop.cabinet).toBeGreaterThanOrEqual(180);
  expect(desktop.shelf).toBeGreaterThanOrEqual(240);
  expect(desktop.plant).toBeGreaterThanOrEqual(169);
  expect(desktop.planeRepeat).toBe('repeat');
  await page.screenshot({ path: info.outputPath('library-hall-perspective-desktop-1440.png'), animations: 'disabled' });
});
