import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

/** Temporary geometry only. No generated art, no UI re-creation, no gameplay edits. */
const devices = [
  { name: 'portrait-320', width: 320, height: 700 },
  { name: 'portrait-390', width: 390, height: 844 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1280', width: 1280, height: 800 },
  { name: 'landscape-short', width: 844, height: 390 },
] as const;

const measureAndPreview = async (page: Page) => page.evaluate(() => {
  const shell = document.querySelector<HTMLElement>('[data-sandbox-app]');
  if (!shell) throw new Error('Actual studio shell missing');
  const stage = shell.querySelector<HTMLElement>('.sandbox-stage');
  const canvas = shell.querySelector<HTMLElement>('[data-sandbox-canvas]');
  const controls = shell.querySelector<HTMLElement>('.sandbox-controls');
  if (!stage || !canvas || !controls) throw new Error('Actual stage/canvas/controls missing');
  const rect = (node: Element | null) => {
    if (!node) return null;
    const r = node.getBoundingClientRect();
    return { x: +r.x.toFixed(2), y: +r.y.toFixed(2), width: +r.width.toFixed(2), height: +r.height.toFixed(2), right: +r.right.toFixed(2), bottom: +r.bottom.toFixed(2) };
  };
  const cr = canvas.getBoundingClientRect();
  const sr = stage.getBoundingClientRect();
  const pr = controls.getBoundingClientRect();
  // Proxy only: actual rendered squishy silhouette is NOT inferred from canvas bounds.
  const toyBottomProxy = cr.top + cr.height * 0.8;
  const tableTop = Math.min(toyBottomProxy - 3, sr.bottom - 3);
  const freeDepth = Math.max(0, Math.min(sr.bottom, pr.top - 8) - tableTop);
  stage.querySelector('[data-studio-gate1-proxy]')?.remove();
  const overlay = document.createElement('div');
  overlay.dataset.studioGate1Proxy = '';
  Object.assign(overlay.style, { position: 'absolute', inset: '0', overflow: 'hidden', pointerEvents: 'none', zIndex: '0' });
  const desk = document.createElement('div');
  Object.assign(desk.style, {
    position: 'absolute', top: `${tableTop - sr.top}px`, left: '50%', transform: 'translateX(-50%)',
    width: `${Math.min(sr.width, Math.max(290, cr.width * 1.6))}px`,
    height: `${freeDepth}px`,
    border: '2px dashed #9b4b1c', borderRadius: '13px 13px 3px 3px',
    background: 'rgba(225,156,78,.25)', boxShadow: 'inset 0 -7px rgba(108,65,116,.18)',
  });
  overlay.append(desk);
  stage.insertBefore(overlay, stage.firstChild);
  const btns = [...shell.querySelectorAll<HTMLButtonElement>('.sandbox-controls button, .sandbox-topbar button')]
    .filter(b => b.getClientRects().length > 0);
  const hitIssues = btns.filter(b => {
    const r = b.getBoundingClientRect();
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !el || !b.contains(el);
  }).map(b => b.dataset.action || b.textContent?.trim() || '(button)');
  return {
    stage: shell.dataset.stage, viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
    shell: rect(shell), topbar: rect(shell.querySelector('.sandbox-topbar')),
    heading: rect(shell.querySelector('.sandbox-copy')), stageBounds: rect(stage), canvas: rect(canvas),
    controls: rect(controls), panel: rect(shell.querySelector('.sandbox-panel')),
    primaryButton: rect(shell.querySelector('.sandbox-panel .sandbox-primary')),
    firstChoice: rect(shell.querySelector('.sandbox-shape, .sandbox-swatch')),
    deskProxy: { top: +tableTop.toFixed(2), visibleDepth: +freeDepth.toFixed(2), toyBottomProxy: +toyBottomProxy.toFixed(2), note: 'toyBottomProxy is an 80% CANVAS heuristic, NOT measured toy silhouette' },
    hitIssues, documentScrollWidth: document.documentElement.scrollWidth,
  };
});

for (const d of devices) {
  test(`Studio Gate 1 real-UI geometry ${d.name}`, async ({ browser }, info) => {
    const context = await browser.newContext({ locale: 'ru-RU', viewport: { width: d.width, height: d.height } });
    const page = await context.newPage();
    try {
      await page.goto('/phaser/');
      await expect(page.locator('#app')).toHaveAttribute('data-jelly-ui-ready', '');
      await expect(page.locator('[data-sandbox-library]')).toBeVisible();
      await page.locator('[data-library-new]').first().click();
      const shell = page.locator('[data-sandbox-app]');
      await expect(shell).toHaveAttribute('data-stage', 'shape');
      const shape = await measureAndPreview(page);
      await page.screenshot({ path: info.outputPath(`studio-gate1-${d.name}-shape.png`), animations: 'disabled' });
      await page.locator('button[data-shape="heart"]').click();
      await page.locator('[data-action="shape-continue"]').click();
      await expect(shell).toHaveAttribute('data-stage', 'paint');
      const paint = await measureAndPreview(page);
      await page.screenshot({ path: info.outputPath(`studio-gate1-${d.name}-paint.png`), animations: 'disabled' });
      await writeFile(info.outputPath(`studio-gate1-${d.name}-layout.json`), JSON.stringify({ source: 'actual Phaser Pages DOM in Chromium', device: d, shape, paint }, null, 2));
      expect(shape.canvas?.width, 'shape canvas must exist').toBeGreaterThan(0);
      expect(paint.canvas?.width, 'paint canvas must exist').toBeGreaterThan(0);
      expect(shape.documentScrollWidth).toBeLessThanOrEqual(d.width + 2);
      expect(paint.documentScrollWidth).toBeLessThanOrEqual(d.width + 2);
      expect(shape.hitIssues).toEqual([]);
      expect(paint.hitIssues).toEqual([]);
    } finally {
      await context.close();
    }
  });
}
