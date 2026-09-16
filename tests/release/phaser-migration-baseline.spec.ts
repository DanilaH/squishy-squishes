import { expect, test } from '@playwright/test';

import { MATERIALS } from '../../src/game/content';
import { SHAPES, createShapeField } from '../../src/game/shapes';
import {
  createAppearanceStroke,
  createMixInPlacement,
} from '../../src/sandbox/appearance';
import { createEmptyDecorDocument, createStickerPlacement } from '../../src/sandbox/decor';
import type { SavedSquishy } from '../../src/sandbox/types';
import {
  SAVE_V3_STORAGE_KEY,
  createDefaultSaveV3,
  decodeSaveStateV3,
  encodeSaveStateV3,
  type SaveStateV3,
} from '../../src/platform/saveV3';
import {
  S5_SHELF_EXPANSION_REWARD_ID,
  grantS5ShelfExpansion,
} from '../../src/platform/saveV3Rewards';

// These fixtures are synthetic. Never extract a real player's local/cloud save for migration QA.
const decoratedToy = (): SavedSquishy => ({
  id: 'baseline-toy-0',
  createdAt: 1_700_000_000_000,
  shapeId: 'soft-square',
  materialId: 'soft',
  appearance: {
    v: 1,
    strokes: [createAppearanceStroke(0, 0xd58cff, 34, [
      { u: 0.2, v: 0.2 }, { u: 0.5, v: 0.6 }, { u: 0.8, v: 0.8 },
    ])],
    mixins: [createMixInPlacement('pearls', { u: 0.4, v: 0.55 }, 18, 0.25)],
  },
  decor: {
    ...createEmptyDecorDocument(),
    eyes: 'happy',
    mouth: 'smile',
    blush: true,
    stickers: [createStickerPlacement('heart', { u: 0.6, v: 0.35 }, 0)],
    accessory: 'cat-ears',
  },
});

const fullShelf = (): SaveStateV3 => {
  const primary = decoratedToy();
  const library: SavedSquishy[] = Array.from({ length: 8 }, (_, index) => ({
    ...(index === 0 ? primary : {
      ...primary,
      appearance: { v: 1 as const, strokes: [], mixins: [] },
      decor: createEmptyDecorDocument(),
    }),
    id: `baseline-toy-${index}`,
    createdAt: primary.createdAt + index,
    shapeId: SHAPES[index % SHAPES.length]!.id,
    materialId: MATERIALS[index % MATERIALS.length]!.id,
  }));
  return {
    ...createDefaultSaveV3(),
    library,
    totalCrafts: 8,
    updatedAt: 1_700_000_001_000,
  };
};

test('M0: current save key, shape/material IDs and textured V3 document remain readable', () => {
  expect(SAVE_V3_STORAGE_KEY).toBe('squishy.save.v3');
  expect(SHAPES.map((shape) => shape.id)).toEqual([
    'soft-square', 'heart', 'mochi', 'peach', 'mushroom', 'paw',
  ]);
  expect(MATERIALS.map((material) => material.id)).toEqual([
    'soft', 'jelly', 'holo', 'marshmallow', 'pearl', 'chrome',
  ]);
  const oldState = fullShelf();
  const serialized = JSON.stringify(encodeSaveStateV3(oldState));
  const decoded = decodeSaveStateV3(JSON.parse(serialized) as unknown);
  expect(decoded).toEqual(oldState);
  expect(decoded.library.map((toy) => toy.id)).toEqual(oldState.library.map((toy) => toy.id));
  expect(decoded.library[0]?.appearance).toEqual(decoratedToy().appearance);
  expect(decoded.library[0]?.decor).toEqual(decoratedToy().decor);
});

test('M0: reward capacity upgrade is durable, idempotent and keeps all existing toys', () => {
  const before = fullShelf();
  const granted = grantS5ShelfExpansion(before, 1_700_000_002_000);
  expect(granted.libraryCapacity).toBe(10);
  expect(granted.unlockedRewardIds).toEqual([S5_SHELF_EXPANSION_REWARD_ID]);
  expect(granted.library).toEqual(before.library);
  const decoded = decodeSaveStateV3(encodeSaveStateV3(granted));
  expect(decoded).toEqual(granted);
  expect(grantS5ShelfExpansion(decoded, 1_700_000_003_000)).toBe(decoded);
  expect(before.libraryCapacity).toBe(8);
});

test('M0: all canonical shape-field textures are reproducible and nonempty', () => {
  for (const shape of SHAPES) {
    const first = createShapeField(shape, 128);
    expect(first.length, shape.id).toBe(128 * 128);
    expect(first.some((pixel) => pixel > 0), shape.id).toBe(true);
    expect(first.some((pixel) => pixel === 0), shape.id).toBe(true);
    expect(createShapeField(shape, 128), shape.id).toEqual(first);
  }
});

for (const viewport of [
  { name: 'portrait-phone', width: 390, height: 844 },
  { name: 'desktop', width: 1100, height: 760 },
  { name: 'existing-landscape', width: 844, height: 390 },
]) {
  test(`M0: old renderer/layout evidence at ${viewport.name}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/squishy-squishes/');
    await expect(page.locator('[data-sandbox-library]')).toBeVisible();
    await page.locator('[data-library-new]').first().click();
    await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'shape');
    const canvas = page.locator('[data-sandbox-canvas]');
    await expect(canvas).toBeVisible();
    await expect(page.locator('[data-shape]')).toHaveCount(6);
    expect(await canvas.evaluate((node) => (node as HTMLCanvasElement)
      .getContext('webgl2')?.getContextAttributes()?.alpha)).toBe(true);
    const box = await canvas.boundingBox();
    expect(box?.width).toBeGreaterThan(100);
    expect(box?.height).toBeGreaterThan(100);
    await page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
    await testInfo.attach(`old-engine-${viewport.name}`, {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  });
}

test('M0: a Paint stroke beginning outside the silhouette starts on entry', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/squishy-squishes/');
  await page.locator('[data-library-new]').first().click();
  await page.locator('[data-action="shape-continue"]').click();
  const shell = page.locator('[data-sandbox-app]');
  await expect(shell).toHaveAttribute('data-stage', 'paint');
  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('Missing original squishy canvas');
  await page.mouse.move(box.x + 5, box.y + 5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect(shell).toHaveAttribute('data-paint-strokes', '1');
});
