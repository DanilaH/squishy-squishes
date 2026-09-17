import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const map = JSON.parse(await readFile(path.join(root, 'biba/atlas-map.json'), 'utf8'));
const cli = path.join(root, 'scripts/extract-ui-atlas.mjs');

test('all 42 mapped sprites fit the same alpha layout across honey, green and purple', async () => {
  assert.equal(Object.keys(map.sprites).length, 42);
  assert.equal(map.bakedEnglishText.length, 9);
  for (const [name, rect] of Object.entries(map.sprites)) {
    assert.match(name, /^[a-z0-9-]+$/);
    assert.equal(rect.length, 4);
    const [x, y, w, h] = rect;
    assert.ok([x, y, w, h].every(Number.isInteger), name);
    assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= map.sourceSize[0] && y + h <= map.sourceSize[1], name);
  }
  for (const [variant, relativePath] of Object.entries(map.variants)) {
    const source = path.join(root, relativePath);
    const metadata = await sharp(source).metadata();
    assert.deepEqual([metadata.width, metadata.height], map.sourceSize, variant);
    assert.equal(metadata.hasAlpha, true, variant);
    const alpha = await sharp(source).extractChannel(3).raw().toBuffer();
    assert.equal(createHash('sha256').update(alpha).digest('hex'), map.alphaMaskSHA256, variant);
  }
});

test('extracts a chosen sample without publishing the atlas or overwriting existing output', async (t) => {
  const out = await mkdtemp(path.join(tmpdir(), 'squishy-atlas-'));
  t.after(() => rm(out, { recursive: true, force: true }));
  const args = [cli, '--variant=honey', '--names=round-undo,wide-blank-button', `--out=${out}`, '--max-width=512'];
  const first = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' });
  assert.equal(first.status, 0, first.stderr);
  const exportInfo = JSON.parse(await readFile(path.join(out, 'export.json'), 'utf8'));
  assert.deepEqual(Object.keys(exportInfo.items), ['round-undo', 'wide-blank-button']);
  for (const item of Object.values(exportInfo.items)) {
    const file = path.join(out, item.fallbackWebp);
    const metadata = await sharp(file).metadata();
    assert.equal(metadata.format, 'webp');
    assert.equal(metadata.hasAlpha, true);
    assert.deepEqual([metadata.width, metadata.height], item.pixelSize);
    assert.ok(metadata.width <= 520);
    assert.ok((await stat(file)).size > 0);
  }
  const second = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' });
  assert.notEqual(second.status, 0);
  assert.match(second.stderr, /already exists/);
});
