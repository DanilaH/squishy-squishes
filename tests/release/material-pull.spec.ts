import { expect, test } from '@playwright/test';
import { SHAPES, getShape } from '../../src/game/shapes';
import { SquishSimulation } from '../../src/squish/SquishSimulation';
import { uncontainClipAxis, uncontainGestureAxis } from '../../src/squish/projection';
import { createDefaultSaveV3 } from '../../src/platform/saveV3';
import { createEmptyDecorDocument } from '../../src/sandbox/decor';

const pull = (material: 'soft' | 'jelly' | 'chrome', distance: number) => {
  const sim = new SquishSimulation(getShape('mochi')); sim.setTactileFeatures(true, material); sim.setViewportFollowEnabled(true);
  sim.begin(1, .55, 0);
  for (let f = 1; f <= 80; f++) { sim.move(1, .55 + distance, .12); sim.advance(16, f * 16); }
  return sim;
};

test('captured viewport travel remains continuous and finite beyond every canvas edge', () => {
  for (const sign of [-1, 1]) {
    expect(uncontainGestureAxis(sign * .92)).toBeCloseTo(uncontainClipAxis(sign * .92), 8);
    expect(uncontainGestureAxis(sign * (.92 + .00001)) - uncontainGestureAxis(sign * .92)).toBeCloseTo(sign * .00004, 8);
    expect(Number.isFinite(uncontainGestureAxis(sign * 20))).toBe(true);
    expect(uncontainGestureAxis(sign * 2) * sign).toBeGreaterThan(uncontainGestureAxis(sign) * sign);
  }
});

test('Jelly extends progressively after the old stop, while Metallic resists and returns', () => {
  const values = [1, 2, 4].map(distance => pull('jelly', distance).projectUvToLocal(.775, .5).x);
  expect(values[1]! - values[0]!).toBeGreaterThan(.25);
  expect(values[2]! - values[1]!).toBeGreaterThan(.2);
  const metal = pull('chrome', 4), soft = pull('soft', 4), jelly = pull('jelly', 4);
  expect(metal.snapshot().maxDisplacement).toBeLessThan(.31);
  expect(metal.snapshot().maxDisplacement).toBeLessThan(soft.snapshot().maxDisplacement * .65);
  expect(jelly.snapshot().maxDisplacement).toBeGreaterThan(soft.snapshot().maxDisplacement * 1.8);
  for (const sim of [metal, soft, jelly]) {
    sim.end(1); for (let f = 81; f <= 700; f++) sim.advance(16, f * 16);
    expect(sim.snapshot().maxDisplacement).toBeLessThan(.002);
    expect(sim.snapshot().squeezes).toBe(1);
  }
});

for (const shape of SHAPES) test(`long Jelly pull and returning regrab remain ordered: ${shape.id}`, () => {
  const sim = new SquishSimulation(shape); sim.setTactileFeatures(true, 'jelly'); sim.setViewportFollowEnabled(true);
  const edge = shape.boundary.reduce((a,b) => b.x > a.x ? b : a), anchor = { x: edge.x * .75, y: edge.y * .75 };
  const u = anchor.x * .5 + .5, v = anchor.y * .5 + .5;
  expect(sim.begin(1, anchor.x, anchor.y)).toBe(true);
  for (let f = 1; f <= 100; f++) { sim.move(1, anchor.x + 3, anchor.y + .2); sim.advance(16, f * 16); }
  expect(sim.projectUvToLocal(u, v).x - anchor.x).toBeGreaterThan(1);
  sim.end(1); sim.advance(16, 1616);
  const point = sim.projectUvToLocal(u, v);
  expect(sim.begin(2, point.x, point.y)).toBe(true);
  const before = sim.projectUvToLocal(u, v);
  sim.move(2, point.x + .15, point.y); sim.advance(16, 1632);
  expect(Math.abs(sim.projectUvToLocal(u, v).x - before.x)).toBeLessThan(.15);
  for (let f = 103; f <= 140; f++) { sim.move(2, f % 8 < 4 ? -4 : 4, -.3); sim.advance(16, f * 16); }
  for (let i = 0; i < sim.triangleIndices.length; i += 3) {
    const a = sim.vertices[sim.triangleIndices[i]!]!, b = sim.vertices[sim.triangleIndices[i+1]!]!, c = sim.vertices[sim.triangleIndices[i+2]!]!;
    expect((b.y-a.y)*(c.x-a.x)-(b.x-a.x)*(c.y-a.y)).toBeGreaterThan(.002);
  }
  sim.cancel(); expect(sim.snapshot().squeezes).toBe(1);
});

