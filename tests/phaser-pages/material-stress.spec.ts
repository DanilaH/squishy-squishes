import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { createAppearanceStroke, createBodyFillStroke } from '../../src/sandbox/appearance';

test.skip(process.env.MATERIAL_STRESS !== '1', 'owner-only material stress review');

test('owner material stress matrix keeps authored colour legible across six materials', async ({ page }, info) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 900, height: 900 });
  await page.goto('/phaser/');
  await page.locator('[data-library-new]').first().click();
  await page.locator('[data-action="shape-continue"]').click();
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();

  const mixSurface = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!mixSurface) throw new Error('Missing mix surface for material stress seed');
  const mixX = mixSurface.x + mixSurface.width / 2;
  const mixY = mixSurface.y + mixSurface.height / 2;
  await page.mouse.move(mixX, mixY);
  await page.mouse.down();
  for (let index = 0; index < 24; index += 1) {
    await page.mouse.move(mixX + (index % 2 ? -80 : 80), mixY, { steps: 3 });
  }
  await page.mouse.up();
  await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
  await page.locator('[data-action="mix-continue"]').click();
  await page.locator('[data-action="decor-continue"]').click();
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');

  const triBand = (color: number, v: number) => [
    createAppearanceStroke(0, color, 118, [{ u: .02, v }, { u: .98, v }]),
    createAppearanceStroke(0, color, 118, [{ u: .02, v }, { u: .98, v }]),
  ];
  const scenarios = [
    { id: 'yellow', strokes: [createBodyFillStroke(0xffdc70)] },
    {
      id: 'tri-colour',
      strokes: [
        ...triBand(0x92df83, .18),
        ...triBand(0x63e6e2, .50),
        ...triBand(0xff79a8, .82),
      ],
    },
    { id: 'near-white', strokes: [createBodyFillStroke(0xf8f1df)] },
    { id: 'dark-purple', strokes: [createBodyFillStroke(0x4d286d)] },
  ] as const;
  const materials = ['soft', 'jelly', 'marshmallow', 'pearl', 'holo', 'chrome'] as const;
  const key = 'squishy.phaser-pages-preview.squishy.save.v3';

  for (const scenario of scenarios) {
    await page.evaluate(({ storageKey, id, strokes, materialIds }) => {
      const save = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
      if (!save || save.library.length < 1) throw new Error('Missing real saved seed toy');
      const seed = save.library[0];
      save.library = materialIds.map((materialId: string) => ({
        ...seed,
        id: `material-stress-${id}-${materialId}`,
        materialId,
        appearance: { ...seed.appearance, strokes },
      }));
      localStorage.setItem(storageKey, JSON.stringify(save));
    }, { storageKey: key, id: scenario.id, strokes: scenario.strokes, materialIds: materials });

    await page.reload();
    await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '6');

    for (const material of materials) {
      const pngBase64 = await page.locator(`[data-library-play-id="material-stress-${scenario.id}-${material}"] canvas`)
        .evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL('image/png').split(',')[1]);
      if (!pngBase64) throw new Error(`Empty stress thumbnail: ${scenario.id}/${material}`);
      await writeFile(
        info.outputPath(`library-hall-material-stress-${scenario.id}-hall-${material}.png`),
        Buffer.from(pngBase64, 'base64'),
      );

      // Fixture navigation only: Hall pagination/interactivity is verified elsewhere.
      await page.locator(`[data-library-play-id="material-stress-${scenario.id}-${material}"]`)
        .evaluate((button) => (button as HTMLButtonElement).click());
      await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
      await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-material', material);
      await page.locator('[data-sandbox-canvas]').screenshot({
        path: info.outputPath(`library-hall-material-stress-${scenario.id}-studio-${material}.png`),
        animations: 'disabled',
      });
      await page.locator('[data-action="home"]').click();
      await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '6');
    }
  }
});
