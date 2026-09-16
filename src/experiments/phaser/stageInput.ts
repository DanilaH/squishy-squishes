import Phaser from 'phaser';
import type { ShapeId } from '../../game/shapes';
import {
  APPEARANCE_TARGET_BYTES,
  MAX_APPEARANCE_STROKES,
  MAX_MIXIN_PLACEMENTS,
  createAppearanceStroke,
  createEmptyAppearanceDocument,
  createMixInPlacement,
  estimateAppearanceBytes,
  type AppearanceDocumentV1,
  type AppearancePoint,
} from '../../sandbox/appearance';
import { createStickerPlacement, MAX_DECOR_STICKERS, type DecorDocumentV1 } from '../../sandbox/decor';
import { PhaserStudioGestureBridge } from '../../sandbox/PhaserStudioGestureBridge';
import type { StudioGestureStage, StudioDecorSection } from '../../sandbox/StageGestureRouter';
import { PhaserSquishCandidate } from './PhaserSquishCandidate';

// Browser integration fixture, not the shipping Library, V3 repository or SDK.
// Phaser and the original renderer both delegate UV/hit tests to SquishSimulation.
declare global {
  interface Window {
    __squishyStageInput?: {
      snapshot(): { stage: StudioGestureStage; paintStrokes: number; mixinCount: number; stickerCount: number; mixProgress: number; squeezes: number; active: boolean; owner: number | null; canvasCount: number };
      stage(stage: StudioGestureStage, decorSection?: StudioDecorSection): void;
      shape(shapeId: ShapeId): void;
      pointToUv(x: number, y: number): AppearancePoint | null;
      projectUvToCanvas(u: number, v: number): { x: number; y: number };
      blocked(value: boolean): void;
      destroy(): void;
    };
  }
}

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Stage-input candidate needs #app');
document.head.insertAdjacentHTML('beforeend', `<style>
  body { margin: 0; background: #eee4f5; color: #382540; font: 16px system-ui, sans-serif; }
  main { box-sizing: border-box; margin: 0 auto; max-width: 940px; padding: 12px; }
  #gesture-stage { position: relative; width: min(420px, calc(100vw - 24px)); aspect-ratio: 1; background: #e8d9ef; }
  #gesture-stage canvas { display: block; width: 100%; height: 100%; touch-action: none; }
  [data-gesture-controls] { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
  button { padding: 9px 12px; border: 1px solid #a48cae; border-radius: 8px; background: #fff; color: inherit; }
  button[aria-pressed="true"] { background: #d9b7fa; }
</style>`);
root.innerHTML = `<main data-gesture-ready="loading" data-stage="shape" data-mix-progress="0">
  <h1>Phaser stage-input integration · isolated preview</h1>
  <p>Original SquishSimulation + appearance/decor documents. This is not the production studio.</p>
  <div id="gesture-stage" aria-label="Squishy gesture field"></div>
  <nav data-gesture-controls aria-label="Technical stage controls">
    ${(['shape', 'paint', 'mixins', 'mix', 'decor', 'finish', 'squeeze'] as const).map((stage) => `<button type="button" data-gesture-stage="${stage}" aria-pressed="${stage === 'shape'}">${stage}</button>`).join('')}
    <button type="button" data-gesture-stickers>Sticker mode</button>
    <button type="button" data-gesture-block>Block activity</button>
  </nav>
  <p data-gesture-status role="status">Starting Phaser…</p>
</main>`;
const shell = root.querySelector<HTMLElement>('[data-gesture-ready]')!;
const host = root.querySelector<HTMLElement>('#gesture-stage')!;
const status = root.querySelector<HTMLElement>('[data-gesture-status]')!;
const canvas = document.createElement('canvas');
canvas.setAttribute('aria-label', 'Phaser gesture surface');
canvas.style.touchAction = 'none';
const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, depth: true, stencil: true, premultipliedAlpha: true, preserveDrawingBuffer: true });
if (!gl) throw new Error('The stage-input test requires WebGL2');
let game: Phaser.Game | null = null;
let currentScene: StudioInputScene | null = null;
let destroyed = false;
const destroy = (): void => {
  if (destroyed) return;
  destroyed = true;
  currentScene?.cleanup();
  game?.destroy(true);
  canvas.remove();
  shell.dataset.gestureReady = 'destroyed';
  delete window.__squishyStageInput;
};

class StudioInputScene extends Phaser.Scene {
  private squish: PhaserSquishCandidate | null = null;
  private bridge: PhaserStudioGestureBridge | null = null;
  private readonly appearance: { value: AppearanceDocumentV1 } = { value: createEmptyAppearanceDocument() };
  private readonly decor: { value: DecorDocumentV1 } = { value: { v: 1, eyes: null, mouth: null, blush: false, stickers: [], accessory: null } };
  private strokePoints: AppearancePoint[] = [];
  private stage: StudioGestureStage = 'shape';
  private decorSection: StudioDecorSection = 'face';
  private blocked = false;
  private mixProgress = 0;
  private cleaned = false;
  private readonly abort = new AbortController();

  constructor() { super({ key: 'SquishyStageInputScene' }); }

  private replay(): void {
    const preview = this.strokePoints.length > 0
      ? { ...this.appearance.value, strokes: [...this.appearance.value.strokes, createAppearanceStroke(0, 0xff1764, 40, this.strokePoints)] }
      : this.appearance.value;
    this.squish?.setAppearanceDocuments(preview, this.decor.value);
    shell.dataset.paintStrokes = String(this.appearance.value.strokes.length);
    shell.dataset.mixinCount = String(this.appearance.value.mixins.length);
    shell.dataset.stickerCount = String(this.decor.value.stickers.length);
  }

