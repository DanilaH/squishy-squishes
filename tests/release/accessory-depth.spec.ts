import { readCollection, createLegacySaveV3 as createDefaultSaveV3 } from '../collection';
import {test, expect} from '@playwright/test';
import {createSandboxDraft} from '../../src/sandbox/types';
import {decodeSaveStateV3} from '../../src/platform/saveV3';
import {ACCESSORY_IDS, decodeDecorDocument, encodeDecorDocument} from '../../src/sandbox/decor';
import {accessoryDepth, initialAccessoryPlacements} from '../../src/sandbox/freeCraft';
import {getShape, SHAPES} from '../../src/game/shapes';

const draft = createSandboxDraft();
const state = {...createDefaultSaveV3(),totalCrafts:1,library:[{...draft,id:'depth-proof',createdAt:1,shapeId:'mochi' as const,
  decor:{...draft.decor,eyes:'dot' as const,mouth:'smile' as const,accessories:initialAccessoryPlacements(getShape('mochi'),'headphones')}}]};

test('accessory defaults, old saves and explicit depth survive V3 validation',()=>{
  const rear = new Set(['cat-ears','bunny-ears','horns','antennae','halo','wings']);
  for(const id of ACCESSORY_IDS) for(const item of initialAccessoryPlacements(getShape('mochi'),id)){
    expect(accessoryDepth(item)).toBe(rear.has(id)?'rear':'front');
    for(const depth of ['front','rear'] as const){
      const decor = {...draft.decor, accessories:[{...item,depth}]};
      expect(decodeDecorDocument(encodeDecorDocument(decor))).toEqual(decor);
    }
  }
  const item=state.library[0]!.decor.accessories[0]!;
  expect(()=>decodeDecorDocument({...draft.decor,accessories:[{...item,depth:'bad'}]})).toThrow();
  expect(decodeSaveStateV3(state).library[0]!.decor.accessories![0]).toEqual(item);
  expect(decodeDecorDocument({...draft.decor,accessories:[{...item,s:4}]}).accessories![0]!.s).toBe(4);
  for(const invalid of [{...item,s:4.01},{...item,a:'bow',s:3}])
    expect(()=>decodeDecorDocument({...draft.decor,accessories:[invalid]})).toThrow();
});

