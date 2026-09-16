import { readFile, rename, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { assertYandexBuildDirectory } from '@danilah/mini-games-kit/yandex-tooling';

const root = 'dist-phaser-yandex';
const sourceHtml = join(root, 'phaser-yandex.html');
const indexHtml = join(root, 'index.html');
const entries = await readdir(root);
if (entries.includes('index.html') || !entries.includes('phaser-yandex.html')) {
  throw new Error('Expected only the Phaser DRAFT HTML entry before packaging.');
}
await rename(sourceHtml, indexHtml);

// The game's existing 5 MiB limit applies to the uncompressed ZIP root.
const report = await assertYandexBuildDirectory(root, { maxUncompressedBytes: 5 * 1024 * 1024 });
if (report.warnings.length) throw new Error(report.warnings.join('; '));
const index = await readFile(indexHtml, 'utf8');
if (!/src="\.\/assets\/[^" ]+\.js"/.test(index)) throw new Error('DRAFT root HTML must reference the compiled relative script.');
if (/(?:src|href)=["']\/(?!\/)/.test(index) || index.includes('/squishy-squishes/')) {
  throw new Error('DRAFT HTML has an absolute asset path or Pages base.');
}
if (index.includes('/src/') || index.includes('phaser-platform.html')) throw new Error('Uncompiled/test HTML leaked into DRAFT.');

const scripts = await Promise.all(report.files.filter((file) => file.endsWith('.js')).map((file) => readFile(join(root, file), 'utf8')));
const source = scripts.join('\n');
if (!source.includes('squishy.phaser-yandex-draft.')) throw new Error('DRAFT storage isolation is missing.');
if (!source.includes('/sdk.js')) throw new Error('Real Yandex SDK bootstrap is missing.');
for (const marker of ['__squishyPhaserPlatform', 'Injected candidate-only V3 storage failure', 'squishy.phone-qa.open.v1', 'squishy.appearance-probe.v1']) {
  if (source.includes(marker)) throw new Error(`Test/debug entry leaked into DRAFT: ${marker}`);
}
if (report.files.some((file) => file.endsWith('.map') || file.endsWith('.ts') || file.endsWith('.html') && file !== 'index.html')) {
  throw new Error('DRAFT upload root contains non-release sources or an extra HTML entry.');
}
console.log(`Verified Phaser Yandex DRAFT: ${report.fileCount} files, ${report.uncompressedBytes} uncompressed bytes`);
for (const file of report.files) console.log(`- ${file}`);
