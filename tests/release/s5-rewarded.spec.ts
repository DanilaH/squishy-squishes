import { expect, test, type Page } from '@playwright/test';
import { createDefaultSaveV3, decodeSaveStateV3, type SaveStateV3 } from '../../src/platform/saveV3';
import {
  S5_SHELF_EXPANSION_CAPACITY,
  S5_SHELF_EXPANSION_REWARD_ID,
  grantS5ShelfExpansion,
} from '../../src/platform/saveV3Rewards';
import { createEmptyAppearanceDocument } from '../../src/sandbox/appearance';
import { createEmptyDecorDocument } from '../../src/sandbox/decor';
import type { SavedSquishy } from '../../src/sandbox/types';

const PAGES_URL = '/squishy-squishes/';
const YANDEX_URL = '/yandex/';

const SHAPES: readonly SavedSquishy['shapeId'][] = ['soft-square', 'heart', 'mochi', 'peach', 'mushroom', 'paw'];

const makeToy = (index: number): SavedSquishy => ({
  id: `s5-toy-${index}`,
  createdAt: index + 1,
  shapeId: SHAPES[index % SHAPES.length] ?? 'mochi',
  materialId: index % 3 === 0 ? 'jelly' : index % 3 === 1 ? 'soft' : 'holo',
  appearance: createEmptyAppearanceDocument(),
  decor: createEmptyDecorDocument(),
});

const makeFullSave = (): SaveStateV3 => ({
  ...createDefaultSaveV3(),
  library: Array.from({ length: 8 }, (_, index) => makeToy(index)),
  totalCrafts: 8,
  updatedAt: 8,
});

const seedSave = async (page: Page, save: SaveStateV3, url = PAGES_URL): Promise<void> => {
  await page.goto(url);
  await page.evaluate((value) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('squishy.save.v3', JSON.stringify(value));
  }, save);
  await page.reload();
};

const readSave = async (page: Page): Promise<SaveStateV3> => {
  const raw = await page.evaluate(() => JSON.parse(localStorage.getItem('squishy.save.v3') ?? 'null') as unknown);
  return decodeSaveStateV3(raw);
};

const installYandexStub = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    const state = {
      loadingReady: 0,
      gameplayStart: 0,
      gameplayStop: 0,
      rewardedRequests: 0,
    };
    const listeners = {
      game_api_pause: new Set<() => void>(),
      game_api_resume: new Set<() => void>(),
    };
    (window as unknown as { __s5YandexQa?: typeof state }).__s5YandexQa = state;

    const sdk = {
      environment: { i18n: { lang: 'ru' } },
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
          callbacks.onOpen?.();
          callbacks.onClose?.(false);
        },
        showRewardedVideo: ({ callbacks }: { callbacks: { onOpen?: () => void; onRewarded?: () => void; onClose?: () => void } }) => {
          state.rewardedRequests += 1;
          callbacks.onOpen?.();
          callbacks.onRewarded?.();
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
  });
};

const readYandexState = async (page: Page): Promise<{
  loadingReady: number;
  gameplayStart: number;
  gameplayStop: number;
  rewardedRequests: number;
}> => page.evaluate(() => {
  const state = (window as unknown as { __s5YandexQa?: unknown }).__s5YandexQa;
  if (!state) throw new Error('Missing S5 Yandex QA state.');
  return state as {
    loadingReady: number;
    gameplayStart: number;
    gameplayStop: number;
    rewardedRequests: number;
  };
});

test('S5 shelf reward is bounded, idempotent and never reduces a higher capacity', () => {
  const initial = makeFullSave();
  const granted = grantS5ShelfExpansion(initial, 100);
  expect(granted.libraryCapacity).toBe(S5_SHELF_EXPANSION_CAPACITY);
  expect(granted.unlockedRewardIds).toEqual([S5_SHELF_EXPANSION_REWARD_ID]);
  expect(granted.library).toEqual(initial.library);
  expect(granted.updatedAt).toBe(100);

  const repeated = grantS5ShelfExpansion(granted, 200);
  expect(repeated).toBe(granted);
  expect(repeated.unlockedRewardIds).toEqual([S5_SHELF_EXPANSION_REWARD_ID]);

  const alreadyHigher: SaveStateV3 = {
    ...initial,
    libraryCapacity: 12,
    unlockedRewardIds: [],
  };
  const higherGrant = grantS5ShelfExpansion(alreadyHigher, 300);
  expect(higherGrant.libraryCapacity).toBe(12);
  expect(higherGrant.unlockedRewardIds).toEqual([S5_SHELF_EXPANSION_REWARD_ID]);

  const inconsistent: SaveStateV3 = {
    ...initial,
    unlockedRewardIds: [S5_SHELF_EXPANSION_REWARD_ID],
  };
  expect(grantS5ShelfExpansion(inconsistent, 400).libraryCapacity).toBe(10);
});

