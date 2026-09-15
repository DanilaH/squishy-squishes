import { expect, test, type Locator, type Page } from '@playwright/test';

const PAGES_URL = '/squishy-squishes/';
const YANDEX_URL = '/yandex/';

const watchFatalBrowserErrors = (page: Page): string[] => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (request) => {
    errors.push(`requestfailed: ${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`);
  });
  return errors;
};

const expectInViewport = async (page: Page, locator: Locator): Promise<void> => {
  const box = await locator.boundingBox();
  expect(box, 'expected element bounding box').not.toBeNull();
  const viewport = page.viewportSize();
  expect(viewport, 'expected fixed viewport').not.toBeNull();
  if (!box || !viewport) return;
  expect(box.x).toBeGreaterThanOrEqual(-2);
  expect(box.y).toBeGreaterThanOrEqual(-2);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 2);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 2);
};

const installYandexStub = async (page: Page, language: 'en' | 'ru' = 'en'): Promise<void> => {
  await page.addInitScript(({ lang }) => {
    const state = {
      loadingReady: 0,
      gameplayStart: 0,
      gameplayStop: 0,
      fullscreenRequests: 0,
      rewardedRequests: 0,
    };
    const listeners = {
      game_api_pause: new Set<() => void>(),
      game_api_resume: new Set<() => void>(),
    };
    (window as unknown as { __yandexQa?: typeof state }).__yandexQa = state;

    const sdk = {
      environment: { i18n: { lang } },
      features: {
        GameplayAPI: {
          start: () => { state.gameplayStart += 1; },
          stop: () => { state.gameplayStop += 1; },
        },
        LoadingAPI: {
          ready: () => { state.loadingReady += 1; },
        },
      },
      on: (event: 'game_api_pause' | 'game_api_resume', listener: () => void) => listeners[event].add(listener),
      off: (event: 'game_api_pause' | 'game_api_resume', listener: () => void) => listeners[event].delete(listener),
      getStorage: async () => window.localStorage,
      getPlayer: async () => ({
        getData: async () => ({}),
        setData: async () => undefined,
      }),
      adv: {
        showFullscreenAdv: ({ callbacks }: { callbacks: { onOpen?: () => void; onClose?: (wasShown: boolean) => void } }) => {
          state.fullscreenRequests += 1;
          callbacks.onOpen?.();
          callbacks.onClose?.(false);
        },
        showRewardedVideo: ({ callbacks }: { callbacks: { onOpen?: () => void; onRewarded?: () => void; onClose?: () => void } }) => {
          state.rewardedRequests += 1;
          callbacks.onOpen?.();
          callbacks.onRewarded?.();
          callbacks.onClose?.();
        },
        showBannerAdv: async () => ({}),
        hideBannerAdv: async () => ({ stickyAdvIsShowing: false }),
        getBannerAdvStatus: async () => ({ stickyAdvIsShowing: false }),
      },
    };

    (window as unknown as { YaGames?: { init(): Promise<typeof sdk> } }).YaGames = {
      init: async () => sdk,
    };
  }, { lang: language });
};

const yandexState = async (page: Page): Promise<{
  loadingReady: number;
  gameplayStart: number;
  gameplayStop: number;
  fullscreenRequests: number;
  rewardedRequests: number;
}> => page.evaluate(() => {
  const value = (window as unknown as { __yandexQa?: unknown }).__yandexQa;
  if (!value) throw new Error('Missing Yandex QA state');
  return value as {
    loadingReady: number;
    gameplayStart: number;
    gameplayStop: number;
    fullscreenRequests: number;
    rewardedRequests: number;
  };
});

const clearStorageAndReload = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
};

const getCanvasBox = async (page: Page): Promise<{ x: number; y: number; width: number; height: number }> => {
  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('Missing sandbox canvas box');
  return box;
};

