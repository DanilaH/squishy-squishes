import { installRewardStub } from '../yandex-reward-stub';
import { readCollection } from '../collection';
import { expect, test } from '@playwright/test';
import { CollectionRepository, COLLECTION_KEY } from '../../src/platform/collectionRepository';
import { createDefaultSaveV3, decodeSaveStateV3, loadSaveV3WithMigration } from '../../src/platform/saveV3';
import { createBodyFillStroke } from '../../src/sandbox/appearance';
import { createSandboxDraft } from '../../src/sandbox/types';
import { RewardGrants, REWARD_JOURNAL_KEY } from '../../src/platform/rewardGrants';
import type { StorageAdapter } from '@danilah/mini-games-kit/platform';

function memory(){const data=new Map<string,string>();const writes:string[]=[];let fail='';return{data,writes,setFail:(key:string)=>{fail=key;},storage:{getItem:async(key:string)=>data.get(key)??null,setItem:async(key:string,value:string)=>{writes.push(key);if(key.startsWith(fail)&&fail)throw new Error('Injected quota');data.set(key,value);},removeItem:async(key:string)=>{data.delete(key);}} satisfies StorageAdapter};}
const toy=(id:number)=>({...createSandboxDraft(),id:`toy-${id}`,createdAt:id});

test('incremental compressed collection migrates legacy capacity/content and writes only one edited toy',async()=>{
 const m=memory(),repo=new CollectionRepository(m.storage);
 const legacy={...createDefaultSaveV3(),legacyCatalogAccess:undefined,libraryCapacity:10,library:[toy(1),toy(2)]};
 const raw=JSON.stringify(legacy);m.data.set('squishy.save.v3',raw);
 const state=await loadSaveV3WithMigration(m.storage,repo,()=>{});
 expect(state.legacyCatalogAccess).toBe(true);expect(state.libraryCapacity).toBe(10);expect(m.data.get('squishy.save.v3')).toBe(raw);
 m.writes.length=0;await repo.write({...state,library:[{...state.library[0]!,materialId:'jelly'},state.library[1]!]});
 expect(m.writes.filter(k=>k.startsWith('squishy.toy.'))).toHaveLength(1);expect(m.writes.at(-1)).toBe(COLLECTION_KEY);
 const loaded=await new CollectionRepository(m.storage).load();expect(loaded.library[0]!.materialId).toBe('jelly');
});

test('failed toy/manifest writes keep previous committed collection, migration leaves legacy usable',async()=>{
 for(const fail of ['squishy.toy.',COLLECTION_KEY]){
  const m=memory(),repo=new CollectionRepository(m.storage),state={...createDefaultSaveV3(),library:[toy(0)]};
  await repo.write(state);const keys=[...m.data.keys()];m.setFail(fail);
  await expect(repo.write({...state,library:[toy(1)]})).rejects.toThrow('quota');m.setFail('');
  expect((await new CollectionRepository(m.storage).load()).library).toEqual(state.library);expect([...m.data.keys()].sort()).toEqual(keys.sort());
 }
});

test('1000 records decode beyond 24, compressed paint roundtrip, no content loss',async()=>{
 const m=memory(),repo=new CollectionRepository(m.storage);
 const state={...createDefaultSaveV3(),libraryCapacity:1000,library:Array.from({length:1000},(_,i)=>({...toy(i),appearance:{v:1 as const,strokes:Array.from({length:20},()=>createBodyFillStroke(0xff92b2)),mixins:[]},decor:{...toy(i).decor,blush:true}}))};
 await repo.write(state);expect((await new CollectionRepository(m.storage).load()).library).toEqual(state.library);
 expect(()=>decodeSaveStateV3({...state,libraryCapacity:Number.MAX_SAFE_INTEGER+1})).toThrow();expect([...m.data.values()].some(v=>v.startsWith('gzip:'))).toBe(true);
});

test('reward callbacks are idempotent, cancelled rewards do not grant; failed grants replay without another ad',async()=>{
 const m=memory();let state=createDefaultSaveV3(),fail=false,ads=0;
 const grants=new RewardGrants(m.storage,()=>state,async next=>{if(fail)throw new Error('Injected failure');state=next;});
 expect(await grants.request('capacity',async()=>{ads++;})).toBe(false);expect(state.libraryCapacity).toBe(4);
 expect(await grants.request('capacity',async reward=>{ads++;await Promise.all([reward(),reward()]);})).toBe(true);expect(state.libraryCapacity).toBe(5);
 fail=true;await expect(grants.request('capacity',async reward=>{ads++;await reward();})).rejects.toThrow();expect(m.data.has(REWARD_JOURNAL_KEY)).toBe(true);
 fail=false;expect(await grants.request('capacity',async()=>{ads++;})).toBe(true);expect(state.libraryCapacity).toBe(6);expect(ads).toBe(3);
 await grants.request('face:zombie',reward=>reward());expect(state.unlockedRewardIds).toEqual(['face:zombie']);await grants.recover();expect(state.libraryCapacity).toBe(6);
});

