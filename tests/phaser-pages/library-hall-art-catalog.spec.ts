import { returningPlayer } from '../returning-player';
import { readCollection } from '../collection';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const KEY = 'squishy.phaser-pages-preview.squishy.save.v3';
const SHAPES = ['soft-square', 'heart', 'mochi', 'peach', 'mushroom', 'paw'] as const;
const LOOKS = [
  { id: 'happy-o-flower', eyes: 'happy', mouth: 'o', sticker: 2 },
  { id: 'sleepy-cat-sparkle', eyes: 'sleepy', mouth: 'cat', sticker: 3 },
  { id: 'dot-smile-heart', eyes: 'dot', mouth: 'smile', sticker: 0 },
  { id: 'happy-cat-star', eyes: 'happy', mouth: 'cat', sticker: 1 },
] as const;

/** Complete one REAL Studio mix and save before deriving visual-only V3 combinations. */
test('all face and sticker styles remain legible on six saved contours without changing V3', async ({ page }, info) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 320, height: 700 });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/phaser/?roomReview=0');
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  await page.locator('[data-craft-section="paint"]').click();
  await page.locator('[data-craft-section="mixins"]').click();
  await page.locator('[data-action="try-on"]').click();
  const bounds = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!bounds) throw new Error('Missing real Studio surface');
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 0; i < 22; i++) await page.mouse.move(x + (i % 2 ? -65 : 65), y, { steps: 3 });
  await page.mouse.up();
  await expect(page.locator('[data-action="try-return"]')).toBeEnabled();
  await page.locator('[data-action="try-return"]').click();
  await page.locator('[data-craft-section="decor"]').click();
  await page.locator('[data-decor-eyes="dot"]').click();
  await page.locator('[data-decor-mouth="smile"]').click();
  await page.locator('[data-craft-section="shape"]').click();
  await page.locator('[data-base-tab="material"]').click();
  await page.locator('[data-material="pearl"]').click();
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  const seed = await page.evaluate(({__save,__input}) => {const key=__input;
    const save = __save;
    if (save?.version !== 3 || save.library.length !== 1) throw new Error('Missing genuine V3 toy');
    return save.library[0];
  }, {__save:await readCollection(page,"squishy.phaser-pages-preview.","local"),__input:KEY});
  const hashesByShape = new Map<string, Set<string>>();
  for (const look of LOOKS) {
    await page.evaluate(({__save,__input}) => {const { key, seed, look, shapes }=__input;
      const save = __save;
      if (save?.version !== 3) throw new Error('Missing genuine saved V3 document');
      save.library = shapes.map((shapeId: string) => ({
        ...seed, id: `catalog-${look.id}-${shapeId}`, shapeId,
        decor: { v: 1, e: look.eyes, m: look.mouth, b: 1, a: 'bow',
          s: [[look.sticker, 65, 177, 32, 0], [look.sticker, 190, 176, 26, 30]] },
      }));
      (localStorage.removeItem("squishy.phaser-pages-preview.squishy.collection.v1"), localStorage.setItem(key, JSON.stringify({...save,legacyCatalogAccess:true,libraryCapacity:Math.max(8,save.libraryCapacity??0,save.library?.length??0)})));
    }, {__save:await readCollection(page,"squishy.phaser-pages-preview.","local"),__input:{ key: KEY, seed, look, shapes: SHAPES }});
    await page.reload();
    await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '6');
    // Scroll each native canvas into the bounded preview window before auditing its pixels.
    // Room navigation below remains presentation/paging coverage only.
    await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-hall-mounted', 'true');
    const saved = await page.evaluate(({__save,__input}) => {const key=__input;return ((__save === null ? null : JSON.stringify(__save)));}, {__save:await readCollection(page,"squishy.phaser-pages-preview.","local"),__input:KEY});
    const hashes = new Set<string>();
    for (const shape of SHAPES) {
      const canvas = page.locator(`[data-library-thumbnail="catalog-${look.id}-${shape}"]`);
      await canvas.scrollIntoViewIfNeeded();
      await expect.poll(() => canvas.evaluate(node => (node as HTMLCanvasElement).width)).toBe(512);
      await expect(canvas).toHaveAttribute('data-library-renderer', 'volume-mesh');
      const data = await canvas.evaluate((node) => {
        const target = node as HTMLCanvasElement;
        const ctx = target.getContext('2d');
        if (!ctx) throw new Error('Missing Canvas2D snapshot');
        return { png: target.toDataURL('image/png').split(',')[1],
          width: target.width, height: target.height,
          center: ctx.getImageData(target.width / 2, target.height / 2, 1, 1).data[3],
          corner: ctx.getImageData(0, 0, 1, 1).data[3] };
      });
      expect([data.width, data.height]).toEqual([512, 512]);
      expect(data.center, `${look.id}/${shape} body missing`).toBeGreaterThan(0);
      expect(data.corner, `${look.id}/${shape} rectangular matte`).toBe(0);
      const png = Buffer.from(data.png, 'base64');
      const hash = createHash('sha256').update(png).digest('hex');
      hashes.add(hash);
      (hashesByShape.get(shape) ?? hashesByShape.set(shape, new Set()).get(shape)!).add(hash);
      await writeFile(info.outputPath(`library-hall-catalog-${look.id}-${shape}-512.png`), png);
    }
    expect(hashes.size, `shape images duplicated for ${look.id}`).toBe(SHAPES.length);
    for (let room = 1; room <= 3; room++) {
      await page.locator('.sandbox-library-card').nth((room - 1) * 2).scrollIntoViewIfNeeded();
      await page.screenshot({ path: info.outputPath(`library-hall-catalog-${look.id}-room-${room}-320.png`), animations: 'disabled' });
    }
    expect(await page.evaluate(({__save,__input}) => {const key=__input;return ((__save === null ? null : JSON.stringify(__save)));}, {__save:await readCollection(page,"squishy.phaser-pages-preview.","local"),__input:KEY})).toBe(saved);
  }
  for (const shape of SHAPES) expect(hashesByShape.get(shape)?.size, `looks duplicated for ${shape}`).toBe(LOOKS.length);
  expect(errors).toEqual([]);
});

// This regression profile retains the previously free catalog. Fresh monetization is tested separately.
test.beforeEach(async ({ page }) => returningPlayer(page, 'squishy.phaser-pages-preview.'));
