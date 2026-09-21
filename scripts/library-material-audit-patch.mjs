import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

// One-time, source-hash-guarded edit used to test a material correction against
// real CI screenshots. No runtime dependency, original/Yandex code path retained.
const file = new URL('../src/sandbox/libraryThumbnail.ts', import.meta.url);
let source = await readFile(file, 'utf8');
const hash = createHash('sha256').update(source).digest('hex');
if (hash !== '62f53dcc5273bbf0ebe15540787a63f3002335e88fbce75eeb1cdb3644772afe') {
  throw new Error(`Unexpected thumbnail source ${hash}: do not apply a blind edit`);
}
const replaceOnce = (before, after) => {
  const index = source.indexOf(before);
  if (index < 0 || source.indexOf(before, index + before.length) !== -1) {
    throw new Error(`Missing or duplicated material patch anchor: ${before}`);
  }
  source = source.slice(0, index) + after + source.slice(index + before.length);
};
replaceOnce(
  "body.addColorStop(0.57, materialId === 'jelly' ? '#efd8ae' : '#e9d5ae');",
  "body.addColorStop(0.57, materialId === 'pearl' ? '#fcf0d4' : materialId === 'jelly' ? '#efd8ae' : '#e9d5ae');",
);
replaceOnce(
  'const metalReflection = context.createLinearGradient(74, 49, 138, 210);',
  '// Studio metalSharp reflects diagonally DOWN to the right; the previous\n    // Canvas reflection sloped the opposite way across every saved shape.\n    const metalReflection = context.createLinearGradient(156, 49, 83, 210);',
);
replaceOnce(
  "context.shadowColor = 'rgba(69, 47, 89, 0.18)';\n  context.shadowBlur = 18;\n  context.shadowOffsetY = 10;",
  "// The legacy purple drop shadow made a conspicuous violet halo around\n  // Pages chrome/pearl. Retain its pixels ONLY in the ordinary/Yandex path.\n  context.shadowColor = pagesMaterialLighting ? 'rgba(82, 63, 42, 0.13)' : 'rgba(69, 47, 89, 0.18)';\n  context.shadowBlur = pagesMaterialLighting ? 12 : 18;\n  context.shadowOffsetY = pagesMaterialLighting ? 7 : 10;",
);
await writeFile(file, source);
console.log('Applied verified Pages-only material adjustments; ordinary/Yandex thumbnail branch unchanged.');
