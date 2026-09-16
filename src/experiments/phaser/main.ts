import Phaser from 'phaser';
import { MATERIALS, type MaterialId } from '../../game/content';
import { SHAPES, type ShapeId } from '../../game/shapes';
import { createAppearanceStroke, createMixInPlacement } from '../../sandbox/appearance';
import { createStickerPlacement, type DecorDocumentV1 } from '../../sandbox/decor';
import '../../sandbox-core.css';
import './candidate.css';
import { PhaserSquishCandidate } from './PhaserSquishCandidate';

type RendererFixture = 'clear' | 'paint' | 'mixins' | 'decor' | 'foam' | 'pearl' | 'wireframe' | 'mold' | 'palette';

declare global {
  interface Window {
    __squishyPhaserCandidate?: {
      snapshot(): ReturnType<PhaserSquishCandidate['snapshot']>;
      fixture(kind: RendererFixture): void;
      destroy(): void;
    };
  }
}

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Candidate root is missing');

// Only this separate HTML entry runs Phaser. Original V3/SDK/ads and main.ts are untouched.
root.innerHTML = `
  <main class="sandbox-shell phaser-candidate-shell" data-candidate-stage="loading" data-shape="soft-square" data-material="soft">
    <header class="sandbox-topbar"><strong>SQUISHY SQUISHES</strong><span>M3 · PHASER CANDIDATE</span></header>
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
  preserveDrawingBuffer: true, // Candidate pixel sampling only; remove before production.
});
if (!gl) {
  shell.dataset.candidateStage = 'unsupported';
  status.textContent = 'WebGL2 is required for this technical preview.';
} else {
  let game: Phaser.Game | null = null;
  let currentScene: CandidateScene | null = null;
  let destroyed = false;

  const destroyGame = (): void => {
    if (destroyed) return;
    destroyed = true;
    currentScene?.cleanup(); // game.destroy() does not guarantee the Scene SHUTDOWN event.
    game?.destroy(true);
    canvas.remove();
    shell.dataset.candidateStage = 'destroyed';
    delete window.__squishyPhaserCandidate;
  };

  class CandidateScene extends Phaser.Scene {
    private squish: PhaserSquishCandidate | null = null;
    private cleanupStarted = false;
    private detachClicks: (() => void) | null = null;
    private readonly onBlur = (): void => this.squish?.cancel();
    private readonly onHidden = (): void => { if (document.hidden) this.squish?.cancel(); };
    private readonly onContextLost = (event: Event): void => {
      event.preventDefault();
      this.squish?.forgetLostContext();
      status.textContent = 'WebGL context lost; restoring…';
    };
    private readonly onContextRestored = (): void => { status.textContent = 'WebGL context restored'; };
    private readonly onPointerCancel = (): void => this.squish?.cancel();

    constructor() { super({ key: 'SquishyCandidateScene' }); }
    create(): void {
      const squish = new PhaserSquishCandidate(this, gl!);
      this.squish = squish;
      currentScene = this;
      this.add.existing(squish);
      this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (!squish.begin(pointer)) return;
        const native = pointer.event;
        if (native instanceof PointerEvent) {
          try { canvas.setPointerCapture(native.pointerId); } catch { /* Best effort. */ }
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
      this.detachClicks = () => shell.removeEventListener('click', onClick);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
      this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);

      // Explicitly test-only controls; fixtures use the production document creators/replayers.
      const fixture = (kind: RendererFixture): void => {
        squish.setAppearanceDocuments(null, null);
        squish.setPalette('milk');
        squish.setFillingAmount(0);
        squish.setFillingStyle('none');
        squish.setFillProgress(1);
        squish.setMoldProgress(1);
        squish.setWireframe(false);
        if (kind === 'paint') {
          squish.setAppearanceDocuments({
            v: 1,
            strokes: [createAppearanceStroke(0, 0xff1764, 74, [
              { u: 0.35, v: 0.43 }, { u: 0.52, v: 0.5 }, { u: 0.67, v: 0.56 },
            ])],
            mixins: [],
          }, null);
        } else if (kind === 'mixins') {
          squish.setAppearanceDocuments({
            v: 1, strokes: [], mixins: [
              createMixInPlacement('stars', { u: 0.47, v: 0.53 }, 45, 0),
              createMixInPlacement('glitter', { u: 0.65, v: 0.43 }, 32, 0.12),
            ],
          }, null);
        } else if (kind === 'decor') {
          const decor: DecorDocumentV1 = {
            v: 1, eyes: 'happy', mouth: 'smile', blush: true,
            stickers: [createStickerPlacement('star', { u: 0.67, v: 0.36 }, 0)], accessory: null,
          };
          squish.setAppearanceDocuments(null, decor);
        } else if (kind === 'foam' || kind === 'pearl') {
          squish.setFillingStyle(kind);
          squish.setFillingAmount(0.85);
          squish.setFillProgress(0.78);
        } else if (kind === 'wireframe') {
          squish.setWireframe(true);
        } else if (kind === 'mold') {
          squish.setMoldProgress(0.4);
        } else if (kind === 'palette') {
          squish.setPalette('strawberry');
        }
        shell.dataset.candidateFixture = kind;
      };
      window.__squishyPhaserCandidate = { snapshot: () => squish.snapshot(), fixture, destroy: destroyGame };
      shell.dataset.candidateStage = 'ready';
      status.textContent = 'Hold and pull · Phaser 4 / shared simulation';
    }
    override update(time: number, delta: number): void {
      this.squish?.advance(delta, performance.now());
      if (this.squish && Math.floor(time / 250) !== Math.floor((time - delta) / 250)) {
        status.textContent = `Hold and pull · Squeezes: ${this.squish.snapshot().squeezes}`;
      }
    }
    public cleanup(): void {
      if (this.cleanupStarted) return;
      this.cleanupStarted = true;
      this.detachClicks?.();
      this.detachClicks = null;
      window.removeEventListener('blur', this.onBlur);
      document.removeEventListener('visibilitychange', this.onHidden);
      canvas.removeEventListener('webglcontextlost', this.onContextLost);
      canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
      canvas.removeEventListener('pointercancel', this.onPointerCancel);
      this.squish?.dispose();
      this.squish = null;
      currentScene = null;
      delete window.__squishyPhaserCandidate;
      shell.dataset.candidateStage = 'destroyed';
    }
  }
  game = new Phaser.Game({
    type: Phaser.WEBGL,
    parent: host,
    canvas,
    // Phaser 4 GameConfig context field is 2D-only; WebGL renderer accepts WebGL2.
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
    if (!event.persisted) destroyGame();
  }, { once: true });
}
