import {expect,test} from '@playwright/test';
import {PEDESTALS,PEDESTAL_REWARD_KEYS} from '../../src/game/pedestals';
import {ownsCatalogItem,LEGACY_CATALOG_KEYS} from '../../src/platform/catalogOwnership';
import {createDefaultSaveV3,decodeSaveStateV3,encodeSaveStateV3} from '../../src/platform/saveV3';
import {decodeRoomSettings} from '../../src/platform/roomSettings';
import {RewardGrants,REWARD_JOURNAL_KEY} from '../../src/platform/rewardGrants';
import {createSandboxDraft} from '../../src/sandbox/types';
import {installRewardStub} from '../yandex-reward-stub';
import {readCollection} from '../collection';
import sharp from 'sharp';
const fixture=()=>({...createDefaultSaveV3(),legacyCatalogAccess:true,library:[{...createSandboxDraft(),id:'pedestal-toy',shapeId:'heart',createdAt:1}],totalCrafts:1});
test('pedestal rewards retain legacy ownership and recover earned callbacks without a second ad',async()=>{
 const store=new Map<string,string>();let state=fixture(),ads=0,fail=false;
 const storage={getItem:async(k:string)=>store.get(k)??null,setItem:async(k:string,v:string)=>{if(fail&&k===REWARD_JOURNAL_KEY)throw Error('quota');store.set(k,v);},removeItem:async(k:string)=>{store.delete(k);}};
 const grants=new RewardGrants(storage,()=>state,async next=>{state=next as typeof state;});
 expect(LEGACY_CATALOG_KEYS).toHaveLength(22);expect(PEDESTAL_REWARD_KEYS).toHaveLength(12);
 for(const key of PEDESTAL_REWARD_KEYS)expect(ownsCatalogItem(state,key)).toBe(false);
 for(const key of PEDESTAL_REWARD_KEYS){expect(await grants.request(key,async reward=>{ads++;await Promise.all([reward(),reward()]);})).toBe(true);await grants.request(key,async()=>{ads++;});}
 expect(ads).toBe(12);expect(decodeSaveStateV3(encodeSaveStateV3(state)).unlockedRewardIds).toEqual(PEDESTAL_REWARD_KEYS);
 state={...fixture(),legacyCatalogAccess:false};fail=true;
 await expect(grants.request('pedestal:ufo',async reward=>{ads++;await reward();})).rejects.toThrow('quota');
 fail=false;expect(await grants.request('pedestal:ufo',async()=>{ads++;})).toBe(true);expect(ads).toBe(13);
 const old={version:1,palette:3,items:{left:'dresser'}};
 expect(decodeRoomSettings(old)).toEqual(old);expect(decodeRoomSettings({...old,pedestal:'removed'})).toEqual(old);
 expect(decodeRoomSettings({...old,pedestal:'aquarium'})).toEqual({...old,pedestal:'aquarium'});
});
test('authored pedestal sprites share one transparent camera frame',async()=>{
 for(const p of PEDESTALS.filter(p=>p.id!=='standard')){
  const {data,info}=await sharp(`public/assets/pedestals/${p.id}.webp`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  expect([info.width,info.height],p.id).toEqual([640,364]);
  for(const index of [0,info.width-1,(info.height-1)*info.width,info.width*info.height-1])expect(data[index*4+3],p.id).toBe(0);
  let solid=0;for(let i=3;i<data.length;i+=4)if(data[i]!>240)solid++;expect(solid,p.id).toBeGreaterThan(info.width*info.height*.3);
 }
});
for(const locale of ['ru','en'] as const)for(const viewport of [{width:320,height:568},{width:568,height:320},{width:1440,height:900}]){
 test(`pedestal preview, explicit ad, save and cancel ${locale} ${viewport.width}`,async({browser,baseURL},info)=>{
  test.setTimeout(180000);const context=await browser.newContext({baseURL,locale:locale==='ru'?'ru-RU':'en-US',viewport,reducedMotion:'reduce',hasTouch:true}),page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await installRewardStub(page,locale);await page.addInitScript(save=>{if(!localStorage.getItem('squishy.collection.v1'))localStorage.setItem('squishy.save.v3',JSON.stringify(save));},fixture());
   await page.goto('/yandex/');await expect(page.locator('[data-library-table-ready]')).toHaveAttribute('data-library-table-ready','true');const table=await page.locator('.library-showcase-table').boundingBox();
   await page.locator('[data-room-edit-open]').click();await page.locator('[data-room-editor-tab="pedestals"]').click();await expect(page.locator('button[data-room-pedestal]')).toHaveCount(13);
   for(const p of PEDESTALS.filter(p=>p.id!=='standard')){
    const button=page.locator(`button[data-room-pedestal="${p.id}"]`);await expect(button).toHaveAttribute('data-pedestal-locked','true');await button.click();await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-room-pedestal',p.id);
    await expect(page.locator('[data-pedestal-unlock]')).toContainText(locale==='ru'?'за рекламу':'for an ad');await expect(page.locator('[data-pedestal-unlock] svg')).toHaveCount(1);
    expect(await page.evaluate(()=>(window as any).rewardQA.requests)).toBe(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);
    if(p.id==='ufo'){
     for(const control of await page.locator('[data-room-editor] footer button,[data-room-editor-tab],[data-pedestal-unlock],[data-pedestal-restore]').all()){
      const b=(await control.boundingBox())!;expect(b.width).toBeGreaterThanOrEqual(44);expect(b.height).toBeGreaterThanOrEqual(44);expect(b.x).toBeGreaterThanOrEqual(0);expect(b.y).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(viewport.width);expect(b.y+b.height).toBeLessThanOrEqual(viewport.height);
      expect(await control.evaluate(el=>{const b=el.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return hit===el||el.contains(hit);})).toBe(true);
     }await page.screenshot({path:info.outputPath('preview.png')});
    }
   }
   await page.locator('[data-room-edit-done]').click();await expect(page.locator('[data-room-editor]')).toBeVisible();expect(await page.evaluate(()=>localStorage.getItem('squishy.room.v1'))).toBeNull();
   await page.locator('[data-pedestal-restore]').click();await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-room-pedestal','standard');await page.locator('button[data-room-pedestal="ufo"]').click();
   for(const mode of ['close','error']){await page.evaluate(mode=>{(window as any).rewardQA.mode=mode;},mode);await page.locator('[data-pedestal-unlock]').click();await expect(page.locator('[data-pedestal-unlock]')).toBeEnabled();await expect(page.locator('[data-room-pedestal-preview]')).toBeVisible();expect((await readCollection(page)).unlockedRewardIds).not.toContain('pedestal:ufo');}
   await page.evaluate(()=>{(window as any).rewardQA.mode='earn';(window as any).rewardQA.failJournal=true;});await page.locator('[data-pedestal-unlock]').click();await expect(page.locator('[data-pedestal-unlock]')).toBeEnabled();expect(await page.evaluate(()=>(window as any).rewardQA.requests)).toBe(3);
   await page.evaluate(()=>{(window as any).rewardQA.failJournal=false;});await page.locator('[data-pedestal-unlock]').click();await expect(page.locator('[data-room-pedestal-preview]')).toHaveCount(0);expect(await page.evaluate(()=>(window as any).rewardQA.requests)).toBe(3);
   await page.locator('[data-room-edit-cancel]').click();await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-room-pedestal','standard');expect((await readCollection(page)).unlockedRewardIds).toContain('pedestal:ufo');
   await page.locator('[data-room-edit-open]').click();await page.locator('button[data-room-pedestal="ufo"]').click();await expect(page.locator('[data-room-pedestal-preview]')).toHaveCount(0);await page.locator('[data-room-editor-tab="colors"]').click();await page.locator('[data-room-theme="17"]').click();await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-room-pedestal','ufo');expect(await page.locator('.library-showcase-table').evaluate(el=>getComputedStyle(el,'::before').filter)).toBe('none');
   await page.locator('[data-room-edit-done]').click();await page.reload();await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-room-pedestal','ufo');expect(await page.locator('.library-showcase-table').boundingBox()).toEqual(table);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('squishy.room.v1')!).pedestal)).toBe('ufo');expect((await readCollection(page)).library).toEqual(fixture().library);await page.screenshot({path:info.outputPath('ufo-room.png')});expect(errors).toEqual([]);
  }finally{await context.close();}
 });
}
test('missing pedestal art keeps the standard stand usable and retries successfully',async({page})=>{
 await installRewardStub(page);await page.addInitScript(save=>localStorage.setItem('squishy.save.v3',JSON.stringify(save)),fixture());await page.route('**/assets/pedestals/ufo.webp',r=>r.abort());await page.goto('/yandex/');await page.locator('[data-room-edit-open]').click();await page.locator('[data-room-editor-tab="pedestals"]').click();await expect(page.locator('button[data-room-pedestal="ufo"]')).toBeDisabled();await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-room-pedestal','standard');await page.unroute('**/assets/pedestals/ufo.webp');await page.locator('[data-pedestal-retry]').click();await expect(page.locator('button[data-room-pedestal="ufo"]')).toBeEnabled();await page.locator('button[data-room-pedestal="ufo"]').click();await expect(page.locator('[data-sandbox-library]')).toHaveAttribute('data-room-pedestal','ufo');
});
