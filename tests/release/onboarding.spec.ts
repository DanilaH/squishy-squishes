import { expect,test } from '@playwright/test';
import { createDefaultSaveV3 } from '../../src/platform/saveV3';
import { createSandboxDraft } from '../../src/sandbox/types';
import { decodeOnboarding,onboardingState } from '../../src/platform/onboarding';

test('onboarding codec validates resumable draft without changing V3',()=>{
  const state={...onboardingState(true),draft:createSandboxDraft()};
  expect(decodeOnboarding(state)).toEqual(state);
  expect(()=>decodeOnboarding({...state,draft:{shapeId:'bad'}})).toThrow();
});
for(const locale of ['ru-RU','en-US'])for(const viewport of [{width:320,height:568},{width:568,height:320},{width:1440,height:900}]){
  test(`first craft, recovery, skip and replay ${locale} ${viewport.width}`,async({browser,baseURL},info)=>{
    test.setTimeout(90000);
    const context=await browser.newContext({baseURL,locale,viewport,reducedMotion:'reduce'});
    const page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    try{
      await page.goto('/squishy-squishes/');
      await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready','true');
      await expect(page.locator('[data-guide-hint="base"]')).toBeVisible();
      const check=async()=>{
        expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth)).toBe(true);
        for(const selector of ['[data-guide-skip]','[data-craft-section="paint"]','.craft-actions [data-action="save"]']){
          const box=(await page.locator(selector).boundingBox())!;expect(box.height).toBeGreaterThanOrEqual(44);expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(viewport.height);
          expect(await page.locator(selector).evaluate(button=>{const b=button.getBoundingClientRect();return document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)?.closest('button')===button;})).toBe(true);
        }
        const hint=(await page.locator('[data-guide-hint]').boundingBox())!,actions=(await page.locator('.craft-actions').boundingBox())!;
        expect(hint.y).toBeGreaterThanOrEqual(actions.y+actions.height);
        expect(hint.y+hint.height).toBeLessThanOrEqual(viewport.height);
      };
      await check();await page.screenshot({path:info.outputPath('first-base.png')});
      await page.locator('[data-shape="heart"]').click();
      await page.locator('[data-craft-section="paint"]').click();
      const canvas=(await page.locator('[data-sandbox-canvas]').boundingBox())!;
      await page.mouse.move(canvas.x+canvas.width*.48,canvas.y+canvas.height*.52);await page.mouse.down();await page.mouse.move(canvas.x+canvas.width*.56,canvas.y+canvas.height*.55,{steps:8});await page.mouse.up();
      await expect(page.locator('[data-guide-hint="undo"]')).toBeVisible();await check();
      await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('squishy.onboarding.v1')!).draft?.appearance.strokes.length??0)).toBeGreaterThan(0);
      const prior=await page.evaluate(()=>JSON.parse(localStorage.getItem('squishy.onboarding.v1')!).draft);
      await page.reload();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-shape','heart');
      await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready','true');
      await page.locator('[data-craft-section="decor"]').click();await page.locator('[data-decor-section="accessory"]').click();await page.locator('[data-decor-accessory="bow"]').click();
      await expect(page.locator('[data-guide-hint="arrange"]')).toBeVisible();await expect(page.locator('[data-accessory-selection="0"]')).toBeVisible();await check();
      await page.screenshot({path:info.outputPath('first-decor.png')});
      await page.locator('[data-guide-skip]').click();await expect(page.locator('[data-guide-skip]')).toHaveCount(0);
      await page.locator('[data-action="save"]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage','squeeze');
      expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('squishy.save.v3')!).library[0].appearance.strokes)).toEqual(prior.appearance.strokes);
      await page.locator('[data-action="home"]').click();await expect(page.locator('[data-room-view]')).toHaveAttribute('data-room-view','room');
      await expect(page.locator('[data-room-prop]')).toHaveCount(3);await page.screenshot({path:info.outputPath('starter-room.png')});
      await page.reload();await expect(page.locator('[data-room-view]')).toHaveAttribute('data-room-view','room');
      await page.locator('[data-library-help]').click();await expect(page.locator('[data-guide-hint="base"]')).toBeVisible();await page.locator('[data-action="save"]').click();
      await expect(page.locator('[data-guide-hint="squeeze"]')).toBeVisible();
      const squish=(await page.locator('[data-sandbox-canvas]').boundingBox())!;
      await page.mouse.move(squish.x+squish.width*.5,squish.y+squish.height*.5);await page.mouse.down();await page.mouse.move(squish.x+squish.width*.57,squish.y+squish.height*.5,{steps:12});await page.mouse.up();
      await expect(page.locator('[data-guide-hint="room"]')).toBeVisible();
      await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('squishy.onboarding.v1')!).status)).toBe('done');
      expect(errors).toEqual([]);
    }finally{await context.close();}
  });
}
test('existing empty or decorated rooms retain their entry, save and room choices',async({page})=>{
  const save=createDefaultSaveV3(),room={version:1,palette:12,items:{right:'plant'}};
  await page.addInitScript(({save,room})=>{localStorage.setItem('squishy.save.v3',JSON.stringify(save));localStorage.setItem('squishy.room.v1',JSON.stringify(room));},{save,room});
  await page.goto('/squishy-squishes/');await expect(page.locator('[data-room-view]')).toHaveAttribute('data-room-view','room');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('squishy.room.v1')!))).toEqual(room);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('squishy.save.v3')!))).toEqual(save);
  await expect(page.locator('[data-guide-skip]')).toHaveCount(0);
});
test('leaving the first craft keeps the draft and fillings hint is one-time',async({page})=>{
  await page.goto('/squishy-squishes/');await expect(page.locator('[data-guide-hint="base"]')).toBeVisible();
  await page.locator('[data-craft-section="mixins"]').click();await expect(page.locator('[data-guide-hint="fillings"]')).toBeVisible();
  await page.locator('[data-action="try-on"]').click();await expect(page.locator('[data-guide-hint="try"]')).toBeVisible();await page.locator('[data-action="try-return"]').click();
  await page.locator('[data-craft-section="shape"]').click();await page.locator('[data-shape="donut"]').click();
  await page.locator('[data-action="exit-craft"]').click();await expect(page.locator('.sandbox-exit-dialog')).not.toContainText('Unsaved changes will be lost');
  await page.locator('[data-action="exit-confirm"]').click();await expect(page.locator('[data-room-view]')).toHaveAttribute('data-room-view','room');
  await page.reload();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-shape','donut');
  await page.locator('[data-craft-section="mixins"]').click();await expect(page.locator('[data-guide-hint="fillings"]')).toHaveCount(0);
});
test('first-entry renderer failure returns to a visible retryable room',async({page})=>{
  await page.route('**/assets/PhaserSquishSurface-*.js',route=>route.abort());
  await page.goto('/squishy-squishes/');
  await expect(page.locator('[data-library-maker-error]')).toBeVisible();
  await expect(page.locator('[data-library-new]').first()).toBeVisible();
  await expect(page.locator('[data-first-craft-loading]')).toHaveCount(0);
  await page.unroute('**/assets/PhaserSquishSurface-*.js');
  await page.locator('[data-library-retry]').click();await expect(page.locator('[data-guide-hint="base"]')).toBeVisible();
});
