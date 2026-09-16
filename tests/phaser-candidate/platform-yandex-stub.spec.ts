import { expect, test } from '@playwright/test';
import { createDefaultSaveV3, type SaveStateV3 } from '../../src/platform/saveV3';
import { createEmptyAppearanceDocument } from '../../src/sandbox/appearance';
import { createEmptyDecorDocument } from '../../src/sandbox/decor';

const PREFIX = 'squishy.phaser-platform-preview.';

const fullSave = (): SaveStateV3 => ({
  ...createDefaultSaveV3(),
  library: Array.from({ length: 8 }, (_, index) => ({
    id: `phaser-platform-sdk-${index}`,
    createdAt: index + 1,
    shapeId: 'heart' as const,
    materialId: 'soft' as const,
    appearance: createEmptyAppearanceDocument(),
    decor: createEmptyDecorDocument(),
  })),
  totalCrafts: 8,
  updatedAt: 8,
});

const installSdkStub = async (page: import('@playwright/test').Page): Promise<void> => {
  await page.addInitScript(() => {
    const state = { loadingReady: 0, gameplayStart: 0, gameplayStop: 0, rewardedRequests: 0 };
    const listeners = {
      game_api_pause: new Set<() => void>(),
      game_api_resume: new Set<() => void>(),
    };
    (window as Window & {
      __phaserSdkQa?: typeof state & { pause(): void; resume(): void };
    }).__phaserSdkQa = {
      ...state,
      pause: () => { for (const listener of listeners.game_api_pause) listener(); },
      resume: () => { for (const listener of listeners.game_api_resume) listener(); },
    };
    const current = (window as Window & { __phaserSdkQa?: typeof state }).__phaserSdkQa!;
    const sdk = {
      environment: { i18n: { lang: 'ru' } },
      features: {
        GameplayAPI: {
          start: () => { current.gameplayStart += 1; },
          stop: () => { current.gameplayStop += 1; },
        },
        LoadingAPI: { ready: () => { current.loadingReady += 1; } },
      },
      on: (event: 'game_api_pause' | 'game_api_resume', listener: () => void) => listeners[event].add(listener),
      off: (event: 'game_api_pause' | 'game_api_resume', listener: () => void) => listeners[event].delete(listener),
      getStorage: async () => window.localStorage,
      getPlayer: async () => ({ getData: async () => ({}), setData: async () => undefined }),
      adv: {
        showFullscreenAdv: ({ callbacks }: { callbacks: { onOpen?: () => void; onClose?: (wasShown: boolean) => void } }) => {
          callbacks.onOpen?.();
          callbacks.onClose?.(false);
        },
        showRewardedVideo: ({ callbacks }: { callbacks: { onOpen?: () => void; onRewarded?: () => void; onClose?: () => void } }) => {
          current.rewardedRequests += 1;
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
    (window as Window & { YaGames?: { init(): Promise<typeof sdk> } }).YaGames = { init: async () => sdk };
  });
};

test('M5: actual Yandex bootstrap on opt-in Phaser uses isolated V3, SDK ready once, pause/resume and once-only reward', async ({ page }) => {
  await installSdkStub(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/phaser-platform.html');
  await expect(page.locator('body')).toHaveAttribute('data-release-platform', 'yandex');
  await expect(page.locator('#app')).toHaveAttribute('data-phaser-platform-ready', 'true');
  expect(await page.evaluate(() => (window as Window & { __phaserSdkQa?: { loadingReady: number } }).__phaserSdkQa?.loadingReady)).toBe(1);
  await page.evaluate(({ prefix, save }) => {
    localStorage.setItem(prefix + 'squishy.save.v3', JSON.stringify(save));
  }, { prefix: PREFIX, save: fullSave() });
  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '8');
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-capacity', '8');
  const before = await page.evaluate(() => {
    const qa = (window as Window & { __phaserSdkQa?: { loadingReady: number; gameplayStart: number; gameplayStop: number; rewardedRequests: number; pause(): void; resume(): void } }).__phaserSdkQa!;
    return { ready: qa.loadingReady, start: qa.gameplayStart, stop: qa.gameplayStop, rewarded: qa.rewardedRequests };
  });
  expect(before.ready).toBe(1);
  expect(before.start).toBeGreaterThanOrEqual(1);
  await page.evaluate(() => (window as Window & { __phaserSdkQa?: { pause(): void } }).__phaserSdkQa!.pause());
  await expect(page.locator('[data-sandbox-library]')).toHaveClass(/is-blocked/);
  await page.evaluate(() => (window as Window & { __phaserSdkQa?: { resume(): void } }).__phaserSdkQa!.resume());
  await expect(page.locator('[data-sandbox-library]')).not.toHaveClass(/is-blocked/);
  await page.locator('[data-library-expand-reward]').click();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-capacity', '10');
  const after = await page.evaluate((prefix) => {
    const qa = (window as Window & { __phaserSdkQa?: { gameplayStart: number; gameplayStop: number; rewardedRequests: number } }).__phaserSdkQa!;
    return {
      start: qa.gameplayStart,
      stop: qa.gameplayStop,
      rewarded: qa.rewardedRequests,
      save: JSON.parse(localStorage.getItem(prefix + 'squishy.save.v3') ?? 'null') as SaveStateV3,
      ordinary: localStorage.getItem('squishy.save.v3'),
    };
  }, PREFIX);
  expect(after.rewarded - before.rewarded).toBe(1);
  expect(after.stop).toBeGreaterThan(before.stop);
  expect(after.start).toBeGreaterThan(before.start);
  expect(after.save.libraryCapacity).toBe(10);
  expect(after.save.unlockedRewardIds).toHaveLength(1);
  expect(after.ordinary).toBeNull();
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-capacity', '10');
});
