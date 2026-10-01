import { expect, test } from '@playwright/test';

for (const locale of ['ru-RU', 'en-US']) {
  for (const viewport of [{ width: 320, height: 568 }, { width: 844, height: 390 }]) {
    test(`paint tray shares its grid at ${viewport.width}px in ${locale}`, async ({ browser, baseURL }) => {
      const context = await browser.newContext({ viewport, locale, baseURL });
      const page = await context.newPage();
      try {
        await page.goto('/squishy-squishes/');
        await page.locator('[data-library-new]').first().click();
        await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
        await page.locator('[data-action="shape-continue"]').click();
        const tools = await page.locator('.sandbox-paint-tools').boundingBox();
        const actions = await page.locator('[data-panel="paint"] .sandbox-tool-row--actions').boundingBox();
        expect(tools).not.toBeNull();
        expect(actions).not.toBeNull();
        expect(Math.abs(tools!.x - actions!.x)).toBeLessThan(1);
        expect(Math.abs(tools!.width - actions!.width)).toBeLessThan(1);
        for (const button of await page.locator('[data-panel="paint"] .sandbox-tool-row button').all()) {
          const box = await button.boundingBox();
          expect(box).not.toBeNull();
          expect(box!.x).toBeGreaterThanOrEqual(0);
          expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
          expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
          expect(await button.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
        }
      } finally {
        await context.close();
      }
    });
  }
}

test('room atmosphere respects reduced motion and never intercepts input', async ({ page }) => {
  await page.goto('/squishy-squishes/');
  const scene = page.locator('.library-hall-scene');
  await expect(scene).toBeVisible();
  const style = () => scene.evaluate((element) => {
    const css = getComputedStyle(element, '::after');
    return { animation: css.animationName, pointerEvents: css.pointerEvents, display: css.display };
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  expect(await style()).toMatchObject({ animation: 'room-dust-drift', pointerEvents: 'none' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await style()).toMatchObject({ animation: 'none', display: 'none' });
});
