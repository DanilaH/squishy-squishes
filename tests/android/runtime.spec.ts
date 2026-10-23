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
      await page.reload();
      await expect(page.locator('[data-sandbox-library]')).toBeVisible();
      expect(errors).toEqual([]);
    } finally { await context.close(); }
  });
}
