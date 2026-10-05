import { writeFile } from 'node:fs/promises';
import { expect, test, type Page, type TestInfo } from '@playwright/test';

// Each capture has the same 60s budget. Build all six identities once from a
// genuinely created/saved toy; isolate the comparison and each room's captures.
let fixtureSave: string;
test.beforeAll(async ({ browser, baseURL }, info) => {
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/phaser/');
    await page.locator('[data-library-new]').first().click();
    await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
    await page.locator('[data-shape="heart"]').click();
    await page.locator('[data-action="shape-continue"]').click();
    await page.locator('[data-action="paint-continue"]').click();
    await page.locator('[data-action="mixin-continue"]').click();
    const surface = await page.locator('[data-sandbox-canvas]').boundingBox();
    if (!surface) throw new Error('No real maker surface');
    const x = surface.x + surface.width / 2;
    const y = surface.y + surface.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 0; i < 22; i += 1) await page.mouse.move(x + (i % 2 ? -65 : 65), y, { steps: 3 });
    await page.mouse.up();
    await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
    await page.locator('[data-action="mix-continue"]').click();
    await page.locator('[data-action="decor-continue"]').click();
    await page.locator('[data-action="save"]').click();
    await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
    // The real saved Studio toy supplies every material fixture: no fake skins.
    await page.locator('[data-sandbox-canvas]').screenshot({ path: info.outputPath('library-hall-studio-soft-canvas-390.png'), animations: 'disabled' });
    await page.evaluate(() => {
      const key = 'squishy.phaser-pages-preview.squishy.save.v3';
      const save = JSON.parse(localStorage.getItem(key) ?? 'null');
      if (!save || save.library.length !== 1) throw new Error('Expected a real saved toy');
      const toy = save.library[0];
      save.library = (['soft', 'jelly', 'marshmallow', 'chrome', 'holo', 'pearl'] as const).map((materialId) => ({
        ...toy,
        id: `material-fixture-${materialId}`,
        materialId,
      }));
      localStorage.setItem(key, JSON.stringify(save));
    });
    fixtureSave = await page.evaluate(() => localStorage.getItem('squishy.phaser-pages-preview.squishy.save.v3')!);
  } finally { await context.close(); }
});

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/phaser/');
  await page.evaluate(save => localStorage.setItem('squishy.phaser-pages-preview.squishy.save.v3', save), fixtureSave);
  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '6');
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-hall-room', '1');
});

const captures = (page: Page, info: TestInfo) => {
  const visibleProfiles = async (): Promise<(string | null)[]> => page.locator('.sandbox-library-card:visible [data-library-material-profile]')
    .evaluateAll((canvases) => canvases.map((canvas) => canvas.getAttribute('data-library-material-profile')));
  const captureThumbnail = async (material: string): Promise<void> => {
    // Element screenshots can crop a transformed/overflow-hidden canvas or
    // capture the wrong viewport offset. Save its actual native 256px pixels.
    const pngBase64 = await page.locator(`[data-library-play-id="material-fixture-${material}"] canvas`)
      .evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL('image/png').split(',')[1]);
    if (!pngBase64) throw new Error(`Empty ${material} thumbnail`);
    await writeFile(info.outputPath(`library-hall-thumbnail-${material}-390.png`), Buffer.from(pngBase64, 'base64'));
  };
  const captureStudio = async (material: string): Promise<void> => {
    await page.locator(`[data-library-play-id="material-fixture-${material}"]`).click();
    await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
    await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
    await page.locator('[data-sandbox-canvas]').screenshot({
      path: info.outputPath(`library-hall-studio-${material}-canvas-390.png`), animations: 'disabled',
    });
    await page.locator('[data-action="home"]').click();
  };
  return { visibleProfiles, captureThumbnail, captureStudio };
};

