import {test,expect,type Page,type TestInfo} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {createDefaultSaveV3,encodeSaveStateV3,decodeSaveStateV3} from '../../src/platform/saveV3';
import {createSandboxDraft} from '../../src/sandbox/types';
import {STICKER_IDS} from '../../src/sandbox/decor';
import {readCollection as readStoredCollection} from '../collection';
const readCollection=async(page:Page)=>decodeSaveStateV3(await readStoredCollection(page));
import {installRewardStub} from '../yandex-reward-stub';
const toy=(id:string,shapeId='heart')=>({...createSandboxDraft(),id,shapeId,createdAt:1});
const save=(library=[toy('original')])=>({...createDefaultSaveV3(),legacyCatalogAccess:true,library,libraryCapacity:8,totalCrafts:library.length});
async function seed(page:Page,state=save()) {await page.addInitScript(s=>{if(!localStorage.getItem('squishy.collection.v1')&&!localStorage.getItem('squishy.save.v3'))localStorage.setItem('squishy.save.v3',JSON.stringify(s));},encodeSaveStateV3(state));}
async function shot(page:Page,info:TestInfo,name:string){await page.screenshot({path:info.outputPath(name+'.png')});}
async function controls(page:Page,selector:string){return page.locator(selector).evaluateAll(els=>els.filter(el=>el.getClientRects().length).map(el=>{const b=el.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return {text:el.textContent?.trim(),x:b.x,y:b.y,width:b.width,height:b.height,outside:b.x<0||b.y<0||b.right>innerWidth+.5||b.bottom>innerHeight+.5,covered:hit!==el&&!el.contains(hit)};}));}
async function evidence(info:TestInfo,name:string,value:unknown){await writeFile(info.outputPath(name+'.json'),JSON.stringify(value,null,2));}

