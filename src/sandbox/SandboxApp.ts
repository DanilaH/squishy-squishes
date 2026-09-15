import { MATERIALS, getMaterial, getPalette, type MaterialId } from '../game/content';
import { SquishyAudio } from '../game/SquishyAudio';
import { SHAPES, getShape, type ShapeDefinition, type ShapeId } from '../game/shapes';
import { SquishSurface, type SquishMaterialStyle, type SquishMetrics } from '../squish/SquishSurface';
import {
  APPEARANCE_TARGET_BYTES,
  APPEARANCE_TEXTURE_SIZE,
  MAX_APPEARANCE_STROKES,
  MAX_MIXIN_PLACEMENTS,
  createAppearanceStroke,
  createEmptyAppearanceDocument,
  createMixInPlacement,
  drawAppearanceSegment,
  drawAppearanceStamp,
  estimateAppearanceBytes,
  replayAppearanceDocument,
  type AppearanceDocumentV1,
  type AppearancePoint,
  type AppearanceStrokeMode,
  type MixInId,
} from './appearance';
import { createSandboxDraft, type SandboxDraft, type SavedSquishy } from './types';

export type SandboxLanguage = 'en' | 'ru';
type SandboxStage = 'home' | 'shape' | 'paint' | 'mixins' | 'mix' | 'finish' | 'squeeze';
type PaintTool = 'paint' | 'erase';

export interface SandboxAppOptions {
  readonly language: SandboxLanguage;
  readonly muted: boolean;
  readonly savedSquishy: SavedSquishy | null;
  readonly onSaveSquishy: (draft: SandboxDraft) => Promise<SavedSquishy>;
  readonly onMutedChange: (muted: boolean) => void | Promise<void>;
}

interface SandboxCopy {
  readonly studio: string;
  readonly shape: string;
  readonly paint: string;
  readonly mixins: string;
  readonly mix: string;
  readonly finish: string;
  readonly home: string;
  readonly squeeze: string;
  readonly chooseShape: string;
  readonly paintHint: string;
  readonly mixinsHint: string;
  readonly mixHint: string;
  readonly finishHint: string;
  readonly homeHint: string;
  readonly squeezeHint: string;
  readonly next: string;
  readonly save: string;
  readonly saving: string;
  readonly newSquishy: string;
  readonly play: string;
  readonly done: string;
  readonly undo: string;
  readonly clear: string;
  readonly eraser: string;
  readonly brush: string;
  readonly mixReady: string;
  readonly mixMore: string;
  readonly drawingFull: string;
  readonly muted: string;
  readonly sound: string;
  readonly soft: string;
  readonly jelly: string;
  readonly holo: string;
}

