// Temporary, branch-only surgical edit. Delete this file and its workflow before merge.
import { readFileSync, writeFileSync } from 'node:fs';
const file = 'src/sandbox/PhaserSquishSurface.ts';
let source = readFileSync(file, 'utf8');
if (source.includes('private syncCanvasSize(): void {')) {
  console.log('Studio canvas sizing already synchronized.');
  process.exit(0);
}
function once(before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected 1 anchor, got ${count}`);
  source = source.replace(before, after);
}
once('  private readonly frameTimes: number[] = [];',
  '  private readonly frameTimes: number[] = [];\n  private readonly resizeObserver: ResizeObserver;', 'resize property');
once('        owner.applyPending();\n        canvas.dataset.phaserReady = \'true\';',
  '        owner.syncCanvasSize();\n        owner.applyPending();\n        canvas.dataset.phaserReady = \'true\';', 'initial scene size');
once('transparent: true, scale: { mode: Phaser.Scale.RESIZE },',
  'transparent: true, scale: { mode: Phaser.Scale.NONE },', 'single resize owner');
once("      audio: { noAudio: true }, scene: [StudioScene],\n    });\n  }\n\n  private applyPending(): void {",
`      audio: { noAudio: true }, scene: [StudioScene],
    });
    // The stage's responsive CSS owns the displayed square playfield. Phaser's
    // RESIZE mode instead follows the taller parent and vertically squashes art.
    this.resizeObserver = new ResizeObserver(() => this.syncCanvasSize());
    this.resizeObserver.observe(canvas);
  }

  /** Keep the WebGL backbuffer and simulation projection in the CSS playfield's aspect ratio. */
  private syncCanvasSize(): void {
    if (this.disposed || !this.scene) return;
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    if (this.game.scale.width !== width || this.game.scale.height !== height) {
      this.game.scale.resize(width, height);
    }
  }

  private applyPending(): void {`, 'size observer and sync method');
once('    this.bridge?.setStage(stage, section);\n  }\n  public setActivityBlocked',
  '    this.bridge?.setStage(stage, section);\n    this.syncCanvasSize();\n  }\n  public setActivityBlocked', 'stage transition size');
once('    this.disposed = true;\n    this.cleanupScene();\n    this.game.destroy(true);',
  '    this.disposed = true;\n    this.resizeObserver.disconnect();\n    this.cleanupScene();\n    this.game.destroy(true);', 'observer disposal');
writeFileSync(file, source);
console.log('Phaser studio now measures the CSS canvas and resizes WebGL backbuffer on stage/viewport changes.');
