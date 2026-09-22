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
  await page.goto('/phaser/');
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  await page.locator('[data-action="shape-continue"]').click();
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();
  const bounds = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!bounds) throw new Error('Missing real Studio surface');
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 0; i < 22; i++) await page.mouse.move(x + (i % 2 ? -65 : 65), y, { steps: 3 });
  await page.mouse.up();
  await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
  await page.locator('[data-action="mix-continue"]').click();
  await page.locator('[data-decor-eyes="dot"]').click();
  await page.locator('[data-decor-mouth="smile"]').click();
  await page.locator('[data-action="decor-continue"]').click();
  await page.locator('[data-material="pearl"]').click();
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  const seed = await page.evaluate((key) => {
    const save = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (save?.version !== 3 || save.library.length !== 1) throw new Error('Missing genuine V3 toy');
    return save.library[0];
  }, KEY);
  const hashesByShape = new Map<string, Set<string>>();
  for (const look of LOOKS) {
    await page.evaluate(({ key, seed, look, shapes }) => {
      const save = JSON.parse(localStorage.getItem(key) ?? 'null');
      if (save?.version !== 3) throw new Error('Missing genuine saved V3 document');
      save.library = shapes.map((shapeId: string) => ({
        ...seed, id: `catalog-${look.id}-${shapeId}`, shapeId,
        decor: { v: 1, e: look.eyes, m: look.mouth, b: 1, a: 'bow',
          s: [[look.sticker, 65, 177, 32, 0], [look.sticker, 190, 176, 26, 30]] },
      }));
      localStorage.setItem(key, JSON.stringify(save));
    }, { key: KEY, seed, look, shapes: SHAPES });
    await page.reload();
    await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '6');
    const saved = await page.evaluate((key) => localStorage.getItem(key), KEY);
    const hashes = new Set<string>();
    for (const shape of SHAPES) {
      const canvas = page.locator(`[data-library-thumbnail="catalog-${look.id}-${shape}"]`);
      await expect(canvas).toHaveAttribute('data-library-renderer', 'studio-shader');
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
      await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-hall-room', String(room));
      await page.screenshot({ path: info.outputPath(`library-hall-catalog-${look.id}-room-${room}-320.png`), animations: 'disabled' });
      if (room < 3) await page.locator('[data-library-hall-next]').click();
    }
    expect(await page.evaluate((key) => localStorage.getItem(key), KEY)).toBe(saved);
  }
  for (const shape of SHAPES) expect(hashesByShape.get(shape)?.size, `looks duplicated for ${shape}`).toBe(LOOKS.length);
  expect(errors).toEqual([]);
});
