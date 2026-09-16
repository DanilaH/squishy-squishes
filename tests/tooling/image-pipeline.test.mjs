import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import sharp from 'sharp';

const cli = new URL('../../scripts/prepare-image.mjs', import.meta.url);
const invoke = (...args) => spawnSync(process.execPath, [cli.pathname, ...args], { encoding: 'utf8' });

test('prepares transparent authored art and refuses accidental replacement', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'squishy-image-'));
  const input = join(root, 'master.png');
  const output = join(root, 'ui-button.webp');
  t.after(async () => { await import('node:fs/promises').then(({ rm }) => rm(root, { recursive: true, force: true })); });

  await sharp(Buffer.from('<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg"><circle cx="64" cy="64" r="38" fill="#ff678a"/></svg>'))
    .png().toFile(input);

  const first = invoke(input, output, '--canvas=128', '--padding=16');
  assert.equal(first.status, 0, first.stderr || first.stdout);
  const report = JSON.parse(first.stdout);
  assert.equal(report.backgroundMethod, 'existing-alpha');
  assert.equal(report.webp, output);
  const metadata = await sharp(output).metadata();
  assert.equal(metadata.width, 128);
  assert.equal(metadata.height, 128);
  assert.equal(metadata.hasAlpha, true);
  assert.ok((await stat(output)).size > 0);
  if (report.avif) {
    assert.equal((await sharp(report.avif).metadata()).width, 128);
    assert.ok(report.avifBytes < report.webpBytes);
  }
  const original = await readFile(output);
  const second = invoke(input, output, '--canvas=128', '--padding=16');
  assert.notEqual(second.status, 0);
  assert.match(second.stderr, /already exists/);
  assert.deepEqual(await readFile(output), original);
  assert.equal((await readdir(root)).includes('master.png'), true);

  const forced = invoke(input, output, '--canvas=128', '--padding=16', '--force');
  assert.equal(forced.status, 0, forced.stderr || forced.stdout);
});
