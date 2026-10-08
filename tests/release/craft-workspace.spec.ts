import { test, expect } from '@playwright/test';
import { decodeSaveStateV3 } from '../../src/platform/saveV3';

for (const [locale, width, height] of [
  ['ru-RU',320,568],['en-US',390,844],['ru-RU',568,320],['en-US',844,390],['ru-RU',1440,900],['en-US',1440,900],
] as const) test(`free workspace ${locale} ${width}`, async ({ browser, baseURL }, info) => {
  // This full round-trip captures every section and reloads the saved craft twice.
  test.setTimeout(90_000);
  const context = await browser.newContext({baseURL,locale,viewport:{width,height},hasTouch:true,reducedMotion:'reduce'});
  const page = await context.newPage();
  try {
    await page.goto('/squishy-squishes/?roomReview=0'); await page.locator('[data-library-new]').first().click();
    const shell=page.locator('[data-sandbox-app]');
    await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready','true');
    await page.evaluate(()=>document.fonts.ready);
    const scene=await page.locator('.sandbox-stage').boundingBox();
    const snapshot=async(name:string)=>{
      expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight)).toBe(false);
      expect(await page.locator('.sandbox-stage').boundingBox()).toEqual(scene);
      const tray=(await page.locator('.sandbox-controls').boundingBox())!;
      const panel=(await page.locator('.sandbox-panel:visible').boundingBox())!;
      expect(panel.width).toBeCloseTo(Math.min(width >= 901 && height >= 640 ? 940 : 620,tray.width),0);
      expect(panel.x+panel.width/2).toBeCloseTo(tray.x+tray.width/2,0);
      for(const button of await page.locator('.craft-sections button,.craft-actions button').all()) {
        expect(await button.evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.height>=43.9 && r.width>=43.9 && r.bottom<=innerHeight && !!hit && el.contains(hit);}), `${name}: ${await button.textContent()}`).toBe(true);
      }
      await page.screenshot({path:info.outputPath(`${name}.png`)});
    };
    await snapshot('base');
    await page.locator('[data-shape="mochi"]').click();
    await page.locator('[data-base-tab="material"]').click(); await page.locator('[data-material="jelly"]').click();
    await snapshot('material');
    await page.locator('[data-craft-section="paint"]').click();
    await page.locator('[data-paint-tool="paint"]').click(); await expect(page.locator('[data-tools-overlay]')).toBeHidden();
    await page.locator('[data-paint-tool="fill"]').click();
    const box=(await page.locator('[data-sandbox-canvas]').boundingBox())!;
    await page.mouse.click(box.x+box.width/2,box.y+box.height/2); await expect(shell).toHaveAttribute('data-paint-strokes','1');
    await snapshot('paint');
    await page.locator('[data-craft-section="decor"]').click();
    await page.locator('[data-decor-eyes="dot"]').click(); await page.locator('[data-decor-mouth="smile"]').click();
    await page.locator('button[data-decor-section="accessory"]').click(); await page.locator('[data-decor-accessory="bow"]').click();
    await expect(page.locator('[data-decor-panel="objects"]')).toBeVisible();
    await page.locator('[data-object-control="scale"]').fill('0.85'); await page.locator('[data-object-control="scale"]').dispatchEvent('change');
    await snapshot('detail');
    await page.locator('[data-object-action="more"]').click(); await page.locator('[data-object-action="color:10609358"]').click();
    await snapshot('color'); await page.locator('[data-object-action="close-more"]').click();
    await page.locator('button[data-decor-section="face"]').click();
    const accessory=(await page.locator('[data-accessory-index="0"]').boundingBox())!;
    await page.mouse.click(accessory.x+accessory.width/2,accessory.y+accessory.height*.70);
    await expect(page.locator('[data-decor-panel="objects"]')).toBeVisible();
    await page.locator('button[data-decor-section="stickers"]').click();await page.locator('[data-decor-sticker="heart"]').click();
    await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
    await expect(page.locator('[data-object="sticker:0"]')).toBeVisible();
    await page.locator('.craft-actions [data-action="draft-undo"]').click();await expect(page.locator('[data-object="sticker:0"]')).toHaveCount(0);
    await page.locator('.craft-actions [data-action="draft-redo"]').click();await expect(page.locator('[data-object="sticker:0"]')).toBeVisible();
    await page.locator('[data-craft-section="mixins"]').click(); await snapshot('fillings');
    await page.locator('[data-action="mixin-settings"]').click();await page.locator('[data-mixin-setting="size"]').fill('32');await page.locator('[data-mixin-setting="size"]').dispatchEvent('change');
    await page.locator('[data-action="mixin-settings"]').click();

    await page.locator('[data-craft-section="shape"]').click(); await page.locator('[data-base-tab="light"]').click(); await snapshot('light');
    await page.locator('[data-action="try-on"]').click(); await expect(shell).toHaveAttribute('data-try-on','true');
    await expect(page.locator('.craft-actions')).toBeHidden();
    await page.locator('[data-action="try-return"]').click(); await expect(shell).toHaveAttribute('data-stage','shape');
    await page.locator('[data-action="save"]').click(); await expect(shell).toHaveAttribute('data-stage','squeeze');
    expect(await page.locator('.sandbox-stage').boundingBox()).toEqual(scene);
    const before=decodeSaveStateV3(await page.evaluate(()=>JSON.parse(localStorage.getItem('squishy.save.v3')!))).library[0]!;
    expect(before.shapeId).toBe('mochi');expect(before.materialId).toBe('jelly');expect(before.appearance.strokes).toHaveLength(1);expect(before.decor.accessories?.[0]?.color).toBe(0xa1e2ce);
    await page.reload(); await page.locator(`[data-library-play-id="${before.id}"]`).click();await page.locator('[data-action="edit-saved"]').click();
    await expect(page.locator('.craft-sections')).toBeVisible();
    await page.locator('[data-craft-section="paint"]').click();await page.locator('[data-craft-section="shape"]').click();
    await page.locator('[data-base-tab="material"]').click();await page.locator('[data-material="pearl"]').click();
    await page.locator('[data-action="save"]').click();await expect(shell).toHaveAttribute('data-stage','squeeze');
    const after=decodeSaveStateV3(await page.evaluate(()=>JSON.parse(localStorage.getItem('squishy.save.v3')!))).library;
    expect(after).toHaveLength(1);expect(after[0]!.id).toBe(before.id);expect(after[0]!.appearance).toEqual(before.appearance);expect(after[0]!.decor).toEqual(before.decor);expect(after[0]!.materialId).toBe('pearl');
  } finally {await context.close();}
});

