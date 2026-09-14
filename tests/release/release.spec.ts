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

test('Pages production build boots into the recipe-first catalog', async ({ page }) => {
  const fatalErrors = watchFatalBrowserErrors(page);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(PAGES_URL);

  const shell = page.locator('.lab-shell');
  await expect(shell).toHaveAttribute('data-stage', 'select');
  await expect(page.locator('.recipe-dock')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Browse recipes' })).toBeVisible();
  await expect(page.locator('[data-shape-choice], [data-palette-choice], [data-filling-choice]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'QA' })).toBeVisible();

  await page.getByRole('button', { name: 'Browse recipes' }).click();
  await expect(page.locator('.collection-overlay')).toBeVisible();
  await expect(page.locator('.collection-card')).toHaveCount(24);
  await expect(page.locator('.recipe-thumb')).toHaveCount(24);

  expect(fatalErrors).toEqual([]);
});

for (const viewport of [
  { name: 'phone portrait', width: 390, height: 844 },
  { name: 'phone landscape', width: 844, height: 390 },
  { name: 'short desktop', width: 1280, height: 600 },
] as const) {
  test(`primary select controls fit ${viewport.name}`, async ({ page }) => {
    const fatalErrors = watchFatalBrowserErrors(page);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(PAGES_URL);
    await expect(page.locator('.lab-shell')).toHaveAttribute('data-stage', 'select');
    await expectInViewport(page, page.locator('.recipe-dock'));
    await expectInViewport(page, page.locator('.recipe-dock__actions'));
    await expectInViewport(page, page.locator('.stage-copy'));
    expect(fatalErrors).toEqual([]);
  });
}

test('Yandex production build honors SDK lifecycle, RU locale, QA exclusion and settings persistence', async ({ page }) => {
  const fatalErrors = watchFatalBrowserErrors(page);
  await installYandexStub(page, 'ru');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(YANDEX_URL);

  const shell = page.locator('.lab-shell');
  await expect(shell).toHaveAttribute('data-stage', 'select');
  await expect(page.getByRole('button', { name: 'Рецепты' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'QA' })).toHaveCount(0);
  await expect.poll(async () => (await yandexState(page)).loadingReady).toBe(1);
  await expect.poll(async () => (await yandexState(page)).gameplayStart).toBeGreaterThanOrEqual(1);

  const startBeforeMenu = (await yandexState(page)).gameplayStart;
  await page.getByRole('button', { name: 'Рецепты' }).click();
  await expect(page.locator('.collection-card')).toHaveCount(24);
  await expect.poll(async () => (await yandexState(page)).gameplayStop).toBeGreaterThanOrEqual(1);
  await page.getByRole('button', { name: 'Закрыть' }).click();
  await expect.poll(async () => (await yandexState(page)).gameplayStart).toBeGreaterThan(startBeforeMenu);

  await page.getByRole('button', { name: 'Выключить звук' }).click();
  await expect.poll(async () => page.evaluate(() => localStorage.getItem('squishy.settings.v1'))).toContain('"muted":true');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Включить звук' })).toBeVisible();
  await expect.poll(async () => (await yandexState(page)).loadingReady).toBe(1);

  expect(fatalErrors).toEqual([]);
});

const paintDefaultShape = async (page: Page): Promise<void> => {
  const workspace = page.locator('.lab-workspace');
  const box = await workspace.boundingBox();
  if (!box) throw new Error('Missing workspace box');
  const hero = Math.max(120, Math.min(box.width, box.height) * 0.68);
  const left = box.x + box.width / 2 - hero / 2;
  const top = box.y + box.height / 2 - hero / 2;
  const rows = 8;

  await page.mouse.move(left + hero * 0.12, top + hero * 0.12);
  await page.mouse.down();
  for (let row = 0; row < rows; row += 1) {
    const v = 0.12 + (0.76 * row) / (rows - 1);
    const startU = row % 2 === 0 ? 0.12 : 0.88;
    const endU = row % 2 === 0 ? 0.88 : 0.12;
    await page.mouse.move(left + hero * startU, top + hero * v, { steps: 4 });
    await page.mouse.move(left + hero * endU, top + hero * v, { steps: 24 });
  }
  await page.mouse.up();
};

const mixUntilMold = async (page: Page): Promise<void> => {
  const shell = page.locator('.lab-shell');
  const box = await page.locator('.lab-workspace').boundingBox();
  if (!box) throw new Error('Missing workspace box');
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const dx = Math.min(145, box.width * 0.16);
  const dy = Math.min(125, box.height * 0.18);
  const points = [
    [cx + dx, cy],
    [cx, cy - dy],
    [cx - dx, cy],
    [cx, cy + dy],
  ] as const;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    if ((await shell.getAttribute('data-stage')) !== 'mix') return;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    for (let index = 0; index < 72; index += 1) {
      const [x, y] = points[index % points.length]!;
      await page.mouse.move(x, y, { steps: 2 });
      await page.waitForTimeout(12);
    }
    await page.mouse.up();
    try {
      await expect(shell).toHaveAttribute('data-stage', 'mold', { timeout: 1_200 });
      return;
    } catch {
      // Continue the same real interaction if the previous stretch burst was not enough.
    }
  }

  throw new Error('Mix did not reach mold after repeated real pointer travel');
};

const finishMold = async (page: Page): Promise<void> => {
  const shell = page.locator('.lab-shell');
  const target = page.locator('.mold-target');
  for (let press = 0; press < 18; press += 1) {
    if ((await shell.getAttribute('data-stage')) !== 'mold') return;
    await expect(target).toBeVisible();
    await target.click();
    await page.waitForTimeout(150);
  }
  if ((await shell.getAttribute('data-stage')) === 'mold') throw new Error('Mold did not complete after critical presses');
};

test('fresh save completes one real standard craft and persists collection progress', async ({ page }) => {
  const fatalErrors = watchFatalBrowserErrors(page);
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto(PAGES_URL);
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();

  const shell = page.locator('.lab-shell');
  await expect(shell).toHaveAttribute('data-stage', 'select');
  await page.getByRole('button', { name: 'Make squishy' }).click();
  await expect(shell).toHaveAttribute('data-stage', 'pour');

  await paintDefaultShape(page);
  await expect(shell).toHaveAttribute('data-stage', 'mix', { timeout: 4_000 });

  await mixUntilMold(page);
  await expect(shell).toHaveAttribute('data-stage', 'mold');
  await finishMold(page);
  await expect(shell).toHaveAttribute('data-stage', 'test', { timeout: 5_000 });

  await page.getByRole('button', { name: 'Collect' }).click();
  await expect(shell).toHaveAttribute('data-stage', 'select', { timeout: 2_000 });
  await expect(page.locator('.made-count')).toContainText('1 / 24');

  await page.reload();
  await expect(page.locator('.made-count')).toContainText('1 / 24');
  await page.getByRole('button', { name: 'Browse recipes' }).click();
  await expect(page.locator('.collection-card--completed')).toHaveCount(1);
  await expect(page.locator('.collection-card--completed').getByRole('button', { name: 'Make again' })).toBeVisible();
  await expect(page.locator('.collection-card--completed').getByRole('button', { name: 'Squeeze' })).toBeVisible();

  expect(fatalErrors).toEqual([]);
});
