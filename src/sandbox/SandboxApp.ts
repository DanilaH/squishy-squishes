import { MATERIALS, getMaterial, getPalette, type MaterialId } from '../game/content';
import { SquishyAudio } from '../game/SquishyAudio';
import { SHAPES, getShape, type ShapeDefinition, type ShapeId } from '../game/shapes';
import { SquishSurface, type SquishMaterialStyle, type SquishMetrics } from '../squish/SquishSurface';
import type { PhaserSquishSurface, PhaserSandboxCallbacks } from './PhaserSquishSurface';
import {
  APPEARANCE_TARGET_BYTES,
  APPEARANCE_TEXTURE_SIZE,
  MAX_APPEARANCE_STROKES,
  MAX_MIXIN_PLACEMENTS,
  createAppearanceStroke,
  createMixInPlacement,
  drawAppearanceSegment,
  drawAppearanceStamp,
  estimateAppearanceBytes,
  getMixInId,
  replayAppearanceDocument,
  type AppearanceDocumentV1,
  type AppearancePoint,
  type AppearanceStrokeMode,
  type MixInId,
} from './appearance';
import {
  ACCESSORY_IDS,
  EYE_STYLE_IDS,
  MAX_DECOR_STICKERS,
  MOUTH_STYLE_IDS,
  STICKER_IDS,
  createStickerPlacement,
  drawAccessoryGraphic,
  estimateDecorBytes,
  getDecorFrame,
  hasSurfaceDecor,
  renderSurfaceDecor,
  type AccessoryId,
  type EyeStyleId,
  type MouthStyleId,
  type StickerId,
} from './decor';
import { createSandboxDraft, type SandboxDraft, type SavedSquishy } from './types';

export type SandboxLanguage = 'en' | 'ru';
type SandboxStage = 'home' | 'shape' | 'paint' | 'mixins' | 'mix' | 'decor' | 'finish' | 'squeeze';
type PaintTool = 'paint' | 'erase';
type DecorSection = 'face' | 'stickers' | 'accessory';

export interface SandboxAppOptions {
  readonly language: SandboxLanguage;
  readonly muted: boolean;
  readonly savedSquishy: SavedSquishy | null;
  readonly initialShapeId?: ShapeId;
  readonly startSavedInSqueeze?: boolean;
  readonly onExitToLibrary?: () => void;
  readonly rendererBackend?: 'legacy' | 'phaser'; // Phaser is opt-in only in the isolated candidate.
  readonly makePhaserRenderer?: (
    canvas: HTMLCanvasElement,
    onMetrics: (metrics: SquishMetrics) => void,
    audio: SquishyAudio,
    callbacks: PhaserSandboxCallbacks,
  ) => PhaserSquishSurface;
  readonly onSaveSquishy: (draft: SandboxDraft) => Promise<SavedSquishy | null>;
  readonly onMutedChange: (muted: boolean) => void | Promise<void>;
}

interface SandboxCopy {
  readonly studio: string;
  readonly shape: string;
  readonly paint: string;
  readonly mixins: string;
  readonly mix: string;
  readonly decor: string;
  readonly finish: string;
  readonly home: string;
  readonly squeeze: string;
  readonly chooseShape: string;
  readonly paintHint: string;
  readonly mixinsHint: string;
  readonly mixHint: string;
  readonly decorHint: string;
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
  readonly marshmallow: string;
  readonly pearl: string;
  readonly chrome: string;
  readonly face: string;
  readonly stickers: string;
  readonly head: string;
  readonly eyes: string;
  readonly mouth: string;
  readonly none: string;
  readonly blush: string;
  readonly back: string;
}

const COPY: Readonly<Record<SandboxLanguage, SandboxCopy>> = {
  en: {
    studio: 'SQUISHY STUDIO',
    shape: 'CHOOSE A SHAPE',
    paint: 'PAINT IT',
    mixins: 'ADD SPRINKLES',
    mix: 'MIX & STRETCH',
    decor: 'DECORATE',
    finish: 'FINISH IT',
    home: 'YOUR SQUISHY',
    squeeze: 'SQUEEZE IT',
    chooseShape: 'Pick any one. They are all yours.',
    paintHint: 'Draw anything. You can continue whenever you want.',
    mixinsHint: 'Tap or drag to scatter. Skip it if you want.',
    mixHint: 'Grab the squishy and really move it around.',
    decorHint: 'Give it a face, stickers or a little something on top.',
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
    marshmallow: 'Marshmallow',
    pearl: 'Pearl',
    chrome: 'Chrome',
    face: 'Face',
    stickers: 'Stickers',
    head: 'Head',
    eyes: 'Eyes',
    mouth: 'Mouth',
    none: 'None',
    blush: 'Blush',
    back: 'BACK',
  },
  ru: {
    studio: 'СКВИШ-СТУДИЯ',
    shape: 'ВЫБЕРИ ФОРМУ',
    paint: 'РАСКРАСЬ',
    mixins: 'ДОБАВЬ',
    mix: 'ЗАМЕШАЙ',
    decor: 'УКРАСЬ',
    finish: 'ГОТОВО!',
    home: 'ТВОЙ СКВИШ',
    squeeze: 'ЖМЯКАЙ',
    chooseShape: 'Выбирай любую. Все формы уже открыты.',
    paintHint: 'Рисуй что угодно. Продолжить можно в любой момент.',
    mixinsHint: 'Тапай или веди пальцем. Можно вообще пропустить.',
    mixHint: 'Хватай сквиш и хорошенько потяни его.',
    decorHint: 'Добавь мордочку, наклейки или что-нибудь на макушку.',
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
    marshmallow: 'Маршмеллоу',
    pearl: 'Перламутр',
    chrome: 'Хром',
    face: 'Мордочка',
    stickers: 'Наклейки',
    head: 'Макушка',
    eyes: 'Глаза',
    mouth: 'Ротик',
    none: 'Нет',
    blush: 'Румянец',
    back: 'НАЗАД',
  },
};

