import { expect, test } from '@playwright/test';

for (const viewport of [{ width: 320, height: 568 }, { width: 568, height: 320 }, { width: 1440, height: 900 }]) {
  test(`accessory selection follows the active object only in Arrange at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/squishy-squishes/');
    await page.locator('[data-library-new]').first().click();
    await expect(page.locator('[data-phaser-ready]')).toHaveAttribute('data-phaser-ready', 'true');
    await page.locator('[data-craft-section="decor"]').click();
    await page.locator('[data-decor-section="accessory"]').click();
    await page.locator('button[data-decor-accessory="cat-ears"]').click();
    const frame = page.locator('[data-accessory-selection]');
    await expect(frame).toBeVisible();
    await expect(frame).toHaveAttribute('data-accessory-selection', '1');
    await page.locator('[data-object="accessory:0"]').click();
    await expect(frame).toHaveAttribute('data-accessory-selection', '0');
    const before = await frame.boundingBox();
    await page.locator('[data-object-control="rotation"]').fill('65');
    await page.locator('[data-object-control="scale"]').fill('1.5');
    await expect.poll(async () => (await frame.boundingBox())!.width).not.toBe(before!.width);
    await expect(frame).toBeVisible();
    await page.screenshot({ path: `/tmp/accessory-selection-${viewport.width}.png` });
    expect(await frame.evaluate(node => getComputedStyle(node).pointerEvents)).toBe('none');
    await page.locator('[data-decor-section="face"]').click();
    await expect(frame).toBeHidden();
    await page.locator('[data-decor-section="objects"]').click();
    await expect(frame).toBeVisible();
    await page.locator('[data-object="face"]').click();
    await expect(frame).toBeHidden();
    await page.locator('[data-object="accessory:0"]').click();
    await expect(frame).toBeVisible();
    await page.locator('[data-action="try-on"]').click();
    await expect(frame).toBeHidden();
    await page.locator('[data-action="try-return"]').click();
    await expect(frame).toBeVisible();
    await page.locator('[data-object-action="delete"]').click();
    await page.locator('[data-object="accessory:0"]').click();
    await page.locator('[data-object-action="delete"]').click();
    await expect(frame).toBeHidden();
  });
}
