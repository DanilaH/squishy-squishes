#!/usr/bin/env node
// Asset-specific build: the owner-supplied PNG sheet stays outside the runtime bundle.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'biba/ChatGPT Image Sep 17, 2026, 04_27_10 PM.png');
const output = path.join(root, 'src/experiments/phaser/ui-assets');
const expectedSourceSha256 = 'c09b03c5047384c02ccef77e95c5168d0d27858b546c0010b1d58f5e9b97f248';
const master = await readFile(source);
if (createHash('sha256').update(master).digest('hex') !== expectedSourceSha256) {
  throw new Error('Jelly UI master changed: re-review and remap crops before exporting');
}
const { width, height, hasAlpha } = await sharp(master).metadata();
if (width !== 1448 || height !== 1086 || !hasAlpha) throw new Error('Unexpected jelly UI atlas dimensions/alpha');

// Hand-reviewed alpha-component rectangles with a 4px source gutter.
// Only selected button shapes ship to the isolated Phaser Pages preview.
const sprites = {
  'honey-wide': { rect: [40, 774, 797, 210], width: 640 },
  'honey-pill': { rect: [817, 294, 592, 207], width: 440 },
  'honey-small': { rect: [894, 45, 457, 199], width: 320 },
  'honey-wave': { rect: [33, 261, 769, 267], width: 580 },
  'red-wide': { rect: [84, 27, 772, 219], width: 580 },
};
await mkdir(output, { recursive: true });
for (const [name, { rect, width: targetWidth }] of Object.entries(sprites)) {
  const [left, top, cropWidth, cropHeight] = rect;
  if (left < 0 || top < 0 || left + cropWidth > width || top + cropHeight > height) throw new Error(`Invalid crop: ${name}`);
  const buffer = await sharp(master)
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .resize({ width: targetWidth, withoutEnlargement: true })
    .webp({ quality: 86, alphaQuality: 100, effort: 6 })
    .toBuffer();
  const metadata = await sharp(buffer).metadata();
  if (!metadata.hasAlpha || metadata.format !== 'webp' || buffer.length > 100_000) throw new Error(`Invalid/bloated UI asset: ${name}`);
  await writeFile(path.join(output, `${name}.webp`), buffer);
  console.log(`${name}: ${metadata.width}x${metadata.height}, ${buffer.length} bytes`);
}
