import { expect, test } from '@playwright/test';

test('shelf contact shading and table remain passive behind eight creation places', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/phaser/');
  await expect(page.locator('.library-showcase-slot')).toHaveCount(8);
  const layers=await page.locator('.library-showcase-slot').evaluateAll(slots=>slots.map(slot=>({
    image:getComputedStyle(slot,'::before').backgroundImage,events:getComputedStyle(slot,'::before').pointerEvents,
  })));
  for(const layer of layers){expect(layer.image).toContain('gradient');expect(layer.events).toBe('none');}
  expect(await page.locator('.library-showcase-table').evaluate(table=>getComputedStyle(table).pointerEvents)).toBe('none');
  await page.locator('.library-showcase-slot').last().click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage','shape');
});

test('broken owner shadow keeps original usable library grid', async ({ page }) => {
  await page.route(/ground-shadow[^/]*\.webp(?:\?.*)?$/, (route) => route.abort());
  await page.goto('/phaser/');
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
  await expect(page.locator('[data-sandbox-library]')).not.toHaveClass(/is-library-hall/);
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'shape');
});
