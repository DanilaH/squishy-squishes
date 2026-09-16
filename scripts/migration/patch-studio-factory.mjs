// Build boundary: the production SandboxApp must NOT import Phaser at runtime.
// Only phaser-studio.html supplies the renderer factory; normal bootstraps cannot.
import { readFileSync, writeFileSync } from 'node:fs';
const path = 'src/sandbox/SandboxApp.ts';
let text = readFileSync(path, 'utf8');
function once(from, to, label) {
  const count = text.split(from).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one anchor, found ${count}`);
  text = text.replace(from, to);
}
if (text.includes('readonly makePhaserRenderer?:')) {
  console.log('Studio factory already injected.');
} else {
  once("import { PhaserSquishSurface } from './PhaserSquishSurface';",
    "import type { PhaserSquishSurface, PhaserSandboxCallbacks } from './PhaserSquishSurface';", 'type-only import');
  once("  readonly rendererBackend?: 'legacy' | 'phaser'; // Phaser is opt-in only in the isolated candidate.",
    `  readonly rendererBackend?: 'legacy' | 'phaser'; // Phaser is opt-in only in the isolated candidate.
  readonly makePhaserRenderer?: (
    canvas: HTMLCanvasElement,
    onMetrics: (metrics: SquishMetrics) => void,
    audio: SquishyAudio,
    callbacks: PhaserSandboxCallbacks,
  ) => PhaserSquishSurface;`, 'factory contract');
  once("    this.renderer = options.rendererBackend === 'phaser'",
    `    if (options.rendererBackend === 'phaser' && !options.makePhaserRenderer) {
      throw new Error('The isolated Phaser studio needs an explicit renderer factory.');
    }
    this.renderer = options.rendererBackend === 'phaser'`, 'explicit factory guard');
  once('      ? new PhaserSquishSurface(this.canvas, this.handleMetrics, this.audio, {',
    '      ? options.makePhaserRenderer!(this.canvas, this.handleMetrics, this.audio, {', 'factory use');
  once('    if (!(this.renderer instanceof PhaserSquishSurface)) {',
    "    if (this.options.rendererBackend !== 'phaser') {", 'DOM pointer exclusion');
  once('    if (this.renderer instanceof PhaserSquishSurface) {\n      this.renderer.setStudioStage(this.stage, this.decorSection);\n      this.renderer.setActivityBlocked(this.activityBlocked);',
    `    if (this.options.rendererBackend === 'phaser') {
      (this.renderer as PhaserSquishSurface).setStudioStage(this.stage, this.decorSection);
      (this.renderer as PhaserSquishSurface).setActivityBlocked(this.activityBlocked);`, 'stage routing');
  const overlay = '!(this.renderer instanceof PhaserSquishSurface)';
  const matches = text.split(overlay).length - 1;
  if (matches !== 4) throw new Error(`overlay frame gates: expected 4, got ${matches}`);
  text = text.replaceAll(overlay, "this.options.rendererBackend !== 'phaser'");
  writeFileSync(path, text);
  console.log('Normal release now imports ONLY the raw renderer; Phaser is type-only and factory-injected by its separate entry.');
}
