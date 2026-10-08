// Unpin was paused by the owner: browser free-flight cases remain dormant; unit physics stays covered.
import type { MaterialId } from '../../src/game/content';
import { getShape } from '../../src/game/shapes';
import { expect, test } from '@playwright/test';
import { createDefaultSaveV3 } from '../../src/platform/saveV3';
import { createSandboxDraft } from '../../src/sandbox/types';
import { SquishSimulation } from '../../src/squish/SquishSimulation';
import { FreeSquishBody } from '../../src/sandbox/freeSquishBody';

for (const earlyRelease of [false,true]) test(`free body cannot tunnel through the pedestal, release before frame=${earlyRelease}`, () => {
  const body = new FreeSquishBody();
  const points = [{x:90,y:90},{x:110,y:90},{x:110,y:110},{x:90,y:110}];
  const room = {left:0,right:400,top:0,bottom:400,pedestal:[{x:50,y:150},{x:150,y:150},{x:150,y:300},{x:50,y:300}]};
  body.begin(1,100,100,0); body.move(1,100,350,16);
  if(earlyRelease)body.end(1,16);
  body.advance(16,points,room,'jelly',10,()=>{});
  expect(body.y).toBeLessThanOrEqual(40);
  body.end(1,16); body.returnHome();
  for(let i=0;i<50;i++)if(body.advance(16,points,room,'jelly',10,()=>{}))break;
  expect([body.x,body.y,body.vx,body.vy]).toEqual([0,0,0,0]);
  expect(body.returning).toBe(false);
});

for (const viewport of [{width:390,height:844},{width:1440,height:900},{width:568,height:320}])
test.skip(`free carry, release, return and storage at ${viewport.width}`, async ({page}, info) => {
  await page.setViewportSize(viewport);
  await page.goto('/squishy-squishes/?roomReview=1');
  await page.evaluate(save=>localStorage.setItem('squishy.save.v3',JSON.stringify(save)), {...createDefaultSaveV3(),totalCrafts:1,library:[{...createSandboxDraft(),id:'free',createdAt:1,shapeId:'mochi',materialId:'jelly'}]});
  await page.reload();
  await page.locator('[data-library-select-id="free"]').click();
  const canvas=page.locator('[data-sandbox-canvas]'), shell=page.locator('[data-sandbox-app]');
  await expect(canvas).toHaveAttribute('data-phaser-ready','true');
  const before=await page.evaluate(()=>localStorage.getItem('squishy.save.v3'));
  const box=(await canvas.boundingBox())!;
  const center={x:box.x+box.width/2,y:box.y+box.height/2};
  await page.locator('[data-action="free-squeeze"]').click();
  await expect(shell).toHaveAttribute('data-free-squeeze','true');
  const full=(await canvas.boundingBox())!;
  expect(full.x).toBeCloseTo(0); expect(full.y).toBeCloseTo(0);
  expect(full.width).toBe(viewport.width); expect(full.height).toBe(viewport.height);
  // Focusing the toggle must never auto-scroll a hidden ancestor and move home.
  expect(Number(await canvas.getAttribute('data-free-home-y'))).toBeCloseTo(center.y,1);
  await page.mouse.move(center.x,center.y); await page.mouse.down();
  await expect(canvas).toHaveAttribute('data-free-body-held','true');
  await page.mouse.move(center.x+viewport.width*.15, Math.max(75,center.y-70),{steps:12});
  await expect.poll(async()=>Math.abs(Number(await canvas.getAttribute('data-free-body-x')))).toBeGreaterThan(10);
  await page.screenshot({path:info.outputPath('free-held.png')});
  await page.mouse.up(); await expect(canvas).toHaveAttribute('data-free-body-held','false');
  await page.locator('[data-action="free-squeeze"]').click();
  await expect(shell).not.toHaveAttribute('data-free-squeeze','true');
  const restored=(await canvas.boundingBox())!;
  expect(restored.width).toBeCloseTo(box.width); expect(restored.height).toBeCloseTo(box.height);
  expect(restored.x).toBeCloseTo(box.x); expect(restored.y).toBeCloseTo(box.y);
  expect(await page.evaluate(()=>localStorage.getItem('squishy.save.v3'))).toBe(before);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);
});

