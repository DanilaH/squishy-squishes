import { expect, test, type Page } from '@playwright/test';

const PAGES_URL = '/squishy-squishes/';
const MATERIALS = ['soft', 'jelly', 'holo', 'marshmallow', 'pearl', 'chrome'] as const;

const canvasBox = async (page: Page) => {
  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('Missing sandbox canvas');
  return box;
};

const completeMix = async (page: Page): Promise<void> => {
  const box = await canvasBox(page);
  const cx = box.x + box.width * 0.5;
  const cy = box.y + box.height * 0.5;
  const points = [[cx + 72, cy], [cx, cy - 64], [cx - 72, cy], [cx, cy + 64]] as const;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let index = 0; index < 40; index += 1) {
    const [x, y] = points[index % points.length]!;
    await page.mouse.move(x, y, { steps: 2 });
  }
  await page.mouse.up();
  await expect.poll(async () => Number(await page.locator('[data-sandbox-app]').getAttribute('data-mix-progress'))).toBeGreaterThanOrEqual(1);
};

const reachFinish = async (page: Page): Promise<void> => {
  await page.goto(PAGES_URL);
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  const shell = page.locator('[data-sandbox-app]');
  await page.locator('[data-library-new]').first().click();
  await page.locator('.sandbox-shape[data-shape="soft-square"]').click();
  await page.locator('[data-action="shape-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'paint');

  const box = await canvasBox(page);
  const cx = box.x + box.width * 0.5;
  const cy = box.y + box.height * 0.5;
  await page.mouse.move(cx - 80, cy - 18);
  await page.mouse.down();
  await page.mouse.move(cx + 82, cy + 20, { steps: 16 });
  await page.mouse.up();

  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'mix');
  await completeMix(page);
  await page.locator('[data-action="mix-continue"]').click();
  await page.locator('[data-action="decor-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'finish');
};

test('capture desktop material identities', async ({ page }) => {
  await page.setViewportSize({ width: 1293, height: 853 });
  await reachFinish(page);
  const shell = page.locator('[data-sandbox-app]');
  for (const material of MATERIALS) {
    await page.locator(`.sandbox-material[data-material="${material}"]`).click();
    await expect(shell).toHaveAttribute('data-material', material);
    await page.waitForTimeout(180);
    await page.screenshot({ path: `artifacts/material-${material}-1293x853.png`, fullPage: true });
  }
});

test('capture mobile six-material finish layout', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 });
  await reachFinish(page);
  await page.locator('.sandbox-material-grid').scrollIntoViewIfNeeded();
  await page.waitForTimeout(160);
  await page.screenshot({ path: 'artifacts/materials-mobile-430x932.png', fullPage: true });
});
