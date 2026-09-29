import { expect, test, type Page } from '@playwright/test';

const openPreview = async (page: Page): Promise<void> => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/phaser/');
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
  expect(await page.evaluate(() => document.body.dataset.releasePlatform)).not.toBe('yandex');
  expect(await page.locator('script[src*="sdk.js"]').count()).toBe(0);
};

test('staged Pages route opens the actual Library and Phaser workbench on mobile', async ({ page }) => {
  await openPreview(page);
  await page.locator('[data-library-new]').first().click();
  const canvas = page.locator('[data-sandbox-canvas]');
  await expect(canvas).toHaveAttribute('data-phaser-ready', 'true');
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('aria-busy', 'true');
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('aria-busy', 'false');
  await expect(canvas).toHaveAttribute('data-phaser-ready', 'true');
});

test('Pages saves persist under a separate key without changing existing web saves', async ({ page }) => {
  await openPreview(page);
  await page.evaluate(() => localStorage.setItem('squishy.save.v3', 'existing-game-sentinel'));
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  await page.locator('[data-shape="heart"]').click();
  await page.locator('[data-action="shape-continue"]').click();
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();
  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('Missing Phaser preview workbench');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let n = 0; n < 22; n += 1) await page.mouse.move(x + (n % 2 ? -65 : 65), y, { steps: 3 });
  await page.mouse.up();
  await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
  await page.locator('[data-action="mix-continue"]').click();
  await page.locator('[data-action="decor-continue"]').click();
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  const saved = await page.evaluate(() => ({
    original: localStorage.getItem('squishy.save.v3'),
    preview: localStorage.getItem('squishy.phaser-pages-preview.squishy.save.v3'),
  }));
  expect(saved.original).toBe('existing-game-sentinel');
  expect(JSON.parse(saved.preview ?? 'null')).toMatchObject({ version: 3, library: [{ shapeId: 'heart' }] });
  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '1');
});


test('slow lazy Phaser load cannot override newer Library navigation', async ({ page }) => {
  let releaseChunk!: () => void;
  let markChunkSeen!: () => void;
  const chunkGate = new Promise<void>((resolve) => { releaseChunk = resolve; });
  const chunkSeen = new Promise<void>((resolve) => { markChunkSeen = resolve; });

  await page.route(/PhaserSquishSurface-.*\.js$/, async (route) => {
    markChunkSeen();
    await chunkGate;
    await route.continue();
  });

  await openPreview(page);
  const library = page.locator('[data-sandbox-library]');
  await page.locator('[data-library-new]').first().click();
  await chunkSeen;
  await expect(library).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('[data-library-maker-error]')).toBeVisible();
  await expect(page.locator('[data-library-maker-error]')).toContainText(/studio|студи/i);

  // Navigation made after the async maker request must invalidate that request.
  await page.locator('[data-library-ideas]').click();
  const ideas = page.locator('[data-sandbox-ideas]');
  await expect(ideas).toBeVisible();

  releaseChunk();
  await page.waitForTimeout(150);
  await expect(ideas).toBeVisible();
  await expect(page.locator('[data-sandbox-maker-host]')).toHaveCount(0);
});

test('failed idle Phaser warmup can retry on real maker entry', async ({ page }) => {
  let chunkRequests = 0;
  let markFirstFailure!: () => void;
  const firstFailure = new Promise<void>((resolve) => { markFirstFailure = resolve; });

  await page.route(/PhaserSquishSurface-.*\.js$/, async (route) => {
    chunkRequests += 1;
    if (chunkRequests === 1) {
      markFirstFailure();
      await route.abort('connectionfailed');
      return;
    }
    await route.continue();
  });

  await openPreview(page);
  await firstFailure;

  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  expect(chunkRequests).toBeGreaterThanOrEqual(2);
  await expect(page.locator('[data-library-maker-error]')).toHaveCount(0);
});

test('failed first Hall art request falls back to Library and retries in-place', async ({ page }) => {
  let pedestalRequests = 0;
  await page.route(/pedestal-.*\.webp$/, async (route) => {
    pedestalRequests += 1;
    if (pedestalRequests === 1) {
      await route.abort('connectionfailed');
      return;
    }
    await route.continue();
  });

  await page.goto('/phaser/');
  const library = page.locator('[data-sandbox-library]');
  await expect(library).toBeVisible();
  await expect(library).toHaveClass(/is-library-hall/, { timeout: 6_000 });
  expect(pedestalRequests).toBeGreaterThanOrEqual(2);
});