const drawSandboxStroke = async (
  page: Page,
  points: readonly [number, number][],
): Promise<void> => {
  const first = points[0];
  if (!first) throw new Error('Sandbox stroke needs at least one point');
  await page.mouse.move(first[0], first[1]);
  await page.mouse.down();
  for (const [x, y] of points.slice(1)) await page.mouse.move(x, y, { steps: 4 });
  await page.mouse.up();
};

const performRealMix = async (page: Page): Promise<void> => {
  const box = await getCanvasBox(page);
  const cx = box.x + box.width * 0.5;
  const cy = box.y + box.height * 0.5;
  const dx = Math.min(72, box.width * 0.2);
  const dy = Math.min(64, box.height * 0.18);
  const points = [
    [cx + dx, cy],
    [cx, cy - dy],
    [cx - dx, cy],
    [cx, cy + dy],
  ] as const;

  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let index = 0; index < 36; index += 1) {
    const [x, y] = points[index % points.length]!;
    await page.mouse.move(x, y, { steps: 2 });
  }
  await page.mouse.up();

  await expect.poll(async () => Number(await page.locator('[data-sandbox-app]').getAttribute('data-mix-progress')))
    .toBeGreaterThanOrEqual(1);
};

test('Pages production build boots into Sandbox S1 with all six shapes open', async ({ page }) => {
  const fatalErrors = watchFatalBrowserErrors(page);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(PAGES_URL);
  await clearStorageAndReload(page);

  const shell = page.locator('[data-sandbox-app]');
  await expect(shell).toHaveAttribute('data-stage', 'shape');
  await expect(page.locator('.sandbox-shape')).toHaveCount(6);
  await expect(page.locator('.sandbox-shape:disabled')).toHaveCount(0);
  for (const shapeId of ['soft-square', 'heart', 'mochi', 'peach', 'mushroom', 'paw']) {
    await page.locator(`[data-shape="${shapeId}"]`).click();
    await expect(shell).toHaveAttribute('data-shape', shapeId);
  }
  await expect(page.locator('.lab-shell')).toHaveCount(0);
  await expect(page.locator('.mold-target')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'CONTINUE' })).toBeVisible();

  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('squishy.save.v3') ?? 'null') as unknown);
  expect(save).toMatchObject({ version: 3, library: [], libraryCapacity: 8, totalCrafts: 0 });
  expect(fatalErrors).toEqual([]);
});

for (const viewport of [
  { name: 'phone portrait', width: 390, height: 844 },
  { name: 'phone landscape', width: 844, height: 390 },
  { name: 'short desktop', width: 1280, height: 600 },
] as const) {
  test(`Sandbox S1 primary shape controls fit ${viewport.name}`, async ({ page }) => {
    const fatalErrors = watchFatalBrowserErrors(page);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(PAGES_URL);
    await clearStorageAndReload(page);

    const shell = page.locator('[data-sandbox-app]');
    await expect(shell).toHaveAttribute('data-stage', 'shape');
    await expectInViewport(page, page.locator('.sandbox-controls'));
    await expectInViewport(page, page.locator('.sandbox-shape').first());
    await expectInViewport(page, page.locator('.sandbox-shape').last());
    await expectInViewport(page, page.locator('[data-action="shape-continue"]'));
    expect(fatalErrors).toEqual([]);
  });
}

test('SaveStateV2 migrates deterministically to V3 without fabricating a custom toy', async ({ page }) => {
  const fatalErrors = watchFatalBrowserErrors(page);
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('squishy.save.v2', JSON.stringify({
      version: 2,
      completedVariantIds: ['grape-smooth', 'heart-strawberry-beads', 'not-a-real-recipe'],
      totalCrafts: 7,
      labXp: 425,
      updatedAt: 12345,
    }));
  });
  await page.goto(PAGES_URL);
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'shape');

  const result = await page.evaluate(() => ({
    v3: JSON.parse(localStorage.getItem('squishy.save.v3') ?? 'null') as Record<string, unknown>,
    v2: localStorage.getItem('squishy.save.v2'),
  }));
  expect(result.v3).toMatchObject({
    version: 3,
    library: [],
    libraryCapacity: 8,
    completedRecipeIds: ['grape-smooth', 'heart-strawberry-beads'],
    unlockedRewardIds: [],
    totalCrafts: 7,
  });
  expect(result.v3).not.toHaveProperty('labXp');
  expect(result.v2).toBeNull();
  expect(fatalErrors).toEqual([]);
});

