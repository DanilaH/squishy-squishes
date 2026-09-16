import Phaser from 'phaser';
import { MATERIALS } from '../../game/content';
import { SHAPES, type ShapeId } from '../../game/shapes';
import type { MaterialId } from '../../game/content';
import './candidate.css';
import '../../sandbox-core.css';
import { PhaserSquishCandidate } from './PhaserSquishCandidate';

interface CandidateDebug {
  snapshot(): ReturnType<PhaserSquishCandidate['snapshot']>;
  destroy(): void;
}

declare global {
  interface Window { __squishyPhaserCandidate?: CandidateDebug; }
}

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Candidate root is missing');

// Technical candidate only. Production entrypoint/Library, SDK and saved data are untouched.
root.innerHTML = `
  <main class="sandbox-shell phaser-candidate-shell" data-candidate-stage="loading" data-shape="soft-square" data-material="soft">
    <header class="sandbox-topbar"><strong>SQUISHY SQUISHES</strong><span>M2 · PHASER CANDIDATE</span></header>
    <section class="sandbox-copy"><span>ENGINE MIGRATION · TECHNICAL PREVIEW</span><h1>Try the squish</h1><p>Same spring simulation, original shader, Phaser-owned rendering. No saves or ads here.</p></section>
    <section class="sandbox-stage" aria-label="Squishy workbench">
      <div class="sandbox-glow" aria-hidden="true"></div>
      <div class="phaser-candidate-playfield" id="phaser-candidate-stage" aria-label="Interactive squishy"></div>
    </section>
    <section class="sandbox-controls">
      <div class="sandbox-panel" aria-label="Shape choices">
        ${SHAPES.map((shape) => `<button class="sandbox-shape" type="button" data-candidate-shape="${shape.id}" aria-pressed="${shape.id === 'soft-square'}">${shape.label}</button>`).join('')}
      </div>
      <div class="sandbox-panel" aria-label="Material choices">
        <div class="sandbox-material-grid">${MATERIALS.map((material) => `<button class="sandbox-material" type="button" data-candidate-material="${material.id}" aria-pressed="${material.id === 'soft'}"><span class="sandbox-material__orb sandbox-material__orb--${material.id}"></span><span>${material.label}</span></button>`).join('')}</div>
      </div>
    </section>
    <div class="sandbox-status" data-candidate-status role="status">Starting Phaser…</div>
  </main>
`;
const shell = root.querySelector<HTMLElement>('[data-candidate-stage]')!;
const host = root.querySelector<HTMLElement>('#phaser-candidate-stage')!;
const status = root.querySelector<HTMLElement>('[data-candidate-status]')!;
const canvas = document.createElement('canvas');
canvas.setAttribute('aria-label', 'Squishy canvas');
canvas.style.touchAction = 'none';
const gl = canvas.getContext('webgl2', {
  alpha: true,
  antialias: true,
  depth: true,
  stencil: true,
  premultipliedAlpha: true,
  preserveDrawingBuffer: true, // Candidate browser pixel tests only; revisit before release.
});
if (!gl) {
  shell.dataset.candidateStage = 'unsupported';
  status.textContent = 'WebGL2 is required for this technical preview.';
} else {
  let game: Phaser.Game | null = null;
  let destroyed = false;
  class CandidateScene extends Phaser.Scene {
    private squish: PhaserSquishCandidate | null = null;
    private readonly onBlur = (): void => this.squish?.cancel();
    private readonly onHidden = (): void => { if (document.hidden) this.squish?.cancel(); };
    private readonly onContextLost = (event: Event): void => {
      event.preventDefault();
      this.squish?.forgetLostContext();
      status.textContent = 'WebGL context lost; restoring…';
    };
    private readonly onContextRestored = (): void => { status.textContent = 'WebGL context restored'; };
    private readonly onPointerCancel = (): void => { this.squish?.cancel(); };

    constructor() { super({ key: 'SquishyCandidateScene' }); }
    create(): void {
      const squish = new PhaserSquishCandidate(this, gl!);
      this.squish = squish;
      this.add.existing(squish);
      // Native pointer capture preserves release outside the playfield.
      this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (!squish.begin(pointer)) return;
        const native = pointer.event;
        if (native instanceof PointerEvent) {
          try { canvas.setPointerCapture(native.pointerId); } catch { /* Capture is best effort. */ }
        }
      });
      this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => squish.move(pointer));
      this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => squish.end(pointer));
      this.input.on('pointerupoutside', (pointer: Phaser.Input.Pointer) => squish.end(pointer));
      window.addEventListener('blur', this.onBlur);
      document.addEventListener('visibilitychange', this.onHidden);
      canvas.addEventListener('webglcontextlost', this.onContextLost);
      canvas.addEventListener('webglcontextrestored', this.onContextRestored);
      canvas.addEventListener('pointercancel', this.onPointerCancel);
      const onClick = (event: MouseEvent): void => {
        const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button') : null;
        if (!target || !shell.contains(target)) return;
        const shape = target.dataset.candidateShape as ShapeId | undefined;
        const material = target.dataset.candidateMaterial as MaterialId | undefined;
        if (shape && SHAPES.some((entry) => entry.id === shape)) {
          squish.setShape(shape);
          shell.dataset.shape = shape;
          shell.querySelectorAll<HTMLButtonElement>('[data-candidate-shape]').forEach((button) => {
            button.setAttribute('aria-pressed', String(button.dataset.candidateShape === shape));
          });
        }
        if (material && MATERIALS.some((entry) => entry.id === material)) {
          squish.setMaterial(material);
          shell.dataset.material = material;
          shell.querySelectorAll<HTMLButtonElement>('[data-candidate-material]').forEach((button) => {
            button.setAttribute('aria-pressed', String(button.dataset.candidateMaterial === material));
          });
        }
      };
      shell.addEventListener('click', onClick);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        shell.removeEventListener('click', onClick);
        window.removeEventListener('blur', this.onBlur);
        document.removeEventListener('visibilitychange', this.onHidden);
        canvas.removeEventListener('webglcontextlost', this.onContextLost);
        canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
        canvas.removeEventListener('pointercancel', this.onPointerCancel);
        squish.dispose();
        this.squish = null;
        delete window.__squishyPhaserCandidate;
        shell.dataset.candidateStage = 'destroyed';
      });
      window.__squishyPhaserCandidate = {
        snapshot: () => squish.snapshot(),
        destroy: () => { if (!destroyed) { destroyed = true; game?.destroy(true); } },
      };
      shell.dataset.candidateStage = 'ready';
      status.textContent = 'Hold and pull · Phaser 4 / shared simulation';
    }
    override update(time: number, delta: number): void {
      this.squish?.advance(delta, performance.now());
      if (this.squish && Math.floor(time / 250) !== Math.floor((time - delta) / 250)) {
        const { squeezes } = this.squish.snapshot();
        status.textContent = `Hold and pull · Squeezes: ${squeezes}`;
      }
    }
  }
  game = new Phaser.Game({
    type: Phaser.WEBGL,
    parent: host,
    canvas,
    // Phaser 4's GameConfig context field is typed 2D-only; WebGL renderer accepts WebGL2.
    context: gl as unknown as CanvasRenderingContext2D,
    width: Math.max(1, host.clientWidth),
    height: Math.max(1, host.clientHeight),
    transparent: true,
    scale: { mode: Phaser.Scale.RESIZE },
    render: { antialias: true, premultipliedAlpha: true },
    audio: { noAudio: true },
    scene: [CandidateScene],
  });
  window.addEventListener('pagehide', (event: PageTransitionEvent) => {
    if (!event.persisted && !destroyed) { destroyed = true; game?.destroy(true); }
  });
}
