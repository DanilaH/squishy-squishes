#!/usr/bin/env node
// One-time guarded patch on the isolated Phaser Pages entry only.
import { readFile, writeFile } from 'node:fs/promises';

const path = 'src/experiments/phaser/pagesPreview.ts';
let source = await readFile(path, 'utf8');
const replaceOnce = (before, after) => {
  const parts = source.split(before);
  if (parts.length !== 2) throw new Error(`Expected exactly one source anchor: ${before}`);
  source = parts.join(after);
};
replaceOnce("import './candyStudioPreview.css';", "import './candyStudioPreview.css';\nimport './jellyUiPreview.css';\nimport { preloadJellyUi } from './jellyUiPreload';");
replaceOnce('void bootstrapSquishyApp(root, {', `// Session-reachable UI images decode before the first playable Library frame.\nroot.innerHTML = \`<main class="lab-shell"><section class="recipe-panel" role="status">\${normalizeLanguage(navigator.language) === 'ru' ? 'ЗАГРУЖАЕМ МАСТЕРСКУЮ…' : 'PREPARING THE STUDIO…'}</section></main>\`;\nvoid preloadJellyUi().then((ready) => {\n  if (ready) root.dataset.jellyUiReady = '';\n  return bootstrapSquishyApp(root, {`);
replaceOnce('}).then((handle) => {', '  });\n}).then((handle) => {');
await writeFile(path, source);

const pkgPath = 'package.json';
let pkg = await readFile(pkgPath, 'utf8');
if (!pkg.includes('"asset:smoke": "node --test tests/tooling/image-pipeline.test.mjs"')) throw new Error('Unexpected asset:smoke script');
pkg = pkg.replace('"asset:smoke": "node --test tests/tooling/image-pipeline.test.mjs"',
  '"asset:jelly": "node scripts/build-jelly-ui.mjs",\n    "asset:smoke": "node --test tests/tooling/image-pipeline.test.mjs tests/tooling/jelly-ui-assets.test.mjs"');
await writeFile(pkgPath, pkg);