const COPY: Readonly<Record<SandboxLanguage, SandboxCopy>> = {
  en: {
    studio: 'SQUISHY STUDIO',
    shape: 'CHOOSE A SHAPE',
    paint: 'PAINT IT',
    mixins: 'ADD SPRINKLES',
    mix: 'MIX & STRETCH',
    finish: 'FINISH IT',
    home: 'YOUR SQUISHY',
    squeeze: 'SQUEEZE IT',
    chooseShape: 'Pick any one. They are all yours.',
    paintHint: 'Draw anything. You can continue whenever you want.',
    mixinsHint: 'Tap or drag to scatter. Skip it if you want.',
    mixHint: 'Grab the squishy and really move it around.',
    finishHint: 'Choose how the material feels, then keep your squishy.',
    homeHint: 'Your saved squishy is here whenever you want to play.',
    squeezeHint: 'Pull, press and let go.',
    next: 'CONTINUE',
    save: 'KEEP IT',
    saving: 'SAVING…',
    newSquishy: 'NEW SQUISHY',
    play: 'SQUEEZE',
    done: 'BACK',
    undo: 'Undo',
    clear: 'Clear',
    eraser: 'Eraser',
    brush: 'Brush',
    mixReady: 'Nice. It is mixed!',
    mixMore: 'Keep stretching…',
    drawingFull: 'This squishy has plenty of detail already.',
    muted: 'Sound off',
    sound: 'Sound on',
    soft: 'Soft',
    jelly: 'Jelly',
    holo: 'Holo',
  },
  ru: {
    studio: 'СКВИШ-СТУДИЯ',
    shape: 'ВЫБЕРИ ФОРМУ',
    paint: 'РАСКРАСЬ',
    mixins: 'ДОБАВЬ',
    mix: 'ЗАМЕШАЙ',
    finish: 'ГОТОВО!',
    home: 'ТВОЙ СКВИШ',
    squeeze: 'ЖМЯКАЙ',
    chooseShape: 'Выбирай любую. Все формы уже открыты.',
    paintHint: 'Рисуй что угодно. Продолжить можно в любой момент.',
    mixinsHint: 'Тапай или веди пальцем. Можно вообще пропустить.',
    mixHint: 'Хватай сквиш и хорошенько потяни его.',
    finishHint: 'Выбери материал и сохрани свой сквиш.',
    homeHint: 'Твой сквиш сохранён и всегда ждёт тебя.',
    squeezeHint: 'Тяни, дави и отпускай.',
    next: 'ДАЛЬШЕ',
    save: 'ОСТАВИТЬ',
    saving: 'СОХРАНЯЕМ…',
    newSquishy: 'НОВЫЙ СКВИШ',
    play: 'ПОЖМЯКАТЬ',
    done: 'НАЗАД',
    undo: 'Отмена',
    clear: 'Очистить',
    eraser: 'Ластик',
    brush: 'Кисть',
    mixReady: 'Отлично замешано!',
    mixMore: 'Ещё немного потяни…',
    drawingFull: 'На этом сквише уже очень много деталей.',
    muted: 'Звук выкл.',
    sound: 'Звук вкл.',
    soft: 'Мягкий',
    jelly: 'Желе',
    holo: 'Голографик',
  },
};

