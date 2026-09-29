// The seventh PNG in owner commit 223c843 is the transparent oval under the podium.
// Keep it as its own layer; do not flatten it into the floor or pedestal.
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'ChatGPT Image Sep 20, 2026, 04_03_59 PM.png');
const output = resolve(root, 'src/experiments/phaser/library-assets/ground-shadow.webp');
const input = await readFile(source);
const sourceSha = createHash('sha256').update(input).digest('hex');
if (sourceSha !== '51e28b36943b5dddcab002962ad1a70909054729a7c15485667813e007d33f65') {
  throw new Error(`Owner ground shadow source does not match Library commit: ${sourceSha}`);
}
const result = await sharp(input)
  .extract({ left: 200, top: 260, width: 1760, height: 280 })
  .resize({ width: 680 })
  .webp({ quality: 84, alphaQuality: 100, effort: 6 })
  .toBuffer();
const meta = await sharp(result).metadata();
if (meta.format !== 'webp' || !meta.hasAlpha || meta.width !== 680 || meta.height !== 108) {
  throw new Error(`Unexpected seventh asset geometry: ${meta.width}x${meta.height}, alpha=${meta.hasAlpha}`);
}
await writeFile(output, result);
console.log(`ground-shadow.webp: ${result.length} bytes; SHA-256 ${createHash('sha256').update(result).digest('hex')}`);
