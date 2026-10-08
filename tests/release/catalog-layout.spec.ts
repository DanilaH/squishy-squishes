import { expect, test } from '@playwright/test';
import { reachableControlIssues } from '../phaser-pages/helpers/reachableControls';

for (const locale of ['ru-RU', 'en-US']) for (const viewport of [
  {width:320,height:568},{width:390,height:844},{width:568,height:320},
  {width:1280,height:720},{width:1440,height:900},
]) test(`catalogs stay readable and scroll independently ${locale} ${viewport.width}`, async ({browser,baseURL},info) => {
  const context=await browser.newContext({baseURL,locale,viewport,hasTouch:true,reducedMotion:'reduce'});
  const page=await context.newPage();
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  try {
    await page.goto('/squishy-squishes/');await page.locator('[data-library-new]').first().click();
    await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready','true');
    await page.locator('[data-shape="mochi"]').click();
    const canvas=page.locator('[data-sandbox-canvas]'),scene=page.locator('.sandbox-stage'),actions=page.locator('.craft-actions');
    const geometry=[await canvas.boundingBox(),await scene.boundingBox(),await actions.boundingBox()];
    for(const section of ['shape','paint','mixins','decor']){
      await page.locator(`[data-craft-section="${section}"]`).click();
      expect([await canvas.boundingBox(),await scene.boundingBox(),await actions.boundingBox()]).toEqual(geometry);
      expect(await reachableControlIssues(page)).toEqual([]);
    }
    await page.locator('[data-decor-eyes="dot"]').click();
    await page.locator('[data-decor-mouth="smile"]').click();
    await page.locator('button[data-decor-section="accessory"]').click();
    const catalog=page.locator('[data-decor-panel="accessory"] > .sandbox-decor-grid');
    await expect(catalog.locator('button')).toHaveCount(17);
    const rail=page.locator('[data-decor-panel="accessory"] .craft-scroll-rail');
    await expect(rail).toBeVisible();await expect(rail).toHaveAttribute('data-at-end','false');
    const box=(await catalog.boundingBox())!;
    if(viewport.width>=901){expect((await page.locator('[data-panel="decor"]').boundingBox())!.width).toBeGreaterThanOrEqual(850);expect(box.height).toBeGreaterThanOrEqual(160);}
    await page.waitForLoadState('networkidle');await page.evaluate(()=>document.fonts.ready);
    await page.screenshot({path:info.outputPath('catalog-top.png')});
    if(viewport.width>=901){await page.mouse.move(box.x+30,box.y+box.height/2);await page.mouse.wheel(0,400);} else {
      const cdp=await context.newCDPSession(page),x=box.x+30,start=box.y+box.height-10;
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:start,id:1}]});
      for(let step=1;step<=6;step++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:start-step*(box.height-20)/6,id:1}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
    }
    await expect.poll(()=>catalog.evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
    await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-decor-accessory','none');
    await catalog.locator('[data-decor-accessory="wings"]').scrollIntoViewIfNeeded();
    await expect(rail).toHaveAttribute('data-at-end','true');
    await page.screenshot({path:info.outputPath('catalog-bottom.png')});
    expect(await reachableControlIssues(page)).toEqual([]);
    expect(await page.evaluate(()=>scrollY===0&&document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await catalog.locator('[data-decor-accessory="wings"]').click();
    await expect(page.locator('[data-decor-panel="objects"]')).toBeVisible();
    expect([await canvas.boundingBox(),await scene.boundingBox(),await actions.boundingBox()]).toEqual(geometry);
    expect(await reachableControlIssues(page)).toEqual([]);expect(errors).toEqual([]);
  } finally {await context.close();}
});

test('the scroll hint follows filling catalog and compact settings replacement',async({page})=>{
  await page.setViewportSize({width:320,height:568});await page.goto('/squishy-squishes/');await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready','true');
  await page.locator('[data-craft-section="mixins"]').click();
  const catalog=page.locator('.free-mixin-catalog'),rail=page.locator('[data-panel="mixins"] .craft-scroll-rail');
  const overflows=()=>catalog.evaluate(el=>el.scrollHeight>el.clientHeight+1);
  await expect.poll(()=>rail.isVisible()).toBe(await overflows());
  await page.locator('[data-action="mixin-settings"]').click();await expect(rail).toBeHidden();
  await page.locator('[data-action="mixin-settings"]').click();await expect.poll(()=>rail.isVisible()).toBe(await overflows());
});
