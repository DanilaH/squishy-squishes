import { expect, test, type Page } from '@playwright/test';
import { completeRecipeIdea } from '../../src/platform/saveV3Ideas';
import { createDefaultSaveV3 } from '../../src/platform/saveV3';
import { SQUISHY_IDEAS, matchSquishyIdea } from '../../src/sandbox/ideas';
import { getSquishyTitle } from '../../src/sandbox/titles';
import { createAppearanceStroke } from '../../src/sandbox/appearance';
import { createEmptyDecorDocument } from '../../src/sandbox/decor';
import type { SandboxDraft } from '../../src/sandbox/types';

const PAGES_URL = '/squishy-squishes/';
const TARGET_ID = 'grape-smooth';

const resetPages = async (page: Page): Promise<void> => {
  await page.goto(PAGES_URL);
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
};

const seedCompleted = async (page: Page, ids: readonly string[]): Promise<void> => {
  await page.goto(PAGES_URL);
  await page.evaluate((completedRecipeIds) => {
    localStorage.clear();
    localStorage.setItem('squishy.save.v3', JSON.stringify({
      version: 3,
      library: [],
      libraryCapacity: 8,
      completedRecipeIds,
      unlockedRewardIds: [],
      totalCrafts: 0,
      updatedAt: 1,
    }));
  }, ids);
  await page.reload();
};

