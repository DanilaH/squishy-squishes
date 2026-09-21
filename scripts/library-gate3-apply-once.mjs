// One-time, branch-guarded source patch. This file deletes itself in the commit.
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const expected = new Map([
  ['src/sandbox/decor.ts', 'ff2e5e1d3e88ba445cf526368ae41e43d4304aab'],
  ['src/experiments/phaser/studioPagesPreview.ts', '1dd47a624fbe6db2f3f38709bd8f3d6a58b2aa1d'],
]);
const replaceOne = (source, anchor, replacement) => {
  if (source.split(anchor).length !== 2) throw new Error(`Missing or repeated patch anchor: ${anchor.slice(0, 70)}`);
  return source.replace(anchor, replacement);
};
for (const [path, hash] of expected) {
  const actual = execFileSync('git', ['hash-object', path], { encoding: 'utf8' }).trim();
  if (actual !== hash) throw new Error(`Refusing changed source ${path}: ${actual}`);
}
let decor = await readFile('src/sandbox/decor.ts', 'utf8');
decor = replaceOne(decor,
  "const eyeIdSet = new Set<string>(EYE_STYLE_IDS);",
  `type PagesDecorArt = {
  render: (context: CanvasRenderingContext2D, decor: DecorDocumentV1, shape: ShapeDefinition, frame: DecorFrame) => void;
  accessory: (context: CanvasRenderingContext2D, accessory: AccessoryId, width: number, height: number) => void;
};
let pagesDecorArt: PagesDecorArt | null = null;
/** Only the /phaser/ entrypoint opts into the new authored transparent art. */
export const registerPagesDecorArt = (renderer: PagesDecorArt): void => { pagesDecorArt = renderer; };

const eyeIdSet = new Set<string>(EYE_STYLE_IDS);`);
decor = replaceOne(decor,
  `): void => {\n  const frame = getDecorFrame(shape);\n  if (decor.eyes) {`,
  `): void => {\n  const frame = getDecorFrame(shape);\n  if (pagesDecorArt) { pagesDecorArt.render(context, decor, shape, frame); return; }\n  if (decor.eyes) {`);
decor = replaceOne(decor,
  `): void => {\n  context.clearRect(0, 0, width, height);\n  const cx = width * 0.5;`,
  `): void => {\n  if (pagesDecorArt) { pagesDecorArt.accessory(context, accessory, width, height); return; }\n  context.clearRect(0, 0, width, height);\n  const cx = width * 0.5;`);
let pages = await readFile('src/experiments/phaser/studioPagesPreview.ts', 'utf8');
pages = replaceOne(pages,
  "import { renderStudioLibraryThumbnail, releaseStudioLibraryThumbnail } from '../../sandbox/libraryStudioThumbnail';",
  `import { renderStudioLibraryThumbnail, releaseStudioLibraryThumbnail } from '../../sandbox/libraryStudioThumbnail';
import { registerPagesDecorArt } from '../../sandbox/decor';
import { drawPagesAccessoryGraphic, renderPagesSurfaceDecor } from '../../sandbox/pagesDecorArt';`);
pages = replaceOne(pages,
  'registerPagesLibraryMaterialRenderer(renderStudioLibraryThumbnail, releaseStudioLibraryThumbnail);',
  `registerPagesLibraryMaterialRenderer(renderStudioLibraryThumbnail, releaseStudioLibraryThumbnail);
registerPagesDecorArt({ render: renderPagesSurfaceDecor, accessory: drawPagesAccessoryGraphic });`);
await writeFile('src/sandbox/decor.ts', decor);
await writeFile('src/experiments/phaser/studioPagesPreview.ts', pages);
console.log('Pages-only authored decor wired at three exact sources; ordinary/Yandex legacy paths retained.');