test.skip('touch carry keeps a second stretch, attachments and cancellation coherent', async ({browser,baseURL},info) => {
  const context=await browser.newContext({baseURL,viewport:{width:390,height:844},hasTouch:true,locale:'ru-RU'});
  const page=await context.newPage();
  try {
    await page.goto('/squishy-squishes/?roomReview=1');
    await page.evaluate(save=>localStorage.setItem('squishy.save.v3',JSON.stringify(save)),{...createDefaultSaveV3(),totalCrafts:1,library:[{...createSandboxDraft(),id:'touch',createdAt:1,shapeId:'mochi',materialId:'jelly',decor:{v:1,eyes:'dot',mouth:'smile',blush:true,accessory:'bow',stickers:[]}}]});
    await page.reload(); await page.locator('[data-library-select-id="touch"]').click();
    const canvas=page.locator('[data-sandbox-canvas]'),shell=page.locator('[data-sandbox-app]');
    await expect(canvas).toHaveAttribute('data-phaser-ready','true');
    const box=(await canvas.boundingBox())!,center={x:box.x+box.width/2,y:box.y+box.height/2};
    const accessory=page.locator('.sandbox-accessory-layer').first();
    const size=await accessory.evaluate(el=>({width:getComputedStyle(el).width,height:getComputedStyle(el).height}));
    await page.locator('[data-action="free-squeeze"]').click();
    const freeSize=await accessory.evaluate(el=>({width:getComputedStyle(el).width,height:getComputedStyle(el).height}));
    expect(parseFloat(freeSize.width)).toBeCloseTo(parseFloat(size.width),1); expect(parseFloat(freeSize.height)).toBeCloseTo(parseFloat(size.height),1);
    const cdp=await context.newCDPSession(page);
    const carry={...center,id:1},edge={x:center.x+55,y:center.y,id:2};
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[carry]});
    await expect(canvas).toHaveAttribute('data-free-body-held','true');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[carry,edge]});
    await expect(shell).toHaveAttribute('data-squish-pointers','2');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...carry,y:carry.y-70},{...edge,x:edge.x+55,y:edge.y-70}]});
    await expect.poll(async()=>Number(await shell.getAttribute('data-squish-max-displacement'))).toBeGreaterThan(.1);
    await page.screenshot({path:info.outputPath('two-finger-carry.png')});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{...carry,y:carry.y-70}]});
    await expect(shell).toHaveAttribute('data-squish-pointers','1');
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
    await expect(canvas).toHaveAttribute('data-free-body-held','false');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.locator('[data-action="free-squeeze"]').click();
    await expect(shell).not.toHaveAttribute('data-free-squeeze','true');
  } finally { await context.close(); }
});

test.skip('saved Studio squeeze keeps its desk anchored when unpinned', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/squishy-squishes/?roomReview=0');
  await page.evaluate(save=>localStorage.setItem('squishy.save.v3',JSON.stringify(save)),{...createDefaultSaveV3(),totalCrafts:1,library:[{...createSandboxDraft(),id:'studio',createdAt:1}]});
  await page.reload(); await page.locator('[data-library-play-id="studio"]').click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready','true');
  await page.locator('[data-action="edit-saved"]').click();
  await page.locator('[data-craft-section="shape"]').click(); await page.locator('[data-base-tab="material"]').click(); await page.locator('[data-action="save"]').click();
  const shell=page.locator('[data-sandbox-app]');
  await expect(shell).toHaveAttribute('data-stage','squeeze');
  const desk=page.locator('[data-studio-desk]'); await expect(desk).toBeVisible();
  const before=(await desk.boundingBox())!;
  await page.locator('[data-action="free-squeeze"]').click();
  await expect(shell).toHaveAttribute('data-free-squeeze','true');
  await page.waitForTimeout(200);
  expect(await desk.boundingBox()).toEqual(before);
  await page.locator('[data-action="free-squeeze"]').click();
  await expect(shell).not.toHaveAttribute('data-free-squeeze','true');
});

