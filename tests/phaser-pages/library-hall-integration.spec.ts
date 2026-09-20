import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const views = [
  { name: 'portrait-320', width: 320, height: 700 },
  { name: 'portrait-390', width: 390, height: 844 },
  { name: 'desktop-1280', width: 1280, height: 800 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'landscape-844', width: 844, height: 390 },
] as const;

const verifyHall = async (page: Page, label: string): Promise<void> => {
  await expect(page.locator('[data-sandbox-library]')).toHaveClass(/is-library-hall/);
  await expect(page.locator('[data-library-hall-stage]')).toBeVisible();
  await expect(page.locator('.library-hall-vacant, .sandbox-library-card:visible')).toHaveCount(2);
  const measured = await page.evaluate(() => {
    const shell = document.querySelector<HTMLElement>('[data-sandbox-library]');
    if (!shell) throw new Error('Library shell missing');
    const scene = shell.querySelector<HTMLElement>('.library-hall-scene');
    const nav = shell.querySelector<HTMLElement>('.library-hall-nav');
    const stands = [...shell.querySelectorAll<HTMLElement>('.sandbox-library-card:not([hidden]), .library-hall-vacant')];
    if (!scene || !nav || stands.length !== 2) throw new Error('Hall art/navigation missing');
    const interactive = [...shell.querySelectorAll<HTMLButtonElement>('.sandbox-library-topbar button, .sandbox-library-heading button, .library-hall-nav button, .sandbox-library-card:not([hidden]) button')];
    const rect = (el: Element) => el.getBoundingClientRect().toJSON();
    return {
      viewport: { width: innerWidth, height: innerHeight },
      shell: rect(shell), stage: rect(shell.querySelector('.library-hall-stage')!),
      stands: stands.map(rect), nav: rect(nav),
      scrollHeight: document.documentElement.scrollHeight,
      scrollWidth: document.documentElement.scrollWidth,
      scenePassive: getComputedStyle(scene).pointerEvents === 'none',
      image: getComputedStyle(scene.querySelector('.library-hall-scene__wall')!).backgroundImage,
      unclickable: interactive.filter((button) => {
        const b = button.getBoundingClientRect();
        if (!b.width || !b.height) return true;
        const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        return !hit || !button.contains(hit);
      }).map((button) => button.outerHTML.slice(0, 100)),
    };
  });
  expect(measured.scenePassive, `${label}: room cannot intercept input`).toBe(true);
  expect(measured.image, `${label}: emitted WebP art URL is live`).toContain('wall');
  expect(measured.unclickable, `${label}: real DOM controls must accept taps`).toEqual([]);
  expect(measured.scrollWidth, `${label}: no horizontal scroll`).toBeLessThanOrEqual(measured.viewport.width + 2);
  expect(measured.scrollHeight, `${label}: no vertical scroll`).toBeLessThanOrEqual(measured.viewport.height + 2);
  expect(measured.stands.every((s) => s.width >= 70 && s.height >= 100), `${label}: two usable full stands`).toBe(true);
  expect(measured.stands.every((s) => s.top >= 0 && s.bottom <= measured.viewport.height + 2), `${label}: no cropped stands`).toBe(true);
  expect(measured.nav.bottom, `${label}: page navigation stays inside viewport`).toBeLessThanOrEqual(measured.viewport.height + 2);
};

for (const view of views) {
  test(`Library Hall real empty screen ${view.name}`, async ({ browser }, info) => {
    const context = await browser.newContext({ locale: 'ru-RU', viewport: { width: view.width, height: view.height } });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    try {
      await page.goto('/phaser/');
      await verifyHall(page, view.name);
      await expect(page.locator('[data-library-hall-page]')).toHaveText('1 / 1');
      await expect(page.locator('[data-library-hall-prev]')).toBeDisabled();
      await expect(page.locator('[data-library-hall-next]')).toBeDisabled();
      await page.screenshot({ path: info.outputPath(`library-hall-empty-${view.name}.png`), animations: 'disabled' });
      await writeFile(info.outputPath(`library-hall-empty-${view.name}.json`), JSON.stringify({ viewport: view, stage: await page.locator('[data-library-hall-stage]').boundingBox() }, null, 2));
      await page.locator('[data-library-new]').first().click();
      await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'shape');
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

test('real saved toys paginate two at a time; play and delete stay interactive', async ({ browser }, info) => {
  const context = await browser.newContext({ locale: 'ru-RU', viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await page.goto('/phaser/');
    await expect(page.locator('[data-sandbox-library]')).toHaveClass(/is-library-hall/);
    await page.locator('[data-library-new]').first().click();
    await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
    await page.locator('[data-shape="heart"]').click();
    await page.locator('[data-action="shape-continue"]').click();
    await page.locator('[data-action="paint-continue"]').click();
    await page.locator('[data-action="mixin-continue"]').click();
    const canvas = await page.locator('[data-sandbox-canvas]').boundingBox();
    if (!canvas) throw new Error('Missing real squishy');
    const x = canvas.x + canvas.width / 2;
    const y = canvas.y + canvas.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 0; i < 22; i += 1) await page.mouse.move(x + (i % 2 ? -65 : 65), y, { steps: 3 });
    await page.mouse.up();
    await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
    await page.locator('[data-action="mix-continue"]').click();
    await page.locator('[data-action="decor-continue"]').click();
    await page.locator('[data-action="save"]').click();
    await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
    const saveKey = 'squishy.phaser-pages-preview.squishy.save.v3';
    await page.evaluate((key) => {
      const saved = JSON.parse(localStorage.getItem(key) ?? 'null');
      if (!saved || saved.library.length !== 1) throw new Error('Real save fixture missing');
      const sample = saved.library[0];
      saved.library = [sample, { ...sample, id: 'hall-fixture-second' }, { ...sample, id: 'hall-fixture-third' }];
      localStorage.setItem(key, JSON.stringify(saved));
    }, saveKey);
    await page.reload();
    await verifyHall(page, 'saved-390');
    await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '3');
    await expect(page.locator('[data-library-hall-page]')).toHaveText('1 / 2');
    await expect(page.locator('.sandbox-library-card:visible')).toHaveCount(2);
    await page.screenshot({ path: info.outputPath('library-hall-saved-page-1-390.png'), animations: 'disabled' });
    await page.locator('[data-library-hall-next]').click();
    await expect(page.locator('[data-library-hall-page]')).toHaveText('2 / 2');
    await expect(page.locator('.sandbox-library-card:visible')).toHaveCount(1);
    await expect(page.locator('.library-hall-vacant')).toHaveCount(1);
    await page.screenshot({ path: info.outputPath('library-hall-saved-page-2-390.png'), animations: 'disabled' });
    await page.locator('.sandbox-library-card:visible [data-library-play-id]').click();
    await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
    await page.reload();
    await expect(page.locator('[data-sandbox-library]')).toHaveClass(/is-library-hall/);
    await page.locator('[data-library-hall-next]').click();
    await page.locator('.sandbox-library-card:visible [data-library-delete-id]').click();
    await expect(page.locator('[data-library-delete-overlay]')).toBeVisible();
    await page.locator('[data-library-delete-confirm]').click();
    await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '2');
    await expect(page.locator('[data-library-hall-page]')).toHaveText('1 / 1');
  } finally {
    await context.close();
  }
});

test('one missing Library WebP preserves the original playable grid', async ({ page }) => {
  await page.route(/wall[^/]*\.webp(?:\?.*)?$/, (route) => route.abort());
  await page.goto('/phaser/');
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
  await expect(page.locator('[data-sandbox-library]')).not.toHaveClass(/is-library-hall/);
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'shape');
});