for(const locale of ['ru-RU','en-US'])for(const viewport of [{width:320,height:568},{width:568,height:320},{width:1440,height:900}]){
 test(`free preview, restore, explicit unlock and reload ${locale} ${viewport.width}`,async({browser,baseURL},info)=>{
  test.setTimeout(90000);const context=await browser.newContext({baseURL,locale,viewport,reducedMotion:'reduce'});const page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto('/squishy-squishes/');await expect(page.locator('[data-phaser-ready=true]')).toBeVisible();
   const skip=page.locator('[data-guide-skip]');if(await skip.count())await skip.click();
   await page.locator('[data-shape=strawberry]').click();await expect(page.locator('[data-catalog-preview]')).toBeVisible();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-shape','strawberry');
   await page.locator('[data-action=save]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage','shape');
   await page.locator('[data-preview-restore]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-shape','soft-square');
   await page.locator('button[data-shape=mochi-cat]').click();await page.locator('[data-preview-open]').click();await expect(page.locator('[data-catalog-preview]')).toBeHidden();
   await expect(page.locator('button[data-shape=mochi-cat]')).toHaveAttribute('data-catalog-locked','false');
   await page.locator('[data-action=save]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage','squeeze');
   await page.reload();await expect(page.locator('[data-room-view]')).toHaveAttribute('data-room-view','room');await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-library-count','1');
   expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   expect(errors).toEqual([]);await page.screenshot({path:info.outputPath('saved-room.png')});
  }finally{await context.close();}
 });
}

test('1000-item catalog raster buffers are bounded to visible rows while scrolling',async({page})=>{
 test.setTimeout(90000);await page.setViewportSize({width:390,height:844});
 await page.addInitScript(save=>{if(!localStorage.getItem('squishy.collection.v1'))localStorage.setItem('squishy.save.v3',JSON.stringify(save));},{...createDefaultSaveV3(),legacyCatalogAccess:true,libraryCapacity:1000,library:Array.from({length:1000},(_,i)=>toy(i))});
 await page.goto('/squishy-squishes/');await page.locator('[data-room-collection]').click();
 await expect.poll(()=>page.locator('[data-library-thumbnail][data-preview-visible=true]').count()).toBeGreaterThan(0);
 const inspect=()=>page.evaluate(()=>({count:document.querySelectorAll('[data-library-thumbnail]').length,raster:[...document.querySelectorAll<HTMLCanvasElement>('[data-library-thumbnail]')].filter(c=>c.width>1).length}));
 await expect.poll(async()=>(await inspect()).raster).toBeGreaterThan(0);expect((await inspect()).count).toBe(1000);expect((await inspect()).raster).toBeLessThan(30);
 await page.locator('.sandbox-library-grid').evaluate(n=>{n.scrollTop=n.scrollHeight;});
 await expect(page.locator('[data-library-thumbnail="toy-999"]')).toHaveAttribute('data-preview-visible','true');expect((await inspect()).raster).toBeLessThan(30);
});

for(const mode of ['cancel','error','earn'])test(`Yandex preview ${mode}, duplicate callback and all terminal activity paths`,async({page})=>{
 await installRewardStub(page);await page.goto('/yandex/');await expect(page.locator('[data-phaser-ready=true]')).toBeVisible();await page.locator('[data-guide-skip]').click();
 await page.evaluate(mode=>{(window as any).rewardQA.mode=mode;},mode);
 await page.locator('button[data-shape=mochi-cat]').click();await page.locator('[data-preview-open]').click();
 if(mode==='earn')await expect(page.locator('[data-catalog-preview]')).toBeHidden();else{await expect(page.locator('[data-preview-open]')).toBeEnabled();await expect(page.locator('[data-catalog-preview]')).toBeVisible();await page.locator('[data-preview-restore]').click();}
 await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('aria-busy','false');
 const qa=await page.evaluate(()=>(window as any).rewardQA);expect(qa.requests).toBe(1);expect(qa.stops).toBeGreaterThan(0);expect(qa.starts).toBeGreaterThan(1);
 const save=await readCollection(page);expect(save.unlockedRewardIds).toEqual(mode==='earn'?['shape:mochi-cat']:[]);
});

test('earned Yandex item survives manifest failure and retry never asks for another ad',async({page})=>{
 await installRewardStub(page);await page.goto('/yandex/');await expect(page.locator('[data-phaser-ready=true]')).toBeVisible();await page.locator('[data-guide-skip]').click();
 await page.locator('button[data-shape=mochi-cat]').click();await page.evaluate(()=>{(window as any).rewardQA.failSave=true;});await page.locator('[data-preview-open]').click();await expect(page.locator('[data-preview-open]')).toBeEnabled();
 expect(await page.evaluate(()=>localStorage.getItem('squishy.reward.pending.v1'))).not.toBeNull();
 await page.evaluate(()=>{(window as any).rewardQA.failSave=false;});await page.locator('[data-preview-open]').click();await expect(page.locator('[data-catalog-preview]')).toBeHidden();expect(await page.evaluate(()=>(window as any).rewardQA.requests)).toBe(1);
 await page.reload();expect((await readCollection(page)).unlockedRewardIds).toContain('shape:mochi-cat');
});

