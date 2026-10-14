import {expect, test} from '@playwright/test';
import manifest from '../../src/sandbox/qualityArtManifest.json' with {type: 'json'};
import {ACCESSORY_IDS, STICKER_IDS, createStickerPlacement} from '../../src/sandbox/decor';
import {MIXIN_IDS, createMixInPlacement, createBodyFillStroke} from '../../src/sandbox/appearance';
import {createSandboxDraft} from '../../src/sandbox/types';
import {createDefaultSaveV3, decodeSaveStateV3} from '../../src/platform/saveV3';
import {getShape} from '../../src/game/shapes';
import {initialAccessoryPlacements} from '../../src/sandbox/freeCraft';
import sharp from 'sharp';

// Separate browser contexts and output paths; the full-catalog reviews can be
// sharded independently instead of keeping every viewport on one CI runner.
test.describe.configure({mode: 'parallel'});

const originals = new Set(['cat-ears', 'bunny-ears', 'horns', 'bow', 'crown']);
const authored = ACCESSORY_IDS.filter(id => !originals.has(id));
const expectedIds = [...authored, ...STICKER_IDS.map(id => `sticker-${id}`), ...MIXIN_IDS.map(id => id === 'hearts' ? 'filler-heart' : `filler-${id}`)];
const draft = createSandboxDraft();
const library = [
  ...authored.map((id, i) => ({...draft, id, createdAt: i + 1, shapeId: 'mochi' as const,
    decor: {...draft.decor, eyes: 'dot' as const, mouth: 'smile' as const,
      accessories: initialAccessoryPlacements(getShape('mochi'), id)}})),
  {...draft, id: 'all-stickers', createdAt: 30, shapeId: 'soft-square' as const,
    appearance: {...draft.appearance, strokes: [createBodyFillStroke(0xcab0e8)]},
    decor: {...draft.decor, stickers: STICKER_IDS.map((id, i) => ({...createStickerPlacement(id,
      {u: .24 + i % 4 * .17, v: .76 - Math.floor(i / 4) * .17}, i), s: 35, r: 0}))}},
  {...draft, id: 'all-fillers', createdAt: 31, shapeId: 'soft-square' as const,
    appearance: {...draft.appearance, strokes: [createBodyFillStroke(0x655176)], mixins: MIXIN_IDS.map((id, i) => createMixInPlacement(id,
      {u: .24 + i % 4 * .17, v: .76 - Math.floor(i / 4) * .17}, 25, 0))}},
];
const state = {...createDefaultSaveV3(), libraryCapacity: 24, totalCrafts: library.length, library};

test('authored set covers every planned catalog ID without changing V3 data', () => {
  expect(Object.keys(manifest).sort()).toEqual(expectedIds.sort());
  expect(expectedIds).toHaveLength(43);
  expect(decodeSaveStateV3(state).library).toHaveLength(library.length);
  for (const id of ['leaves', 'wings']) {
    const asset = manifest[id as keyof typeof manifest] as {leftCrop?: number[]; leftRoot?: number[]};
    expect(asset.leftCrop).toHaveLength(4); expect(asset.leftRoot).toHaveLength(2);
    expect(asset.leftRoot![0]).toBeGreaterThan(0); expect(asset.leftRoot![0]).toBeLessThanOrEqual(1);
  }
});

test('authored holes and bubble translucency survive runtime conversion', async () => {
  for (const id of ['halo', 'sticker-donut', 'filler-bubbles']) {
    const path = new URL(`../../public/assets/art-quality/${id}.webp`, import.meta.url).pathname;
    const {data, info} = await sharp(path).ensureAlpha().raw().toBuffer({resolveWithObject: true});
    const crop = manifest[id as keyof typeof manifest].crop;
    const x = Math.floor(crop[0]! + crop[2]! / 2), y = Math.floor(crop[1]! + crop[3]! / 2);
    expect(data[(y * info.width + x) * 4 + 3], id).toBeLessThan(id === 'filler-bubbles' ? 160 : 16);
    expect(data[3], `${id} transparent padding`).toBe(0);
  }
  const {data, info} = await sharp(new URL('../../public/assets/art-quality/headphones.webp', import.meta.url).pathname).ensureAlpha().raw().toBuffer({resolveWithObject: true});
  const [left, top, width, height] = manifest.headphones.crop;
  for (const fraction of [.3, .7]) {
    const x = Math.floor(left! + width! * fraction), y = Math.floor(top! + height! * .8);
    expect(data[(y * info.width + x) * 4 + 3], 'earcups leave the eye region open').toBeLessThan(16);
  }
});

