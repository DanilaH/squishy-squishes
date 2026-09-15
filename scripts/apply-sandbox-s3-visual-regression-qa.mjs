import { readFileSync, writeFileSync } from 'node:fs';

const path = 'tests/release/release.spec.ts';
let source = readFileSync(path, 'utf8');
const before = `    await page.locator('[data-decor-section="accessory"]').click();
    await expectInViewport(page, page.locator('[data-decor-accessory="crown"]'));
`;
const after = `    await page.locator('[data-decor-section="accessory"]').click();
    const accessoryPanel = page.locator('[data-decor-panel="accessory"]');
    await expectInViewport(page, page.locator('[data-decor-accessory="crown"]'));
    if (viewport.name === 'short landscape') {
      await expect(accessoryPanel).toContainText('Кошачьи');
      await expect(accessoryPanel).toContainText('Заячьи');
      await expect(accessoryPanel).toContainText('Рожки');
      await expect(accessoryPanel).toContainText('Бант');
      await expect(accessoryPanel).toContainText('Корона');
      for (const internalId of ['cat-ears', 'bunny-ears', 'horns', 'bow', 'crown']) {
        await expect(accessoryPanel).not.toContainText(internalId);
      }
    }
`;
if (!source.includes(before)) throw new Error('S3 viewport QA anchor not found.');
if (source.indexOf(before) !== source.lastIndexOf(before)) throw new Error('S3 viewport QA anchor is ambiguous.');
source = source.replace(before, after);
writeFileSync(path, source);
console.log('Added permanent S3 Decor localization regression coverage.');
