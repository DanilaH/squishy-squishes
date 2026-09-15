import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { createDefaultSaveV3, type SaveStateV3 } from '../../src/platform/saveV3';
import { createEmptyAppearanceDocument } from '../../src/sandbox/appearance';
import { createEmptyDecorDocument } from '../../src/sandbox/decor';
import type { SavedSquishy } from '../../src/sandbox/types';

const PAGES_URL = '/squishy-squishes/';
const YANDEX_URL = '/yandex/';
const OUTPUT = 'artifacts/s5-visual';
const SHAPES: readonly SavedSquishy['shapeId'][] = ['soft-square', 'heart', 'mochi', 'peach', 'mushroom', 'paw'];

const makeToy = (index: number): SavedSquishy => ({
  id: `visual-s5-${index}`,
  createdAt: index + 1,
  shapeId: SHAPES[index % SHAPES.length] ?? 'mochi',
  materialId: index % 3 === 0 ? 'jelly' : index % 3 === 1 ? 'soft' : 'holo',
  appearance: createEmptyAppearanceDocument(),
  decor: createEmptyDecorDocument(),
});

const fullSave = (): SaveStateV3 => ({
  ...createDefaultSaveV3(),
  library: Array.from({ length: 8 }, (_, index) => makeToy(index)),
  totalCrafts: 8,
  updatedAt: 8,
});

const seed = async (page: Page, save: SaveStateV3, url = PAGES_URL): Promise<void> => {
  await page.goto(url);
  await page.evaluate((value) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('squishy.save.v3', JSON.stringify(value));
  }, save);
  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toBeVisible();
};

const installRuYandex = async (context: BrowserContext): Promise<void> => {
  await context.addInitScript(() => {
    const listeners = {
      game_api_pause: new Set<() => void>(),
      game_api_resume: new Set<() => void>(),
    };
    const sdk = {
      environment: { i18n: { lang: 'ru' } },
      features: {
        GameplayAPI: { start: () => undefined, stop: () => undefined },
        LoadingAPI: { ready: () => undefined },
      },
      on: (event: 'game_api_pause' | 'game_api_resume', listener: () => void) => listeners[event].add(listener),
      off: (event: 'game_api_pause' | 'game_api_resume', listener: () => void) => listeners[event].delete(listener),
      getStorage: async () => window.localStorage,
      getPlayer: async () => ({ getData: async () => ({}), setData: async () => undefined }),
      adv: {
        showFullscreenAdv: ({ callbacks }: { callbacks: { onClose?: (shown: boolean) => void } }) => callbacks.onClose?.(false),
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
    (window as unknown as { YaGames?: { init(): Promise<typeof sdk> } }).YaGames = { init: async () => sdk };
  });
};

test('capture Sandbox S5 rewarded shelf visual states', async ({ browser }) => {
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const phonePage = await phone.newPage();
  await seed(phonePage, fullSave());
  await expect(phonePage.locator('[data-library-expand-reward]')).toBeVisible();
  await phonePage.screenshot({ path: `${OUTPUT}/01-phone-full-offer.png`, fullPage: true });
  await phonePage.locator('[data-library-expand-reward]').click();
  await expect(phonePage.locator('[data-sandbox-library]')).toHaveAttribute('data-library-capacity', '10');
  await phonePage.screenshot({ path: `${OUTPUT}/02-phone-expanded.png`, fullPage: true });
  await phone.close();

  const landscape = await browser.newContext({ viewport: { width: 844, height: 390 } });
  const landscapePage = await landscape.newPage();
  await seed(landscapePage, fullSave());
  await expect(landscapePage.locator('[data-library-expand-reward]')).toBeVisible();
  await landscapePage.screenshot({ path: `${OUTPUT}/03-landscape-full-offer.png`, fullPage: true });
  await landscape.close();

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const desktopPage = await desktop.newPage();
  await seed(desktopPage, fullSave());
  await desktopPage.screenshot({ path: `${OUTPUT}/04-desktop-full-offer.png`, fullPage: true });
  await desktop.close();

  const ru = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await installRuYandex(ru);
  const ruPage = await ru.newPage();
  await seed(ruPage, fullSave(), YANDEX_URL);
  await expect(ruPage.locator('[data-library-expand-reward]')).toContainText('РЕКЛАМА');
  await ruPage.screenshot({ path: `${OUTPUT}/05-phone-ru-full-offer.png`, fullPage: true });
  await ru.close();
});