interface DecorLabels {
  readonly eyes: Readonly<Record<EyeStyleId, string>>;
  readonly mouths: Readonly<Record<MouthStyleId, string>>;
  readonly stickers: Readonly<Record<StickerId, string>>;
  readonly accessories: Readonly<Record<AccessoryId, string>>;
  readonly stickerTip: string;
}

const DECOR_LABELS: Readonly<Record<SandboxLanguage, DecorLabels>> = {
  en: {
    eyes: { dot: 'Dot', happy: 'Happy', sleepy: 'Sleepy' },
    mouths: { smile: 'Smile', o: 'O', cat: 'Cat' },
    stickers: { heart: 'Heart', star: 'Star', flower: 'Flower', sparkle: 'Sparkle' },
    accessories: { 'cat-ears': 'Cat ears', 'bunny-ears': 'Bunny ears', horns: 'Horns', bow: 'Bow', crown: 'Crown' },
    stickerTip: 'Tap the squishy to place it.',
  },
  ru: {
    eyes: { dot: 'Точки', happy: 'Весёлые', sleepy: 'Сонные' },
    mouths: { smile: 'Улыбка', o: 'О', cat: 'Котик' },
    stickers: { heart: 'Сердце', star: 'Звезда', flower: 'Цветок', sparkle: 'Искра' },
    accessories: { 'cat-ears': 'Кошачьи', 'bunny-ears': 'Заячьи', horns: 'Рожки', bow: 'Бант', crown: 'Корона' },
    stickerTip: 'Тапни по сквишу, чтобы наклеить.',
  },
};

const PAINT_COLORS = [0xd58cff, 0x63e6e2, 0xff79a8, 0x92df83, 0xffa46f, 0xffdc70] as const;
const BRUSH_SIZES = [18, 34, 56] as const;
const MIXIN_IDS: readonly MixInId[] = ['glitter', 'stars', 'foam', 'pearls', 'hearts', 'confetti'];
const MIX_DISTANCE_FOR_COMPLETE_PX = 1_650;
const MIXIN_SPACING_PX = 24;
const BASE_PALETTE_ID = 'milk' as const;
const RIGID_MIXIN_IDS: readonly MixInId[] = ['pearls'];

