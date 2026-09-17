import { expect, test, type Page, type TestInfo } from '@playwright/test';

const layouts = [
  { name: 'ru-320', locale: 'ru-RU', width: 320, height: 700 },
  { name: 'ru-390', locale: 'ru-RU', width: 390, height: 844 },
  { name: 'ru-landscape', locale: 'ru-RU', width: 844, height: 390 },
  { name: 'en-desktop', locale: 'en-US', width: 1280, height: 800 },
] as const;

/** Inspect the actual hit targets and captions, not deliberate SVG silhouette overflow. */
const checkControls = async (page: Page, label: string): Promise<void> => {
  const issues = await page.locator(
    '.sandbox-controls button:visible, .sandbox-topbar button:visible, '
    + '.sandbox-library-heading__actions button:visible, .sandbox-library-empty button:visible, '
    + '.sandbox-ideas-heading button:visible, .sandbox-library-modal button:visible',
  ).evaluateAll((elements) => elements.flatMap((element) => {
    if (!(element instanceof HTMLButtonElement)) return [];
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    const errors: string[] = [];
    const id = element.dataset.action || element.dataset.decorSection || element.textContent?.trim() || element.className;
    if (rect.left < -1 || rect.right > innerWidth + 1 || rect.top < -1 || rect.bottom > innerHeight + 1) {
      errors.push(`${id}: outside viewport ${Math.round(rect.left)},${Math.round(rect.top)} ${Math.round(rect.width)}x${Math.round(rect.height)}`);
    }
    // Shape SVG polygons intentionally extend outside their SVG viewBox, so
    // button.scrollWidth is *not* a measure of its caption's readability.
    const caption = element.matches('.sandbox-shape') ? element.lastElementChild : element;
    if (caption && caption.scrollWidth > caption.clientWidth + 2) errors.push(`${id}: caption overflows horizontally`);
    if (caption && caption.scrollHeight > caption.clientHeight + 2) errors.push(`${id}: caption overflows vertically`);
    if (!hit || !element.contains(hit)) errors.push(`${id}: hit target intercepted by ${hit?.tagName ?? 'nothing'}`);
    return errors;
  }));
  expect(issues, `${label}: button text and click targets`).toEqual([]);
  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(pageWidth, `${label}: horizontal document overflow`).toBeLessThanOrEqual(page.viewportSize()!.width + 2);
};

const capture = async (page: Page, testInfo: TestInfo, prefix: string, stage: string): Promise<void> => {
  await checkControls(page, `${prefix}/${stage}`);
  await page.screenshot({ path: testInfo.outputPath(`candy-audit-${prefix}-${stage}.png`), animations: 'disabled' });
};

for (const layout of layouts) {
  test(`Jelly UI full-flow visual and localized control audit: ${layout.name}`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      locale: layout.locale,
      viewport: { width: layout.width, height: layout.height },
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    try {
      await page.goto('/phaser/');
      await expect(page.locator('#app')).toHaveAttribute('data-jelly-ui-ready', '');
      await expect(page.locator('[data-sandbox-library]')).toBeVisible();
      await capture(page, testInfo, layout.name, 'library-empty');

      await page.locator('[data-library-ideas]').click();
      await expect(page.locator('[data-sandbox-ideas]')).toBeVisible();
      await capture(page, testInfo, layout.name, 'ideas');
      await page.locator('[data-ideas-back]').click();
      await expect(page.locator('[data-sandbox-library]')).toBeVisible();

      await page.locator('[data-library-new]').first().click();
      const shell = page.locator('[data-sandbox-app]');
      await expect(shell).toHaveAttribute('data-stage', 'shape');
      await capture(page, testInfo, layout.name, 'shape');
      await page.locator('button[data-shape="heart"]').click();
      await page.locator('[data-action="shape-continue"]').click();
      await expect(shell).toHaveAttribute('data-stage', 'paint');
      await capture(page, testInfo, layout.name, 'paint');

      await page.locator('[data-action="paint-continue"]').click();
      await expect(shell).toHaveAttribute('data-stage', 'mixins');
      await capture(page, testInfo, layout.name, 'mixins');
      await page.locator('[data-action="mixin-continue"]').click();
      await expect(shell).toHaveAttribute('data-stage', 'mix');
      await capture(page, testInfo, layout.name, 'mix');

      const canvas = page.locator('[data-sandbox-canvas]');
      const box = await canvas.boundingBox();
      if (!box) throw new Error('Phaser canvas missing at Mix');
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      for (let n = 0; n < 22; n += 1) {
        await page.mouse.move(x + (n % 2 ? -65 : 65), y, { steps: 3 });
      }
      await page.mouse.up();
      await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
      await page.locator('[data-action="mix-continue"]').click();
      await expect(shell).toHaveAttribute('data-stage', 'decor');
      await capture(page, testInfo, layout.name, 'decor-face');
      await page.locator('[data-decor-section="stickers"]').click();
      await capture(page, testInfo, layout.name, 'decor-stickers');
      await page.locator('[data-decor-section="accessory"]').click();
      await capture(page, testInfo, layout.name, 'decor-accessory');
      await page.locator('[data-action="decor-continue"]').click();
      await expect(shell).toHaveAttribute('data-stage', 'finish');

      // The longest English/Russian material label exposed the original overlap.
      const marshmallow = page.locator('button[data-material="marshmallow"]');
      await marshmallow.click();
      await expect(marshmallow).toHaveAttribute('aria-pressed', 'true');
      const materialIssues = await page.locator('.sandbox-material:visible').evaluateAll((cards) => cards.flatMap((card) => {
        const caption = card.lastElementChild;
        return caption && caption.scrollWidth > caption.clientWidth + 2 ? [caption.textContent || 'material caption'] : [];
      }));
      expect(materialIssues, `${layout.name}/finish: material captions`).toEqual([]);
      await capture(page, testInfo, layout.name, 'finish');
      await page.locator('[data-action="save"]').click();
      await expect(shell).toHaveAttribute('data-stage', 'squeeze');
      await capture(page, testInfo, layout.name, 'squeeze');
      await page.locator('[data-action="home"]').click();
      await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '1');
      await capture(page, testInfo, layout.name, 'library-saved');
      await page.locator('[data-library-delete-id]').first().click();
      await expect(page.locator('[data-library-delete-overlay]')).toBeVisible();
      await capture(page, testInfo, layout.name, 'delete-dialog');
      await page.locator('[data-library-delete-cancel]').click();
      await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '1');
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
