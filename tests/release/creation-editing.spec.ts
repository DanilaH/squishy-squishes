import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { createDefaultSaveV3, decodeSaveStateV3, updateSavedSquishy } from '../../src/platform/saveV3';
import { createSandboxDraft } from '../../src/sandbox/types';

const saved = (id: string) => ({ ...createSandboxDraft(), id, createdAt: 1700000000000 });

test('editing V3 preserves identity, slots, rewards and craft count', () => {
  const state = { ...createDefaultSaveV3(), library: Array.from({ length: 8 }, (_, i) => saved(`toy-${i}`)), totalCrafts: 19 };
  const draft = { ...createSandboxDraft(), decor: { ...createSandboxDraft().decor, accessory: 'bow' as const } };
  const next = updateSavedSquishy(state, 'toy-3', draft, 1700000001000);
  expect(decodeSaveStateV3(next)).toEqual(next);
  expect(next.library[3]).toEqual({ ...draft, id: 'toy-3', createdAt: state.library[3]!.createdAt });
  expect(next.library.filter(toy => toy.id !== 'toy-3')).toEqual(state.library.filter(toy => toy.id !== 'toy-3'));
  expect({ ...next, library: state.library, updatedAt: state.updatedAt }).toEqual(state);
  expect(state.library[3]!.decor.accessory).toBeNull();
  expect(() => updateSavedSquishy(state, 'missing', draft)).toThrow('Edit target does not exist');
});

for (const locale of ['en-US', 'ru-RU']) for (const viewport of [
  { width: 320, height: 568 }, { width: 568, height: 320 }, { width: 1440, height: 900 },
]) test(`clear Undo and saved redecorating in ${locale} ${viewport.width}`, async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, locale, viewport, hasTouch: viewport.width === 320, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const tap = async (x: number, y: number): Promise<void> => {
    if (viewport.width === 320) await page.touchscreen.tap(x, y);
    else await page.mouse.click(x, y);
  };
  try {
    await page.goto('/squishy-squishes/');
    const state = { ...createDefaultSaveV3(), library: Array.from({ length: 8 }, (_, i) => saved(`toy-${i}`)), totalCrafts: 19 };
    await page.evaluate(value => localStorage.setItem('squishy.save.v3', JSON.stringify(value)), state);
    await page.reload();
    await page.locator('[data-library-play-id="toy-0"]').click();
    await page.locator('[data-action="edit-saved"]').click();
    const shell = page.locator('[data-sandbox-app]');
    await expect(shell).toHaveAttribute('data-stage', 'decor');
    // Returning to Paint does not reset the saved toy or require another Mix.
    await page.locator('[data-action="stage-back"]').click();
    await page.locator('[data-action="stage-back"]').click();
    await page.locator('[data-action="stage-back"]').click();
    const body = page.locator('[data-sandbox-canvas]');
    const box = (await body.boundingBox())!;
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    await tap(x, y);
    await page.locator('[data-action="paint-clear"]').click();
    await expect(shell).toHaveAttribute('data-paint-strokes', '0');
    await page.locator('[data-action="paint-undo"]').click();
    await expect(shell).toHaveAttribute('data-paint-strokes', '1');
    await page.locator('[data-paint-tool="erase"]').click();
    await page.locator('[data-paint-tool="paint"]').click();
    await expect(page.locator('[data-tools-overlay]')).toBeVisible();
    await page.locator('[data-paint-stamp="star"]').click();
    await tap(x + 20, y);
    await page.locator('[data-action="paint-continue"]').click();
    await tap(x, y);
    await page.locator('[data-action="mixin-clear"]').click();
    await expect(shell).toHaveAttribute('data-mixin-count', '0');
    await page.locator('[data-action="mixin-undo"]').click();
    await expect(shell).toHaveAttribute('data-mixin-count', '1');
    await page.locator('[data-action="mixin-continue"]').click();
    await page.locator('[data-action="mix-continue"]').click();
    await page.locator('[data-decor-section="stickers"]').click();
    const stickerBox = (await body.boundingBox())!;
    const sx = stickerBox.x + stickerBox.width / 2, sy = stickerBox.y + stickerBox.height / 2;
    await tap(sx - 35, sy);
    await tap(sx + 35, sy);
    await page.locator('[data-action="decor-erase"]').click();
    await tap(sx - 35, sy);
    await expect(shell).toHaveAttribute('data-decor-sticker-count', '1');
    await page.locator('[data-action="decor-undo"]').click();
    await expect(shell).toHaveAttribute('data-decor-sticker-count', '2');
    await page.locator('[data-action="decor-clear"]').click();
    await expect(shell).toHaveAttribute('data-decor-sticker-count', '0');
    await page.locator('[data-action="decor-undo"]').click();
    await expect(shell).toHaveAttribute('data-decor-sticker-count', '2');
    await page.locator('[data-decor-section="accessory"]').click();
    await page.locator('[data-decor-accessory="bow"]').click();
    await page.locator('[data-action="decor-continue"]').click();
    await page.locator('[data-action="save"]').click();
    await expect(shell).toHaveAttribute('data-stage', 'squeeze');
    await expect(page.locator('[data-library-replace-overlay]')).toHaveCount(0);
    const rawAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('squishy.save.v3')!));
    const after = decodeSaveStateV3(rawAfter);
    expect(after.totalCrafts).toBe(19);
    expect(after.library).toHaveLength(8);
    expect(after.library[0]!.id).toBe('toy-0');
    expect(after.library[0]!.createdAt).toBe(state.library[0]!.createdAt);
    expect(after.library.slice(1)).toEqual(state.library.slice(1));
    expect(after.library[0]!.decor.stickers).toHaveLength(2);
    expect(after.library[0]!.decor.accessory).toBe('bow');
    for (const button of await page.locator('[data-panel="squeeze"]').getByRole('button').all()) {
      const bounds = (await button.boundingBox())!;
      expect(bounds.width).toBeGreaterThanOrEqual(44); expect(bounds.height).toBeGreaterThanOrEqual(44);
      expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height + 1);
    }
    await mkdir('migration-baseline-evidence', { recursive: true });
    await page.screenshot({ path: `migration-baseline-evidence/edit-saved-${locale}-${viewport.width}.png` });
    await page.reload();
    await page.locator('[data-library-play-id="toy-0"]').click();
    await expect(shell).toHaveAttribute('data-decor-sticker-count', '2');
    await expect(shell).toHaveAttribute('data-paint-strokes', '2');
    await expect(shell).toHaveAttribute('data-mixin-count', '1');
    // Discard an edit; it must never alter the persistent toy.
    await page.locator('[data-action="edit-saved"]').click();
    await page.locator('[data-decor-section="accessory"]').click();
    await page.locator('[data-decor-accessory="none"]').click();
    await page.locator('[data-action="exit-craft"]').click();
    await page.locator('[data-action="exit-confirm"]').click();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('squishy.save.v3')!))).toEqual(rawAfter);
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await context.close(); }
});
