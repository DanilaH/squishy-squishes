import { expect, test, type Page } from '@playwright/test';

const nextRenderedFrame = async (page: Page): Promise<void> => {
  const before = await page.evaluate(() => window.__squishyPhaserCandidate!.snapshot().drawCalls);
  await expect.poll(() => page.evaluate(() => window.__squishyPhaserCandidate!.snapshot().drawCalls)).toBeGreaterThan(before);
};

const capture = (page: Page): Promise<string> => page.locator('#phaser-candidate-stage canvas').evaluate(
  (node) => (node as HTMLCanvasElement).toDataURL('image/png'),
);

const fixtureImage = async (page: Page, kind: 'clear' | 'paint' | 'mixins' | 'decor' | 'foam' | 'pearl' | 'wireframe' | 'mold' | 'palette'): Promise<string> => {
  await page.evaluate((name) => window.__squishyPhaserCandidate!.fixture(name), kind);
  await expect(page.locator('[data-candidate-stage]')).toHaveAttribute('data-candidate-fixture', kind);
  await nextRenderedFrame(page);
  return capture(page);
};

test('M3: canonical paint, mix-ins, face/sticker decor and clear alter real WebGL texture pixels', async ({ page }, info) => {
  await page.setViewportSize({ width: 1100, height: 760 });
  await page.goto('/phaser-candidate.html');
  await expect(page.locator('[data-candidate-stage]')).toHaveAttribute('data-candidate-stage', 'ready');
  await nextRenderedFrame(page);
  const baseline = await fixtureImage(page, 'clear');
  for (const kind of ['paint', 'mixins', 'decor'] as const) {
    const image = await fixtureImage(page, kind);
    expect(image, `${kind} must modify the actual canvas, not merely the DOM`).not.toBe(baseline);
    const state = await page.evaluate(() => window.__squishyPhaserCandidate!.snapshot());
    expect(state.appearanceEnabled).toBe(true);
    expect(state.appearanceRevision).toBeGreaterThan(0);
    if (kind === 'decor') {
      const screenshot = await page.screenshot({ path: 'phaser-candidate-evidence/m3-decor.png' });
      await info.attach('m3-decor', { body: screenshot, contentType: 'image/png' });
    }
  }
  expect(await fixtureImage(page, 'clear')).toBe(baseline);
  expect((await page.evaluate(() => window.__squishyPhaserCandidate!.snapshot())).appearanceEnabled).toBe(false);
  await page.evaluate(() => window.__squishyPhaserCandidate!.fixture('decor'));
  await nextRenderedFrame(page);
  const originalShapeDecor = await capture(page);
  await page.locator('[data-candidate-shape="heart"]').click();
  await nextRenderedFrame(page);
  expect(await capture(page), 'face landmarks must be regenerated when the shape changes').not.toBe(originalShapeDecor);
});

test('M3: original fill/mold/wireframe/palette uniforms affect actual WebGL pixels', async ({ page }) => {
  await page.goto('/phaser-candidate.html');
  await expect(page.locator('[data-candidate-stage]')).toHaveAttribute('data-candidate-stage', 'ready');
  await nextRenderedFrame(page);
  const baseline = await fixtureImage(page, 'clear');
  const images = new Map<string, string>();
  for (const kind of ['foam', 'pearl', 'wireframe', 'mold', 'palette'] as const) {
    const image = await fixtureImage(page, kind);
    images.set(kind, image);
    expect(image, `${kind} must reach the original shader`).not.toBe(baseline);
  }
  expect(images.get('foam')).not.toBe(images.get('pearl'));
  const webglErrors = await page.locator('#phaser-candidate-stage canvas').evaluate((node) => {
    const gl = (node as HTMLCanvasElement).getContext('webgl2');
    if (!gl) throw new Error('No Phaser WebGL2 context');
    return gl.getError();
  });
  expect(webglErrors).toBe(0);
});
