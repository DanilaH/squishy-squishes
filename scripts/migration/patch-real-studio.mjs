// One-time, branch-only surgical patch. Checks every source anchor before writing;
// no custom template, DOM clone, production switch or schema migration.
import { readFileSync, writeFileSync } from 'node:fs';

const appFile = 'src/sandbox/SandboxApp.ts';
const externFile = 'src/experiments/phaser/PhaserSquishCandidate.ts';
let app = readFileSync(appFile, 'utf8');
let extern = readFileSync(externFile, 'utf8');

function replaceOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one anchor, got ${count}`);
  return source.replace(before, after);
}

if (app.includes("import { PhaserSquishSurface } from './PhaserSquishSurface';")) {
  console.log('Existing studio already patched; no duplicate changes.');
} else {
  app = replaceOnce(app,
    "import { SquishSurface, type SquishMaterialStyle, type SquishMetrics } from '../squish/SquishSurface';",
    "import { SquishSurface, type SquishMaterialStyle, type SquishMetrics } from '../squish/SquishSurface';\nimport { PhaserSquishSurface } from './PhaserSquishSurface';",
    'renderer import');
  app = replaceOnce(app,
    '  readonly onSaveSquishy: (draft: SandboxDraft) => Promise<SavedSquishy | null>;',
    "  readonly rendererBackend?: 'legacy' | 'phaser'; // Phaser is opt-in only in the isolated candidate.\n  readonly onSaveSquishy: (draft: SandboxDraft) => Promise<SavedSquishy | null>;",
    'renderer flag');
  app = replaceOnce(app,
    '  private readonly renderer: SquishSurface;',
    '  private readonly renderer: SquishSurface | PhaserSquishSurface;',
    'renderer type');

  const rendererCreation = `    this.renderer = options.rendererBackend === 'phaser'
      ? new PhaserSquishSurface(this.canvas, this.handleMetrics, this.audio, {
          paintStamp: (point) => {
            this.authoredStrokeMode = this.paintTool === 'erase' ? 1 : 0;
            this.authoredStrokeColor = this.paintColor;
            this.authoredPoints = [point];
            drawAppearanceStamp(this.appearanceContext, this.authoredStrokeMode, this.authoredStrokeColor, this.brushSize, point);
            this.scheduleTextureUpload();
          },
          paintSegment: (from, to) => {
            if (this.authoredPoints.length >= 320) return;
            drawAppearanceSegment(this.appearanceContext, this.authoredStrokeMode, this.authoredStrokeColor, this.brushSize, from, to);
            this.authoredPoints.push(to);
            this.scheduleTextureUpload();
          },
          paintEnd: () => { this.finishPaintStroke(); this.authoredPoints = []; },
          addMixin: (point) => this.addMixinAt(point),
          addSticker: (point) => {
            if (this.draft.decor.stickers.length >= MAX_DECOR_STICKERS) return;
            const placement = createStickerPlacement(this.selectedSticker, point, this.draft.decor.stickers.length);
            this.draft = { ...this.draft, decor: { ...this.draft.decor, stickers: [...this.draft.decor.stickers, placement] } };
            this.replayAndUpload();
            this.updateDecorUi();
          },
          mixProgress: (distance, progress) => {
            this.mixDistance = distance;
            this.mixProgressFill.style.transform = \`scaleX(\${progress})\`;
            this.mixContinueButton.disabled = progress < 1;
            this.status.textContent = progress >= 1 ? this.copy.mixReady : this.copy.mixMore;
            this.shell.dataset.mixProgress = progress.toFixed(3);
          },
          onFrame: () => {
            if (!this.rigidMixinCanvas.hidden) this.updateRigidMixinOverlay();
            if (!this.accessoryCanvas.hidden) this.updateAccessoryOverlay();
          },
        })
      : new SquishSurface(this.canvas, this.handleMetrics, this.audio);`;
  app = replaceOnce(app,
    '    this.renderer = new SquishSurface(this.canvas, this.handleMetrics, this.audio);',
    rendererCreation,
    'constructor renderer');

  app = replaceOnce(app,
    `    this.canvas.addEventListener('pointerdown', this.handlePointerDown, { signal });
    this.canvas.addEventListener('pointermove', this.handlePointerMove, { signal });
    this.canvas.addEventListener('pointerup', this.handlePointerEnd, { signal });
    this.canvas.addEventListener('pointercancel', this.handlePointerEnd, { signal });`,
    `    if (!(this.renderer instanceof PhaserSquishSurface)) {
      this.canvas.addEventListener('pointerdown', this.handlePointerDown, { signal });
      this.canvas.addEventListener('pointermove', this.handlePointerMove, { signal });
      this.canvas.addEventListener('pointerup', this.handlePointerEnd, { signal });
      this.canvas.addEventListener('pointercancel', this.handlePointerEnd, { signal });
    }`,
    'single pointer owner');

  app = replaceOnce(app,
    `    for (const panel of this.root.querySelectorAll<HTMLElement>('[data-decor-panel]')) panel.hidden = panel.dataset.decorPanel !== next;`,
    `    for (const panel of this.root.querySelectorAll<HTMLElement>('[data-decor-panel]')) panel.hidden = panel.dataset.decorPanel !== next;
    this.syncInteractivity();`,
    'decor section gesture route');

  app = replaceOnce(app,
    `  private syncInteractivity(): void {
    const shouldRenderInteract = !this.activityBlocked && (this.stage === 'mix' || this.stage === 'squeeze');
    this.renderer.setInteractive(shouldRenderInteract);
  }`,
    `  private syncInteractivity(): void {
    if (this.renderer instanceof PhaserSquishSurface) {
      this.renderer.setStudioStage(this.stage, this.decorSection);
      this.renderer.setActivityBlocked(this.activityBlocked);
      return;
    }
    const shouldRenderInteract = !this.activityBlocked && (this.stage === 'mix' || this.stage === 'squeeze');
    this.renderer.setInteractive(shouldRenderInteract);
  }`,
    'Phaser stage sync');

  app = replaceOnce(app,
    '    if (this.rigidMixinFrame === 0) this.rigidMixinFrame = requestAnimationFrame(this.updateRigidMixinOverlay);',
    '    if (this.rigidMixinFrame === 0 && !(this.renderer instanceof PhaserSquishSurface)) this.rigidMixinFrame = requestAnimationFrame(this.updateRigidMixinOverlay);',
    'rigid RAF kickoff');
  app = replaceOnce(app,
    '    this.rigidMixinFrame = requestAnimationFrame(this.updateRigidMixinOverlay);',
    '    if (!(this.renderer instanceof PhaserSquishSurface)) this.rigidMixinFrame = requestAnimationFrame(this.updateRigidMixinOverlay);',
    'rigid RAF loop');
  app = replaceOnce(app,
    '    if (this.accessoryFrame === 0) this.accessoryFrame = requestAnimationFrame(this.updateAccessoryOverlay);',
    '    if (this.accessoryFrame === 0 && !(this.renderer instanceof PhaserSquishSurface)) this.accessoryFrame = requestAnimationFrame(this.updateAccessoryOverlay);',
    'accessory RAF kickoff');
  app = replaceOnce(app,
    '    this.accessoryFrame = requestAnimationFrame(this.updateAccessoryOverlay);',
    '    if (!(this.renderer instanceof PhaserSquishSurface)) this.accessoryFrame = requestAnimationFrame(this.updateAccessoryOverlay);',
    'accessory RAF loop');

  writeFileSync(appFile, app);
  console.log(`Updated ${appFile} with opt-in Phaser renderer, original studio controls, one input and one overlay clock.`);
}

if (!extern.includes('public metricsSample(): SquishSimulationSample')) {
  extern = replaceOnce(extern,
    "import { SquishSimulation } from '../../squish/SquishSimulation';",
    "import { SquishSimulation, type SquishSimulationSample } from '../../squish/SquishSimulation';",
    'simulation metrics type');
  extern = replaceOnce(extern,
    '  public forgetLostContext(): void {',
    `  /** The real studio uses the same public metrics sample as the raw renderer. */
  public metricsSample(): SquishSimulationSample { return this.simulation.snapshot(); }

  public forgetLostContext(): void {`,
    'simulation metrics sample');
  writeFileSync(externFile, extern);
  console.log(`Updated ${externFile} with the existing sample, no alternate physics.`);
}
