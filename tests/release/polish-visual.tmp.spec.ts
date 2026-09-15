import { expect, test, type Page } from '@playwright/test';

const PAGES_URL = '/squishy-squishes/';

const canvasBox = async (page: Page) => {
  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('Missing sandbox canvas');
  return box;
};

const stroke = async (page: Page, points: readonly [number, number][]) => {
  const first = points[0];
  if (!first) return;
  await page.mouse.move(first[0], first[1]);
  await page.mouse.down();
  for (const [x, y] of points.slice(1)) await page.mouse.move(x, y, { steps: 5 });
  await page.mouse.up();
};

const completeMix = async (page: Page) => {
  const box = await canvasBox(page);
  const cx = box.x + box.width * 0.5;
  const cy = box.y + box.height * 0.5;
  const dx = Math.min(72, box.width * 0.2);
  const dy = Math.min(64, box.height * 0.18);
  const points = [[cx + dx, cy], [cx, cy - dy], [cx - dx, cy], [cx, cy + dy]] as const;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let index = 0; index < 38; index += 1) {
    const [x, y] = points[index % points.length]!;
    await page.mouse.move(x, y, { steps: 2 });
  }
  await page.mouse.up();
  await expect.poll(async () => Number(await page.locator('[data-sandbox-app]').getAttribute('data-mix-progress')))
    .toBeGreaterThanOrEqual(1);
};

const advanceToDecor = async (page: Page, shape = 'soft-square') => {
  await page.goto(PAGES_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('[data-library-new]').first().click();
  const shell = page.locator('[data-sandbox-app]');
  await page.locator(`.sandbox-shape[data-shape="${shape}"]`).click();
  await page.locator('[data-action="shape-continue"]').click();
  const box = await canvasBox(page);
  const cx = box.x + box.width * 0.5;
  const cy = box.y + box.height * 0.5;
  await page.locator('.sandbox-swatch').nth(1).click();
  await stroke(page, [[cx - 110, cy - 55], [cx - 20, cy - 15], [cx + 90, cy + 25]]);
  await page.locator('.sandbox-swatch').nth(2).click();
  await stroke(page, [[cx - 90, cy + 55], [cx, cy + 25], [cx + 100, cy - 10]]);
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-mixin="pearls"]').click();
  await page.mouse.click(cx - 55, cy - 25);
  await page.mouse.click(cx + 45, cy + 10);
  await page.locator('[data-mixin="stars"]').click();
  await page.mouse.click(cx, cy + 45);
  await page.locator('[data-action="mixin-continue"]').click();
  await completeMix(page);
  await page.locator('[data-action="mix-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'decor');
  await page.locator('[data-decor-eyes="happy"]').click();
  await page.locator('[data-decor-mouth="cat"]').click();
  await page.locator('[data-action="decor-blush"]').click();
  return shell;
};

test('capture player-feedback polish states', async ({ page }) => {
  await page.setViewportSize({ width: 1293, height: 853 });
  const shell = await advanceToDecor(page);
  await page.screenshot({ path: 'visual-artifacts/decor-1293x853.png', fullPage: true });

  await page.locator('[data-action="decor-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'finish');
  await page.locator('[data-material="jelly"]').click();
  await page.setViewportSize({ width: 1191, height: 739 });
  await page.screenshot({ path: 'visual-artifacts/jelly-1191x739.png', fullPage: true });

  await page.locator('[data-action="save"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'squeeze');
  const box = await canvasBox(page);
  const cx = box.x + box.width * 0.5;
  const cy = box.y + box.height * 0.5;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width + 320, cy - 120, { steps: 16 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'visual-artifacts/extreme-pull-1191x739.png', fullPage: true });
  await page.mouse.up();

  await page.locator('[data-action="new"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'shape');
  await page.locator('.sandbox-shape[data-shape="paw"]').click();
  await page.setViewportSize({ width: 1293, height: 853 });
  await page.screenshot({ path: 'visual-artifacts/paw-1293x853.png', fullPage: true });
});