for(const [locale,viewport] of [['ru-RU',{width:320,height:568}],['ru-RU',{width:390,height:844}],['en-US',{width:568,height:320}],['en-US',{width:1440,height:900}]] as const)
test(`accessory layer, size, undo and reload ${locale} ${viewport.width}`,async({browser,baseURL},info)=>{
  test.setTimeout(90000);
  const context=await browser.newContext({baseURL,locale,viewport,reducedMotion:'reduce'});const page=await context.newPage();
  try{
    await page.addInitScript(state=>{if(!localStorage.getItem('squishy.save.v3'))(localStorage.removeItem('squishy.collection.v1'), localStorage.setItem('squishy.save.v3',JSON.stringify(state)));},state);
    await page.goto('/squishy-squishes/');await page.locator('[data-room-collection]').click();
    await page.locator('[data-library-play-id="depth-proof"]').click();
    await page.locator('[data-action="edit-saved"]').click();await page.locator('[data-craft-section="decor"]').click();
    await page.locator('[data-decor-section="objects"]').click();await page.locator('[data-object="accessory:0"]').click();
    const gear=page.locator('[data-accessory-index="0"]');
    await expect(gear).toHaveAttribute('data-accessory-depth','front');
    await page.locator('[data-object-control="scale"]').fill('2.5');await page.locator('[data-object-control="scale"]').dispatchEvent('change');
    await page.screenshot({path:info.outputPath('headphones-2.5.png')});
    await expect(page.locator('[data-object-control="scale"]')).toHaveAttribute('max','4');
    await page.locator('[data-object-control="scale"]').fill('3.3');await page.locator('[data-object-control="scale"]').dispatchEvent('change');
    await page.screenshot({path:info.outputPath('headphones-3.3.png')});
    await page.locator('[data-object-control="scale"]').fill('4');await page.locator('[data-object-control="scale"]').dispatchEvent('change');
    await page.screenshot({path:info.outputPath('headphones-max.png')});
    const studioRatio=await gear.evaluate(el=>{
      const canvas=document.querySelector<HTMLCanvasElement>('[data-sandbox-canvas]')!,r=canvas.getBoundingClientRect();
      return parseFloat(getComputedStyle(el).width)/(Math.min(r.width,r.height)*parseFloat(getComputedStyle(canvas).getPropertyValue('--squish-radius-ratio')));
    });
    expect(studioRatio).toBeCloseTo(112/102.4,2);
    await page.locator('[data-object-action="more"]').click();
    const depth=page.locator('[data-object-action="depth"]');await expect(depth).toHaveAttribute('aria-pressed','false');
    const reachable=()=>depth.evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.height>=44&&r.width>=44&&!!hit&&el.contains(hit);});
    expect(await reachable()).toBe(true);
    await depth.click();await expect(gear).toHaveAttribute('data-accessory-depth','rear');
    expect(await reachable()).toBe(true);
    await expect(depth).toHaveAttribute('aria-pressed','true');
    expect(await gear.evaluate(el=>Number(getComputedStyle(el).zIndex))).toBeLessThan(await page.locator('[data-sandbox-canvas]').evaluate(el=>Number(getComputedStyle(el).zIndex)));
    await page.locator('.craft-actions [data-action="draft-undo"]').click();await expect(gear).toHaveAttribute('data-accessory-depth','front');
    await page.locator('.craft-actions [data-action="draft-redo"]').click();await expect(gear).toHaveAttribute('data-accessory-depth','rear');
    await depth.click();await expect(gear).toHaveAttribute('data-accessory-covers-face','true');
    expect(await gear.evaluate(el=>Number(getComputedStyle(el).zIndex))).toBeGreaterThan(await page.locator('.free-face-foreground').evaluate(el=>Number(getComputedStyle(el).zIndex)));
    await page.screenshot({path:info.outputPath('layer-controls.png')});
    expect(await depth.evaluate(el=>{const r=el.getBoundingClientRect();return r.height>=44&&r.width>=44&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})).toBe(true);
    await page.locator('[data-object-action="close-more"]').click();await page.locator('[data-object-action="lock"]').click();
    await page.locator('[data-object-action="more"]').click();await expect(depth).toBeDisabled();
    await page.locator('[data-object-action="close-more"]').click();await page.locator('[data-object-action="lock"]').click();
    await page.locator('[data-object-action="more"]').click();await depth.click();
    await page.locator('[data-action="save"]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage','squeeze');
    const saved=decodeSaveStateV3(await page.evaluate((__collection) => (__collection), await readCollection(page)));
    expect(saved.library[0]!.decor.accessories![0]!.depth).toBe('rear');
    expect(saved.library[0]!.decor.accessories![0]!.s).toBe(4);
    await page.reload();await page.locator('[data-room-collection]').click();await page.locator('[data-library-play-id="depth-proof"]').click();
    await expect(gear).toHaveAttribute('data-accessory-depth','rear');
    await page.screenshot({path:info.outputPath('headphones-room-rear.png')});
    // The same logical frame must keep its body-relative size in both scenes.
    const frameRatio=await gear.evaluate(el=>{
      const canvas=document.querySelector<HTMLCanvasElement>('[data-sandbox-canvas]')!,r=canvas.getBoundingClientRect();
      const radius=Math.min(r.width,r.height)*parseFloat(getComputedStyle(canvas).getPropertyValue('--squish-radius-ratio'));
      return parseFloat(getComputedStyle(el).width)/radius;
    });
    expect(frameRatio).toBeCloseTo(112/102.4,2);
    expect(frameRatio).toBeCloseTo(studioRatio,2);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight)).toBe(false);
  }finally{await context.close();}
});

