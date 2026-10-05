import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { SHAPES } from '../../src/game/shapes';
import { createDefaultSaveV3 } from '../../src/platform/saveV3';
import { createEmptyDecorDocument } from '../../src/sandbox/decor';

for (const accessory of ['bow', 'crown', 'cat-ears', 'bunny-ears', 'horns'] as const) test(`all fifteen molds preserve ${accessory} seats and depth through real squeeze`, async ({ page }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/squishy-squishes/');
    await page.evaluate(value => localStorage.setItem('squishy.save.v3', JSON.stringify(value)), {
      ...createDefaultSaveV3(), totalCrafts: 8,
      libraryCapacity: 24, library: SHAPES.map((shape, n) => ({ id: shape.id, createdAt: 1700000000000 + n, shapeId: shape.id, materialId: 'soft',
        appearance: { v: 1, strokes: [], mixins: [] }, decor: { ...createEmptyDecorDocument(), accessory } })),
    });
    for (const shape of SHAPES) {
      await page.reload();
      const play = page.locator(`[data-library-play-id="${shape.id}"]`);
      await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-hall-mounted', 'true');
      const rooms = Number(await page.locator('[data-sandbox-library]').getAttribute('data-library-hall-rooms'));
      for (let n = 0; n < rooms - 1 && !await play.isVisible(); n++) await page.locator('[data-library-hall-next]').click();
      await mkdir('migration-baseline-evidence', { recursive: true });
      await page.screenshot({ path: `migration-baseline-evidence/decor-hall-${shape.id}-${accessory}.png` });
      await play.click();
      const gear = page.locator('[data-sandbox-accessory]');
      await expect.poll(() => gear.getAttribute('data-accessory-matrix')).not.toBeNull();
      const bodyDepth = await page.locator('[data-sandbox-canvas]').evaluate(el => Number(getComputedStyle(el).zIndex));
      const gearDepth = await gear.evaluate(el => Number(getComputedStyle(el).zIndex));
      if (accessory === 'bow' || accessory === 'crown') expect(gearDepth).toBeGreaterThan(bodyDepth);
      else expect(gearDepth).toBeLessThan(bodyDepth);
      await expect(gear).toHaveAttribute('data-accessory-depth', accessory === 'bow' || accessory === 'crown' ? 'front' : 'rear');
      if (accessory !== 'bow' && accessory !== 'crown') {
        const right = page.locator('[data-accessory-part="right"]'); await expect(right).toBeVisible();
        expect(Number(await gear.getAttribute('data-accessory-anchor-x'))).toBeLessThan(Number(await right.getAttribute('data-accessory-anchor-x')));
      }
      await mkdir('migration-baseline-evidence', { recursive: true });
      await page.screenshot({ path: `migration-baseline-evidence/decor-seats-${shape.id}-${accessory}.png` });
    }
});
