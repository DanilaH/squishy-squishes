import { test, expect } from '@playwright/test';
import { installAndroidBridge } from '../android-bridge';
import { createLegacySaveV3 } from '../collection';
import { createSandboxDraft } from '../../src/sandbox/types';
import { createBodyFillStroke } from '../../src/sandbox/appearance';
import { createStickerPlacement } from '../../src/sandbox/decor';
import { initialAccessoryPlacements } from '../../src/sandbox/freeCraft';
import { getShape } from '../../src/game/shapes';
import { decodeSaveStateV3 } from '../../src/platform/saveV3';
import { onboardingState } from '../../src/platform/onboarding';
import { PEDESTAL_REWARD_KEYS } from '../../src/game/pedestals';

const draft=createSandboxDraft();
const specs = [
 {id:'01-dumpling-dj',shape:'dumpling',material:'pearl',color:0xff95b9,eyes:'happy',mouth:'tongue',gear:['headphones'],palette:12,pedestal:'donut'},
 {id:'02-cosmic-cat',shape:'mochi-cat',material:'holo',color:0x91bdf4,eyes:'sparkling',mouth:'cat',gear:['halo','wings'],palette:15,pedestal:'ufo'},
 {id:'03-mint-witch',shape:'ghost',material:'jelly',color:0x99f4cf,eyes:'sly',mouth:'fangs',gear:['witch-hat'],palette:16,pedestal:'cauldron'},
 {id:'04-berry-bunny',shape:'mochi-bunny',material:'soft',color:0xf3abd1,eyes:'happy',mouth:'smile',gear:['bow','heart-patch'],palette:3,pedestal:'cake'},
 {id:'05-mushroom-king',shape:'mushroom',material:'pearl',color:0xeeb577,eyes:'dot',mouth:'cat',gear:['crown'],palette:7,pedestal:'mushroom-stump'},
] as const;
const toys=specs.map((s,i)=>({...draft,id:s.id,createdAt:100+i,shapeId:s.shape,materialId:s.material,
 appearance:{...draft.appearance,strokes:[createBodyFillStroke(s.color)],mixins:i===1?[
  {t:1,x:75,y:174,s:16,r:12},{t:6,x:183,y:179,s:18,r:0},{t:1,x:189,y:93,s:12,r:0},
 ]:[],light:{preset:'studio' as const,x:-.3,y:.4}},
 decor:{...draft.decor,eyes:s.eyes,mouth:s.mouth,blush:true,
  accessories:s.gear.flatMap(a=>initialAccessoryPlacements(getShape(s.shape),a).map(p=>a==='headphones'?{...p,s:2.7,depth:'rear' as const}:a==='wings'?{...p,s:.85}:p)),
  stickers:i===0?[{...createStickerPlacement('lightning',{u:.75,v:.44},0),s:35}]:i===3?[{...createStickerPlacement('strawberry',{u:.72,v:.35},0),s:37}]:[]}}));
const normal={left:'dresser',right:'paw-pouf',shelf:'figurine-shelf',wall:'mirror',rug:'rug-flower',garland:'garland',detail:'gift-box'};
const spooky={left:'coffin-dresser',right:'pumpkin-pouf',shelf:'potion-shelf',wall:'ghost-picture',rug:'ghost-rug',garland:'cobweb-garland',detail:'pumpkin-lamp'};
for(const device of ['phone','tablet'] as const)for(const [i,s] of specs.entries())test(`${device} ${s.id}`,async({browser,baseURL},info)=>{
 const viewport=device==='phone'?{width:432,height:768}:{width:1280,height:720};
 const context=await browser.newContext({baseURL,viewport,deviceScaleFactor:device==='phone'?2.5:1.5,locale:'ru-RU',hasTouch:true,reducedMotion:'reduce'});
 const page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await installAndroidBridge(page);
 const save=decodeSaveStateV3({...createLegacySaveV3(),unlockedRewardIds:PEDESTAL_REWARD_KEYS,library:[...toys.filter(t=>t.id!==s.id),toys[i]!],totalCrafts:5});
 await page.addInitScript(({save,room,guide})=>{
  localStorage.setItem('squishy.save.v3',JSON.stringify(save));
  localStorage.setItem('squishy.room.v1',JSON.stringify(room));
  localStorage.setItem('squishy.onboarding.v1',JSON.stringify(guide));
 },{save,room:{version:1,palette:s.palette,pedestal:s.pedestal,items:i===2?spooky:normal},guide:onboardingState(false)});
 try{
  await page.goto('/android/');
  await expect(page.locator('[data-library-table-ready]')).toHaveAttribute('data-library-table-ready','true');
  await page.waitForTimeout(1500);await page.mouse.move(1,1);
  await page.screenshot({path:info.outputPath(`${device}-${s.id}-room.png`)});
  await page.locator('[data-library-select-id]').click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready','true');
  await page.waitForTimeout(1000);await page.mouse.move(1,1);
  await page.screenshot({path:info.outputPath(`${device}-${s.id}-play.png`)});
  await page.locator('[data-action="edit-saved"]').click();
  await page.locator('[data-craft-section="decor"]').click();
  await page.locator('[data-decor-section="accessory"]').click();
  await page.waitForTimeout(700);await page.mouse.move(1,1);
  await page.screenshot({path:info.outputPath(`${device}-${s.id}-craft.png`)});
  expect(errors).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);
  if(i===0){
   await page.locator('.craft-actions [data-action="save"]').click();
   await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-save-complete','true');
   await page.locator('[data-action="home"]').click();await page.locator('[data-room-collection]').click();
   await page.waitForTimeout(1500);await page.mouse.move(1,1);
   await page.screenshot({path:info.outputPath(`${device}-collection.png`)});
  }
 }finally{await context.close();}
});
