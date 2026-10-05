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

test('Hall frames the whole craft when freely enlarged decorations extend beyond its body', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/squishy-squishes/');
  const ordinary = { id: 'ordinary', createdAt: 1700000000000, shapeId: 'mochi', materialId: 'soft',
    appearance: { v: 1, strokes: [], mixins: [] }, decor: createEmptyDecorDocument() };
  const rich = { ...ordinary, id: 'wide-craft', decor: { ...ordinary.decor, accessories: [
    { a: 'handbag', x: 8, y: 245, s: 2.5, r: -.7, side: 'whole', color: 0xa1e2ce },
    { a: 'wings', x: 247, y: 140, s: 2.5, r: .8, side: 'right' },
  ] } };
  await page.evaluate(value => localStorage.setItem('squishy.save.v3', JSON.stringify(value)),
    { ...createDefaultSaveV3(), totalCrafts: 2, library: [ordinary, rich] });
  await page.reload();
  const old = page.locator('[data-library-play-id="ordinary"] canvas'), craft = page.locator('[data-library-play-id="wide-craft"] canvas');
  await expect(old).toHaveAttribute('data-library-craft-scale', '1.0000');
  await expect.poll(async () => Number(await craft.getAttribute('data-library-craft-scale'))).toBeLessThan(.8);
  const edge = await craft.evaluate((canvas: HTMLCanvasElement) => {
    const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    let opaque = 0, clipped = 0, left = canvas.width, right = 0;
    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
      const alpha = data[(y * canvas.width + x) * 4 + 3]!;
      if (alpha > 20) { opaque++; left = Math.min(left, x); right = Math.max(right, x + 1); }
      if (alpha > 20 && (x === 0 || y === 0 || x === canvas.width - 1 || y === canvas.height - 1)) clipped++;
    }
    const rect = canvas.getBoundingClientRect(), card = canvas.closest('button')!.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    return { opaque, clipped,
      displayedLeft: rect.x + rect.width / 2 + (left / canvas.width - .5) * size,
      displayedRight: rect.x + rect.width / 2 + (right / canvas.width - .5) * size,
      cardLeft: card.left, cardRight: card.right };
  });
  expect(edge.opaque).toBeGreaterThan(5000); expect(edge.clipped).toBe(0);
  expect(edge.displayedLeft).toBeGreaterThanOrEqual(edge.cardLeft + 1);
  expect(edge.displayedRight).toBeLessThanOrEqual(edge.cardRight - 1);
  await page.locator('[data-library-play-id="wide-craft"]').screenshot({ path: 'migration-baseline-evidence/free-craft/wide-hall.png' });
});

test('new front and rear gear stays attached through full-screen downward pulls', async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 }); await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/squishy-squishes/');
  for (const shapeId of ['paw', 'donut', 'ice-cream'] as const) {
    const shape = SHAPES.find(shape => shape.id === shapeId)!;
    const toy = { id: 'pull-gear', createdAt: 1700000000000, shapeId, materialId: 'jelly',
      appearance: { v: 1, strokes: [createBodyFillStroke(0xffb7cf)], mixins: [] },
      decor: { ...createEmptyDecorDocument(), eyes: 'dot', mouth: 'smile', accessories:
        (['handbag', 'wings', 'crown'] as const).flatMap(id => initialAccessoryPlacements(shape, id)) } };
    await page.evaluate(value => localStorage.setItem('squishy.save.v3', JSON.stringify(value)),
      { ...createDefaultSaveV3(), totalCrafts: 1, library: [toy] });
    await page.reload(); await page.locator('[data-library-play-id="pull-gear"]').click();
    const canvas = page.locator('[data-sandbox-canvas]'), shell = page.locator('[data-sandbox-app]');
    await expect(canvas).toHaveAttribute('data-phaser-ready', 'true');
    const box = (await canvas.boundingBox())!;
    const x = box.x + box.width / 2 + (shapeId === 'donut' ? 70 : 0), y = box.y + box.height / 2;
    await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 60, 820, { steps: 20 });
    await expect(shell).toHaveAttribute('data-squish-active', 'true');
    await page.screenshot({ path: `migration-baseline-evidence/free-craft/${shapeId}-gear-down.png` });
    const positions = await page.locator('[data-accessory-index]').evaluateAll(nodes => nodes.map(node => {
      const rect = node.getBoundingClientRect(); return [rect.x, rect.y, rect.width, rect.height];
    }));
    expect(positions.flat().every(Number.isFinite)).toBe(true);
    await page.mouse.up(); await expect(shell).toHaveAttribute('data-squish-active', 'false');
    expect(decodeSaveStateV3(await page.evaluate(() => JSON.parse(localStorage.getItem('squishy.save.v3')!))).library[0]).toEqual(toy);
  }
});
