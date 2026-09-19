import { expect, test, type Page } from '@playwright/test';

const expectSettledLayout = async (page: Page, name: string): Promise<void> => {
  await expect.poll(() => page.evaluate(() => {
    const shell = document.querySelector<HTMLElement>('[data-sandbox-app]');
    const stage = shell?.querySelector<HTMLElement>('.sandbox-stage');
    const floor = shell?.querySelector<HTMLElement>('.studio-env-floor');
    if (!stage || !floor) return Number.POSITIVE_INFINITY;
    return Math.abs(floor.getBoundingClientRect().top - stage.getBoundingClientRect().bottom + 22);
  }), { message: `${name}: floor follows resized stage`, timeout: 6_000 }).toBeLessThan(2);

  const facts = await page.evaluate(() => {
    const shell = document.querySelector<HTMLElement>('[data-sandbox-app]');
    const stage = shell?.querySelector<HTMLElement>('.sandbox-stage');
    const canvas = stage?.querySelector<HTMLElement>('[data-sandbox-canvas]');
    const desk = stage?.querySelector<HTMLElement>('[data-studio-desk]');
    const copy = shell?.querySelector<HTMLElement>('.sandbox-copy');
    if (!shell || !stage || !canvas || !desk || !copy) throw new Error('Studio disappeared after resize');
    const rect = canvas.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    const inaccessible = Array.from(shell.querySelectorAll<HTMLButtonElement>('.sandbox-topbar button, .sandbox-controls button'))
      .filter((button) => button.getClientRects().length)
      .filter((button) => {
        const r = button.getBoundingClientRect();
        const target = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return !target || !button.contains(target);
      }).map((button) => button.dataset.action || button.textContent?.trim() || 'button');
    return {
      stageName: shell.dataset.stage,
      deskDisplay: getComputedStyle(desk).display,
      copyRect: copy.getBoundingClientRect().toJSON(),
      canvasHit: !!hit && canvas.contains(hit),
      pageWidth: document.documentElement.scrollWidth,
      viewport: { width: innerWidth, height: innerHeight },
      inaccessible,
    };
  });
  expect(facts.canvasHit, `${name}: canvas accepts input`).toBe(true);
  expect(facts.inaccessible, `${name}: controls remain clickable`).toEqual([]);
  expect(facts.pageWidth, `${name}: no sideways scroll`).toBeLessThanOrEqual(facts.viewport.width + 2);
  if (facts.viewport.width > facts.viewport.height && facts.viewport.height <= 520) {
    expect(facts.deskDisplay, `${name}: hide desk on short landscape`).toBe('none');
    expect(facts.copyRect.top, `${name}: heading above fold`).toBeGreaterThanOrEqual(0);
    expect(facts.copyRect.bottom, `${name}: heading above fold`).toBeLessThanOrEqual(facts.viewport.height);
  }
};

test('Studio degrades to the original interactive UI if one PNG cannot decode', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'ru-RU', viewport: { width: 320, height: 700 } });
  const page = await context.newPage();
  const warnings: string[] = [];
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'warning') warnings.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await page.route(/studio-decor-left[^/]*\.png(?:\?.*)?$/, (route) => route.abort());
    await page.goto('/phaser/');
    await expect(page.locator('#app')).toHaveAttribute('data-jelly-ui-ready', '');
    await expect.poll(() => warnings.some((message) => message.includes('Environment assets failed to decode')), {
      message: 'Failed PNG triggers explicit graceful-fallback warning', timeout: 8_000,
    }).toBe(true);
    await expect(page.locator('#app')).not.toHaveAttribute('data-studio-env-ready', '');
    await page.locator('[data-library-new]').first().click();
    const shell = page.locator('[data-sandbox-app]');
    await expect(shell).toHaveAttribute('data-stage', 'shape');
    await expect(shell).not.toHaveClass(/studio-env-active/);
    await expect(shell.locator('.studio-env-floor, .studio-env-stage-art')).toHaveCount(0);
    await page.locator('button[data-shape="heart"]').click();
    await page.locator('[data-action="shape-continue"]').click();
    await expect(shell).toHaveAttribute('data-stage', 'paint');
    await expect(shell).not.toHaveClass(/studio-env-active/);
    await page.locator('[data-action="paint-continue"]').click();
    await expect(shell).toHaveAttribute('data-stage', 'mixins');
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});

test('Studio reflows through live portrait, desktop and landscape resizes on Shape and Paint', async ({ browser }, info) => {
  const context = await browser.newContext({ locale: 'ru-RU', viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await page.goto('/phaser/');
    await expect(page.locator('#app')).toHaveAttribute('data-studio-env-ready', '');
    await page.locator('[data-library-new]').first().click();
    const shell = page.locator('[data-sandbox-app]');
    await expect(shell).toHaveAttribute('data-stage', 'shape');
    for (const view of [
      { name: 'phone-320-shape', width: 320, height: 700 },
      { name: 'desktop-1440-shape', width: 1440, height: 900 },
      { name: 'landscape-844-shape', width: 844, height: 390 },
      { name: 'phone-390-shape', width: 390, height: 844 },
    ]) {
      await page.setViewportSize({ width: view.width, height: view.height });
      await expectSettledLayout(page, view.name);
      if (view.name === 'phone-320-shape' || view.name === 'landscape-844-shape') {
        await page.screenshot({ path: info.outputPath(`studio-v8-resize-${view.name}.png`), animations: 'disabled' });
      }
    }
    await page.locator('button[data-shape="heart"]').click();
    await page.locator('[data-action="shape-continue"]').click();
    await expect(shell).toHaveAttribute('data-stage', 'paint');
    for (const view of [
      { name: 'phone-320-paint', width: 320, height: 700 },
      { name: 'desktop-1280-paint', width: 1280, height: 800 },
      { name: 'landscape-844-paint', width: 844, height: 390 },
      { name: 'phone-390-paint', width: 390, height: 844 },
    ]) {
      await page.setViewportSize({ width: view.width, height: view.height });
      await expectSettledLayout(page, view.name);
      if (view.name === 'phone-320-paint' || view.name === 'landscape-844-paint') {
        await page.screenshot({ path: info.outputPath(`studio-v8-resize-${view.name}.png`), animations: 'disabled' });
      }
    }
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});
