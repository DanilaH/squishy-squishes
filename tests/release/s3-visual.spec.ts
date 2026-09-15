import { mkdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const PAGES_URL = '/squishy-squishes/';
const OUT = 'artifacts/s3-visual';

test.use({ locale: 'ru-RU' });
test.setTimeout(120_000);

const shot = async (page: Page, name: string): Promise<void> => {
  mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
};

const bootEmpty = async (page: Page): Promise<void> => {
  await page.goto(PAGES_URL);
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('squishy.save.v3', JSON.stringify({
      version: 3,
      library: [],
      libraryCapacity: 8,
      completedRecipeIds: [],
      unlockedRewardIds: [],
      totalCrafts: 0,
      updatedAt: 0,
    }));
  });
  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '0');
};

const canvasBox = async (page: Page) => {
  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('Missing sandbox canvas');
  return box;
};

const completeMix = async (page: Page): Promise<void> => {
  const box = await canvasBox(page);
  const cx = box.x + box.width * 0.5;
  const cy = box.y + box.height * 0.5;
  const dx = Math.min(72, box.width * 0.2);
  const dy = Math.min(64, box.height * 0.18);
  const points = [
    [cx + dx, cy],
    [cx, cy - dy],
    [cx - dx, cy],
    [cx, cy + dy],
  ] as const;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let index = 0; index < 36; index += 1) {
    const [x, y] = points[index % points.length]!;
    await page.mouse.move(x, y, { steps: 2 });
  }
  await page.mouse.up();
  await expect.poll(async () => Number(await page.locator('[data-sandbox-app]').getAttribute('data-mix-progress')))
    .toBeGreaterThanOrEqual(1);
};

const advanceToDecor = async (page: Page, shape = 'heart'): Promise<void> => {
  await page.locator('[data-library-new]').first().click();
  const shell = page.locator('[data-sandbox-app]');
  await expect(shell).toHaveAttribute('data-stage', 'shape');
  await page.locator(`.sandbox-shape[data-shape="${shape}"]`).click();
  await page.locator('[data-action="shape-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'paint');
  await page.locator('[data-action="paint-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'mixins');
  await page.locator('[data-action="mixin-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'mix');
  await completeMix(page);
  await page.locator('[data-action="mix-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'decor');
};

const seedLibrary = async (page: Page): Promise<void> => {
  await page.goto(PAGES_URL);
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    const toys = [
      {
        id: 'visual-heart', createdAt: 1, shapeId: 'heart', materialId: 'holo',
        appearance: { v: 1, strokes: [], mixins: [] },
        decor: { v: 1, eyes: 'happy', mouth: 'cat', blush: true, stickers: [{ t: 2, x: 188, y: 160, s: 38, r: 31 }], accessory: 'crown' },
      },
      {
        id: 'visual-mochi', createdAt: 2, shapeId: 'mochi', materialId: 'jelly',
        appearance: { v: 1, strokes: [], mixins: [] },
        decor: { v: 1, eyes: 'dot', mouth: 'smile', blush: true, stickers: [{ t: 3, x: 71, y: 170, s: 35, r: 100 }, { t: 0, x: 190, y: 80, s: 32, r: 210 }], accessory: 'bunny-ears' },
      },
      {
        id: 'visual-paw', createdAt: 3, shapeId: 'paw', materialId: 'soft',
        appearance: { v: 1, strokes: [], mixins: [] },
        decor: { v: 1, eyes: 'sleepy', mouth: 'o', blush: false, stickers: [{ t: 1, x: 165, y: 185, s: 36, r: 66 }], accessory: 'bow' },
      },
    ];
    localStorage.setItem('squishy.save.v3', JSON.stringify({
      version: 3,
      library: toys,
      libraryCapacity: 8,
      completedRecipeIds: [],
      unlockedRewardIds: [],
      totalCrafts: 3,
      updatedAt: 3,
    }));
  });
  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '3');
};

test('capture S3 production visual lifecycle', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await bootEmpty(page);
  await advanceToDecor(page, 'heart');
  const shell = page.locator('[data-sandbox-app]');

  await page.locator('[data-decor-eyes="happy"]').click();
  await page.locator('[data-decor-mouth="cat"]').click();
  await page.locator('[data-action="decor-blush"]').click();
  await shot(page, '01-phone-decor-face');

  await page.locator('[data-decor-section="stickers"]').click();
  const box = await canvasBox(page);
  await page.locator('[data-decor-sticker="flower"]').click();
  await page.mouse.click(box.x + box.width * 0.66, box.y + box.height * 0.58);
  await page.locator('[data-decor-sticker="sparkle"]').click();
  await page.mouse.click(box.x + box.width * 0.37, box.y + box.height * 0.42);
  await page.locator('[data-decor-section="accessory"]').click();
  await page.locator('[data-decor-accessory="crown"]').click();
  await shot(page, '02-phone-decor-head');

  await page.locator('[data-action="decor-continue"]').click();
  await page.locator('.sandbox-material[data-material="holo"]').click();
  await shot(page, '03-phone-finish');
  await page.locator('[data-action="save"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'squeeze');

  const squeezeBox = await canvasBox(page);
  const sx = squeezeBox.x + squeezeBox.width * 0.50;
  const sy = squeezeBox.y + squeezeBox.height * 0.38;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(sx + Math.min(78, squeezeBox.width * 0.22), sy + 18, { steps: 10 });
  await shot(page, '04-phone-squeeze-pull');
  await page.mouse.up();

  await seedLibrary(page);
  await shot(page, '05-phone-library-3');
  await page.locator('[data-library-play-id="visual-mochi"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  await shot(page, '06-phone-reopen');

  await page.setViewportSize({ width: 844, height: 390 });
  await bootEmpty(page);
  await advanceToDecor(page, 'mochi');
  await page.locator('[data-decor-eyes="dot"]').click();
  await page.locator('[data-decor-mouth="smile"]').click();
  await page.locator('[data-decor-section="accessory"]').click();
  await page.locator('[data-decor-accessory="cat-ears"]').click();
  await shot(page, '07-landscape-decor');

  await page.setViewportSize({ width: 1280, height: 720 });
  await seedLibrary(page);
  await shot(page, '08-desktop-library');
});
