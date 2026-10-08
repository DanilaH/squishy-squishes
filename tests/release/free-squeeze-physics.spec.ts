// Browser free-flight cases are dormant while the owner-paused Unpin entry is absent.
import { expect, test } from '@playwright/test';
import { createDefaultSaveV3 } from '../../src/platform/saveV3';
import { createSandboxDraft } from '../../src/sandbox/types';

for (const viewport of [{width:390,height:844},{width:1440,height:900},{width:568,height:320}]) {
  test.skip(`room geometry stays fixed through Squeeze, Unpin and return at ${viewport.width}`, async ({page}) => {
    await page.setViewportSize(viewport);
    await page.goto('/squishy-squishes/?roomReview=1');
    await page.evaluate(save=>localStorage.setItem('squishy.save.v3',JSON.stringify(save)),{...createDefaultSaveV3(),totalCrafts:1,library:[{...createSandboxDraft(),id:'geometry',createdAt:1,shapeId:'mochi',materialId:'jelly'}]});
    await page.reload();
    const table=page.locator('.library-showcase-table');
    await expect(page.locator('[data-library-table-ready]')).toHaveAttribute('data-library-table-ready','true');
    const before=(await table.boundingBox())!;
    await page.locator('[data-library-select-id="geometry"]').click();
    const canvas=page.locator('[data-sandbox-canvas]');
    await expect(canvas).toHaveAttribute('data-phaser-ready','true');
    expect(await table.boundingBox()).toEqual(before);
    await page.locator('[data-action="free-squeeze"]').click();
    await expect.poll(async()=>Number(await canvas.getAttribute('data-free-floor-y'))).toBeCloseTo(before.y+before.height*.85,1);
    expect(await table.boundingBox()).toEqual(before);
    await page.waitForTimeout(700);
    const skin=JSON.parse((await canvas.getAttribute('data-free-skin-bounds'))!);
    expect(skin.bottom).toBeLessThanOrEqual(before.y+before.height*.85+1);
    await page.locator('[data-action="free-squeeze"]').click();
    await expect(page.locator('[data-sandbox-app]')).not.toHaveAttribute('data-free-squeeze','true');
    expect(await table.boundingBox()).toEqual(before);
  });
}

for(const material of ['jelly','chrome'] as const) test.skip(`real ${material} grab, spin, wall contact and decorated return`, async ({page},info)=>{
  await page.setViewportSize({width:900,height:760});
  await page.goto('/squishy-squishes/?roomReview=1');
  await page.evaluate(save=>localStorage.setItem('squishy.save.v3',JSON.stringify(save)),{...createDefaultSaveV3(),totalCrafts:1,library:[{...createSandboxDraft(),id:'spin',createdAt:1,shapeId:'mochi',materialId:material,decor:{v:1,eyes:'dot',mouth:'smile',blush:true,accessory:'bow',stickers:[]}}]});
  await page.reload();await page.locator('[data-library-select-id="spin"]').click();
  const canvas=page.locator('[data-sandbox-canvas]');await expect(canvas).toHaveAttribute('data-phaser-ready','true');
  const before=await page.evaluate(()=>localStorage.getItem('squishy.save.v3'));
  const box=(await canvas.boundingBox())!,home={x:box.x+box.width/2,y:box.y+box.height/2};
  await page.locator('[data-action="free-squeeze"]').click();
  // Pick up while still near home, lift, then swing from an off-center grip.
  await page.mouse.move(home.x+40,home.y);await page.mouse.down();
  await expect(canvas).toHaveAttribute('data-free-body-held','true');
  await page.mouse.move(440,230,{steps:16});await page.waitForTimeout(350);
  let spin=0,tension=0;
  for(let i=0;i<70;i++){
    const t=i*.14;
    await page.mouse.move(440+80*Math.cos(t),230+70*Math.sin(t));
    await page.waitForTimeout(16);
    spin=Math.max(spin,Math.abs(Number(await canvas.getAttribute('data-free-body-omega'))));
    tension=Math.max(tension,Number(await canvas.getAttribute('data-free-tension')));
  }
  expect(spin).toBeGreaterThan(.8);expect(tension).toBeGreaterThan(.1);
  await page.screenshot({path:info.outputPath(`${material}-spin.png`)});
  // Push against the right wall while held, then release into the room.
  await page.mouse.move(1150,230,{steps:15});await page.waitForTimeout(350);
  await expect.poll(async()=>Number(await canvas.getAttribute('data-free-contact'))).toBeGreaterThan(.1);
  const skin=JSON.parse((await canvas.getAttribute('data-free-skin-bounds'))!);
  expect(skin.right).toBeLessThanOrEqual(901);
  await page.screenshot({path:info.outputPath(`${material}-wall.png`)});
  await page.mouse.up();await page.waitForTimeout(1100);
  await page.screenshot({path:info.outputPath(`${material}-landed.png`)});
  await page.locator('[data-action="free-squeeze"]').click();
  await expect(page.locator('[data-sandbox-app]')).not.toHaveAttribute('data-free-squeeze','true');
  expect(await page.evaluate(()=>localStorage.getItem('squishy.save.v3'))).toBe(before);
});


