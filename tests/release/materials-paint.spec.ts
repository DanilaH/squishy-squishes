import { expect, test, type Page } from '@playwright/test';

const PAGES_URL = '/squishy-squishes/';

const freshMaker = async (page: Page): Promise<ReturnType<Page['locator']>> => {
  await page.goto(PAGES_URL);
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  await page.locator('[data-library-new]').first().click();
  const shell = page.locator('[data-sandbox-app]');
  await expect(shell).toHaveAttribute('data-stage', 'shape');
  await page.locator('.sandbox-shape[data-shape="soft-square"]').click();
  await page.locator('[data-action="shape-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'paint');
  return shell;
};

const canvasBox = async (page: Page) => {
  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('Missing sandbox canvas');
  return box;
};

const completeMix = async (page: Page): Promise<void> => {
  const box = await canvasBox(page);
  const cx = box.x + box.width * 0.5;
  const cy = box.y + box.height * 0.5;
  const points = [[cx + 70, cy], [cx, cy - 62], [cx - 70, cy], [cx, cy + 62]] as const;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let index = 0; index < 38; index += 1) {
    const [x, y] = points[index % points.length]!;
    await page.mouse.move(x, y, { steps: 2 });
  }
  await page.mouse.up();
  await expect.poll(async () => Number(await page.locator('[data-sandbox-app]').getAttribute('data-mix-progress'))).toBeGreaterThanOrEqual(1);
};

test('paint pointer can arm outside the squishy and begin drawing when it enters the surface', async ({ page }) => {
  await page.setViewportSize({ width: 1180, height: 760 });
  const shell = await freshMaker(page);
  const box = await canvasBox(page);
  const outsideX = box.x + box.width * 0.07;
  const centerX = box.x + box.width * 0.5;
  const centerY = box.y + box.height * 0.5;

  await page.mouse.move(outsideX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX - 30, centerY, { steps: 8 });
  await page.mouse.move(centerX + 28, centerY + 12, { steps: 5 });
  await page.mouse.up();

  await expect(shell).toHaveAttribute('data-paint-strokes', '1');
});

test('finish exposes six material identities and a new material persists through Save V3', async ({ page }) => {
  await page.setViewportSize({ width: 1180, height: 760 });
  const shell = await freshMaker(page);
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'mix');
  await completeMix(page);
  await page.locator('[data-action="mix-continue"]').click();
  await page.locator('[data-action="decor-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'finish');

  const ids = ['soft', 'jelly', 'holo', 'marshmallow', 'pearl', 'chrome'] as const;
  await expect(page.locator('.sandbox-material')).toHaveCount(ids.length);
  for (const id of ids) {
    await page.locator(`.sandbox-material[data-material="${id}"]`).click();
    await expect(shell).toHaveAttribute('data-material', id);
  }

  await page.locator('.sandbox-material[data-material="chrome"]').click();
  await page.locator('[data-action="save"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'squeeze');
  const savedMaterial = await page.evaluate(() => {
    const value = JSON.parse(localStorage.getItem('squishy.save.v3') ?? '{}') as { library?: Array<{ materialId?: string }> };
    return value.library?.[0]?.materialId ?? null;
  });
  expect(savedMaterial).toBe('chrome');
});
