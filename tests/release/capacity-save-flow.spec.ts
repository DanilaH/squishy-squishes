import {expect,test,type Page} from '@playwright/test';
import {createDefaultSaveV3} from '../../src/platform/saveV3';
import {createSandboxDraft} from '../../src/sandbox/types';
import {readCollection} from '../collection';
import {installRewardStub} from '../yandex-reward-stub';
const full=()=>({...createDefaultSaveV3(),library:Array.from({length:4},(_,i)=>({...createSandboxDraft(),id:`kept-${i}`,createdAt:i})),totalCrafts:4});
async function openPendingSave(page:Page,url='/squishy-squishes/'){
 await page.addInitScript(save=>{if(!localStorage.getItem('squishy.collection.v1'))localStorage.setItem('squishy.save.v3',JSON.stringify(save));},full());
 await page.goto(url);await page.locator('[data-library-new]').first().click();await expect(page.locator('[data-phaser-ready=true]')).toBeVisible();await page.locator('button[data-shape=heart]').click();await page.locator('[data-action=save]').click();await expect(page.locator('[data-library-replace-overlay]')).toBeVisible();
}
for(const locale of ['ru-RU','en-US'])for(const viewport of [{width:320,height:568},{width:568,height:320},{width:1440,height:900}])test(`a full collection adds a permanent place and saves the pending craft ${locale} ${viewport.width}`,async({browser,baseURL},info)=>{
 const context=await browser.newContext({baseURL,locale,viewport,reducedMotion:'reduce'}),page=await context.newPage();try{
  await openPendingSave(page);const button=page.locator('[data-replacement-expand]');await expect(button).toContainText(locale==='ru-RU'?'рекламу':'ad');await expect(button.locator('svg')).toBeVisible();
  for(const control of await page.locator('[data-library-replace-overlay] button:visible').all()){
   expect(await control.evaluate(n=>{const r=n.getBoundingClientRect();return r.height>=44&&r.width>=44&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);
  }
  await page.screenshot({path:info.outputPath('full-save-offer.png')});await button.click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage','squeeze');const saved=await readCollection(page);expect(saved.libraryCapacity).toBe(5);expect(saved.library).toHaveLength(5);expect(saved.library.slice(0,4).map(t=>t.id)).toEqual(full().library.map(t=>t.id));expect(saved.library[4]!.shapeId).toBe('heart');
 }finally{await context.close();}
});
test('cancelled capacity ad keeps the draft and free replacement remains available',async({page})=>{
 await installRewardStub(page);await openPendingSave(page,'/yandex/');await page.evaluate(()=>{(window as any).rewardQA.mode='cancel';});await page.locator('[data-replacement-expand]').click();await expect(page.locator('[data-replacement-expand]')).toBeEnabled();expect((await readCollection(page)).libraryCapacity).toBe(4);
 await page.locator('[data-library-replace-id="kept-0"]').click();await page.locator('[data-library-replace-confirm]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage','squeeze');const saved=await readCollection(page);expect(saved.library).toHaveLength(4);expect(saved.library.map(t=>t.id)).not.toContain('kept-0');expect(await page.evaluate(()=>(window as any).rewardQA.requests)).toBe(1);
});
test('earned capacity survives a failed toy write and Save retry never requests another ad',async({page})=>{
 await installRewardStub(page);await openPendingSave(page,'/yandex/');await page.evaluate(()=>{(window as any).rewardQA.failToy=true;});await page.locator('[data-replacement-expand]').click();await expect(page.locator('[data-replacement-expand]')).toBeEnabled();await expect(page.locator('[data-library-modal-error]')).not.toBeEmpty();const before=await readCollection(page);expect(before.libraryCapacity).toBe(5);expect(before.library).toHaveLength(4);await expect(page.locator('[data-replacement-expand] svg')).toHaveCount(0);
 await page.evaluate(()=>{(window as any).rewardQA.failToy=false;});await page.locator('[data-replacement-expand]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage','squeeze');const saved=await readCollection(page);expect(saved.libraryCapacity).toBe(5);expect(saved.library).toHaveLength(5);expect(await page.evaluate(()=>(window as any).rewardQA.requests)).toBe(1);
});
