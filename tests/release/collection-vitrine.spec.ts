import { readCollection, createLegacySaveV3 as createDefaultSaveV3 } from '../collection';
import {expect,test} from '@playwright/test';

import {createSandboxDraft} from '../../src/sandbox/types';
import {ROOM_PALETTES} from '../../src/sandbox/roomPalettes';
import {createBodyFillStroke} from '../../src/sandbox/appearance';
const shapes=['paw','heart','donut','dumpling','strawberry','mochi-cat','cupcake','mochi-bunny','heart','donut'] as const;
for(const locale of ['ru-RU','en-US'])for(const viewport of [{width:320,height:568},{width:390,height:844},{width:568,height:320},{width:844,height:390},{width:1440,height:900}])test(`open collection, actions and capacity ${locale} ${viewport.width}`,async({browser,baseURL},info)=>{
 test.setTimeout(120000);const context=await browser.newContext({baseURL,locale,viewport,reducedMotion:'reduce'});const page=await context.newPage();
 try{
 for(const count of [0,1,4,7,8,10]){
  const save={...createDefaultSaveV3(),libraryCapacity:count===10?10:8,totalCrafts:count,library:shapes.slice(0,count).map((shapeId,i)=>({...createSandboxDraft(),shapeId,id:`vitrine-${i}`,createdAt:1700000000000+i,appearance:{v:1 as const,strokes:[createBodyFillStroke([0xffa6cb,0xcab0e8,0xa1e2ce,0xffcea8,0xeec984,0xe8e5f0,0xa9d4ef,0xffa6cb][i%8]!)],mixins:[]},decor:{...createSandboxDraft().decor,eyes:'dot' as const,mouth:'smile' as const}}))};
  await page.goto('/squishy-squishes/?roomReview=0');await page.evaluate(save=>{(localStorage.removeItem('squishy.collection.v1'), localStorage.setItem('squishy.save.v3',JSON.stringify(save)));localStorage.setItem('squishy.room.v1',JSON.stringify({version:1,palette:0,items:{left:'dresser',wall:'picture',rug:'rug-oval'}}));},save);
  await page.goto('/squishy-squishes/');await expect(page.locator('[data-room-view]')).toHaveAttribute('data-room-view','room');await page.locator('[data-room-collection]').click();await page.evaluate(()=>document.fonts.ready);
  await expect(page.locator('.sandbox-library-card')).toHaveCount(count);await expect(page.locator('.library-showcase-slot')).toHaveCount(count>=save.libraryCapacity?0:1);await expect(page.locator('[data-room-manage]')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await page.locator('.sandbox-library-grid').evaluate(n=>n.scrollWidth<=n.clientWidth+1)).toBe(true);
  expect(await page.locator('.library-showcase-collection').evaluate(n=>getComputedStyle(n).borderTopWidth)).toBe('0px');
  if(count===8){await expect(page.locator('.sandbox-library-heading [data-library-expand-reward]')).toBeVisible();}else await expect(page.locator('.sandbox-library-heading [data-library-expand-reward]')).toHaveCount(0);
  const create=count>=save.libraryCapacity?page.locator('.sandbox-library-heading [data-library-new]'):page.locator('.library-showcase-slot');await create.scrollIntoViewIfNeeded();
  expect(await create.evaluate(n=>{const r=n.getBoundingClientRect();return r.height>=44&&r.width>=44&&n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);
  if(count){const more=page.locator('[data-library-actions-id="vitrine-0"]');await more.scrollIntoViewIfNeeded();await more.click();await expect(page.locator('[data-library-actions-overlay]')).toBeVisible();for(const control of await page.locator('.toy-actions-sheet button').all()){expect(await control.evaluate(n=>{const r=n.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);}await page.keyboard.press('Escape');await expect(more).toBeFocused();await more.click();await page.locator('[data-library-delete-id="vitrine-0"]').click();await expect(page.locator('[data-library-delete-overlay]')).toBeVisible();await page.locator('[data-library-delete-cancel]').click();await expect(more).toBeFocused();expect(await page.evaluate((__collection) => (__collection.library.length), await readCollection(page))).toBe(count);}
  await page.locator('.sandbox-library-grid').evaluate(n=>n.scrollTop=0);await page.screenshot({path:info.outputPath(`collection-${count}.png`)});
 }
 await page.locator('[data-library-actions-id="vitrine-0"]').click();await page.locator('[data-library-edit-id="vitrine-0"]').click();await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage','decor');await page.locator('[data-action="save"]').click();expect(await page.evaluate((__collection) => (__collection.library.length), await readCollection(page))).toBe(10);await page.locator('[data-action="home"]').click();await expect(page.locator('[data-room-view]')).toHaveAttribute('data-room-view','collection');
 await page.locator('[data-library-actions-id="vitrine-0"]').click();await page.locator('[data-library-delete-id="vitrine-0"]').click();await page.locator('[data-library-delete-confirm]').click();await expect(page.locator('.sandbox-library-card')).toHaveCount(9);
 }finally{await context.close();}
});

test('open shelf labels remain legible through every room palette',async({page},info)=>{
 test.setTimeout(90000);await page.setViewportSize({width:390,height:844});await page.goto('/squishy-squishes/?roomReview=0');
 await page.evaluate(save=>(localStorage.removeItem('squishy.collection.v1'), localStorage.setItem('squishy.save.v3',JSON.stringify(save))),{...createDefaultSaveV3(),library:[{...createSandboxDraft(),id:'palette-toy',createdAt:0}]});
 for(let palette=0;palette<ROOM_PALETTES.length;palette++){
  await page.evaluate(palette=>localStorage.setItem('squishy.room.v1',JSON.stringify({version:1,palette,items:{}})),palette);await page.goto('/squishy-squishes/');await page.locator('[data-room-collection]').click();
  const contrast=await page.locator('.sandbox-library-card__footer strong').evaluate((n,theme)=>{
   const rgb=(s:string)=>s.match(/[\d.]+/g)!.map(Number),hex=(s:string)=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
   const lum=(c:number[])=>c.map(v=>{const x=v/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i]!,0);
   const style=getComputedStyle(n),fg=lum(rgb(style.color)),bg=rgb(style.backgroundColor),alpha=bg[3]??1;
   return Math.min(...[theme.wall,theme.floor].map(c=>{const under=hex(c),l=lum(bg.slice(0,3).map((v,i)=>v*alpha+under[i]!*(1-alpha)));return (Math.max(fg,l)+.05)/(Math.min(fg,l)+.05);}));
  },ROOM_PALETTES[palette]!);expect(contrast).toBeGreaterThanOrEqual(4.5);
  expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(ROOM_PALETTES[palette]!.en==='Evening blue')await page.screenshot({path:info.outputPath('collection-evening.png')});
 }
});
