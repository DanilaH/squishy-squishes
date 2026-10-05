import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { SHAPES, isPointInsideShape } from '../../src/game/shapes';
import { ACCESSORY_IDS, createEmptyDecorDocument } from '../../src/sandbox/decor';
import { initialAccessoryPlacements } from '../../src/sandbox/freeCraft';
import { getAccessoryDepth } from '../../src/sandbox/accessorySeats';
import { createDefaultSaveV3, decodeSaveStateV3 } from '../../src/platform/saveV3';
import { createBodyFillStroke, createMixInPlacement, MIXIN_IDS } from '../../src/sandbox/appearance';

test('every accessory has finite individual seats and keeps its specified layer on all fifteen molds', () => {
  for (const shape of SHAPES) for (const accessory of ACCESSORY_IDS) {
    const placements = initialAccessoryPlacements(shape, accessory);
    expect(placements.length).toBe(['cat-ears', 'bunny-ears', 'horns', 'leaves', 'wings'].includes(accessory) ? 2 : 1);
    for (const placement of placements) {
      expect(Number.isFinite(placement.r)).toBe(true);
      expect(placement.x).toBeGreaterThanOrEqual(0); expect(placement.x).toBeLessThanOrEqual(255);
      expect(placement.y).toBeGreaterThanOrEqual(0); expect(placement.y).toBeLessThanOrEqual(255);
      // Roots must attach to pigment, allowing one quantization pixel of contour tolerance.
      const x = placement.x / 255 * 2 - 1, y = placement.y / 255 * 2 - 1;
      expect([-1, 0, 1].some(dx => [-1, 0, 1].some(dy => isPointInsideShape(shape, x + dx * .012, y + dy * .012))), `${shape.id}/${accessory} root`).toBe(true);
    }
    expect(getAccessoryDepth(accessory)).toBe(['cat-ears', 'bunny-ears', 'horns', 'wings'].includes(accessory) ? 'rear' : 'front');
  }
});

test('rich new-content toys keep identity, face priority and complete gear across Hall, edit, Finish and reload', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/squishy-squishes/');
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const groups = [['glasses', 'butterfly', 'wings'], ['headphones', 'heart-patch'], ['bucket-hat', 'handbag'], ['cream', 'cherry'], ['petal-flower', 'leaves']] as const;
  const library = SHAPES.map((shape, i) => ({
    id: `new-content-${shape.id}`, createdAt: 1700000000000 + i, shapeId: shape.id, materialId: 'soft',
    appearance: { v: 1, strokes: [createBodyFillStroke([0xffb7cf, 0xcab0e8, 0xb6e4ce, 0xffd2ae][i % 4]!)],
      mixins: MIXIN_IDS.slice(6).map((id, j) => createMixInPlacement(id, { u: .28 + j % 4 * .14, v: .33 + Math.floor(j / 4) * .19 }, 13, j / 7)) },
    decor: { ...createEmptyDecorDocument(), eyes: 'dot', mouth: 'smile', blush: true,
      accessories: groups[i % groups.length]!.flatMap(id => initialAccessoryPlacements(shape, id)) },
  }));
  const save = { ...createDefaultSaveV3(), libraryCapacity: 24, totalCrafts: 15, library };
  decodeSaveStateV3(save);
  await page.evaluate(value => localStorage.setItem('squishy.save.v3', JSON.stringify(value)), save);
  await page.reload(); await mkdir('migration-baseline-evidence/free-craft', { recursive: true });
  for (const toy of library) {
    await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-hall-mounted', 'true');
    const play = page.locator(`[data-library-play-id="${toy.id}"]`);
    for (let n = 0; n < Math.ceil(library.length / 2) && !await play.isVisible(); n++) await page.locator('[data-library-hall-next]').click();
    await play.screenshot({ path: `migration-baseline-evidence/free-craft/${toy.shapeId}-hall.png` });
    await play.click(); await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
    await expect(page.locator('[data-accessory-index]')).toHaveCount(toy.decor.accessories.length);
    await expect(page.locator('.free-face-foreground')).toBeVisible();
    const depths = await page.locator('[data-accessory-index]').evaluateAll(nodes => nodes.map(node => Number(getComputedStyle(node).zIndex)));
    expect(Number(await page.locator('.free-face-foreground').evaluate(node => getComputedStyle(node).zIndex))).toBeGreaterThan(Math.max(...depths));
    await page.screenshot({ path: `migration-baseline-evidence/free-craft/${toy.shapeId}-squeeze.png` });
    await page.locator('[data-action="edit-saved"]').click();
    await page.locator('[data-action="decor-continue"]').click();
    await page.screenshot({ path: `migration-baseline-evidence/free-craft/${toy.shapeId}-finish.png` });
    await page.reload();
  }
  expect(decodeSaveStateV3(await page.evaluate(() => JSON.parse(localStorage.getItem('squishy.save.v3')!))).library).toEqual(library);
  expect(errors).toEqual([]);
});