const createPearlSprite = (): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Pearl sprite requires Canvas 2D.');
  const radius = 30;
  const gradient = context.createRadialGradient(23, 22, 1, 32, 32, radius);
  gradient.addColorStop(0, 'rgba(255,255,255,0.99)');
  gradient.addColorStop(0.44, 'rgba(238,232,255,0.97)');
  gradient.addColorStop(0.78, 'rgba(202,216,242,0.94)');
  gradient.addColorStop(1, 'rgba(146,178,214,0.90)');
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(32, 32, radius, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = 'rgba(255,255,255,0.48)';
  context.lineWidth = 1.5;
  context.stroke();
  return canvas;
};

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
  private readonly accessoryCanvas: HTMLCanvasElement;
  private readonly accessoryContext: CanvasRenderingContext2D;
  private readonly rigidMixinCanvas: HTMLCanvasElement;
  private readonly rigidMixinContext: CanvasRenderingContext2D;
  private readonly pearlSprite = createPearlSprite();
  private readonly stageTitle: HTMLElement;
  private readonly stageHint: HTMLElement;
  private readonly stageStep: HTMLElement;
  private readonly status: HTMLElement;
  private readonly mixProgressFill: HTMLElement;
  private readonly mixContinueButton: HTMLButtonElement;
  private readonly saveButton: HTMLButtonElement;
  private readonly muteButton: HTMLButtonElement;
  private readonly renderer: SquishSurface | PhaserSquishSurface;
  private readonly audio = new SquishyAudio();
  private readonly appearanceCanvas = document.createElement('canvas');
  private readonly appearanceContext: CanvasRenderingContext2D;
  private readonly copy: SandboxCopy;

  private stage: SandboxStage;
  private draft: SandboxDraft = createSandboxDraft();
  private savedSquishy: SavedSquishy | null;
  private paintTool: PaintTool = 'paint';
  private paintColor: number = PAINT_COLORS[0];
  private brushSize: number = BRUSH_SIZES[1];
  private selectedMixIn: MixInId = 'glitter';
  private selectedSticker: StickerId = 'heart';
  private decorSection: DecorSection = 'face';
  private authoredPointerId: number | null = null;
  private authoredPoints: AppearancePoint[] = [];
  private authoredStrokeMode: AppearanceStrokeMode = 0;
  private authoredStrokeColor: number = PAINT_COLORS[0];
  private lastMixinClientX = 0;
  private lastMixinClientY = 0;
  private mixPointerId: number | null = null;
  private mixLastX = 0;
  private mixLastY = 0;
  private mixDistance = 0;
  private uploadFrame = 0;
  private accessoryFrame = 0;
  private rigidMixinFrame = 0;
  private accessoryRestU = 0;
  private accessoryRestV = 0;
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
    if (!this.savedSquishy && options.initialShapeId) {
      this.draft = { ...this.draft, shapeId: options.initialShapeId };
    }
    this.muted = options.muted;
    this.stage = this.savedSquishy ? (options.startSavedInSqueeze ? 'squeeze' : 'home') : 'shape';

    this.appearanceCanvas.width = APPEARANCE_TEXTURE_SIZE;
    this.appearanceCanvas.height = APPEARANCE_TEXTURE_SIZE;
    const appearanceContext = this.appearanceCanvas.getContext('2d');
    if (!appearanceContext) throw new Error('Sandbox appearance requires Canvas 2D.');
    this.appearanceContext = appearanceContext;

    root.innerHTML = this.renderShell();
    this.shell = this.requireElement<HTMLElement>('[data-sandbox-app]');
    this.canvas = this.requireElement<HTMLCanvasElement>('[data-sandbox-canvas]');
    this.accessoryCanvas = this.requireElement<HTMLCanvasElement>('[data-sandbox-accessory]');
    this.accessoryCanvas.width = 180;
    this.accessoryCanvas.height = 120;
    const accessoryContext = this.accessoryCanvas.getContext('2d');
    if (!accessoryContext) throw new Error('Sandbox accessory overlay requires Canvas 2D.');
    this.accessoryContext = accessoryContext;
    this.rigidMixinCanvas = this.requireElement<HTMLCanvasElement>('[data-sandbox-rigid-mixins]');
    const rigidMixinContext = this.rigidMixinCanvas.getContext('2d');
    if (!rigidMixinContext) throw new Error('Sandbox rigid mix-in overlay requires Canvas 2D.');
    this.rigidMixinContext = rigidMixinContext;
    this.stageTitle = this.requireElement<HTMLElement>('[data-sandbox-title]');
    this.stageHint = this.requireElement<HTMLElement>('[data-sandbox-hint]');
    this.stageStep = this.requireElement<HTMLElement>('[data-sandbox-step]');
    this.status = this.requireElement<HTMLElement>('[data-sandbox-status]');
    this.mixProgressFill = this.requireElement<HTMLElement>('[data-mix-progress-fill]');
    this.mixContinueButton = this.requireElement<HTMLButtonElement>('[data-action="mix-continue"]');
    this.saveButton = this.requireElement<HTMLButtonElement>('[data-action="save"]');
    this.muteButton = this.requireElement<HTMLButtonElement>('[data-action="mute"]');

    if (options.rendererBackend === 'phaser' && !options.makePhaserRenderer) {
      throw new Error('The isolated Phaser studio needs an explicit renderer factory.');
    }
    this.renderer = options.rendererBackend === 'phaser'
      ? options.makePhaserRenderer!(this.canvas, this.handleMetrics, this.audio, {
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
            this.mixProgressFill.style.transform = `scaleX(${progress})`;
            this.mixContinueButton.disabled = progress < 1;
            this.status.textContent = progress >= 1 ? this.copy.mixReady : this.copy.mixMore;
            this.shell.dataset.mixProgress = progress.toFixed(3);
          },
          onFrame: () => {
            if (!this.rigidMixinCanvas.hidden) this.updateRigidMixinOverlay();
            if (!this.accessoryCanvas.hidden) this.updateAccessoryOverlay();
          },
        })
      : new SquishSurface(this.canvas, this.handleMetrics, this.audio);
    this.renderer.setFillProgress(1);
    this.renderer.setMoldProgress(1);
    this.renderer.setFillingAmount(0);
    this.renderer.setMuted(this.muted);

    this.bindEvents();
    if (this.savedSquishy) this.loadSavedSquishy(this.savedSquishy);
    else this.applyDraftToRenderer();
    this.updateAppearanceDataset();
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
    if (this.accessoryFrame !== 0) cancelAnimationFrame(this.accessoryFrame);
    if (this.rigidMixinFrame !== 0) cancelAnimationFrame(this.rigidMixinFrame);
    this.abortController.abort();
    this.renderer.dispose();
    this.audio.dispose();
  }

  private renderShell(): string {
    const decorLabels = DECOR_LABELS[this.options.language];
    const shapes = SHAPES.map((shape) => `
      <button class="sandbox-shape" type="button" data-shape="${shape.id}" aria-pressed="${shape.id === this.draft.shapeId}">
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
        <span>${this.copy[material.id]}</span>
      </button>
    `).join('');
    const eyeGlyph = (id: EyeStyleId): string => id === 'dot' ? '••' : id === 'happy' ? '⌒⌒' : '﹏﹏';
    const mouthGlyph = (id: MouthStyleId): string => id === 'smile' ? '⌣' : id === 'o' ? '○' : 'ω';
    const stickerGlyph = (id: StickerId): string => id === 'heart' ? '♥' : id === 'star' ? '★' : id === 'flower' ? '✿' : '✦';
    const accessoryGlyph = (id: AccessoryId): string => id === 'cat-ears' ? '▲ ▲' : id === 'bunny-ears' ? '∩ ∩' : id === 'horns' ? '△ △' : id === 'bow' ? '⋈' : '♛';
    const eyes = [null, ...EYE_STYLE_IDS].map((id) => `
      <button class="sandbox-decor-choice" type="button" data-decor-eyes="${id ?? 'none'}" aria-pressed="${id === null}">
        <span>${id ? eyeGlyph(id) : '—'}</span><small>${id ? decorLabels.eyes[id] : this.copy.none}</small>
      </button>
    `).join('');
    const mouths = [null, ...MOUTH_STYLE_IDS].map((id) => `
      <button class="sandbox-decor-choice" type="button" data-decor-mouth="${id ?? 'none'}" aria-pressed="${id === null}">
        <span>${id ? mouthGlyph(id) : '—'}</span><small>${id ? decorLabels.mouths[id] : this.copy.none}</small>
      </button>
    `).join('');
    const stickers = STICKER_IDS.map((id) => `
      <button class="sandbox-decor-choice" type="button" data-decor-sticker="${id}" aria-pressed="${id === this.selectedSticker}">
        <span>${stickerGlyph(id)}</span><small>${decorLabels.stickers[id]}</small>
      </button>
    `).join('');
    const accessories = [null, ...ACCESSORY_IDS].map((id) => `
      <button class="sandbox-decor-choice" type="button" data-decor-accessory="${id ?? 'none'}" aria-pressed="${id === null}">
        <span>${id ? accessoryGlyph(id) : '—'}</span><small>${id ? decorLabels.accessories[id] : this.copy.none}</small>
      </button>
    `).join('');

    return `
      <main class="sandbox-shell" data-sandbox-app data-stage="${this.stage}" data-shape="${this.draft.shapeId}" data-material="soft" data-sandbox-squeezes="0">
        <header class="sandbox-topbar">
          <strong data-sandbox-brand>${this.copy.studio}</strong>
          <button class="sandbox-sound" type="button" data-action="stage-back" hidden>← ${this.copy.back}</button>
          <button class="sandbox-sound" type="button" data-action="mute" aria-pressed="${this.muted}">${this.muted ? this.copy.muted : this.copy.sound}</button>
        </header>

        <section class="sandbox-copy">
          <span data-sandbox-step></span>
          <h1 data-sandbox-title></h1>
          <p data-sandbox-hint></p>
        </section>

        <section class="sandbox-stage" aria-label="Squishy workbench">
          <div class="sandbox-glow" aria-hidden="true"></div>
          <canvas class="sandbox-accessory-layer" data-sandbox-accessory aria-hidden="true" hidden></canvas>
          <canvas class="sandbox-canvas" data-sandbox-canvas aria-label="Squishy"></canvas>
          <canvas class="sandbox-rigid-mixin-layer" data-sandbox-rigid-mixins aria-hidden="true" hidden></canvas>
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

          <div class="sandbox-panel sandbox-panel--decor" data-panel="decor">
            <div class="sandbox-decor-tabs" role="tablist" aria-label="Decor categories">
              <button type="button" data-decor-section="face" aria-pressed="true">☺ <span>${this.copy.face}</span></button>
              <button type="button" data-decor-section="stickers" aria-pressed="false">✦ <span>${this.copy.stickers}</span></button>
              <button type="button" data-decor-section="accessory" aria-pressed="false">♛ <span>${this.copy.head}</span></button>
            </div>
            <div class="sandbox-decor-section" data-decor-panel="face">
              <label>${this.copy.eyes}</label><div class="sandbox-decor-grid sandbox-decor-grid--four">${eyes}</div>
              <label>${this.copy.mouth}</label><div class="sandbox-decor-grid sandbox-decor-grid--four">${mouths}</div>
              <button class="sandbox-decor-toggle" type="button" data-action="decor-blush" aria-pressed="false">● ● <span>${this.copy.blush}</span></button>
            </div>
            <div class="sandbox-decor-section" data-decor-panel="stickers" hidden>
              <div class="sandbox-decor-grid sandbox-decor-grid--four">${stickers}</div>
              <p class="sandbox-decor-tip">${decorLabels.stickerTip}</p>
              <div class="sandbox-tool-row sandbox-tool-row--actions"><button type="button" data-action="decor-undo">${this.copy.undo}</button><button type="button" data-action="decor-clear">${this.copy.clear}</button></div>
            </div>
            <div class="sandbox-decor-section" data-decor-panel="accessory" hidden>
              <div class="sandbox-decor-grid sandbox-decor-grid--three">${accessories}</div>
            </div>
            <button class="sandbox-primary sandbox-panel__wide" type="button" data-action="decor-continue">${this.copy.next}</button>
          </div>

          <div class="sandbox-panel" data-panel="finish">
            <div class="sandbox-material-grid">${materials}</div>
            <div class="sandbox-finish-actions"><button class="sandbox-secondary" type="button" data-action="finish-back">${this.copy.back}</button><button class="sandbox-primary" type="button" data-action="save">${this.copy.save}</button></div>
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
    if (this.options.rendererBackend !== 'phaser') {
      this.canvas.addEventListener('pointerdown', this.handlePointerDown, { signal });
      this.canvas.addEventListener('pointermove', this.handlePointerMove, { signal });
      this.canvas.addEventListener('pointerup', this.handlePointerEnd, { signal });
      this.canvas.addEventListener('pointercancel', this.handlePointerEnd, { signal });
    }
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

    const decorSection = target.dataset.decorSection as DecorSection | undefined;
    if (decorSection === 'face' || decorSection === 'stickers' || decorSection === 'accessory') {
      this.setDecorSection(decorSection);
      return;
    }

    const decorEyes = target.dataset.decorEyes;
    if (decorEyes !== undefined) {
      const eyes = decorEyes === 'none' ? null : decorEyes as EyeStyleId;
      if (eyes === null || EYE_STYLE_IDS.includes(eyes)) {
        this.draft = { ...this.draft, decor: { ...this.draft.decor, eyes } };
        this.replayAndUpload();
        this.updateDecorUi();
      }
      return;
    }

    const decorMouth = target.dataset.decorMouth;
    if (decorMouth !== undefined) {
      const mouth = decorMouth === 'none' ? null : decorMouth as MouthStyleId;
      if (mouth === null || MOUTH_STYLE_IDS.includes(mouth)) {
        this.draft = { ...this.draft, decor: { ...this.draft.decor, mouth } };
        this.replayAndUpload();
        this.updateDecorUi();
      }
      return;
    }

    const decorSticker = target.dataset.decorSticker as StickerId | undefined;
    if (decorSticker && STICKER_IDS.includes(decorSticker)) {
      this.selectedSticker = decorSticker;
      this.updatePressed('[data-decor-sticker]', 'decorSticker', decorSticker);
      return;
    }

    const decorAccessory = target.dataset.decorAccessory;
    if (decorAccessory !== undefined) {
      const accessory = decorAccessory === 'none' ? null : decorAccessory as AccessoryId;
      if (accessory === null || ACCESSORY_IDS.includes(accessory)) {
        this.draft = { ...this.draft, decor: { ...this.draft.decor, accessory } };
        this.refreshAccessoryGraphic();
        this.updateDecorUi();
      }
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
    if (action === 'stage-back') this.goBack();
    else if (action === 'shape-continue') this.setStage('paint');
    else if (action === 'paint-continue') this.setStage('mixins');
    else if (action === 'paint-undo') this.undoPaint();
    else if (action === 'paint-clear') this.clearPaint();
    else if (action === 'mixin-continue') this.beginMix();
    else if (action === 'mixin-undo') this.undoMixin();
    else if (action === 'mixin-clear') this.clearMixins();
    else if (action === 'mix-continue' && this.mixDistance >= MIX_DISTANCE_FOR_COMPLETE_PX) this.setStage('decor');
    else if (action === 'decor-blush') { this.draft = { ...this.draft, decor: { ...this.draft.decor, blush: !this.draft.decor.blush } }; this.replayAndUpload(); this.updateDecorUi(); }
    else if (action === 'decor-undo') this.undoSticker();
    else if (action === 'decor-clear') this.clearStickers();
    else if (action === 'decor-continue') this.setStage('finish');
    else if (action === 'finish-back') this.setStage('decor');
    else if (action === 'save') void this.saveDraft();
    else if (action === 'play-saved') this.openSavedForSqueeze();
    else if (action === 'new') this.startNew();
    else if (action === 'home') {
      if (this.options.onExitToLibrary) this.options.onExitToLibrary();
      else this.setStage(this.savedSquishy ? 'home' : 'shape');
    }
    else if (action === 'mute') this.toggleMuted();
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (this.activityBlocked) return;
    if (this.stage === 'paint') {
      if (this.authoredPointerId !== null) return;
      const point = this.renderer.clientPointToUv(event.clientX, event.clientY);
      this.authoredPointerId = event.pointerId;
      this.authoredPoints = [];
      this.authoredStrokeMode = this.paintTool === 'erase' ? 1 : 0;
      this.authoredStrokeColor = this.paintColor;
      if (point) {
        this.authoredPoints = [point];
        drawAppearanceStamp(this.appearanceContext, this.authoredStrokeMode, this.authoredStrokeColor, this.brushSize, point);
        this.scheduleTextureUpload();
      }
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

    if (this.stage === 'decor' && this.decorSection === 'stickers') {
      const point = this.renderer.clientPointToUv(event.clientX, event.clientY);
      if (!point || this.draft.decor.stickers.length >= MAX_DECOR_STICKERS) return;
      const placement = createStickerPlacement(this.selectedSticker, point, this.draft.decor.stickers.length);
      this.draft = { ...this.draft, decor: { ...this.draft.decor, stickers: [...this.draft.decor.stickers, placement] } };
      this.replayAndUpload();
      this.updateDecorUi();
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
      if (!point) {
        if (this.authoredPoints.length > 0) {
          this.finishPaintStroke();
          this.authoredPoints = [];
        }
        return;
      }
      const previous = this.authoredPoints[this.authoredPoints.length - 1];
      if (!previous) {
        this.authoredPoints = [point];
        drawAppearanceStamp(this.appearanceContext, this.authoredStrokeMode, this.authoredStrokeColor, this.brushSize, point);
        this.scheduleTextureUpload();
        event.preventDefault();
        return;
      }
      if (Math.hypot(point.u - previous.u, point.v - previous.v) < 0.004) return;
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
    replayAppearanceDocument(this.appearanceContext, next, { excludeMixIns: RIGID_MIXIN_IDS });
    this.scheduleTextureUpload();
    this.refreshRigidMixins();
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

  private undoSticker(): void {
    if (this.draft.decor.stickers.length === 0) return;
    this.draft = { ...this.draft, decor: { ...this.draft.decor, stickers: this.draft.decor.stickers.slice(0, -1) } };
    this.replayAndUpload();
    this.updateDecorUi();
  }

  private clearStickers(): void {
    if (this.draft.decor.stickers.length === 0) return;
    this.draft = { ...this.draft, decor: { ...this.draft.decor, stickers: [] } };
    this.replayAndUpload();
    this.updateDecorUi();
  }

  private setDecorSection(next: DecorSection): void {
    this.decorSection = next;
    this.shell.dataset.decorSection = next;
    this.updatePressed('[data-decor-section]', 'decorSection', next);
    for (const panel of this.root.querySelectorAll<HTMLElement>('[data-decor-panel]')) panel.hidden = panel.dataset.decorPanel !== next;
    this.syncInteractivity();
  }

  private updateDecorUi(): void {
    this.updatePressed('[data-decor-eyes]', 'decorEyes', this.draft.decor.eyes ?? 'none');
    this.updatePressed('[data-decor-mouth]', 'decorMouth', this.draft.decor.mouth ?? 'none');
    this.updatePressed('[data-decor-accessory]', 'decorAccessory', this.draft.decor.accessory ?? 'none');
    this.updatePressed('[data-decor-sticker]', 'decorSticker', this.selectedSticker);
    const blush = this.root.querySelector<HTMLButtonElement>('[data-action="decor-blush"]');
    blush?.setAttribute('aria-pressed', String(this.draft.decor.blush));
    this.shell.dataset.decorEyes = this.draft.decor.eyes ?? 'none';
    this.shell.dataset.decorMouth = this.draft.decor.mouth ?? 'none';
    this.shell.dataset.decorBlush = String(this.draft.decor.blush);
    this.shell.dataset.decorStickerCount = String(this.draft.decor.stickers.length);
    this.shell.dataset.decorAccessory = this.draft.decor.accessory ?? 'none';
    this.shell.dataset.decorBytes = String(estimateDecorBytes(this.draft.decor));
    for (const action of ['decor-undo', 'decor-clear']) {
      const button = this.root.querySelector<HTMLButtonElement>(`[data-action="${action}"]`);
      if (button) button.disabled = this.draft.decor.stickers.length === 0;
    }
  }

  private goBack(): void {
    if (this.stage === 'paint') this.setStage('shape');
    else if (this.stage === 'mixins') this.setStage('paint');
    else if (this.stage === 'mix') this.setStage('mixins');
    else if (this.stage === 'decor') this.setStage('mix');
  }

  private beginMix(): void {
    // Re-entering Mix after navigating back must not erase earned progress.
    const progress = Math.min(1, this.mixDistance / MIX_DISTANCE_FOR_COMPLETE_PX);
    this.mixProgressFill.style.transform = `scaleX(${progress})`;
    this.mixContinueButton.disabled = progress < 1;
    this.shell.dataset.mixProgress = progress.toFixed(3);
    this.setStage('mix');
  }

  private async saveDraft(): Promise<void> {
    if (this.saving) return;
    this.saving = true;
    this.saveButton.disabled = true;
    this.saveButton.textContent = this.copy.saving;
    try {
      const saved = await this.options.onSaveSquishy(this.draft);
      if (!saved) {
        this.status.textContent = '';
        return;
      }
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
    this.selectedSticker = 'heart';
    this.decorSection = 'face';
    this.mixDistance = 0;
    this.replayAndUpload();
    this.applyDraftToRenderer();
    this.updatePressed('[data-shape]', 'shape', this.draft.shapeId);
    this.updatePressed('[data-material]', 'material', this.draft.materialId);
    this.updatePressed('[data-paint-tool]', 'paintTool', 'paint');
    this.updatePressed('[data-paint-color]', 'paintColor', String(this.paintColor));
    this.updatePressed('[data-brush-size]', 'brushSize', String(this.brushSize));
    this.updatePressed('[data-mixin]', 'mixin', this.selectedMixIn);
    this.setDecorSection('face');
    this.updateDecorUi();
    this.shell.dataset.saveComplete = 'false';
    this.setStage('shape');
  }

  private loadSavedSquishy(saved: SavedSquishy): void {
    this.draft = {
      shapeId: saved.shapeId,
      materialId: saved.materialId,
      appearance: saved.appearance,
      decor: saved.decor,
    };
    this.applyDraftToRenderer();
    this.replayAndUpload();
    this.updatePressed('[data-shape]', 'shape', saved.shapeId);
    this.updatePressed('[data-material]', 'material', saved.materialId);
    this.updateAppearanceDataset();
    this.updateDecorUi();
  }

  private applyDraftToRenderer(): void {
    this.renderer.setShape(getShape(this.draft.shapeId));
    this.applyMaterial(this.draft.materialId);
    this.shell.dataset.shape = this.draft.shapeId;
    this.shell.dataset.material = this.draft.materialId;
    this.refreshAccessoryGraphic();
  }

  private refreshRigidMixins(): void {
    const hasRigidMixins = this.draft.appearance.mixins.some((placement) => RIGID_MIXIN_IDS.includes(getMixInId(placement)));
    if (!hasRigidMixins) {
      this.rigidMixinCanvas.hidden = true;
      if (this.rigidMixinFrame !== 0) cancelAnimationFrame(this.rigidMixinFrame);
      this.rigidMixinFrame = 0;
      this.rigidMixinContext.clearRect(0, 0, this.rigidMixinCanvas.width, this.rigidMixinCanvas.height);
      return;
    }
    this.rigidMixinCanvas.hidden = false;
    if (this.rigidMixinFrame === 0 && this.options.rendererBackend !== 'phaser') this.rigidMixinFrame = requestAnimationFrame(this.updateRigidMixinOverlay);
  }

  private readonly updateRigidMixinOverlay = (): void => {
    const rigidPlacements = this.draft.appearance.mixins.filter((placement) => RIGID_MIXIN_IDS.includes(getMixInId(placement)));
    if (this.disposed || rigidPlacements.length === 0) {
      this.rigidMixinFrame = 0;
      this.rigidMixinCanvas.hidden = true;
      return;
    }

    const canvasRect = this.canvas.getBoundingClientRect();
    const stageRect = this.canvas.parentElement?.getBoundingClientRect();
    if (stageRect && canvasRect.width > 0 && canvasRect.height > 0) {
      const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
      const pixelWidth = Math.max(1, Math.round(canvasRect.width * dpr));
      const pixelHeight = Math.max(1, Math.round(canvasRect.height * dpr));
      if (this.rigidMixinCanvas.width !== pixelWidth || this.rigidMixinCanvas.height !== pixelHeight) {
        this.rigidMixinCanvas.width = pixelWidth;
        this.rigidMixinCanvas.height = pixelHeight;
      }
      this.rigidMixinCanvas.style.left = `${(canvasRect.left - stageRect.left).toFixed(2)}px`;
      this.rigidMixinCanvas.style.top = `${(canvasRect.top - stageRect.top).toFixed(2)}px`;
      this.rigidMixinCanvas.style.width = `${canvasRect.width.toFixed(2)}px`;
      this.rigidMixinCanvas.style.height = `${canvasRect.height.toFixed(2)}px`;

      const context = this.rigidMixinContext;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, canvasRect.width, canvasRect.height);
      const appearanceScale = Math.min(canvasRect.width, canvasRect.height) * 0.68 / APPEARANCE_TEXTURE_SIZE;
      for (const placement of rigidPlacements) {
        const center = this.renderer.projectUvToCanvas(placement.x / 255, placement.y / 255);
        const radius = Math.max(3.5, placement.s * appearanceScale * 0.5);
        context.drawImage(this.pearlSprite, center.x - radius, center.y - radius, radius * 2, radius * 2);
      }
    }

    if (this.options.rendererBackend !== 'phaser') this.rigidMixinFrame = requestAnimationFrame(this.updateRigidMixinOverlay);
  };

  private refreshAccessoryGraphic(): void {
    const accessory = this.draft.decor.accessory;
    this.accessoryRestU = 0;
    this.accessoryRestV = 0;
    if (!accessory) {
      this.accessoryCanvas.hidden = true;
      this.accessoryCanvas.removeAttribute('data-accessory-id');
      if (this.accessoryFrame !== 0) cancelAnimationFrame(this.accessoryFrame);
      this.accessoryFrame = 0;
      return;
    }
    this.accessoryCanvas.hidden = false;
    this.accessoryCanvas.dataset.accessoryId = accessory;
    drawAccessoryGraphic(this.accessoryContext, accessory, this.accessoryCanvas.width, this.accessoryCanvas.height, this.draft.shapeId);
    if (this.accessoryFrame === 0 && this.options.rendererBackend !== 'phaser') this.accessoryFrame = requestAnimationFrame(this.updateAccessoryOverlay);
  }

  private readonly updateAccessoryOverlay = (): void => {
    if (this.disposed || !this.draft.decor.accessory) {
      this.accessoryFrame = 0;
      return;
    }
    const frame = getDecorFrame(getShape(this.draft.shapeId), this.draft.decor.accessory);
    const anchor = this.renderer.projectUvToCanvas(frame.headAnchor.u, frame.headAnchor.v);
    const right = this.renderer.projectUvToCanvas(frame.headAnchor.u + frame.headBasisU, frame.headAnchor.v);
    const down = this.renderer.projectUvToCanvas(frame.headAnchor.u, frame.headAnchor.v - frame.headBasisV);
    const basisU = { x: right.x - anchor.x, y: right.y - anchor.y };
    const basisV = { x: down.x - anchor.x, y: down.y - anchor.y };
    const lengthU = Math.max(0.001, Math.hypot(basisU.x, basisU.y));
    const lengthV = Math.max(0.001, Math.hypot(basisV.x, basisV.y));
    if (this.accessoryRestU <= 0) this.accessoryRestU = lengthU;
    if (this.accessoryRestV <= 0) this.accessoryRestV = lengthV;
    const clampRatio = (value: number): number => Math.min(1.35, Math.max(0.72, value));
    const ratioU = clampRatio(lengthU / this.accessoryRestU);
    const ratioV = clampRatio(lengthV / this.accessoryRestV);
    const normUx = basisU.x / lengthU;
    const normUy = basisU.y / lengthU;
    const normVx = basisV.x / lengthV;
    const normVy = basisV.y / lengthV;
    const seatOffsetPx = (frame.headSeatOffsetV / frame.headBasisV) * lengthV;
    const a = normUx * ratioU;
    const b = normUy * ratioU;
    const c = normVx * ratioV;
    const d = normVy * ratioV;
    const canvasRect = this.canvas.getBoundingClientRect();
    const stageRect = this.canvas.parentElement?.getBoundingClientRect();
    if (stageRect) {
      const anchorX = canvasRect.left - stageRect.left + anchor.x - normVx * seatOffsetPx;
      const anchorY = canvasRect.top - stageRect.top + anchor.y - normVy * seatOffsetPx;
      const width = this.accessoryCanvas.offsetWidth || 160;
      const height = this.accessoryCanvas.offsetHeight || 107;
      // Pages' live overlay previously left the broad crown/bow visibly hovering
      // even after the shared surface anchor was correct in Hall. Seat only these
      // Phaser preview assets a few pixels deeper; ordinary/Yandex keeps the
      // established overlay position.
      const liveSeatFactor = this.options.rendererBackend === 'phaser'
        ? (this.draft.decor.accessory === 'crown' ? 0.80 : this.draft.decor.accessory === 'bow' ? 0.87 : 0.92)
        : 0.92;
      this.accessoryCanvas.style.left = (anchorX - width * 0.5).toFixed(2) + 'px';
      this.accessoryCanvas.style.top = (anchorY - height * liveSeatFactor).toFixed(2) + 'px';
      this.accessoryCanvas.style.transform = 'matrix(' + [a, b, c, d].map((value) => value.toFixed(4)).join(',') + ',0,0)';
      this.accessoryCanvas.dataset.accessoryAnchorX = anchorX.toFixed(2);
      this.accessoryCanvas.dataset.accessoryAnchorY = anchorY.toFixed(2);
      this.accessoryCanvas.dataset.accessoryMatrix = [a, b, c, d].map((value) => value.toFixed(4)).join(',');
    }
    if (this.options.rendererBackend !== 'phaser') this.accessoryFrame = requestAnimationFrame(this.updateAccessoryOverlay);
  };

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
      roughness: material.roughness,
      metallic: material.metallic,
      pearlescence: material.pearlescence,
      cloudiness: material.cloudiness,
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
    this.status.textContent = next === 'mix'
      ? (this.mixDistance >= MIX_DISTANCE_FOR_COMPLETE_PX ? this.copy.mixReady : this.copy.mixMore) : '';
    const canGoBack = next === 'paint' || next === 'mixins' || next === 'mix' || next === 'decor';
    this.requireElement<HTMLButtonElement>('[data-action="stage-back"]').hidden = !canGoBack;
    this.requireElement<HTMLElement>('[data-sandbox-brand]').hidden = canGoBack;
    for (const panel of this.root.querySelectorAll<HTMLElement>('[data-panel]')) {
      panel.hidden = panel.dataset.panel !== next;
    }
    this.syncInteractivity();
  }

  private stageCopy(stage: SandboxStage): { step: string; title: string; hint: string } {
    if (stage === 'shape') return { step: '1 / 6', title: this.copy.shape, hint: this.copy.chooseShape };
    if (stage === 'paint') return { step: '2 / 6', title: this.copy.paint, hint: this.copy.paintHint };
    if (stage === 'mixins') return { step: '3 / 6', title: this.copy.mixins, hint: this.copy.mixinsHint };
    if (stage === 'mix') return { step: '4 / 6', title: this.copy.mix, hint: this.copy.mixHint };
    if (stage === 'decor') return { step: '5 / 6', title: this.copy.decor, hint: this.copy.decorHint };
    if (stage === 'finish') return { step: '6 / 6', title: this.copy.finish, hint: this.copy.finishHint };
    if (stage === 'home') return { step: '', title: this.copy.home, hint: this.copy.homeHint };
    return { step: '', title: this.copy.squeeze, hint: this.copy.squeezeHint };
  }

  private syncInteractivity(): void {
    if (this.options.rendererBackend === 'phaser') {
      (this.renderer as PhaserSquishSurface).setStudioStage(this.stage, this.decorSection);
      (this.renderer as PhaserSquishSurface).setActivityBlocked(this.activityBlocked);
      return;
    }
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
    if (appearance.strokes.length === 0 && appearance.mixins.length === 0 && !hasSurfaceDecor(this.draft.decor)) this.renderer.setAppearanceTexture(null);
    else this.renderer.setAppearanceTexture(this.appearanceCanvas);
  }

  private replayAndUpload(): void {
    replayAppearanceDocument(this.appearanceContext, this.draft.appearance, { excludeMixIns: RIGID_MIXIN_IDS });
    renderSurfaceDecor(this.appearanceContext, this.draft.decor, getShape(this.draft.shapeId));
    this.uploadAppearanceNow();
    this.refreshRigidMixins();
    this.updateAppearanceDataset();
  }

  private updateAppearanceDataset(): void {
    this.shell.dataset.appearanceBytes = String(estimateAppearanceBytes(this.draft.appearance));
    this.shell.dataset.paintStrokes = String(this.draft.appearance.strokes.length);
    this.shell.dataset.mixinCount = String(this.draft.appearance.mixins.length);
    for (const [action, empty] of [
      ['paint-undo', this.draft.appearance.strokes.length === 0],
      ['paint-clear', this.draft.appearance.strokes.length === 0],
      ['mixin-undo', this.draft.appearance.mixins.length === 0],
      ['mixin-clear', this.draft.appearance.mixins.length === 0],
    ] as const) {
      const button = this.root.querySelector<HTMLButtonElement>(`[data-action="${action}"]`);
      if (button) button.disabled = empty;
    }
    this.updateDecorUi();
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