test('real saved materials retain their optical comparisons and phone captures', async ({ page }, info) => {
  const { visibleProfiles, captureThumbnail, captureStudio } = captures(page, info);
  const materialStats = await page.locator('.sandbox-library-card [data-library-material-profile]').evaluateAll((canvases) =>
    canvases.map((node) => {
      const canvas = node as HTMLCanvasElement;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('No thumbnail context');
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let count = 0, alpha = 0, luma = 0, luma2 = 0, chroma = 0;
      let rg = 0, rg2 = 0, gb = 0, gb2 = 0;
      for (let y = Math.floor(canvas.height * .22); y < Math.ceil(canvas.height * .78); y += 2) {
        for (let x = Math.floor(canvas.width * .22); x < Math.ceil(canvas.width * .78); x += 2) {
          const offset = (y * canvas.width + x) * 4;
          const a = pixels[offset + 3] ?? 0;
          if (a < 48) continue;
          const r = pixels[offset] ?? 0, g = pixels[offset + 1] ?? 0, b = pixels[offset + 2] ?? 0;
          const y709 = .2126 * r + .7152 * g + .0722 * b;
          const rgAxis = r - g, gbAxis = g - b;
          count += 1; alpha += a; luma += y709; luma2 += y709 * y709;
          chroma += Math.max(r, g, b) - Math.min(r, g, b);
          rg += rgAxis; rg2 += rgAxis * rgAxis; gb += gbAxis; gb2 += gbAxis * gbAxis;
        }
      }
      const samples = Math.max(1, count);
      const mean = luma / samples;
      const rgMean = rg / samples, gbMean = gb / samples;
      return {
        material: canvas.getAttribute('data-library-material-profile') ?? '',
        count,
        alpha: alpha / samples,
        lumaStd: Math.sqrt(Math.max(0, luma2 / samples - mean * mean)),
        chroma: chroma / samples,
        // Spatial chromatic-axis variance measures nacre/holographic hue movement
        // without rewarding a uniformly saturated base colour.
        hueStd: Math.sqrt(
          Math.max(0, rg2 / samples - rgMean * rgMean)
          + Math.max(0, gb2 / samples - gbMean * gbMean)
        ),
      };
    }),
  );
  const stats = Object.fromEntries(materialStats.map((entry) => [entry.material, entry]));
  expect(Object.keys(stats).sort()).toEqual(['chrome', 'holo', 'jelly', 'marshmallow', 'pearl', 'soft']);
  for (const entry of materialStats) expect(entry.count, `${entry.material} has a visible material body`).toBeGreaterThan(2_000);
  await writeFile(info.outputPath('library-hall-material-stats.json'), JSON.stringify(materialStats, null, 2));
  expect(stats.jelly!.alpha, 'Jelly stays translucent without becoming ghost-like').toBeGreaterThan(145);
  expect(stats.jelly!.alpha, 'Jelly remains clearly more translucent than Marshmallow').toBeLessThan(stats.marshmallow!.alpha - 45);
  expect(stats.jelly!.hueStd, 'Jelly keeps more optical colour movement than powdery Marshmallow').toBeGreaterThan(stats.marshmallow!.hueStd + 0.5);
  expect(stats.marshmallow!.lumaStd, 'Marshmallow stays softer/matter than Soft').toBeLessThan(stats.soft!.lumaStd - 2);
  expect(stats.pearl!.hueStd, 'Pearl keeps spatial nacre hue movement beyond Marshmallow').toBeGreaterThan(stats.marshmallow!.hueStd + 2);
  expect(stats.holo!.hueStd, 'Holo remains substantially more spectral than Pearl').toBeGreaterThan(stats.pearl!.hueStd + 8);
  expect(stats.chrome!.lumaStd, 'Metallic has a materially stronger reflection range than Marshmallow').toBeGreaterThan(stats.marshmallow!.lumaStd + 4);
  expect(await visibleProfiles()).toEqual(['soft', 'jelly']);
  await page.screenshot({ path: info.outputPath('library-hall-material-phone-390.png'), animations: 'disabled' });
  await captureThumbnail('soft');
  await captureStudio('soft');
  await captureThumbnail('jelly');
  await captureStudio('jelly');

});

for (const room of [
  { number: 2, materials: ['marshmallow', 'chrome'], image: 'marshmallow-chrome' },
  { number: 3, materials: ['holo', 'pearl'], image: 'holo-pearl' },
]) test(`real saved ${room.image} retain desktop Hall and Studio captures`, async ({ page }, info) => {
  const { visibleProfiles, captureThumbnail, captureStudio } = captures(page, info);
  await page.setViewportSize({ width: 1440, height: 900 });
  if (room.number === 2) await page.screenshot({ path: info.outputPath('library-hall-material-desktop-1440.png'), animations: 'disabled' });
  for (let n = 1; n < room.number; n++) await page.locator('[data-library-hall-next]').click();
  expect(await visibleProfiles()).toEqual(room.materials);
  if (room.number === 2) {
    const metallicLabel = page.locator('.sandbox-library-card:visible .sandbox-library-card__footer strong').nth(1);
    await expect(metallicLabel).toContainText('Metallic');
    await expect(metallicLabel).not.toContainText('Chrome');
  }
  await page.screenshot({ path: info.outputPath(`library-hall-material-${room.image}-1440.png`), animations: 'disabled' });
  for (const material of room.materials) { await captureThumbnail(material); await captureStudio(material); }
});
