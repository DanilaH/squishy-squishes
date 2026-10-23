import { test, expect } from '@playwright/test';
import { installAndroidBridge } from '../android-bridge';

for (const locale of ['ru-RU', 'en-US']) for (const viewport of [{width:320,height:508},{width:390,height:724},{width:740,height:300}]) {
  test(`Android usable viewport ${locale} ${viewport.width}x${viewport.height}`, async ({browser,baseURL}, info) => {
    const context = await browser.newContext({baseURL,locale,viewport,reducedMotion:'reduce'});
    const page = await context.newPage();
    await installAndroidBridge(page);
    const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
    try {
      await page.goto('/android/');
      await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready','true');
      await expect(page.locator('body')).toHaveAttribute('data-release-platform','android');
      await expect(page.locator('[data-guide-skip]')).toBeVisible();
      const check = async () => {
        expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const save = page.locator('.craft-actions [data-action="save"]');
        if (await save.isVisible()) {
          const box = (await save.boundingBox())!;
          expect(box.y+box.height).toBeLessThanOrEqual(viewport.height+1);
          expect(box.height).toBeGreaterThanOrEqual(44);
          expect(await save.evaluate(node => { const b=node.getBoundingClientRect(); return document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)?.closest('button')===node; })).toBe(true);
        }
      };
      await check();
      await page.locator('[data-guide-skip]').click();
      for (const section of ['paint','mixins','decor','shape']) {
        await page.locator(`[data-craft-section="${section}"]`).click(); await check();
      }
      await page.locator('[data-shape="heart"]').click();
      await page.screenshot({path:info.outputPath('craft-with-banner-reservation.png')});
      await page.evaluate(() => (window as any).__nativeEvent('backButton', {}));
      await expect(page.locator('[data-action="exit-cancel"]')).toBeVisible();
      await page.evaluate(() => (window as any).__nativeEvent('backButton', {}));
      await expect(page.locator('[data-action="exit-cancel"]')).not.toBeVisible();
      await page.locator('.craft-actions [data-action="save"]').click();
      await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-save-complete','true');
      await page.locator('[data-action="home"]').click();
      await expect(page.locator('[data-sandbox-library]')).toBeVisible();
      await page.screenshot({path:info.outputPath('room-with-banner-reservation.png')});
      await page.locator('.room-edit-open').click();
      await expect(page.locator('[data-room-edit-cancel]')).toBeVisible();
      await page.evaluate(() => (window as any).__nativeEvent('backButton', {}));
      await expect(page.locator('[data-room-edit-cancel]')).not.toBeVisible();
      await page.locator('[data-room-collection]').click();
      await expect(page.locator('[data-room-back]')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
      await page.evaluate(() => (window as any).__nativeEvent('backButton', {}));
      await expect(page.locator('[data-room-collection]')).toBeVisible();
      await page.reload();
      await expect(page.locator('[data-sandbox-library]')).toBeVisible();
      expect(errors).toEqual([]);
    } finally { await context.close(); }
  });
}


test('native receipt recovers after acknowledgement failure without another ad', async ({page}) => {
  await installAndroidBridge(page);
  await page.goto('/android/');
  await expect(page.locator('[data-phaser-ready=true]')).toBeVisible();
  await page.locator('[data-guide-skip]').click();
  await page.locator('[data-shape="mochi-cat"]').click();
  await page.evaluate(() => { (window as any).__failNativeAck = true; });
  await page.locator('[data-preview-unlock]').click();
  await expect.poll(() => page.evaluate(() => !!localStorage.getItem('test.native.pending'))).toBe(true);
  await page.reload();
  await expect(page.locator('[data-phaser-ready=true]')).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('test.native.pending'))).toBe(null);
  await page.locator('[data-shape="mochi-cat"]').click();
  await expect(page.locator('[data-catalog-preview]')).not.toBeVisible();
  expect(await page.evaluate(() => (window as any).__nativeCalls.filter((call: any) => call.method === 'show').length)).toBe(0);
});