for(const locale of ['ru','en'] as const)for(const viewport of [{width:320,height:568},{width:568,height:320},{width:1440,height:900}])test(`AUDIT-03 unpaid room preview must leave Decor and actions usable ${locale} ${viewport.width}`,async({browser,baseURL},info)=>{
 const context=await browser.newContext({baseURL,viewport,locale:locale==='ru'?'ru-RU':'en-US',hasTouch:true});const page=await context.newPage();try{
 await seed(page);await installRewardStub(page,locale);await page.goto('/yandex/');await page.locator('[data-room-edit-open]').click();await page.locator('[data-room-editor-tab="pedestals"]').click();await page.locator('button[data-room-pedestal="ufo"]').click();await page.locator('[data-room-editor-tab="decor"]').click();
 const found=await controls(page,'[data-room-editor] footer button,[data-room-editor-tab],[data-pedestal-unlock],[data-pedestal-restore],[data-room-slot]');const panel=await page.locator('.room-editor-content').boundingBox();await evidence(info,'decor-with-preview',{found,panel});await shot(page,info,'decor-with-preview');
 expect.soft(found.filter(c=>c.outside||c.covered)).toEqual([]);expect.soft(panel!.height).toBeGreaterThanOrEqual(72);
 await page.locator('[data-pedestal-restore]').click();
 await expect(page.locator('[data-room-editor-tab="decor"]')).toBeFocused();
 await page.locator('[data-room-editor-tab="pedestals"]').click();await page.locator('button[data-room-pedestal="ufo"]').click();await page.locator('[data-room-editor-tab="decor"]').click();
 await page.locator('[data-room-edit-done]').click();
 await expect(page.locator('[data-pedestal-unlock]')).toBeVisible();
 const warning=await controls(page,'[data-room-editor] footer button,[data-pedestal-unlock],[data-pedestal-restore]');expect(warning.filter(c=>c.outside||c.covered)).toEqual([]);
 expect((await page.locator('.room-editor-content').boundingBox())!.height).toBeGreaterThanOrEqual(72);
 await shot(page,info,'preview-resolution');
 await page.keyboard.press('Escape');await expect(page.locator('[data-room-editor]')).toBeHidden();expect(await page.evaluate(()=>(window as any).rewardQA.requests)).toBe(0);
 }finally{await context.close();}
});
test('AUDIT-04 two real tabs must retain independently saved toys',async({browser,baseURL},info)=>{
 const context=await browser.newContext({baseURL,viewport:{width:390,height:844}});const a=await context.newPage(),b=await context.newPage();try{
 await seed(a);await a.goto('/squishy-squishes/');await b.goto('/squishy-squishes/');
 for(const [page,shape] of [[a,'paw'],[b,'dumpling']] as const){await page.bringToFront();await page.locator('[data-library-new]:visible').first().click();await page.locator(`[data-shape="${shape}"]`).click();await page.locator('.craft-actions [data-action="save"]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage','squeeze');}
 const actual=await readCollection(b);await evidence(info,'two-tab-library',actual);await b.reload();await shot(b,info,'two-tab-result');expect(actual.library.map(t=>t.shapeId)).toContain('paw');expect(actual.library).toHaveLength(3);
 }finally{await context.close();}
});
test('AUDIT-15 corrupt manifest preserves bytes and offers an actionable recovery screen',async({page},info)=>{
 await page.addInitScript(()=>localStorage.setItem('squishy.collection.v1','{'));await page.goto('/squishy-squishes/');await expect(page.locator('.save-recovery h1')).toBeVisible();const data={message:await page.locator('#app').innerText(),buttons:await page.locator('button:visible').allTextContents(),raw:await page.evaluate(()=>localStorage.getItem('squishy.collection.v1'))};await evidence(info,'corrupt-startup',data);await shot(page,info,'corrupt-startup');expect.soft(data.raw).toBe('{');expect(data.buttons.length).toBeGreaterThan(0);
});
test('AUDIT-16 room preview warning and removal restore a usable furniture catalog',async({page},info)=>{
 await page.setViewportSize({width:320,height:568});await seed(page);await page.goto('/squishy-squishes/');await page.locator('[data-room-edit-open]').click();await page.locator('[data-room-editor-tab="pedestals"]').click();await page.locator('button[data-room-pedestal="ufo"]').click();await page.locator('[data-room-editor-tab="decor"]').click();await page.locator('[data-room-edit-done]').click();const blocked=await page.locator('.room-editor-content').boundingBox();const found=await controls(page,'[data-room-editor] footer button,[data-pedestal-unlock],[data-pedestal-restore]');await shot(page,info,'preview-save-warning');await page.locator('[data-pedestal-restore]').click();const restored=await page.locator('.room-editor-content').boundingBox();const focus=await page.evaluate(()=>({tag:document.activeElement?.tagName,inEditor:!!document.activeElement?.closest('[data-room-editor]')}));await evidence(info,'preview-layout-recovery',{blocked,found,restored,focus});expect(restored!.height).toBeGreaterThanOrEqual(72);await page.keyboard.press('Escape');await expect(page.locator('[data-room-editor]')).toBeHidden({timeout:2000});
});
for(const locale of ['ru','en'] as const)test(`AUDIT-17 every sticker has a readable selected-object name ${locale}`,async({browser,baseURL},info)=>{
 const context=await browser.newContext({baseURL,viewport:{width:390,height:844},locale:locale==='ru'?'ru-RU':'en-US'}),page=await context.newPage();try{
 await seed(page);await installRewardStub(page,locale);await page.goto('/yandex/');await page.locator('[data-library-new]:visible').first().click();await page.locator('[data-craft-section="decor"]').click();const names=[];
 for(const [i,id] of STICKER_IDS.entries()){
  await page.locator('[data-decor-section="stickers"]').click();await page.locator(`button[data-decor-sticker="${id}"]`).click();const b=(await page.locator('[data-sandbox-canvas]').boundingBox())!;await page.mouse.click(b.x+b.width*.5+(i%3-1)*8,b.y+b.height*.5);await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-decor-sticker-count',String(i+1));await page.locator('button[data-decor-section="objects"]').click();const name=await page.locator(`[data-object="sticker:${i}"]`).innerText();names.push({id,name});
 }
 await evidence(info,'sticker-labels',names);await shot(page,info,'last-sticker-selected');expect(names.filter(n=>/undefined|null|\[object Object\]/.test(n.name))).toEqual([]);
 }finally{await context.close();}
});
for(const locale of ['ru','en'])test(`UX saved feedback, add-more and visible Ideas ${locale}`,async({browser,baseURL},info)=>{
 // Three software-WebGL screenshots plus two scene transitions need their own overall budget.
 test.setTimeout(90000);
 const context=await browser.newContext({baseURL,locale:locale==='ru'?'ru-RU':'en-US',viewport:{width:320,height:568}}),page=await context.newPage();
 try{
 await seed(page);await page.goto('/squishy-squishes/');await page.locator('[data-library-ideas]').click();
 await expect(page.locator('[data-idea-rendered=true]').first()).toBeVisible();
 expect(await page.locator('[data-idea-rendered=true]').count()).toBeLessThanOrEqual(4);
 expect(await page.locator('[data-card-page-item][hidden] [data-idea-rendered]').count()).toBe(0);
 await shot(page,info,'ideas-visible');await page.locator('[data-ideas-back]').click();
 await page.locator('[data-library-new]:visible').first().click();await page.locator('[data-craft-section="decor"]').click();await page.locator('button[data-decor-section="accessory"]').click();
 await page.locator('[data-decor-accessory="bow"]').click();await page.locator('[data-add-more-details]').click();
 await expect(page.locator('[data-decor-panel="accessory"]')).toBeVisible();
 await page.locator('[data-decor-accessory="glasses"]').click();await shot(page,info,'add-more-arrange');
 await page.locator('.craft-actions [data-action="save"]').click();await expect(page.locator('[data-saved-feedback]')).toHaveText(locale==='ru'?'✓ Сохранено':'✓ Saved');
 await page.waitForTimeout(300);await shot(page,info,'saved-feedback');await expect(page.locator('[data-saved-feedback]')).toHaveCount(0,{timeout:4000});
 }finally{await context.close();}
});
test('UX two-tab edit conflict keeps the draft and saves an explicit copy',async({browser,baseURL})=>{
 test.setTimeout(120000);
 const context=await browser.newContext({baseURL,viewport:{width:390,height:844}}),a=await context.newPage(),b=await context.newPage();
 try{
 await seed(a);await a.goto('/squishy-squishes/');await b.goto('/squishy-squishes/');
 for(const [page,material] of [[a,'jelly'],[b,'chrome']] as const){
  await page.bringToFront();await page.locator('[data-library-select-id]').click();await page.locator('[data-action="edit-saved"]').click();
  await page.locator('[data-craft-section="shape"]').click();await page.locator('[data-base-tab="material"]').click();await page.locator(`button[data-material="${material}"]`).click();
 }
 await a.bringToFront();await a.locator('.craft-actions [data-action="save"]').click();await expect(a.locator('[data-sandbox-app]')).toHaveAttribute('data-save-complete','true');
 await b.bringToFront();await b.locator('.craft-actions [data-action="save"]').click();await expect(b.locator('[data-save-conflict-copy]')).toBeVisible();
 expect((await readCollection(b)).library[0]!.materialId).toBe('jelly');
 await b.locator('[data-save-conflict-copy]').click();await expect(b.locator('[data-sandbox-app]')).toHaveAttribute('data-save-complete','true');
 expect((await readCollection(b)).library.map(t=>t.materialId).sort()).toEqual(['chrome','jelly']);
 }finally{await context.close();}
});
test('UX a concurrently filled last slot opens explicit replacement and cancel retains the draft',async({browser,baseURL})=>{
 test.setTimeout(120000);
 const context=await browser.newContext({baseURL,viewport:{width:390,height:844}}),a=await context.newPage(),b=await context.newPage();
 try{
 await seed(a,{...save(),libraryCapacity:2});await a.goto('/squishy-squishes/');await b.goto('/squishy-squishes/');
 for(const [page,shape] of [[a,'paw'],[b,'dumpling']] as const){await page.bringToFront();await page.locator('[data-library-new]:visible').first().click();await page.locator(`[data-shape="${shape}"]`).click();await page.locator('.craft-actions [data-action="save"]').click();if(page===a)await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-save-complete','true');}
 await expect(b.locator('[data-library-replace-overlay]')).toBeVisible({timeout:20000});expect((await readCollection(b)).library).toHaveLength(2);
 await b.locator('[data-library-replace-cancel]').click();await expect(b.locator('[data-sandbox-app]')).toHaveAttribute('data-shape','dumpling');
 expect((await readCollection(b)).library.map(t=>t.shapeId)).toEqual(['heart','paw']);
 }finally{await context.close();}
});
test('UX damaged collection exports original bytes and restores only after confirmation',async({page},info)=>{
 test.setTimeout(90000);await seed(page);await page.goto('/squishy-squishes/');await page.locator('[data-library-new]:visible').first().click();
 await page.locator('[data-shape="paw"]').click();await page.locator('.craft-actions [data-action="save"]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-save-complete','true');
 await page.evaluate(()=>localStorage.setItem('squishy.collection.v1','{'));await page.reload();
 await expect(page.locator('[data-recovery="restore"]')).toBeVisible();
 const download=page.waitForEvent('download');await page.locator('[data-recovery="export"]').click();await (await download).saveAs(info.outputPath('recovery-export.json'));
 await page.locator('[data-recovery="restore"]').click();await page.locator('[data-recovery="cancel"]').click();expect(await page.evaluate(()=>localStorage.getItem('squishy.collection.v1'))).toBe('{');
 await page.locator('[data-recovery="restore"]').click();await page.locator('[data-recovery="confirm"]').click();await expect(page.locator('[data-room-view]')).toBeVisible();
 expect((await readCollection(page)).library.map(t=>t.shapeId)).toEqual(['heart']);
});
test('UX earning a reward while editing cannot hide a concurrent toy conflict',async({browser,baseURL})=>{
 test.setTimeout(120000);
 const context=await browser.newContext({baseURL,viewport:{width:390,height:844}}),a=await context.newPage(),b=await context.newPage();
 try{
 await seed(a);await installRewardStub(a);await installRewardStub(b);await a.goto('/yandex/');await b.goto('/yandex/');
 for(const [page,material] of [[a,'jelly'],[b,'chrome']] as const){
  await page.bringToFront();await page.locator('[data-library-select-id]').click();await page.locator('[data-action="edit-saved"]').click();await page.locator('[data-craft-section="shape"]').click();
  await page.locator('[data-base-tab="material"]').click();await page.locator(`button[data-material="${material}"]`).click();
 }
 await a.bringToFront();await a.locator('.craft-actions [data-action="save"]').click();await expect(a.locator('[data-sandbox-app]')).toHaveAttribute('data-save-complete','true');
 await b.bringToFront();await b.locator('[data-base-tab="shape"]').click();await b.locator('[data-shape="bat"]').click();await b.locator('[data-preview-open]').click();await expect(b.locator('[data-catalog-preview]')).toBeHidden();
 const state=await readCollection(b);expect(state.library[0]!.materialId).toBe('jelly');expect(state.unlockedRewardIds).toContain('shape:bat');
 await b.bringToFront();await b.locator('.craft-actions [data-action="save"]').click();await expect(b.locator('[data-save-conflict-copy]')).toBeVisible();
 expect((await readCollection(b)).library[0]!.materialId).toBe('jelly');
 }finally{await context.close();}
});
