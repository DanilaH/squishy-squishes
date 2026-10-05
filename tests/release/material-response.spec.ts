import { expect, test } from '@playwright/test';
import type { MaterialId } from '../../src/game/content';
import { SHAPES, getShape } from '../../src/game/shapes';
import { SquishSimulation } from '../../src/squish/SquishSimulation';
import { createDefaultSaveV3 } from '../../src/platform/saveV3';
import { createEmptyDecorDocument } from '../../src/sandbox/decor';

const materials: MaterialId[] = ['soft', 'jelly', 'marshmallow', 'pearl', 'holo', 'chrome'];
const pressure = (material: MaterialId, frames: number) => {
  const sim = new SquishSimulation(getShape('mochi')); sim.setTactileFeatures(true, material);
  sim.begin(1, .45, 0);
  for (let f = 1; f <= frames; f++) sim.advance(16, f * 16);
  return sim;
};

test('six material responses remain distinguishable through press, pull and recovery', () => {
  const signatures = [];
  const dents = materials.map(material => pressure(material, 100).projectUvToLocal(.675, .5).x - .35);
  for (const material of materials) {
    const sim = pressure(material, 100);
    const signature = [sim.snapshot().maxDisplacement];
    for (let f = 101; f <= 160; f++) { sim.move(1, 1.2, .12); sim.advance(16, f * 16); }
    signature.push(sim.projectUvToLocal(.725, .5).x);
    sim.end(1);
    for (let f = 161; f <= 175; f++) sim.advance(16, f * 16);
    signature.push(sim.snapshot().maxDisplacement);
    signatures.push(signature.map(v => v.toFixed(4)).join(':'));
    for (let f = 176; f <= 1000; f++) sim.advance(16, f * 16);
    expect(sim.snapshot().maxDisplacement).toBeLessThan(.002);
    expect(sim.snapshot().squeezes).toBe(1);
  }
  expect(new Set(signatures).size).toBe(6);
  expect(dents[2]).toBeGreaterThan(dents[0]! * 1.5);
  expect(dents[5]).toBeLessThan(dents[0]! * .6);
});

test('holding relaxes Soft and deepens foam; long foam hold has a longer temporary imprint', () => {
  for (const material of ['soft', 'marshmallow'] as const) {
    const short = pressure(material, 20), long = pressure(material, 100);
    expect(long.projectUvToLocal(.675, .5).x).toBeGreaterThan(short.projectUvToLocal(.675, .5).x);
    if (material === 'marshmallow') {
      short.end(1); long.end(1);
      for (let f = 1; f <= 60; f++) { short.advance(16, (20+f)*16); long.advance(16, (100+f)*16); }
      expect(long.snapshot().maxDisplacement).toBeGreaterThan(short.snapshot().maxDisplacement * 1.5);
      long.cancel(); expect(long.snapshot().squeezes).toBe(1);
      for (let f = 161; f <= 1000; f++) long.advance(16, f*16);
      expect(long.snapshot().maxDisplacement).toBeLessThan(.002);
    }
  }
});

test('foam keeps an imprint, Pearl rebounds and Holo becomes taut after its free pull', () => {
  const soft = pressure('soft', 100), foam = pressure('marshmallow', 100), pearl = pressure('pearl', 100);
  expect(foam.projectUvToLocal(.7, .5).x - .4).toBeGreaterThan((soft.projectUvToLocal(.7, .5).x - .4) * 3);
  soft.end(1); foam.end(1); pearl.end(1);
  let pearlOvershoot = 0;
  for (let f = 1; f <= 60; f++) {
    for (const sim of [soft, foam, pearl]) sim.advance(16, (100 + f) * 16);
    if (f > 15) pearlOvershoot = Math.max(pearlOvershoot, pearl.projectUvToLocal(.675, .5).x - .35);
  }
  expect(foam.projectUvToLocal(.675, .5).x - .35).toBeGreaterThan(.02);
  expect(Math.abs(soft.projectUvToLocal(.675, .5).x - .35)).toBeLessThan(.001);
  expect(pearlOvershoot).toBeGreaterThan(.002);
  expect(pearl.snapshot().maxDisplacement).toBeLessThan(.004);

  const pull = (distance: number) => {
    const sim = pressure('holo', 1); sim.move(1, .45 + distance, 0);
    for (let f = 2; f <= 100; f++) sim.advance(16, f * 16);
    return sim.projectUvToLocal(.725, .5).x;
  };
  const freeGain = (pull(.35) - pull(.15)) / .2;
  const tautGain = (pull(1.2) - pull(.6)) / .6;
  expect(freeGain).toBeGreaterThan(.5);
  expect(tautGain).toBeLessThan(freeGain * .1);

  const squeeze = (material: MaterialId) => {
    const sim = new SquishSimulation(getShape('mochi')); sim.setTactileFeatures(true, material);
    sim.begin(1, -.25, 0); sim.begin(2, .25, 0); sim.move(1, -.05, 0); sim.move(2, .05, 0);
    for (let f = 1; f <= 100; f++) sim.advance(16, f * 16);
    return sim.projectUvToLocal(.5, .8).y - .6;
  };
  expect(squeeze('pearl')).toBeGreaterThan(squeeze('holo') * 1.5);
  expect(squeeze('chrome')).toBeLessThan(squeeze('pearl') * .25);
  const metal = pressure('chrome', 100);
  expect(metal.projectUvToLocal(.7, .5).x - .4).toBeGreaterThan(.002);
});

