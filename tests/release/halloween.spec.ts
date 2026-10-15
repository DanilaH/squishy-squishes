import {expect,test} from '@playwright/test';
import sharp from 'sharp';
import {RewardGrants} from '../../src/platform/rewardGrants';
import {createDefaultSaveV3,decodeSaveStateV3,encodeSaveStateV3} from '../../src/platform/saveV3';
import {CATALOG_KEYS,LEGACY_CATALOG_KEYS,SEASONAL_CATALOG_KEYS,ownsCatalogItem} from '../../src/platform/catalogOwnership';
import {SHAPES,getShape,isPointInsideShape} from '../../src/game/shapes';
import {createSandboxDraft} from '../../src/sandbox/types';
import {initialAccessoryPlacements,accessoryDepth} from '../../src/sandbox/freeCraft';
import {createBodyFillStroke,MIXIN_IDS,createMixInPlacement} from '../../src/sandbox/appearance';
import {STICKER_IDS,createStickerPlacement} from '../../src/sandbox/decor';
import {decodeRoomSettings} from '../../src/platform/roomSettings';
import {readCollection} from '../collection';
import {installRewardStub} from '../yandex-reward-stub';

const ids=['ghost','bat','pumpkin'] as const;
const library=ids.map((shapeId,i)=>({...createSandboxDraft(),id:`halloween-${shapeId}`,shapeId,createdAt:100+i,
  appearance:{v:1 as const,strokes:[createBodyFillStroke([0xfff5df,0x9877c9,0xf7a35d][i]!)],mixins:[
    createMixInPlacement('bones',{u:.35,v:.3},16,0),createMixInPlacement('candies',{u:.65,v:.3},16,0),
  ]},decor:{...createSandboxDraft().decor,eyes:'frightened' as const,mouth:'grin' as const,blush:true,
    stickers:[createStickerPlacement('bone',{u:.5,v:.28},0)],
    accessories:(shapeId==='bat'?['bat-wings','monster-hat'] as const:shapeId==='ghost'?['cobweb','toy-scythe'] as const:['monster-hat'] as const).flatMap(id=>initialAccessoryPlacements(getShape(shapeId),id))},
}));
const fixture=()=>({...createDefaultSaveV3(),legacyCatalogAccess:true,libraryCapacity:8,library,unlockedRewardIds:[...SEASONAL_CATALOG_KEYS],totalCrafts:3});

test('Halloween content appends stable codes and preserves the legacy entitlement boundary',async()=>{
  expect(SHAPES).toHaveLength(18);expect(MIXIN_IDS.slice(0,13).at(-1)).toBe('flakes');
  expect(STICKER_IDS.slice(0,13).at(-1)).toBe('ghost');expect(STICKER_IDS.at(-1)).toBe('bone');
  const legacy={...createDefaultSaveV3(),legacyCatalogAccess:true};
  expect(LEGACY_CATALOG_KEYS).toHaveLength(22);expect(CATALOG_KEYS).toHaveLength(26);
  for(const key of LEGACY_CATALOG_KEYS)expect(ownsCatalogItem(legacy,key)).toBe(true);
  for(const key of SEASONAL_CATALOG_KEYS)expect(ownsCatalogItem(legacy,key)).toBe(false);
  expect(decodeSaveStateV3(encodeSaveStateV3(fixture())).library).toEqual(library);
  for(const id of ids){const shape=getShape(id);expect(isPointInsideShape(shape,0,0)).toBe(true);
    for(const p of shape.boundary){expect(Number.isFinite(p.x+p.y)).toBe(true);expect(Math.max(Math.abs(p.x),Math.abs(p.y))).toBeLessThanOrEqual(.941);}
    const wings=initialAccessoryPlacements(shape,'bat-wings');expect(wings).toHaveLength(2);
    for(const wing of wings){expect(accessoryDepth(wing)).toBe('rear');expect(isPointInsideShape(shape,wing.x/255*2-1,wing.y/255*2-1)).toBe(true);}
  }
  expect(decodeRoomSettings({version:1,palette:0,items:{wall:'ghost-picture',detail:'pumpkin-lamp'}}).items).toEqual({wall:'ghost-picture',detail:'pumpkin-lamp'});
  const data=new Map<string,string>();let state:ReturnType<typeof createDefaultSaveV3>=legacy;let ads=0;
  const grants=new RewardGrants({getItem:async key=>data.get(key)??null,setItem:async(key,value)=>{data.set(key,value);},removeItem:async key=>{data.delete(key);}},()=>state,async next=>{state=next;});
  expect(await grants.request('shape:mochi-cat',async()=>{ads++;})).toBe(true);expect(ads).toBe(0);
  for(const key of SEASONAL_CATALOG_KEYS){expect(await grants.request(key,async reward=>{ads++;await Promise.all([reward(),reward()]);})).toBe(true);expect(ownsCatalogItem(state,key)).toBe(true);}
  expect(ads).toBe(4);await grants.request('shape:bat',async()=>{ads++;});expect(ads).toBe(4);
});

