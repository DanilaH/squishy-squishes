import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { assertYandexBuildDirectory } from '@danilah/mini-games-kit/yandex-tooling';

const root = 'dist-yandex';
// 5 MiB is the existing Squishy-specific budget, not a Yandex/kit default.
const report = await assertYandexBuildDirectory(root, { maxUncompressedBytes: 5 * 1024 * 1024 });
if (report.warnings.length) throw new Error(report.warnings.join('; '));

const index = await readFile(join(root, 'index.html'), 'utf8');
if (index.includes('/squishy-squishes/')) throw new Error('Yandex build leaked the GitHub Pages base path');
if (/(?:src|href)=["']\/(?!\/)/.test(index)) throw new Error('Yandex index contains an absolute-root asset reference');

let sdkReferenceFound = false;
let qaMarkerFound = false;
let appearanceProbeMarkerFound = false;
for (const file of report.files) {
  if (!/\.(?:html|js|css|json|txt|svg)$/i.test(file)) continue;
  const text = await readFile(join(root, file), 'utf8');
  if (text.includes('/sdk.js')) sdkReferenceFound = true;
  if (text.includes('squishy.phone-qa.open.v1')) qaMarkerFound = true;
  if (text.includes('squishy.appearance-probe.v1')) appearanceProbeMarkerFound = true;
}

if (!sdkReferenceFound) throw new Error('Yandex SDK /sdk.js reference was not found in the release bundle');
if (qaMarkerFound) throw new Error('Phone QA code leaked into the Yandex release bundle');
if (appearanceProbeMarkerFound) throw new Error('Appearance probe code leaked into the Yandex release bundle');

console.log(`Verified Yandex dist: ${report.fileCount} files, ${report.uncompressedBytes} bytes`);
for (const file of report.files) console.log(`- ${file}`);
