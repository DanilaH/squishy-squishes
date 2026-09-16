import { expect, test } from '@playwright/test';

const open = async (page: import('@playwright/test').Page): Promise<{ x: number; y: number }> => {
  await page.goto('/phaser-stage-input.html');
  await expect(page.locator('[data-gesture-ready]')).toHaveAttribute('data-gesture-ready', 'ready');
  const bounds = await page.locator('#gesture-stage canvas').boundingBox();
  if (!bounds) throw new Error('Phaser playfield is missing');
  return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
};

test('M4 bridge: pointercancel, lost capture and window blur do not credit a squeeze', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 850 });
  const { x, y } = await open(page);
  await page.locator('[data-gesture-stage="squeeze"]').click();
  const start = async (): Promise<void> => {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await expect.poll(() => page.evaluate(() => window.__squishyStageInput!.snapshot().active)).toBe(true);
  };
  const assertCancelled = async (): Promise<void> => {
    await expect.poll(() => page.evaluate(() => window.__squishyStageInput!.snapshot().active)).toBe(false);
    await page.mouse.up();
    expect((await page.evaluate(() => window.__squishyStageInput!.snapshot())).squeezes).toBe(0);
    expect((await page.evaluate(() => window.__squishyStageInput!.snapshot())).owner).toBeNull();
  };

  await start();
  await page.locator('#gesture-stage canvas').evaluate((node) => {
    node.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1, bubbles: true }));
  });
  await assertCancelled();

  await start();
  await page.locator('#gesture-stage canvas').evaluate((node) => {
    node.dispatchEvent(new PointerEvent('lostpointercapture', { pointerId: 1, bubbles: true }));
  });
  await assertCancelled();

  await start();
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await assertCancelled();
});

test.describe('M4 bridge: browser-emulated touch', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('portrait touch authors Paint and Decor without a false squeeze or rotation gate', async ({ page }) => {
    const { x, y } = await open(page);
    expect(await page.locator('#gesture-stage canvas').count()).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(await page.locator('#rotate-gate').count()).toBe(0);
    await page.locator('[data-gesture-stage="paint"]').tap();
    await page.touchscreen.tap(x, y);
    await expect.poll(() => page.evaluate(() => window.__squishyStageInput!.snapshot().paintStrokes)).toBe(1);
    await page.locator('[data-gesture-stickers]').tap();
    await page.touchscreen.tap(x, y);
    await expect.poll(() => page.evaluate(() => window.__squishyStageInput!.snapshot().stickerCount)).toBe(1);
    expect((await page.evaluate(() => window.__squishyStageInput!.snapshot())).squeezes).toBe(0);
    await page.locator('[data-gesture-stage="finish"]').tap();
    expect(await page.locator('#gesture-stage canvas').evaluate((node) => (node as HTMLCanvasElement).style.pointerEvents)).toBe('none');
    await page.touchscreen.tap(x, y);
    expect((await page.evaluate(() => window.__squishyStageInput!.snapshot())).squeezes).toBe(0);
  });
});
