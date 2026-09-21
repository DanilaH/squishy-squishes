import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('real saved materials have comparable Studio and Library captures', async ({ page }, info) => {
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
  // The real saved Studio toy supplies every material fixture: no fake skins.
  await page.locator('[data-sandbox-canvas]').screenshot({ path: info.outputPath('library-hall-studio-soft-canvas-390.png'), animations: 'disabled' });
  await page.evaluate(() => {
    const key = 'squishy.phaser-pages-preview.squishy.save.v3';
    const save = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (!save || save.library.length !== 1) throw new Error('Expected a real saved toy');
    const toy = save.library[0];
    save.library = (['jelly', 'marshmallow', 'chrome', 'holo', 'pearl'] as const).map((materialId) => ({
      ...toy,
      id: `material-fixture-${materialId}`,
      materialId,
    }));
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '5');
  const visibleProfiles = async (): Promise<(string | null)[]> => page.locator('.sandbox-library-card:visible [data-library-material-profile]')
    .evaluateAll((canvases) => canvases.map((canvas) => canvas.getAttribute('data-library-material-profile')));
  const captureThumbnail = async (material: string): Promise<void> => {
    // Element screenshots can crop a transformed/overflow-hidden canvas or
    // capture the wrong viewport offset. Save its actual native 256px pixels.
    const pngBase64 = await page.locator(`[data-library-play-id="material-fixture-${material}"] canvas`)
      .evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL('image/png').split(',')[1]);
    if (!pngBase64) throw new Error(`Empty ${material} thumbnail`);
    await writeFile(info.outputPath(`library-hall-thumbnail-${material}-390.png`), Buffer.from(pngBase64, 'base64'));
  };
  const captureStudio = async (material: string): Promise<void> => {
    await page.locator(`[data-library-play-id="material-fixture-${material}"]`).click();
    await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
    await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
    await page.locator('[data-sandbox-canvas]').screenshot({
      path: info.outputPath(`library-hall-studio-${material}-canvas-390.png`), animations: 'disabled',
    });
    await page.locator('[data-action="home"]').click();
  };
  expect(await visibleProfiles()).toEqual(['jelly', 'marshmallow']);
  const pixels = await page.locator('.sandbox-library-card:visible canvas').evaluateAll((canvases) => canvases.map((canvas) => {
    const ctx = (canvas as HTMLCanvasElement).getContext('2d');
    if (!ctx) throw new Error('No thumbnail context');
    return [...ctx.getImageData(128, 128, 1, 1).data];
  }));
  expect(pixels[0]).not.toEqual(pixels[1]);
  await page.screenshot({ path: info.outputPath('library-hall-material-phone-390.png'), animations: 'disabled' });
  await captureThumbnail('jelly');
  await captureThumbnail('marshmallow');
  await captureStudio('jelly');
  await captureStudio('marshmallow');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: info.outputPath('library-hall-material-desktop-1440.png'), animations: 'disabled' });
  await page.locator('[data-library-hall-next]').click();
  expect(await visibleProfiles()).toEqual(['chrome', 'holo']);
  await page.screenshot({ path: info.outputPath('library-hall-material-chrome-holo-1440.png'), animations: 'disabled' });
  await captureThumbnail('chrome');
  await captureThumbnail('holo');
  await captureStudio('chrome');
  await captureStudio('holo');
  await page.locator('[data-library-hall-next]').click();
  expect(await visibleProfiles()).toEqual(['pearl']);
  await page.screenshot({ path: info.outputPath('library-hall-material-pearl-1440.png'), animations: 'disabled' });
  await captureThumbnail('pearl');
  await captureStudio('pearl');
});
