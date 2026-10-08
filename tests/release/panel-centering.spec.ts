import { expect, test } from '@playwright/test';

for (const locale of ['ru-RU', 'en-US']) {
  for (const viewport of [{width:320,height:568}, {width:844,height:390}, {width:1440,height:900}, {width:1892,height:947}]) {
    test(`every editor panel stays centered in its controls ${locale} ${viewport.width}`, async ({browser,baseURL}) => {
      const context = await browser.newContext({baseURL,locale,viewport,reducedMotion:'reduce'});
      const page = await context.newPage();
      try {
        await page.goto('/squishy-squishes/');
        await page.locator('[data-library-new]').first().click();
        const canvas = page.locator('[data-sandbox-canvas]');
        await expect(canvas).toHaveAttribute('data-phaser-ready','true');
        const centered = async () => {
          const result = await page.locator('.sandbox-controls').evaluate(el => {
            const bounds=el.getBoundingClientRect();
            const panels=[...el.querySelectorAll('.sandbox-panel')].filter(panel=>panel.getClientRects().length);
            return {offsets:panels.map(panel=>{const r=panel.getBoundingClientRect();return Math.abs(r.x+r.width/2-bounds.x-bounds.width/2);}),
              scroll:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight};
          });
          expect(result.offsets.length).toBe(1);
          for (const offset of result.offsets) expect(offset).toBeLessThan(1);
          expect(result.scroll).toBe(false);
        };
        await centered();
        await page.locator('[data-craft-section="paint"]').click(); await centered();
        await page.locator('[data-craft-section="mixins"]').click(); await centered();
        await page.locator('[data-craft-section="decor"]').click(); await centered();
        for(const section of ['face','stickers','accessory']) {await page.locator(`button[data-decor-section="${section}"]`).click();await centered();}
        await page.locator('[data-craft-section="shape"]').click(); await page.locator('[data-base-tab="material"]').click(); await centered();
      } finally {await context.close();}
    });
  }
}
