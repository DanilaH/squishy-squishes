import Phaser from 'phaser';
import { getShape, isPointInsideShape, type ShapeId } from '../../game/shapes';
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
import { StageGestureRouter, type StagePointer, type StudioGestureStage, type StudioDecorSection } from '../../sandbox/StageGestureRouter';
import { PhaserSquishCandidate } from './PhaserSquishCandidate';

// Temporary browser integration gate. Unlike a synthetic router unit test, every
// gesture below enters through Phaser.Input and authors canonical game documents.
// The production Library, storage and monetization are deliberately absent.
declare global {
  interface Window {
    __squishyStageInput?: {
      snapshot(): { stage: StudioGestureStage; paintStrokes: number; mixinCount: number; stickerCount: number; mixProgress: number; squeezes: number; active: boolean; owner: number | null; canvasCount: number };
      stage(stage: StudioGestureStage, decorSection?: StudioDecorSection): void;
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
  private router: StageGestureRouter | null = null;
  private readonly pointers = new Map<number, Phaser.Input.Pointer>();
  private readonly appearance: { value: AppearanceDocumentV1 } = { value: createEmptyAppearanceDocument() };
  private readonly decor: { value: DecorDocumentV1 } = { value: { v: 1, eyes: null, mouth: null, blush: false, stickers: [], accessory: null } };
  private strokePoints: AppearancePoint[] = [];
  private shapeId: ShapeId = 'soft-square';
  private stage: StudioGestureStage = 'shape';
  private decorSection: StudioDecorSection = 'face';
  private blocked = false;
  private mixProgress = 0;
  private cleaned = false;
  private readonly abort = new AbortController();
  private readonly onBlur = (): void => this.router?.cancel();
  private readonly onHidden = (): void => { if (document.hidden) this.router?.cancel(); };
  private readonly onNativeCancel = (): void => this.router?.cancel();

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
    const router = new StageGestureRouter({
      pointToUv: (x, y) => {
        const radius = Math.max(1, Math.min(this.scale.width, this.scale.height) * 0.34);
        const localX = (x - this.scale.width / 2) / radius;
        const localY = (this.scale.height / 2 - y) / radius;
        if (!isPointInsideShape(getShape(this.shapeId), localX, localY)) return null;
        return { u: Math.min(1, Math.max(0, localX * 0.5 + 0.5)), v: Math.min(1, Math.max(0, localY * 0.5 + 0.5)) };
      },
      beginSquish: (p) => { const source = this.pointers.get(p.id); return source ? squish.begin(source) : false; },
      moveSquish: (p) => { const source = this.pointers.get(p.id); if (source) squish.move(source); },
      endSquish: (id) => { const source = this.pointers.get(id); if (source) squish.end(source); },
      cancelSquish: () => squish.cancel(),
      paintStamp: (point) => { this.strokePoints = [point]; this.replay(); },
      paintSegment: (_from, to) => {
        // The V1 codec permits at most 512 UV points per stroke (1024 base64 chars
        // is stricter in practice). Avoid creating a corrupt transient document.
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
    this.router = router;
    router.setStage(this.stage);
    const point = (p: Phaser.Input.Pointer): StagePointer => {
      const rect = canvas.getBoundingClientRect();
      return { id: p.id, x: p.x, y: p.y, clientX: rect.left + p.x * rect.width / Math.max(1, this.scale.width), clientY: rect.top + p.y * rect.height / Math.max(1, this.scale.height) };
    };
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.pointers.set(p.id, p);
      if (router.down(point(p))) {
        if (p.event instanceof PointerEvent) {
          try { canvas.setPointerCapture(p.event.pointerId); } catch { /* Some browsers do not permit capture. */ }
        }
      } else this.pointers.delete(p.id);
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => { this.pointers.set(p.id, p); router.move(point(p)); });
    const release = (p: Phaser.Input.Pointer): void => { router.up(p.id); this.pointers.delete(p.id); };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);
    canvas.addEventListener('pointercancel', this.onNativeCancel);
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('visibilitychange', this.onHidden);
    shell.addEventListener('click', (event) => {
      const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button') : null;
      if (!button) return;
      if (button.dataset.gestureStage) this.setStage(button.dataset.gestureStage as StudioGestureStage);
      else if (button.hasAttribute('data-gesture-stickers')) this.setStage('decor', 'stickers');
      else if (button.hasAttribute('data-gesture-block')) {
        this.blocked = !this.blocked;
        router.setBlocked(this.blocked);
        shell.dataset.blocked = String(this.blocked);
      }
    }, { signal: this.abort.signal });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);
    this.replay();
    shell.dataset.gestureReady = 'ready';
    status.textContent = 'Phaser owns input · canonical paint/mix-in/sticker documents';
    window.__squishyStageInput = {
      snapshot: () => ({ stage: this.stage, paintStrokes: this.appearance.value.strokes.length, mixinCount: this.appearance.value.mixins.length, stickerCount: this.decor.value.stickers.length, mixProgress: this.mixProgress, squeezes: squish.snapshot().squeezes, active: squish.snapshot().active, owner: router.snapshot().owner, canvasCount: host.querySelectorAll('canvas').length }),
      stage: (stage, section) => this.setStage(stage, section),
      blocked: (value) => { this.blocked = value; router.setBlocked(value); shell.dataset.blocked = String(value); },
      destroy,
    };
  }

  private setStage(stage: StudioGestureStage, section: StudioDecorSection = this.decorSection): void {
    this.router?.setStage(stage, section);
    this.stage = stage;
    this.decorSection = section;
    shell.dataset.stage = stage;
    canvas.style.pointerEvents = stage === 'finish' ? 'none' : 'auto';
    shell.querySelectorAll<HTMLButtonElement>('[data-gesture-stage]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.gestureStage === stage)));
  }

  override update(_time: number, delta: number): void { this.squish?.advance(delta, performance.now()); }

  public cleanup(): void {
    if (this.cleaned) return;
    this.cleaned = true;
    this.router?.cancel();
    this.router = null;
    this.pointers.clear();
    this.abort.abort();
    canvas.removeEventListener('pointercancel', this.onNativeCancel);
    window.removeEventListener('blur', this.onBlur);
    document.removeEventListener('visibilitychange', this.onHidden);
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
