import { test, expect } from '@playwright/test';
import { createEmptyDecorDocument, decodeDecorDocument, encodeDecorDocument } from '../../src/sandbox/decor';
import { createDefaultSaveV3, decodeSaveStateV3, encodeSaveStateV3 } from '../../src/platform/saveV3';
import { createSandboxDraft } from '../../src/sandbox/types';
import { DraftHistory } from '../../src/sandbox/draftHistory';

test('old compact decor stays byte-identical; placed, locked and facial data round-trip in V3', () => {
  const legacy = {...createEmptyDecorDocument(), accessory:'bow' as const, stickers:[{t:0,x:100,y:130,s:28,r:0}]};
  expect(encodeDecorDocument(legacy)).toEqual({v:1,s:[[0,100,130,28,0]],a:'bow'});
  const decor = {...legacy, accessory:null, accessories:[
    {a:'bow' as const,x:50,y:170,s:1.2,r:-.35,side:'whole' as const,color:0xb6edda,mirrored:true as const},
    {a:'cat-ears' as const,x:170,y:180,s:.8,r:.2,side:'right' as const,locked:true as const},
  ],face:{x:120,y:100,s:.75},stickers:[{t:1,x:40,y:130,s:30,r:20,locked:true as const,home:[42,135] as const}]};
  expect(decodeDecorDocument(encodeDecorDocument(decor))).toEqual(decor);
  const state={...createDefaultSaveV3(),library:[{...createSandboxDraft(),id:'rich',createdAt:1700000000000,decor}],totalCrafts:1};
  expect(decodeSaveStateV3(encodeSaveStateV3(state))).toEqual(state);
  for (const invalid of [{...decor,face:{x:999,y:1,s:1}},{...decor,accessories:[{...decor.accessories[0],s:Infinity}]}, {...decor,accessories:[{...decor.accessories[0],side:'bad'}]}, {...decor,accessories:[{...decor.accessories[0],mirrored:'bad'}]}]) expect(()=>decodeDecorDocument(invalid)).toThrow();
});

test('one continuous gesture has one undo and redo, with no history for cancelled edits', () => {
  const history=new DraftHistory(),start=createSandboxDraft();let current=start;
  history.begin(start);
  for(let i=0;i<100;i++){const next={...current,decor:{...current.decor,face:{x:100+i,y:100,s:1}}};history.record(current,next);current=next;}
  history.end(current);
  expect(history.undo(current)).toEqual(start);expect(history.canUndo).toBe(false);
  expect(history.redo(start)).toEqual(current);
  history.begin(current);history.end(current);expect(history.undo(current)).toEqual(start);
});

