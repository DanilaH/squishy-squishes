import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { CREATIVE_PALETTES, PAINT_STAMPS, createPaintStamp } from '../../src/sandbox/creativeTools';
import { decodeAppearanceDocument, decodeAppearancePoints } from '../../src/sandbox/appearance';
import { accessorySway, faceReaction } from '../../src/sandbox/toyReactions';
import { createDefaultSaveV3 } from '../../src/platform/saveV3';
import { createEmptyDecorDocument } from '../../src/sandbox/decor';

test('stamps use the existing V1 document and reactions have bounded finite lifetimes', () => {
  for (const stamp of PAINT_STAMPS) for (const size of [18, 34, 56]) {
    const stroke = createPaintStamp(stamp.id, 0xff79a8, size, { u: .5, v: .5 });
    expect(decodeAppearanceDocument({ v: 1, strokes: [stroke], mixins: [] }).strokes).toEqual([stroke]);
    expect(stroke.p.length).toBeLessThanOrEqual(1024);
    expect(decodeAppearancePoints(stroke.p).every(p => p.u > .35 && p.u < .65 && p.v > .35 && p.v < .65)).toBe(true);
  }
  expect(faceReaction(0, 700)).toEqual({ squeeze: 0, delight: 0 });
  expect(faceReaction(3, -1).squeeze).toBe(1);
  expect(faceReaction(0, 0).delight).toBe(1);
  for (let t = 0; t < 1200; t += 10) expect(Math.abs(accessorySway(t, 5, 0))).toBeLessThanOrEqual(.13);
  expect(accessorySway(901, 1, 0)).toBe(0);
  expect(accessorySway(120, 1, 0)).toBe(-accessorySway(120, 1, 1));
});

for (const locale of ['en-US', 'ru-RU']) for (const viewport of [
  { width: 320, height: 568 }, { width: 568, height: 320 }, { width: 1440, height: 900 },
]) test(`creative tools fit and stamps Undo without recoloring in ${locale} ${viewport.width}`, async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, locale, viewport, reducedMotion: 'reduce' });
  const page = await context.newPage();
  try {
    await page.goto('/squishy-squishes/');
    await page.locator('[data-library-new]').first().click();
    await page.locator('[data-action="shape-continue"]').click();
    const shell = page.locator('[data-sandbox-app]'), body = page.locator('[data-sandbox-canvas]');
    const box = (await body.boundingBox())!;
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    await page.mouse.click(x, y);
    await expect(shell).toHaveAttribute('data-paint-strokes', '1');
    for (const theme of CREATIVE_PALETTES) {
      await page.locator('[data-paint-tool="paint"]').click();
      await expect(page.locator('[data-tools-overlay]')).toBeVisible();
      const dialog = page.locator('.sandbox-tools-dialog');
      for (const button of await dialog.getByRole('button').all()) {
        const rect = (await button.boundingBox())!;
        expect(rect.width).toBeGreaterThanOrEqual(44); expect(rect.height).toBeGreaterThanOrEqual(44);
        expect(rect.x).toBeGreaterThanOrEqual(0); expect(rect.y).toBeGreaterThanOrEqual(0);
        expect(rect.x + rect.width).toBeLessThanOrEqual(viewport.width);
        expect(rect.y + rect.height).toBeLessThanOrEqual(viewport.height);
      }
      expect(await dialog.evaluate(el => el.scrollHeight <= el.clientHeight && el.scrollWidth <= el.clientWidth)).toBe(true);
      await mkdir('migration-baseline-evidence', { recursive: true });
      await page.screenshot({ path: `migration-baseline-evidence/tools-${locale}-${viewport.width}.png` });
      await page.locator(`[data-paint-theme="${theme.id}"]`).click();
      await expect(shell).toHaveAttribute('data-paint-theme', theme.id);
      await expect(shell).toHaveAttribute('data-paint-strokes', '1');
      await expect(page.locator('[data-paint-color]')).toHaveCount(18);
      await expect(page.locator('[data-paint-color]').first()).toHaveAttribute('data-paint-color', String(theme.colors[0]));
      expect(await body.boundingBox()).toEqual(box);
    }
    await page.locator('[data-brush-size="56"]').click();
    for (const stamp of PAINT_STAMPS) {
      await page.locator('[data-paint-tool="paint"]').click();
      await page.locator(`[data-paint-stamp="${stamp.id}"]`).click();
      await page.mouse.move(x, y); await page.mouse.down();
      // A stamp is visible and committed before pointer-up, and dragging does
      // not turn its internal spiral into a brush stroke.
      await expect(shell).toHaveAttribute('data-paint-strokes', '2');
      await page.mouse.move(x + 12, y + 12); await page.mouse.up();
      await expect(shell).toHaveAttribute('data-paint-strokes', '2');
      await page.screenshot({ path: `migration-baseline-evidence/stamp-${stamp.id}-${locale}-${viewport.width}.png` });
      await page.locator('[data-action="paint-undo"]').click();
      await expect(shell).toHaveAttribute('data-paint-strokes', '1');
    }
    await page.locator('[data-paint-tool="erase"]').click();
    await page.mouse.move(x - 12, y); await page.mouse.down(); await page.mouse.move(x + 12, y, { steps: 6 }); await page.mouse.up();
    await expect(shell).toHaveAttribute('data-paint-strokes', '2');
    await page.locator('[data-action="paint-undo"]').click();
    await expect(shell).toHaveAttribute('data-paint-strokes', '1');
    await page.locator('[data-paint-tool="paint"]').click();
    await expect(page.locator('[data-tools-overlay]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-tools-overlay]')).toBeHidden();
    await expect(page.locator('[data-paint-tool="paint"]')).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await context.close(); }
});

