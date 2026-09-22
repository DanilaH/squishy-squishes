import { expect, test } from '@playwright/test';

/** Screenshots, not numeric shader scores, decide this experiment's visual value. */
test('desktop same-toy 256px / 512px flat / 512px relief comparison across three shapes', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/phaser-pages.html?volume-probe=1');
  const lab = page.locator('#library-volume-probe');
  await expect(lab).toBeVisible();
  await expect(lab.locator('article canvas')).toHaveCount(3);
  const dimensions = await lab.locator('article canvas').evaluateAll(canvases => canvases.map(canvas => ({
    size: [(canvas as HTMLCanvasElement).width, (canvas as HTMLCanvasElement).height],
    cssWidth: Math.round(canvas.getBoundingClientRect().width),
    profile: (canvas as HTMLCanvasElement).dataset.volumeRenderer,
    populated: (canvas as HTMLCanvasElement).getContext('2d')!.getImageData(128, 128, 1, 1).data[3] !== 0,
  })));
  expect(dimensions.map(entry => entry.size)).toEqual([[256, 256], [512, 512], [512, 512]]);
  expect(dimensions.map(entry => entry.profile)).toEqual(['studio-shader-256', 'flat-control-512', 'sdf-relief-512']);
  expect(dimensions.every(entry => entry.cssWidth > 200 && entry.populated)).toBe(true);
  expect(dimensions[0]!.cssWidth).toBe(dimensions[1]!.cssWidth);
  expect(dimensions[1]!.cssWidth).toBe(dimensions[2]!.cssWidth);
  for (const shape of ['soft-square', 'heart', 'paw'] as const) {
    await lab.locator(`[data-shape="${shape}"]`).click();
    await expect(lab.locator(`[data-shape="${shape}"]`)).toHaveAttribute('aria-pressed', 'true');
    await page.screenshot({ path: testInfo.outputPath(`library-hall-volume-desktop-${shape}.png`), fullPage: true });
  }
  expect(errors).toEqual([]);
});

test('phone volume comparison stays inspectable without mutating saved Hall', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/phaser-pages.html?volume-probe=1');
  const lab = page.locator('#library-volume-probe');
  await expect(lab.locator('article canvas')).toHaveCount(3);
  await lab.locator('[data-shape="heart"]').click();
  await page.screenshot({ path: testInfo.outputPath('library-hall-volume-phone-heart.png'), fullPage: true });
  await lab.locator('[data-close]').click();
  await expect(lab).toHaveCount(0);
  await expect(page.locator('.sandbox-library-shell')).toBeVisible();
  expect(new URL(page.url()).searchParams.has('volume-probe')).toBe(false);
});