test('migration failures retain usable legacy bytes, corrupt manifests are never reset',async()=>{
 for(const fail of ['squishy.toy.',COLLECTION_KEY]){
  const m=memory(),state={...createDefaultSaveV3(),library:[toy(1)]},raw=JSON.stringify(state);m.data.set('squishy.save.v3',raw);m.setFail(fail);const errors:unknown[]=[];
  const loaded=await loadSaveV3WithMigration(m.storage,new CollectionRepository(m.storage),e=>errors.push(e));expect(loaded.library).toEqual(state.library);expect(m.data.get('squishy.save.v3')).toBe(raw);expect(m.data.has(COLLECTION_KEY)).toBe(false);expect(errors).toHaveLength(1);
 }
 const m=memory();m.data.set(COLLECTION_KEY,'broken');await expect(loadSaveV3WithMigration(m.storage,new CollectionRepository(m.storage),()=>{})).rejects.toThrow();expect(m.data.get(COLLECTION_KEY)).toBe('broken');
});

test('repeatable capacity beyond 24, reserved quota failure prevents the ad, journal recovers in a fresh session',async()=>{
 const m=memory();let state=createDefaultSaveV3();const persist=async(next:typeof state)=>{state=next;};
 const grants=new RewardGrants(m.storage,()=>state,persist);
 for(let i=0;i<30;i++)await grants.request('capacity',reward=>reward());expect(state.libraryCapacity).toBe(34);expect(state.unlockedRewardIds).toEqual([]);
 m.setFail('squishy.reward.reserve');let ads=0;await expect(grants.request('capacity',async()=>{ads++;})).rejects.toThrow();expect(ads).toBe(0);m.setFail('');
 m.data.set(REWARD_JOURNAL_KEY,JSON.stringify({key:'capacity',targetCapacity:35}));await new RewardGrants(m.storage,()=>state,persist).recover();expect(state.libraryCapacity).toBe(35);await grants.recover();expect(state.libraryCapacity).toBe(35);
});

test('crash staging journal removes only orphan records and preserves committed records',async()=>{
 const m=memory(),repo=new CollectionRepository(m.storage),state={...createDefaultSaveV3(),library:[toy(1)]};await repo.write(state);
 const manifest=JSON.parse(m.data.get(COLLECTION_KEY)!);const live=manifest.records[0];m.data.set('squishy.toy.orphan','json:{}');m.data.set('squishy.collection.pending',JSON.stringify([live,'squishy.toy.orphan']));
 expect((await new CollectionRepository(m.storage).load()).library).toEqual(state.library);expect(m.data.has(live)).toBe(true);expect(m.data.has('squishy.toy.orphan')).toBe(false);expect(m.data.has('squishy.collection.pending')).toBe(false);
});

test('one unresolved preview keeps unrelated free choices and face bundle restores both components',async({page})=>{
 await page.goto('/squishy-squishes/');await expect(page.locator('[data-phaser-ready=true]')).toBeVisible();await page.locator('[data-guide-skip]').click();
 await page.locator('button[data-shape=mochi-cat]').click();await page.locator('[data-base-tab=material]').click();await page.locator('button[data-material=jelly]').click();await expect(page.locator('[data-catalog-preview]')).toBeVisible();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-shape','mochi-cat');await page.locator('[data-preview-restore]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-material','jelly');
 await page.locator('[data-craft-section=decor]').click();await page.locator('[data-decor-eyes=cross]').click();await page.locator('[data-decor-mouth=sewn]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-decor-eyes','cross');await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-decor-mouth','sewn');await page.locator('[data-preview-restore]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-decor-eyes','none');await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-decor-mouth','none');
 await page.keyboard.press('Control+z');expect((await readCollection(page)).unlockedRewardIds).toEqual([]);
});

test('visible Undo cancels the unpaid preview without invoking an advertisement',async({page})=>{
 await page.goto('/squishy-squishes/');await expect(page.locator('[data-phaser-ready=true]')).toBeVisible();await page.locator('[data-guide-skip]').click();await page.locator('button[data-shape=mochi-cat]').click();await expect(page.locator('[data-catalog-preview]')).toBeVisible();await page.locator('.craft-actions [data-action=draft-undo]').click();await expect(page.locator('[data-catalog-preview]')).toBeHidden();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-shape','soft-square');expect((await readCollection(page)).unlockedRewardIds).toEqual([]);
});
