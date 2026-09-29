import { copyFile, mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const KEY = 'squishy.phaser-pages-preview.squishy.save.v3';
const ORIGIN = 'http://127.0.0.1:4185';

// Unlike a stitched mockup, this records an uninterrupted Chromium tab, with
// the actual Studio creation flow and durable V3 save before Hall playback.
test('record genuine browser Hall idle → new save → settle → page and return', async ({ browser }, info) => {
  test.setTimeout(120_000);
  const setup = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ru-RU' });
  const maker = await setup.newPage();
  let saved = '';
  try {
    await maker.goto('/phaser/');
    await maker.locator('[data-library-new]').first().click();
    await expect(maker.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
    await maker.locator('[data-shape="heart"]').click();
    await maker.locator('[data-action="shape-continue"]').click();
    await maker.locator('[data-action="paint-continue"]').click();
    await maker.locator('[data-action="mixin-continue"]').click();
    const box = await maker.locator('[data-sandbox-canvas]').boundingBox();
    if (!box) throw new Error('Missing Studio surface');
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await maker.mouse.move(x, y);
    await maker.mouse.down();
    for (let i = 0; i < 22; i++) await maker.mouse.move(x + (i % 2 ? -65 : 65), y, { steps: 3 });
    await maker.mouse.up();
    await maker.locator('[data-action="mix-continue"]').click();
    await maker.locator('[data-action="decor-continue"]').click();
    await maker.locator('[data-material="chrome"]').click();
    await maker.locator('[data-action="save"]').click();
    await expect(maker.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
    saved = await maker.evaluate((key) => localStorage.getItem(key) ?? '', KEY);
    const parsed = JSON.parse(saved);
    if (parsed?.version !== 3 || parsed.library?.length !== 1) throw new Error('Invalid real V3 baseline');
    parsed.library.push({ ...parsed.library[0], id: 'video-holo', materialId: 'holo' });
    saved = JSON.stringify(parsed);
  } finally {
    await setup.close();
  }

  const recordDir = info.outputPath('library-hall-real-browser-recording');
  await mkdir(recordDir, { recursive: true });
  const context = await browser.newContext({
    locale: 'ru-RU', viewport: { width: 390, height: 844 },
    recordVideo: { dir: recordDir, size: { width: 390, height: 844 } },
    storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: [{ name: KEY, value: saved }] }] },
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await page.goto('/phaser/');
    await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '2');
    await expect(page.locator('.sandbox-library-card:visible')).toHaveCount(2);
    // One complete 6.2s ambient cycle before any UI interaction.
    await page.waitForTimeout(6200);
    await page.locator('[data-library-new]').first().click();
    await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
    await page.locator('button[data-shape="soft-square"]').click();
    await page.locator('[data-action="shape-continue"]').click();
    await page.locator('[data-action="paint-continue"]').click();
    await page.locator('[data-action="mixin-continue"]').click();
    const box = await page.locator('[data-sandbox-canvas]').boundingBox();
    if (!box) throw new Error('Missing next real Studio surface');
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 0; i < 22; i++) await page.mouse.move(x + (i % 2 ? -65 : 65), y, { steps: 3 });
    await page.mouse.up();
    await page.locator('[data-action="mix-continue"]').click();
    await page.locator('[data-action="decor-continue"]').click();
    await page.locator('[data-material="pearl"]').click();
    await page.locator('[data-action="save"]').click();
    await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
    await page.locator('[data-action="home"]').click();
    await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '3');
    await expect(page.locator('[data-library-hall-page]')).toHaveText('2 / 2');
    await page.waitForTimeout(2200);
    await page.locator('[data-library-hall-prev]').click();
    await expect(page.locator('[data-library-hall-page]')).toHaveText('1 / 2');
    await page.waitForTimeout(2200);
    await page.locator('[data-library-hall-next]').click();
    await expect(page.locator('[data-library-hall-page]')).toHaveText('2 / 2');
    await page.waitForTimeout(1400);
    expect(errors).toEqual([]);
    const endState = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), KEY);
    expect(endState.library).toHaveLength(3);
    expect(new Set(endState.library.map((toy: { shapeId: string }) => toy.shapeId)).size).toBeGreaterThan(1);
  } finally {
    await context.close();
  }
  const video = page.video();
  if (!video) throw new Error('Real browser video missing');
  await copyFile(await video.path(), info.outputPath('library-hall-real-browser-arrival-page-390.webm'));
});
