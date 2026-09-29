import { expect, test } from '@playwright/test';

const SAVE_KEY = 'squishy.phaser-pages-preview.squishy.save.v3';

test('eight persisted toys page repeatedly without duplicate rooms, leaks or inaccessible controls', async ({ browser }, info) => {
  const context = await browser.newContext({ locale: 'ru-RU', viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await page.goto('/phaser/');
    await page.locator('[data-library-new]').first().click();
    await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
    await page.locator('[data-shape="heart"]').click();
    await page.locator('[data-action="shape-continue"]').click();
    await page.locator('[data-action="paint-continue"]').click();
    await page.locator('[data-action="mixin-continue"]').click();
    const surface = await page.locator('[data-sandbox-canvas]').boundingBox();
    if (!surface) throw new Error('No real maker surface');
    const x = surface.x + surface.width / 2;
    const y = surface.y + surface.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 0; i < 22; i += 1) await page.mouse.move(x + (i % 2 ? -65 : 65), y, { steps: 3 });
    await page.mouse.up();
    await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
    await page.locator('[data-action="mix-continue"]').click();
    await page.locator('[data-action="decor-continue"]').click();
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
    for (let cycle = 0; cycle < 5; cycle += 1) {
      for (let room = 1; room <= 4; room += 1) {
        await expect(page.locator('[data-library-hall-page]')).toHaveText(`${room} / 4`);
        await expect(page.locator('.sandbox-library-card:visible')).toHaveCount(2);
        await expect(page.locator('.library-hall-vacant')).toHaveCount(0);
        await expect(page.locator('.library-hall-scene')).toHaveCount(1);
        await expect(page.locator('.library-hall-nav')).toHaveCount(1);
        if (room < 4) await page.locator('[data-library-hall-next]').click();
      }
      for (let room = 4; room > 1; room -= 1) await page.locator('[data-library-hall-prev]').click();
    }
    await page.setViewportSize({ width: 667, height: 375 });
    await page.screenshot({ path: info.outputPath('library-hall-capacity-eight-landscape-667.png'), animations: 'disabled' });
    const accessible = await page.locator('.library-hall-nav button').evaluateAll((buttons) => buttons.map((button) => {
      const rect = button.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }));
    expect(accessible.every((button) => button.width >= 44 && button.height >= 44)).toBe(true);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('[data-library-hall-next]').click();
    await page.locator('.sandbox-library-card:visible [data-library-play-id]').first().click();
    await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
    await page.locator('[data-action="home"]').click();
    await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '8');
    await expect(page.locator('.library-hall-scene')).toHaveCount(1);
    await page.reload();
    await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '8');
    await page.locator('[data-library-hall-next]').click();
    await page.locator('.sandbox-library-card:visible [data-library-delete-id]').first().click();
    await page.locator('[data-library-delete-confirm]').click();
    await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '7');
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});
