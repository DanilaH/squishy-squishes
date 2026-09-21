// One-time, branch-guarded correction of the visibly floating heart head gear.
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
const path = 'src/sandbox/decor.ts';
const expected = '0139af5e34bccb29c008296b44f841439c51bb06';
const head = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' }).trim();
if (head !== 'feat/library-visual-recovery-sep21') throw new Error(`Unexpected branch: ${head}`);
const hash = execFileSync('git', ['hash-object', path], { encoding: 'utf8' }).trim();
if (hash !== expected) throw new Error(`Refusing unreviewed decor source: ${hash}`);
let source = await readFile(path, 'utf8');
const old = '  const headSeatY = maxY - height * 0.055;';
const next = `  // A heart has a deep central cleft: the global tallest lobe is not the
  // surface underneath a centered crown, bow or pair of ears. Seat the gear
  // into the actual center contour so it cannot hover above empty air.
  // Preserve the established positions for the other five silhouettes.
  const headSeatY = shape.id === 'heart'
    ? headSurfaceY + height * 0.035
    : maxY - height * 0.055;`;
if (source.split(old).length !== 2) throw new Error('Unexpected heart seat anchor');
source = source.replace(old, next);
await writeFile(path, source);
console.log('Heart accessories seated on the real cleft; other shape positions and V3 untouched.');