  public create(): void {
    currentScene = this;
    const squish = new PhaserSquishCandidate(this, gl!);
    this.squish = squish;
    this.add.existing(squish);
    const bridge = new PhaserStudioGestureBridge(this, canvas, {
      pointToUv: (x, y) => squish.pointToUv(x, y),
      beginSquish: (pointer) => squish.begin(pointer),
      moveSquish: (pointer) => squish.move(pointer),
      endSquish: (pointer) => squish.end(pointer),
      cancelSquish: () => squish.cancel(),
      paintStamp: (point) => { this.strokePoints = [point]; this.replay(); },
      paintSegment: (_from, to) => {
        // The transient V1 document must remain under its encoded point ceiling.
        if (this.strokePoints.length < 320) this.strokePoints.push(to);
        this.replay();
      },
      paintEnd: () => {
        if (this.strokePoints.length > 0 && this.appearance.value.strokes.length < MAX_APPEARANCE_STROKES) {
          const stroke = createAppearanceStroke(0, 0xff1764, 40, this.strokePoints);
          const next = { ...this.appearance.value, strokes: [...this.appearance.value.strokes, stroke] };
          if (estimateAppearanceBytes(next) <= APPEARANCE_TARGET_BYTES) this.appearance.value = next;
        }
        this.strokePoints = [];
        this.replay();
      },
      addMixin: (point) => {
        if (this.appearance.value.mixins.length >= MAX_MIXIN_PLACEMENTS) return;
        const next = { ...this.appearance.value, mixins: [...this.appearance.value.mixins, createMixInPlacement('stars', point, 26, 0)] };
        if (estimateAppearanceBytes(next) <= APPEARANCE_TARGET_BYTES) this.appearance.value = next;
        this.replay();
      },
      addSticker: (point) => {
        if (this.decor.value.stickers.length >= MAX_DECOR_STICKERS) return;
        this.decor.value = { ...this.decor.value, stickers: [...this.decor.value.stickers, createStickerPlacement('star', point, this.decor.value.stickers.length)] };
        this.replay();
      },
      mixProgress: (distance, progress) => {
        this.mixProgress = progress;
        shell.dataset.mixProgress = progress.toFixed(3);
        shell.dataset.mixDistance = distance.toFixed(1);
      },
    });
    this.bridge = bridge;
    bridge.setStage(this.stage);
    shell.addEventListener('click', (event) => {
      const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button') : null;
      if (!button) return;
      if (button.dataset.gestureStage) this.setStage(button.dataset.gestureStage as StudioGestureStage);
      else if (button.hasAttribute('data-gesture-stickers')) this.setStage('decor', 'stickers');
      else if (button.hasAttribute('data-gesture-block')) {
        this.blocked = !this.blocked;
        bridge.setBlocked(this.blocked);
        shell.dataset.blocked = String(this.blocked);
      }
    }, { signal: this.abort.signal });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);
    this.replay();
    shell.dataset.gestureReady = 'ready';
    status.textContent = 'Phaser owns input · canonical paint/mix-in/sticker documents';
    window.__squishyStageInput = {
      snapshot: () => ({ stage: this.stage, paintStrokes: this.appearance.value.strokes.length, mixinCount: this.appearance.value.mixins.length, stickerCount: this.decor.value.stickers.length, mixProgress: this.mixProgress, squeezes: squish.snapshot().squeezes, active: squish.snapshot().active, owner: bridge.snapshot().owner, canvasCount: host.querySelectorAll('canvas').length }),
      stage: (stage, section) => this.setStage(stage, section),
      shape: (shapeId) => { bridge.cancel(); squish.setShape(shapeId); this.replay(); },
      pointToUv: (x, y) => squish.pointToUv(x, y),
      projectUvToCanvas: (u, v) => squish.projectUvToCanvas(u, v),
      blocked: (value) => { this.blocked = value; bridge.setBlocked(value); shell.dataset.blocked = String(value); },
      destroy,
    };
  }

  private setStage(stage: StudioGestureStage, section: StudioDecorSection = this.decorSection): void {
    this.bridge?.setStage(stage, section);
    this.stage = stage;
    this.decorSection = section;
    shell.dataset.stage = stage;
    shell.querySelectorAll<HTMLButtonElement>('[data-gesture-stage]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.gestureStage === stage)));
  }

  override update(_time: number, delta: number): void { this.squish?.advance(delta, performance.now()); }

  public cleanup(): void {
    if (this.cleaned) return;
    this.cleaned = true;
    this.bridge?.dispose();
    this.bridge = null;
    this.abort.abort();
    this.squish?.dispose();
    this.squish = null;
    currentScene = null;
    delete window.__squishyStageInput;
  }
}

game = new Phaser.Game({
  type: Phaser.WEBGL, parent: host, canvas,
  context: gl as unknown as CanvasRenderingContext2D,
  width: Math.max(1, host.clientWidth), height: Math.max(1, host.clientHeight),
  transparent: true, scale: { mode: Phaser.Scale.RESIZE },
  render: { antialias: true, premultipliedAlpha: true },
  audio: { noAudio: true }, scene: [StudioInputScene],
});
window.addEventListener('pagehide', (event: PageTransitionEvent) => { if (!event.persisted) destroy(); });