for (const [locale, viewport] of [['ru-RU', {width: 390, height: 844}], ['en-US', {width: 1440, height: 900}], ['ru-RU', {width: 1440, height: 900}]] as const)
test(`face-zone art refinement ${locale} ${viewport.width}`, async ({browser, baseURL}, info) => {
  test.setTimeout(90_000);
  const context = await browser.newContext({baseURL, locale, viewport, reducedMotion: 'reduce'});
  const page = await context.newPage();
  try {
    await page.addInitScript(state => localStorage.setItem('squishy.save.v3', JSON.stringify(state)), state);
    await page.goto(`/squishy-squishes/${locale === 'en-US' ? '?artFormat=webp' : ''}`);
    await page.locator('[data-room-collection]').click();
    for (const id of ['headphones', 'eye-patch']) {
      const play = page.locator(`[data-library-play-id="${id}"]`); await play.scrollIntoViewIfNeeded(); await play.click();
      const canvas = page.locator('[data-sandbox-canvas]');
      await expect(canvas).toHaveAttribute('data-phaser-ready', 'true');
      const gearDepth = await page.locator(`[data-accessory-id="${id}"]`).evaluate(el => Number(getComputedStyle(el).zIndex));
      const faceDepth = await page.locator('.free-face-foreground').evaluate(el => Number(getComputedStyle(el).zIndex));
      if (id === 'eye-patch') expect(gearDepth).toBeGreaterThan(faceDepth);
      else expect(faceDepth).toBeGreaterThan(gearDepth);
      const box = (await canvas.boundingBox())!;
      await page.screenshot({path: info.outputPath(`${id}.png`)});
      await page.screenshot({path: info.outputPath(`crop-${id}.png`), clip: {
        x: Math.max(0, Math.min(viewport.width - 380, box.x + box.width / 2 - 190)),
        y: Math.max(0, Math.min(viewport.height - 320, box.y + box.height / 2 - 160)), width: 380, height: 320,
      }});
      if (id === 'headphones' && locale === 'ru-RU' && viewport.width === 1440) {
        await page.locator('[data-action="edit-saved"]').click();
        await page.locator('[data-craft-section="decor"]').click();
        await page.locator('[data-decor-section="accessory"]').click();
        for (const detail of ['leaves', 'bolt']) {
          await page.locator(`[data-accessory-icon="${detail}"]`).scrollIntoViewIfNeeded();
          await page.screenshot({path: info.outputPath(`catalog-${detail}.png`)});
        }
        await page.locator('[data-decor-section="stickers"]').click();
        await page.locator('[data-sticker-icon="ghost"]').scrollIntoViewIfNeeded();
        await page.screenshot({path: info.outputPath('sticker-catalog.png')});
        await page.locator('[data-craft-section="mixins"]').click();
        await page.screenshot({path: info.outputPath('filler-catalog.png')});
        await page.locator('[data-action="save"]').click();
        await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
      }
      await page.locator('[data-action="home"]').click();
    }
  } finally {await context.close();}
});

test('new paired art selection tracks scale and rotation and retains the edit after reload', async ({page}, info) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.addInitScript(state => {if (!localStorage.getItem('squishy.save.v3')) localStorage.setItem('squishy.save.v3', JSON.stringify(state));}, state);
  await page.goto('/squishy-squishes/'); await page.locator('[data-room-collection]').click();
  const play = page.locator('[data-library-play-id="wings"]'); await play.scrollIntoViewIfNeeded(); await play.click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  await page.locator('[data-action="edit-saved"]').click();
  await page.locator('[data-craft-section="decor"]').click();
  await page.locator('[data-decor-section="objects"]').click();
  await page.locator('[data-object="accessory:0"]').click();
  const selection = page.locator('[data-accessory-selection]');
  await expect(selection).toBeVisible(); const before = (await selection.boundingBox())!;
  await page.locator('[data-object-control="rotation"]').fill('65');
  await page.locator('[data-object-control="scale"]').fill('1.25');
  await expect.poll(async () => (await selection.boundingBox())!.width).not.toBe(before.width);
  await page.screenshot({path: info.outputPath('new-wing-transformed.png')});
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  await page.reload();
  const saved = decodeSaveStateV3(await page.evaluate(() => JSON.parse(localStorage.getItem('squishy.save.v3')!)));
  const wings = saved.library.find(toy => toy.id === 'wings')!.decor.accessories!;
  expect(wings).toHaveLength(2); expect(wings[0]!.s).toBe(1.25);
  expect(wings[0]!.r).toBeCloseTo(65 / 180 * Math.PI, 6);
  expect(wings[1]).toEqual(decodeSaveStateV3(state).library.find(toy => toy.id === 'wings')!.decor.accessories![1]);
});

