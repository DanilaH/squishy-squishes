import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const devices = [
  { name: 'compact-ru', width: 320, height: 568, locale: 'ru-RU', dpr: 2 },
  { name: 'phone-ru', width: 390, height: 844, locale: 'ru-RU', dpr: 2 },
  { name: 'tablet-en', width: 768, height: 1024, locale: 'en-US', dpr: 1 },
  { name: 'desktop-en', width: 1280, height: 800, locale: 'en-US', dpr: 1 },
  { name: 'landscape-ru', width: 844, height: 390, locale: 'ru-RU', dpr: 1 },
] as const;

for (const device of devices) {
  test(`one grounded workshop through every step and Squeeze: ${device.name}`, async ({ browser }, info) => {
    test.setTimeout(210_000);
    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height }, locale: device.locale, deviceScaleFactor: device.dpr,
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const history: Array<{ stage: string; canvas: { x: number; y: number; width: number; height: number }; deskTop: number; deskBottom: number; floorTop: number; stageTop: number; stageHeight: number }> = [];
    try {
      await page.goto('/phaser/');
      await expect(page.locator('#app')).toHaveAttribute('data-studio-env-ready', '');
      await page.locator('[data-library-new]').first().click();
      await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');
      const sample = async (name: string, actualStage = name) => {
        const shell = page.locator('[data-sandbox-app]');
        await expect(shell).toHaveAttribute('data-stage', actualStage);
        await expect(shell).toHaveClass(/studio-env-active/);
        await expect(shell.locator('[data-studio-desk]')).toHaveCount(1);
        await expect.poll(() => page.evaluate(() => {
          const stage = document.querySelector('.sandbox-stage');
          const floor = document.querySelector('.studio-env-floor');
          return stage && floor ? Math.abs(stage.getBoundingClientRect().bottom - floor.getBoundingClientRect().top - 22) : Infinity;
        })).toBeLessThan(2);
        const result = await page.evaluate((label) => {
          const shell = document.querySelector<HTMLElement>('[data-sandbox-app]')!;
          const canvas = shell.querySelector<HTMLCanvasElement>('[data-sandbox-canvas]')!;
          const stage = shell.querySelector<HTMLElement>('.sandbox-stage')!;
          const floor = shell.querySelector<HTMLElement>('.studio-env-floor')!;
          const desk = stage.querySelector<HTMLImageElement>('[data-studio-desk]')!;
          const controls = shell.querySelector<HTMLElement>('.sandbox-controls')!;
          const c = canvas.getBoundingClientRect(), s = stage.getBoundingClientRect(), d = desk.getBoundingClientRect();
          const panel = controls.querySelector<HTMLElement>('.sandbox-panel:not([hidden])');
          const panelRect = panel?.getBoundingClientRect();
          const controlsRect = controls.getBoundingClientRect();
          const step = shell.querySelector<HTMLElement>('[data-sandbox-step]')?.getBoundingClientRect();
          const hit = document.elementFromPoint(c.left + c.width / 2, c.top + c.height / 2);
          return {
            stage: label, canvas: { x: c.left, y: c.top, width: c.width, height: c.height },
            stageTop: s.top, stageHeight: s.height, deskTop: d.top, deskBottom: d.bottom, floorTop: floor.getBoundingClientRect().top,
            wall: getComputedStyle(shell).backgroundImage, ground: getComputedStyle(floor).backgroundImage,
            groundHeight: floor.getBoundingClientRect().height,
            deskVisible: getComputedStyle(desk).display !== 'none', deskLoaded: desk.complete && desk.naturalWidth === 1237,
            propsLoaded: [...stage.querySelectorAll<HTMLImageElement>('.studio-env-decor')].map(p => p.complete && p.naturalWidth > 0),
            floorCount: shell.querySelectorAll('.studio-env-floor').length,
            artCount: stage.querySelectorAll('.studio-env-stage-art').length,
            canvasHit: !!hit && canvas.contains(hit), canvasDisabled: canvas.classList.contains('is-disabled'),
            pageWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth,
            controlsHeight: controls.clientHeight, controlsScrollHeight: controls.scrollHeight,
            controlsOverflowY: getComputedStyle(controls).overflowY,
            controlsBottom: controlsRect.bottom, panelBottom: panelRect?.bottom ?? controlsRect.top,
            stepWidth: step?.width ?? 0,
            stepVisible: !!step && getComputedStyle(step).display !== 'none' && step.width > 0,
          };
        }, name);
        expect(result.wall, `${device.name}/${name} uses actual wall PNG`).toContain('studio-wall');
        expect(result.ground, `${device.name}/${name} uses actual floor PNG`).toContain('studio-floor');
        expect(result.groundHeight).toBeGreaterThan(20);
        expect(result.propsLoaded).toEqual([true, true]);
        expect(result.deskLoaded).toBe(true);
        expect(result.floorCount).toBe(1);
        expect(result.artCount).toBe(1);
        // Finish is a material-selection preview: interaction belongs to its
        // selectable material buttons, not a guaranteed canvas hit target.
        // The following stage transitions click a real material and save.
        if (actualStage !== 'finish') {
          expect(result.canvasHit, `${device.name}/${name} keeps Phaser input`).toBe(true);
        }
        expect(result.pageWidth).toBeLessThanOrEqual(result.viewportWidth + 2);
        expect(['auto', 'scroll']).not.toContain(result.controlsOverflowY);
        expect(result.panelBottom, `${device.name}/${name} edit tray stays in viewport`).toBeLessThanOrEqual(result.controlsBottom + 2);
        if (actualStage !== 'squeeze') expect(result.stepWidth, `${device.name}/${name} step label is not a placeholder strip`).toBeLessThan(170);
        else expect(result.stepVisible, `${device.name}/${name} Squeeze has no empty step placeholder`).toBe(false);
        expect(Math.abs(result.canvas.width - result.canvas.height), 'toy canvas stays square').toBeLessThan(2);
        if (result.deskVisible) expect(result.deskBottom, `${device.name}/${name} desk draws over the floor instead of being clipped under it`).toBeGreaterThan(result.floorTop + 18);
        if (device.name !== 'landscape-ru') expect(result.deskVisible, `${device.name}/${name} has a visible desk`).toBe(true);
        const first = history[0];
        if (first && actualStage !== 'squeeze') {
          for (const axis of ['x', 'y', 'width', 'height'] as const) {
            expect(Math.abs(result.canvas[axis] - first.canvas[axis]), `${device.name}/${name}: ${axis} never jumps`).toBeLessThan(2);
          }
          expect(Math.abs(result.stageTop - first.stageTop), `${device.name}/${name}: workbench top`).toBeLessThan(2);
          expect(Math.abs(result.stageHeight - first.stageHeight), `${device.name}/${name}: workbench height`).toBeLessThan(2);
          expect(Math.abs(result.deskTop - first.deskTop), `${device.name}/${name}: desk never jumps`).toBeLessThan(2);
          expect(Math.abs(result.floorTop - first.floorTop), `${device.name}/${name}: floor never jumps`).toBeLessThan(2);
        }
        if (first && actualStage === 'squeeze' && device.name === 'desktop-en') {
          expect(result.canvas.width, 'desktop Squeeze is intentionally hero-sized').toBeGreaterThan(first.canvas.width * 1.15);
        }
        history.push({ stage: name, canvas: result.canvas, stageTop: result.stageTop,
          stageHeight: result.stageHeight, deskTop: result.deskTop, deskBottom: result.deskBottom, floorTop: result.floorTop });
        await page.screenshot({ path: info.outputPath(`workshop-${device.name}-${name}.png`), animations: 'disabled' });
        return result;
      };
      await sample('shape');
      await page.locator('button[data-shape="paw"]').click();
      await page.locator('[data-action="shape-continue"]').click();
      await sample('paint');
      const paint = await page.locator('[data-sandbox-canvas]').boundingBox();
      if (!paint) throw new Error('Missing paint surface');
      await page.mouse.move(paint.x + paint.width * .45, paint.y + paint.height * .60);
      await page.mouse.down();
      await page.mouse.move(paint.x + paint.width * .55, paint.y + paint.height * .60, { steps: 5 });
      await page.mouse.up();
      await page.locator('[data-action="paint-continue"]').click();
      await sample('mixins');
      await page.locator('[data-action="mixin-continue"]').click();
      await sample('mix');
      const mix = await page.locator('[data-sandbox-canvas]').boundingBox();
      if (!mix) throw new Error('Missing mix surface');
      const x = mix.x + mix.width / 2, y = mix.y + mix.height / 2;
      await page.mouse.move(x, y); await page.mouse.down();
      for (let i = 0; i < 36; i += 1) await page.mouse.move(x + (i % 2 ? -55 : 55), y, { steps: 2 });
      await page.mouse.up();
      await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
      await page.locator('[data-action="mix-continue"]').click();
      await sample('decor');
      await page.locator('[data-decor-section="stickers"]').click();
      await sample('decor-stickers', 'decor');
      await page.locator('[data-decor-section="accessory"]').click();
      await sample('decor-accessory', 'decor');
      await page.locator('[data-decor-accessory="crown"]').click();
      await page.locator('[data-action="decor-continue"]').click();
      await sample('finish');
      // Prove the actual Finish controls remain clickable after the layout
      // change instead of inferring canvas interactivity from a CSS class.
      await page.locator('button[data-material="holo"]').click();
      await page.locator('[data-action="save"]').click();
      await sample('squeeze');
      const pressed = await page.locator('[data-sandbox-canvas]').boundingBox();
      if (!pressed) throw new Error('Missing squeeze surface');
      await page.mouse.move(pressed.x + pressed.width / 2, pressed.y + pressed.height / 2);
      await page.mouse.down();
      await page.mouse.move(pressed.x + pressed.width / 2 + 26, pressed.y + pressed.height / 2 + 18, { steps: 7 });
      await page.screenshot({ path: info.outputPath(`workshop-${device.name}-pressed.png`) });
      await page.mouse.up();
      await page.locator('[data-action="home"]').click();
      await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count', '1');
      await expect(page.locator('.sandbox-library-card:visible [data-library-material-profile]').first()).toHaveAttribute('data-library-material-profile', 'holo');
      const savedMaterial = await page.evaluate(() => {
        const raw = localStorage.getItem('squishy.phaser-pages-preview.squishy.save.v3');
        const save = raw ? JSON.parse(raw) : null;
        return save?.library?.[0]?.materialId ?? null;
      });
      expect(savedMaterial, `${device.name}: Finish material survives V3 save`).toBe('holo');
      await page.locator('.sandbox-library-card:visible [data-library-play-id]').first().click();
      await sample('squeeze-reopened', 'squeeze');
      expect(errors).toEqual([]);
      await writeFile(info.outputPath(`workshop-${device.name}-geometry.json`), JSON.stringify(history, null, 2));
    } finally {
      await context.close();
    }
  });
}
