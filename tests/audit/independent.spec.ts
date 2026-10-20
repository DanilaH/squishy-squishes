import {test,expect,type Page,type TestInfo} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {CollectionRepository,COLLECTION_KEY} from '../../src/platform/collectionRepository';
import {createDefaultSaveV3,encodeSaveStateV3,decodeSaveStateV3} from '../../src/platform/saveV3';
import {createSandboxDraft} from '../../src/sandbox/types';
import {PEDESTAL_REWARD_KEYS} from '../../src/game/pedestals';
import {STICKER_IDS} from '../../src/sandbox/decor';
import {readCollection as readStoredCollection} from '../collection';
const readCollection=async(page:Page)=>decodeSaveStateV3(await readStoredCollection(page));
import {installRewardStub} from '../yandex-reward-stub';
const toy=(id:string,shapeId='heart')=>({...createSandboxDraft(),id,shapeId,createdAt:1});
const save=(library=[toy('original')])=>({...createDefaultSaveV3(),legacyCatalogAccess:true,library,libraryCapacity:8,totalCrafts:library.length});
const memory=()=>{const map=new Map<string,string>();return {map,getItem:async(k:string)=>map.get(k)??null,setItem:async(k:string,v:string)=>{map.set(k,v);},removeItem:async(k:string)=>{map.delete(k);}};};
async function seed(page:Page,state=save()) {await page.addInitScript(s=>{if(!localStorage.getItem('squishy.collection.v1')&&!localStorage.getItem('squishy.save.v3'))localStorage.setItem('squishy.save.v3',JSON.stringify(s));},encodeSaveStateV3(state));}
async function shot(page:Page,info:TestInfo,name:string){await page.screenshot({path:info.outputPath(name+'.png')});}
async function controls(page:Page,selector:string){return page.locator(selector).evaluateAll(els=>els.filter(el=>el.getClientRects().length).map(el=>{const b=el.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return {text:el.textContent?.trim(),x:b.x,y:b.y,width:b.width,height:b.height,outside:b.x<0||b.y<0||b.right>innerWidth+.5||b.bottom>innerHeight+.5,covered:hit!==el&&!el.contains(hit)};}));}
async function evidence(info:TestInfo,name:string,value:unknown){await writeFile(info.outputPath(name+'.json'),JSON.stringify(value,null,2));}

test('AUDIT-01 stale second repository must not erase a toy saved by the first tab',async({},info)=>{
 const storage=memory(),initial=new CollectionRepository(storage);await initial.write(save());
 const a=new CollectionRepository(storage),b=new CollectionRepository(storage),sa=await a.load(),sb=await b.load();
 await a.write({...sa,library:[...sa.library,toy('created-in-a')],unlockedRewardIds:['pedestal:ufo'],libraryCapacity:9});
 await b.write({...sb,library:[...sb.library,toy('created-in-b')]});
 const actual=await new CollectionRepository(storage).load();await evidence(info,'state-after-two-writers',actual);
 expect.soft(actual.library.map(t=>t.id)).toContain('created-in-a');expect.soft(actual.unlockedRewardIds).toContain('pedestal:ufo');expect(actual.libraryCapacity).toBe(9);
});
test('AUDIT-02 loading another tab during a verified write must not delete its staged records',async({},info)=>{
 const storage=memory(),repo=new CollectionRepository(storage);await repo.write(save());let once=true;
 const interleaved={...storage,setItem:async(k:string,v:string)=>{if(k===COLLECTION_KEY&&once){once=false;await new CollectionRepository(storage).load();}await storage.setItem(k,v);}};
 const writer=new CollectionRepository(interleaved);const before=await writer.load();await writer.write({...before,library:[...before.library,toy('new')]});
 let error='';try{await new CollectionRepository(storage).load();}catch(e){error=String(e);}await evidence(info,'interleaving',{error,keys:[...storage.map.keys()]});expect(error).toBe('');
});