test('a plain squishy saves immediately without mixing or visiting optional tools',async({page})=>{
  await page.goto('/squishy-squishes/?roomReview=0');await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready','true');
  await page.locator('[data-action="save"]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage','squeeze');
  expect(decodeSaveStateV3(await page.evaluate(()=>JSON.parse(localStorage.getItem('squishy.save.v3')!))).library).toHaveLength(1);
});


test('exit cancellation retains the draft and save can be retried after storage failure',async({page})=>{
  await page.addInitScript(()=>{
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){
      if(key==='squishy.save.v3' && (window as Window & {rejectWorkshopSave?:boolean}).rejectWorkshopSave) throw new Error('QA storage unavailable');
      original.call(this,key,value);
    };
  });
  await page.goto('/squishy-squishes/?roomReview=0');await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready','true');
  await page.locator('[data-shape="mochi"]').click();await page.locator('[data-action="exit-craft"]').click();
  await expect(page.locator('[data-exit-overlay]')).toBeVisible();await page.locator('[data-action="exit-cancel"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-shape','mochi');
  await page.evaluate(()=>{(window as Window & {rejectWorkshopSave?:boolean}).rejectWorkshopSave=true;});
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-action="save"]')).toBeEnabled();await expect(page.locator('[data-sandbox-status]')).not.toBeEmpty();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage','shape');
  await page.evaluate(()=>{(window as Window & {rejectWorkshopSave?:boolean}).rejectWorkshopSave=false;});
  await page.locator('[data-action="save"]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage','squeeze');
});


test('Paint settings keep brush selection separate and Clear remains undoable',async({page})=>{
  await page.setViewportSize({width:320,height:568});await page.goto('/squishy-squishes/?roomReview=0');await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready','true');
  await page.locator('[data-craft-section="paint"]').click();await page.locator('[data-action="paint-settings"]').click();
  await expect(page.locator('[data-tools-overlay]')).toBeVisible();await expect(page.locator('[data-action="paint-settings"]')).toHaveAttribute('aria-expanded','true');
  await page.locator('[data-brush-size="18"]').click();await expect(page.locator('[data-brush-size="18"]')).toHaveAttribute('aria-pressed','true');
  await page.locator('[data-action="tools-close"]').click();await expect(page.locator('[data-action="paint-settings"]')).toBeFocused();
  await page.locator('[data-paint-tool="paint"]').click();await expect(page.locator('[data-tools-overlay]')).toBeHidden();
  const r=(await page.locator('[data-sandbox-canvas]').boundingBox())!;await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.mouse.move(r.x+r.width/2+20,r.y+r.height/2,{steps:5});await page.mouse.up();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-paint-strokes','1');
  await page.locator('[data-action="paint-settings"]').click();await page.locator('[data-action="paint-clear"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-paint-strokes','0');await page.locator('[data-action="tools-close"]').click();
  await page.locator('.craft-actions [data-action="draft-undo"]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-paint-strokes','1');
});

for (const [tab, edit, value] of [
  ['light', '[data-light-axis="x"]', '0.8'],
  ['light', '[data-light-preset="moon"]', null],
] as const) test(`a standalone ${edit} change is protected on exit and Undo returns to a clean draft`, async ({page}) => {
  await page.goto('/squishy-squishes/?roomReview=0'); await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready','true');
  await page.locator(`[data-base-tab="${tab}"]`).click();
  if (value) {await page.locator(edit).fill(value); await page.locator(edit).dispatchEvent('change');} else await page.locator(edit).click();
  await page.locator('[data-action="exit-craft"]').click(); await expect(page.locator('[data-exit-overlay]')).toBeVisible();
  await page.locator('[data-action="exit-cancel"]').click(); await page.locator('.craft-actions [data-action="draft-undo"]').click();
  await page.locator('[data-action="exit-craft"]').click(); await expect(page.locator('[data-library-new]').first()).toBeVisible();
});

