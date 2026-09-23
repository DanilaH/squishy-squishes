import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const sizes = [
  { name: 'phone-320', width: 320, height: 700 },
  { name: 'phone-short-375', width: 375, height: 667 },
  { name: 'phone-360', width: 360, height: 800 },
  { name: 'phone-390', width: 390, height: 844 },
  { name: 'tablet-600', width: 600, height: 800 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1280', width: 1280, height: 800 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
  { name: 'landscape-844', width: 844, height: 390 },
  { name: 'landscape-667', width: 667, height: 375 },
] as const;

async function audit(page: Page, label: string, saved: boolean): Promise<unknown> {
  await expect(page.locator('[data-sandbox-library]')).toHaveClass(/is-library-hall/);
  await expect(page.locator('[data-library-hall-stage]')).toBeVisible();
  const result = await page.evaluate(() => {
    const shell = document.querySelector<HTMLElement>('[data-sandbox-library]')!;
    const nav = shell.querySelector<HTMLElement>('.library-hall-nav')!;
    const rect = (el: Element) => el.getBoundingClientRect().toJSON();
    const stands = Array.from(shell.querySelectorAll<HTMLElement>('.sandbox-library-card:not([hidden]), .library-hall-vacant'));
    const footprint = stands.map((stand) => {
      const box = rect(stand);
      const pseudo = getComputedStyle(stand, '::before');
      const pseudoWidth = Number.parseFloat(pseudo.width);
      const pseudoHeight = Number.parseFloat(pseudo.height);
      const sourceWidth = Math.min(pseudoWidth, pseudoHeight * 460 / 262);
      const sourceHeight = sourceWidth * 262 / 460;
      const standTop = box.top + Number.parseFloat(pseudo.top) + (pseudoHeight - sourceHeight) / 2;
      const standBottom = standTop + sourceHeight;
      const canvas = stand.querySelector<HTMLCanvasElement>('canvas');
      const footer = stand.querySelector<HTMLElement>('.sandbox-library-card__footer');
      let toyBottom: number | null = null;
      let toyTop: number | null = null;
      if (canvas) {
        const bitmap = canvas.getContext('2d', { willReadFrequently: true });
        if (!bitmap) throw new Error('Real thumbnail context missing');
        const { width, height } = canvas;
        const pixels = bitmap.getImageData(0, 0, width, height).data;
        let first = height;
        let last = -1;
        for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
          if (pixels[(y * width + x) * 4 + 3]! >= 80) { first = Math.min(first, y); last = Math.max(last, y); }
        }
        if (last < 0) throw new Error('Toy canvas has no visible pixels');
        const bounds = rect(canvas);
        const rendered = Math.min(bounds.width, bounds.height);
        const bitmapTop = bounds.top + (bounds.height - rendered) / 2;
        toyTop = bitmapTop + first / height * rendered;
        toyBottom = bitmapTop + (last + 1) / height * rendered;
      }
      return { box, pedestal: { top: standTop, bottom: standBottom, width: sourceWidth }, toyTop, toyBottom, footer: footer && rect(footer) };
    });
    const buttons = Array.from(shell.querySelectorAll<HTMLButtonElement>('.sandbox-library-topbar button, .sandbox-library-heading button, .library-hall-nav button, .sandbox-library-card:not([hidden]) button')).filter(b => !b.disabled);
    const hitIssues = buttons.filter(b => {
      const r = b.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !hit || !b.contains(hit);
    }).map(b => b.outerHTML.slice(0, 120));
    const props = ['cabinet', 'shelf', 'plant'].map(name => {
      const el = shell.querySelector<HTMLElement>(`.library-hall-scene__${name}`)!;
      return { name, visible: getComputedStyle(el).display !== 'none', rect: rect(el) };
    });
    return {
      viewport: { width: innerWidth, height: innerHeight },
      scroll: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, shell: shell.scrollHeight, shellClient: shell.clientHeight },
      nav: rect(nav), heading: rect(shell.querySelector('.sandbox-library-heading')!),
      floor: rect(shell.querySelector('.library-hall-scene__floor')!),
      stands: footprint, props, hitIssues,
    };
  });
  const facts = result as { viewport: { width: number; height: number }; scroll: { width: number; height: number; shell: number; shellClient: number }; nav: { top: number; bottom: number }; heading: { bottom: number }; floor: { top: number }; stands: Array<{ box: { left: number; right: number; top: number; bottom: number }; pedestal: { top: number; bottom: number; width: number }; toyTop: number | null; toyBottom: number | null; footer: { top: number; bottom: number } | null }>; props: Array<{ name: string; visible: boolean; rect: { left: number; right: number; top: number; bottom: number } }>; hitIssues: string[] };
  expect(facts.scroll.width, `${label}: horizontal scroll`).toBeLessThanOrEqual(facts.viewport.width + 2);
  expect(facts.scroll.height, `${label}: vertical scroll`).toBeLessThanOrEqual(facts.viewport.height + 2);
  expect(facts.scroll.shell, `${label}: shell must not clip content vertically`).toBeLessThanOrEqual(facts.scroll.shellClient + 3);
  expect(facts.hitIssues, `${label}: clickable controls not intercepted`).toEqual([]);
  expect(facts.stands, `${label}: two visible positions`).toHaveLength(2);
  expect(facts.nav.bottom, `${label}: nav visible`).toBeLessThanOrEqual(facts.viewport.height + 2);
  for (const stand of facts.stands) {
    expect(stand.pedestal.width, `${label}: pedestal width`).toBeGreaterThanOrEqual(facts.viewport.height <= 520 ? 90 : 118);
    expect(stand.pedestal.top, `${label}: pedestal below header`).toBeGreaterThan(facts.heading.bottom + 16);
    expect(stand.pedestal.bottom, `${label}: full pedestal in screen`).toBeLessThanOrEqual(facts.nav.top - 3);
    if (saved) {
      expect(stand.toyTop, `${label}: real saved toy visible`).not.toBeNull();
      expect(stand.toyBottom, `${label}: real saved toy visible`).not.toBeNull();
      if (stand.toyBottom !== null) {
        expect(stand.toyBottom - stand.pedestal.top, `${label}: real squishy must rest on tabletop, not float or sink`).toBeGreaterThanOrEqual(-24);
        expect(stand.toyBottom - stand.pedestal.top, `${label}: real squishy must rest on tabletop, not float or sink`).toBeLessThanOrEqual(32);
      }
      if (stand.footer) {
        expect(stand.footer.top, `${label}: label must not cover most of pedestal`).toBeGreaterThanOrEqual(stand.pedestal.bottom - 26);
        expect(stand.footer.bottom, `${label}: label clear of navigation`).toBeLessThanOrEqual(facts.nav.top + 2);
      }
    }
  }
  const visibleProps = facts.props.filter(p => p.visible);
  if (facts.viewport.width <= 430 && facts.viewport.height > facts.viewport.width) {
    const cabinet = visibleProps.find(prop => prop.name === 'cabinet');
    expect(cabinet, `${label}: phone cabinet visible`).toBeTruthy();
    if (cabinet) expect(Math.abs(cabinet.rect.bottom - facts.floor.top), `${label}: phone cabinet grounded at floor seam`).toBeLessThanOrEqual(3);
  }
  for (const prop of visibleProps) {
    expect(prop.rect.left, `${label}: ${prop.name} left`).toBeGreaterThanOrEqual(-1);
    expect(prop.rect.right, `${label}: ${prop.name} right`).toBeLessThanOrEqual(facts.viewport.width + 1);
    expect(prop.rect.top, `${label}: ${prop.name} below heading`).toBeGreaterThanOrEqual(facts.heading.bottom + 3);
    expect(prop.rect.bottom, `${label}: ${prop.name} fits viewport`).toBeLessThanOrEqual(facts.viewport.height + 1);
  }
  return result;
}

