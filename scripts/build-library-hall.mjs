// Pages-only Library artwork exports. Source PNGs are owner uploads already in the repo.
// This intentionally does not infer an editable layered source from independently generated art.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'src/experiments/phaser/library-assets');
const sources = [
  { name: 'ChatGPT Image Sep 20, 2026, 04_03_29 PM.png', sha256: '22b10abdb34753cc72e96b2bef67182bb88858c58b77c630bfe840d05830929c', out: 'wall.webp', width: 768, crop: [16, 90, 992, 740], quality: 77 },
  { name: 'ChatGPT Image Sep 20, 2026, 04_03_37 PM.png', sha256: '42243f69e181d0eba6bdbd8ab820ac840fd758b765182f293f029e0c51992966', out: 'floor.webp', width: 768, crop: [0, 780, 1024, 756], quality: 77 },
  { name: 'ChatGPT Image Sep 20, 2026, 04_14_47 PM.png', sha256: 'e93f828502898a6d6219fbfeaf242858a03cca0f2252e1cc66d83f07c5362f5e', out: 'pedestal.webp', width: 460, crop: [120, 226, 1210, 690], quality: 84 },
  { name: 'ChatGPT Image Sep 20, 2026, 04_01_55 PM (1).png', sha256: '48ec94bbb3cd3a5100a52b462689c251bb22041b0b869f14edad2173ed33d788', out: 'cabinet.webp', width: 256, crop: [210, 120, 610, 1244], quality: 84 },
  { name: 'ChatGPT Image Sep 20, 2026, 04_01_55 PM (2).png', sha256: '853231067ff88749b083eb15009f39003a9d70c0de8c43f017e5ce7d9e68ebbb', out: 'shelf.webp', width: 440, crop: [200, 275, 1170, 510], quality: 84 },
  { name: 'ChatGPT Image Sep 20, 2026, 04_01_56 PM (3).png', sha256: '9a1dfd2f08746060ad1e8cf0ee9baaf281bec1cdba9998ad3c4e372d2b4ef76b', out: 'plant.webp', width: 244, crop: [195, 178, 775, 1090], quality: 84 },
];

await mkdir(output, { recursive: true });
const manifest = { status: 'Pages preview art candidate; no owner visual acceptance or rights clearance', sources: [] };
for (const source of sources) {
  const file = path.join(root, source.name);
  const input = await readFile(file);
  const hash = createHash('sha256').update(input).digest('hex');
  if (hash !== source.sha256) throw new Error(`Library source hash mismatch: ${source.name}`);
  const [left, top, width, height] = source.crop;
  const metadata = await sharp(input).metadata();
  if (!metadata.width || !metadata.height || left + width > metadata.width || top + height > metadata.height) {
    throw new Error(`Library crop outside source: ${source.name}`);
  }
  const opaque = source.out === 'floor.webp' || source.out === 'wall.webp';
  let image = sharp(input).extract({ left, top, width, height });
  // The uploaded backgrounds contain semi-transparent fades; flatten them onto their
  // expected scene colors instead of shipping a dark RGB fringe from their alpha.
  if (opaque) image = image.flatten({ background: source.out === 'floor.webp' ? '#e4ad81' : '#f2c9ae' });
  const buffer = await image.resize({ width: source.width, withoutEnlargement: true }).webp({ quality: source.quality, alphaQuality: 100, effort: 6 }).toBuffer();
  const exported = await sharp(buffer).metadata();
  if (exported.format !== 'webp' || exported.width !== source.width || (!opaque && !exported.hasAlpha)) {
    throw new Error(`Invalid Library export: ${source.out}`);
  }
  const target = path.join(output, source.out);
  await writeFile(target, buffer);
  manifest.sources.push({ original: source.name, sha256: hash, export: `src/experiments/phaser/library-assets/${source.out}`, exportSha256: createHash('sha256').update(buffer).digest('hex'), width: exported.width, height: exported.height, bytes: buffer.length, crop: source.crop, rights: 'owner-supplied; commercial rights not independently established' });
  console.log(`${source.out}: ${exported.width}x${exported.height}, ${buffer.length} B`);
}
await writeFile(path.join(output, 'sources.json'), `${JSON.stringify(manifest, null, 2)}\n`);
