import { expect, test, type Page } from '@playwright/test';
import { createDefaultSaveV3, type SaveStateV3 } from '../../src/platform/saveV3';
import { createEmptyAppearanceDocument } from '../../src/sandbox/appearance';
import { createEmptyDecorDocument } from '../../src/sandbox/decor';
import type { SavedSquishy } from '../../src/sandbox/types';

const YANDEX_URL = '/yandex/';

interface YandexQaState {
  loadingReady: number;
  gameplayStart: number;
  gameplayStop: number;
  fullscreenRequests: number;
}

const installYandexStubWithClock = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    const realNow = performance.now.bind(performance);
    let monotonicOffsetMs = 0;
    Object.defineProperty(performance, 'now', {
      configurable: true,
      value: () => realNow() + monotonicOffsetMs,
    });

    (window as unknown as { __advanceInterstitialQaClock?: (ms: number) => void }).__advanceInterstitialQaClock = (ms) => {
      monotonicOffsetMs += ms;
    };

    const state: YandexQaState = {
      loadingReady: 0,
      gameplayStart: 0,
      gameplayStop: 0,
      fullscreenRequests: 0,
    };
    (window as unknown as { __s6YandexQa?: YandexQaState }).__s6YandexQa = state;

    const listeners = {
      game_api_pause: new Set<() => void>(),
      game_api_resume: new Set<() => void>(),
    };
    const sdk = {
      environment: { i18n: { lang: 'en' } },
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
        showRewardedVideo: ({ callbacks }: { callbacks: { onClose?: () => void } }) => callbacks.onClose?.(),
        showBannerAdv: async () => ({}),
        hideBannerAdv: async () => ({ stickyAdvIsShowing: false }),
        getBannerAdvStatus: async () => ({ stickyAdvIsShowing: false }),
      },
    };
    (window as unknown as { YaGames?: { init(): Promise<typeof sdk> } }).YaGames = { init: async () => sdk };
  });
};

const readYandexState = async (page: Page): Promise<YandexQaState> => page.evaluate(() => {
  const state = (window as unknown as { __s6YandexQa?: YandexQaState }).__s6YandexQa;
  if (!state) throw new Error('Missing S6 Yandex QA state.');
  return state;
});

const advanceGateClock = async (page: Page, ms: number): Promise<void> => {
  await page.evaluate((delta) => {
    const advance = (window as unknown as { __advanceInterstitialQaClock?: (value: number) => void }).__advanceInterstitialQaClock;
    if (!advance) throw new Error('Missing S6 monotonic clock control.');
    advance(delta);
  }, ms);
};

const seedSave = async (page: Page, save: SaveStateV3): Promise<void> => {
  await page.goto(YANDEX_URL);
  await page.evaluate((value) => {
    localStorage.clear();
    localStorage.setItem('squishy.save.v3', JSON.stringify(value));
  }, save);
  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
};

const getCanvasBox = async (page: Page): Promise<{ x: number; y: number; width: number; height: number }> => {
  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('Missing sandbox canvas.');
  return box;
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

const completeToyFromShape = async (page: Page, shapeId: SavedSquishy['shapeId']): Promise<void> => {
  const shell = page.locator('[data-sandbox-app]');
  await expect(shell).toHaveAttribute('data-stage', 'shape');
  await page.locator(`.sandbox-shape[data-shape="${shapeId}"]`).click();
  await page.locator('[data-action="shape-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'paint');
  await page.locator('[data-action="paint-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'mixins');
  await page.locator('[data-action="mixin-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'mix');
  await performRealMix(page);
  await page.locator('[data-action="mix-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'decor');
  await page.locator('[data-action="decor-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'finish');
  await page.locator('[data-action="save"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'squeeze');
};

const startAndCompleteToy = async (page: Page, shapeId: SavedSquishy['shapeId']): Promise<void> => {
  await page.locator('[data-library-new]').first().click();
  await completeToyFromShape(page, shapeId);
};

const fixtureToy: SavedSquishy = {
  id: 's6-revisit-fixture',
  createdAt: 1,
  shapeId: 'mochi',
  materialId: 'soft',
  appearance: createEmptyAppearanceDocument(),
  decor: createEmptyDecorDocument(),
};

const fixtureSave: SaveStateV3 = {
  ...createDefaultSaveV3(),
  library: [fixtureToy],
  totalCrafts: 1,
  updatedAt: 1,
};

test('S6 interstitial cadence counts completed saves, not saved-toy revisits, and requests only at Library break', async ({ page }) => {
  await installYandexStubWithClock(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await seedSave(page, fixtureSave);
  await expect.poll(async () => (await readYandexState(page)).loadingReady).toBe(1);

  // Move beyond the unchanged 120s initial grace without changing production policy.
  await advanceGateClock(page, 121_000);

  // Replaying an existing toy is a natural break but not a completed-save action.
  for (let index = 0; index < 4; index += 1) {
    await page.locator('[data-library-play-id="s6-revisit-fixture"]').click();
    await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
    await page.locator('[data-action="home"]').click();
    await expect(page.locator('[data-sandbox-library]')).toBeVisible();
  }
  expect((await readYandexState(page)).fullscreenRequests).toBe(0);

  // First durable creation becomes one eligible action only when we return to Library.
  await startAndCompleteToy(page, 'heart');
  expect((await readYandexState(page)).fullscreenRequests).toBe(0);
  await page.locator('[data-action="home"]').click();
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
  expect((await readYandexState(page)).fullscreenRequests).toBe(0);

  // Save two more toys without a Library break between them. Both completions must be retained.
  await startAndCompleteToy(page, 'paw');
  expect((await readYandexState(page)).fullscreenRequests).toBe(0);
  await page.getByRole('button', { name: 'NEW SQUISHY', exact: true }).click();
  await completeToyFromShape(page, 'peach');
  expect((await readYandexState(page)).fullscreenRequests).toBe(0);

  // Returning after the third completed save flushes actions 2 + 3 and reaches the existing 3-action gate.
  await page.locator('[data-action="home"]').click();
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
  await expect.poll(async () => (await readYandexState(page)).fullscreenRequests).toBe(1);

  const state = await readYandexState(page);
  expect(state.gameplayStop).toBeGreaterThanOrEqual(1);
  expect(state.gameplayStart).toBeGreaterThanOrEqual(2);
});