for(const locale of ['ru','en'] as const)for(const viewport of [{width:320,height:568},{width:568,height:320},{width:1440,height:900}])test(`AUDIT-03 unpaid room preview must leave Decor and actions usable ${locale} ${viewport.width}`,async({browser,baseURL},info)=>{
 const context=await browser.newContext({baseURL,viewport,locale:locale==='ru'?'ru-RU':'en-US',hasTouch:true});const page=await context.newPage();try{
 await seed(page);await installRewardStub(page,locale);await page.goto('/yandex/');await page.locator('[data-room-edit-open]').click();await page.locator('[data-room-editor-tab="pedestals"]').click();await page.locator('button[data-room-pedestal="ufo"]').click();await page.locator('[data-room-editor-tab="decor"]').click();
 const found=await controls(page,'[data-room-editor] footer button,[data-room-editor-tab],[data-pedestal-unlock],[data-pedestal-restore],[data-room-slot]');const panel=await page.locator('.room-editor-content').boundingBox();await evidence(info,'decor-with-preview',{found,panel});await shot(page,info,'decor-with-preview');
 expect.soft(found.filter(c=>c.outside||c.covered)).toEqual([]);expect.soft(panel!.height).toBeGreaterThanOrEqual(44);
 await page.keyboard.press('Escape');await expect(page.locator('[data-room-editor]')).toBeHidden();expect(await page.evaluate(()=>(window as any).rewardQA.requests)).toBe(0);
 }finally{await context.close();}
});
test('AUDIT-04 two real tabs must retain independently saved toys',async({browser,baseURL},info)=>{
 const context=await browser.newContext({baseURL,viewport:{width:390,height:844}});const a=await context.newPage(),b=await context.newPage();try{
 await seed(a);await a.goto('/squishy-squishes/');await b.goto('/squishy-squishes/');
 for(const [page,shape] of [[a,'paw'],[b,'dumpling']] as const){await page.locator('[data-library-new]:visible').first().click();await page.locator(`[data-shape="${shape}"]`).click();await page.locator('.craft-actions [data-action="save"]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage','squeeze');}
 const actual=await readCollection(b);await evidence(info,'two-tab-library',actual);await b.reload();await shot(b,info,'two-tab-result');expect(actual.library.map(t=>t.shapeId)).toContain('paw');expect(actual.library).toHaveLength(3);
 }finally{await context.close();}
});
for(const locale of ['ru','en'] as const)test(`AUDIT-05 unscripted first craft, locked preview and modal after rotation ${locale}`,async({browser,baseURL},info)=>{
 const context=await browser.newContext({baseURL,viewport:{width:320,height:568},locale:locale==='ru'?'ru-RU':'en-US',hasTouch:true});const page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));try{
 await installRewardStub(page,locale);await page.goto('/yandex/');await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready','true');
 await page.locator('[data-shape="bat"]').click();await page.locator('[data-craft-section="paint"]').click();await page.locator('[data-action="paint-settings"]').click();await page.setViewportSize({width:568,height:320});await shot(page,info,'rotated-paint-preview');
 await page.keyboard.press('Escape');await expect(page.locator('[data-tools-overlay]')).toBeHidden();
 await page.locator('[data-craft-section="decor"]').click();await page.locator('[data-decor-section="accessory"]').click();await page.locator('[data-decor-accessory="bow"]').click();
 const found=await controls(page,'.craft-actions button,.craft-sections button,[data-guide-skip],[data-preview-open],[data-preview-restore]');await evidence(info,'craft-preview-controls',found);await shot(page,info,'decor-preview-tutorial');expect.soft(found.filter(c=>c.outside||c.covered)).toEqual([]);
 await page.locator('[data-guide-skip]').click();await page.locator('[data-craft-section="shape"]').click();await page.locator('[data-shape="heart"]').click();await page.locator('.craft-actions [data-action="save"]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage','squeeze');const saved=(await readCollection(page)).library[0];await evidence(info,'first-craft-after-preview',saved);expect((()=>{const d=saved.decor;return d.accessory==='bow'||d.accessories?.some(p=>p.a==='bow');})()).toBe(true);expect(errors).toEqual([]);
 }finally{await context.close();}
});
test('AUDIT-06 keyboard focus must stay inside Paint tools until Escape restores its trigger',async({page},info)=>{
 await seed(page);await page.goto('/squishy-squishes/');await page.locator('[data-library-new]:visible').first().click();await page.locator('[data-craft-section="paint"]').click();await page.locator('[data-action="paint-settings"]').click();
 const focus:string[]=[];for(let i=0;i<45;i++){await page.keyboard.press('Tab');focus.push(await page.evaluate(()=>{const el=document.activeElement;return `${el?.closest('[data-tools-overlay]')?'inside':'outside'}:${el?.tagName}:${el?.getAttribute('data-action')??el?.getAttribute('aria-label')??''}`;}));}
 await evidence(info,'tab-cycle',focus);expect.soft(focus.every(s=>s.startsWith('inside:'))).toBe(true);await page.keyboard.press('Escape');await expect(page.locator('[data-action="paint-settings"]')).toBeFocused();
});
test('AUDIT-07 interrupted squeeze, blur, rotation and return to craft must not leave active gestures',async({page},info)=>{
 await seed(page);await page.goto('/squishy-squishes/');await page.locator('[data-library-select-id="original"]').click();await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready','true');const shell=page.locator('[data-sandbox-app]');const canvas=page.locator('[data-sandbox-canvas]');const b=(await canvas.boundingBox())!;
 await page.mouse.move(b.x+b.width*.5,b.y+b.height*.5);await page.mouse.down();await page.mouse.move(b.x+b.width*.7,b.y+b.height*.55,{steps:7});await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.setViewportSize({width:568,height:320});await page.mouse.up();await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await page.locator('[data-action="edit-saved"]').click();await page.locator('[data-craft-section="paint"]').click();await page.locator('.craft-actions [data-action="save"]').click();await expect(shell).toHaveAttribute('data-stage','squeeze');await shot(page,info,'after-interruption');const data=await shell.evaluate(el=>Object.fromEntries([...el.attributes].filter(a=>/squish|pointer|press|gesture/.test(a.name)).map(a=>[a.name,a.value])));await evidence(info,'gesture-after-interruption',data);expect((await readCollection(page)).library).toHaveLength(1);
});
test('AUDIT-08 named pedestal previews remain legible on light and dark rooms',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await seed(page,{...save(),unlockedRewardIds:PEDESTAL_REWARD_KEYS});await page.goto('/squishy-squishes/');
 for(const palette of ['0','17'])for(const id of ['cushion-throne','ice','pumpkin']){await page.locator('[data-room-edit-open]').click();await page.locator('[data-room-editor-tab="colors"]').click();await page.locator(`[data-room-theme="${palette}"]`).click();await page.locator('[data-room-editor-tab="pedestals"]').click();await page.locator(`button[data-room-pedestal="${id}"]`).click();await page.locator('[data-room-edit-done]').click();await shot(page,info,`room-${palette}-${id}`);await expect(page.locator('[data-library-selection]')).toBeVisible();}
});
test('AUDIT-09 unsaved edits: leave/cancel and return from try-on preserve the working toy',async({page},info)=>{
 await seed(page);await page.goto('/squishy-squishes/');await page.locator('[data-library-new]:visible').first().click();await page.locator('[data-shape="heart"]').click();await page.locator('[data-craft-section="decor"]').click();await page.locator('[data-decor-section="accessory"]').click();await page.locator('[data-decor-accessory="bow"]').click();await page.locator('[data-action="try-on"]').click();await page.locator('[data-action="try-return"]').click();await page.locator('[data-action="exit-craft"]').click();await shot(page,info,'unsaved-confirm');
 await expect(page.locator('[data-exit-overlay]')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('[data-exit-overlay]')).toBeHidden();await page.locator('.craft-actions [data-action="save"]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-save-complete','true');expect((await readCollection(page)).library).toHaveLength(2);
});
for(const viewport of [{width:320,height:568},{width:568,height:320},{width:1440,height:900}])test(`AUDIT-10 collection, Ideas, delete cancel and replacement cancel ${viewport.width}`,async({browser,baseURL},info)=>{
 const context=await browser.newContext({baseURL,viewport,locale:'ru-RU',hasTouch:true}),page=await context.newPage();try{
 const initial=save(Array.from({length:8},(_,i)=>toy(`kept-${i}`,i%2?'heart':'paw')));await seed(page,initial);await page.goto('/squishy-squishes/');await page.locator('[data-room-collection]').click();await shot(page,info,'collection');await page.locator('[data-library-actions-id="kept-0"]').click();await page.locator('[data-library-delete-id="kept-0"]').click();await shot(page,info,'delete-dialog');await page.keyboard.press('Escape');await expect(page.locator('[data-library-delete-overlay]')).toHaveCount(0);expect((await readCollection(page)).library).toHaveLength(8);await page.locator('[data-room-back]').click();
 await page.locator('[data-library-ideas]').click();await shot(page,info,'ideas');await page.locator('[data-idea-id]:visible').first().click();await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready','true');await page.locator('[data-idea-guide] summary').click();await shot(page,info,'idea-details');await page.keyboard.press('Escape');await page.locator('[data-action="save"]').click();await expect(page.locator('[data-library-replace-overlay]')).toBeVisible();await page.locator('[data-library-replace-id="kept-0"]').click();await shot(page,info,'replace-dialog');
 const found=await controls(page,'[data-library-replace-overlay] button:visible');await evidence(info,'replacement-controls',found);expect.soft(found.filter(c=>c.outside||c.covered)).toEqual([]);await page.locator('[data-library-replace-cancel]').click();expect((await readCollection(page)).library.map(t=>t.id)).toEqual(initial.library.map(t=>t.id));
 }finally{await context.close();}
});
test('AUDIT-11 record normal-motion material press, pull, release and return profiles',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await seed(page);await page.goto('/squishy-squishes/');await page.locator('[data-library-new]:visible').first().click();await page.locator('[data-shape="heart"]').click();await page.locator('[data-base-tab="material"]').click();const profiles=[];
 for(const material of ['soft','jelly','marshmallow','pearl','holo','chrome']){
  await page.locator(`button[data-material="${material}"]`).click();await page.locator('[data-action="try-on"]').click();const canvas=page.locator('[data-sandbox-canvas]'),b=(await canvas.boundingBox())!;await page.mouse.move(b.x+b.width*.5,b.y+b.height*.5);await page.mouse.down();await page.waitForTimeout(250);await page.mouse.move(b.x+b.width*.65,b.y+b.height*.48,{steps:12});await page.waitForTimeout(150);await shot(page,info,`${material}-pull`);
  const held=await page.locator('[data-sandbox-app]').getAttribute('data-squish-max-displacement');await page.mouse.up();await page.waitForTimeout(1200);await shot(page,info,`${material}-return`);const returned=await page.locator('[data-sandbox-app]').getAttribute('data-squish-max-displacement');profiles.push({material,held,returned});await page.locator('[data-action="try-return"]').click();
 }
 await evidence(info,'material-profiles',profiles);expect(profiles.every(p=>p.held!==null&&Number.isFinite(Number(p.held))&&Number.isFinite(Number(p.returned)))).toBe(true);
});
test('AUDIT-13 headphones at maximum size, rotation, depth and another active accessory',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await seed(page);await page.goto('/squishy-squishes/');await page.locator('[data-library-new]:visible').first().click();await page.locator('[data-craft-section="decor"]').click();await page.locator('[data-decor-section="accessory"]').click();await page.locator('[data-decor-accessory="headphones"]').click();
 const size=page.locator('[data-object-control="scale"]'),rotation=page.locator('[data-object-control="rotation"]');await size.focus();await size.press('End');await rotation.focus();await rotation.press('End');await page.locator('[data-object-action="more"]').click();await page.locator('[data-object-action="depth"]').click();await page.locator('[data-object-action="close-more"]').click();await shot(page,info,'headphones-max-rotated-behind');await expect(page.locator('[data-accessory-selection]:visible')).toHaveCount(1);
 await page.locator('[data-decor-section="accessory"]').click();await page.locator('[data-decor-accessory="bow"]').click();await expect(page.locator('[data-accessory-selection]:visible')).toHaveCount(1);await page.locator('.craft-actions [data-action="save"]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-save-complete','true');const saved=(await readCollection(page)).library.at(-1)!;await evidence(info,'accessory-transforms',saved.decor);expect(saved.decor.accessories?.some(p=>p.a==='headphones')).toBe(true);expect(saved.decor.accessories?.some(p=>p.a==='bow')).toBe(true);await page.reload();await expect(page.locator('[data-room-view]')).toBeVisible();
});
test('AUDIT-14 a failed Save keeps the draft editable and a retry saves exactly once',async({page},info)=>{
 await seed(page);await installRewardStub(page);await page.goto('/yandex/');await page.locator('[data-library-new]:visible').first().click();await page.locator('[data-shape="paw"]').click();await page.locator('[data-craft-section="paint"]').click();const b=(await page.locator('[data-sandbox-canvas]').boundingBox())!;await page.mouse.click(b.x+b.width*.5,b.y+b.height*.5);await page.evaluate(()=>{(window as any).rewardQA.failToy=true;});await page.locator('.craft-actions [data-action="save"]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-save-failed','true');await shot(page,info,'failed-save');expect((await readCollection(page)).library).toHaveLength(1);
 await page.locator('[data-craft-section="decor"]').click();await page.locator('[data-decor-section="accessory"]').click();await page.locator('[data-decor-accessory="bow"]').click();await page.evaluate(()=>{(window as any).rewardQA.failToy=false;});await page.locator('.craft-actions [data-action="save"]').dblclick();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage','squeeze');const actual=await readCollection(page);expect(actual.library).toHaveLength(2);expect(actual.library.at(-1)!.appearance.strokes).toHaveLength(1);await evidence(info,'saved-after-retry',actual);expect(await page.evaluate(()=>(window as any).rewardQA.requests)).toBe(0);
});
test('AUDIT-15 corrupt manifest preserves bytes and offers an actionable recovery screen',async({page},info)=>{
 await page.addInitScript(()=>localStorage.setItem('squishy.collection.v1','{'));await page.goto('/squishy-squishes/');await expect(page.locator('.recipe-panel strong')).toBeVisible();const data={message:await page.locator('#app').innerText(),buttons:await page.locator('button:visible').allTextContents(),raw:await page.evaluate(()=>localStorage.getItem('squishy.collection.v1'))};await evidence(info,'corrupt-startup',data);await shot(page,info,'corrupt-startup');expect.soft(data.raw).toBe('{');expect(data.buttons.length).toBeGreaterThan(0);
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
