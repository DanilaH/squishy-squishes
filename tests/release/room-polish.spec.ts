import { returningPlayer } from '../returning-player';
import { expect, test } from '@playwright/test';

for (const locale of ['ru-RU', 'en-US']) {
  for (const viewport of [{ width: 320, height: 568 }, { width: 844, height: 390 }, { width: 568, height: 320 }, { width: 667, height: 375 }]) {
    test(`paint tray shares its grid at ${viewport.width}px in ${locale}`, async ({ browser, baseURL }) => {
      const context = await browser.newContext({ viewport, locale, baseURL });
      const page = await context.newPage();
      try {
        await returningPlayer(page);
        await page.goto('/squishy-squishes/');
        await page.locator('[data-library-new]').first().click();
        await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
        await page.locator('[data-craft-section="paint"]').click();
        for (const swatch of await page.locator('.sandbox-swatch').all()) {
          const rect = await swatch.boundingBox();
          expect(rect!.width).toBe(44);
          expect(rect!.height).toBe(44);
        }
        await expect(page.getByRole('button', { name: locale === 'ru-RU' ? 'Бирюзовый' : 'Turquoise', exact: true })).toBeVisible();
        const tools = await page.locator('.sandbox-paint-tools').boundingBox();
        const actions = await page.locator('.craft-actions').boundingBox();
        expect(tools).not.toBeNull();
        expect(actions).not.toBeNull();
        expect(Math.abs(tools!.x + tools!.width/2 - actions!.x - actions!.width/2)).toBeLessThan(1);
        for (const button of await page.locator('[data-panel="paint"] .sandbox-tool-row button:visible, .craft-actions button').all()) {
          const box = await button.boundingBox();
          expect(box).not.toBeNull();
          expect(box!.width).toBeGreaterThanOrEqual(44);
          expect(box!.height).toBeGreaterThanOrEqual(44);
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
  await returningPlayer(page);
  await page.goto('/squishy-squishes/');
  const scene = page.locator('.library-hall-scene');
  await expect(scene).toBeVisible();
  const style = () => scene.evaluate((element) => {
    const css = getComputedStyle(element, '::after');
    return { animation: css.animationName, pointerEvents: css.pointerEvents, display: css.display };
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  expect(await style()).toMatchObject({ animation: 'room-dust-drift', pointerEvents: 'none' });
  const plant = page.locator('.library-hall-scene__plant');
  expect(await plant.evaluate(e => getComputedStyle(e).animationName)).toBe('room-plant-sway');
  await page.locator('.is-library-hall').evaluate(e => e.classList.add('is-blocked'));
  expect(await plant.evaluate(e => getComputedStyle(e).animationPlayState)).toBe('paused');
  expect(await scene.evaluate(e => getComputedStyle(e, '::after').animationPlayState)).toBe('paused');
  await page.locator('.is-library-hall').evaluate(e => e.classList.remove('is-blocked'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await plant.evaluate(e => getComputedStyle(e).animationName)).toBe('none');
  expect(await style()).toMatchObject({ animation: 'none', display: 'none' });
});