test('walls contain every material and rebound follows its character', () => {
  const points=[{x:90,y:90},{x:110,y:90},{x:110,y:110},{x:90,y:110}];
  const room={left:0,right:400,top:0,bottom:400,pedestal:[]};
  const rebound: Record<string,number>={};
  for(const material of ['soft','jelly','marshmallow','pearl','holo','chrome'] as const){
    const body=new FreeSquishBody();body.y=290;body.vy=1000;
    let impacts=0;body.advance(16,points,room,material,10,()=>impacts++);
    expect(impacts).toBe(1);rebound[material]=-body.vy;
    body.vx=1800;
    for(let i=0;i<300;i++){
      body.advance(16,points,room,material,10,()=>{});
      // Containment follows the rotated live skin, rather than its rest box.
      for (const p of points) {
        const c=Math.cos(body.angle),s=Math.sin(body.angle),dx=p.x-100,dy=p.y-100;
        const x=100+dx*c-dy*s+body.x,y=100+dx*s+dy*c+body.y;
        expect(x).toBeGreaterThanOrEqual(-.001);expect(x).toBeLessThanOrEqual(400.001);
        expect(y).toBeGreaterThanOrEqual(-.001);expect(y).toBeLessThanOrEqual(400.001);
      }
    }
    body.cancel();expect([body.vx,body.vy,body.held]).toEqual([0,0,null]);
  }
  expect(rebound.pearl).toBeGreaterThan(rebound.jelly!);expect(rebound.jelly).toBeGreaterThan(rebound.holo!);
  expect(rebound.holo).toBeGreaterThan(rebound.soft!);expect(rebound.soft).toBeGreaterThan(rebound.chrome!);
  expect(rebound.chrome).toBeGreaterThan(rebound.marshmallow!);
});

test('off-center circular grabs create angular momentum and release preserves it', () => {
  const body=new FreeSquishBody(), origin={x:1000,y:1000};body.setOrigin(origin);
  const points=[{x:930,y:930},{x:1070,y:930},{x:1070,y:1070},{x:930,y:1070}];
  const room={left:0,right:2000,top:0,bottom:2000,pedestal:[]};
  body.begin(1,1060,1000,0,origin);
  let tension=0,spin=0;
  for(let i=1;i<=150;i++) {
    const t=i*.085;body.move(1,1000+100*Math.cos(t),1000+100*Math.sin(t),i*16);
    body.advance(16,points,room,'jelly',90,()=>{});
    tension=Math.max(tension,body.tension);spin=Math.max(spin,Math.abs(body.omega));
  }
  expect(spin).toBeGreaterThan(2);expect(tension).toBeGreaterThan(.2);
  const omega=body.omega;body.end(1,2400);expect(body.omega).toBe(omega);
  const angle=body.angle;body.advance(16,points,room,'jelly',90,()=>{});
  expect(Math.abs(body.angle-angle)).toBeGreaterThan(.005);
  // Catch at its new center without a body/angle teleport.
  const before={x:body.x,y:body.y,angle:body.angle};
  body.begin(2,origin.x+body.x,origin.y+body.y,2416,origin);
  expect({x:body.x,y:body.y,angle:body.angle}).toEqual(before);
  body.angle += Math.PI * 8;
  body.returnHome();
  expect(Math.abs(body.angle)).toBeLessThanOrEqual(Math.PI);
  expect(Math.sin(body.angle)).toBeCloseTo(Math.sin(before.angle), 8);
  for(let i=0;i<40;i++)body.advance(16,points,room,'jelly',90,()=>{});
  expect(body.angle).toBe(0);expect(body.returning).toBe(false);
});

