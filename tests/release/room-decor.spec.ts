import { returningPlayer } from '../returning-player';
import { expect, test } from '@playwright/test';
import { createDefaultSaveV3 } from '../../src/platform/saveV3';
import { createSandboxDraft } from '../../src/sandbox/types';

test('room choices persist, cancel rolls back and toy saves stay unchanged', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await returningPlayer(page);
  await page.goto('/squishy-squishes/');
  await page.evaluate(save => localStorage.setItem('squishy.save.v3', JSON.stringify(save)), {
    ...createDefaultSaveV3(), library: [{ ...createSandboxDraft(), id: 'room-decor', shapeId: 'paw', createdAt: 1700000000000 }], totalCrafts: 1,
  });
  await page.reload();
  await expect(page.locator('[data-library-table-ready]')).toHaveAttribute('data-library-table-ready', 'true');
  const toySave = await page.evaluate(() => localStorage.getItem('squishy.save.v3'));
  await page.locator('[data-room-edit-open]').click();
  await page.locator('[data-room-theme="12"]').click();
  await page.locator('[data-room-editor-tab="decor"]').click();
  await page.locator('[data-room-item="dresser"]').click();
  await page.locator('.room-editor-surfaces [data-room-slot="right"]').click();
  await page.locator('[data-room-item="plant"]').click();
  await expect(page.locator('[data-room-prop]')).toHaveCount(2);
  await page.locator('[data-room-edit-done]').click();
  await expect(page.locator('[data-room-editor]')).toBeHidden();
  const savedRoom = await page.evaluate(() => localStorage.getItem('squishy.room.v1'));
  expect(JSON.parse(savedRoom!)).toEqual({ version: 1, palette: 12, items: { left: 'dresser', right: 'plant' } });
  await page.reload();
  await expect(page.locator('[data-room-prop]')).toHaveCount(2);
  await page.locator('[data-room-edit-open]').click();
  await page.locator('[data-room-theme="3"]').click();
  await page.locator('[data-room-editor-tab="decor"]').click();
  await page.locator('[data-room-item=""]').click();
  await expect(page.locator('[data-room-prop]')).toHaveCount(1);
  await page.locator('[data-room-edit-cancel]').click();
  await expect(page.locator('[data-room-prop]')).toHaveCount(2);
  expect(await page.evaluate(() => localStorage.getItem('squishy.room.v1'))).toBe(savedRoom);
  expect(await page.evaluate(() => localStorage.getItem('squishy.save.v3'))).toBe(toySave);
});

test('failed item loading leaves a usable room and retries before selection', async ({ page }) => {
  await page.route('**/assets/room/dresser.webp', route => route.abort());
  await returningPlayer(page);
  await page.goto('/squishy-squishes/');
  await expect(page.locator('[data-library-table-ready]')).toHaveAttribute('data-library-table-ready', 'true');
  await page.locator('[data-room-edit-open]').click();
  await page.locator('[data-room-editor-tab="decor"]').click();
  await expect(page.locator('[data-room-item="dresser"]')).toBeDisabled();
  await expect(page.locator('[data-room-item="plant"]')).toBeEnabled();
  await page.unroute('**/assets/room/dresser.webp');
  await page.locator('[data-room-assets-retry]').click();
  await expect(page.locator('[data-room-item="dresser"]')).toBeEnabled();
  await page.locator('[data-room-item="dresser"]').click();
  await expect(page.locator('[data-room-prop="dresser"]')).toBeVisible();
  await page.locator('[data-room-edit-cancel]').click();
  await expect(page.locator('[data-room-prop]')).toHaveCount(0);
});

test('failed persistence keeps the preview editable and supports retry', async ({ page }) => {
  await returningPlayer(page);
  await page.goto('/squishy-squishes/');
  await page.locator('[data-room-edit-open]').click();
  await page.locator('[data-room-theme="4"]').click();
  await page.evaluate(() => {
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string): void {
      if (key === 'squishy.room.v1' && !document.body.hasAttribute('data-allow-room-write')) throw new Error('Injected quota failure');
      write.call(this, key, value);
    };
  });
  await page.locator('[data-room-edit-done]').click();
  await expect(page.locator('.room-editor-error')).toBeVisible();
  await expect(page.locator('[data-room-edit-cancel]')).toBeEnabled();
  expect(await page.evaluate(() => localStorage.getItem('squishy.room.v1'))).toBeNull();
  await page.evaluate(() => document.body.setAttribute('data-allow-room-write', ''));
  await page.locator('[data-room-edit-done]').click();
  await expect(page.locator('[data-room-editor]')).toBeHidden();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('squishy.room.v1')!).palette)).toBe(4);
});
