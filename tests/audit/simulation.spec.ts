import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {SHAPES,isPointInsideShape} from '../../src/game/shapes';
import {SquishSimulation} from '../../src/squish/SquishSimulation';
test('AUDIT-12 deterministic stress of 18 shapes × 6 materials, large drags, jittered frames and cancellation',async({},info)=>{
 const results=[];let seed=20261020;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(const shape of SHAPES)for(const material of ['soft','jelly','marshmallow','pearl','holo','chrome'] as const){
  const sim=new SquishSimulation(shape);sim.setTactileFeatures(true,material);let point={x:0,y:0};while(!isPointInsideShape(shape,point.x,point.y))point={x:random()*1.4-.7,y:random()*1.4-.7};expect(sim.begin(1,point.x,point.y)).toBe(true);let time=0,max=0;
  for(let frame=0;frame<200;frame++){sim.move(1,(random()-.5)*12,(random()-.5)*12);const delta=[8,16,33,100,250][frame%5]!;time+=delta;sim.advance(delta,time);const sample=sim.snapshot();max=Math.max(max,sample.maxDisplacement);expect(Number.isFinite(sample.maxDisplacement),shape.id+material).toBe(true);expect(sim.vertices.every(v=>Number.isFinite(v.x+v.y+v.vx+v.vy))).toBe(true);}
  const count=sim.snapshot().squeezes;sim.cancel();expect(sim.snapshot().squeezes).toBe(count);for(let f=0;f<800;f++){time+=16;sim.advance(16,time);}const after=sim.snapshot();expect.soft(after.pointers).toBe(0);expect.soft(after.maxDisplacement,shape.id+material).toBeLessThan(.01);results.push({shape:shape.id,material,max,after:after.maxDisplacement});
 }
 await writeFile(info.outputPath('simulation-matrix.json'),JSON.stringify(results,null,2));
});