test('Yandex sandbox build honors SDK lifecycle, RU copy, QA exclusion and settings persistence', async ({ page }) => {
  const fatalErrors = watchFatalBrowserErrors(page);
  await installYandexStub(page, 'ru');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(YANDEX_URL);

  const shell = page.locator('[data-sandbox-app]');
  await expect(shell).toHaveAttribute('data-stage', 'shape');
  await expect(page.getByRole('heading', { name: 'ВЫБЕРИ ФОРМУ' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'QA' })).toHaveCount(0);
  await expect(page.locator('[data-appearance-probe]')).toHaveCount(0);
  await expect.poll(async () => (await yandexState(page)).loadingReady).toBe(1);
  await expect.poll(async () => (await yandexState(page)).gameplayStart).toBeGreaterThanOrEqual(1);
  expect((await yandexState(page)).fullscreenRequests).toBe(0);

  await page.getByRole('button', { name: 'Звук вкл.' }).click();
  await expect.poll(async () => page.evaluate(() => localStorage.getItem('squishy.settings.v1'))).toContain('"muted":true');
  await expect(page.getByRole('button', { name: 'Звук выкл.' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('button', { name: 'Звук выкл.' })).toBeVisible();
  await expect.poll(async () => (await yandexState(page)).loadingReady).toBe(1);
  expect(fatalErrors).toEqual([]);
});

test('real Sandbox S1 craft persists authored Paw + paint + hearts + Holo, reloads and squeezes', async ({ page }) => {
  const fatalErrors = watchFatalBrowserErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(PAGES_URL);
  await clearStorageAndReload(page);

  const shell = page.locator('[data-sandbox-app]');
  await expect(shell).toHaveAttribute('data-stage', 'shape');
  await page.locator('[data-shape="paw"]').click();
  await expect(shell).toHaveAttribute('data-shape', 'paw');
  await page.locator('[data-action="shape-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'paint');

  let box = await getCanvasBox(page);
  let cx = box.x + box.width * 0.5;
  let cy = box.y + box.height * 0.5;
  await drawSandboxStroke(page, [[cx - 22, cy - 12], [cx, cy], [cx + 24, cy + 12]]);
  await page.locator('.sandbox-swatch').nth(1).click();
  await drawSandboxStroke(page, [[cx - 8, cy - 30], [cx, cy], [cx + 8, cy + 30]]);
  await expect(shell).toHaveAttribute('data-paint-strokes', '2');
  expect(Number(await shell.getAttribute('data-appearance-bytes'))).toBeLessThanOrEqual(6_000);

  await page.locator('[data-action="paint-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'mixins');
  await page.locator('[data-mixin="hearts"]').click();
  box = await getCanvasBox(page);
  cx = box.x + box.width * 0.5;
  cy = box.y + box.height * 0.5;
  await page.mouse.click(cx - 18, cy);
  await page.mouse.click(cx + 2, cy - 18);
  await page.mouse.click(cx + 20, cy + 14);
  await expect.poll(async () => Number(await shell.getAttribute('data-mixin-count'))).toBeGreaterThanOrEqual(3);

  await page.locator('[data-action="mixin-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'mix');
  await expect(page.locator('[data-action="mix-continue"]')).toBeDisabled();
  await performRealMix(page);
  await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
  await page.locator('[data-action="mix-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'finish');

  await page.locator('[data-material="holo"]').click();
  await expect(shell).toHaveAttribute('data-material', 'holo');
  await page.locator('[data-action="save"]').click();
  await expect(shell).toHaveAttribute('data-save-complete', 'true');
  await expect(shell).toHaveAttribute('data-stage', 'squeeze');

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('squishy.save.v3') ?? 'null') as {
    version: number;
    totalCrafts: number;
    library: Array<{
      shapeId: string;
      materialId: string;
      appearance: { strokes: unknown[]; mixins: unknown[] };
    }>;
  });
  expect(saved.version).toBe(3);
  expect(saved.totalCrafts).toBe(1);
  expect(saved.library).toHaveLength(1);
  expect(saved.library[0]).toMatchObject({ shapeId: 'paw', materialId: 'holo' });
  expect(saved.library[0]!.appearance.strokes).toHaveLength(2);
  expect(saved.library[0]!.appearance.mixins.length).toBeGreaterThanOrEqual(3);

  await page.reload();
  const reloadedShell = page.locator('[data-sandbox-app]');
  await expect(reloadedShell).toHaveAttribute('data-stage', 'home');
  await expect(reloadedShell).toHaveAttribute('data-shape', 'paw');
  await expect(reloadedShell).toHaveAttribute('data-material', 'holo');
  await expect(reloadedShell).toHaveAttribute('data-paint-strokes', '2');
  await expect.poll(async () => Number(await reloadedShell.getAttribute('data-mixin-count'))).toBeGreaterThanOrEqual(3);

  await page.locator('[data-action="play-saved"]').click();
  await expect(reloadedShell).toHaveAttribute('data-stage', 'squeeze');
  box = await getCanvasBox(page);
  cx = box.x + box.width * 0.5;
  cy = box.y + box.height * 0.5;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + Math.min(70, box.width * 0.2), cy + 12, { steps: 10 });
  await page.mouse.up();
  await expect.poll(async () => Number(await reloadedShell.getAttribute('data-sandbox-squeezes'))).toBeGreaterThan(0);

  expect(fatalErrors).toEqual([]);
});

test('Pages appearance probe still persists custom paint and uses the real squeeze surface', async ({ page }) => {
  const fatalErrors = watchFatalBrowserErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${PAGES_URL}?appearanceProbe=1`);
  await clearStorageAndReload(page);

  const shell = page.locator('[data-appearance-probe]');
  const canvas = page.locator('[data-probe-canvas]');
  await expect(shell).toBeVisible();
  await expect(shell).toHaveAttribute('data-probe-loaded', 'true');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  await drawSandboxStroke(page, [[cx - 48, cy - 14], [cx, cy], [cx + 42, cy + 16]]);
  await page.locator('[data-probe-tool="color-b"]').click();
  await drawSandboxStroke(page, [[cx - 5, cy - 48], [cx, cy], [cx + 7, cy + 48]]);
  await page.locator('[data-probe-tool="erase"]').click();
  await drawSandboxStroke(page, [[cx + 5, cy], [cx + 28, cy + 12]]);
  await expect(shell).toHaveAttribute('data-probe-strokes', '3');
  await expect(shell).toHaveAttribute('data-probe-budget', 'pass');

  await page.locator('[data-probe-action="save"]').click();
  await expect(shell).toHaveAttribute('data-probe-saved', 'true');
  await page.reload();
  const reloadedShell = page.locator('[data-appearance-probe]');
  await expect(reloadedShell).toHaveAttribute('data-probe-strokes', '3');

  await page.locator('[data-probe-mode="squeeze"]').click();
  const squeezeBox = await canvas.boundingBox();
  expect(squeezeBox).not.toBeNull();
  if (!squeezeBox) return;
  const sx = squeezeBox.x + squeezeBox.width * 0.5;
  const sy = squeezeBox.y + squeezeBox.height * 0.5;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(sx + squeezeBox.width * 0.22, sy + 10, { steps: 10 });
  await page.mouse.up();
  await expect.poll(async () => Number(await reloadedShell.getAttribute('data-probe-squeezes'))).toBeGreaterThan(0);

  expect(fatalErrors).toEqual([]);
});
