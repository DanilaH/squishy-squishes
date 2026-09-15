import { expect, test, type Page } from '@playwright/test';
import { createAppearanceStroke, createMixInPlacement, type AppearanceDocumentV1 } from '../../src/sandbox/appearance';
import { createDefaultSaveV3, type SaveStateV3 } from '../../src/platform/saveV3';
import type { SavedSquishy } from '../../src/sandbox/types';

const URL = '/squishy-squishes/';
const OUT = 's2-visuals';

const shapes = ['soft-square', 'heart', 'mochi', 'peach', 'mushroom', 'paw'] as const;
const materials = ['soft', 'jelly', 'holo'] as const;
const colors = [0xd58cff, 0x63e6e2, 0xff79a8, 0x92df83, 0xffc857, 0x7d8cff] as const;
const mixins = ['glitter', 'stars', 'foam', 'pearls', 'hearts', 'confetti'] as const;

const appearance = (index: number): AppearanceDocumentV1 => ({
  v: 1,
  strokes: [
    createAppearanceStroke(0, colors[index % colors.length]!, 56, [
      { u: 0.18, v: 0.30 }, { u: 0.32, v: 0.38 }, { u: 0.48, v: 0.48 }, { u: 0.66, v: 0.58 }, { u: 0.82, v: 0.70 },
    ]),
    createAppearanceStroke(0, colors[(index + 2) % colors.length]!, 34, [
      { u: 0.24, v: 0.72 }, { u: 0.40, v: 0.62 }, { u: 0.58, v: 0.50 }, { u: 0.76, v: 0.38 },
    ]),
  ],
  mixins: Array.from({ length: 9 }, (_, offset) => createMixInPlacement(
    mixins[(index + offset) % mixins.length]!,
    { u: 0.20 + ((offset * 19) % 58) / 100, v: 0.22 + ((offset * 23) % 54) / 100 },
    14 + (offset % 4) * 3,
    (offset * 0.13) % 1,
  )),
});

const toy = (index: number): SavedSquishy => ({
  id: `visual-${index}`,
  createdAt: 1_000 + index,
  shapeId: shapes[index % shapes.length]!,
  materialId: materials[index % materials.length]!,
  appearance: appearance(index),
});

const save = (count: number): SaveStateV3 => ({
  ...createDefaultSaveV3(),
  library: Array.from({ length: count }, (_, index) => toy(index)),
  libraryCapacity: 8,
  totalCrafts: count,
  updatedAt: 10_000,
});

const seed = async (page: Page, state: SaveStateV3): Promise<void> => {
  await page.goto(URL);
  await page.evaluate((value) => {
    localStorage.clear();
    localStorage.setItem('squishy.save.v3', JSON.stringify(value));
  }, state);
  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
};

const clear = async (page: Page): Promise<void> => {
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
};

const finishDraftAtFullCapacity = async (page: Page): Promise<void> => {
  await page.locator('[data-library-new]').first().click();
  const shell = page.locator('[data-sandbox-app]');
  await page.locator('.sandbox-shape[data-shape="paw"]').click();
  await page.locator('[data-action="shape-continue"]').click();
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'mix');
  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('Missing sandbox canvas');
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const points = [[cx + 64, cy], [cx, cy - 58], [cx - 64, cy], [cx, cy + 58]] as const;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let index = 0; index < 38; index += 1) {
    const [x, y] = points[index % points.length]!;
    await page.mouse.move(x, y, { steps: 2 });
  }
  await page.mouse.up();
  await expect.poll(async () => Number(await shell.getAttribute('data-mix-progress'))).toBeGreaterThanOrEqual(1);
  await page.locator('[data-action="mix-continue"]').click();
  await page.locator('.sandbox-material[data-material="holo"]').click();
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-library-replace-overlay]')).toBeVisible();
};

test('capture S2 production visuals', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await clear(page);
  await page.screenshot({ path: `${OUT}/01-empty-phone.png`, fullPage: true });

  await seed(page, save(3));
  await page.screenshot({ path: `${OUT}/02-three-phone.png`, fullPage: true });

  const secondId = 'visual-1';
  await page.locator(`[data-library-delete-id="${secondId}"]`).click();
  await page.screenshot({ path: `${OUT}/03-delete-confirm-phone.png`, fullPage: true });
  await page.locator('[data-library-delete-cancel]').click();

  await page.locator(`[data-library-play-id="${secondId}"]`).click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  await page.screenshot({ path: `${OUT}/04-non-latest-squeeze-phone.png`, fullPage: true });

  await seed(page, save(8));
  await page.screenshot({ path: `${OUT}/05-full-eight-phone.png`, fullPage: true });
  await finishDraftAtFullCapacity(page);
  await page.screenshot({ path: `${OUT}/06-replace-phone.png`, fullPage: true });

  await page.setViewportSize({ width: 844, height: 390 });
  await seed(page, save(8));
  await page.screenshot({ path: `${OUT}/07-full-landscape.png`, fullPage: true });

  await page.setViewportSize({ width: 1280, height: 720 });
  await seed(page, save(3));
  await page.screenshot({ path: `${OUT}/08-three-desktop.png`, fullPage: true });
});
