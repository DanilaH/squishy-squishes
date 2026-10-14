import {expect,test} from '@playwright/test';
import {createDefaultSaveV3,decodeSaveStateV3} from '../../src/platform/saveV3';
import {createSandboxDraft} from '../../src/sandbox/types';
import {createStickerPlacement} from '../../src/sandbox/decor';
import {SHAPES,isPointInsideShape,getShape,getShapeReliefTransform} from '../../src/game/shapes';

const draft=createSandboxDraft();
const toys=[
 {...draft,id:'cupcake',shapeId:'cupcake',createdAt:1},
 {...draft,id:'watermelon',shapeId:'watermelon',createdAt:2},
 ...(['headphones','butterfly','cherry'] as const).map((accessory,i)=>({...draft,id:accessory,shapeId:'mochi',createdAt:3+i,decor:{...draft.decor,accessory}})),
 {...draft,id:'details',shapeId:'mochi',createdAt:6,decor:{...draft.decor,stickers:[{...createStickerPlacement('strawberry',{u:.32,v:.64},0),s:72,r:0},{...createStickerPlacement('planet',{u:.69,v:.42},1),s:68,r:0}]},appearance:{...draft.appearance,mixins:Array.from({length:12},(_,i)=>({t:4,x:60+(i%4)*45,y:65+Math.floor(i/4)*60,s:14,r:i*17}))}},
];
const save={...createDefaultSaveV3(),library:toys,totalCrafts:6};

test('all canonical molds stay finite, centered and touchable; corrected details share normalization',()=>{
 expect(decodeSaveStateV3(save).library).toHaveLength(6);
 for(const shape of SHAPES){
  expect(shape.boundary.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))).toBe(true);
  expect(Math.max(...shape.boundary.map(p=>Math.max(Math.abs(p.x),Math.abs(p.y))))).toBeLessThanOrEqual(1);
  if(shape.id!=='donut') expect(isPointInsideShape(shape,0,0)).toBe(true);
 }
 const melon=getShape('watermelon'),frame=getShapeReliefTransform('watermelon');
 const top=melon.boundary.filter(p=>p.y>Math.max(...melon.boundary.map(p=>p.y))-.001);
 expect(top.length).toBeGreaterThan(10);
 expect(Math.max(...top.map(p=>p.y))-Math.min(...top.map(p=>p.y))).toBeLessThan(.001);
 for(const sign of [-1,1])expect(isPointInsideShape(melon,sign*.88*frame.scale,(.41-frame.y)*frame.scale)).toBe(true);
 const cake=getShape('cupcake');const nearTop=cake.boundary.filter(p=>Math.abs(p.x)<.1);
 expect(cake.boundary[0]!.y).toBe(Math.max(...nearTop.map(p=>p.y)));
});

