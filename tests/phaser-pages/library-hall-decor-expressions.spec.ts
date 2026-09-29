import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const KEY = 'squishy.phaser-pages-preview.squishy.save.v3';
const SHAPES = ['soft-square', 'heart', 'mochi', 'peach', 'mushroom', 'paw'] as const;
const PROFILES = [
  { name: 'happy-o-flower', eyes: 'happy', mouth: 'o', stickers: [[2, 66, 175, 31, 0], [3, 188, 174, 28, 30]] },
  { name: 'sleepy-cat-sparkle', eyes: 'sleepy', mouth: 'cat', stickers: [[3, 66, 175, 31, 0], [2, 188, 174, 28, 30]] },
] as const;

test('all face and sticker styles remain visible and distinct on each saved contour', async ({ page }, info) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 320, height: 700 });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/phaser/');
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  await page.locator('[data-action="shape-continue"]').click();
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();
  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('No real Studio surface');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 0; i < 22; i++) await page.mouse.move(x + (i % 2 ? -65 : 65), y, { steps: 3 });
  await page.mouse.up();
  await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
  await page.locator('[data-action="mix-continue"]').click();
  await page.locator('[data-action="decor-continue"]').click();
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  const original = await page.evaluate((key) => {
    const save = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (save?.version !== 3 || save.library.length !== 1) throw new Error('Missing genuine Studio save');
    return save.library[0];
  }, KEY);
  const byShape = new Map<string, Set<string>>();
  for (const profile of PROFILES) {
    await page.evaluate(({ key, original, shapes, profile }) => {
      const save = JSON.parse(localStorage.getItem(key) ?? 'null');
      if (save?.version !== 3) throw new Error('Lost compact V3 save');
      save.library = shapes.map((shapeId: string) => ({
        ...original, id: `expression-${shapeId}-${profile.name}`, shapeId,
        decor: { v: 1, e: profile.eyes, m: profile.mouth, b: 1, s: profile.stickers },
      }));
      localStorage.setItem(key, JSON.stringify(save));
    }, { key: KEY, original, shapes: SHAPES, profile });
    await page.reload();
    await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '6');
    const saved = await page.evaluate((key) => localStorage.getItem(key), KEY);
    for (const shape of SHAPES) {
      const thumbnail = page.locator(`[data-library-thumbnail="expression-${shape}-${profile.name}"]`);
      await expect(thumbnail).toHaveAttribute('data-library-renderer', 'volume-mesh');
      const result = await thumbnail.evaluate((node) => {
        const canvas = node as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Missing real thumbnail');
        const centerX = Math.floor(canvas.width / 2);
        const centerY = Math.floor(canvas.height / 2);
        if (ctx.getImageData(centerX, centerY, 1, 1).data[3] < 64) throw new Error('Blank contour');
        if (ctx.getImageData(0, 0, 1, 1).data[3] !== 0) throw new Error('Rectangular background leak');
        return { png: canvas.toDataURL('image/png').split(',')[1], width: canvas.width, height: canvas.height };
      });
      expect([result.width, result.height]).toEqual([512, 512]);
      const bytes = Buffer.from(result.png, 'base64');
      const hash = createHash('sha256').update(bytes).digest('hex');
      (byShape.get(shape) ?? byShape.set(shape, new Set()).get(shape)!).add(hash);
      await writeFile(info.outputPath(`library-hall-expression-${shape}-${profile.name}-512.png`), bytes);
    }
    for (let room = 1; room <= 3; room++) {
      await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-hall-room', String(room));
      await page.screenshot({ path: info.outputPath(`library-hall-expression-${profile.name}-room-${room}-320.png`), animations: 'disabled' });
      if (room < 3) await page.locator('[data-library-hall-next]').click();
    }
    expect(await page.evaluate((key) => localStorage.getItem(key), KEY)).toBe(saved);
  }
  for (const shape of SHAPES) expect(byShape.get(shape)?.size, `unchanged face/stickers on ${shape}`).toBe(PROFILES.length);
  expect(errors).toEqual([]);
});
