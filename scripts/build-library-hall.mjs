// Deterministic regeneration of the owner's 223c843 Library PNG-derived exports.
// Do not silently rewrite the reviewed source manifest or substitute other art.
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'src/experiments/phaser/library-assets');
const manifest = JSON.parse(await readFile(path.join(output, 'sources.json'), 'utf8'));
if (manifest.ownerCommit !== '223c84339c7700b0ae0d53749be86d13fb56f30f') {
  throw new Error('Refusing to regenerate art from an unexpected Library source revision');
}
const sources = [
  { name: 'ChatGPT Image Sep 20, 2026, 04_03_29 PM.png', sha256: '22b10abdb34753cc72e96b2bef67182bb88858c58b77c630bfe840d05830929c', out: 'wall.webp', width: 768, crop: [16, 90, 992, 740], quality: 77 },
  { name: 'ChatGPT Image Sep 20, 2026, 04_03_37 PM.png', sha256: '42243f69e181d0eba6bdbd8ab820ac840fd758b765182f293f029e0c51992966', out: 'floor.webp', width: 768, crop: [0, 780, 1024, 756], quality: 77 },
  { name: 'ChatGPT Image Sep 20, 2026, 04_14_47 PM.png', sha256: 'e93f828502898a6d6219fbfeaf242858a03cca0f2252e1cc66d83f07c5362f5e', out: 'pedestal.webp', width: 460, crop: [120, 226, 1210, 690], quality: 84 },
  { name: 'ChatGPT Image Sep 20, 2026, 04_01_55 PM (1).png', sha256: '48ec94bbb3cd3a5100a52b462689c251bb22041b0b869f14edad2173ed33d788', out: 'cabinet.webp', width: 256, crop: [210, 120, 610, 1244], quality: 84 },
  { name: 'ChatGPT Image Sep 20, 2026, 04_01_55 PM (2).png', sha256: '853231067ff88749b083eb15009f39003a9d70c0de8c43f017e5ce7d9e68ebbb', out: 'shelf.webp', width: 440, crop: [200, 275, 1170, 510], quality: 84 },
  { name: 'ChatGPT Image Sep 20, 2026, 04_01_56 PM (3).png', sha256: '9a1dfd2f08746060ad1e8cf0ee9baaf281bec1cdba9998ad3c4e372d2b4ef76b', out: 'plant.webp', width: 244, crop: [195, 178, 775, 1090], quality: 84 },
];
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
const exports = [];
for (const source of sources) {
  const item = manifest.active?.find((candidate) => candidate.file === `src/experiments/phaser/library-assets/${source.out}`);
  if (!item || item.sourceSha256 !== source.sha256) throw new Error(`Unreviewed Library source mapping: ${source.out}`);
  const input = await readFile(path.join(root, source.name));
  if (sha256(input) !== source.sha256) throw new Error(`Library source hash mismatch: ${source.name}`);
  const [left, top, width, height] = source.crop;
  const metadata = await sharp(input).metadata();
  if (!metadata.width || !metadata.height || left + width > metadata.width || top + height > metadata.height) {
    throw new Error(`Library crop outside source: ${source.name}`);
  }
  const opaque = source.out === 'floor.webp' || source.out === 'wall.webp';
  let image = sharp(input).extract({ left, top, width, height });
  if (opaque) image = image.flatten({ background: source.out === 'floor.webp' ? '#e4ad81' : '#f2c9ae' });
  const buffer = await image.resize({ width: source.width, withoutEnlargement: true })
    .webp({ quality: source.quality, alphaQuality: 100, effort: 6 }).toBuffer();
  const exported = await sharp(buffer).metadata();
  if (exported.format !== 'webp' || exported.width !== source.width || (!opaque && !exported.hasAlpha)) {
    throw new Error(`Invalid Library export: ${source.out}`);
  }
  if (sha256(buffer) !== item.sha256) throw new Error(`Library export differs from pinned source: ${source.out}`);
  exports.push({ name: source.out, buffer });
}
// Seventh owner source is an independent ground shadow awaiting a measured
// under-podium placement. Verify it; never silently ignore or replace it.
const shadow = await readFile(path.join(root, 'ChatGPT Image Sep 20, 2026, 04_03_59 PM.png'));
if (sha256(shadow) !== '51e28b36943b5dddcab002962ad1a70909054729a7c15485667813e007d33f65') {
  throw new Error('Owner Library ground-shadow source hash mismatch');
}
// Atomic from the perspective of validation: no writes until all seven source
// hashes and all six generated output hashes match the reviewed manifest.
for (const item of exports) {
  await writeFile(path.join(output, item.name), item.buffer);
  console.log(`${item.name}: pinned export verified (${item.buffer.length} bytes)`);
}
console.log('PASS: six original Library exports reproduced; original ground-shadow source verified; manifest unchanged');
