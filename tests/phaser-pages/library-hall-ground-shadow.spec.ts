import { expect, test } from '@playwright/test';

test('owner shadow is decoded and layered beneath both podiums without blocking controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/phaser/');
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-hall-art', 'owner-library-223c843');
  const layer = await page.evaluate(() => {
    const stands = [...document.querySelectorAll<HTMLElement>('.library-hall-vacant')];
    if (stands.length !== 2) throw new Error('Expected two vacant pedestals');
    return stands.map((stand) => {
      const shadow = getComputedStyle(stand, '::after');
      const podium = getComputedStyle(stand, '::before');
      return {
        url: shadow.backgroundImage,
        shadowZ: shadow.zIndex,
        podiumZ: podium.zIndex,
        pointerEvents: shadow.pointerEvents,
      };
    });
  });
  for (const item of layer) {
    expect(item.url).toContain('ground-shadow');
    expect(item.shadowZ).toBe('0');
    expect(item.podiumZ).toBe('1');
    expect(item.pointerEvents).toBe('none');
  }
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'shape');
});

test('broken owner shadow keeps original usable library grid', async ({ page }) => {
  await page.route(/ground-shadow[^/]*\.webp(?:\?.*)?$/, (route) => route.abort());
  await page.goto('/phaser/');
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
  await expect(page.locator('[data-sandbox-library]')).not.toHaveClass(/is-library-hall/);
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'shape');
});
