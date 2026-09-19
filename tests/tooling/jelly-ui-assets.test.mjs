import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import sharp from 'sharp';

const source = new URL('../../biba/ChatGPT Image Sep 17, 2026, 04_27_10 PM.png', import.meta.url);
const sourceSha256 = 'c09b03c5047384c02ccef77e95c5168d0d27858b546c0010b1d58f5e9b97f248';
const names = ['honey-wide', 'honey-pill', 'honey-small', 'honey-wave', 'red-wide'];

test('Jelly art has an unchanged source and five transparent, bounded WebP crops', async () => {
  assert.equal(createHash('sha256').update(await readFile(source)).digest('hex'), sourceSha256);
  let totalBytes = 0;
  for (const name of names) {
    const file = await readFile(new URL(`../../src/experiments/phaser/ui-assets/${name}.webp`, import.meta.url));
    const info = await sharp(file).metadata();
    assert.equal(info.format, 'webp', name);
    assert.equal(info.hasAlpha, true, name);
    assert.ok(info.width > 200 && info.width <= 640 && info.height > 65 && info.height <= 220, name);
    assert.ok(file.byteLength < 100_000, name);
    totalBytes += file.byteLength;
  }
  assert.ok(totalBytes < 120_000, `Unexpected UI image payload: ${totalBytes} bytes`);
});
