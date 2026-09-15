import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  createAppearanceStroke,
  createMixInPlacement,
  estimateAppearanceBytes,
  type AppearanceDocumentV1,
} from '../../src/sandbox/appearance';
import type { SavedSquishy } from '../../src/sandbox/types';
import {
  createDefaultSaveV3,
  decodeSaveStateV3,
  estimateSaveStateV3Bytes,
  type SaveStateV3,
} from '../../src/platform/saveV3';

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

const seedSaveV3 = async (page: Page, save: SaveStateV3, url = PAGES_URL): Promise<void> => {
  await page.goto(url);
  await page.evaluate((value) => {
    localStorage.clear();
    localStorage.setItem('squishy.save.v3', JSON.stringify(value));
  }, save);
  await page.reload();
};

const readBrowserSave = async (page: Page): Promise<SaveStateV3> =>
  page.evaluate(() => JSON.parse(localStorage.getItem('squishy.save.v3') ?? 'null') as SaveStateV3);

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

const craftMinimalToy = async (
  page: Page,
  shapeId: SavedSquishy['shapeId'],
  materialId: SavedSquishy['materialId'],
  paintColorIndex = 0,
): Promise<void> => {
  await page.locator('[data-library-new]').first().click();
  const shell = page.locator('[data-sandbox-app]');
  await expect(shell).toHaveAttribute('data-stage', 'shape');
  await page.locator(`.sandbox-shape[data-shape="${shapeId}"]`).click();
  await page.locator('[data-action="shape-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'paint');

  const box = await getCanvasBox(page);
  const cx = box.x + box.width * 0.5;
  const cy = box.y + box.height * 0.5;
  await page.locator('.sandbox-swatch').nth(paintColorIndex).click();
  await drawSandboxStroke(page, [[cx - 18, cy - 10], [cx, cy], [cx + 20, cy + 12]]);
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'mix');
  await performRealMix(page);
  await page.locator('[data-action="mix-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'finish');
  await page.locator(`.sandbox-material[data-material="${materialId}"]`).click();
  await page.locator('[data-action="save"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'squeeze');
};

const createFixtureAppearance = (seed: number, rich = false): AppearanceDocumentV1 => {
  const strokeCount = rich ? 30 : 4;
  const mixinCount = rich ? 44 : 6;
  const strokes = Array.from({ length: strokeCount }, (_, index) => {
    const offset = ((seed * 13 + index * 7) % 70) / 100;
    return createAppearanceStroke(
      0,
      [0xd58cff, 0x63e6e2, 0xff79a8, 0x92df83][(seed + index) % 4]!,
      [18, 34, 56][index % 3]!,
      [
        { u: 0.18 + offset * 0.2, v: 0.22 + (index % 5) * 0.08 },
        { u: 0.34 + offset * 0.18, v: 0.34 + (index % 4) * 0.08 },
        { u: 0.50 + offset * 0.12, v: 0.48 + (index % 3) * 0.07 },
        { u: 0.66 - offset * 0.10, v: 0.60 - (index % 4) * 0.05 },
        { u: 0.80 - offset * 0.12, v: 0.72 - (index % 5) * 0.04 },
      ],
    );
  });
  const mixinIds = ['glitter', 'stars', 'foam', 'pearls', 'hearts', 'confetti'] as const;
  const mixins = Array.from({ length: mixinCount }, (_, index) => createMixInPlacement(
    mixinIds[(seed + index) % mixinIds.length]!,
    { u: 0.15 + ((index * 23 + seed) % 70) / 100, v: 0.16 + ((index * 31 + seed * 3) % 68) / 100 },
    10 + (index % 13),
    ((index * 37 + seed * 11) % 255) / 255,
  ));
  return { v: 1, strokes, mixins };
};

const FIXTURE_SHAPES = ['soft-square', 'heart', 'mochi', 'peach', 'mushroom', 'paw'] as const;
const FIXTURE_MATERIALS = ['soft', 'jelly', 'holo'] as const;

const createFixtureToy = (index: number, rich = false): SavedSquishy => ({
  id: `fixture-${index}`,
  createdAt: 1_000 + index,
  shapeId: FIXTURE_SHAPES[index % FIXTURE_SHAPES.length]!,
  materialId: FIXTURE_MATERIALS[index % FIXTURE_MATERIALS.length]!,
  appearance: createFixtureAppearance(index, rich),
});

const createFixtureSave = (count: number, rich = false): SaveStateV3 => ({
  ...createDefaultSaveV3(),
  library: Array.from({ length: count }, (_, index) => createFixtureToy(index, rich)),
  libraryCapacity: count > 8 ? 24 : 8,
  totalCrafts: count,
  updatedAt: 12_345,
});

test('Pages production build boots into an empty personal Library and all six maker shapes remain open', async ({ page }) => {
  const fatalErrors = watchFatalBrowserErrors(page);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(PAGES_URL);
  await clearStorageAndReload(page);

  const library = page.locator('[data-sandbox-library]');
  await expect(library).toHaveAttribute('data-stage', 'library');
  await expect(library).toHaveAttribute('data-library-count', '0');
  await expect(page.getByRole('heading', { name: 'MY SQUISHIES' })).toBeVisible();
  await page.locator('[data-library-new]').first().click();

  const shell = page.locator('[data-sandbox-app]');
  await expect(shell).toHaveAttribute('data-stage', 'shape');
  await expect(page.locator('.sandbox-shape')).toHaveCount(6);
  await expect(page.locator('.sandbox-shape:disabled')).toHaveCount(0);
  for (const shapeId of FIXTURE_SHAPES) {
    await page.locator(`.sandbox-shape[data-shape="${shapeId}"]`).click();
    await expect(shell).toHaveAttribute('data-shape', shapeId);
  }
  await expect(page.locator('.mold-target')).toHaveCount(0);

  const save = await readBrowserSave(page);
  expect(save).toMatchObject({ version: 3, library: [], libraryCapacity: 8, totalCrafts: 0 });
  expect(fatalErrors).toEqual([]);
});

for (const viewport of [
  { name: 'phone portrait', width: 390, height: 844 },
  { name: 'phone landscape', width: 844, height: 390 },
  { name: 'short desktop', width: 1280, height: 600 },
] as const) {
  test(`Sandbox S2 empty Library primary actions fit ${viewport.name}`, async ({ page }) => {
    const fatalErrors = watchFatalBrowserErrors(page);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(PAGES_URL);
    await clearStorageAndReload(page);

    const library = page.locator('[data-sandbox-library]');
    await expect(library).toHaveAttribute('data-stage', 'library');
    await expectInViewport(page, page.locator('.sandbox-library-heading'));
    await expectInViewport(page, page.locator('[data-library-new]').first());
    await expectInViewport(page, page.locator('.sandbox-library-empty__toy'));
    expect(fatalErrors).toEqual([]);
  });
}

test('SaveStateV2 migrates to V3 and boots the empty Library without fabricating a toy', async ({ page }) => {
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
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-stage', 'library');

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

test('Yandex S2 Library honors SDK lifecycle, RU copy, QA exclusion and settings persistence', async ({ page }) => {
  const fatalErrors = watchFatalBrowserErrors(page);
  await installYandexStub(page, 'ru');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(YANDEX_URL);

  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-stage', 'library');
  await expect(page.getByRole('heading', { name: 'МОИ СКВИШИ' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'QA' })).toHaveCount(0);
  await expect(page.locator('[data-appearance-probe]')).toHaveCount(0);
  await expect.poll(async () => (await yandexState(page)).loadingReady).toBe(1);
  await expect.poll(async () => (await yandexState(page)).gameplayStart).toBeGreaterThanOrEqual(1);
  expect((await yandexState(page)).fullscreenRequests).toBe(0);

  await page.locator('[data-library-mute]').click();
  await expect.poll(async () => page.evaluate(() => localStorage.getItem('squishy.settings.v1'))).toContain('"muted":true');
  await expect(page.getByRole('button', { name: 'Звук выкл.' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('button', { name: 'Звук выкл.' })).toBeVisible();
  await expect.poll(async () => (await yandexState(page)).loadingReady).toBe(1);
  expect(fatalErrors).toEqual([]);
});

test('real S2 crafts append in order, reload, and a non-latest saved toy opens directly into Squeeze', async ({ page }) => {
  const fatalErrors = watchFatalBrowserErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(PAGES_URL);
  await clearStorageAndReload(page);

  await craftMinimalToy(page, 'soft-square', 'soft', 0);
  await page.locator('[data-action="home"]').click();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '1');

  await craftMinimalToy(page, 'heart', 'jelly', 1);
  await page.locator('[data-action="home"]').click();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '2');

  await craftMinimalToy(page, 'paw', 'holo', 2);
  await page.locator('[data-action="home"]').click();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '3');

  const savedBeforeReload = await readBrowserSave(page);
  expect(savedBeforeReload.library.map((toy) => toy.shapeId)).toEqual(['soft-square', 'heart', 'paw']);
  expect(savedBeforeReload.library.map((toy) => toy.materialId)).toEqual(['soft', 'jelly', 'holo']);
  expect(savedBeforeReload.totalCrafts).toBe(3);

  await page.reload();
  await expect(page.locator('[data-library-toy]')).toHaveCount(3);
  const firstId = savedBeforeReload.library[0]!.id;
  await page.locator(`[data-library-play-id="${firstId}"]`).click();
  const shell = page.locator('[data-sandbox-app]');
  await expect(shell).toHaveAttribute('data-stage', 'squeeze');
  await expect(shell).toHaveAttribute('data-shape', 'soft-square');
  await expect(shell).toHaveAttribute('data-material', 'soft');

  const box = await getCanvasBox(page);
  const cx = box.x + box.width * 0.5;
  const cy = box.y + box.height * 0.5;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + Math.min(70, box.width * 0.2), cy + 12, { steps: 10 });
  await page.mouse.up();
  await expect.poll(async () => Number(await shell.getAttribute('data-sandbox-squeezes'))).toBeGreaterThan(0);
  expect(fatalErrors).toEqual([]);
});

test('delete is explicit, removes a middle toy only after confirmation, and persists order', async ({ page }) => {
  const fatalErrors = watchFatalBrowserErrors(page);
  const seeded = createFixtureSave(3);
  await seedSaveV3(page, seeded);

  const middleId = seeded.library[1]!.id;
  const beforeRaw = await page.evaluate(() => localStorage.getItem('squishy.save.v3'));
  await page.locator(`[data-library-delete-id="${middleId}"]`).click();
  await expect(page.locator('[data-library-delete-overlay]')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('squishy.save.v3'))).toBe(beforeRaw);

  await page.locator('[data-library-delete-cancel]').click();
  await expect(page.locator('[data-library-delete-overlay]')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('squishy.save.v3'))).toBe(beforeRaw);

  await page.locator(`[data-library-delete-id="${middleId}"]`).click();
  await page.locator('[data-library-delete-confirm]').click();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '2');

  const after = await readBrowserSave(page);
  expect(after.library.map((toy) => toy.id)).toEqual([seeded.library[0]!.id, seeded.library[2]!.id]);
  expect(after.totalCrafts).toBe(seeded.totalCrafts);
  await page.reload();
  await expect(page.locator('[data-library-toy]')).toHaveCount(2);
  expect((await readBrowserSave(page)).library.map((toy) => toy.id)).toEqual([seeded.library[0]!.id, seeded.library[2]!.id]);
  expect(fatalErrors).toEqual([]);
});

