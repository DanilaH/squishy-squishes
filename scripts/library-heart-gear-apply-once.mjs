// One-time guarded patch; self-deletes after successfully writing the intended files.
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
const expected = new Map([
  ['src/sandbox/decor.ts', '72b564c9894ad5e8084da7120cc057e339ee929b'],
  ['src/sandbox/pagesDecorArt.ts', 'c30eb59fbf65ccadcdc91ca9fd81d384b43ca1dc'],
  ['src/sandbox/SandboxApp.ts', '6c80d78cc14515c926ee1a5a23257f2628ecbe3b'],
  ['src/sandbox/libraryThumbnail.ts', '138aed4dc8b623a49fdac81debef56081f735ab3'],
]);
if (execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' }).trim() !== 'feat/library-visual-recovery-sep21') throw new Error('Unexpected branch');
for (const [path, hash] of expected) {
  const actual = execFileSync('git', ['hash-object', path], { encoding: 'utf8' }).trim();
  if (actual !== hash) throw new Error(`Refusing source change ${path}: ${actual}`);
}
const replaceOne = (s, old, replacement) => {
  if (s.split(old).length !== 2) throw new Error(`Anchor missing or not unique: ${old.slice(0, 70)}`);
  return s.replace(old, replacement);
};
let decor = await readFile('src/sandbox/decor.ts', 'utf8');
decor = replaceOne(decor, "import type { ShapeDefinition } from '../game/shapes';", "import type { ShapeDefinition, ShapeId } from '../game/shapes';");
decor = replaceOne(decor, 'accessory: (context: CanvasRenderingContext2D, accessory: AccessoryId, width: number, height: number) => void;', 'accessory: (context: CanvasRenderingContext2D, accessory: AccessoryId, width: number, height: number, shapeId?: ShapeId) => void;');
decor = replaceOne(decor, 'export const getDecorFrame = (shape: ShapeDefinition): DecorFrame => {', 'export const getDecorFrame = (shape: ShapeDefinition, accessory: AccessoryId | null = null): DecorFrame => {');
decor = replaceOne(decor,
`  // A heart has a deep central cleft: the global tallest lobe is not the
  // surface underneath a centered crown, bow or pair of ears. Seat the gear
  // into the actual center contour so it cannot hover above empty air.
  // Pages opt-in only: ordinary/Yandex geometry remains byte-for-byte unchanged.
  const headSeatY = pagesDecorArt && shape.id === 'heart'
    ? headSurfaceY + height * 0.035
    : maxY - height * 0.055;`,
`  // A heart needs DIFFERENT seats: two-ear/horn bases sit on the two upper
  // lobes, while a centered bow/crown rests closer to the central cleft.
  // Pages-only: preserve old geometry in ordinary/Yandex and every other shape.
  const centeredHeartGear = pagesDecorArt && shape.id === 'heart'
    && (accessory === 'bow' || accessory === 'crown');
  const headSeatY = centeredHeartGear
    ? headSurfaceY + height * 0.13
    : maxY - height * 0.055;`);
decor = replaceOne(decor,
`  width: number,
  height: number,
): void => {
  if (pagesDecorArt) { pagesDecorArt.accessory(context, accessory, width, height); return; }`,
`  width: number,
  height: number,
  shapeId?: ShapeId,
): void => {
  if (pagesDecorArt) { pagesDecorArt.accessory(context, accessory, width, height, shapeId); return; }`);
let art = await readFile('src/sandbox/pagesDecorArt.ts', 'utf8');
art = replaceOne(art, "import type { ShapeDefinition } from '../game/shapes';", "import type { ShapeDefinition, ShapeId } from '../game/shapes';");
art = replaceOne(art,
'export const drawPagesAccessoryGraphic = (ctx: CanvasRenderingContext2D, id: AccessoryId, width: number, height: number): void => {',
'export const drawPagesAccessoryGraphic = (ctx: CanvasRenderingContext2D, id: AccessoryId, width: number, height: number, shapeId?: ShapeId): void => {');
art = replaceOne(art,
`  } else if (id === 'cat-ears' || id === 'bunny-ears') {
    for (const dir of [-1, 1]) {
      ctx.save(); ctx.scale(dir, 1);`,
`  } else if (id === 'cat-ears' || id === 'bunny-ears') {
    for (const dir of [-1, 1]) {
      ctx.save(); ctx.scale(dir, 1);
      // Pair each root with its own heart lobe, not the empty center cleft.
      if (shapeId === 'heart') ctx.translate(22, 0);`);
art = replaceOne(art,
`  } else if (id === 'horns') {
    for (const dir of [-1, 1]) {
      ctx.save(); ctx.scale(dir, 1);`,
`  } else if (id === 'horns') {
    for (const dir of [-1, 1]) {
      ctx.save(); ctx.scale(dir, 1);
      if (shapeId === 'heart') ctx.translate(22, 0);`);
let app = await readFile('src/sandbox/SandboxApp.ts', 'utf8');
app = replaceOne(app,
'drawAccessoryGraphic(this.accessoryContext, accessory, this.accessoryCanvas.width, this.accessoryCanvas.height);',
'drawAccessoryGraphic(this.accessoryContext, accessory, this.accessoryCanvas.width, this.accessoryCanvas.height, this.draft.shapeId);');
app = replaceOne(app,
'const frame = getDecorFrame(getShape(this.draft.shapeId));',
'const frame = getDecorFrame(getShape(this.draft.shapeId), this.draft.decor.accessory);');
let thumbnail = await readFile('src/sandbox/libraryThumbnail.ts', 'utf8');
thumbnail = replaceOne(thumbnail, '    const frame = getDecorFrame(shape);', '    const frame = getDecorFrame(shape, toy.decor.accessory);');
thumbnail = replaceOne(thumbnail,
'drawAccessoryGraphic(accessoryContext, toy.decor.accessory, 180, 120);',
'drawAccessoryGraphic(accessoryContext, toy.decor.accessory, 180, 120, toy.shapeId);');
await Promise.all([
  writeFile('src/sandbox/decor.ts', decor),
  writeFile('src/sandbox/pagesDecorArt.ts', art),
  writeFile('src/sandbox/SandboxApp.ts', app),
  writeFile('src/sandbox/libraryThumbnail.ts', thumbnail),
]);
console.log('Accessory-specific heart seats and paired roots shared by Studio/Squeeze/Hall, original entrypoints unaffected.');
