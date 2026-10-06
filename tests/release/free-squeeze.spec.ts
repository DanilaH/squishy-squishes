import { expect, test } from '@playwright/test';
import { createDefaultSaveV3 } from '../../src/platform/saveV3';
import { createSandboxDraft } from '../../src/sandbox/types';
import { FreeSquishBody } from '../../src/sandbox/freeSquishBody';

test('free body cannot tunnel through the pedestal and returns without momentum', () => {
  const body = new FreeSquishBody();
  const points = [{x:90,y:90},{x:110,y:90},{x:110,y:110},{x:90,y:110}];
  const room = {left:0,right:400,top:0,bottom:400,pedestal:[{x:50,y:150},{x:150,y:150},{x:150,y:300},{x:50,y:300}]};
  body.begin(1,100,100,0); body.move(1,100,350,16);
  body.advance(16,points,room,'jelly',10,()=>{});
  expect(body.y).toBeLessThanOrEqual(40);
  body.end(1,16); body.returnHome();
  for(let i=0;i<50;i++)if(body.advance(16,points,room,'jelly',10,()=>{}))break;
  expect([body.x,body.y,body.vx,body.vy]).toEqual([0,0,0,0]);
  expect(body.returning).toBe(false);
});

for (const viewport of [{width:390,height:844},{width:1440,height:900},{width:568,height:320}])
test(`free carry, release, return and storage at ${viewport.width}`, async ({page}, info) => {
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

test('touch carry keeps a second stretch, attachments and cancellation coherent', async ({browser,baseURL},info) => {
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

test('saved Studio squeeze keeps its desk anchored when unpinned', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/squishy-squishes/');
  await page.evaluate(save=>localStorage.setItem('squishy.save.v3',JSON.stringify(save)),{...createDefaultSaveV3(),totalCrafts:1,library:[{...createSandboxDraft(),id:'studio',createdAt:1}]});
  await page.reload(); await page.locator('[data-library-play-id="studio"]').click();
  await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready','true');
  await page.locator('[data-action="edit-saved"]').click();
  await page.locator('[data-action="decor-continue"]').click(); await page.locator('[data-action="save"]').click();
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
      expect(body.x+90).toBeGreaterThanOrEqual(-.001);expect(body.x+110).toBeLessThanOrEqual(400.001);
      expect(body.y+90).toBeGreaterThanOrEqual(-.001);expect(body.y+110).toBeLessThanOrEqual(400.001);
    }
    body.cancel();expect([body.vx,body.vy,body.held]).toEqual([0,0,null]);
  }
  expect(rebound.pearl).toBeGreaterThan(rebound.jelly!);expect(rebound.jelly).toBeGreaterThan(rebound.holo!);
  expect(rebound.holo).toBeGreaterThan(rebound.soft!);expect(rebound.soft).toBeGreaterThan(rebound.chrome!);
  expect(rebound.chrome).toBeGreaterThan(rebound.marshmallow!);
});
