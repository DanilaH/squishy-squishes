import { test, expect, type Page } from '@playwright/test';
import { installAndroidBridge } from '../android-bridge';

const events = (page: Page, name: string) => page.evaluate(name =>
  (window as any).__nativeCalls.filter((c: any) => c.method === 'report' && c.data.name === name).map((c: any) => c.data.data), name);

async function checkLanguage(page: Page, ru: boolean) {
  const texts = await page.locator('#app').evaluate(root => [...root.querySelectorAll<HTMLElement>('button, label, h1, h2, strong, small, p, [role="status"], [aria-label], option')]
    .filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden')
    .flatMap(el => [el.textContent?.trim() ?? '', el.getAttribute('aria-label') ?? '', el.getAttribute('title') ?? ''])
    .filter(Boolean));
  expect(texts.filter(text => ru ? /[a-z]{3}/i.test(text) : /[а-яё]/i.test(text))).toEqual([]);
  expect(texts.filter(text => /undefined|\[object Object\]|\{\w+\}/.test(text))).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
}

for (const locale of ['ru-RU', 'en-US']) test(`localized catalogs, dialogs and ads ${locale}`, async ({ browser, baseURL }, info) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ baseURL, locale, viewport: { width: 390, height: 724 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const ru = locale.startsWith('ru');
  await installAndroidBridge(page);
  try {
    await page.goto('/android/');
    await expect(page.locator('[data-phaser-ready=true]')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', ru ? 'ru' : 'en');
    await checkLanguage(page, ru);
    await page.locator('[data-guide-skip]').click();
    for (const tab of ['shape', 'material', 'light']) {
      await page.locator(`[data-base-tab="${tab}"]`).click(); await checkLanguage(page, ru);
    }
    for (const section of ['paint', 'mixins', 'decor']) {
      await page.locator(`[data-craft-section="${section}"]`).click(); await checkLanguage(page, ru);
    }
    for (const tab of ['face', 'stickers', 'accessory', 'objects']) {
      await page.locator(`[data-decor-section="${tab}"]`).click(); await checkLanguage(page, ru);
    }
    await page.locator('[data-craft-section="shape"]').click();
    await page.locator('[data-base-tab="shape"]').click();
    await page.locator('[data-shape="mochi-cat"]').click();
    await expect(page.locator('[data-preview-open]')).toContainText(ru ? 'за рекламу' : 'for an ad');
    await page.evaluate(() => { (window as any).__adUnavailable = true; });
    await page.locator('[data-preview-open]').click();
    await expect(page.locator('[data-catalog-preview]')).toContainText(ru ? 'недоступна' : 'unavailable');
    await checkLanguage(page, ru);
    await page.locator('[data-preview-restore]').click();
    await page.locator('[data-shape="heart"]').click();
    await page.locator('.craft-actions [data-action="save"]').click();
    await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-save-complete', 'true');
    await checkLanguage(page, ru);
    await page.locator('[data-action="home"]').click();
    await page.locator('[data-room-edit-open]').click();
    for (const tab of ['colors', 'decor', 'pedestals']) {
      await page.locator(`[data-room-editor-tab="${tab}"]`).click(); await checkLanguage(page, ru);
    }
    await page.locator('[data-pedestal-locked="true"]').first().click();
    await expect(page.locator('[data-pedestal-unlock]')).toContainText(ru ? 'за рекламу' : 'for an ad');
    await checkLanguage(page, ru);
    await page.screenshot({ path: info.outputPath('localized-pedestal-offer.png') });
    await page.locator('[data-pedestal-restore]').click();
    await page.locator('[data-room-editor-tab="decor"]').click();
    for (const category of ['furniture', 'shelves', 'posters', 'rugs', 'details']) {
      await page.locator('[data-room-category-select]').selectOption(category); await checkLanguage(page, ru);
    }
    await page.locator('[data-room-edit-cancel]').click();
    await page.locator('[data-room-collection]').click();
    await checkLanguage(page, ru);
    await page.locator('[data-library-actions-id]').first().click();
    await checkLanguage(page, ru);
    await page.locator('[data-library-delete-id]').click();
    await checkLanguage(page, ru);
    await page.locator('[data-library-delete-cancel]').click();
    await page.locator('[data-room-back]').click();
    await page.locator('[data-library-ideas]').click();
    await checkLanguage(page, ru);
    await page.screenshot({ path: info.outputPath('localized-ideas.png') });
    const screens = (await events(page, 'screen_view')).map((e: any) => e.screen);
    expect(screens).toEqual(expect.arrayContaining(['shape', 'paint', 'mixins', 'decor', 'squeeze', 'room', 'room_editor', 'collection', 'ideas']));
  } finally { await context.close(); }
});

test('analytics distinguishes previews, durable saves, edits and reward acknowledgement errors', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 724 });
  await installAndroidBridge(page);
  await page.goto('/android/');
  await expect(page.locator('[data-phaser-ready=true]')).toBeVisible();
  expect(await events(page, 'session_ready')).toHaveLength(1);
  expect(await events(page, 'tutorial_start')).toHaveLength(1);
  expect(await events(page, 'craft_start')).toHaveLength(1);
  await page.locator('[data-guide-skip]').click();
  expect(await events(page, 'tutorial_result')).toEqual([{status: 'skipped'}]);
  await page.locator('[data-shape="heart"]').click();
  await page.locator('.craft-actions [data-action="try-on"]').click();
  expect(await events(page, 'craft_save')).toEqual([]);
  await page.locator('[data-action="try-return"]').click();
  await page.evaluate(() => { (window as any).__failCollectionWrite = true; });
  await page.locator('.craft-actions [data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-save-failed', 'true');
  expect(await events(page, 'craft_save')).toEqual([]);
  expect(await events(page, 'collection_write_failed')).toHaveLength(1);
  await page.evaluate(() => { (window as any).__failCollectionWrite = false; });
  await page.locator('.craft-actions [data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-save-complete', 'true');
  expect(await events(page, 'craft_save')).toEqual([expect.objectContaining({shape:'heart', mode:'create', completedCrafts:1, count:1})]);
  const canvas = page.locator('[data-sandbox-canvas]');
  const box = (await canvas.boundingBox())!;
  for (let i=0;i<2;i++) {
    await page.mouse.move(box.x+box.width/2,box.y+box.height/2); await page.mouse.down();
    await page.mouse.move(box.x+box.width/2+35,box.y+box.height/2+25,{steps:12}); await page.mouse.up();
  }
  await expect.poll(() => events(page, 'first_result_squeeze')).toHaveLength(1);
  await page.locator('[data-action="edit-saved"]').click();
  await page.locator('.craft-actions [data-action="save"]').click();
  await expect.poll(() => events(page, 'craft_edit_save')).toHaveLength(1);
  expect(await events(page, 'craft_save')).toHaveLength(1);
  await page.locator('[data-action="home"]').click();
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-phaser-ready=true]')).toBeVisible();
  await page.locator('[data-shape="mochi-cat"]').click();
  await page.evaluate(() => { (window as any).__failNativeAck = true; });
  await page.locator('[data-preview-open]').click();
  await expect.poll(() => events(page, 'reward_result')).toEqual([expect.objectContaining({item:'shape:mochi-cat',outcome:'unknown',status:'storage-or-sdk-error'})]);
  expect((await events(page, 'reward_result'))[0]).not.toHaveProperty('earned');
  await page.reload();
  await expect.poll(() => events(page, 'reward_recovered')).toEqual([expect.objectContaining({item:'shape:mochi-cat'})]);
  const banners = await events(page, 'banner_visibility_result');
  expect(banners.every((b: any) => b.managed === 'native' && !('showing' in b))).toBe(true);
});