for(const locale of ['ru-RU','en-US'])for(const viewport of [{width:390,height:844},{width:1440,height:900}])test(`quality art in catalog, scene, squeeze and reload ${locale} ${viewport.width}`,async({browser,baseURL},info)=>{
 test.setTimeout(120000);const context=await browser.newContext({baseURL,locale,viewport,reducedMotion:'reduce'});const page=await context.newPage();const errors:string[]=[],warnings:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.text().includes('[squishy:quality-art]'))warnings.push(m.text());});
 try{
  await page.addInitScript(save=>{if(!localStorage.getItem('squishy.save.v3'))localStorage.setItem('squishy.save.v3',JSON.stringify(save));},save);
  await page.goto(locale==='en-US'?'/squishy-squishes/?artFormat=webp':'/squishy-squishes/');await expect(page.locator('[data-library-table-ready]')).toHaveAttribute('data-library-table-ready','true');
  await page.locator('[data-room-collection]').click();await page.screenshot({path:info.outputPath('collection.png')});
  for(const id of ['cupcake','watermelon','headphones','butterfly','cherry','details']){
   const play=page.locator(`[data-library-play-id="${id}"]`);await play.scrollIntoViewIfNeeded();await play.click();
   const canvas=page.locator('[data-sandbox-canvas]');await expect(canvas).toHaveAttribute('data-phaser-ready','true');
   expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await page.screenshot({path:info.outputPath(`${id}.png`)});
   if(['headphones','butterfly','cherry'].includes(id)){
    const gear=page.locator('[data-sandbox-accessory]');await expect(gear).toHaveAttribute('data-accessory-id',id);const before=await gear.getAttribute('data-accessory-anchor-x');
    const box=(await canvas.boundingBox())!;await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.60,box.y+box.height*.53,{steps:10});await page.mouse.up();
    await expect.poll(async()=>Number(await page.locator('[data-sandbox-app]').getAttribute('data-sandbox-squeezes'))).toBeGreaterThan(0);expect(before).not.toBeNull();
   }
   if(id==='details'){
    await page.locator('[data-action="edit-saved"]').click();await page.locator('[data-decor-section="accessory"]').click();await page.screenshot({path:info.outputPath('accessory-catalog.png')});
    await page.locator('[data-accessory-icon="cherry"]').scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('accessory-catalog-lower.png')});
    await page.locator('[data-decor-section="stickers"]').click();await page.locator('[data-sticker-icon="planet"]').scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('sticker-catalog.png')});
    await page.locator('[data-craft-section="mixins"]').click();await page.screenshot({path:info.outputPath('filler-catalog.png')});
    await page.locator('[data-action="save"]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage','squeeze');
   }
   await page.locator('[data-action="home"]').click();await expect(page.locator('[data-room-view]')).toHaveAttribute('data-room-view','collection');
  }
  await page.reload();expect(decodeSaveStateV3(await page.evaluate(()=>JSON.parse(localStorage.getItem('squishy.save.v3')!))).library).toEqual(decodeSaveStateV3(save).library);
  expect(errors).toEqual([]);expect(warnings).toEqual([]);
 }finally{await context.close();}
});

test('new art failure retains usable procedural accessories and saved toy data',async({page})=>{
 await page.addInitScript(save=>localStorage.setItem('squishy.save.v3',JSON.stringify(save)),save);
 await page.route('**/assets/art-quality/*',r=>r.abort());await page.goto('/squishy-squishes/');await page.locator('[data-room-collection]').click();await page.locator('[data-library-play-id="headphones"]').click();
 await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready','true');await expect(page.locator('[data-sandbox-accessory]')).toHaveAttribute('data-accessory-id','headphones');
 expect(await page.locator('[data-sandbox-accessory]').evaluate(el=>{const c=el as HTMLCanvasElement;return c.getContext('2d')!.getImageData(0,0,c.width,c.height).data.some((n,i)=>i%4===3&&n>100);})).toBe(true);
 expect(decodeSaveStateV3(await page.evaluate(()=>JSON.parse(localStorage.getItem('squishy.save.v3')!))).library).toEqual(decodeSaveStateV3(save).library);
});

test('review all fifteen live mold silhouettes',async({page},info)=>{
 test.setTimeout(150000);await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 const library=SHAPES.map((shape,i)=>({...draft,shapeId:shape.id,id:shape.id,createdAt:1700000000000+i}));
 const state={...createDefaultSaveV3(),libraryCapacity:24,library,totalCrafts:library.length};decodeSaveStateV3(state);
 await page.addInitScript(state=>localStorage.setItem('squishy.save.v3',JSON.stringify(state)),state);
 await page.goto('/squishy-squishes/');await page.locator('[data-room-collection]').click();
 for(const shape of SHAPES){
  const play=page.locator(`[data-library-play-id="${shape.id}"]`);await play.scrollIntoViewIfNeeded();await play.click();await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready','true');
  const box=(await page.locator('[data-sandbox-canvas]').boundingBox())!;
  await page.screenshot({path:info.outputPath(`mold-${shape.id}.png`),clip:{x:box.x+box.width/2-190,y:Math.max(0,box.y+box.height/2-190),width:380,height:380}});
  await page.locator('[data-action="home"]').click();
 }
});
