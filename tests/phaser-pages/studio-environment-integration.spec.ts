import { expect, test, type Page, type TestInfo } from '@playwright/test';

const views = [
  { name: 'phone-320-dpr1', width: 320, height: 700, dpr: 1 },
  { name: 'phone-320-dpr2', width: 320, height: 700, dpr: 2 },
  { name: 'phone-390-dpr2', width: 390, height: 844, dpr: 2 },
  { name: 'desktop-1440-dpr1', width: 1440, height: 900, dpr: 1 },
  { name: 'desktop-1440-dpr2', width: 1440, height: 900, dpr: 2 },
  { name: 'desktop-1280-dpr1', width: 1280, height: 800, dpr: 1 },
  { name: 'landscape-844-dpr1', width: 844, height: 390, dpr: 1 },
] as const;

const check = async (page: Page, label: string): Promise<void> => {
  const facts = await page.evaluate(() => {
    const shell = document.querySelector<HTMLElement>('[data-sandbox-app]');
    const stage = shell?.querySelector<HTMLElement>('.sandbox-stage');
    const canvas = stage?.querySelector<HTMLElement>('[data-sandbox-canvas]');
    const floor = shell?.querySelector<HTMLElement>('.studio-env-floor');
    const art = stage?.querySelector<HTMLElement>('.studio-env-stage-art');
    const desk = art?.querySelector<HTMLElement>('[data-studio-desk]');
    if (!shell || !stage || !canvas || !floor || !art || !desk) throw new Error('Missing integrated Studio layers');
    const rect = (node: Element) => {
      const r = node.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
    };
    const images = Array.from(art.querySelectorAll('img'));
    const center = rect(canvas);
    const canvasHit = document.elementFromPoint(center.x + center.width / 2, center.y + center.height / 2);
    const buttons = Array.from(shell.querySelectorAll<HTMLButtonElement>('.sandbox-controls button, .sandbox-topbar button')).filter((b) => b.getClientRects().length);
    const hitIssues = buttons.flatMap((b) => {
      const r = b.getBoundingClientRect();
      const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return hit && b.contains(hit) ? [] : [b.dataset.action || b.textContent?.trim() || '(button)'];
    });
    const backgrounds = [getComputedStyle(shell).backgroundImage, getComputedStyle(floor).backgroundImage];
    const slices = [desk.children[0], desk.children[1], desk.children[2]].map((node) => {
      if (!node) throw new Error('Missing desk slice');
      return rect(node);
    });
    return {
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      stageName: shell.dataset.stage, stage: rect(stage), canvas: rect(canvas), floor: rect(floor),
      desk: rect(desk), deskVisible: shell.dataset.studioDeskVisible, deskDepth: shell.dataset.studioDeskDepth,
      slices, backgrounds, imagesLoaded: images.map((i) => ({ src: i.currentSrc, loaded: i.complete && i.naturalWidth > 0 })),
      middleBackground: getComputedStyle(desk.children[1]).backgroundImage,
      canvasHit: canvasHit?.tagName || '', canvasAcceptsPointer: !!canvasHit && canvas.contains(canvasHit),
      hitIssues, pageWidth: document.documentElement.scrollWidth,
      passiveArt: getComputedStyle(art).pointerEvents === 'none' && getComputedStyle(floor).pointerEvents === 'none',
    };
  });
  expect(facts.stageName, label).toMatch(/^(shape|paint)$/);
  expect(facts.imagesLoaded).toHaveLength(4);
  expect(facts.imagesLoaded.every((i) => i.loaded), `${label}: all four prop images decoded`).toBe(true);
  expect(facts.backgrounds[0]).toContain('studio-wall');
  expect(facts.backgrounds[1]).toContain('studio-floor');
  expect(facts.middleBackground).toContain('studio-desk-middle');
  expect(facts.passiveArt).toBe(true);
  expect(facts.canvasAcceptsPointer, `${label}: the real Phaser canvas stays interactive`).toBe(true);
  expect(facts.hitIssues, `${label}: all controls must remain clickable`).toEqual([]);
  expect(facts.pageWidth, `${label}: no horizontal overflow`).toBeLessThanOrEqual(facts.viewport.width + 2);
  expect(Math.abs(facts.floor.y - (facts.stage.bottom - 22)), `${label}: floor follows actual stage`).toBeLessThan(2);
  const expectedVisible = facts.viewport.height > 520 || facts.viewport.width <= facts.viewport.height;
  if (!expectedVisible || Number(facts.deskDepth) < 35) expect(facts.deskVisible).toBe('false');
  if (facts.deskVisible === 'true') {
    expect(facts.slices[0].right - facts.slices[1].x, `${label}: left/middle geometry`).toBeCloseTo(0, 1);
    expect(facts.slices[1].right - facts.slices[2].x, `${label}: middle/right geometry`).toBeCloseTo(0, 1);
    expect(facts.desk.y).toBeGreaterThanOrEqual(facts.stage.y - 2);
  }
};

for (const view of views) {
  test(`Studio v8 integrated real browser ${view.name}`, async ({ browser }, info: TestInfo) => {
    const context = await browser.newContext({ locale: 'ru-RU', viewport: { width: view.width, height: view.height }, deviceScaleFactor: view.dpr });
    const page = await context.newPage();
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    try {
      await page.goto('/phaser/');
      await expect(page.locator('#app')).toHaveAttribute('data-jelly-ui-ready', '');
      await expect(page.locator('#app')).toHaveAttribute('data-studio-env-ready', '');
      await page.locator('[data-library-new]').first().click();
      const shell = page.locator('[data-sandbox-app]');
      await expect(shell).toHaveAttribute('data-stage', 'shape');
      await expect(shell).toHaveClass(/studio-env-active/);
      await expect(shell.locator('[data-studio-desk]')).toHaveAttribute('data-studio-desk', '');
      await check(page, `${view.name}/shape`);
      await page.screenshot({ path: info.outputPath(`studio-v8-${view.name}-shape.png`), animations: 'disabled' });
      await page.locator('button[data-shape="heart"]').click();
      await page.locator('[data-action="shape-continue"]').click();
      await expect(shell).toHaveAttribute('data-stage', 'paint');
      await expect(shell.locator('[data-studio-desk]')).toHaveAttribute('data-studio-desk', '');
      await check(page, `${view.name}/paint`);
      await page.screenshot({ path: info.outputPath(`studio-v8-${view.name}-paint.png`), animations: 'disabled' });
      const box = await page.locator('[data-sandbox-canvas]').boundingBox();
      if (!box) throw new Error('Paint canvas missing');
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 12, box.y + box.height / 2 + 12, { steps: 3 });
      await page.mouse.up();
      await page.locator('[data-action="paint-continue"]').click();
      await expect(shell).toHaveAttribute('data-stage', 'mixins');
      await expect(shell).not.toHaveClass(/studio-env-active/);
      await expect(shell.locator('.studio-env-floor, .studio-env-stage-art')).toHaveCount(0);
      expect(pageErrors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
