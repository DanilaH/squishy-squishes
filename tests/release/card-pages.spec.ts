import { expect, test } from '@playwright/test';

for (const locale of ['ru-RU', 'en-US']) {
  for (const viewport of [{ width: 320, height: 568 }, { width: 568, height: 320 }]) {
    test(`all ideas are reachable without scrolling in ${locale} at ${viewport.width}px`, async ({ browser, baseURL }) => {
      const context = await browser.newContext({ baseURL, locale, viewport });
      const page = await context.newPage();
      try {
        await page.goto('/squishy-squishes/');
        await page.locator('[data-library-ideas]').click();
        const shell = page.locator('[data-sandbox-ideas]');
        await page.screenshot({ path: test.info().outputPath('ideas-page1.png'), animations: 'disabled' });
        const reached = new Set<string>();
        for (let index = 0; index < 6; index += 1) {
          await expect(shell.locator('[data-card-page-counter]')).toHaveText(`${index + 1} / 6`);
          const cards = shell.locator('[data-idea-id]:visible');
          await expect(cards).toHaveCount(4);
          for (const card of await cards.all()) {
            reached.add((await card.getAttribute('data-idea-id'))!);
            const rect = await card.boundingBox();
            expect(rect!.x).toBeGreaterThanOrEqual(0);
            expect(rect!.y + rect!.height).toBeLessThanOrEqual(viewport.height);
          }
          expect(await shell.evaluate((element) => element.scrollHeight <= element.clientHeight && element.scrollWidth <= element.clientWidth)).toBe(true);
          if (index < 5) await shell.locator('[data-card-page-step="1"]').click();
        }
        expect(reached.size).toBe(24);
        await expect(shell.locator('[data-card-page-step="1"]')).toBeDisabled();
        await shell.locator('[data-idea-id]:visible').first().click();
        await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'shape');
      } finally { await context.close(); }
    });
  }
}

for (const viewport of [{ width: 320, height: 568 }, { width: 568, height: 320 }]) {
  test(`replacement pages stay in the viewport and preserve other saves at ${viewport.width}px`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize(viewport);
    await page.addInitScript(() => {
      localStorage.setItem('squishy.save.v3', JSON.stringify({
        version: 3, libraryCapacity: 8, completedRecipeIds: [], unlockedRewardIds: [], totalCrafts: 8, updatedAt: 1,
        library: Array.from({ length: 8 }, (_, index) => ({
          id: `slot-${index}`, createdAt: 1, shapeId: 'soft-square', materialId: 'soft',
          appearance: { v: 1, strokes: [], mixins: [] }, decor: { v: 1 },
        })),
      }));
    });
    await page.goto('/squishy-squishes/');
    await page.screenshot({ path: test.info().outputPath('full-library.png'), animations: 'disabled' });
    await page.locator('[data-library-new]').first().click();
    await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
    for (const stage of ['shape', 'paint', 'mixin']) await page.locator(`[data-action="${stage}-continue"]`).click();
    const rect = await page.locator('[data-sandbox-canvas]').boundingBox();
    if (!rect) throw new Error('Missing canvas');
    const x = rect.x + rect.width / 2;
    const y = rect.y + rect.height / 2;
    await page.mouse.move(x, y); await page.mouse.down();
    for (let n = 0; n < 34; n += 1) await page.mouse.move(x + (n % 2 ? -55 : 55), y, { steps: 2 });
    await page.mouse.up();
    await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
    await page.locator('[data-action="mix-continue"]').click();
    await page.locator('[data-action="decor-continue"]').click();
    const original = await page.evaluate(() => localStorage.getItem('squishy.save.v3'));
    await page.locator('[data-action="save"]').click();
    const sheet = page.locator('[data-library-replace-overlay] [role="dialog"]');
    await expect(sheet.locator('[data-library-replace-id]:visible')).toHaveCount(4);
    await sheet.locator('[data-card-page-step="1"]').click();
    expect(await page.evaluate(() => localStorage.getItem('squishy.save.v3'))).toBe(original);
    expect(await sheet.evaluate((element) => element.scrollHeight <= element.clientHeight)).toBe(true);
    await page.screenshot({ path: test.info().outputPath('replacement-page2.png'), animations: 'disabled' });
    const box = await sheet.boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
    await page.locator('[data-library-replace-id="slot-7"]').click();
    await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
    const ids = await page.evaluate(() => JSON.parse(localStorage.getItem('squishy.save.v3')!).library.map((toy: { id: string }) => toy.id));
    expect(ids).toHaveLength(8);
    expect(ids.slice(0, 7)).toEqual(Array.from({ length: 7 }, (_, index) => `slot-${index}`));
    expect(ids[7]).not.toBe('slot-7');
  });
}
