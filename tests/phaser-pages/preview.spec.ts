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

test('idle warmup never imports Phaser before real maker intent', async ({ page }) => {
  let chunkRequests = 0;
  let markChunkSeen!: () => void;
  const chunkSeen = new Promise<void>((resolve) => { markChunkSeen = resolve; });

  await page.route(/PhaserSquishSurface-.*\.js$/, async (route) => {
    chunkRequests += 1;
    markChunkSeen();
    await route.continue();
  });

  await openPreview(page);
  await page.waitForTimeout(2_000);
  expect(chunkRequests, 'idle Library must not speculate the Phaser module').toBe(0);

  await page.locator('[data-library-new]').first().click();
  await chunkSeen;
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  expect(chunkRequests).toBe(1);
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

test('delete modal wins over a pending lazy maker navigation', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('squishy.phaser-pages-preview.squishy.save.v3', JSON.stringify({
      version: 3,
      library: [{
        id: 'race-delete-toy',
        createdAt: 1,
        shapeId: 'heart',
        materialId: 'soft',
        appearance: { v: 1, strokes: [], mixins: [] },
        decor: { v: 1 },
      }],
      libraryCapacity: 8,
      completedRecipeIds: [],
      unlockedRewardIds: [],
      totalCrafts: 1,
      updatedAt: 1,
    }));
  });

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
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '1');
  await page.locator('[data-library-new]').first().click();
  await chunkSeen;
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('aria-busy', 'true');

  await page.locator('[data-library-delete-id]').first().click();
  const modal = page.locator('[data-library-delete-overlay]');
  await expect(modal).toBeVisible();

  releaseChunk();
  await page.waitForTimeout(150);
  await expect(modal).toBeVisible();
  await expect(page.locator('[data-sandbox-maker-host]')).toHaveCount(0);
});

test('renderer init failure restores the originating Library with a retryable error', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    let webgl2Calls = 0;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
        if (type === 'webgl2') {
          webgl2Calls += 1;
          if (webgl2Calls > 1) return null;
        }
        return Reflect.apply(original, this, [type, ...args]);
      },
    });
  });

  await page.goto('/phaser/');
  const library = page.locator('[data-sandbox-library]');
  await expect(library).toBeVisible();
  await page.locator('[data-library-new]').first().click();

  await expect(library).toBeVisible();
  const error = page.locator('[data-library-maker-error]');
  await expect(error).toBeVisible();
  await expect(error).toHaveClass(/is-error/);
  await expect(error).toContainText(/studio|студи/i);
  await expect(page.locator('[data-sandbox-maker-host]')).toHaveCount(0);
  await expect(library).not.toHaveAttribute('aria-busy', 'true');
});

test('stalled Studio art keeps maker hidden until the full environment is ready', async ({ page }) => {
  let releaseDecor!: () => void;
  let markDecorSeen!: () => void;
  const decorGate = new Promise<void>((resolve) => { releaseDecor = resolve; });
  const decorSeen = new Promise<void>((resolve) => { markDecorSeen = resolve; });

  await page.route(/studio-decor-left-.*\.png$/, async (route) => {
    markDecorSeen();
    await decorGate;
    await route.continue();
  });

  await openPreview(page);
  const library = page.locator('[data-sandbox-library]');
  await page.locator('[data-library-new]').first().click();
  await decorSeen;

  await expect(page.locator('[data-sandbox-canvas]')).toHaveCount(0);
  await expect(library).toBeVisible();

  releaseDecor();
  const canvas = page.locator('[data-sandbox-canvas]');
  await expect(canvas).toHaveAttribute('data-phaser-ready', 'true', { timeout: 5_000 });
  await expect(page.locator('[data-sandbox-app]')).toHaveClass(/studio-env-active/, { timeout: 5_000 });
});

