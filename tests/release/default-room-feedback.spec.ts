import { expect, test } from '@playwright/test';
import { createDefaultSaveV3 } from '../../src/platform/saveV3';
import { createSandboxDraft } from '../../src/sandbox/types';
import { createStickerPlacement } from '../../src/sandbox/decor';

for (const locale of ['ru-RU', 'en-US']) for (const viewport of [
  { width: 320, height: 568 }, { width: 568, height: 320 }, { width: 1103, height: 922 },
]) test(`default room and selected sticker feedback ${locale} ${viewport.width}`, async ({ browser, baseURL }, info) => {
  const context = await browser.newContext({ baseURL, locale, viewport, reducedMotion: 'reduce' });
  const page = await context.newPage();
  try {
    await page.goto('/squishy-squishes/');
    await expect(page.locator('[data-room-view]')).toHaveAttribute('data-room-view', 'room');
    const draft = createSandboxDraft();
    const toy = { ...draft, id: 'sticker-feedback', createdAt: 1700000000000,
      decor: { ...draft.decor, accessory: null, stickers: Array.from({ length: 13 }, (_, i) =>
        createStickerPlacement(i === 11 ? 'flower' : 'heart', { u: .35 + i % 4 * .1, v: .35 + Math.floor(i / 4) * .1 }, i)) } };
    await page.evaluate(save => localStorage.setItem('squishy.save.v3', JSON.stringify(save)), { ...createDefaultSaveV3(), library: [toy], totalCrafts: 1 });
    await page.reload();
    await page.locator('[data-library-select-id]').click();
    await page.locator('[data-action="edit-saved"]').click();
    await page.locator('[data-decor-section="objects"]').click();
    const selected = page.locator('[data-object="sticker:11"]');
    await expect(selected).toHaveText(locale === 'ru-RU' ? 'Цветок · 12' : 'Flower · 12');
    await selected.click();
    const frame = page.locator('[data-sticker-selection="11"]');
    await expect(frame).toBeVisible();
    expect(await frame.evaluate(node => getComputedStyle(node).pointerEvents)).toBe('none');
    const before = await frame.boundingBox();
    await page.locator('[data-object-control="scale"]').fill('2');
    await expect.poll(async () => (await frame.boundingBox())!.width).toBeGreaterThan(before!.width);
    await page.locator('[data-object-control="rotation"]').fill('60');
    await expect(frame).toHaveCSS('transform', /matrix/);
    const button = (await selected.boundingBox())!;
    await page.mouse.move(button.x + button.width / 2, button.y + button.height / 2);
    await page.mouse.down();
    expect(await page.locator('.free-object-list').evaluate(node => ({ overflow: getComputedStyle(node).overflowY, extra: node.scrollHeight - node.clientHeight }))).toEqual({ overflow: 'hidden', extra: 0 });
    await page.mouse.up();
    await expect(page.locator('[data-action="save"]')).toHaveCSS('background-image', 'none');
    await expect(page.locator('[data-action="save"]')).toHaveCSS('color', 'rgb(255, 255, 255)');
    await page.screenshot({ path: info.outputPath('selected-flower.png') });
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('[data-action="try-on"]').click();
    await expect(frame).toBeHidden();
    await page.locator('[data-action="try-return"]').click();
    await expect(frame).toBeVisible();
    await page.locator('[data-action="save"]').click();
    await page.locator('[data-action="home"]').click();
    await expect(page.locator('[data-room-view]')).toHaveAttribute('data-room-view', 'room');
    await page.reload();
    await expect(page.locator('[data-library-select-id]')).toHaveAttribute('data-library-select-id', 'sticker-feedback');
  } finally { await context.close(); }
});