for (const [locale, viewport] of [
  ['ru-RU', {width: 390, height: 844}],
  ['en-US', {width: 1440, height: 900}],
  ['ru-RU', {width: 568, height: 320}],
] as const) test(`complete authored catalog, live attachment and persistence ${locale} ${viewport.width}`, async ({browser, baseURL}, info) => {
  test.setTimeout(240_000);
  const context = await browser.newContext({baseURL, locale, viewport, reducedMotion: 'reduce'});
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {if (message.text().includes('[squishy:quality-art]')) errors.push(message.text());});
  try {
    await page.addInitScript(state => {if (!localStorage.getItem('squishy.save.v3')) localStorage.setItem('squishy.save.v3', JSON.stringify(state));}, state);
    await page.goto(`/squishy-squishes/${locale === 'en-US' ? '?artFormat=webp' : ''}`);
    await expect(page.locator('[data-library-table-ready]')).toHaveAttribute('data-library-table-ready', 'true');
    const requests = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name));
    for (const id of expectedIds) expect(requests.some(url => url.includes(`/assets/art-quality/${id}.`)), id).toBe(true);
    await page.locator('[data-room-collection]').click();
    for (const toy of library) {
      const play = page.locator(`[data-library-play-id="${toy.id}"]`);
      await play.scrollIntoViewIfNeeded(); await play.click();
      const canvas = page.locator('[data-sandbox-canvas]');
      await expect(canvas).toHaveAttribute('data-phaser-ready', 'true');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight), toy.id).toBe(true);
      await page.screenshot({path: info.outputPath(`${toy.id}.png`)});
      const boxForReview = (await canvas.boundingBox())!;
      const reviewWidth = Math.min(380, viewport.width), reviewHeight = Math.min(320, viewport.height);
      await page.screenshot({path: info.outputPath(`crop-${toy.id}.png`), clip: {
        x: Math.max(0, Math.min(viewport.width - reviewWidth, boxForReview.x + boxForReview.width / 2 - reviewWidth / 2)),
        y: Math.max(0, Math.min(viewport.height - reviewHeight, boxForReview.y + boxForReview.height / 2 - reviewHeight / 2)),
        width: reviewWidth, height: reviewHeight,
      }});
      if (authored.includes(toy.id as typeof authored[number])) {
        const gear = page.locator('[data-accessory-index]');
        expect(await gear.count()).toBe(toy.decor.accessories?.length);
        await expect.poll(() => gear.first().getAttribute('data-accessory-matrix')).not.toBeNull();
        const before = await gear.first().getAttribute('data-accessory-matrix');
        const box = (await canvas.boundingBox())!;
        await page.mouse.move(box.x + box.width * .5, box.y + box.height * .5); await page.mouse.down();
        await page.mouse.move(box.x + box.width * .60, box.y + box.height * .54, {steps: 8});
        await expect.poll(() => gear.first().getAttribute('data-accessory-matrix')).not.toBe(before);
        await page.mouse.up();
        await expect.poll(async () => Number(await page.locator('[data-sandbox-app]').getAttribute('data-sandbox-squeezes'))).toBeGreaterThan(0);
      }
      if (toy.id === 'all-stickers') {
        await page.locator('[data-action="edit-saved"]').click();
        await page.locator('[data-decor-section="accessory"]').click();
        for (const id of ['crown', 'leaves', 'bolt']) {
          await page.locator(`[data-accessory-icon="${id}"]`).scrollIntoViewIfNeeded();
          await page.screenshot({path: info.outputPath(`catalog-${id}.png`)});
        }
        await page.locator('[data-decor-section="stickers"]').click();
        await page.locator('[data-sticker-icon="ghost"]').scrollIntoViewIfNeeded();
        await page.screenshot({path: info.outputPath('sticker-catalog.png')});
        await page.locator('[data-craft-section="mixins"]').click();
        await page.screenshot({path: info.outputPath('filler-catalog.png')});
        await page.locator('[data-action="save"]').click();
        await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
      }
      await page.locator('[data-action="home"]').click();
      await expect(page.locator('[data-room-view]')).toHaveAttribute('data-room-view', 'collection');
    }
    await page.reload();
    expect(decodeSaveStateV3(await page.evaluate(() => JSON.parse(localStorage.getItem('squishy.save.v3')!))).library).toEqual(decodeSaveStateV3(state).library);
    expect(errors).toEqual([]);
  } finally {await context.close();}
});
