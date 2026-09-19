import { expect, test } from '@playwright/test';

test('Studio v8 keeps the real heading visible and desk hidden in short landscape', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'ru-RU', viewport: { width: 844, height: 390 } });
  const page = await context.newPage();
  try {
    await page.goto('/phaser/');
    await expect(page.locator('#app')).toHaveAttribute('data-studio-env-ready', '');
    await page.locator('[data-library-new]').first().click();
    const shell = page.locator('[data-sandbox-app]');
    await expect(shell).toHaveAttribute('data-stage', 'shape');
    await expect(shell).toHaveClass(/studio-env-active/);

    const facts = await page.evaluate(() => {
      const copy = document.querySelector<HTMLElement>('.sandbox-copy');
      const desk = document.querySelector<HTMLElement>('[data-studio-desk]');
      if (!copy || !desk) throw new Error('Studio layout nodes missing');
      const r = copy.getBoundingClientRect();
      return {
        copy: { top: r.top, bottom: r.bottom, left: r.left, right: r.right },
        position: getComputedStyle(copy).position,
        deskDisplay: getComputedStyle(desk).display,
        viewport: { width: innerWidth, height: innerHeight },
      };
    });

    expect(facts.position).toBe('absolute');
    expect(facts.copy.top).toBeGreaterThanOrEqual(0);
    expect(facts.copy.bottom).toBeLessThanOrEqual(facts.viewport.height);
    expect(facts.copy.left).toBeGreaterThanOrEqual(0);
    expect(facts.copy.right).toBeLessThanOrEqual(facts.viewport.width);
    expect(facts.deskDisplay).toBe('none');
  } finally {
    await context.close();
  }
});
