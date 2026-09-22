import { expect, test } from '@playwright/test';

/** Actual browser screenshots decide aesthetics; invariants prevent fake 3D results. */
test('desktop: actual Hall and nine 512px candidates share toy and visible size', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/phaser/?volume-probe=1');
  const lab = page.locator('#library-volume-probe');
  await expect(lab).toBeVisible();
  await expect(lab.locator('article canvas')).toHaveCount(10);
  const inspect = () => lab.locator('article canvas').evaluateAll(canvases => canvases.map(canvas => ({
    size: [(canvas as HTMLCanvasElement).width, (canvas as HTMLCanvasElement).height],
    cssWidth: Math.round(canvas.getBoundingClientRect().width),
    profile: (canvas as HTMLCanvasElement).dataset.volumeRenderer,
    materialRenderer: (canvas as HTMLCanvasElement).dataset.libraryRenderer,
    populated: (canvas as HTMLCanvasElement).getContext('2d')!.getImageData(256, 256, 1, 1).data[3] !== 0,
  })));
  const dimensions = await inspect();
  expect(dimensions.map(entry => entry.size)).toEqual(Array.from({ length: 10 }, () => [512, 512]));
  expect(dimensions.map(entry => entry.profile)).toEqual([
    'studio-shader-512', 'flat-control-512', 'sdf-relief-512', 'pseudo-extruded-512',
    'inflated-mesh-512', 'studio-textured-mesh-512', 'unlit-albedo-mesh-512',
    'sdf-field-mesh-512', 'sdf-field-flat-mesh-512', 'contour-mesh-512',
  ]);
  expect(dimensions[0]?.materialRenderer).toBe('studio-shader');
  expect(dimensions.every(entry => entry.cssWidth > 200 && entry.populated)).toBe(true);
  expect(new Set(dimensions.map(entry => entry.cssWidth)).size).toBe(1);
  for (const shape of ['soft-square', 'heart', 'paw'] as const) {
    await lab.locator(`[data-shape="${shape}"]`).click();
    await expect(lab.locator(`[data-shape="${shape}"]`)).toHaveAttribute('aria-pressed', 'true');
    await expect(lab.locator('[data-variant="mesh-neutral"] canvas')).toHaveAttribute('data-volume-renderer', 'unlit-albedo-mesh-512');
    await expect(lab.locator('[data-variant="mesh-field-flat"] canvas')).toHaveAttribute('data-volume-renderer', 'sdf-field-flat-mesh-512');
    await expect(lab.locator('[data-variant="mesh-contour"] canvas')).toHaveAttribute('data-volume-renderer', 'contour-mesh-512');
    // The fixed scrolling overlay exceeds the viewport; capture actual cards.
    for (const variant of ['current', 'mesh', 'mesh-studio', 'mesh-neutral', 'mesh-field-flat', 'mesh-contour'] as const) {
      const card = lab.locator(`[data-variant="${variant}"]`);
      await card.scrollIntoViewIfNeeded();
      await card.screenshot({ path: testInfo.outputPath(`library-hall-volume-desktop-${shape}-${variant}.png`) });
    }
    await page.screenshot({ path: testInfo.outputPath(`library-hall-volume-desktop-${shape}.png`), fullPage: true });
  }
  await lab.locator('[data-legacy]').click();
  await expect(lab.locator('[data-legacy]')).toHaveAttribute('aria-pressed', 'true');
  expect((await inspect())[0]?.size).toEqual([256, 256]);
  expect((await inspect())[9]?.size).toEqual([512, 512]);
  await page.screenshot({ path: testInfo.outputPath('library-hall-volume-diagnostic-256.png'), fullPage: true });
  await lab.locator('[data-legacy]').click();
  expect((await inspect())[0]?.size).toEqual([512, 512]);
  expect(errors).toEqual([]);
});

test('phone: ten-way comparison closes without touching saved Hall', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/phaser/?volume-probe=1');
  const lab = page.locator('#library-volume-probe');
  await expect(lab.locator('article canvas')).toHaveCount(10);
  await lab.locator('[data-shape="heart"]').click();
  for (const variant of ['current', 'hires', 'relief', 'extruded', 'mesh', 'mesh-studio', 'mesh-neutral', 'mesh-field', 'mesh-field-flat', 'mesh-contour'] as const) {
    const card = lab.locator(`[data-variant="${variant}"]`);
    await card.scrollIntoViewIfNeeded();
    await card.screenshot({ path: testInfo.outputPath(`library-hall-volume-phone-heart-${variant}.png`) });
  }
  await lab.locator('[data-close]').click();
  await expect(lab).toHaveCount(0);
  await expect(page.locator('.sandbox-library-shell')).toBeVisible();
  expect(new URL(page.url()).searchParams.has('volume-probe')).toBe(false);
});