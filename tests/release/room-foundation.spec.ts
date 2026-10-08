import { expect, test } from '@playwright/test';
import { createDefaultSaveV3 } from '../../src/platform/saveV3';
import { createSandboxDraft } from '../../src/sandbox/types';

const library = ['paw', 'heart', 'donut', 'dumpling', 'strawberry', 'mochi-cat', 'cupcake', 'mochi-bunny'].map((shapeId, i) => ({
  ...createSandboxDraft(), shapeId, id: `room-${i}`, createdAt: 1700000000000 + i,
}));

for (const locale of ['en-US', 'ru-RU']) {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) {
    test(`room foundation, catalog return and same maker ${locale} ${viewport.width}`, async ({ browser, baseURL }, info) => {
      const context = await browser.newContext({ baseURL, locale, viewport, hasTouch: true, reducedMotion: 'reduce' });
      const page = await context.newPage();
      try {
        await page.goto('/squishy-squishes/');
        await expect(page.locator('[data-room-view]')).toHaveAttribute('data-room-view', 'room');
        await expect(page.locator('[data-room-step="1"]')).toBeDisabled();
        await expect(page.locator('.library-showcase-welcome')).toBeVisible();
        await expect(page.locator('[data-library-table-ready]')).toHaveAttribute('data-library-table-ready', 'true');
        const checkControls = async (): Promise<void> => {
          expect(await page.evaluate(() => [...document.querySelectorAll<HTMLButtonElement>('.room-library button')].filter(button => {
            const box = button.getBoundingClientRect();
            return box.width > 0 && box.height > 0 && getComputedStyle(button).visibility !== 'hidden' && !button.closest('.sandbox-library-grid');
          }).filter(button => {
            const box = button.getBoundingClientRect();
            return box.width < 44 || box.height < 44 || box.left < 0 || box.right > innerWidth || box.top < 0 || box.bottom > innerHeight;
          }).map(button => button.outerHTML))).toEqual([]);
        };
        await checkControls();
        await page.screenshot({ path: info.outputPath(`room-empty-${viewport.width}.png`) });
        await page.evaluate(save => localStorage.setItem('squishy.save.v3', JSON.stringify(save)), { ...createDefaultSaveV3(), library, totalCrafts: 8 });
        await page.reload();
        await expect(page.locator('[data-library-count]')).toHaveAttribute('data-library-count', '8');
        const original = await page.evaluate(() => localStorage.getItem('squishy.save.v3'));
        expect(await page.evaluate(() => performance.getEntriesByType('resource').some(entry => entry.name.includes('PhaserSquishSurface')))).toBe(false);
        await expect(page.locator('[data-library-select-id]')).toHaveAttribute('data-library-select-id', 'room-7');
        await expect(page.locator('[data-library-table-ready]')).toHaveAttribute('data-library-table-ready', 'true');
        const exhibitTable = await page.locator('.library-showcase-table').boundingBox();
        await page.locator('[data-room-step="1"]').click();
        await expect(page.locator('[data-library-select-id]')).toHaveAttribute('data-library-select-id', 'room-0');
        await page.locator('[data-room-step="-1"]').click();
        await expect(page.locator('[data-library-select-id]')).toHaveAttribute('data-library-select-id', 'room-7');
        await page.screenshot({ path: info.outputPath(`room-exhibit-${viewport.width}.png`) });
        await page.locator('[data-room-collection]').click();
        await expect(page.locator('[data-room-view]')).toHaveAttribute('data-room-view', 'collection');
        await expect(page.locator('.room-library')).toHaveClass(/is-library-hall/);
        await checkControls();
        await expect(page.locator('[data-library-delete-id]').first()).not.toBeVisible();
        const grid = page.locator('.sandbox-library-grid');
        await grid.evaluate(el => { el.scrollTop = el.scrollHeight; });
        const returnId = 'room-7';
        // Browser focus / Playwright's scroll-into-view may move a partly
        // visible card before click. Preserve the actual departure position.
        await page.locator(`[data-library-play-id="${returnId}"]`).evaluate(button => {
          button.addEventListener('click', () => {
            document.body.dataset.roomDepartureScroll = String(document.querySelector('.sandbox-library-grid')!.scrollTop);
          }, { capture: true, once: true });
        });
        await page.locator(`[data-library-play-id="${returnId}"]`).click();
        const scroll = await page.evaluate(() => Number(document.body.dataset.roomDepartureScroll));
        await expect(page.locator('[data-phaser-ready]')).toHaveAttribute('data-phaser-ready', 'true');
        await expect(page.locator('[data-room-view]')).toHaveAttribute('data-room-view', 'squeeze');
        await expect(page.locator('[data-library-table-ready]')).toHaveAttribute('data-library-table-ready', 'true');
        expect(await page.locator('.library-showcase-table').boundingBox()).toEqual(exhibitTable);
        await checkControls();
        const canvas = page.locator('[data-sandbox-canvas]');
        const box = (await canvas.boundingBox())!;
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 35, box.y + box.height / 2 - 15, { steps: 6 });
        await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-squish-active', 'true');
        await page.mouse.up();
        await page.screenshot({ path: info.outputPath(`room-squeeze-${viewport.width}.png`) });
        await page.locator('[data-action="home"]').click();
        await expect(page.locator('[data-room-view]')).toHaveAttribute('data-room-view', 'collection');
        await expect(page.locator('.room-library')).toHaveClass(/is-library-hall/);
        expect(await grid.evaluate(el => el.scrollTop)).toBe(scroll);
        await expect(page.locator(`[data-library-play-id="${returnId}"]`)).toBeFocused();
        expect(await page.evaluate(() => localStorage.getItem('squishy.save.v3'))).toBe(original);
        await page.locator('[data-room-manage]').click();
        await page.locator(`[data-library-delete-id="${returnId}"]`).click();
        await expect(page.locator('[data-library-delete-overlay]')).toBeVisible();
        await page.locator('[data-library-delete-cancel]').click();
        expect(await page.evaluate(() => localStorage.getItem('squishy.save.v3'))).toBe(original);
        await page.screenshot({ path: info.outputPath(`room-collection-${viewport.width}.png`) });
        expect(await page.evaluate(() => [document.documentElement.scrollWidth > innerWidth, document.documentElement.scrollHeight > innerHeight])).toEqual([false, false]);
        await page.locator('[data-room-back]').first().click();
        await expect(page.locator('[data-library-select-id]')).toHaveAttribute('data-library-select-id', returnId);
        await page.locator('[data-library-select-id]').click();
        await expect(page.locator('[data-phaser-ready]')).toHaveAttribute('data-phaser-ready', 'true');
        const table = await page.locator('.library-showcase-table').boundingBox();
        await page.locator('[data-action="edit-saved"]').click();
        await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'decor');
        await expect(page.locator('[data-library-live]')).toHaveCount(0);
        await page.locator('[data-action="exit-craft"]').click();
        await expect(page.locator('[data-exit-overlay]')).toHaveCount(0); // Unchanged saved draft exits directly.
        await expect(page.locator('[data-room-view]')).toHaveAttribute('data-room-view', 'room');
        await expect(page.locator('[data-library-table-ready]')).toHaveAttribute('data-library-table-ready', 'true');
        expect(await page.locator('.library-showcase-table').boundingBox()).toEqual(table);
        expect(await page.evaluate(() => localStorage.getItem('squishy.save.v3'))).toBe(original);
      } finally { await context.close(); }
    });
  }
}
