import { brotliDecompressSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
const expected = ['a3b63463eb15496fd14dc62bfe2f5b40f7d5433f4b2c15f5bc176672078db1fe','449dfffabbd649c0438cf5bf0b2e98b747d5c6c3a956f49e6294500ccef68cff','83449c38468ebc5a61f16f9cde76afee041130a9d5901659a472eaba0dbdea9a','bde47b39ba891ed8d95414880c6e4b1659ff2720a4778b6c1288b936c2c99cd8','d1974fb942151c024983e012ed99c1294eadada6dc7277f76244e74d8f859c6b','fb70f625725764f65d834632227d2c5942c5ec5469a7ad1c1acff77b081a8dd6','dc907ca0170135d534ba66fff4c861d024ea94d22f388264e1eb60702163a301','edb499ebacf66c27a253738eb9941aca83ef12e5e694be5df221892a0669338a'];
const chunks = await Promise.all(expected.map((_, i) => readFile(`scripts/.library-gate1-part-${i}.b64`, 'utf8')));
for (let i = 0; i < chunks.length; i++) {
  const data = chunks[i].trim();
  const actual = createHash('sha256').update(data).digest('hex');
  console.log(`Patch segment ${i}: length=${data.length}; SHA-256=${actual}`);
  if (data.length !== (i === 7 ? 544 : 1000) || actual !== expected[i]) throw new Error(`Corrupt segment ${i}; refusing patch`);
}
const patch = brotliDecompressSync(Buffer.from(chunks.join('').replace(/\s/g, ''), 'base64'));
const actual = createHash('sha256').update(patch).digest('hex');
if (actual !== '0331f3dc66fd5a53b2fce55bd9ca4db7713cf802f5a8dc04fdc28c6109736316') throw new Error(`Corrupt patch SHA-256 ${actual}`);
await writeFile('library-gate1-verified.patch', patch);
console.log('Verified exact Studio thumbnail patch, bytes:', patch.length);
