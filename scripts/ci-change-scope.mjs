import { appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// An allowlist, not a list of ignored runtime paths. Unknown files run full QA.
export function isDocumentationOnly(paths) {
  return paths.length > 0 && paths.every(path =>
    path === 'README.md' || path === 'AGENTS.md' ||
    /^docs\/(?:[^/]+\/)*[^/]+\.md$/.test(path));
}

export function classifyChanges(base, compare) {
  if (!/^[a-f0-9]{40}$/.test(base ?? '') || /^0+$/.test(base)) return false;
  try { return isDocumentationOnly(compare(base)); }
  catch { return false; } // Shallow/missing history must never suppress QA.
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const docsOnly = classifyChanges(process.env.BASE_SHA, base =>
    execFileSync('git', ['diff', '--no-renames', '--name-only', '-z', base, 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
      .split('\0').filter(Boolean));
  appendFileSync(process.env.GITHUB_OUTPUT, `docs-only=${docsOnly}\n`);
  console.log(docsOnly ? 'Only allowlisted Markdown documentation changed; no build or deployment.'
    : 'Runtime, assets, tests, tooling, unknown change or missing history: full QA required.');
}
