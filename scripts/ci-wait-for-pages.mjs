import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
const source = process.env.GITHUB_SHA;
const target = `https://danilah.github.io/squishy-squishes/?v=${source}`;
const expectedHtml = readFileSync('dist/index.html', 'utf8');
const script = expectedHtml.match(/<script[^>]+src="([^"]+)"/)?.[1];
if (!script?.startsWith('/squishy-squishes/assets/')) throw Error('Missing tested Pages entry');
const hash = data => createHash('sha256').update(data).digest('hex');
const expectedHash = hash(readFileSync(`dist/${script.slice('/squishy-squishes/'.length)}`));
let verified = false;
for (let attempt = 0; attempt < 24; attempt++) {
  try {
    const html = await fetch(target, { headers: { 'cache-control': 'no-cache' }, signal: AbortSignal.timeout(10000) });
    if (html.ok && (await html.text()).includes(script)) {
      const asset = await fetch(new URL(script, target), { headers: { 'cache-control': 'no-cache' }, signal: AbortSignal.timeout(10000) });
      if (asset.ok && hash(Buffer.from(await asset.arrayBuffer())) === expectedHash) {
        writeFileSync('hosted-source.json', JSON.stringify({ source, target, script, assetSha256: expectedHash, status: html.status, assetStatus: asset.status }, null, 2));
        console.log(`Live Pages serves checked source ${source}, entry ${script}`);
        verified = true; break;
      }
    }
  } catch { /* Deployment/CDN can still be advancing. Never accept the previous build. */ }
  if (attempt < 23) await new Promise(resolve => setTimeout(resolve, 5000));
}
if (!verified) throw Error('Pages did not serve the tested entry bytes within the deployment window.');