const performRealMix = async (page: Page): Promise<void> => {
  const canvas = page.locator('[data-sandbox-canvas]');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Missing sandbox canvas');
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

const paintDefaultGrapeStroke = async (page: Page): Promise<void> => {
  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('Missing sandbox canvas');
  const cx = box.x + box.width * 0.5;
  const cy = box.y + box.height * 0.5;
  await page.mouse.move(cx - 22, cy - 8);
  await page.mouse.down();
  await page.mouse.move(cx + 24, cy + 10, { steps: 8 });
  await page.mouse.up();
};

const startTargetIdea = async (page: Page): Promise<void> => {
  await page.locator('[data-library-ideas]').click();
  await expect(page.locator('[data-sandbox-ideas]')).toHaveAttribute('data-ideas-count', '24');
  await page.locator(`[data-idea-id="${TARGET_ID}"]`).click();
  const shell = page.locator('[data-sandbox-app]');
  await expect(shell).toHaveAttribute('data-stage', 'shape');
  await expect(shell).toHaveAttribute('data-shape', 'soft-square');
  await expect(page.locator('[data-idea-guide]')).toHaveAttribute('data-idea-active', TARGET_ID);
  await expect(page.locator('.sandbox-shape')).toHaveCount(6);
  await expect(page.locator('.sandbox-shape:disabled')).toHaveCount(0);
};

const finishAndSave = async (page: Page): Promise<void> => {
  const shell = page.locator('[data-sandbox-app]');
  await page.locator('[data-action="shape-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'paint');
  await paintDefaultGrapeStroke(page);
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'mix');
  await performRealMix(page);
  await page.locator('[data-action="mix-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'decor');
  await page.locator('[data-action="decor-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'finish');
  await page.locator('.sandbox-material[data-material="soft"]').click();
  await page.locator('[data-action="save"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'squeeze');
};

test('S4 domain keeps Ideas optional, metadata-based and idempotent', () => {
  expect(SQUISHY_IDEAS).toHaveLength(24);
  const idea = SQUISHY_IDEAS.find((candidate) => candidate.id === TARGET_ID);
  expect(idea).toBeTruthy();
  if (!idea) return;

  const draft: SandboxDraft = {
    shapeId: 'soft-square',
    materialId: 'soft',
    appearance: {
      v: 1,
      strokes: [createAppearanceStroke(0, 0xd58cff, 34, [{ u: 0.4, v: 0.5 }, { u: 0.6, v: 0.5 }])],
      mixins: [],
    },
    decor: createEmptyDecorDocument(),
  };
  expect(matchSquishyIdea(draft, idea)).toEqual({
    shape: true,
    paint: true,
    material: true,
    mixin: true,
    complete: true,
  });
  expect(matchSquishyIdea({ ...draft, shapeId: 'heart' }, idea).complete).toBe(false);

  const once = completeRecipeIdea(createDefaultSaveV3(), TARGET_ID, 10);
  const twice = completeRecipeIdea(once, TARGET_ID, 20);
  expect(once.completedRecipeIds).toEqual([TARGET_ID]);
  expect(twice).toBe(once);
  expect(() => completeRecipeIdea(createDefaultSaveV3(), 'not-a-real-idea')).toThrow();
});

test('S4 title ladder is deterministic at all product thresholds', () => {
  const cases = [
    [0, 'Rookie', 'Новичок'],
    [2, 'Young Squisher', 'Молодой сквишер'],
    [5, 'Squisher', 'Жмякатель'],
    [8, 'Squishy Stylist', 'Сквиш-стилист'],
    [12, 'Cool Squisher', 'Крутой сквишер'],
    [16, 'Squish Mogul', 'Сквишер-могер'],
    [20, 'Squish Master', 'Мастер жмяка'],
    [24, 'Supreme Squisher', 'Верховный сквишер'],
  ] as const;
  for (const [count, en, ru] of cases) {
    expect(getSquishyTitle(count, 'en')).toBe(en);
    expect(getSquishyTitle(count, 'ru')).toBe(ru);
  }
});

test('S4 Ideas are secondary to Library, expose all 24 targets and return safely', async ({ page }) => {
  await resetPages(page);
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
  await expect(page.locator('[data-library-new]').first()).toBeVisible();
  await expect(page.locator('[data-library-ideas]')).toBeVisible();

  await page.locator('[data-library-ideas]').click();
  const ideas = page.locator('[data-sandbox-ideas]');
  await expect(ideas).toHaveAttribute('data-ideas-count', '24');
  await expect(page.locator('.sandbox-idea-card')).toHaveCount(24);
  await page.locator('[data-ideas-back]').click();
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
});

test('S4 Idea mode never gates the maker: player can choose a different shape and save normally', async ({ page }) => {
  await resetPages(page);
  await startTargetIdea(page);
  const shell = page.locator('[data-sandbox-app]');
  await page.locator('[data-shape="heart"]').click();
  await expect(shell).toHaveAttribute('data-shape', 'heart');
  await finishAndSave(page);

  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('squishy.save.v3') ?? 'null') as {
    library: unknown[];
    completedRecipeIds: string[];
  });
  expect(save.library).toHaveLength(1);
  expect(save.completedRecipeIds).not.toContain(TARGET_ID);
  await expect(page.locator('[data-idea-complete]')).toHaveCount(0);
});

test('S4 matching Idea completes only after successful save and survives reload', async ({ page }) => {
  await resetPages(page);
  await startTargetIdea(page);

  let beforeSave = await page.evaluate(() => JSON.parse(localStorage.getItem('squishy.save.v3') ?? 'null') as {
    completedRecipeIds: string[];
  });
  expect(beforeSave.completedRecipeIds).not.toContain(TARGET_ID);

  await finishAndSave(page);
  await expect(page.locator('[data-idea-complete]')).toBeVisible();
  const afterSave = await page.evaluate(() => JSON.parse(localStorage.getItem('squishy.save.v3') ?? 'null') as {
    completedRecipeIds: string[];
  });
  expect(afterSave.completedRecipeIds.filter((id) => id === TARGET_ID)).toHaveLength(1);

  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
  await page.locator('[data-library-ideas]').click();
  await expect(page.locator(`[data-idea-id="${TARGET_ID}"]`)).toHaveClass(/is-complete/);
  await expect(page.locator('[data-sandbox-ideas]')).toHaveAttribute('data-completed-count', '1');
});

test('S4 repeating an already completed Idea never duplicates completion', async ({ page }) => {
  await seedCompleted(page, [TARGET_ID]);
  await startTargetIdea(page);
  await finishAndSave(page);
  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('squishy.save.v3') ?? 'null') as {
    completedRecipeIds: string[];
  });
  expect(save.completedRecipeIds.filter((id) => id === TARGET_ID)).toHaveLength(1);
  await expect(page.locator('[data-idea-complete]')).toHaveCount(0);
});

test('S4 Library title reflects migrated/completed Idea credit', async ({ page }) => {
  const ids = SQUISHY_IDEAS.slice(0, 5).map((idea) => idea.id);
  await seedCompleted(page, ids);
  await expect(page.locator('.sandbox-library-status')).toContainText('Squisher');
  await page.locator('[data-library-ideas]').click();
  await expect(page.locator('[data-sandbox-ideas]')).toHaveAttribute('data-completed-count', '5');
});

for (const viewport of [
  { name: 'phone portrait', width: 390, height: 844 },
  { name: 'short landscape', width: 844, height: 390 },
  { name: 'desktop', width: 1280, height: 720 },
] as const) {
  test(`S4 Ideas surface has no horizontal overflow on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await resetPages(page);
    await page.locator('[data-library-ideas]').click();
    await expect(page.locator('[data-sandbox-ideas]')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
    await expect(page.locator('[data-ideas-back]')).toBeVisible();
    await expect(page.locator('.sandbox-idea-card').first()).toBeVisible();
  });
}
