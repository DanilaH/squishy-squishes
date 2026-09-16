import { expect, test } from '@playwright/test';

test('report Firefox WebGL2 capability separately from game input', async ({ page, browserName }) => {
  test.skip(browserName !== 'firefox', 'Firefox-specific environment diagnostic.');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/phaser/');
  const capabilities = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    let webgl2 = false;
    let glError = '';
    try { webgl2 = canvas.getContext('webgl2') !== null; }
    catch (error) { glError = String(error); }
    return { webgl2, glError, agent: navigator.userAgent };
  });
  console.log('FIREFOX_WEBGL_CAPABILITY', JSON.stringify(capabilities));
  await page.locator('[data-library-new]').first().click();
  await page.waitForTimeout(300);
  console.log('FIREFOX_STUDIO_DIAGNOSTIC', JSON.stringify({
    ready: await page.locator('[data-sandbox-canvas]').getAttribute('data-phaser-ready'),
    errors,
  }));
  expect(capabilities.webgl2, 'Runner must expose WebGL2 before Firefox game input can be assessed').toBe(true);
});