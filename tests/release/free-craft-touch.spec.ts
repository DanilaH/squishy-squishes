import { expect, test } from '@playwright/test';

test('a finger scrolls only the craft catalog without painting or squeezing the toy', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await context.newPage();
  try {
    await page.goto('/squishy-squishes/'); await page.locator('[data-library-new]').first().click();
    const shell = page.locator('[data-sandbox-app]'), canvas = page.locator('[data-sandbox-canvas]');
    await expect(canvas).toHaveAttribute('data-phaser-ready', 'true');
    const cdp = await context.newCDPSession(page), stable = await canvas.boundingBox();
    for (const selector of ['.free-shape-catalog', '.free-mixin-catalog']) {
      const tray = page.locator(selector), box = (await tray.boundingBox())!;
      const start = { x: box.x + box.width / 2, y: box.y + box.height - 12, id: 1 };
      const count = await shell.getAttribute('data-mixin-count');
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
      for (let step = 1; step <= 8; step++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...start, y: start.y - step * 12 }] });
        await page.waitForTimeout(20);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await expect.poll(() => tray.evaluate(node => node.scrollTop)).toBeGreaterThan(30);
      await expect(shell).toHaveAttribute('data-squish-active', 'false');
      expect(await shell.getAttribute('data-mixin-count')).toBe(count);
      expect(await canvas.boundingBox()).toEqual(stable);
      expect(await page.evaluate(() => scrollY)).toBe(0);
      if (selector === '.free-shape-catalog') {
        await page.locator('[data-craft-section="paint"]').click(); await page.locator('[data-craft-section="mixins"]').click();
      }
    }
    const tray = page.locator('.free-mixin-catalog'), box = (await canvas.boundingBox())!;
    await page.locator('[data-mixin="bubbles"]').click();
    const scroll = await tray.evaluate(node => node.scrollTop);
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await expect(shell).toHaveAttribute('data-mixin-count', '1');
    expect(await tray.evaluate(node => node.scrollTop)).toBe(scroll);
    expect(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight)).toBe(false);
  } finally { await context.close(); }
});

test('overlapping objects remain reachable with a native horizontal swipe', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await context.newPage();
  try {
    await page.goto('/squishy-squishes/');
    await page.evaluate(() => localStorage.setItem('squishy.save.v3', JSON.stringify({ version: 3, libraryCapacity: 8,
      totalCrafts: 1, updatedAt: 1700000000000, completedRecipeIds: [], unlockedRewardIds: [], library: [{ id: 'objects', createdAt: 1700000000000,
        shapeId: 'mochi', materialId: 'soft', appearance: { v: 1, strokes: [], mixins: [] },
        decor: { v: 1, eyes: 'dot', mouth: 'smile', blush: false, accessory: null, stickers: [],
          accessories: Array.from({ length: 12 }, (_, i) => ({ a: 'bow', x: 70 + i * 8, y: 180, s: .7, r: 0, side: 'whole' })) } }] })));
    await page.reload(); await page.locator('[data-library-play-id="objects"]').click();
    await page.locator('[data-action="edit-saved"]').click(); await page.locator('button[data-decor-section="objects"]').click();
    const saved = await page.evaluate(() => localStorage.getItem('squishy.save.v3'));
    const list = page.locator('.free-object-list'), rect = (await list.boundingBox())!;
    const cdp = await context.newCDPSession(page), start = { x: rect.x + rect.width - 15, y: rect.y + rect.height / 2, id: 1 };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
    for (let i = 1; i <= 8; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...start, x: start.x - i * 25 }] });
      await page.waitForTimeout(20);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => list.evaluate(node => node.scrollLeft)).toBeGreaterThan(80);
    await expect(page.locator('.craft-actions [data-action="draft-undo"]')).toBeDisabled();
    expect(await page.evaluate(() => localStorage.getItem('squishy.save.v3'))).toBe(saved);
    await page.locator('[data-object="accessory:11"]').click();
    await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-selected-object', 'accessory:11');
    expect(await list.evaluate(node => node.scrollLeft)).toBeGreaterThan(80);
    const slider = page.locator('[data-object-control="scale"]'); await slider.focus();
    await page.keyboard.press('ArrowRight'); await expect(slider).toBeFocused();
    await page.keyboard.press('ArrowRight'); await expect(slider).toHaveValue('0.72');
  } finally { await context.close(); }
});