test('first size edit of a saved face immediately enables Undo and a fresh branch disables Redo', async ({page}) => {
  await page.goto('/squishy-squishes/?roomReview=0');await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready','true');
  await page.locator('[data-craft-section="decor"]').click();await page.locator('[data-decor-eyes="dot"]').click();
  await page.locator('[data-action="save"]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage','squeeze');
  await page.locator('[data-action="edit-saved"]').click();await page.locator('button[data-decor-section="objects"]').click();
  const size=page.locator('[data-object-control="scale"]'),undo=page.locator('.craft-actions [data-action="draft-undo"]'),redo=page.locator('.craft-actions [data-action="draft-redo"]');
  await size.fill('1.4');await size.dispatchEvent('change');await expect(undo).toBeEnabled();
  await undo.click();await expect(size).toHaveValue('1');await expect(redo).toBeEnabled();
  await size.fill('1.2');await size.dispatchEvent('change');await expect(redo).toBeDisabled();await undo.click();await expect(size).toHaveValue('1');
  await page.locator('[data-action="exit-craft"]').click();await expect(page.locator('[data-library-new]').first()).toBeVisible();
});

test('three toys in one session reset tools; choosing a filling exits Eraser; touch gestures remain undoable', async ({browser,baseURL}) => {
  const context=await browser.newContext({baseURL,viewport:{width:390,height:844},hasTouch:true});const page=await context.newPage();
  try {
    await page.goto('/squishy-squishes/?roomReview=0');await page.locator('[data-library-new]').first().click();
    await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready','true');
    for(let i=0;i<3;i++){
      await page.locator('[data-craft-section="mixins"]').click();
      await expect(page.locator('.sandbox-mixin-grid')).toBeVisible();await expect(page.locator('[data-action="mixin-erase"]')).toHaveAttribute('aria-pressed','false');
      const box=(await page.locator('[data-sandbox-canvas]').boundingBox())!,x=box.x+box.width/2,y=box.y+box.height/2;
      await page.touchscreen.tap(x,y);await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-mixin-count','1');
      await page.locator('[data-action="mixin-erase"]').click();await page.touchscreen.tap(x,y);await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-mixin-count','0');
      await page.locator('[data-mixin="hearts"]').click();await page.touchscreen.tap(x,y);await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-mixin-count','1');
      await page.locator('.craft-actions [data-action="draft-undo"]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-mixin-count','0');
      await page.locator('.craft-actions [data-action="draft-redo"]').click();
      await page.locator('[data-craft-section="paint"]').click();const cdp=await context.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-20,y,id:1}]});
      for(let step=1;step<=5;step++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-20+step*8,y,id:1}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
      await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-paint-strokes','1');
      await page.locator('.craft-actions [data-action="draft-undo"]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-paint-strokes','0');
      await page.locator('.craft-actions [data-action="draft-redo"]').click();
      await page.locator('[data-craft-section="mixins"]').click();await page.locator('[data-action="mixin-erase"]').click();await page.locator('[data-action="mixin-settings"]').click();
      await page.locator('[data-action="save"]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage','squeeze');
      const saved=decodeSaveStateV3(await page.evaluate(()=>JSON.parse(localStorage.getItem('squishy.save.v3')!))).library;
      expect(saved).toHaveLength(i+1);expect(saved[i]!.appearance.mixins).toHaveLength(1);expect(saved[i]!.appearance.strokes).toHaveLength(1);
      if(i<2)await page.locator('[data-panel="squeeze"] [data-action="new"]').click();
    }
  } finally {await context.close();}
});

for(const viewport of [{width:320,height:568},{width:568,height:320}])test(`detail settings replace the scrolled core and every action stays reachable at ${viewport.width}`,async({page})=>{
 await page.setViewportSize(viewport);await page.goto('/squishy-squishes/?roomReview=0');await page.locator('[data-library-new]').first().click();
 await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready','true');
 await page.locator('[data-craft-section="decor"]').click();await page.locator('button[data-decor-section="accessory"]').click();await page.locator('[data-decor-accessory="bow"]').click();
 await page.locator('[data-object-action="more"]').click();await expect(page.locator('.free-object-core')).toBeHidden();
 expect(await page.locator('.free-object-panel').evaluate(node=>node.scrollTop)).toBe(0);
 await page.screenshot({path:test.info().outputPath('detail-settings.png')});
 for(const button of await page.locator('.free-object-more button').all()){
   await button.scrollIntoViewIfNeeded();expect(await button.evaluate(node=>{const r=node.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.height>=44&&r.width>=44&&r.top>=0&&r.bottom<=innerHeight&&!!hit&&node.contains(hit);})).toBe(true);
 }
 await page.locator('[data-object-action="close-more"]').click();await expect(page.locator('.free-object-core')).toBeVisible();
 expect(await page.evaluate(()=>scrollY===0&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);
});
