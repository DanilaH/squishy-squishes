import { auditShowcase } from './helpers/showcaseAudit';
import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const sizes = [
  { name: 'phone-320', width: 320, height: 700 },
  { name: 'phone-short-375', width: 375, height: 667 },
  { name: 'phone-360', width: 360, height: 800 },
  { name: 'phone-390', width: 390, height: 844 },
  { name: 'tablet-600', width: 600, height: 800 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1280', width: 1280, height: 800 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
  { name: 'landscape-844', width: 844, height: 390 },
  { name: 'landscape-667', width: 667, height: 375 },
] as const;

async function audit(page: Page, label: string, _saved: boolean): Promise<unknown> {
  return auditShowcase(page,label);
}

async function createRealSavedHeart(page: Page): Promise<void> {
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  await page.locator('[data-shape="heart"]').click();
  await page.locator('[data-craft-section="paint"]').click();
  await page.locator('[data-craft-section="mixins"]').click();
  await page.locator('[data-action="try-on"]').click();
  const b = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!b) throw new Error('Missing real squishy surface');
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  for (let i = 0; i < 22; i += 1) await page.mouse.move(b.x + b.width / 2 + (i % 2 ? -65 : 65), b.y + b.height / 2, { steps: 3 });
  await page.mouse.up();
  await expect(page.locator('[data-action="try-return"]')).toBeEnabled();
  await page.locator('[data-action="try-return"]').click();
  await page.locator('[data-craft-section="decor"]').click();
  await page.locator('[data-craft-section="shape"]').click();
  await page.locator('[data-base-tab="material"]').click();
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  const key = 'squishy.phaser-pages-preview.squishy.save.v3';
  await page.evaluate((storageKey) => {
    const save = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
    if (!save || save.library.length !== 1) throw new Error('Real save missing');
    const toy = save.library[0];
    save.library = [toy, { ...toy, id: 'responsive-real-copy' }];
    localStorage.setItem(storageKey, JSON.stringify(save));
  }, key);
  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '2');
}

test('independent responsive visual geometry: empty room and two real saved toys', async ({ browser }, info) => {
  const context = await browser.newContext({ locale: 'ru-RU', viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await page.goto('/phaser/?roomReview=0');
    for (const size of sizes) {
      await page.setViewportSize({ width: size.width, height: size.height });
      const facts = await audit(page, `${size.name}/empty`, false);
      await writeFile(info.outputPath(`library-hall-geometry-empty-${size.name}.json`), JSON.stringify(facts, null, 2));
      await page.screenshot({ path: info.outputPath(`library-hall-empty-${size.name}.png`), animations: 'disabled' });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await createRealSavedHeart(page);
    for (const size of sizes) {
      await page.setViewportSize({ width: size.width, height: size.height });
      const facts = await audit(page, `${size.name}/saved`, true);
      await writeFile(info.outputPath(`library-hall-geometry-saved-${size.name}.json`), JSON.stringify(facts, null, 2));
      await page.screenshot({ path: info.outputPath(`library-hall-saved-${size.name}.png`), animations: 'disabled' });
    }
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});
