// Temporary draft-only transport; rejects a single corrupted or missing byte.
import { brotliDecompressSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
const chunks = await Promise.all(Array.from({ length: 8 }, (_, i) => readFile(`scripts/.library-gate1-part-${i}.b64`, 'utf8')));
const patch = brotliDecompressSync(Buffer.from(chunks.join('').replace(/\s/g, ''), 'base64'));
const actual = createHash('sha256').update(patch).digest('hex');
if (actual !== '0331f3dc66fd5a53b2fce55bd9ca4db7713cf802f5a8dc04fdc28c6109736316') throw new Error(`Corrupt patch SHA-256 ${actual}`);
await writeFile('library-gate1-verified.patch', patch);
console.log('Verified exact Studio thumbnail patch, bytes:', patch.length);
