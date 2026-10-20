import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {createDefaultSaveV3,encodeSaveStateV3} from '../../src/platform/saveV3';
import {createSandboxDraft} from '../../src/sandbox/types';
// Diagnostic comparison, not a real-phone performance gate. Both modes use
// the same isolated machine; fallback disables only offscreen WebGL snapshots.
test('AUDIT-18 measure Ideas first-paint with software WebGL and Canvas2D fallback',async({browser,baseURL},info)=>{
 test.setTimeout(180000);const results=[];
 for(const mode of ['webgl','fallback']){
  const context=await browser.newContext({baseURL,viewport:{width:1440,height:900},locale:'ru-RU',hasTouch:true}),page=await context.newPage();try{
   await page.addInitScript(({mode,state})=>{
    localStorage.setItem('squishy.save.v3',JSON.stringify(state));
    if(mode==='fallback'){const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(...args:any[]){if(args[0]==='webgl2')return null;return (get as any).apply(this,args); } as any;}
    const meter={start:0,firstPaintMs:0,longTasks:[] as {at:number,duration:number}[]};(window as any).auditIdeas=meter;
    new PerformanceObserver(list=>{for(const e of list.getEntries())if(meter.start&&e.startTime+e.duration>=meter.start)meter.longTasks.push({at:e.startTime,duration:e.duration});}).observe({entryTypes:['longtask']});
    document.addEventListener('click',e=>{if((e.target as Element)?.closest('[data-library-ideas]')){meter.start=performance.now();requestAnimationFrame(()=>requestAnimationFrame(()=>meter.firstPaintMs=performance.now()-meter.start));}},{capture:true});
   },{mode,state:encodeSaveStateV3({...createDefaultSaveV3(),legacyCatalogAccess:true,libraryCapacity:8,library:Array.from({length:8},(_,i)=>({...createSandboxDraft(),id:`kept-${i}`,shapeId:i%2?'heart':'paw',createdAt:1})),totalCrafts:8})});
   await page.goto('/squishy-squishes/');await page.locator('[data-room-collection]').click();await page.locator('[data-library-actions-id="kept-0"]').click();await page.locator('[data-library-delete-id="kept-0"]').click();await page.keyboard.press('Escape');await page.locator('[data-room-back]').click();
   await page.locator('[data-library-ideas]').click({timeout:60000});await expect(page.locator('[data-sandbox-ideas]')).toBeVisible();await expect.poll(()=>page.evaluate(()=>(window as any).auditIdeas.firstPaintMs)).toBeGreaterThan(0);
   const timing=await page.evaluate(()=>(window as any).auditIdeas);const renderers=await page.locator('[data-idea-preview]').evaluateAll(nodes=>nodes.map(n=>(n as HTMLElement).dataset.libraryRenderer));results.push({mode,...timing,renderers});await page.screenshot({path:info.outputPath(`ideas-${mode}.png`)});
  }finally{await context.close();}
 }
 await writeFile(info.outputPath('ideas-timing.json'),JSON.stringify(results,null,2));
});
