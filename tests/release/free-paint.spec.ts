import { expect, test } from '@playwright/test';
import { createAppearanceStroke, createMixInPlacement, decodeAppearancePoints, estimateAppearanceBytes } from '../../src/sandbox/appearance';
import { createStickerPlacement, MAX_DECOR_STICKERS } from '../../src/sandbox/decor';
import { createDefaultSaveV3, decodeSaveStateV3, encodeSaveStateV3 } from '../../src/platform/saveV3';
import { createSandboxDraft } from '../../src/sandbox/types';

const points = Array.from({ length: 800 }, (_, i) => ({ u: .4 + (i % 2) * .2, v: .5 }));
const draft = createSandboxDraft();
const richToy = {
  ...draft, id: 'rich-toy', createdAt: 1700000000000,
  appearance: {
    v: 1 as const,
    strokes: Array.from({ length: 1000 }, (_, i) => createAppearanceStroke(i % 2 ? 0 : 1, 0xff6699, 8, [{ u: .5, v: .5 }])),
    mixins: Array.from({ length: 160 }, () => createMixInPlacement('stars', { u: .5, v: .5 }, 10, 0)),
  },
  decor: { ...draft.decor, stickers: Array.from({ length: 127 }, (_, i) => createStickerPlacement('star', { u: .5, v: .5 }, i)) },
};

test('V3 retains 1000 strokes, a long gesture and 128 compact stickers without truncation', () => {
  const long = createAppearanceStroke(0, 0xff6699, 8, points);
  expect(long.p.length).toBeGreaterThan(1024);
  expect(decodeAppearancePoints(long.p)).toHaveLength(800);
  const toy = { ...richToy, appearance: { ...richToy.appearance, strokes: [...richToy.appearance.strokes, long] }, decor: { ...richToy.decor, stickers: [...richToy.decor.stickers, createStickerPlacement('star', { u: .5, v: .5 }, 127)] } };
  expect(estimateAppearanceBytes(toy.appearance)).toBeGreaterThan(6000);
  const state = { ...createDefaultSaveV3(), library: [toy] };
  expect(decodeSaveStateV3(JSON.parse(JSON.stringify(encodeSaveStateV3(state))))).toEqual(state);
  expect(() => decodeSaveStateV3({ ...state, library: [{ ...toy, decor: { ...toy.decor, stickers: [...toy.decor.stickers, toy.decor.stickers[0]] } }] })).toThrow('too many stickers');
});

for (const locale of ['ru-RU', 'en-US']) test(`rich saved toy remains editable and durable ${locale}`, async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, locale, viewport: { width: 320, height: 568 }, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto('/squishy-squishes/');
    await page.evaluate(state => localStorage.setItem('squishy.save.v3', JSON.stringify(state)), encodeSaveStateV3({ ...createDefaultSaveV3(), library: [richToy] }));
    await page.reload();
    await page.locator('[data-library-play-id="rich-toy"]').click();
    await page.locator('[data-action="edit-saved"]').click();
    const shell = page.locator('[data-sandbox-app]');
    await page.locator('[data-action="stage-back"]').click();
    await page.locator('[data-action="stage-back"]').click();
    await page.locator('[data-action="stage-back"]').click();
    await expect(shell).toHaveAttribute('data-stage', 'paint');
    await expect(page.locator('[data-paint-tool="paint"]')).toBeEnabled();
    const box = (await page.locator('[data-sandbox-canvas]').boundingBox())!;
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    await page.touchscreen.tap(x, y);
    await expect(shell).toHaveAttribute('data-paint-strokes', '1001');
    // A long uninterrupted gesture must not stop at the old 320-point ceiling.
    await page.mouse.move(x - 15, y); await page.mouse.down();
    for (let i = 0; i < 400; i++) await page.mouse.move(x + (i % 2 ? -15 : 15), y);
    await page.mouse.up();
    await expect(shell).toHaveAttribute('data-paint-strokes', '1002');
    await page.locator('[data-action="paint-clear"]').click();
    await page.locator('[data-action="paint-undo"]').click();
    await expect(shell).toHaveAttribute('data-paint-strokes', '1002');
    await page.locator('[data-action="paint-continue"]').click();
    await page.locator('[data-action="mixin-continue"]').click();
    await page.locator('[data-action="mix-continue"]').click();
    await page.locator('[data-decor-section="stickers"]').click();
    const decorBox = (await page.locator('[data-sandbox-canvas]').boundingBox())!;
    const sx = decorBox.x + decorBox.width / 2, sy = decorBox.y + decorBox.height / 2;
    await page.touchscreen.tap(sx, sy);
    await expect(shell).toHaveAttribute('data-decor-sticker-count', String(MAX_DECOR_STICKERS));
    await page.touchscreen.tap(sx, sy);
    await expect(shell).toHaveAttribute('data-decor-sticker-count', String(MAX_DECOR_STICKERS));
    await page.locator('[data-action="decor-erase"]').click();
    await page.touchscreen.tap(sx, sy);
    await expect(shell).toHaveAttribute('data-decor-sticker-count', '127');
    await page.locator('[data-panel="decor"] [data-action="draft-undo"]').click();
    await page.locator('[data-action="decor-continue"]').click();
    await page.locator('[data-action="save"]').click();
    await expect(shell).toHaveAttribute('data-stage', 'squeeze');
    const after = decodeSaveStateV3(await page.evaluate(() => JSON.parse(localStorage.getItem('squishy.save.v3')!)));
    expect(after.library[0]!.appearance.strokes).toHaveLength(1002);
    expect(decodeAppearancePoints(after.library[0]!.appearance.strokes.at(-1)!.p).length).toBeGreaterThan(320);
    expect(after.library[0]!.decor.stickers).toHaveLength(128);
    expect(after.totalCrafts).toBe(0);
    await page.reload();
    await page.locator('[data-library-play-id="rich-toy"]').click();
    await expect(shell).toHaveAttribute('data-paint-strokes', '1002');
    await expect(shell).toHaveAttribute('data-decor-sticker-count', '128');
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await context.close(); }
});