test('exhibit preview stays present during the live canvas startup', async ({page}) => {
  await page.goto('/squishy-squishes/?roomReview=1');
  await page.evaluate(save=>localStorage.setItem('squishy.save.v3',JSON.stringify(save)),{...createDefaultSaveV3(),totalCrafts:1,library:[{...createSandboxDraft(),id:'handoff',createdAt:1}]});
  await page.reload();
  await expect(page.locator('[data-library-select-id="handoff"]')).toBeVisible();
  await page.evaluate(()=>{
    const host=document.querySelector('[data-library-display-host]')!;
    const observations: boolean[]=[];
    (window as Window & {handoffObservations?:boolean[]}).handoffObservations=observations;
    new MutationObserver(()=>{
      const canvas=host.querySelector<HTMLElement>('[data-sandbox-canvas]');
      if(canvas && canvas.dataset.phaserReady!=='true') observations.push(!!host.querySelector('[data-library-display]'));
    }).observe(host,{childList:true,subtree:true,attributes:true,attributeFilter:['data-phaser-ready']});
  });
  await page.locator('[data-library-select-id="handoff"]').click();
  await expect(page.locator('[data-phaser-ready]')).toHaveAttribute('data-phaser-ready','true');
  await expect(page.locator('[data-library-display]')).toHaveCount(0);
  const observations=await page.evaluate(()=>(window as Window & {handoffObservations?:boolean[]}).handoffObservations!);
  expect(observations.length).toBeGreaterThan(0);expect(observations.every(Boolean)).toBe(true);
});

test.skip('a spinning Jelly throw hits the wall and settles on the room floor', async ({page},info)=>{
  await page.setViewportSize({width:900,height:760});
  await page.goto('/squishy-squishes/?roomReview=1');
  await page.evaluate(save=>localStorage.setItem('squishy.save.v3',JSON.stringify(save)),{...createDefaultSaveV3(),totalCrafts:1,library:[{...createSandboxDraft(),id:'flight',createdAt:1,shapeId:'mochi',materialId:'jelly',decor:{v:1,eyes:'dot',mouth:'smile',blush:true,accessory:'bow',stickers:[]}}]});
  await page.reload();await page.locator('[data-library-select-id="flight"]').click();
  const canvas=page.locator('[data-sandbox-canvas]');await expect(canvas).toHaveAttribute('data-phaser-ready','true');
  const box=(await canvas.boundingBox())!,home={x:box.x+box.width/2,y:box.y+box.height/2};
  await page.locator('[data-action="free-squeeze"]').click();
  await page.mouse.move(home.x+45,home.y);await page.mouse.down();
  await expect(canvas).toHaveAttribute('data-free-body-held','true');
  await page.mouse.move(430,235,{steps:12});await page.waitForTimeout(250);
  for(let i=0;i<45;i++){
    const t=i*.18;await page.mouse.move(430+75*Math.cos(t),235+65*Math.sin(t));await page.waitForTimeout(16);
  }
  await page.mouse.move(600,215,{steps:3});await page.waitForTimeout(16);
  await page.mouse.move(780,205);await page.mouse.up();
  await expect(canvas).toHaveAttribute('data-free-body-held','false');
  await expect.poll(async()=>Number(await canvas.getAttribute('data-free-body-vx'))).toBeGreaterThan(150);
  const angle=Number(await canvas.getAttribute('data-free-body-angle'));
  await expect.poll(async()=>Math.abs(Number(await canvas.getAttribute('data-free-body-angle'))-angle)).toBeGreaterThan(.1);
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-free-skin-bounds'))!).right).toBeGreaterThan(887);
  await page.screenshot({path:info.outputPath('jelly-thrown-wall.png')});
  await page.waitForTimeout(2200);
  const floor=Number(await canvas.getAttribute('data-free-floor-y'));
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-free-skin-bounds'))!).bottom).toBeGreaterThan(floor-5);
  await page.screenshot({path:info.outputPath('jelly-floor.png')});
  await page.locator('[data-action="free-squeeze"]').click();
  await expect(page.locator('[data-sandbox-app]')).not.toHaveAttribute('data-free-squeeze','true');
});


