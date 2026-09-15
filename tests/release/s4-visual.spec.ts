import { expect, test, type Page } from '@playwright/test';
import { createAppearanceStroke, createMixInPlacement } from '../../src/sandbox/appearance';
import { createEmptyDecorDocument } from '../../src/sandbox/decor';
import { SQUISHY_IDEAS } from '../../src/sandbox/ideas';
import type { SavedSquishy } from '../../src/sandbox/types';
import type { SaveStateV3 } from '../../src/platform/saveV3';

const PAGES_URL = '/squishy-squishes/';
const TARGET_ID = 'grape-smooth';
const OUTPUT = 'artifacts/s4-visual';

const makeToy = (index: number): SavedSquishy => ({
  id: `visual-${index}`,
  createdAt: 1_000 + index,
  shapeId: (['soft-square', 'heart', 'mochi'] as const)[index % 3]!,
  materialId: (['soft', 'jelly', 'holo'] as const)[index % 3]!,
  appearance: {
    v: 1,
    strokes: [createAppearanceStroke(
      0,
      [0xd58cff, 0xff79a8, 0x63e6e2][index % 3]!,
      56,
      [
        { u: 0.24, v: 0.34 },
        { u: 0.42, v: 0.50 },
        { u: 0.64, v: 0.60 },
        { u: 0.76, v: 0.44 },
      ],
    )],
    mixins: [createMixInPlacement(index % 2 === 0 ? 'stars' : 'hearts', { u: 0.62, v: 0.66 }, 18, 0.1)],
  },
  decor: {
    ...createEmptyDecorDocument(),
    eyes: index % 2 === 0 ? 'happy' : 'dot',
    mouth: index % 2 === 0 ? 'smile' : 'cat',
    blush: index === 1,
    accessory: (['crown', 'cat-ears', 'bow'] as const)[index % 3]!,
  },
});

const seed = async (page: Page, completedCount: number, toyCount = 0): Promise<void> => {
  const save: SaveStateV3 = {
    version: 3,
    library: Array.from({ length: toyCount }, (_, index) => makeToy(index)),
    libraryCapacity: 8,
    completedRecipeIds: SQUISHY_IDEAS.slice(0, completedCount).map((idea) => idea.id),
    unlockedRewardIds: [],
    totalCrafts: toyCount,
    updatedAt: 12_345,
  };
  await page.goto(PAGES_URL);
  await page.evaluate((value) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('squishy.save.v3', JSON.stringify(value));
  }, save);
  await page.reload();
};

const performRealMix = async (page: Page): Promise<void> => {
  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('Missing sandbox canvas');
  const cx = box.x + box.width * 0.5;
  const cy = box.y + box.height * 0.5;
  const dx = Math.min(72, box.width * 0.2);
  const dy = Math.min(64, box.height * 0.18);
  const points = [[cx + dx, cy], [cx, cy - dy], [cx - dx, cy], [cx, cy + dy]] as const;
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

const paintTarget = async (page: Page): Promise<void> => {
  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('Missing sandbox canvas');
  const cx = box.x + box.width * 0.5;
  const cy = box.y + box.height * 0.5;
  await page.mouse.move(cx - 30, cy - 12);
  await page.mouse.down();
  await page.mouse.move(cx + 36, cy + 15, { steps: 10 });
  await page.mouse.up();
};

const craftMatchingIdea = async (page: Page): Promise<void> => {
  await page.locator('[data-library-ideas]').click();
  await page.locator(`[data-idea-id="${TARGET_ID}"]`).click();
  const shell = page.locator('[data-sandbox-app]');
  await page.locator('[data-action="shape-continue"]').click();
  await paintTarget(page);
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();
  await performRealMix(page);
  await page.locator('[data-action="mix-continue"]').click();
  await page.locator('[data-action="decor-continue"]').click();
  await page.locator('[data-material="soft"]').click();
  await page.locator('[data-action="save"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'squeeze');
  await expect(page.locator('[data-idea-complete]')).toBeVisible();
};

test('capture S4 visual acceptance states', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, 5, 3);
  await page.screenshot({ path: `${OUTPUT}/01-phone-library.png`, fullPage: true });

  await page.locator('[data-library-ideas]').click();
  await page.screenshot({ path: `${OUTPUT}/02-phone-ideas-progress.png`, fullPage: true });

  await page.locator('[data-ideas-back]').click();
  await seed(page, 0, 0);
  await page.locator('[data-library-ideas]').click();
  await page.locator(`[data-idea-id="${TARGET_ID}"]`).click();
  await expect(page.locator('[data-idea-guide]')).toBeVisible();
  await page.screenshot({ path: `${OUTPUT}/03-phone-idea-maker.png`, fullPage: true });

  await seed(page, 0, 0);
  await craftMatchingIdea(page);
  await page.screenshot({ path: `${OUTPUT}/04-phone-complete-squeeze.png`, fullPage: true });

  await page.setViewportSize({ width: 844, height: 390 });
  await seed(page, 8, 3);
  await page.locator('[data-library-ideas]').click();
  await page.screenshot({ path: `${OUTPUT}/05-landscape-ideas.png`, fullPage: true });

  await page.setViewportSize({ width: 1280, height: 720 });
  await seed(page, 12, 3);
  await page.locator('[data-library-ideas]').click();
  await page.screenshot({ path: `${OUTPUT}/06-desktop-ideas.png`, fullPage: true });
});
