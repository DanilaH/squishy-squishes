import { expect, test, type Page } from '@playwright/test';
import { createDefaultSaveV3, type SaveStateV3 } from '../../src/platform/saveV3';
import { createEmptyAppearanceDocument } from '../../src/sandbox/appearance';
import { createEmptyDecorDocument } from '../../src/sandbox/decor';
import type { SavedSquishy } from '../../src/sandbox/types';

const WEB_URL = '/squishy-squishes/';
const YANDEX_URL = '/yandex/';

const toy: SavedSquishy = {
  id: 'production-cutover-toy',
  createdAt: 1_700_000_000_000,
  shapeId: 'paw',
  materialId: 'holo',
  appearance: createEmptyAppearanceDocument(),
  decor: createEmptyDecorDocument(),
};

const save: SaveStateV3 = {
  ...createDefaultSaveV3(),
  library: [toy],
  totalCrafts: 1,
  updatedAt: toy.createdAt,
};

const installYandexStub = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    const listeners = {
      game_api_pause: new Set<() => void>(),
      game_api_resume: new Set<() => void>(),
    };
    const sdk = {
      environment: { i18n: { lang: 'en' } },
      features: {
        GameplayAPI: { start: () => undefined, stop: () => undefined },
        LoadingAPI: { ready: () => undefined },
      },
      on: (event: 'game_api_pause' | 'game_api_resume', listener: () => void) => listeners[event].add(listener),
      off: (event: 'game_api_pause' | 'game_api_resume', listener: () => void) => listeners[event].delete(listener),
      getStorage: async () => window.localStorage,
      getPlayer: async () => ({
        getData: async () => ({}),
        setData: async () => undefined,
      }),
      adv: {
        showFullscreenAdv: ({ callbacks }: { callbacks: { onOpen?: () => void; onClose?: (shown: boolean) => void } }) => {
          callbacks.onOpen?.();
          callbacks.onClose?.(false);
        },
        showRewardedVideo: ({ callbacks }: { callbacks: { onOpen?: () => void; onRewarded?: () => void; onClose?: () => void } }) => {
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
  });
};

test('production web uses the accepted 512px Hall profile and lazy Phaser maker', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(WEB_URL);
  await page.evaluate((value) => {
    localStorage.clear();
    localStorage.setItem('squishy.save.v3', JSON.stringify(value));
  }, save);
  await page.reload();

  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '1');
  const thumbnail = page.locator('[data-library-thumbnail="production-cutover-toy"]');
  await expect(thumbnail).toHaveAttribute('data-library-renderer', 'volume-mesh');
  await expect(thumbnail).toHaveAttribute('data-library-projection', 'front');
  expect(await thumbnail.evaluate((canvas) => [(canvas as HTMLCanvasElement).width, (canvas as HTMLCanvasElement).height]))
    .toEqual([512, 512]);

  const phaserChunksBefore = await page.evaluate(() => performance.getEntriesByType('resource')
    .filter((entry) => entry.name.includes('PhaserSquishSurface')).length);
  expect(phaserChunksBefore).toBe(0);

  await page.locator('[data-library-play-id="production-cutover-toy"]').click();
  const canvas = page.locator('[data-sandbox-canvas]');
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  await expect(canvas).toHaveAttribute('data-phaser-ready', 'true');
  await expect(canvas).toHaveAttribute('data-phaser-volume', 'deformable');
  await expect(page.locator('#app')).toHaveAttribute('data-studio-env-ready', '');
  await expect(page.locator('.studio-env-decor--left')).toBeVisible();
  await expect(page.locator('.studio-env-decor--right')).toBeVisible();
  await expect.poll(() => page.evaluate(() => performance.getEntriesByType('resource')
    .filter((entry) => entry.name.includes('PhaserSquishSurface')).length)).toBeGreaterThan(0);

  const box = await canvas.boundingBox();
  if (!box) throw new Error('Missing production squeeze canvas bounds.');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 8, box.y + box.height / 2, { steps: 8 });
  await expect.poll(async () =>
    Math.abs(Number(await canvas.getAttribute('data-squish-body-offset-x') ?? '0')),
  ).toBeLessThanOrEqual(0.305);
  await page.mouse.up();
});

test('production Yandex entry uses the same Phaser maker without the DRAFT namespace', async ({ page }) => {
  await installYandexStub(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(YANDEX_URL);
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-stage', 'library');

  await page.locator('[data-library-new]').first().click();
  const canvas = page.locator('[data-sandbox-canvas]');
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'shape');
  await expect(canvas).toHaveAttribute('data-phaser-ready', 'true');
  await expect(canvas).toHaveAttribute('data-phaser-volume', 'deformable');

  expect(await page.evaluate(() => [...Array(localStorage.length)].map((_, index) => localStorage.key(index))
    .filter((key): key is string => Boolean(key))
    .some((key) => key.startsWith('squishy.phaser-yandex-draft.')))).toBe(false);
});


test('first production paint gesture is visible before pointerup', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(WEB_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'shape');
  await page.locator('[data-action="shape-continue"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'paint');

  const canvas = page.locator('[data-sandbox-canvas]');
  await expect(canvas).toHaveAttribute('data-phaser-ready', 'true');
  await page.waitForTimeout(300);
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Missing production paint canvas bounds.');
  const before = await canvas.screenshot();

  await page.mouse.move(box.x + box.width * 0.44, box.y + box.height * 0.52);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.58, box.y + box.height * 0.52, { steps: 6 });
  await page.waitForTimeout(120);
  const during = await canvas.screenshot();

  expect(during.equals(before)).toBe(false);
  await page.mouse.up();
});
