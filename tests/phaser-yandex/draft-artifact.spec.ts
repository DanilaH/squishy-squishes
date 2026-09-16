import { expect, test, type Page } from '@playwright/test';

type DraftCounters = { init: number; ready: number; starts: number; stops: number; rewarded: number };
type DraftSdkControls = {
  counters: DraftCounters;
  pause(): void;
  resume(): void;
};

const installSdk = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    const counters = { init: 0, ready: 0, starts: 0, stops: 0, rewarded: 0 };
    const listeners = {
      game_api_pause: new Set<() => void>(),
      game_api_resume: new Set<() => void>(),
    };
    const sdk = {
      environment: { i18n: { lang: 'ru' } },
      features: {
        GameplayAPI: {
          start: () => { counters.starts += 1; },
          stop: () => { counters.stops += 1; },
        },
        LoadingAPI: { ready: () => { counters.ready += 1; } },
      },
      on: (event: keyof typeof listeners, listener: () => void) => { listeners[event].add(listener); },
      off: (event: keyof typeof listeners, listener: () => void) => { listeners[event].delete(listener); },
      getStorage: async () => localStorage,
      getPlayer: async () => { throw new Error('Player Data not configured'); },
      adv: {
        showFullscreenAdv: ({ callbacks }: { callbacks: { onClose?: (shown: boolean) => void } }) => callbacks.onClose?.(true),
        showRewardedVideo: ({ callbacks }: { callbacks: { onRewarded?: () => void; onClose?: () => void } }) => {
          counters.rewarded += 1;
          callbacks.onRewarded?.();
          callbacks.onRewarded?.();
          callbacks.onClose?.();
        },
        showBannerAdv: async () => ({}),
        hideBannerAdv: async () => ({ stickyAdvIsShowing: false }),
        getBannerAdvStatus: async () => ({ stickyAdvIsShowing: false }),
      },
    };
    Object.assign(window, {
      YaGames: { init: async () => { counters.init += 1; return sdk; } },
      __phaserDraftSdk: {
        counters,
        pause: () => { for (const listener of listeners.game_api_pause) listener(); },
        resume: () => { for (const listener of listeners.game_api_resume) listener(); },
      },
    });
  });
};

const sdkControls = async (page: Page): Promise<DraftCounters> =>
  page.evaluate(() => (window as Window & { __phaserDraftSdk: DraftSdkControls }).__phaserDraftSdk.counters);

const completeMix = async (page: Page): Promise<void> => {
  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('Missing Phaser DRAFT workbench');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let n = 0; n < 22; n += 1) await page.mouse.move(x + (n % 2 ? -65 : 65), y, { steps: 3 });
  await page.mouse.up();
  await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
  await page.locator('[data-action="mix-continue"]').click();
};

test('exact upload-root index boots real Yandex adapter and Phaser; pause stacks safely', async ({ page }) => {
  await installSdk(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
  expect(await page.evaluate(() => document.body.dataset.releasePlatform)).toBe('yandex');
  expect(await sdkControls(page)).toMatchObject({ init: 1, ready: 1, starts: 1 });
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  await page.evaluate(() => (window as Window & { __phaserDraftSdk: DraftSdkControls }).__phaserDraftSdk.pause());
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('aria-busy', 'true');
  expect((await sdkControls(page)).stops).toBe(1);
  await page.evaluate(() => (window as Window & { __phaserDraftSdk: DraftSdkControls }).__phaserDraftSdk.resume());
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('aria-busy', 'false');
  expect((await sdkControls(page)).starts).toBe(2);
});

test('same upload-root bundle writes isolated V3 with unchanged real Library flow', async ({ page }) => {
  await installSdk(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  await page.locator('[data-shape="heart"]').click();
  await page.locator('[data-action="shape-continue"]').click();
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();
  await completeMix(page);
  await page.locator('[data-action="decor-continue"]').click();
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  const persisted = await page.evaluate(() => {
    const raw = localStorage.getItem('squishy.phaser-yandex-draft.squishy.save.v3');
    return { state: raw ? JSON.parse(raw) as { version: number; library: { shapeId: string }[] } : null, original: localStorage.getItem('squishy.save.v3') };
  });
  expect(persisted.original).toBeNull();
  expect(persisted.state?.version).toBe(3);
  expect(persisted.state?.library).toHaveLength(1);
  expect(persisted.state?.library[0]?.shapeId).toBe('heart');
  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '1');
  expect((await sdkControls(page)).ready).toBe(1);
});
