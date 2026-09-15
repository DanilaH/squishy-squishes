import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = 'dist-yandex';
const indexPath = join(root, 'index.html');
if (!existsSync(indexPath)) throw new Error('dist-yandex/index.html is missing');

const index = readFileSync(indexPath, 'utf8');
if (index.includes('/squishy-squishes/')) throw new Error('Yandex build leaked the GitHub Pages base path');

const absoluteAssetRef = /(?:src|href)=["']\/(?!\/)/;
if (absoluteAssetRef.test(index)) throw new Error('Yandex index contains an absolute-root asset reference');

const files = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path);
    else files.push(path);
  }
};
walk(root);

let totalBytes = 0;
let sdkReferenceFound = false;
let qaMarkerFound = false;
let appearanceProbeMarkerFound = false;
for (const path of files) {
  const size = statSync(path).size;
  totalBytes += size;
  if (!/\.(?:html|js|css|json|txt|svg)$/i.test(path)) continue;
  const text = readFileSync(path, 'utf8');
  if (text.includes('/sdk.js')) sdkReferenceFound = true;
  if (text.includes('squishy.phone-qa.open.v1')) qaMarkerFound = true;
  if (text.includes('squishy.appearance-probe.v1')) appearanceProbeMarkerFound = true;
}

if (!sdkReferenceFound) throw new Error('Yandex SDK /sdk.js reference was not found in the release bundle');
if (qaMarkerFound) throw new Error('Phone QA code leaked into the Yandex release bundle');
if (appearanceProbeMarkerFound) throw new Error('Appearance probe code leaked into the Yandex release bundle');
if (totalBytes > 5 * 1024 * 1024) throw new Error(`Yandex dist exceeds 5 MiB budget: ${totalBytes} bytes`);

console.log(`Verified Yandex dist: ${files.length} files, ${totalBytes} bytes`);
for (const path of files) console.log(`- ${relative(root, path)}`);
