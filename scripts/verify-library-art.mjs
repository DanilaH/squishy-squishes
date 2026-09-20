import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('../src/experiments/phaser/library-assets/sources.json', import.meta.url), 'utf8'));
const runtime = await readFile(new URL('../src/experiments/phaser/libraryHallPreview.ts', import.meta.url), 'utf8');
const expected = new Set(['wall', 'floor', 'pedestal', 'cabinet', 'shelf', 'plant']);
if (manifest.active.length !== expected.size) throw new Error('Expected exactly six active Library assets');
for (const item of manifest.active) {
  if (!expected.delete(item.name)) throw new Error(`Duplicate or unexpected Library asset: ${item.name}`);
  const data = await readFile(resolve(new URL('.', root).pathname, item.file));
  const sha256 = createHash('sha256').update(data).digest('hex');
  const blob = createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex');
  if (item.sha256 && sha256 !== item.sha256) throw new Error(`${item.name} SHA-256 differs: ${sha256}`);
  if (item.gitBlobSha && blob !== item.gitBlobSha) throw new Error(`${item.name} git blob differs: ${blob}`);
  if (!runtime.includes(`./library-assets/${item.file.split('/').at(-1)}`)) throw new Error(`${item.name} not used in live Library preview`);
  if (item.file.endsWith('.svg')) {
    const svg = data.toString('utf8');
    if (!svg.includes('<svg') || !svg.includes('viewBox=')) throw new Error(`${item.name} SVG malformed`);
    if (/<(?:linearGradient|radialGradient|filter|image|text)\b/i.test(svg) || /(?:url\(|<script|onload=)/i.test(svg)) {
      throw new Error(`${item.name} reintroduced effects, embedded imagery or scripting`);
    }
  }
  console.log(`${item.name}: SHA verified (${data.length} bytes)`);
}
if (expected.size) throw new Error(`Missing Library assets: ${[...expected]}`);
console.log('PASS: six active Library assets match manifest and runtime imports; all flat props are plain SVG');