for(const viewport of [{width:390,height:844},{width:568,height:320}]) test(`multiple details can be dragged, locked, mirrored, undone and saved at ${viewport.width}`,async({page})=>{
  await page.setViewportSize(viewport);await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/squishy-squishes/');
  const state={...createDefaultSaveV3(),library:[{...createSandboxDraft(),id:'edit-rich',createdAt:1700000000000,decor:{...createEmptyDecorDocument(),eyes:'dot',mouth:'smile',accessory:'bow'}}],totalCrafts:1};
  await page.evaluate(value=>localStorage.setItem('squishy.save.v3',JSON.stringify(value)),state);await page.reload();
  await page.locator('[data-library-play-id="edit-rich"]').click();await page.locator('[data-action="edit-saved"]').click();
  await page.locator('[data-decor-section="accessory"]').click();await page.locator('[data-decor-accessory="crown"]').click();
  await expect(page.locator('[data-accessory-index="1"]')).toBeVisible();
  await page.locator('[data-decor-section="objects"]').click();await page.locator('[data-object="accessory:0"]').click();
  const piece=page.locator('[data-accessory-index="0"]');
  const before=await piece.getAttribute('data-accessory-anchor-x');const rect=(await piece.boundingBox())!;
  await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height*.70);await page.mouse.down();await page.mouse.move(rect.x+rect.width/2+25,rect.y+rect.height*.70+12,{steps:8});await page.mouse.up();
  await expect.poll(()=>piece.getAttribute('data-accessory-anchor-x')).not.toBe(before);
  await page.locator('[data-panel="decor"] [data-action="draft-undo"]').click();await expect(piece).toHaveAttribute('data-accessory-anchor-x',before!);
  await page.locator('[data-panel="decor"] [data-action="draft-redo"]').click();
  await page.locator('[data-object-action="lock"]').click();await expect(page.locator('[data-object="accessory:0"]')).toContainText('🔒');
  await page.locator('[data-object-action="mirror"]').click();await expect(page.locator('[data-accessory-index="2"]')).toBeVisible();
  await page.locator('[data-object="face"]').click();await page.locator('[data-object-control="scale"]').fill('0.75');await page.locator('[data-object-control="scale"]').dispatchEvent('change');
  await page.locator('[data-action="decor-continue"]').click();await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage','squeeze');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('squishy.save.v3')!).library[0]);
  const decoded=decodeSaveStateV3({...createDefaultSaveV3(),library:[saved],totalCrafts:1});
  expect(decoded.library[0]!.decor.accessories).toHaveLength(3);expect(decoded.library[0]!.decor.face?.s).toBe(.75);
  await page.reload();await page.locator('[data-library-play-id="edit-rich"]').click();await expect(page.locator('[data-accessory-index="2"]')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight||document.documentElement.scrollWidth>innerWidth)).toBe(false);
});

test('accessory colours retain soft alpha, and mirrored pieces preserve the reflected source through redraw and save', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/squishy-squishes/');
  const toy = { ...createSandboxDraft(), id: 'colour-proof', createdAt: 1700000000000,
    decor: { ...createEmptyDecorDocument(), accessory: 'handbag' } };
  await page.evaluate(value => localStorage.setItem('squishy.save.v3', JSON.stringify(value)),
    { ...createDefaultSaveV3(), library: [toy], totalCrafts: 1 });
  await page.reload(); await page.locator('[data-library-play-id="colour-proof"]').click();
  await page.locator('[data-action="edit-saved"]').click();
  await page.locator('[data-decor-section="objects"]').click(); await page.locator('[data-object="accessory:0"]').click();
  const piece = page.locator('[data-accessory-index="0"]');
  const pixels = () => piece.evaluate((canvas: HTMLCanvasElement) => [...canvas.getContext('2d')!.getImageData(0, 0, 180, 120).data]);
  const before = await pixels();
  for (const color of [0xffa6cb, 0xcab0e8, 0xa1e2ce, 0xffcea8]) {
    await page.locator(`[data-object-action="color:${color}"]`).click();
    const coloured = await pixels();
    expect(coloured.filter((_, i) => i % 4 === 3)).toEqual(before.filter((_, i) => i % 4 === 3));
    expect(coloured).not.toEqual(before);
  }
  await page.locator('[data-object-action="mirror"]').click();
  const original = await pixels();
  const reflected = await page.locator('[data-accessory-index="1"]').evaluate((canvas: HTMLCanvasElement) => [...canvas.getContext('2d')!.getImageData(0, 0, 180, 120).data]);
  let difference = 0;
  for (let y = 0; y < 120; y++) for (let x = 0; x < 180; x++) {
    difference += Math.abs(original[(y * 180 + x) * 4 + 3]! - reflected[(y * 180 + 179 - x) * 4 + 3]!);
  }
  expect(difference / (180 * 120)).toBeLessThan(2);
  await page.locator('[data-action="decor-continue"]').click(); await page.locator('[data-action="save"]').click();
  await expect(page.locator('[data-sandbox-app]')).toHaveAttribute('data-stage', 'squeeze');
  const saved = decodeSaveStateV3(await page.evaluate(() => JSON.parse(localStorage.getItem('squishy.save.v3')!))).library[0]!;
  expect(saved.decor.accessories?.[1]?.mirrored).toBe(true);
  expect(saved.decor.accessories?.[1]?.color).toBe(0xffcea8);
});
