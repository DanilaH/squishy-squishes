import { expect, test } from '@playwright/test';
import { createDefaultSaveV3, decodeSaveStateV3, encodeSaveStateV3 } from '../../src/platform/saveV3';
import { createSandboxDraft } from '../../src/sandbox/types';
import { ACCESSORY_IDS, EYE_STYLE_IDS, MOUTH_STYLE_IDS, STICKER_IDS, createStickerPlacement, encodeDecorDocument } from '../../src/sandbox/decor';
import { createPaintPattern, PAINT_PATTERNS } from '../../src/sandbox/paintPatterns';

test('expanded V3 content round-trips without moving original sticker codes', () => {
  expect(STICKER_IDS.slice(0,4)).toEqual(['heart','star','flower','sparkle']);
  const draft=createSandboxDraft();
  const old={...draft.decor,eyes:'dot' as const,mouth:'smile' as const,accessory:'bow' as const,stickers:[{t:3,x:128,y:128,s:28,r:0}]};
  expect(encodeDecorDocument(old)).toEqual({v:1,e:'dot',m:'smile',s:[[3,128,128,28,0]],a:'bow'});
  for(const eyes of EYE_STYLE_IDS)for(const mouth of MOUTH_STYLE_IDS)for(const pattern of PAINT_PATTERNS){
    const toy={...draft,id:'expanded',createdAt:1700000000000,
      appearance:{...draft.appearance,strokes:createPaintPattern(pattern.id,0x875ca6)},
      decor:{...draft.decor,eyes,mouth,accessory:null,accessories:ACCESSORY_IDS.map(a=>({a,x:128,y:160,s:1,r:0,side:'whole' as const})),stickers:STICKER_IDS.map((id,i)=>createStickerPlacement(id,{u:.3,v:.3},i))}};
    const save={...createDefaultSaveV3(),library:[toy],totalCrafts:1};
    expect(decodeSaveStateV3(encodeSaveStateV3(save))).toEqual(save);
  }
});