for (const [width, height, stage, touch] of [[390,844,'squeeze',false], [1440,900,'preview',false], [568,320,'squeeze',true]] as const)
test(`captured Jelly follows outside the canvas and releases cleanly ${stage} ${width} touch=${touch}`, async ({browser, baseURL}, info) => {
  const context = await browser.newContext({baseURL, viewport:{width,height}, hasTouch:touch, reducedMotion:'reduce'});
  const page = await context.newPage();
  try {
    await page.goto('/squishy-squishes/?roomReview=0');
    await page.evaluate(save => localStorage.setItem('squishy.save.v3', JSON.stringify(save)), {
      ...createDefaultSaveV3(), totalCrafts:1, library:[{id:'long',createdAt:1,shapeId:'mochi',materialId:'jelly',appearance:{v:1,strokes:[],mixins:[]},decor:{...createEmptyDecorDocument(),eyes:'dot',mouth:'smile',blush:true}}]
    });
    await page.reload(); await page.locator('[data-library-play-id="long"]').click();
    const canvas=page.locator('[data-sandbox-canvas]'), shell=page.locator('[data-sandbox-app]');
    await expect(canvas).toHaveAttribute('data-phaser-ready','true');
    if(stage==='preview'){await page.locator('[data-action="edit-saved"]').click();await page.locator('[data-craft-section="shape"]').click(); await page.locator('[data-base-tab="material"]').click(); await page.locator('[data-action="try-on"]').click();}
    const before=await page.evaluate(()=>localStorage.getItem('squishy.save.v3'));
    const box=(await canvas.boundingBox())!, radius=await canvas.evaluate(el=>el.clientWidth*parseFloat(getComputedStyle(el).getPropertyValue('--squish-radius-ratio')));
    const start={x:box.x+box.width/2+radius*.5,y:box.y+box.height/2};
    const far={x:width-8,y:Math.max(12,Math.min(height-12,start.y))};
    const cdp=await context.newCDPSession(page);
    const move=async(p:{x:number;y:number})=>{if(touch)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...p,id:1}]});else await page.mouse.move(p.x,p.y,{steps:8});};
    await canvas.evaluate(el=>el.addEventListener('pointerdown',event=>{(el as HTMLElement).dataset.testPointer=String((event as PointerEvent).pointerId);},{once:true}));
    if(touch)await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...start,id:1}]});else{await page.mouse.move(start.x,start.y);await page.mouse.down();}
    await expect(shell).toHaveAttribute('data-squish-active','true');
    if(!touch)expect(await canvas.evaluate(el=>el.hasPointerCapture(Number((el as HTMLElement).dataset.testPointer)))).toBe(true);
    await move({x:start.x+radius*.35,y:start.y});
    await expect.poll(async()=>Number(await shell.getAttribute('data-squish-max-displacement'))).toBeGreaterThan(.15);
    await move(far);
    await expect(shell).toHaveAttribute('data-squish-active','true');
    await expect.poll(async()=>Number(await shell.getAttribute('data-squish-max-displacement'))).toBeGreaterThan(Math.min(.85, (far.x-start.x)/radius*.4));
    await page.screenshot({path:info.outputPath('long-jelly.png')});
    // Outside movement changes direction too, rather than freezing at the edge.
    await move({x:start.x+radius*.5,y:12});
    await expect.poll(async()=>Number(await shell.getAttribute('data-gesture-y'))).toBeGreaterThan(.25);
    await expect.poll(async()=>Number(await shell.getAttribute('data-squish-max-displacement'))).toBeGreaterThan(.85);
    await page.screenshot({path:info.outputPath('outside-upward.png')});
    if(touch)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await page.mouse.up();
    await expect(shell).toHaveAttribute('data-squish-active','false');
    await expect(shell).toHaveAttribute('data-sandbox-squeezes','1');
    await expect.poll(async()=>Number(await shell.getAttribute('data-squish-max-displacement')), {timeout:12000}).toBeLessThan(.025);
    expect(await page.evaluate(()=>localStorage.getItem('squishy.save.v3'))).toBe(before);
    // An interrupted outside gesture returns without crediting a release.
    if(touch)await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...start,id:1}]});else{await page.mouse.move(start.x,start.y);await page.mouse.down();}
    await expect(shell).toHaveAttribute('data-squish-active','true');
    await move(far);
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
    await expect(shell).toHaveAttribute('data-squish-active','false');
    if(touch)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await page.mouse.up();
    await expect(shell).toHaveAttribute('data-sandbox-squeezes','1');
    const mute=page.locator(stage==='squeeze'?'[data-library-mute]':'[data-action="mute"]'), previous=await mute.getAttribute('aria-pressed');
    await mute.click(); await expect(mute).toHaveAttribute('aria-pressed',previous==='true'?'false':'true');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);
  } finally {await context.close();}
});