test('a jelly wall contact briefly slows falling then releases, chrome does not stick', () => {
  const points=[{x:90,y:90},{x:110,y:90},{x:110,y:110},{x:90,y:110}];
  const room={left:0,right:400,top:0,bottom:1000,pedestal:[]};
  const result: Record<string,{x:number;y:number}>={};
  for(const material of ['jelly','chrome'] as const){
    const body=new FreeSquishBody();body.x=290;body.vx=1000;
    for(let i=0;i<12;i++)body.advance(16,points,room,material,10,()=>{});
    result[material]={x:body.x,y:body.y};
    for(let i=0;i<60;i++)body.advance(16,points,room,material,10,()=>{});
    expect(body.y).toBeGreaterThan(result[material]!.y+40);
    expect(Number.isFinite(body.angle)).toBe(true);
  }
  expect(result.jelly!.x).toBeGreaterThan(result.chrome!.x+5);
  expect(result.jelly!.y).toBeLessThan(result.chrome!.y);
});


test('material load changes the mesh and recovers without changing canonical UVs', () => {
  const deformation:Record<string,number>={};
  for(const material of ['jelly','soft','chrome'] as const) {
    const sim=new SquishSimulation();sim.setTactileFeatures(true,material);
    sim.setRoomLoad(0,1,.7,.5,.6,.3,0,-1);
    for(let i=1;i<=120;i++)sim.advance(16,i*16);
    deformation[material]=sim.snapshot().maxDisplacement;
    expect(sim.vertices.every(v=>Number.isFinite(v.x)&&Number.isFinite(v.y))).toBe(true);
    const loaded=sim.snapshot().maxDisplacement;
    sim.setRoomLoad(0,0,0,0,0,0,0,-1);
    for(let i=121;i<=420;i++)sim.advance(16,i*16);
    expect(sim.snapshot().maxDisplacement).toBeLessThan(loaded*.05);
    expect(sim.vertices.every(v=>v.u===v.restX*.5+.5&&v.v===v.restY*.5+.5)).toBe(true);
  }
  expect(deformation.jelly!).toBeGreaterThan(deformation.soft!*1.5);
  expect(deformation.soft!).toBeGreaterThan(deformation.chrome!*3);
});


test('room grip load stretches Jelly below a fixed UV tip and respects material stiffness',()=>{
 const sag: Partial<Record<MaterialId,number>>={};
 for(const material of ['jelly','soft','marshmallow','pearl','holo','chrome'] as const){
   const sim=new SquishSimulation(getShape('mochi'));sim.setTactileFeatures(true,material);
   sim.setViewportFollowEnabled(false);
   sim.setRoomLoad(0,0,0,0,0,.55,0,-1,true,0);
   for(let i=1;i<=180;i++)sim.advance(16,i*16);
   const tip=sim.projectUvToLocal(.5,.775),bottom=sim.projectUvToLocal(.5,.2);
   expect(Math.abs(tip.y-.55)).toBeLessThan(.04);
   sag[material]=-.6-bottom.y;
   if(material==='jelly')expect(bottom.y).toBeLessThan(-.8);
   expect(sim.vertices.every(v=>Number.isFinite(v.x)&&Number.isFinite(v.y))).toBe(true);
   const loaded=sim.snapshot().maxDisplacement;
   sim.setRoomLoad(0,0,0,0,0,0,0,-1);
   for(let i=181;i<=480;i++)sim.advance(16,i*16);
   expect(sim.snapshot().maxDisplacement).toBeLessThan(loaded*.05);
 }
 expect(sag.jelly!).toBeGreaterThan(sag.soft!*1.5);
 expect(sag.soft!).toBeGreaterThan(sag.chrome!*3);
});

 test('Unpin is absent from the player interface',async({page})=>{
  await page.goto('/squishy-squishes/?roomReview=0');await page.locator('[data-library-new]').first().click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready','true');
  await page.locator('[data-action="save"]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage','squeeze');
  await expect(page.locator('[data-action="free-squeeze"]')).toHaveCount(0);
});
