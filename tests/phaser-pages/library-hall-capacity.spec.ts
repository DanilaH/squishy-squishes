import { expect, test } from '@playwright/test';

const SAVE_KEY = 'squishy.phaser-pages-preview.squishy.save.v3';

test('eight persisted toys scroll repeatedly without duplicate shelves, leaks or inaccessible controls', async ({ browser }, info) => {
  const context = await browser.newContext({ locale: 'ru-RU', viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await page.goto('/phaser/?roomReview=0');
    await page.locator('[data-library-new]').first().click();
    await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
    await page.locator('[data-shape="heart"]').click();
    await page.locator('[data-craft-section="paint"]').click();
    await page.locator('[data-craft-section="mixins"]').click();
    await page.locator('[data-action="try-on"]').click();
    const surface = await page.locator('[data-sandbox-canvas]').boundingBox();
    if (!surface) throw new Error('No real maker surface');
    const x = surface.x + surface.width / 2;
    const y = surface.y + surface.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 0; i < 22; i += 1) await page.mouse.move(x + (i % 2 ? -65 : 65), y, { steps: 3 });
    await page.mouse.up();
    await expect(page.locator('[data-action="try-return"]')).toBeEnabled();
    await page.locator('[data-action="try-return"]').click();
    await page.locator('[data-craft-section="decor"]').click();
    await page.locator('[data-craft-section="shape"]').click();
    await page.locator('[data-base-tab="material"]').click();
    await page.locator('[data-action="save"]').click();
    await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
    // Duplicate a genuinely saved V3 object with unique IDs; don't bypass the codec
    // or synthesize unrelated art. Full library capacity is eight without ads.
    await page.evaluate((key) => {
      const state = JSON.parse(localStorage.getItem(key) ?? 'null');
      if (!state || state.library?.length !== 1) throw new Error('Real saved fixture missing');
      const original = state.library[0];
      const materials = ['soft', 'jelly', 'holo', 'marshmallow', 'pearl', 'chrome', 'soft', 'jelly'];
      state.library = materials.map((materialId, index) => ({ ...original, id: `stress-toy-${index}`, materialId }));
      localStorage.setItem(key, JSON.stringify(state));
    }, SAVE_KEY);
    await page.reload();
    await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '8');
    const original = await page.evaluate(key=>localStorage.getItem(key), SAVE_KEY);
    for (let cycle = 0; cycle < 5; cycle++) {
      for (const index of [0,2,4,6,7,4,2,0]) {
        const control=page.locator(`[data-library-play-id="stress-toy-${index}"]`);
        await control.scrollIntoViewIfNeeded();
        await expect(control).toBeVisible();
        await expect(page.locator('[data-library-toy]')).toHaveCount(8);
        await expect(page.locator('.library-hall-scene')).toHaveCount(1);
        await expect(page.locator('.library-showcase-collection')).toHaveCount(1);
      }
    }
    expect(await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY)).toBe(original);
    await page.setViewportSize({ width: 667, height: 375 });
    await page.screenshot({ path: info.outputPath('library-hall-capacity-eight-landscape-667.png'), animations: 'disabled' });
    const accessible = await page.locator('.sandbox-library-heading button').evaluateAll((buttons) => buttons.map((button) => {
      const rect = button.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }));
    expect(accessible.every((button) => button.width >= 44 && button.height >= 44)).toBe(true);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('[data-library-play-id="stress-toy-7"]').click();
    await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
    await page.locator('[data-action="home"]').click();
    await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '8');
    await expect(page.locator('.library-hall-scene')).toHaveCount(1);
    await page.reload();
    await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '8');
    if (await page.locator('[data-room-manage]').getAttribute('aria-pressed') !== 'true') await page.locator('[data-room-manage]').click();
    await page.locator('[data-library-delete-id="stress-toy-7"]').click();
    await page.locator('[data-library-delete-confirm]').click();
    await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '7');
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});
