import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const SAVE_KEY = 'squishy.phaser-pages-preview.squishy.save.v3';
const specimens = [
  { shape: 'paw', material: 'soft', accessory: 'crown' },
  { shape: 'heart', material: 'marshmallow', accessory: 'none' },
  { shape: 'soft-square', material: 'jelly', accessory: 'none' },
] as const;

for (const specimen of specimens) {
  test(`real saved ${specimen.shape}/${specimen.material}: Studio → Squeeze → Hall → reopen`, async ({ page }, info) => {
    test.setTimeout(115_000);
    await page.setViewportSize({ width: 390, height: 844 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/phaser/');
    await page.locator('[data-library-new]').first().click();
    await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
    await page.locator(`[data-shape="${specimen.shape}"]`).click();
    await page.locator('[data-action="shape-continue"]').click();
    await page.locator('[data-paint-color]').nth(2).click();
    const paint = await page.locator('[data-sandbox-canvas]').boundingBox();
    if (!paint) throw new Error('No paint surface');
    await page.mouse.move(paint.x + paint.width * .43, paint.y + paint.height * .64);
    await page.mouse.down();
    await page.mouse.move(paint.x + paint.width * .59, paint.y + paint.height * .64, { steps: 12 });
    await page.mouse.up();
    await page.locator('[data-action="paint-continue"]').click();
    await page.locator('[data-action="mixin-continue"]').click();
    const mix = await page.locator('[data-sandbox-canvas]').boundingBox();
    if (!mix) throw new Error('No mix surface');
    const x = mix.x + mix.width / 2;
    const y = mix.y + mix.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 0; i < 22; i++) await page.mouse.move(x + (i % 2 ? -65 : 65), y, { steps: 3 });
    await page.mouse.up();
    await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
    await page.locator('[data-action="mix-continue"]').click();
    await page.locator('[data-decor-eyes="dot"]').click();
    await page.locator('[data-decor-mouth="smile"]').click();
    if (specimen.accessory !== 'none') {
      await page.locator('[data-decor-section="accessory"]').click();
      await page.locator(`[data-decor-accessory="${specimen.accessory}"]`).click();
    }
    await page.locator('[data-action="decor-continue"]').click();
    await page.locator(`[data-material="${specimen.material}"]`).click();
    const prefix = `library-hall-parity-${specimen.shape}-${specimen.material}`;
    await page.locator('[data-sandbox-canvas]').screenshot({ path: info.outputPath(`${prefix}-studio-idle.png`) });
    await page.screenshot({ path: info.outputPath(`${prefix}-studio-stage.png`) });
    await page.locator('[data-action="save"]').click();
    await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
    await page.locator('[data-sandbox-canvas]').screenshot({ path: info.outputPath(`${prefix}-squeeze-idle.png`) });
    const before = await page.evaluate(key => localStorage.getItem(key), SAVE_KEY);
    const saved = JSON.parse(before ?? 'null');
    expect(saved?.version).toBe(3);
    expect(saved?.library).toHaveLength(1);
    expect(saved.library[0].shapeId).toBe(specimen.shape);
    expect(saved.library[0].materialId).toBe(specimen.material);
    expect(saved.library[0].appearance.strokes.length).toBeGreaterThan(0);
    if (specimen.accessory !== 'none') expect(saved.library[0].decor.a).toBe(specimen.accessory);
    const squeeze = await page.locator('[data-sandbox-canvas]').boundingBox();
    if (!squeeze) throw new Error('No squeeze surface');
    const px = squeeze.x + squeeze.width * .5;
    const py = squeeze.y + squeeze.height * .5;
    await page.mouse.move(px, py);
    await page.mouse.down();
    await page.mouse.move(px + 35, py + 24, { steps: 12 });
    await page.locator('[data-sandbox-canvas]').screenshot({ path: info.outputPath(`${prefix}-squeeze-pressed.png`) });
    await page.mouse.up();
    await page.waitForTimeout(550);
    await page.locator('[data-sandbox-canvas]').screenshot({ path: info.outputPath(`${prefix}-squeeze-released.png`) });
    await page.locator('[data-action="home"]').click();
    await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '1');
    const card = page.locator('[data-library-thumbnail]').first();
    await expect(card).toHaveAttribute('data-library-renderer', 'volume-mesh');
    const png = await card.evaluate(node => (node as HTMLCanvasElement).toDataURL('image/png').split(',')[1]);
    await writeFile(info.outputPath(`${prefix}-hall-512.png`), Buffer.from(png, 'base64'));
    await page.screenshot({ path: info.outputPath(`${prefix}-hall-room.png`) });
    await page.reload();
    expect(await page.evaluate(key => localStorage.getItem(key), SAVE_KEY)).toBe(before);
    await page.locator('.sandbox-library-card:visible [data-library-play-id]').click();
    await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
    await page.locator('[data-sandbox-canvas]').screenshot({ path: info.outputPath(`${prefix}-reopened.png`) });
    expect(errors).toEqual([]);
  });
}
