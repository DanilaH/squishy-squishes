import { expect, test } from '@playwright/test';

const PAGES_URL = '/phaser/';
const PREVIEW_SAVE_KEY = 'squishy.phaser-pages-preview.squishy.save.v3';

test.describe('Russian maker localization', () => {
  test.use({ locale: 'ru-RU' });

  test('player-facing maker labels and accessible names stay Russian', async ({ page }) => {
    await page.goto(PAGES_URL);
    await page.locator('[data-library-new]').first().click();

    const stage = page.locator('.sandbox-stage');
    const canvas = page.locator('[data-sandbox-canvas]');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
    await expect(stage).toHaveAttribute('aria-label', 'Стол для сквиша');
    await expect(canvas).toHaveAttribute('aria-label', 'Сквиш');

    await expect(page.locator('button[data-shape="soft-square"]')).toContainText('Кубик');
    await expect(page.locator('button[data-shape="heart"]')).toContainText('Сердечко');
    await expect(page.locator('button[data-shape="paw"]')).toContainText('Лапка');
    await expect(page.locator('button[data-shape="paw"]')).not.toContainText('Paw');

    await page.locator('[data-action="shape-continue"]').click();
    await expect(page.locator('[data-paint-color]').first()).toHaveAttribute('aria-label', 'Орхидея');
    await expect(page.locator('[data-paint-color]').last()).toHaveAttribute('aria-label', 'Коричневый');
    await expect(page.locator('[data-brush-size="18"]')).toHaveAttribute('aria-label', 'Маленькая кисть');
    await page.locator('[data-action="paint-continue"]').click();
    await expect(page.locator('[data-mixin="glitter"]')).toContainText('Блёстки');
    await expect(page.locator('[data-mixin="pearls"]')).toContainText('Жемчужины');
    await expect(page.locator('[data-mixin="confetti"]')).toContainText('Конфетти');
  });
});

test('unsaved-exit dialog traps focus, closes on Escape and restores the trigger', async ({ page }) => {
  await page.goto(PAGES_URL);
  await page.locator('[data-library-new]').first().click();
  await page.locator('button[data-shape="heart"]').click();

  const trigger = page.locator('[data-action="exit-craft"]');
  await trigger.click();
  const overlay = page.locator('[data-exit-overlay]');
  const stay = page.locator('[data-action="exit-cancel"]');
  const leave = page.locator('[data-action="exit-confirm"]');
  await expect(overlay).toBeVisible();
  await expect(stay).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(leave).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(stay).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(overlay).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('Decor uses keyboard-operable ARIA tabs', async ({ page }) => {
  await page.goto(PAGES_URL);
  await page.locator('[data-library-new]').first().click();
  await page.locator('[data-action="shape-continue"]').click();
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();

  const canvas = page.locator('[data-sandbox-canvas]');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Missing squishy canvas');
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let n = 0; n < 36; n += 1) {
    await page.mouse.move(cx + (n % 2 ? -58 : 58), cy, { steps: 2 });
  }
  await page.mouse.up();
  await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
  await page.locator('[data-action="mix-continue"]').click();

  const face = page.locator('button[role="tab"][data-decor-section="face"]');
  const stickers = page.locator('button[role="tab"][data-decor-section="stickers"]');
  const accessory = page.locator('button[role="tab"][data-decor-section="accessory"]');
  await expect(face).toHaveAttribute('role', 'tab');
  await expect(face).toHaveAttribute('aria-selected', 'true');
  await expect(stickers).toHaveAttribute('aria-selected', 'false');
  await expect(page.locator('[data-decor-panel="face"]')).toHaveAttribute('role', 'tabpanel');

  await face.focus();
  await page.keyboard.press('ArrowRight');
  await expect(stickers).toBeFocused();
  await expect(stickers).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-decor-panel="stickers"]')).toBeVisible();

  await page.keyboard.press('End');
  await expect(accessory).toBeFocused();
  await expect(accessory).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-decor-panel="accessory"]')).toBeVisible();

  await page.keyboard.press('Home');
  await expect(face).toBeFocused();
  await expect(face).toHaveAttribute('aria-selected', 'true');
});

test('Library delete dialog traps focus, Escape restores the delete button', async ({ page }) => {
  const save = {
    version: 3,
    library: [{
      id: 'a11y-toy',
      createdAt: 1,
      shapeId: 'heart',
      materialId: 'soft',
      appearance: { v: 1, strokes: [], mixins: [] },
      decor: { v: 1, eyes: null, mouth: null, blush: false, stickers: [], accessory: null },
    }],
    libraryCapacity: 8,
    completedRecipeIds: [],
    unlockedRewardIds: [],
    totalCrafts: 1,
    updatedAt: 1,
  };

  await page.goto(PAGES_URL);
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: PREVIEW_SAVE_KEY,
    value: save,
  });
  await page.reload();

  const trigger = page.locator('[data-library-delete-id="a11y-toy"]');
  await trigger.click();
  const overlay = page.locator('[data-library-delete-overlay]');
  const cancel = page.locator('[data-library-delete-cancel]');
  const confirm = page.locator('[data-library-delete-confirm]');
  await expect(overlay).toBeVisible();
  await expect(cancel).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(confirm).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(cancel).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(overlay).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.locator('[data-library-toy="a11y-toy"]')).toBeVisible();
});

test('maker dialog stays modal and immutable while platform activity is blocked', async ({ page }) => {
  await page.goto(PAGES_URL);
  await page.locator('[data-library-new]').first().click();
  await page.locator('button[data-shape="heart"]').click();
  await page.locator('[data-action="exit-craft"]').click();

  const shell = page.locator('[data-sandbox-app]');
  const overlay = page.locator('[data-exit-overlay]');
  const stay = page.locator('[data-action="exit-cancel"]');
  const leave = page.locator('[data-action="exit-confirm"]');
  await expect(overlay).toBeVisible();
  await expect(stay).toBeFocused();

  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
  await expect(shell).toHaveAttribute('aria-busy', 'true');

  await page.keyboard.press('Escape');
  await expect(overlay).toBeVisible();
  await page.keyboard.press('Shift+Tab');
  await expect(leave).toBeFocused();

  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await expect(shell).toHaveAttribute('aria-busy', 'false');
  await page.keyboard.press('Escape');
  await expect(overlay).toBeHidden();
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('CSS motion collapses without disabling the interactive UI', async ({ page }) => {
    await page.goto(PAGES_URL);
    await expect(page.locator('[data-sandbox-library]')).toBeVisible();
    const motion = await page.locator('[data-library-new]').first().evaluate((button) => ({
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      transition: getComputedStyle(button).transitionDuration,
      animation: getComputedStyle(button).animationDuration,
    }));
    const durationMs = (value: string): number => {
      const first = value.split(',')[0]?.trim() ?? '0s';
      if (first.endsWith('ms')) return Number.parseFloat(first);
      if (first.endsWith('s')) return Number.parseFloat(first) * 1000;
      return Number.POSITIVE_INFINITY;
    };
    expect(motion.reduced).toBe(true);
    expect(durationMs(motion.transition)).toBeLessThanOrEqual(1);
    expect(durationMs(motion.animation)).toBeLessThanOrEqual(1);

    await page.locator('[data-library-new]').first().click();
    await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  });
});