test('full 8-slot Library allows creation, mutates nothing before replacement, supports cancel, then replaces an explicit slot', async ({ page }) => {
  const fatalErrors = watchFatalBrowserErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const seeded = createFixtureSave(8);
  await seedSaveV3(page, seeded);
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '8');
  await expect(page.locator('[data-library-new]').first()).toBeVisible();

  const beforeRaw = await page.evaluate(() => localStorage.getItem('squishy.save.v3'));
  await page.locator('[data-library-new]').first().click();
  const shell = page.locator('[data-sandbox-app]');
  await page.locator('.sandbox-shape[data-shape="paw"]').click();
  await page.locator('[data-action="shape-continue"]').click();
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();
  await performRealMix(page);
  await page.locator('[data-action="mix-continue"]').click();
  await page.locator('.sandbox-material[data-material="holo"]').click();
  await page.locator('[data-action="save"]').click();

  await expect(page.locator('[data-library-replace-overlay]')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('squishy.save.v3'))).toBe(beforeRaw);
  await page.locator('[data-library-replace-cancel]').click();
  await expect(page.locator('[data-library-replace-overlay]')).toHaveCount(0);
  await expect(shell).toHaveAttribute('data-stage', 'finish');
  expect(await page.evaluate(() => localStorage.getItem('squishy.save.v3'))).toBe(beforeRaw);

  const targetIndex = 2;
  const targetId = seeded.library[targetIndex]!.id;
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-library-replace-overlay]')).toBeVisible();
  await page.locator(`[data-library-replace-id="${targetId}"]`).click();
  await expect(shell).toHaveAttribute('data-stage', 'squeeze');
  await expect(shell).toHaveAttribute('data-shape', 'paw');
  await expect(shell).toHaveAttribute('data-material', 'holo');

  const after = await readBrowserSave(page);
  expect(after.library).toHaveLength(8);
  expect(after.library[targetIndex]!.id).not.toBe(targetId);
  expect(after.library[targetIndex]).toMatchObject({ shapeId: 'paw', materialId: 'holo' });
  expect(after.library.filter((_, index) => index !== targetIndex).map((toy) => toy.id))
    .toEqual(seeded.library.filter((_, index) => index !== targetIndex).map((toy) => toy.id));
  expect(after.totalCrafts).toBe(seeded.totalCrafts + 1);
  expect(fatalErrors).toEqual([]);
});

