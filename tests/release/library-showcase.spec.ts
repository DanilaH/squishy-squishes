import { expect, test } from '@playwright/test';
import { createDefaultSaveV3 } from '../../src/platform/saveV3';
import { createSandboxDraft } from '../../src/sandbox/types';

const toys = ['paw','heart','donut','dumpling','strawberry','mochi-cat','cupcake','mochi-bunny'].map((shapeId, i) => ({
  ...createSandboxDraft(), shapeId, id: `showcase-${i}`, createdAt: 1700000000000 + i,
}));
for (const locale of ['en-US','ru-RU']) {
  for (const viewport of [{width:1440,height:900},{width:390,height:844},{width:320,height:568},{width:568,height:320}]) {
    test(`showcase collection, shared squeeze and editor at ${viewport.width} ${locale}`, async ({browser, baseURL}, info) => {
      const context = await browser.newContext({baseURL, locale, viewport, hasTouch:true, reducedMotion:'reduce'});
      const page = await context.newPage();
      try {
        await page.goto('/squishy-squishes/');
        await expect(page.locator('.library-showcase-slot')).toHaveCount(8);
        await expect(page.locator('.library-showcase-welcome')).toBeVisible();
        await page.evaluate(save => localStorage.setItem('squishy.save.v3', JSON.stringify(save)), {...createDefaultSaveV3(), library:toys,totalCrafts:8});
        await page.reload();
        const shelf = page.locator('.sandbox-library-grid');
        await expect(page.locator('[data-library-toy]')).toHaveCount(8);
        const original = await page.evaluate(() => localStorage.getItem('squishy.save.v3'));
        expect(await page.evaluate(() => performance.getEntriesByType('resource').some(entry=>entry.name.includes('PhaserSquishSurface')))).toBe(false);
        await expect(page.locator('.library-showcase-workbench')).toHaveAttribute('data-library-table-ready','true');
        const table = await page.locator('.library-showcase-table').boundingBox();
        for (const id of ['showcase-0','showcase-7']) {
          await page.locator(`[data-library-play-id="${id}"]`).click();
          await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready','true');
          await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage','squeeze');
          await expect(page.locator(`[data-library-toy="${id}"]`)).toHaveClass(/is-selected/);
          expect(await page.locator('.library-showcase-table').boundingBox()).toEqual(table);
          const canvas = page.locator('[data-sandbox-canvas]');
          const box = (await canvas.boundingBox())!;
          await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
          await page.mouse.down();await page.mouse.move(box.x+box.width/2+35,box.y+box.height/2-15,{steps:6});
          await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-squish-active','true');
          await page.mouse.up();
        }
        await page.locator('[data-library-delete-id="showcase-7"]').click();
        await expect(page.locator('[data-library-delete-overlay]')).toBeVisible();
        await expect(page.locator('[data-sandbox-app]')).toHaveClass(/is-blocked/);
        await page.locator('[data-library-delete-cancel]').click();
        await expect(page.locator('[data-sandbox-app]')).not.toHaveClass(/is-blocked/);
        expect(await page.evaluate(() => localStorage.getItem('squishy.save.v3'))).toBe(original);
        const geometry = await shelf.evaluate(element=>({scroll:element.scrollHeight,client:element.clientHeight}));
        if(viewport.width===1440) expect(geometry.scroll).toBeLessThanOrEqual(geometry.client+1);
        else expect(geometry.scroll).toBeGreaterThan(geometry.client);
        expect(await page.evaluate(()=>[document.documentElement.scrollWidth>innerWidth,document.documentElement.scrollHeight>innerHeight])).toEqual([false,false]);
        await page.screenshot({path:info.outputPath(`showcase-live-${viewport.width}.png`)});
        await page.locator('[data-action="edit-saved"]').click();
        await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage','decor');
        await expect(page.locator('[data-library-live]')).toHaveCount(0);
        await expect(page.locator('[data-sandbox-library]')).toHaveCount(0);
        await page.locator('[data-action="exit-craft"]').click();
        await page.locator('[data-action="exit-confirm"]').click();
        await expect(page.locator('[data-library-toy]')).toHaveCount(8);
        expect(await page.evaluate(()=>localStorage.getItem('squishy.save.v3'))).toBe(original);
      } finally { await context.close(); }
    });
  }
}