test('seasonal sprites have transparent margins, opaque subjects and no green matte',async()=>{
  for(const name of ['bat-wings','monster-hat','cobweb','toy-scythe','sticker-bone','filler-bones','filler-candies']){
    const {data,info}=await sharp(new URL(`../../public/assets/art-quality/${name}.webp`,import.meta.url).pathname).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    expect(data[3],name).toBe(0);let solid=0,green=0;
    for(let n=0;n<data.length;n+=4){if(data[n+3]!>245)solid++;if(data[n+3]!>80&&data[n+1]!>150&&data[n+1]!-Math.max(data[n]!,data[n+2]!)>70)green++;}
    expect(solid,name).toBeGreaterThan(info.width*info.height*.02);expect(green,name).toBe(0);
  }
});

for(const locale of ['ru-RU','en-US'])for(const viewport of [{width:320,height:568},{width:568,height:320},{width:1440,height:900}])
test(`Halloween room and saved molds retain all new content ${locale} ${viewport.width}`,async({browser,baseURL},info)=>{
  test.setTimeout(300000);const context=await browser.newContext({baseURL,locale,viewport,reducedMotion:'reduce'}),page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.addInitScript(save=>{if(!localStorage.getItem('squishy.collection.v1'))localStorage.setItem('squishy.save.v3',JSON.stringify(save));
      localStorage.setItem('squishy.room.v1',JSON.stringify({version:1,palette:7,items:{left:'dresser',wall:'ghost-picture',detail:'pumpkin-lamp',rug:'rug-oval'}}));},fixture());
    await page.goto('/squishy-squishes/');await expect(page.locator('[data-library-table-ready]')).toHaveAttribute('data-library-table-ready','true');
    await expect(page.locator('[data-room-prop-slot="wall"]')).toBeVisible();await expect(page.locator('[data-room-prop-slot="detail"]')).toBeVisible();
    await page.screenshot({path:info.outputPath('halloween-room.png')});await page.locator('[data-room-collection]').click();
    for(const id of ids){await page.locator(`[data-library-play-id="halloween-${id}"]`).click();await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready','true');
      await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-shape',id);await expect(page.locator('[data-accessory-index]')).toHaveCount(library.find(toy=>toy.shapeId===id)!.decor.accessories.length);
      expect(await page.evaluate(()=>({x:document.documentElement.scrollWidth>innerWidth,y:document.documentElement.scrollHeight>innerHeight}))).toEqual({x:false,y:false});
      await page.screenshot({path:info.outputPath(`${id}-squeeze.png`)});await page.locator('[data-action="home"]').click();
    }
    await page.locator('[data-library-play-id="halloween-ghost"]').click();await page.locator('[data-action="edit-saved"]').click();await page.locator('[data-craft-section="decor"]').click();await page.locator('button[data-decor-section="face"]').click();
    if(viewport.width>=901){const panel=page.locator('[data-decor-panel="face"]');expect(await panel.evaluate(el=>el.scrollHeight<=el.clientHeight+1)).toBe(true);for(const choice of await panel.locator('.sandbox-decor-choice').all()){const box=(await choice.boundingBox())!;expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);}}

    await page.locator('[data-decor-eyes="stitched-eye"]').click();await page.locator('[data-action="save"]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage','squeeze');
    await page.reload();const loaded=decodeSaveStateV3(await readCollection(page));expect(loaded.library[0]!.decor.eyes).toBe('stitched-eye');expect(loaded.library[0]!.appearance).toEqual(library[0]!.appearance);expect(loaded.library[0]!.decor.accessories).toEqual(library[0]!.decor.accessories);expect(loaded.library.slice(1)).toEqual(library.slice(1));expect(errors).toEqual([]);
  }finally{await context.close();}
});

test('a returning player previews and permanently opens a seasonal mold with one explicit ad',async({page})=>{
  await installRewardStub(page);await page.addInitScript(save=>{if(!localStorage.getItem('squishy.collection.v1'))localStorage.setItem('squishy.save.v3',JSON.stringify(save));},{...createDefaultSaveV3(),legacyCatalogAccess:true,libraryCapacity:8});
  await page.goto('/yandex/');await page.locator('[data-library-new]').first().click();await expect(page.locator('[data-phaser-ready=true]')).toBeVisible();
  const bat=page.locator('[data-shape="bat"]');await expect(bat).toHaveAttribute('data-catalog-locked','true');await bat.click();await expect(page.locator('[data-preview-open]')).toContainText(/реклам|ad/);
  await page.locator('[data-preview-open]').click();await expect(page.locator('[data-catalog-preview]')).toBeHidden();await page.locator('[data-action="save"]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage','squeeze');
  const saved=await readCollection(page);expect(saved.unlockedRewardIds).toContain('shape:bat');expect(saved.library[0]!.shapeId).toBe('bat');expect(await page.evaluate(()=>(window as any).rewardQA.requests)).toBe(1);
});