test('foam memory fades in wall time and permits the first idle blink on slow frames', () => {
  for (const delta of [16, 33, 50, 66, 100]) {
    const sim = new SquishSimulation(getShape('dumpling'));
    sim.setTactileFeatures(true, 'marshmallow'); sim.setViewportFollowEnabled(true);
    sim.begin(1, 0, 0); let now = 0;
    for (let f = 0; f < 30; f++) {
      sim.move(1, .18 * f / 30, 0); now += 32; sim.advance(32, now);
    }
    sim.end(1);
    for (let f = 0; f < Math.ceil(5000 / delta); f++) {
      now += delta; sim.advance(delta, now);
    }
    expect(sim.snapshot().maxDisplacement).toBeLessThan(.025);
    expect(sim.snapshot().squeezes).toBe(1);
  }
});

for (const shape of SHAPES) test(`every material survives reversals, pinch handoff and interruption: ${shape.id}`, () => {
  for (const material of materials) {
    const sim = new SquishSimulation(shape); sim.setTactileFeatures(true, material); sim.setViewportFollowEnabled(true);
    expect(sim.begin(1, -.2, 0)).toBe(true); expect(sim.begin(2, .2, 0)).toBe(true);
    for (let f = 1; f <= 65; f++) {
      const gap = f % 16 < 8 ? .7 : .06;
      sim.move(1, -gap, .1); sim.move(2, gap, -.1); sim.advance(16, f*16);
    }
    sim.end(1); expect(sim.snapshot().pointers).toBe(1); expect(sim.snapshot().squeezes).toBe(0);
    for (let f = 66; f <= 100; f++) { sim.move(2, f % 12 < 6 ? 4 : -4, .4); sim.advance(16, f*16); }
    for (let i=0; i<sim.triangleIndices.length; i+=3) {
      const a=sim.vertices[sim.triangleIndices[i]!]!, b=sim.vertices[sim.triangleIndices[i+1]!]!, c=sim.vertices[sim.triangleIndices[i+2]!]!;
      expect((b.y-a.y)*(c.x-a.x)-(b.x-a.x)*(c.y-a.y)).toBeGreaterThan(.002);
    }
    sim.cancel(); expect(sim.snapshot().pointers).toBe(0); expect(sim.snapshot().squeezes).toBe(0);
    for (let f=101; f<=1000; f++) sim.advance(16,f*16);
    expect(sim.snapshot().maxDisplacement).toBeLessThan(.002);
  }
});

test('all six saved materials share tactile preview in Finish and Squeeze', async ({page}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({width:390,height:844}); await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/squishy-squishes/');
  for (const material of materials) {
    const save={...createDefaultSaveV3(),totalCrafts:1,library:[{id:'material',createdAt:1,shapeId:'mochi',materialId:material,appearance:{v:1,strokes:[],mixins:[]},decor:createEmptyDecorDocument()}]};
    await page.evaluate(value=>localStorage.setItem('squishy.save.v3',JSON.stringify(value)),save);
    await page.reload(); await page.locator('[data-library-play-id="material"]').click();
    const canvas=page.locator('[data-sandbox-canvas]'),shell=page.locator('[data-sandbox-app]');
    await expect(canvas).toHaveAttribute('data-phaser-ready','true');
    const before=await page.evaluate(()=>localStorage.getItem('squishy.save.v3'));
    for (const stage of ['squeeze','finish']) {
      if(stage==='finish'){await page.locator('[data-action="edit-saved"]').click();await page.locator('[data-action="decor-continue"]').click();}
      await expect(shell).toHaveAttribute('data-stage',stage); await expect(shell).toHaveAttribute('data-material',material);
      const r=(await canvas.boundingBox())!, radius=await canvas.evaluate(el=>el.clientWidth*parseFloat(getComputedStyle(el).getPropertyValue('--squish-radius-ratio')));
      const x=r.x+r.width/2+radius*.45,y=r.y+r.height/2;
      await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+radius*.45,y-radius*.1,{steps:8});
      await expect(shell).toHaveAttribute('data-squish-active','true');
      await expect.poll(async()=>Number(await shell.getAttribute('data-squish-max-displacement'))).toBeGreaterThan(.025);
      await page.mouse.up();await expect(shell).toHaveAttribute('data-squish-active','false');
    }
    expect(await page.evaluate(()=>localStorage.getItem('squishy.save.v3'))).toBe(before);
  }
});
