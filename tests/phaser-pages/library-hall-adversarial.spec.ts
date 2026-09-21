import { writeFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

const SAVE_KEY = 'squishy.phaser-pages-preview.squishy.save.v3';

const makeDecoratedPearl = async (page: Page): Promise<void> => {
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  await page.locator('[data-shape="heart"]').click();
  await page.locator('[data-action="shape-continue"]').click();
  await page.locator('[data-paint-color]').nth(2).click();
  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('No real paint surface');
  await page.mouse.move(box.x + box.width * 0.46, box.y + box.height * 0.49);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.54, box.y + box.height * 0.49, { steps: 10 });
  await page.mouse.up();
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();
  const mix = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!mix) throw new Error('No real mix surface');
  const x = mix.x + mix.width / 2;
  const y = mix.y + mix.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 0; i < 22; i += 1) await page.mouse.move(x + (i % 2 ? -65 : 65), y, { steps: 3 });
  await page.mouse.up();
  await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
  await page.locator('[data-action="mix-continue"]').click();
  await page.locator('[data-decor-eyes="dot"]').click();
  await page.locator('[data-decor-mouth="smile"]').click();
  await page.locator('[data-decor-section="accessory"]').click();
  await page.locator('[data-decor-accessory="bow"]').click();
  await page.locator('[data-action="decor-continue"]').click();
  await page.locator('[data-material="pearl"]').click();
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), SAVE_KEY);
  expect(saved?.version).toBe(3);
  expect(saved?.library).toHaveLength(1);
  expect(saved.library[0].materialId).toBe('pearl');
  expect(saved.library[0].appearance.strokes.length).toBeGreaterThan(0);
  // Persisted V3 uses compact decor keys; the in-memory object is decoded.
  expect(saved.library[0].decor).toMatchObject({ e: 'dot', m: 'smile', a: 'bow' });
};

test('Russian and English Hall expose the actual document and navigation language', async ({ browser }) => {
  for (const [locale, expected] of [['ru-RU', 'Переключение залов'], ['en-US', 'Collection rooms']] as const) {
    const context = await browser.newContext({ locale, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    try {
      await page.goto('/phaser/');
      await expect(page.locator('[data-sandbox-library]')).toHaveClass(/is-library-hall/);
      await expect(page.locator('html')).toHaveAttribute('lang', locale.slice(0, 2));
      await expect(page.locator('.library-hall-nav')).toHaveAttribute('aria-label', expected);
    } finally {
      await context.close();
    }
  }
});

test('a real painted, faced and accessorized pearl survives Library and V3 reload', async ({ browser }, info) => {
  const context = await browser.newContext({ locale: 'ru-RU', viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await page.goto('/phaser/');
    await makeDecoratedPearl(page);
    await page.locator('[data-sandbox-canvas]').screenshot({ path: info.outputPath('library-hall-audit-studio-decor-pearl-390.png') });
    await page.locator('[data-action="home"]').click();
    await expect(page.locator('[data-sandbox-library]')).toHaveClass(/is-library-hall/);
    await page.screenshot({ path: info.outputPath('library-hall-audit-decor-pearl-room-390.png') });
    const thumbnail = await page.locator('[data-library-thumbnail]').first().evaluate((node) => (node as HTMLCanvasElement).toDataURL('image/png').split(',')[1]);
    await writeFile(info.outputPath('library-hall-audit-decor-pearl-native-256.png'), Buffer.from(thumbnail, 'base64'));
    const before = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
    await page.reload();
    await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '1');
    expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBe(before);
    await page.locator('.sandbox-library-card:visible [data-library-play-id]').click();
    await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
    await page.locator('[data-sandbox-canvas]').screenshot({ path: info.outputPath('library-hall-audit-reopened-decor-pearl-390.png') });
  } finally {
    await context.close();
  }
});

test('mobile Hall controls provide 44px touch targets and readable labels', async ({ browser }, info) => {
  const context = await browser.newContext({ locale: 'ru-RU', viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await page.goto('/phaser/');
    await makeDecoratedPearl(page);
    await page.locator('[data-action="home"]').click();
    for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 700 }, { width: 667, height: 375 }]) {
      await page.setViewportSize(viewport);
      const controls = await page.locator('[data-sandbox-library]').evaluate((shell) => {
        const selectors = '[data-library-mute], [data-library-new], [data-library-ideas], .sandbox-library-card:not([hidden]) [data-library-delete-id], .library-hall-nav button:not(:disabled)';
        return [...shell.querySelectorAll<HTMLButtonElement>(selectors)].filter((node) => getComputedStyle(node).display !== 'none').map((node) => {
          const rect = node.getBoundingClientRect();
          return { control: node.getAttribute('data-library-delete-id') ? 'delete' : node.outerHTML.slice(0, 80), width: rect.width, height: rect.height };
        });
      });
      await writeFile(info.outputPath(`library-hall-audit-targets-${viewport.width}.json`), JSON.stringify({ viewport, controls }, null, 2));
      expect(controls.filter((item) => item.width < 43.5 || item.height < 43.5), `undersized controls at ${viewport.width}px`).toEqual([]);
      const footerFont = await page.locator('.sandbox-library-card:visible .sandbox-library-card__footer strong').first().evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize));
      expect(footerFont, `tiny saved-toy label at ${viewport.width}px`).toBeGreaterThanOrEqual(12);
    }
  } finally {
    await context.close();
  }
});