const accessories=['antennae','mushroom-hat','witch-hat','halo','eye-patch','bolt'] as const;
const eyes=['angry','sly','cross','sparkling'] as const;
const mouths=['tongue','fangs','flat','sewn'] as const;
let variant=0;
for(const locale of ['ru-RU','en-US'])for(const viewport of [{width:320,height:568},{width:568,height:320},{width:1440,height:900}]) {
  const index=variant++;
  test(`expanded customization ${locale} ${viewport.width}`,async({browser,baseURL},info)=>{
    test.setTimeout(90000);
    const context=await browser.newContext({baseURL,locale,viewport,reducedMotion:'reduce'});
    const page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    try{
      await page.goto('/squishy-squishes/');
      const draft=createSandboxDraft();const toy={...draft,id:'expanded',createdAt:1700000000000,shapeId:index===4?'donut' as const:index===5?'heart' as const:'mochi' as const,
        decor:{...draft.decor,eyes:'dot' as const,mouth:'smile' as const,stickers:STICKER_IDS.map((id,i)=>({...createStickerPlacement(id,{u:.28+(i%4)*.145,v:.28+Math.floor(i/4)*.14},i),r:0,s:24}))}};
      await page.evaluate(save=>localStorage.setItem('squishy.save.v3',JSON.stringify(save)),{...createDefaultSaveV3(),library:[toy],totalCrafts:1});
      await page.reload();await page.locator('[data-library-select-id]').click();await page.locator('[data-action="edit-saved"]').click();
      await expect(page.locator('[data-accessory-icon]')).toHaveCount(22);
      await expect(page.locator('[data-decor-sticker]')).toHaveCount(13);
      // Each new icon must contain ink and have a distinct image, rather than fallback art.
      const hashes=await page.locator('[data-sticker-icon]').evaluateAll(nodes=>nodes.map(node=>{
        const c=node as HTMLCanvasElement,data=c.getContext('2d')!.getImageData(0,0,c.width,c.height).data;
        let hash=2166136261,ink=0;for(let i=0;i<data.length;i++){hash=Math.imul(hash^data[i]!,16777619);if(i%4===3&&data[i])ink++;}return {hash,ink};
      }));
      expect(hashes.every(h=>h.ink>40)).toBe(true);expect(new Set(hashes.map(h=>h.hash)).size).toBe(13);
      await page.locator('button[data-decor-section="face"]').click();await page.locator(`button[data-decor-eyes="${eyes[index%4]}"]`).click();await page.locator(`button[data-decor-mouth="${mouths[index%4]}"]`).click();
      await page.screenshot({path:info.outputPath('face-catalog.png')});
      await page.locator('button[data-decor-section="accessory"]').click();await page.locator(`button[data-decor-accessory="${accessories[index]}"]`).click();
      const accessoryFrame=page.locator('[data-accessory-selection="0"]');await expect(accessoryFrame).toBeVisible();
      if(accessories[index]==='eye-patch') {
        const patchDepth=await page.locator('[data-accessory-id="eye-patch"]').evaluate(n=>Number(getComputedStyle(n).zIndex));
        const faceDepth=await page.locator('.free-face-foreground').evaluate(n=>Number(getComputedStyle(n).zIndex));
        expect(patchDepth).toBeGreaterThan(faceDepth);
      }
      await page.locator('[data-object-control="rotation"]').fill('15');
      const scale=page.locator('[data-object-control="scale"]');await scale.fill(String(Number((Number(await scale.inputValue())*1.1).toFixed(2))));
      await page.locator('[data-object="sticker:12"]').click();await expect(page.locator('[data-object="sticker:12"]')).toHaveText(locale==='ru-RU'?'Призрак · 13':'Ghost · 13');
      await expect(page.locator('[data-sticker-selection="12"]')).toBeVisible();
      await page.locator('[data-craft-section="paint"]').click();
      const shell=page.locator('[data-sandbox-app]');
      for(const pattern of PAINT_PATTERNS){
        await page.locator('[data-action="paint-settings"]').click();await page.locator(`[data-paint-pattern="${pattern.id}"]`).click();
        await expect(shell).not.toHaveAttribute('data-paint-strokes','0');const count=await shell.getAttribute('data-paint-strokes');
        if(index===0)await page.screenshot({path:info.outputPath(`pattern-${pattern.id}.png`)});
        await page.locator('.craft-actions [data-action="draft-undo"]').click();await expect(shell).toHaveAttribute('data-paint-strokes','0');
        await page.locator('[data-action="draft-redo"]:visible').click();await expect(shell).toHaveAttribute('data-paint-strokes',count!);
        if(pattern.id!=='seams')await page.locator('.craft-actions [data-action="draft-undo"]').click();
      }
      await page.locator('[data-action="save"]').click();await expect(shell).toHaveAttribute('data-stage','squeeze');
      const save=decodeSaveStateV3(await page.evaluate(()=>JSON.parse(localStorage.getItem('squishy.save.v3')!)));
      expect(save.library[0]!.decor.eyes).toBe(eyes[index%4]);expect(save.library[0]!.decor.mouth).toBe(mouths[index%4]);
      expect(save.library[0]!.decor.accessories?.[0]?.a).toBe(accessories[index]);expect(save.library[0]!.decor.stickers.map(s=>s.t)).toEqual(STICKER_IDS.map((_,i)=>i));
      await page.screenshot({path:info.outputPath('expanded-squishy.png')});
      await page.locator('[data-action="home"]').click();await page.reload();await page.locator('[data-library-select-id]').click();
      expect(decodeSaveStateV3(await page.evaluate(()=>JSON.parse(localStorage.getItem('squishy.save.v3')!)))).toEqual(save);
      expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
    }finally{await context.close();}
  });
}
