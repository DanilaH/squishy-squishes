import { expect, test } from '@playwright/test';

test('Pages preview without WebGL2 keeps Library usable and preserves existing saves', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
        if (type === 'webgl2') return null;
        return Reflect.apply(original, this, [type, ...args]);
      },
    });
  });
  await page.goto('/phaser/');
  const library = page.locator('[data-sandbox-library]');
  await expect(library).toBeVisible();
  await page.evaluate(() => localStorage.setItem('squishy.save.v3', 'original-player-save'));
  await page.locator('[data-library-new]').first().click();
  const warning = page.locator('[data-phaser-unsupported]');
  await expect(warning).toBeVisible();
  await expect(warning).toContainText('WebGL2');
  await expect(library).toBeVisible();
  await expect(page.locator('[data-sandbox-maker-host]')).toHaveCount(0);
  await page.locator('[data-phaser-unsupported-close]').click();
  await expect(warning).toHaveCount(0);
  await page.locator('[data-library-ideas]').click();
  await expect(page.locator('[data-sandbox-ideas]')).toBeVisible();
  await page.locator('[data-idea-id]').first().click();
  await expect(warning).toBeVisible();
  await expect(page.locator('[data-sandbox-maker-host]')).toHaveCount(0);
  await page.locator('[data-phaser-unsupported-close]').click();
  await page.locator('[data-ideas-back]').click();
  await expect(library).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('squishy.save.v3'))).toBe('original-player-save');
  expect(errors).toEqual([]);
});
