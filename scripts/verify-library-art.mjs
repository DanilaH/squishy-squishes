import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('../src/experiments/phaser/library-assets/sources.json', import.meta.url), 'utf8'));
const runtime = await readFile(new URL('../src/experiments/phaser/libraryHallPreview.ts', import.meta.url), 'utf8');
const expected = new Map([
  ['wall', '22b10abdb34753cc72e96b2bef67182bb88858c58b77c630bfe840d05830929c'],
  ['floor', '42243f69e181d0eba6bdbd8ab820ac840fd758b765182f293f029e0c51992966'],
  ['pedestal', 'e93f828502898a6d6219fbfeaf242858a03cca0f2252e1cc66d83f07c5362f5e'],
  ['cabinet', '48ec94bbb3cd3a5100a52b462689c251bb22041b0b869f14edad2173ed33d788'],
  ['shelf', '853231067ff88749b083eb15009f39003a9d70c0de8c43f017e5ce7d9e68ebbb'],
  ['plant', '9a1dfd2f08746060ad1e8cf0ee9baaf281bec1cdba9998ad3c4e372d2b4ef76b'],
  ['groundShadow', '51e28b36943b5dddcab002962ad1a70909054729a7c15485667813e007d33f65'],
]);
if (manifest.ownerCommit !== '223c84339c7700b0ae0d53749be86d13fb56f30f') {
  throw new Error('Active Hall art does not point to the owner Library commit');
}
if (!Array.isArray(manifest.active) || manifest.active.length !== expected.size) {
  throw new Error('Expected exactly seven active original Library assets');
}
for (const item of manifest.active) {
  const originalHash = expected.get(item.name);
  if (!originalHash) throw new Error(`Duplicate or unexpected Library asset: ${item.name}`);
  expected.delete(item.name);
  if (item.sourceSha256 !== originalHash) throw new Error(`${item.name} original owner PNG mismatch`);
  const exportName = item.name === 'groundShadow' ? 'ground-shadow' : item.name;
  if (item.file !== `src/experiments/phaser/library-assets/${exportName}.webp`) {
    throw new Error(`${item.name} not using original PNG-derived export`);
  }
  if (typeof item.sha256 !== 'string' || !/^[\da-f]{64}$/.test(item.sha256)) {
    throw new Error(`${item.name} missing validated export SHA-256`);
  }
  const data = await readFile(resolve(new URL('.', root).pathname, item.file));
  const sha256 = createHash('sha256').update(data).digest('hex');
  if (sha256 !== item.sha256) throw new Error(`${item.name} SHA-256 differs: ${sha256}`);
  if (!runtime.includes(`./library-assets/${exportName}.webp`)) {
    throw new Error(`${item.name} missing from active Hall imports`);
  }
  if (item.name === 'groundShadow' && !runtime.includes("--hall-ground-shadow")) {
    throw new Error('Owner ground shadow not wired into active scene');
  }
  console.log(`${item.name}: owner source and export hashes verified (${data.length} bytes)`);
}
if (expected.size) throw new Error(`Missing Library assets: ${[...expected.keys()]}`);
if (!runtime.includes("owner-library-223c843")) throw new Error('Live Hall source marker missing');
for (const rejected of ['approved-master-wall.webp', 'approved-master-floor.webp', 'approved-flat-cabinet.svg', 'approved-flat-shelf.svg', 'approved-flat-plant.svg']) {
  if (runtime.includes(rejected)) throw new Error(`Hall still imports unrelated art: ${rejected}`);
}
console.log('PASS: all seven Hall assets trace to the owner Library commit and match active exports');