test.skip('Jelly hangs from its caught surface and keeps the grip during a swing', async ({page},info)=>{
  await page.setViewportSize({width:900,height:760});
  await page.goto('/squishy-squishes/?roomReview=1');
  await page.evaluate(save=>localStorage.setItem('squishy.save.v3',JSON.stringify(save)),{...createDefaultSaveV3(),totalCrafts:1,library:[{...createSandboxDraft(),id:'hang',createdAt:1,shapeId:'mochi',materialId:'jelly',decor:{v:1,eyes:'dot',mouth:'smile',blush:true,accessory:'bow',stickers:[]}}]});
  await page.reload();await page.locator('[data-library-select-id="hang"]').click();
  const canvas=page.locator('[data-sandbox-canvas]');await expect(canvas).toHaveAttribute('data-phaser-ready','true');
  await page.locator('[data-action="free-squeeze"]').click();
  const skin=()=>canvas.getAttribute('data-free-skin-bounds').then(s=>JSON.parse(s!));
  const initial=await skin();
  await page.mouse.move((initial.left+initial.right)/2,initial.top+16);await page.mouse.down();
  await expect(canvas).toHaveAttribute('data-free-body-held','true');
  await page.mouse.move(450,200,{steps:20});await page.waitForTimeout(1400);
  const hanging=await skin();
  expect(hanging.bottom-hanging.top).toBeGreaterThan((initial.bottom-initial.top)*1.18);
  const grip=JSON.parse((await canvas.getAttribute('data-free-grip'))!);
  expect(Math.hypot(grip.x-450,grip.y-200)).toBeLessThan(15);
  await page.screenshot({path:info.outputPath('jelly-hanging.png')});
  for(let i=0;i<80;i++){
    const t=i*.12;await page.mouse.move(450+95*Math.sin(t),200+35*Math.cos(t));await page.waitForTimeout(25);
  }
  await page.screenshot({path:info.outputPath('jelly-loaded-swing.png')});
  let minAngle=Infinity,maxAngle=-Infinity;
  for(let i=0;i<55;i++){
    const t=i*.42;await page.mouse.move(450+100*Math.cos(t),290+85*Math.sin(t));await page.waitForTimeout(8);
    const angle=Number(await canvas.getAttribute('data-free-body-angle'));
    minAngle=Math.min(minAngle,angle);maxAngle=Math.max(maxAngle,angle);
  }
  expect(maxAngle-minAngle).toBeGreaterThan(2);
  await page.screenshot({path:info.outputPath('jelly-spin-stretch.png')});
  await page.mouse.move(650,190,{steps:4});await page.mouse.move(800,180);await page.mouse.up();
  await page.waitForTimeout(2000);
  await page.screenshot({path:info.outputPath('jelly-soft-landing.png')});
  await page.locator('[data-action="free-squeeze"]').click();
  await expect(page.locator('[data-sandbox-app]')).not.toHaveAttribute('data-free-squeeze','true');
});
