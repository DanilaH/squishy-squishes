import { expect, test } from '@playwright/test';

/** Chromium's browser input pipeline, not mouse events or synthetic DOM PointerEvents. */
test('touch creates a painted, sprinkled and decorated squishy, mixes and reopens it', async ({ browser, browserName }) => {
  test.skip(browserName !== 'chromium', 'CDP touch dispatch is Chromium-only; Firefox runs the mouse regression suite.');
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await page.goto('/phaser/');
    await expect(page.locator('[data-sandbox-library]')).toBeVisible();
    await page.evaluate(() => localStorage.setItem('squishy.save.v3', 'keep-original-save'));
    await page.locator('[data-library-new]').first().tap();
    const canvas = page.locator('[data-sandbox-canvas]');
    await expect(canvas).toHaveAttribute('data-phaser-ready', 'true');
    await page.locator('[data-shape="heart"]').tap();
    await page.locator('[data-action="shape-continue"]').tap();
    await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'paint');

    const cdp = await context.newCDPSession(page);
    const touch = async (type: 'touchStart' | 'touchMove' | 'touchEnd', x = 0, y = 0): Promise<void> => {
      await cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1, radiusX: 1, radiusY: 1, force: 1 }],
      });
      // Give Phaser's input queue at least one frame to process each touch move.
      await page.waitForTimeout(20);
    };
    const bounds = async (): Promise<{ x: number; y: number; radius: number }> => {
      const box = await canvas.boundingBox();
      if (!box || box.width < 100 || box.height < 100) throw new Error('Missing visible Phaser canvas');
      return { x: box.x + box.width / 2, y: box.y + box.height / 2, radius: Math.min(box.width, box.height) * 0.34 };
    };

    const paint = await bounds();
    await touch('touchStart', paint.x - paint.radius * 1.25, paint.y);
    for (let n = 1; n <= 16; n += 1) {
      await touch('touchMove', paint.x - paint.radius * 1.25 + paint.radius * 1.6 * n / 16, paint.y);
    }
    await touch('touchEnd');
    await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-paint-strokes', '1');
    await page.locator('[data-action="paint-continue"]').tap();

    await page.locator('[data-mixin="pearls"]').tap();
    const mixin = await bounds();
    await page.touchscreen.tap(mixin.x, mixin.y);
    await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-mixin-count', '1');
    await page.locator('[data-action="mixin-continue"]').tap();

    const mix = await bounds();
    await touch('touchStart', mix.x, mix.y);
    for (let n = 0; n < 34; n += 1) {
      await touch('touchMove', mix.x + (n % 2 ? -55 : 55), mix.y);
    }
    await touch('touchEnd');
    await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
    await page.locator('[data-action="mix-continue"]').tap();
    await page.locator('[data-decor-section="stickers"]').tap();
    const decor = await bounds();
    await page.touchscreen.tap(decor.x, decor.y);
    await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-decor-sticker-count', '1');
    await page.locator('[data-action="decor-continue"]').tap();
    await page.locator('[data-material="holo"]').tap();
    await page.locator('[data-action="save"]').tap();
    await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');

    const stored = await page.evaluate(() => ({
      original: localStorage.getItem('squishy.save.v3'),
      preview: localStorage.getItem('squishy.phaser-pages-preview.squishy.save.v3'),
    }));
    expect(stored.original).toBe('keep-original-save');
    const saved = JSON.parse(stored.preview ?? 'null');
    expect(saved).toMatchObject({ version: 3, library: [{ shapeId: 'heart', materialId: 'holo' }] });
    expect(saved.library[0].appearance.strokes).toHaveLength(1);
    expect(saved.library[0].appearance.mixins).toHaveLength(1);
    expect(saved.library[0].decor.stickers).toHaveLength(1);

    await page.reload();
    await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '1');
    await page.locator('[data-library-play-id]').tap();
    await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
    await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});