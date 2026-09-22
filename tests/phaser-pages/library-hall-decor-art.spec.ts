import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const KEY = 'squishy.phaser-pages-preview.squishy.save.v3';
const SHAPES = ['soft-square', 'heart', 'mochi', 'peach', 'mushroom', 'paw'] as const;
const ACCESSORIES = ['cat-ears', 'bunny-ears', 'horns', 'bow', 'crown'] as const;

/** Every fixture starts with an actual Studio creation, mix and V3 save. */
const saveRealToy = async (page: import('@playwright/test').Page): Promise<void> => {
  await page.goto('/phaser/');
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  await page.locator('button[data-shape="heart"]').click();
  await page.locator('[data-action="shape-continue"]').click();
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();
  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('No actual Studio surface');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 0; i < 22; i++) await page.mouse.move(x + (i % 2 ? -65 : 65), y, { steps: 3 });
  await page.mouse.up();
  await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
  await page.locator('[data-action="mix-continue"]').click();
  await page.locator('[data-decor-eyes="dot"]').click();
  await page.locator('[data-decor-mouth="smile"]').click();
  await page.locator('[data-decor-section="stickers"]').click();
  await page.locator('[data-sandbox-canvas]').click({ position: { x: box.width * .28, y: box.height * .53 } });
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-decor-sticker-count', '1');
  await page.locator('[data-decor-section="accessory"]').click();
  await page.locator('[data-decor-accessory="bow"]').click();
  await page.locator('[data-action="decor-continue"]').click();
  await page.locator('[data-material="pearl"]').click();
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  const save = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), KEY);
  expect(save?.version).toBe(3);
  expect(save.library).toHaveLength(1);
  expect(save.library[0].decor).toMatchObject({ e: 'dot', m: 'smile', a: 'bow' });
  expect(save.library[0].decor.s).toHaveLength(1);
};

test('one fully decorated Studio → Squeeze → Hall exemplar keeps its exact compact V3 bytes', async ({ page }, info) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 320, height: 700 });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await saveRealToy(page);
  await page.locator('[data-sandbox-canvas]').screenshot({ path: info.outputPath('library-hall-art-exemplar-studio-squeeze-320.png') });
  const before = await page.evaluate((key) => localStorage.getItem(key), KEY);
  await page.locator('[data-action="home"]').click();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '1');
  await page.screenshot({ path: info.outputPath('library-hall-art-exemplar-room-320.png'), animations: 'disabled' });
  const png = await page.locator('[data-library-thumbnail]').first().evaluate((node) => (node as HTMLCanvasElement).toDataURL('image/png').split(',')[1]);
  expect(png?.length).toBeGreaterThan(1000);
  await writeFile(info.outputPath('library-hall-art-exemplar-native-512.png'), Buffer.from(png, 'base64'));
  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '1');
  expect(await page.evaluate((key) => localStorage.getItem(key), KEY)).toBe(before);
  await page.locator('.sandbox-library-card:visible [data-library-play-id]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  await page.locator('[data-sandbox-canvas]').screenshot({ path: info.outputPath('library-hall-art-exemplar-reopened-320.png') });
  expect(errors).toEqual([]);
});

test('all six contours and all five existing accessory IDs render distinct authentic V3 exhibits', async ({ page }, info) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 320, height: 700 });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await saveRealToy(page);
  // Pin the one genuinely authored save. Later passes persist six variants;
  // reading library[0] on each pass would silently compound the fixture.
  const original = await page.evaluate((key) => {
    const save = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (save?.version !== 3 || save.library.length !== 1) throw new Error('Missing genuine V3 seed');
    return save.library[0];
  }, KEY);
  const variants = new Map<string, Set<string>>();
  for (const accessory of ACCESSORIES) {
    await page.evaluate(({ key, shapes, accessory, original }) => {
      const save = JSON.parse(localStorage.getItem(key) ?? 'null');
      if (save?.version !== 3 || !Array.isArray(save.library)) throw new Error('Missing genuine V3 save');
      save.library = shapes.map((shapeId: string) => ({
        ...original, id: `art-${shapeId}-${accessory}`, shapeId,
        decor: { ...original.decor, a: accessory, e: 'dot', m: 'smile', b: 1,
          s: [[0, 67, 175, 28, 0], [1, 190, 173, 26, 35]] },
      }));
      localStorage.setItem(key, JSON.stringify(save));
    }, { key: KEY, shapes: SHAPES, accessory, original });
    await page.reload();
    await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '6');
    const saved = await page.evaluate((key) => localStorage.getItem(key), KEY);
    const seen = new Set<string>();
    for (const shape of SHAPES) {
      const thumbnail = page.locator(`[data-library-thumbnail="art-${shape}-${accessory}"]`);
      await expect(thumbnail).toHaveAttribute('data-library-renderer', 'studio-shader');
      const pixels = await thumbnail.evaluate((node) => {
        const image = node as HTMLCanvasElement;
        const context = image.getContext('2d');
        if (!context) throw new Error('Missing thumbnail Canvas2D');
        return {
          width: image.width, height: image.height,
          png: image.toDataURL('image/png').split(',')[1],
          centerAlpha: context.getImageData(image.width / 2, image.height / 2, 1, 1).data[3],
          cornerAlpha: context.getImageData(0, 0, 1, 1).data[3],
          upperAlpha: context.getImageData(image.width / 2, Math.round(image.height * 0.15625), 1, 1).data[3],
        };
      });
      expect([pixels.width, pixels.height]).toEqual([512, 512]);
      expect(pixels.centerAlpha, `blank ${shape}/${accessory}`).toBeGreaterThan(0);
      expect(pixels.cornerAlpha, `rectangular leak ${shape}/${accessory}`).toBe(0);
      expect(pixels.png).toBeTruthy();
      const bytes = Buffer.from(pixels.png, 'base64');
      const hash = createHash('sha256').update(bytes).digest('hex');
      seen.add(hash);
      (variants.get(shape) ?? variants.set(shape, new Set()).get(shape)!).add(hash);
      await writeFile(info.outputPath(`library-hall-art-${shape}-${accessory}-512.png`), bytes);
    }
    expect(seen.size, `some shape images identical for ${accessory}`).toBe(SHAPES.length);
    for (let room = 1; room <= 3; room++) {
      await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-hall-room', String(room));
      await page.screenshot({ path: info.outputPath(`library-hall-art-${accessory}-room-${room}-320.png`), animations: 'disabled' });
      if (room < 3) await page.locator('[data-library-hall-next]').click();
    }
    expect(await page.evaluate((key) => localStorage.getItem(key), KEY)).toBe(saved);
  }
  for (const shape of SHAPES) expect(variants.get(shape)?.size, `accessory not distinct for ${shape}`).toBe(ACCESSORIES.length);
  expect(errors).toEqual([]);
});