test('S2 payload evidence measures valid 1 / 8 / 24-slot V3 envelopes', async () => {
  const one = createFixtureSave(1, true);
  const eight = createFixtureSave(8, true);
  const stress = createFixtureSave(24, true);

  expect(decodeSaveStateV3(JSON.parse(JSON.stringify(one)) as unknown).library).toHaveLength(1);
  expect(decodeSaveStateV3(JSON.parse(JSON.stringify(eight)) as unknown).library).toHaveLength(8);
  expect(decodeSaveStateV3(JSON.parse(JSON.stringify(stress)) as unknown).library).toHaveLength(24);

  const oneBytes = estimateSaveStateV3Bytes(one);
  const eightBytes = estimateSaveStateV3Bytes(eight);
  const stressBytes = estimateSaveStateV3Bytes(stress);
  const largestAppearance = Math.max(...stress.library.map((toy) => estimateAppearanceBytes(toy.appearance)));

  console.info(`[squishy:s2-payload] one=${oneBytes} eight=${eightBytes} stress24=${stressBytes} largestAppearance=${largestAppearance}`);
  expect(oneBytes).toBeGreaterThan(0);
  expect(eightBytes).toBeGreaterThan(oneBytes);
  expect(stressBytes).toBeGreaterThan(eightBytes);
  expect(largestAppearance).toBeLessThanOrEqual(6_000);
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
