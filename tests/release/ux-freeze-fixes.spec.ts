import { expect, test, type Page } from '@playwright/test';
import { createDefaultSaveV3 } from '../../src/platform/saveV3';
import { createSandboxDraft } from '../../src/sandbox/types';
import { createEmptyDecorDocument, STICKER_IDS } from '../../src/sandbox/decor';

const ready = async (page: Page) => expect(page.locator('[data-phaser-ready]')).toHaveAttribute('data-phaser-ready', 'true');
const save = async (page: Page) => {
  await page.locator('.craft-actions [data-action="save"]').click();
  await expect(page.locator('[data-panel="squeeze"]')).toBeVisible();
};
const fillIdea = async (page: Page) => {
  const color = await page.locator('[data-idea-guide] i').getAttribute('style');
  await page.locator('[data-craft-section="paint"]').click();
  await page.locator('[data-paint-tool="fill"]').click();
  await page.locator(`[data-paint-color="${parseInt(color!.match(/#([a-f\d]{6})/i)![1]!, 16)}"]`).click();
  await page.waitForLoadState('networkidle');
  const box = (await page.locator('[data-sandbox-canvas]').boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
};

for (const locale of ['ru-RU', 'en-US']) {
  test.describe(locale, () => {
    test.use({ locale });
    test('a completed Idea never resurfaces after editing or creating another toy', async ({ page }, info) => {
      await page.setViewportSize({ width: 320, height: 568 });
      await page.goto('/squishy-squishes/?roomReview=0');
      await page.locator('[data-library-ideas]').click();
      await page.locator('[data-idea-id="grape-smooth"]').click();
      await ready(page); await fillIdea(page); await save(page);
      await expect(page.locator('[data-idea-complete]')).toBeVisible();
      const bounds = await page.locator('[data-panel="squeeze"] button:visible').evaluateAll(nodes => nodes.map(node => {
        const range = document.createRange(); range.selectNodeContents(node);
        const text = range.getBoundingClientRect(), button = node.getBoundingClientRect();
        return text.left >= button.left && text.right <= button.right && button.width >= 44 && button.height >= 44;
      }));
      expect(bounds).toEqual([true, true, true]);
      await page.screenshot({ path: info.outputPath('saved-actions.png') });
      await page.locator('[data-action="edit-saved"]').click();
      await expect(page.locator('[data-idea-complete], [data-idea-guide]')).toHaveCount(0);
      await save(page); await expect(page.locator('[data-idea-complete]')).toHaveCount(0);
      await page.locator('[data-action="new"]:visible').click();
      await save(page); await expect(page.locator('[data-idea-complete], [data-idea-guide]')).toHaveCount(0);
    });

    test('New after an unfinished Idea starts free creation without hidden credit', async ({ page }) => {
      await page.goto('/squishy-squishes/?roomReview=0'); await page.locator('[data-library-ideas]').click();
      await page.locator('[data-idea-id="grape-smooth"]').click(); await ready(page);
      const color = await page.locator('[data-idea-guide] i').getAttribute('style');
      await save(page); await page.locator('[data-action="new"]:visible').click();
      await expect(page.locator('[data-idea-guide]')).toHaveCount(0);
      await page.locator('[data-craft-section="paint"]').click();
      await page.locator('[data-paint-tool="fill"]').click();
      await page.locator(`[data-paint-color="${parseInt(color!.match(/#([a-f\d]{6})/i)![1]!,16)}"]`).click();
      await page.waitForLoadState('networkidle');
      const box = (await page.locator('[data-sandbox-canvas]').boundingBox())!;
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await save(page);
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem('squishy.save.v3')!).completedRecipeIds)).toEqual([]);
    });

    for (const viewport of [{ width: 320, height: 568 }, { width: 568, height: 320 }, { width: 1440, height: 900 }]) {
      test(`detail caps stay explained and reversible at ${viewport.width}`, async ({ page }, info) => {
        await page.setViewportSize(viewport); await page.goto('/squishy-squishes/?roomReview=0');
        const toy = { ...createSandboxDraft(), id: 'detail-cap', createdAt: 1700000000000,
          decor: { ...createEmptyDecorDocument(), accessories: Array.from({ length: 127 }, () => ({ a: 'bow' as const, x: 72, y: 226, s: 1, r: 0, side: 'whole' as const })),
            stickers: Array.from({ length: 128 }, () => ({ t: 0, x: 128, y: 128, s: 28, r: 0 })) } };
        await page.evaluate(value => localStorage.setItem('squishy.save.v3', JSON.stringify(value)), { ...createDefaultSaveV3(), library: [toy], totalCrafts: 1 });
        await page.reload(); await page.locator('[data-library-play-id="detail-cap"]').click(); await ready(page);
        await page.locator('[data-action="edit-saved"]').click(); await page.locator('[data-decor-section="accessory"]').click();
        await expect(page.locator('[data-decor-accessory="cat-ears"]')).toBeDisabled();
        await expect(page.locator('[data-decor-accessory="bow"]')).toBeEnabled();
        await expect(page.locator('[data-accessory-limit]')).toContainText('127/128');
        await page.locator('[data-decor-accessory="bow"]').click();
        await expect(page.locator('[data-object-action="mirror"]')).toBeDisabled();
        await expect(page.locator('[data-object-action="mirror"]')).toHaveText(locale === 'ru-RU' ? 'Парная копия' : 'Mirror copy');
        await expect(page.locator('[data-object-limit]:visible')).toBeVisible();
        await page.screenshot({ path: info.outputPath('limit-arrange.png') });
        await page.locator('[data-object-action="more"]').click();
        await expect(page.locator('[data-object-action="duplicate"]')).toBeDisabled();
        await expect(page.locator('[data-object-action="reset"]')).toBeEnabled();
        await page.locator('[data-object-action="close-more"]').click();
        await page.locator('[data-object-action="delete"]').click();
        await page.locator('[data-object="accessory:0"]').click();
        await expect(page.locator('[data-object-action="mirror"]')).toBeEnabled();
        await page.locator('.craft-actions [data-action="draft-undo"]').click();
        await expect(page.locator('[data-object-action="mirror"]')).toBeDisabled();
        await page.locator('[data-decor-section="accessory"]').click();
        await expect(page.locator('[data-decor-accessory="bow"]')).toBeDisabled();
        await expect(page.locator('button[data-decor-accessory="none"]:visible')).toBeEnabled();
        await page.screenshot({ path: info.outputPath('limit-catalog.png') });
        await page.locator('[data-decor-section="stickers"]').click();
        await expect(page.locator('[data-decor-sticker]:enabled')).toHaveCount(0);
        await expect(page.locator('.sandbox-decor-tip')).toContainText(locale === 'ru-RU' ? 'Лимит' : 'limit');
        await page.locator('[data-decor-section="objects"]').click();
        await page.locator('[data-object="sticker:0"]').click();
        await expect(page.locator('[data-object-action="mirror"]')).toBeDisabled();
        await page.locator('[data-object-action="delete"]').click();
        await page.locator('[data-decor-section="stickers"]').click();
        await expect(page.locator('[data-decor-sticker]:enabled')).toHaveCount(STICKER_IDS.length);
        expect(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight || document.documentElement.scrollWidth > innerWidth)).toBe(false);
      });
    }
  });
}
