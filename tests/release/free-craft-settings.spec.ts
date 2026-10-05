import { expect, test } from '@playwright/test';
import sharp from 'sharp';
import { createDefaultSaveV3, decodeSaveStateV3 } from '../../src/platform/saveV3';
import { createSandboxDraft } from '../../src/sandbox/types';
import { createEmptyDecorDocument } from '../../src/sandbox/decor';
import { createBodyFillStroke } from '../../src/sandbox/appearance';

for (const viewport of [{ width: 390, height: 844 }, { width: 568, height: 320 }]) {
  test(`light, try-on and local mixed brush preserve craft at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/squishy-squishes/');
    const toy = { ...createSandboxDraft(), id: 'craft-settings', createdAt: 1700000000000,
      appearance: { v: 1, strokes: [createBodyFillStroke(0xffb7cf)], mixins: [] },
      decor: { ...createEmptyDecorDocument(), eyes: 'dot', mouth: 'smile', accessory: 'bow' } };
    await page.evaluate(value => localStorage.setItem('squishy.save.v3', JSON.stringify(value)),
      { ...createDefaultSaveV3(), totalCrafts: 1, library: [toy] });
    await page.reload();
    await page.locator('[data-library-play-id="craft-settings"]').click();
    await page.locator('[data-action="edit-saved"]').click();
    await page.locator('[data-action="stage-back"]').click();
    await page.locator('[data-action="stage-back"]').click();
    const shell = page.locator('[data-sandbox-app]'), canvas = page.locator('[data-sandbox-canvas]');
    await expect(shell).toHaveAttribute('data-stage', 'mixins');
    const box = (await canvas.boundingBox())!;
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    for (const [setting, value] of [['size', '35'], ['density', '2']]) {
      const input = page.locator(`[data-mixin-setting="${setting}"]`);
      await input.fill(value!); await input.dispatchEvent('change');
    }
    await page.locator('[data-mixin="bubbles"]').click();
    await page.mouse.move(x - 25, y); await page.mouse.down();
    await page.mouse.move(x + 25, y, { steps: 12 }); await page.mouse.up();
    const count = Number(await shell.getAttribute('data-mixin-count'));
    expect(count).toBeGreaterThan(2);
    await page.locator('[data-action="mixin-undo"]').click();
    await expect(shell).toHaveAttribute('data-mixin-count', '0');
    await page.locator('[data-panel="mixins"] [data-action="draft-redo"]').click();
    await expect(shell).toHaveAttribute('data-mixin-count', String(count));
    await page.locator('[data-mixin="flowers"]').click(); await page.mouse.click(x, y - 30);
    await page.locator('[data-action="mixin-erase"]').click(); await page.mouse.click(x, y - 30);
    expect(Number(await shell.getAttribute('data-mixin-count'))).toBeLessThan(count + 1);
    await page.locator('[data-action="mixin-undo"]').click();
    await expect(shell).toHaveAttribute('data-mixin-count', String(count + 1));
    await page.locator('[data-action="mixin-continue"]').click();
    await page.locator('[data-action="mix-continue"]').click();
    await page.locator('[data-action="decor-continue"]').click();
    const stable = await canvas.boundingBox();
    const desk = await page.locator('[data-studio-desk]').boundingBox();
    await page.locator('[data-finish-tab="light"]').click();
    const pixels = async () => sharp(await canvas.screenshot()).removeAlpha().raw().toBuffer();
    await page.locator('[data-light-preset="sunset"]').click();
    const sunset = await pixels();
    await page.locator('[data-light-preset="moon"]').click();
    const moon = await pixels();
    let changed = 0;
    for (let i = 0; i < sunset.length; i++) if (Math.abs(sunset[i]! - moon[i]!) > 6) changed++;
    expect(changed).toBeGreaterThan(500);
    const axis = page.locator('[data-light-axis="x"]');
    await axis.fill('0.8'); await axis.dispatchEvent('change');
    await page.locator('[data-panel="finish"] [data-action="draft-undo"]').click();
    await expect(axis).toHaveValue('-0.45');
    await page.locator('[data-panel="finish"] [data-action="draft-redo"]').click();
    await expect(axis).toHaveValue('0.8');
    await page.locator('[data-action="try-on"]').click();
    await expect(shell).toHaveAttribute('data-try-on', 'true');
    expect(await canvas.boundingBox()).toEqual(stable);
    expect(await page.locator('[data-studio-desk]').boundingBox()).toEqual(desk);
    await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 40, y - 20, { steps: 8 });
    await expect(shell).toHaveAttribute('data-squish-active', 'true'); await page.mouse.up();
    await page.locator('[data-action="try-return"]').click();
    expect(await canvas.boundingBox()).toEqual(stable);
    await page.locator('[data-action="light-reset"]').click();
    await expect(axis).toHaveValue('-0.45');
    await page.locator('[data-panel="finish"] [data-action="draft-undo"]').click();
    await expect(axis).toHaveValue('0.8');
    await page.locator('[data-action="save"]').click();
    await expect(shell).toHaveAttribute('data-stage', 'squeeze');
    const saved = decodeSaveStateV3(await page.evaluate(() => JSON.parse(localStorage.getItem('squishy.save.v3')!))).library[0]!;
    expect(saved.appearance.light).toEqual({ preset: 'moon', x: .8, y: .65 });
    expect(saved.appearance.mixinBrush).toEqual({ size: 35, density: 2 });
    expect(saved.appearance.mixins.map(item => item.t)).toEqual(expect.arrayContaining([7, 11]));
    expect(saved.appearance.strokes).toEqual(toy.appearance.strokes);
    expect(saved.decor).toEqual(toy.decor);
    await page.reload(); await page.locator('[data-library-play-id="craft-settings"]').click();
    await page.locator('[data-action="edit-saved"]').click(); await page.locator('[data-action="decor-continue"]').click();
    await page.locator('[data-finish-tab="light"]').click(); await expect(axis).toHaveValue('0.8');
    expect(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight || document.documentElement.scrollWidth > innerWidth)).toBe(false);
  });
}