for (const reduced of [false, true]) test(`saved face reacts and returns to rest, reduced motion=${reduced}`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
  await page.goto('/squishy-squishes/');
  const toy = { id: 'reaction', createdAt: 1700000000000, shapeId: 'paw', materialId: 'jelly',
    appearance: { v: 1, strokes: PAINT_STAMPS.map((s, i) => createPaintStamp(s.id, 0xff79a8, 40, { u: .3 + i * .13, v: .4 })), mixins: [] },
    decor: { ...createEmptyDecorDocument(), eyes: 'dot', mouth: 'smile', blush: true, accessory: 'cat-ears' } };
  await page.evaluate(save => localStorage.setItem('squishy.save.v3', JSON.stringify(save)), { ...createDefaultSaveV3(), library: [toy], totalCrafts: 1 });
  await page.reload();
  await page.locator('[data-library-play-id="reaction"]').click();
  const before = await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('squishy.save.v3')!).library));
  const shell = page.locator('[data-sandbox-app]'), body = page.locator('[data-sandbox-canvas]');
  const box = (await body.boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + 40, y + 25, { steps: 12 });
  await expect(shell).toHaveAttribute('data-squish-active', 'true');
  if (!reduced) await expect.poll(() => shell.getAttribute('data-face-reaction')).toMatch(/^[^0]/);
  await mkdir('migration-baseline-evidence', { recursive: true });
  await page.screenshot({ path: `migration-baseline-evidence/reaction-held-${reduced}.png` });
  if (!reduced) await shell.evaluate(el => {
    const samples: string[] = [];
    const end = performance.now() + 1500;
    const record = (): void => {
      samples.push(el.getAttribute('data-face-reaction') ?? '');
      el.setAttribute('data-release-reaction-samples', JSON.stringify(samples));
      if (performance.now() < end) requestAnimationFrame(record);
    };
    requestAnimationFrame(record);
  });
  await page.mouse.up();
  if (!reduced) await expect.poll(async () => {
    const samples: string[] = JSON.parse(await shell.getAttribute('data-release-reaction-samples') ?? '[]');
    return samples.some(value => /^0:[^0]/.test(value));
  }).toBe(true);
  await expect.poll(async () => Number(await page.locator('[data-sandbox-accessory]').getAttribute('data-accessory-sway'))).toBe(0);
  if (!reduced) await expect(shell).toHaveAttribute('data-face-reaction', '0:0');
  else expect(await shell.getAttribute('data-face-reaction')).toBeNull();
  expect(await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('squishy.save.v3')!).library))).toBe(before);
  await page.reload();
  await page.locator('[data-library-play-id="reaction"]').click();
  await expect(shell).toHaveAttribute('data-paint-strokes', '4');
  await page.screenshot({ path: `migration-baseline-evidence/stamps-reloaded-${reduced}.png` });
});