const PAINT_COLORS = [0xd58cff, 0x63e6e2, 0xff79a8, 0x92df83, 0xffa46f, 0xffdc70] as const;
const BRUSH_SIZES = [18, 34, 56] as const;
const MIXIN_IDS: readonly MixInId[] = ['glitter', 'stars', 'foam', 'pearls', 'hearts', 'confetti'];
const MIX_DISTANCE_FOR_COMPLETE_PX = 1_650;
const MIXIN_SPACING_PX = 24;
const BASE_PALETTE_ID = 'milk' as const;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const shapeSvg = (shape: ShapeDefinition): string => {
  const points = shape.boundary.map((point) => `${50 + point.x * 42},${50 - point.y * 42}`).join(' ');
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><polygon points="${points}" /></svg>`;
};

const mixinGlyph = (id: MixInId): string => {
  if (id === 'glitter') return '✦';
  if (id === 'stars') return '★';
  if (id === 'foam') return '○';
  if (id === 'pearls') return '◉';
  if (id === 'hearts') return '♥';
  return '▰';
};

const mixinLabel = (id: MixInId): string => {
  if (id === 'glitter') return 'Glitter';
  if (id === 'stars') return 'Stars';
  if (id === 'foam') return 'Foam';
  if (id === 'pearls') return 'Pearls';
  if (id === 'hearts') return 'Hearts';
  return 'Confetti';
};

export class SandboxApp {
  private readonly abortController = new AbortController();
  private readonly shell: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly stageTitle: HTMLElement;
  private readonly stageHint: HTMLElement;
  private readonly stageStep: HTMLElement;
  private readonly status: HTMLElement;
  private readonly mixProgressFill: HTMLElement;
  private readonly mixContinueButton: HTMLButtonElement;
  private readonly saveButton: HTMLButtonElement;
  private readonly muteButton: HTMLButtonElement;
  private readonly renderer: SquishSurface;
  private readonly audio = new SquishyAudio();
  private readonly appearanceCanvas = document.createElement('canvas');
  private readonly appearanceContext: CanvasRenderingContext2D;
  private readonly copy: SandboxCopy;

  private stage: SandboxStage;
  private draft: SandboxDraft = createSandboxDraft();
  private savedSquishy: SavedSquishy | null;
  private paintTool: PaintTool = 'paint';
  private paintColor = PAINT_COLORS[0];
  private brushSize = BRUSH_SIZES[1];
  private selectedMixIn: MixInId = 'glitter';
  private authoredPointerId: number | null = null;
  private authoredPoints: AppearancePoint[] = [];
  private authoredStrokeMode: AppearanceStrokeMode = 0;
  private authoredStrokeColor = PAINT_COLORS[0];
  private lastMixinClientX = 0;
  private lastMixinClientY = 0;
  private mixPointerId: number | null = null;
  private mixLastX = 0;
  private mixLastY = 0;
  private mixDistance = 0;
  private latestMetrics: SquishMetrics | null = null;
  private uploadFrame = 0;
  private muted = false;
  private activityBlocked = false;
  private saving = false;
  private disposed = false;

  public constructor(
    private readonly root: HTMLDivElement,
    private readonly options: SandboxAppOptions,
  ) {
    this.copy = COPY[options.language];
    this.savedSquishy = options.savedSquishy;
    this.muted = options.muted;
    this.stage = this.savedSquishy ? 'home' : 'shape';

    this.appearanceCanvas.width = APPEARANCE_TEXTURE_SIZE;
    this.appearanceCanvas.height = APPEARANCE_TEXTURE_SIZE;
    const appearanceContext = this.appearanceCanvas.getContext('2d');
    if (!appearanceContext) throw new Error('Sandbox appearance requires Canvas 2D.');
    this.appearanceContext = appearanceContext;

    root.innerHTML = this.renderShell();
    this.shell = this.requireElement<HTMLElement>('[data-sandbox-app]');
    this.canvas = this.requireElement<HTMLCanvasElement>('[data-sandbox-canvas]');
    this.stageTitle = this.requireElement<HTMLElement>('[data-sandbox-title]');
    this.stageHint = this.requireElement<HTMLElement>('[data-sandbox-hint]');
    this.stageStep = this.requireElement<HTMLElement>('[data-sandbox-step]');
    this.status = this.requireElement<HTMLElement>('[data-sandbox-status]');
    this.mixProgressFill = this.requireElement<HTMLElement>('[data-mix-progress-fill]');
    this.mixContinueButton = this.requireElement<HTMLButtonElement>('[data-action="mix-continue"]');
    this.saveButton = this.requireElement<HTMLButtonElement>('[data-action="save"]');
    this.muteButton = this.requireElement<HTMLButtonElement>('[data-action="mute"]');

    this.renderer = new SquishSurface(this.canvas, this.handleMetrics, this.audio);
    this.renderer.setFillProgress(1);
    this.renderer.setMoldProgress(1);
    this.renderer.setFillingAmount(0);
    this.renderer.setMuted(this.muted);

    this.bindEvents();
    if (this.savedSquishy) this.loadSavedSquishy(this.savedSquishy);
    else this.applyDraftToRenderer();
    this.setStage(this.stage);
  }

  public setActivityBlocked(blocked: boolean): void {
    this.activityBlocked = blocked;
    this.shell.classList.toggle('is-blocked', blocked);
    this.shell.setAttribute('aria-busy', String(blocked));
    this.syncInteractivity();
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.uploadFrame !== 0) cancelAnimationFrame(this.uploadFrame);
    this.abortController.abort();
    this.renderer.dispose();
    this.audio.dispose();
  }

  private renderShell(): string {
    const shapes = SHAPES.map((shape) => `
      <button class="sandbox-shape" type="button" data-shape="${shape.id}" aria-pressed="${shape.id === 'soft-square'}">
        <span class="sandbox-shape__icon">${shapeSvg(shape)}</span>
        <span>${shape.label}</span>
      </button>
    `).join('');
    const paintColors = PAINT_COLORS.map((color, index) => `
      <button class="sandbox-swatch" type="button" data-paint-color="${color}" aria-label="Color ${index + 1}" aria-pressed="${index === 0}" style="--swatch:#${color.toString(16).padStart(6, '0')}"></button>
    `).join('');
    const brushSizes = BRUSH_SIZES.map((size) => `
      <button type="button" data-brush-size="${size}" aria-pressed="${size === this.brushSize}">${size === 18 ? 'S' : size === 34 ? 'M' : 'L'}</button>
    `).join('');
    const mixins = MIXIN_IDS.map((id, index) => `
      <button class="sandbox-mixin" type="button" data-mixin="${id}" aria-pressed="${index === 0}">
        <span>${mixinGlyph(id)}</span><small>${mixinLabel(id)}</small>
      </button>
    `).join('');
    const materials = MATERIALS.map((material) => `
      <button class="sandbox-material" type="button" data-material="${material.id}" aria-pressed="${material.id === 'soft'}">
        <span class="sandbox-material__orb sandbox-material__orb--${material.id}"></span>
        <span>${material.id === 'soft' ? this.copy.soft : material.id === 'jelly' ? this.copy.jelly : this.copy.holo}</span>
      </button>
    `).join('');

    return `
      <main class="sandbox-shell" data-sandbox-app data-stage="${this.stage}" data-shape="soft-square" data-material="soft" data-sandbox-squeezes="0">
        <header class="sandbox-topbar">
          <strong>${this.copy.studio}</strong>
          <button class="sandbox-sound" type="button" data-action="mute" aria-pressed="${this.muted}">${this.muted ? this.copy.muted : this.copy.sound}</button>
        </header>

        <section class="sandbox-copy">
          <span data-sandbox-step></span>
          <h1 data-sandbox-title></h1>
          <p data-sandbox-hint></p>
        </section>

        <section class="sandbox-stage" aria-label="Squishy workbench">
          <div class="sandbox-glow" aria-hidden="true"></div>
          <canvas class="sandbox-canvas" data-sandbox-canvas aria-label="Squishy"></canvas>
        </section>

        <section class="sandbox-controls">
          <div class="sandbox-panel" data-panel="shape">${shapes}<button class="sandbox-primary sandbox-panel__wide" type="button" data-action="shape-continue">${this.copy.next}</button></div>

          <div class="sandbox-panel" data-panel="paint">
            <div class="sandbox-tool-row">${paintColors}</div>
            <div class="sandbox-tool-row">
              <button type="button" data-paint-tool="paint" aria-pressed="true">${this.copy.brush}</button>
              <button type="button" data-paint-tool="erase" aria-pressed="false">${this.copy.eraser}</button>
              ${brushSizes}
            </div>
            <div class="sandbox-tool-row sandbox-tool-row--actions">
              <button type="button" data-action="paint-undo">${this.copy.undo}</button>
              <button type="button" data-action="paint-clear">${this.copy.clear}</button>
              <button class="sandbox-primary" type="button" data-action="paint-continue">${this.copy.next}</button>
            </div>
          </div>

          <div class="sandbox-panel" data-panel="mixins">
            <div class="sandbox-mixin-grid">${mixins}</div>
            <div class="sandbox-tool-row sandbox-tool-row--actions">
              <button type="button" data-action="mixin-undo">${this.copy.undo}</button>
              <button type="button" data-action="mixin-clear">${this.copy.clear}</button>
              <button class="sandbox-primary" type="button" data-action="mixin-continue">${this.copy.next}</button>
            </div>
          </div>

          <div class="sandbox-panel sandbox-panel--center" data-panel="mix">
            <div class="sandbox-mix-progress" aria-hidden="true"><span data-mix-progress-fill></span></div>
            <button class="sandbox-primary sandbox-panel__wide" type="button" data-action="mix-continue" disabled>${this.copy.next}</button>
          </div>

          <div class="sandbox-panel" data-panel="finish">
            <div class="sandbox-material-grid">${materials}</div>
            <button class="sandbox-primary sandbox-panel__wide" type="button" data-action="save">${this.copy.save}</button>
          </div>

          <div class="sandbox-panel sandbox-panel--center" data-panel="home">
            <button class="sandbox-primary sandbox-panel__wide" type="button" data-action="play-saved">${this.copy.play}</button>
            <button class="sandbox-secondary sandbox-panel__wide" type="button" data-action="new">${this.copy.newSquishy}</button>
          </div>

          <div class="sandbox-panel sandbox-panel--center" data-panel="squeeze">
            <button class="sandbox-secondary" type="button" data-action="home">${this.copy.done}</button>
            <button class="sandbox-primary" type="button" data-action="new">${this.copy.newSquishy}</button>
          </div>
        </section>
        <div class="sandbox-status" data-sandbox-status aria-live="polite"></div>
      </main>
    `;
  }

  private bindEvents(): void {
    const signal = this.abortController.signal;
    this.root.addEventListener('click', this.handleClick, { signal });
    this.canvas.addEventListener('pointerdown', this.handlePointerDown, { signal });
    this.canvas.addEventListener('pointermove', this.handlePointerMove, { signal });
    this.canvas.addEventListener('pointerup', this.handlePointerEnd, { signal });
    this.canvas.addEventListener('pointercancel', this.handlePointerEnd, { signal });
  }

  private readonly handleClick = (event: MouseEvent): void => {
    if (this.activityBlocked || this.saving) return;
    const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button') : null;
    if (!target) return;

    const shapeId = target.dataset.shape as ShapeId | undefined;
    if (shapeId && SHAPES.some((shape) => shape.id === shapeId)) {
      this.draft = { ...this.draft, shapeId };
      this.applyDraftToRenderer();
      this.updatePressed('[data-shape]', 'shape', shapeId);
      return;
    }

    const paintColor = target.dataset.paintColor;
    if (paintColor) {
      this.paintColor = Number(paintColor);
      this.paintTool = 'paint';
      this.updatePressed('[data-paint-color]', 'paintColor', paintColor);
      this.updatePressed('[data-paint-tool]', 'paintTool', 'paint');
      return;
    }

    const paintTool = target.dataset.paintTool as PaintTool | undefined;
    if (paintTool === 'paint' || paintTool === 'erase') {
      this.paintTool = paintTool;
      this.updatePressed('[data-paint-tool]', 'paintTool', paintTool);
      return;
    }

    const brushSize = target.dataset.brushSize;
    if (brushSize) {
      this.brushSize = Number(brushSize);
      this.updatePressed('[data-brush-size]', 'brushSize', brushSize);
      return;
    }

    const mixin = target.dataset.mixin as MixInId | undefined;
    if (mixin && MIXIN_IDS.includes(mixin)) {
      this.selectedMixIn = mixin;
      this.updatePressed('[data-mixin]', 'mixin', mixin);
      return;
    }

    const materialId = target.dataset.material as MaterialId | undefined;
    if (materialId && MATERIALS.some((material) => material.id === materialId)) {
      this.draft = { ...this.draft, materialId };
      this.applyMaterial(materialId);
      this.updatePressed('[data-material]', 'material', materialId);
      return;
    }

    const action = target.dataset.action;
    if (action === 'shape-continue') this.setStage('paint');
    else if (action === 'paint-continue') this.setStage('mixins');
    else if (action === 'paint-undo') this.undoPaint();
    else if (action === 'paint-clear') this.clearPaint();
    else if (action === 'mixin-continue') this.beginMix();
    else if (action === 'mixin-undo') this.undoMixin();
    else if (action === 'mixin-clear') this.clearMixins();
    else if (action === 'mix-continue' && this.mixDistance >= MIX_DISTANCE_FOR_COMPLETE_PX) this.setStage('finish');
    else if (action === 'save') void this.saveDraft();
    else if (action === 'play-saved') this.openSavedForSqueeze();
    else if (action === 'new') this.startNew();
    else if (action === 'home') this.setStage(this.savedSquishy ? 'home' : 'shape');
    else if (action === 'mute') this.toggleMuted();
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (this.activityBlocked) return;
    if (this.stage === 'paint') {
      if (this.authoredPointerId !== null) return;
      const point = this.renderer.clientPointToUv(event.clientX, event.clientY);
      if (!point) return;
      this.authoredPointerId = event.pointerId;
      this.authoredPoints = [point];
      this.authoredStrokeMode = this.paintTool === 'erase' ? 1 : 0;
      this.authoredStrokeColor = this.paintColor;
      drawAppearanceStamp(this.appearanceContext, this.authoredStrokeMode, this.authoredStrokeColor, this.brushSize, point);
      this.scheduleTextureUpload();
      try { this.canvas.setPointerCapture(event.pointerId); } catch { /* unavailable */ }
      event.preventDefault();
      return;
    }

    if (this.stage === 'mixins') {
      if (this.authoredPointerId !== null) return;
      const point = this.renderer.clientPointToUv(event.clientX, event.clientY);
      if (!point) return;
      this.authoredPointerId = event.pointerId;
      this.lastMixinClientX = event.clientX;
      this.lastMixinClientY = event.clientY;
      this.addMixinAt(point);
      try { this.canvas.setPointerCapture(event.pointerId); } catch { /* unavailable */ }
      event.preventDefault();
      return;
    }

    if (this.stage === 'mix') {
      this.mixPointerId = event.pointerId;
      this.mixLastX = event.clientX;
      this.mixLastY = event.clientY;
    }
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (this.activityBlocked) return;
    if (this.stage === 'paint' && event.pointerId === this.authoredPointerId) {
      const point = this.renderer.clientPointToUv(event.clientX, event.clientY);
      if (!point) return;
      const previous = this.authoredPoints[this.authoredPoints.length - 1];
      if (!previous || Math.hypot(point.u - previous.u, point.v - previous.v) < 0.004) return;
      drawAppearanceSegment(this.appearanceContext, this.authoredStrokeMode, this.authoredStrokeColor, this.brushSize, previous, point);
      this.authoredPoints.push(point);
      this.scheduleTextureUpload();
      event.preventDefault();
      return;
    }

    if (this.stage === 'mixins' && event.pointerId === this.authoredPointerId) {
      const distance = Math.hypot(event.clientX - this.lastMixinClientX, event.clientY - this.lastMixinClientY);
      if (distance < MIXIN_SPACING_PX) return;
      const point = this.renderer.clientPointToUv(event.clientX, event.clientY);
      if (!point) return;
      this.lastMixinClientX = event.clientX;
      this.lastMixinClientY = event.clientY;
      this.addMixinAt(point);
      event.preventDefault();
      return;
    }

    if (this.stage === 'mix' && event.pointerId === this.mixPointerId) {
      const distance = Math.hypot(event.clientX - this.mixLastX, event.clientY - this.mixLastY);
      this.mixLastX = event.clientX;
      this.mixLastY = event.clientY;
      if (distance <= 0 || distance > 160) return;
      this.mixDistance += distance;
      const progress = clamp01(this.mixDistance / MIX_DISTANCE_FOR_COMPLETE_PX);
      this.mixProgressFill.style.transform = `scaleX(${progress})`;
      this.mixContinueButton.disabled = progress < 1;
      this.status.textContent = progress >= 1 ? this.copy.mixReady : this.copy.mixMore;
      this.shell.dataset.mixProgress = progress.toFixed(3);
    }
  };

  private readonly handlePointerEnd = (event: PointerEvent): void => {
    if (event.pointerId === this.authoredPointerId) {
      if (this.stage === 'paint') this.finishPaintStroke();
      this.authoredPointerId = null;
      this.authoredPoints = [];
      try { this.canvas.releasePointerCapture(event.pointerId); } catch { /* already released */ }
      event.preventDefault();
    }
    if (event.pointerId === this.mixPointerId) this.mixPointerId = null;
  };

  private finishPaintStroke(): void {
    if (this.authoredPoints.length === 0) return;
    if (this.draft.appearance.strokes.length >= MAX_APPEARANCE_STROKES) {
      this.status.textContent = this.copy.drawingFull;
      this.replayAndUpload();
      return;
    }
    const stroke = createAppearanceStroke(
      this.authoredStrokeMode,
      this.authoredStrokeColor,
      this.brushSize,
      this.authoredPoints,
    );
    const next: AppearanceDocumentV1 = {
      ...this.draft.appearance,
      strokes: [...this.draft.appearance.strokes, stroke],
    };
    if (estimateAppearanceBytes(next) > APPEARANCE_TARGET_BYTES) {
      this.status.textContent = this.copy.drawingFull;
      this.replayAndUpload();
      return;
    }
    this.draft = { ...this.draft, appearance: next };
    this.updateAppearanceDataset();
  }

  private addMixinAt(point: AppearancePoint): void {
    if (this.draft.appearance.mixins.length >= MAX_MIXIN_PLACEMENTS) return;
    const index = this.draft.appearance.mixins.length;
    const size = 10 + ((index * 7 + this.selectedMixIn.length * 3) % 13);
    const rotation = ((index * 37 + this.selectedMixIn.length * 19) % 255) / 255;
    const placement = createMixInPlacement(this.selectedMixIn, point, size, rotation);
    const next: AppearanceDocumentV1 = {
      ...this.draft.appearance,
      mixins: [...this.draft.appearance.mixins, placement],
    };
    if (estimateAppearanceBytes(next) > APPEARANCE_TARGET_BYTES) {
      this.status.textContent = this.copy.drawingFull;
      return;
    }
    this.draft = { ...this.draft, appearance: next };
    replayAppearanceDocument(this.appearanceContext, next);
    this.scheduleTextureUpload();
    this.updateAppearanceDataset();
  }

  private undoPaint(): void {
    if (this.draft.appearance.strokes.length === 0) return;
    this.draft = {
      ...this.draft,
      appearance: { ...this.draft.appearance, strokes: this.draft.appearance.strokes.slice(0, -1) },
    };
    this.replayAndUpload();
  }

  private clearPaint(): void {
    this.draft = { ...this.draft, appearance: { ...this.draft.appearance, strokes: [] } };
    this.replayAndUpload();
  }

  private undoMixin(): void {
    if (this.draft.appearance.mixins.length === 0) return;
    this.draft = {
      ...this.draft,
      appearance: { ...this.draft.appearance, mixins: this.draft.appearance.mixins.slice(0, -1) },
    };
    this.replayAndUpload();
  }

  private clearMixins(): void {
    this.draft = { ...this.draft, appearance: { ...this.draft.appearance, mixins: [] } };
    this.replayAndUpload();
  }

  private beginMix(): void {
    this.mixDistance = 0;
    this.mixProgressFill.style.transform = 'scaleX(0)';
    this.mixContinueButton.disabled = true;
    this.shell.dataset.mixProgress = '0.000';
    this.setStage('mix');
  }

  private async saveDraft(): Promise<void> {
    if (this.saving) return;
    this.saving = true;
    this.saveButton.disabled = true;
    this.saveButton.textContent = this.copy.saving;
    try {
      const saved = await this.options.onSaveSquishy(this.draft);
      this.savedSquishy = saved;
      this.shell.dataset.savedSquishyId = saved.id;
      this.shell.dataset.saveComplete = 'true';
      this.loadSavedSquishy(saved);
      this.setStage('squeeze');
    } catch (error: unknown) {
      console.error('[squishy:sandbox-save]', error);
      this.shell.dataset.saveComplete = 'false';
      this.status.textContent = 'Save failed';
    } finally {
      this.saving = false;
      this.saveButton.disabled = false;
      this.saveButton.textContent = this.copy.save;
    }
  }

  private openSavedForSqueeze(): void {
    if (!this.savedSquishy) return;
    this.loadSavedSquishy(this.savedSquishy);
    this.setStage('squeeze');
  }

  private startNew(): void {
    this.draft = createSandboxDraft();
    this.paintTool = 'paint';
    this.paintColor = PAINT_COLORS[0];
    this.brushSize = BRUSH_SIZES[1];
    this.selectedMixIn = 'glitter';
    this.mixDistance = 0;
    this.replayAndUpload();
    this.applyDraftToRenderer();
    this.updatePressed('[data-shape]', 'shape', this.draft.shapeId);
    this.updatePressed('[data-material]', 'material', this.draft.materialId);
    this.updatePressed('[data-paint-tool]', 'paintTool', 'paint');
    this.updatePressed('[data-paint-color]', 'paintColor', String(this.paintColor));
    this.updatePressed('[data-brush-size]', 'brushSize', String(this.brushSize));
    this.updatePressed('[data-mixin]', 'mixin', this.selectedMixIn);
    this.shell.dataset.saveComplete = 'false';
    this.setStage('shape');
  }

  private loadSavedSquishy(saved: SavedSquishy): void {
    this.draft = {
      shapeId: saved.shapeId,
      materialId: saved.materialId,
      appearance: saved.appearance,
    };
    replayAppearanceDocument(this.appearanceContext, saved.appearance);
    this.applyDraftToRenderer();
    this.uploadAppearanceNow();
    this.updatePressed('[data-shape]', 'shape', saved.shapeId);
    this.updatePressed('[data-material]', 'material', saved.materialId);
    this.updateAppearanceDataset();
  }

  private applyDraftToRenderer(): void {
    this.renderer.setShape(getShape(this.draft.shapeId));
    this.applyMaterial(this.draft.materialId);
    this.shell.dataset.shape = this.draft.shapeId;
    this.shell.dataset.material = this.draft.materialId;
  }

  private applyMaterial(materialId: MaterialId): void {
    const palette = getPalette(BASE_PALETTE_ID);
    const material = getMaterial(materialId);
    const style: SquishMaterialStyle = {
      low: palette.low,
      high: palette.high,
      sheen: palette.sheen,
      rim: palette.rim,
      seed: palette.seed,
      translucency: material.translucency,
      iridescence: material.iridescence,
    };
    this.renderer.setMaterial(style);
    this.shell.dataset.material = materialId;
  }

  private setStage(next: SandboxStage): void {
    this.stage = next;
    this.shell.dataset.stage = next;
    const details = this.stageCopy(next);
    this.stageStep.textContent = details.step;
    this.stageTitle.textContent = details.title;
    this.stageHint.textContent = details.hint;
    this.status.textContent = next === 'mix' ? this.copy.mixMore : '';
    for (const panel of this.root.querySelectorAll<HTMLElement>('[data-panel]')) {
      panel.hidden = panel.dataset.panel !== next;
    }
    this.syncInteractivity();
  }

  private stageCopy(stage: SandboxStage): { step: string; title: string; hint: string } {
    if (stage === 'shape') return { step: '1 / 5', title: this.copy.shape, hint: this.copy.chooseShape };
    if (stage === 'paint') return { step: '2 / 5', title: this.copy.paint, hint: this.copy.paintHint };
    if (stage === 'mixins') return { step: '3 / 5', title: this.copy.mixins, hint: this.copy.mixinsHint };
    if (stage === 'mix') return { step: '4 / 5', title: this.copy.mix, hint: this.copy.mixHint };
    if (stage === 'finish') return { step: '5 / 5', title: this.copy.finish, hint: this.copy.finishHint };
    if (stage === 'home') return { step: '', title: this.copy.home, hint: this.copy.homeHint };
    return { step: '', title: this.copy.squeeze, hint: this.copy.squeezeHint };
  }

  private syncInteractivity(): void {
    const shouldRenderInteract = !this.activityBlocked && (this.stage === 'mix' || this.stage === 'squeeze');
    this.renderer.setInteractive(shouldRenderInteract);
  }

  private scheduleTextureUpload(): void {
    if (this.uploadFrame !== 0) return;
    this.uploadFrame = requestAnimationFrame(() => {
      this.uploadFrame = 0;
      this.uploadAppearanceNow();
    });
  }

  private uploadAppearanceNow(): void {
    const appearance = this.draft.appearance;
    if (appearance.strokes.length === 0 && appearance.mixins.length === 0) this.renderer.setAppearanceTexture(null);
    else this.renderer.setAppearanceTexture(this.appearanceCanvas);
  }

  private replayAndUpload(): void {
    replayAppearanceDocument(this.appearanceContext, this.draft.appearance);
    this.uploadAppearanceNow();
    this.updateAppearanceDataset();
  }

  private updateAppearanceDataset(): void {
    this.shell.dataset.appearanceBytes = String(estimateAppearanceBytes(this.draft.appearance));
    this.shell.dataset.paintStrokes = String(this.draft.appearance.strokes.length);
    this.shell.dataset.mixinCount = String(this.draft.appearance.mixins.length);
  }

  private toggleMuted(): void {
    this.muted = !this.muted;
    this.renderer.setMuted(this.muted);
    this.muteButton.setAttribute('aria-pressed', String(this.muted));
    this.muteButton.textContent = this.muted ? this.copy.muted : this.copy.sound;
    void this.options.onMutedChange(this.muted);
  }

  private updatePressed(selector: string, datasetKey: string, value: string): void {
    for (const button of this.root.querySelectorAll<HTMLButtonElement>(selector)) {
      button.setAttribute('aria-pressed', String(button.dataset[datasetKey] === value));
    }
  }

  private readonly handleMetrics = (metrics: SquishMetrics): void => {
    this.latestMetrics = metrics;
    if (!this.shell || this.disposed) return;
    this.shell.dataset.sandboxSqueezes = String(metrics.squeezes);
    this.shell.dataset.fps = String(Math.round(metrics.fps));
  };

  private requireElement<T extends Element>(selector: string): T {
    const element = this.root.querySelector<T>(selector);
    if (!element) throw new Error(`Sandbox UI missing: ${selector}`);
    return element;
  }
}
