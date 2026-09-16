import { readFileSync, writeFileSync } from 'node:fs';
const path = 'src/sandbox/PhaserSquishSurface.ts';
let source = readFileSync(path, 'utf8');
const fixes = [
  ['      override create(): void {', '      create(): void {'],
  ['parent: canvas.parentElement ?? undefined, canvas,', 'parent: canvas.parentElement, canvas,'],
];
let changed = false;
for (const [before, after] of fixes) {
  const beforeCount = source.split(before).length - 1;
  const afterCount = source.split(after).length - 1;
  if (beforeCount === 1 && afterCount === 0) {
    source = source.replace(before, after);
    changed = true;
  } else if (!(beforeCount === 0 && afterCount === 1)) {
    throw new Error(`Unexpected Phaser studio type anchor: ${before} (${beforeCount} / ${afterCount})`);
  }
}
if (changed) writeFileSync(path, source);
console.log(changed ? 'Patched exact Phaser studio TypeScript errors.' : 'Phaser studio types already patched.');
