// Independent, reproducible export of the owner's Sep 21 flat parquet source.
// Never alter the original seven-art 223c843 manifest or source PNG.
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'biba/ChatGPT Image Sep 21, 2026, 11_08_56 PM.png');
const assetDir = path.join(root, 'src/experiments/phaser/library-assets');
const outputPath = path.join(assetDir, 'floor-tile.webp');
const manifestPath = path.join(assetDir, 'floor-tile.source.json');
const sourceSha256 = 'cb6cea7a11c2122e60faeb082940f1da4d16414819cb019732409e940e6ab77c';
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const source = await readFile(sourcePath);
if (sha256(source) !== sourceSha256) throw new Error('Owner floor PNG has changed; review the new source before exporting');
const metadata = await sharp(source).metadata();
if (metadata.format !== 'png' || metadata.width !== 1254 || metadata.height !== 1254) {
  throw new Error('Unexpected owner floor source dimensions or format');
}
// Source ends in the middle of a board: repeat-y produced a hard horizontal
// wood-to-dark-seam jump. Crop at the preceding full plank boundary instead.
// Retain all horizontal boards, the original palette and staggered joints.
const crop = { left: 0, top: 0, width: 1254, height: 1174 };
const webp = await sharp(source).extract(crop).resize({ width: 768 })
  .webp({ quality: 84, effort: 6 }).toBuffer();
const result = await sharp(webp).metadata();
if (result.format !== 'webp' || result.width !== 768 || result.height !== 719 || result.hasAlpha) {
  throw new Error('Incorrect opaque floor-tile WebP export');
}
const manifest = {
  ownerCommit: '8f92bd25868e34d79cb1c343411f26b61fcbb19b',
  source: 'biba/ChatGPT Image Sep 21, 2026, 11_08_56 PM.png',
  sourceGitBlob: 'd9f287a0cfe28bb1a88bcffd03bacf24e5f5c38d',
  sourceSha256,
  export: 'src/experiments/phaser/library-assets/floor-tile.webp',
  exportSha256: sha256(webp),
  exportBytes: webp.length,
  dimensions: [768, 719],
  recipe: 'sharp extract [0,0,1254,1174] at plank boundary, resize width 768, WebP q84 effort6',
};
if (process.argv.includes('--check')) {
  const pinned = JSON.parse(await readFile(manifestPath, 'utf8'));
  const actual = await readFile(outputPath);
  if (JSON.stringify(pinned) !== JSON.stringify(manifest) || sha256(actual) !== manifest.exportSha256) {
    throw new Error('Floor WebP/manifest differs from the exact owner source or deterministic recipe');
  }
  console.log(`PASS: pinned owner floor ${manifest.exportSha256} (${manifest.exportBytes} bytes)`);
} else {
  await writeFile(outputPath, webp);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify(manifest));
}
