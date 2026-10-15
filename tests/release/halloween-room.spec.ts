import {expect,test} from '@playwright/test';
import {returningPlayer} from '../returning-player';
import {readCollection,createLegacySaveV3} from '../collection';
import {createSandboxDraft} from '../../src/sandbox/types';
import {createBodyFillStroke} from '../../src/sandbox/appearance';

const items={left:'coffin-dresser',right:'pumpkin-pouf',shelf:'potion-shelf',wall:'ghost-picture',rug:'ghost-rug',garland:'cobweb-garland',detail:'pumpkin-lamp'};
for(const locale of ['ru-RU','en-US'])for(const viewport of [{width:320,height:568},{width:568,height:320},{width:1440,height:900}]){
 test(`complete Halloween room saves and rolls back ${locale} ${viewport.width}`,async({browser,baseURL},info)=>{
  test.setTimeout(120000);
  const context=await browser.newContext({baseURL,locale,viewport,hasTouch:true,reducedMotion:'reduce'}),page=await context.newPage();
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await returningPlayer(page);
   await page.addInitScript(save=>{if(!localStorage.getItem('squishy.collection.v1'))localStorage.setItem('squishy.save.v3',JSON.stringify(save));},{...createLegacySaveV3(),library:[{...createSandboxDraft(),id:'room-ghost',shapeId:'ghost',createdAt:1,appearance:{v:1,strokes:[createBodyFillStroke(0xfff5df)],mixins:[]}}],totalCrafts:1});
   await page.goto('/squishy-squishes/');
   await expect(page.locator('[data-library-table-ready]')).toHaveAttribute('data-library-table-ready','true');
   const before=await readCollection(page);
   await page.locator('[data-room-edit-open]').click();
   await page.locator('[data-room-theme="16"]').click();
   await page.locator('[data-room-editor-tab="decor"]').click();
   const category=async(id:string)=>{
    const select=page.locator('[data-room-category-select]');
    if(await select.isVisible())await select.selectOption(id);else await page.locator(`[data-room-category="${id}"]`).click();
   };
   await page.locator('[data-room-item="coffin-dresser"]').click();
   await page.locator('.room-editor-surfaces [data-room-slot="right"]').click();
   await page.locator('[data-room-item="pumpkin-pouf"]').click();
   for(const [cat,id] of [['shelves','potion-shelf'],['posters','ghost-picture'],['rugs','ghost-rug'],['details','cobweb-garland']]){
    await category(cat!);await page.locator(`[data-room-item="${id}"]`).click();
   }
   await page.locator('.room-editor-surfaces [data-room-slot="detail"]').click();
   await page.locator('[data-room-item="pumpkin-lamp"]').click();
   await page.locator('[data-room-edit-done]').click();
   await expect(page.locator('[data-room-prop]')).toHaveCount(7);
   const saved={version:1,palette:16,items};
   expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('squishy.room.v1')!))).toEqual(saved);
   await page.reload();await expect(page.locator('[data-library-table-ready]')).toHaveAttribute('data-library-table-ready','true');
   await expect(page.locator('[data-room-prop]')).toHaveCount(7);
   await page.screenshot({path:info.outputPath('pumpkin-evening.png')});
   await page.locator('[data-room-edit-open]').click();await page.locator('[data-room-theme="17"]').click();
   await page.screenshot({path:info.outputPath('mint-midnight-editor.png')});
   await page.locator('[data-room-editor-tab="decor"]').click();await page.locator('[data-room-item=""]').click();
   await expect(page.locator('[data-room-prop]')).toHaveCount(6);
   await page.locator('[data-room-edit-cancel]').click();await expect(page.locator('[data-room-prop]')).toHaveCount(7);
   expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('squishy.room.v1')!))).toEqual(saved);
   await page.locator('[data-room-edit-open]').click();await page.locator('[data-room-editor-tab="colors"]').click();await page.locator('[data-room-theme="17"]').click();await page.locator('[data-room-edit-done]').click();
   await page.reload();await expect(page.locator('[data-room-prop]')).toHaveCount(7);
   expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('squishy.room.v1')!))).toEqual({...saved,palette:17});
   await page.screenshot({path:info.outputPath('mint-midnight.png')});
   expect(await readCollection(page)).toEqual(before);
   expect(await page.evaluate(()=>({x:document.documentElement.scrollWidth>innerWidth,y:document.documentElement.scrollHeight>innerHeight}))).toEqual({x:false,y:false});
   expect(errors).toEqual([]);
  }finally{await context.close();}
 });
}
