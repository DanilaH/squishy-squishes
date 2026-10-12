import {expect,test} from '@playwright/test';
import {decodeOnboarding,onboardingState} from '../../src/platform/onboarding';
test('room hint flag remains compatible with previous onboarding records',()=>{
 const {roomDecorSeen,...previous}=onboardingState(true);
 expect(decodeOnboarding(previous).roomDecorSeen).toBe(false);
 expect(()=>decodeOnboarding({...previous,roomDecorSeen:'yes'})).toThrow();
 expect(decodeOnboarding({...previous,roomSeen:true}).roomDecorSeen).toBe(true);
});
for(const locale of ['ru-RU','en-US']) for(const viewport of [{width:320,height:568},{width:568,height:320},{width:1440,height:900}]) {
 test(`room decoration after craft ${locale} ${viewport.width}`,async({browser,baseURL},info)=>{
  const context=await browser.newContext({baseURL,locale,viewport});const page=await context.newPage();
  try{
   await page.goto('/squishy-squishes/');
   await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready','true');
   await expect(page.locator('[data-room-decor-hint]')).toHaveCount(0);
   await page.locator('[data-guide-skip]').click();
   await page.locator('[data-action="save"]').click();
   await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage','squeeze');
   await expect(page.locator('[data-room-decor-hint]')).toBeVisible();
   for(const selector of ['[data-style-first-room]','[data-dismiss-room-hint]']) {
    const button=page.locator(selector),box=(await button.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(viewport.height);expect(box.x+box.width).toBeLessThanOrEqual(viewport.width);
    expect(await button.evaluate(el=>{const b=el.getBoundingClientRect();return document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)?.closest('button')===el;})).toBe(true);
   }
   expect(await page.locator('[data-room-decor-hint] p').evaluate(el=>el.scrollHeight<=el.clientHeight&&el.scrollWidth<=el.clientWidth)).toBe(true);
   await page.screenshot({path:info.outputPath('room-decoration-hint.png')});
   await page.locator('[data-style-first-room]').click();
   await expect(page.locator('[data-room-editor]')).toBeVisible();
   await page.locator('[data-room-edit-cancel]').click();
   await page.reload();
   await page.locator('[data-library-new]:visible').first().click();
   await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready','true');
   await page.locator('[data-action="save"]').click();
   await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage','squeeze');
   await expect(page.locator('[data-room-decor-hint]')).toHaveCount(0);
  }finally{await context.close();}
 });
}
for(const locale of ['ru-RU','en-US']) test(`out-of-order guide and dismissible room hint ${locale}`,async({browser,baseURL})=>{
 const context=await browser.newContext({baseURL,locale,viewport:{width:390,height:844}});const page=await context.newPage();
 try {
  await page.goto('/squishy-squishes/');await expect(page.locator('[data-guide-hint="base"]')).toBeVisible();
  let fillingsVisited=false;
  for(const section of ['decor','shape','mixins','paint','shape','decor','paint','mixins','shape']) {
   await page.locator(`[data-craft-section="${section}"]`).click();
   await expect(page.locator('[data-guide-hint]')).toHaveCount(section==='mixins'&&fillingsVisited?0:1);
   if(section==='mixins') fillingsVisited=true;
   expect(await page.locator('[data-guide-target]').count()).toBeLessThanOrEqual(1);
  }
  await page.locator('[data-action="try-on"]').click();await expect(page.locator('[data-guide-hint="try"]')).toBeVisible();
  await page.reload();await expect(page.locator('[data-guide-hint="base"]')).toBeVisible();
  await page.locator('[data-shape="mochi-cat"]').click();
  await page.evaluate(()=>{const write=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='squishy.save.v3'&&!document.body.hasAttribute('data-retry-save'))throw new Error('Injected save failure');write.call(this,key,value);};});
  await page.locator('[data-action="save"]').click();await expect(page.locator('[data-guide-hint="save-error"]')).toBeVisible();
  await expect(page.locator('[data-room-decor-hint]')).toHaveCount(0);
  await page.evaluate(()=>document.body.setAttribute('data-retry-save',''));
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-room-decor-hint]')).toBeVisible();
  await expect(page.locator('[data-guide-hint="squeeze"]')).toBeVisible();
  await page.locator('[data-room-decor-hint] p').click();await expect(page.locator('[data-room-decor-hint]')).toHaveCount(0);
  const canvas=(await page.locator('[data-sandbox-canvas]').boundingBox())!;
  await page.mouse.move(canvas.x+canvas.width*.5,canvas.y+canvas.height*.5);await page.mouse.down();await page.mouse.move(canvas.x+canvas.width*.56,canvas.y+canvas.height*.5,{steps:8});await page.mouse.up();
  await expect(page.locator('[data-guide-hint]')).toHaveCount(0);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('squishy.onboarding.v1')!).roomDecorSeen)).toBe(true);
  await page.locator('[data-action="home"]').click();
  await expect(page.locator('[data-library-maker-error]')).toBeHidden();
  await page.locator('[data-library-help]').click();await expect(page.locator('[data-guide-hint="base"]')).toBeVisible();
  await page.locator('[data-guide-skip]').click();await expect(page.locator('[data-guide-target]')).toHaveCount(0);
  await page.locator('[data-craft-section="decor"]').click();await expect(page.locator('[data-guide-hint]')).toHaveCount(0);
  await page.locator('[data-action="save"]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage','squeeze');
  await expect(page.locator('[data-room-decor-hint]')).toHaveCount(0);
  await expect(page.locator('[data-guide-hint]')).toHaveCount(0);
 }finally{await context.close();}
});
