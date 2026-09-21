import { expect, test } from '@playwright/test';

const key = 'squishy.phaser-pages-preview.squishy.save.v3';

test('toy and contact shadow idle together; interaction, visibility and reduced motion pause both', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/phaser/');
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  await page.locator('[data-action="shape-continue"]').click();
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();
  const box = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!box) throw new Error('Missing real Studio canvas');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 0; i < 22; i++) await page.mouse.move(x + (i % 2 ? -65 : 65), y, { steps: 3 });
  await page.mouse.up();
  await page.locator('[data-action="mix-continue"]').click();
  await page.locator('[data-action="decor-continue"]').click();
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  await page.evaluate((storageKey) => {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
    if (saved?.library?.length !== 1) throw new Error('No real V3 saved fixture');
    saved.library = [
      saved.library[0],
      { ...saved.library[0], id: 'feel-second', materialId: 'holo' },
      { ...saved.library[0], id: 'feel-third', materialId: 'chrome' },
    ];
    localStorage.setItem(storageKey, JSON.stringify(saved));
  }, key);
  await page.reload();
  const card = page.locator('.sandbox-library-card:visible').first();
  await expect(card).toBeVisible();
  const motion = async () => card.evaluate((element) => {
    const canvas = element.querySelector<HTMLCanvasElement>('canvas')!;
    const play = element.querySelector<HTMLElement>('.sandbox-library-card__play')!;
    return {
      toy: getComputedStyle(canvas).animationName,
      shadow: getComputedStyle(play, '::before').animationName,
      toyState: getComputedStyle(canvas).animationPlayState,
      shadowState: getComputedStyle(play, '::before').animationPlayState,
    };
  });
  expect(await motion()).toMatchObject({ toy: 'library-toy-idle', shadow: 'library-shadow-idle', toyState: 'running', shadowState: 'running' });
  await card.locator('canvas').dispatchEvent('pointerdown', { bubbles: true });
  await expect(page.locator('[data-sandbox-library]')).toHaveClass(/library-hall-interacting/);
  expect(await motion()).toMatchObject({ toyState: 'paused', shadowState: 'paused' });
  await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })));
  await expect(page.locator('[data-sandbox-library]')).not.toHaveClass(/library-hall-interacting/);
  expect(await motion()).toMatchObject({ toyState: 'running', shadowState: 'running' });
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('[data-sandbox-library]')).toHaveClass(/is-library-hidden/);
  expect(await motion()).toMatchObject({ toyState: 'paused', shadowState: 'paused' });
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('[data-sandbox-library]')).not.toHaveClass(/is-library-hidden/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await motion()).toMatchObject({ toy: 'none', shadow: 'none' });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  expect(await motion()).toMatchObject({ toy: 'library-toy-idle', shadow: 'library-shadow-idle' });
  await page.evaluate(() => {
    (window as unknown as { __hallPageStarts: string[] }).__hallPageStarts = [];
    window.addEventListener('animationstart', (event) => {
      if (event.animationName === 'library-toy-page-enter') {
        (window as unknown as { __hallPageStarts: string[] }).__hallPageStarts.push(event.animationName);
      }
    });
  });
  await page.locator('[data-library-hall-next]').click();
  await expect(page.locator('[data-library-hall-page]')).toHaveText('2 / 2');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __hallPageStarts: string[] }).__hallPageStarts.length)).toBeGreaterThan(0);
  await page.locator('[data-library-hall-prev]').click();
  await expect(page.locator('[data-library-hall-page]')).toHaveText('1 / 2');
});
