import { expect, test } from '@playwright/test';

test('real saved jelly, marshmallow and chrome are materially distinct in the Hall', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/phaser/');
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  await page.locator('[data-shape="heart"]').click();
  await page.locator('[data-action="shape-continue"]').click();
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();
  const surface = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!surface) throw new Error('No real maker surface');
  const x = surface.x + surface.width / 2;
  const y = surface.y + surface.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 0; i < 22; i += 1) await page.mouse.move(x + (i % 2 ? -65 : 65), y, { steps: 3 });
  await page.mouse.up();
  await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
  await page.locator('[data-action="mix-continue"]').click();
  await page.locator('[data-action="decor-continue"]').click();
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  await page.evaluate(() => {
    const key = 'squishy.phaser-pages-preview.squishy.save.v3';
    const save = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (!save || save.library.length !== 1) throw new Error('Expected a real saved toy');
    const toy = save.library[0];
    save.library = [
      { ...toy, id: 'material-fixture-jelly', materialId: 'jelly' },
      { ...toy, id: 'material-fixture-marshmallow', materialId: 'marshmallow' },
      { ...toy, id: 'material-fixture-chrome', materialId: 'chrome' },
    ];
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '3');
  const visibleProfiles = async (): Promise<(string | null)[]> => page.locator('.sandbox-library-card:visible [data-library-material-profile]')
    .evaluateAll((canvases) => canvases.map((canvas) => canvas.getAttribute('data-library-material-profile')));
  expect(await visibleProfiles()).toEqual(['jelly', 'marshmallow']);
  const pixels = await page.locator('.sandbox-library-card:visible canvas').evaluateAll((canvases) => canvases.map((canvas) => {
    const ctx = (canvas as HTMLCanvasElement).getContext('2d');
    if (!ctx) throw new Error('No thumbnail context');
    return [...ctx.getImageData(128, 128, 1, 1).data];
  }));
  expect(pixels[0]).not.toEqual(pixels[1]);
  await page.screenshot({ path: info.outputPath('library-hall-material-phone-390.png'), animations: 'disabled' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: info.outputPath('library-hall-material-desktop-1440.png'), animations: 'disabled' });
  await page.locator('[data-library-hall-next]').click();
  expect(await visibleProfiles()).toEqual(['chrome']);
  await page.screenshot({ path: info.outputPath('library-hall-material-chrome-1440.png'), animations: 'disabled' });
});