async function createRealSavedHeart(page: Page): Promise<void> {
  await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
  await page.locator('[data-shape="heart"]').click();
  await page.locator('[data-action="shape-continue"]').click();
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();
  const b = await page.locator('[data-sandbox-canvas]').boundingBox();
  if (!b) throw new Error('Missing real squishy surface');
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  for (let i = 0; i < 22; i += 1) await page.mouse.move(b.x + b.width / 2 + (i % 2 ? -65 : 65), b.y + b.height / 2, { steps: 3 });
  await page.mouse.up();
  await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
  await page.locator('[data-action="mix-continue"]').click();
  await page.locator('[data-action="decor-continue"]').click();
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  const key = 'squishy.phaser-pages-preview.squishy.save.v3';
  await page.evaluate((storageKey) => {
    const save = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
    if (!save || save.library.length !== 1) throw new Error('Real save missing');
    const toy = save.library[0];
    save.library = [toy, { ...toy, id: 'responsive-real-copy' }];
    localStorage.setItem(storageKey, JSON.stringify(save));
  }, key);
  await page.reload();
  await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '2');
}

test('independent responsive visual geometry: empty room and two real saved toys', async ({ browser }, info) => {
  const context = await browser.newContext({ locale: 'ru-RU', viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await page.goto('/phaser/');
    for (const size of sizes) {
      await page.setViewportSize({ width: size.width, height: size.height });
      const facts = await audit(page, `${size.name}/empty`, false);
      await writeFile(info.outputPath(`library-hall-geometry-empty-${size.name}.json`), JSON.stringify(facts, null, 2));
      await page.screenshot({ path: info.outputPath(`library-hall-empty-${size.name}.png`), animations: 'disabled' });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await createRealSavedHeart(page);
    for (const size of sizes) {
      await page.setViewportSize({ width: size.width, height: size.height });
      const facts = await audit(page, `${size.name}/saved`, true);
      await writeFile(info.outputPath(`library-hall-geometry-saved-${size.name}.json`), JSON.stringify(facts, null, 2));
      await page.screenshot({ path: info.outputPath(`library-hall-saved-${size.name}.png`), animations: 'disabled' });
    }
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});