test('rear defaults, pair copies and reset keep independent layers',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const rearState={...state,library:[{...state.library[0]!,decor:{...draft.decor,
    accessories:initialAccessoryPlacements(getShape('mochi'),'cat-ears')}}]};
  await page.addInitScript(state=>(localStorage.removeItem('squishy.collection.v1'), localStorage.setItem('squishy.save.v3',JSON.stringify(state))),rearState);
  await page.goto('/squishy-squishes/');await page.locator('[data-room-collection]').click();
  await page.locator('[data-library-play-id="depth-proof"]').click();await page.locator('[data-action="edit-saved"]').click();
  await page.locator('[data-craft-section="decor"]').click();await page.locator('[data-decor-section="objects"]').click();
  await page.locator('[data-object="accessory:0"]').click();await page.locator('[data-object-action="more"]').click();
  const depth=page.locator('[data-object-action="depth"]');await expect(depth).toHaveAttribute('aria-pressed','true');
  await depth.click();await expect(page.locator('[data-accessory-index="0"]')).toHaveAttribute('data-accessory-depth','front');
  await expect(page.locator('[data-accessory-index="1"]')).toHaveAttribute('data-accessory-depth','rear');
  await page.locator('[data-object-action="close-more"]').click();await page.locator('[data-object-action="mirror"]').click();
  await expect(page.locator('[data-accessory-index="2"]')).toHaveAttribute('data-accessory-depth','front');
  await page.locator('[data-object-action="more"]').click();await page.locator('[data-object-action="reset"]').click();
  await expect(page.locator('[data-accessory-index="2"]')).toHaveAttribute('data-accessory-depth','rear');
  await expect(depth).toHaveAttribute('aria-pressed','true');
});

test('headphones can surround every mold in the room',async({page},info)=>{
  test.setTimeout(180000);await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
  const library=SHAPES.map((shape,i)=>({...draft,id:shape.id,shapeId:shape.id,createdAt:i+1,
    decor:{...draft.decor,eyes:'dot' as const,mouth:'smile' as const,accessories:initialAccessoryPlacements(shape,'headphones').map(item=>({...item,s:4}))}}));
  await page.addInitScript(state=>(localStorage.removeItem('squishy.collection.v1'), localStorage.setItem('squishy.save.v3',JSON.stringify(state))),{...createDefaultSaveV3(),libraryCapacity:24,totalCrafts:library.length,library});
  await page.goto('/squishy-squishes/');await page.locator('[data-room-collection]').click();
  for(const shape of SHAPES){
    const play=page.locator(`[data-library-play-id="${shape.id}"]`);await play.scrollIntoViewIfNeeded();await play.click();
    await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready','true');
    const opening=await page.locator('[data-accessory-index="0"]').evaluate((el:HTMLCanvasElement)=>{
      const data=el.getContext('2d')!.getImageData(0,0,180,120).data;
      const row=Math.round(120*.64);const left:number[]=[],right:number[]=[];
      for(let x=0;x<180;x++)if(data[(row*180+x)*4+3]!>24)(x<90?left:right).push(x);
      return {left:left.length,right:right.length,separation:(right[0]!+right.at(-1)!-left[0]!-left.at(-1)!)/2};
    });
    expect(opening.left).toBeGreaterThan(0);expect(opening.right).toBeGreaterThan(0);
    const bodyWidth=Math.max(...shape.boundary.map(p=>p.x))-Math.min(...shape.boundary.map(p=>p.x));
    // Cup centers reach both sides of the whole toy; cushions may overlap its rim.
    expect(opening.separation/180*(112/102.4)*4,shape.id).toBeGreaterThan(bodyWidth*1.075);
    await page.screenshot({path:info.outputPath(`${shape.id}.png`)});
    await page.locator('[data-action="home"]').click();
  }
});
