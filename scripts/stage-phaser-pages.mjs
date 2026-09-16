import { cp, mkdir, readFile, readdir, rename, rm, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const source = resolve('dist-phaser-pages');
const destination = resolve('dist/phaser');
const entries = await readdir(source);
if (!entries.includes('phaser-pages.html') || entries.includes('index.html')) {
  throw new Error('Expected an isolated phaser-pages.html build, without a root index.');
}
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true });
await rename(join(destination, 'phaser-pages.html'), join(destination, 'index.html'));

const files = await readdir(destination);
if (files.filter((name) => name.endsWith('.html')).join(',') !== 'index.html') {
  throw new Error('The staged preview must have exactly one HTML entry.');
}
const html = await readFile(join(destination, 'index.html'), 'utf8');
if (!html.includes('Squishy Lab · Phaser Preview') || html.includes('/sdk.js') || html.includes('/src/experiments/')) {
  throw new Error('Unexpected preview entry or uncompiled source/SDK in staged HTML.');
}
const refs = [...html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
if (!refs.some((ref) => ref?.endsWith('.js')) || !refs.some((ref) => ref?.endsWith('.css'))) {
  throw new Error('Missing compiled Phaser JS or stylesheet.');
}
for (const ref of refs) {
  if (!ref?.startsWith('./assets/') || ref.includes('..')) {
    throw new Error(`Preview assets must be scoped to ./assets/: ${ref}`);
  }
  const asset = join(destination, ref.slice(2));
  if (!(await stat(asset)).isFile()) throw new Error(`Missing compiled preview asset: ${asset}`);
}
console.log(`Phaser Pages preview staged: phaser/index.html and ${refs.length} relative assets.`);