test('S5 rewarded offer appears only on a full free shelf and free creation remains available', async ({ page }) => {
  await seedSave(page, { ...makeFullSave(), library: makeFullSave().library.slice(0, 7), totalCrafts: 7 });
  await expect(page.locator('[data-library-expand-reward]')).toHaveCount(0);

  await seedSave(page, makeFullSave());
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '8');
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-capacity', '8');
  await expect(page.locator('[data-library-expand-reward]')).toBeVisible();
  await expect(page.locator('[data-library-new]').first()).toBeVisible();

  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'shape');
});

test('S5 mock rewarded click durably expands 8 slots to 10 exactly once and survives reload', async ({ page }) => {
  await seedSave(page, makeFullSave());
  const rewardButton = page.locator('[data-library-expand-reward]');
  await expect(rewardButton).toBeVisible();
  await rewardButton.click();

  const library = page.locator('[data-sandbox-library]');
  await expect(library).toHaveAttribute('data-library-count', '8');
  await expect(library).toHaveAttribute('data-library-capacity', '10');
  await expect(page.locator('[data-library-reward-message]')).toContainText(/10/);
  await expect(page.locator('[data-library-expand-reward]')).toHaveCount(0);
  await expect(page.locator('.sandbox-library-add-card')).toBeVisible();

  const saved = await readSave(page);
  expect(saved.libraryCapacity).toBe(10);
  expect(saved.unlockedRewardIds.filter((id) => id === S5_SHELF_EXPANSION_REWARD_ID)).toHaveLength(1);

  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-capacity', '10');
  await expect(page.locator('[data-library-expand-reward]')).toHaveCount(0);
  const reloaded = await readSave(page);
  expect(reloaded.libraryCapacity).toBe(10);
  expect(reloaded.unlockedRewardIds.filter((id) => id === S5_SHELF_EXPANSION_REWARD_ID)).toHaveLength(1);
});

test('S5 Yandex rewarded path requests one ad, grants once despite duplicate callback and restores gameplay activity', async ({ page }) => {
  await installYandexStub(page);
  await seedSave(page, makeFullSave(), YANDEX_URL);
  await expect(page.locator('[data-library-expand-reward]')).toContainText('РЕКЛАМА');

  const before = await readYandexState(page);
  await page.locator('[data-library-expand-reward]').click();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-capacity', '10');

  const after = await readYandexState(page);
  expect(after.rewardedRequests - before.rewardedRequests).toBe(1);
  expect(after.gameplayStop).toBeGreaterThan(before.gameplayStop);
  expect(after.gameplayStart).toBeGreaterThan(before.gameplayStart);

  const saved = await readSave(page);
  expect(saved.libraryCapacity).toBe(10);
  expect(saved.unlockedRewardIds.filter((id) => id === S5_SHELF_EXPANSION_REWARD_ID)).toHaveLength(1);
});

for (const viewport of [
  { name: 'phone portrait', width: 390, height: 844 },
  { name: 'short landscape', width: 844, height: 390 },
] as const) {
  test(`S5 full-shelf rewarded offer has no horizontal overflow on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await seedSave(page, makeFullSave());
    await expect(page.locator('[data-library-expand-reward]')).toBeVisible();

    const metrics = await page.locator('[data-library-reward-offer]').evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
      };
    });
    expect(metrics.left).toBeGreaterThanOrEqual(-2);
    expect(metrics.right).toBeLessThanOrEqual(metrics.viewportWidth + 2);
    expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 2);
  });
}
