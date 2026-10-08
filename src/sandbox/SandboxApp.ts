import { drawFaceForeground } from './faceForeground';
import { LIGHT_PRESETS, type CraftLight } from './craftLighting';
import { DraftHistory } from './draftHistory';
import { FreeCraftEditor } from './freeCraftEditor';
import { mountCraftWorkspace } from './craftWorkspace';
import { mountCatalogScrollHints } from './catalogScrollHints';
import { tintAccessory, accessoryPlacements, accessoryFrame, initialAccessoryPlacements, MAX_ACCESSORY_PLACEMENTS } from './freeCraft';
import { renderToyInclusions, renderToyInk, renderToyPigment } from './toySurfaceLayers';
import { accessoryMotion } from './toyPersonality';
import { contactFeedback } from './livingToy';
import { CREATIVE_PALETTES, PAINT_STAMPS, createPaintStamp, type PaintStampId } from './creativeTools';
import { REST_FACE, faceReaction, heldFaceStrength, type FaceReaction } from './toyReactions';
import { getAccessoryDepth, getAccessorySeatFactor } from './accessorySeats';
import { drawToyAccessory } from './toyArt';
import { drawPagesFaceChoice, drawPagesStickerChoice } from './pagesDecorArt';
import { drawToyMixIn } from './toyMixins';
import { hasShapeRelief, shapeReliefSvg } from './shapeRelief';
import { MATERIALS, getMaterial, getPalette, type MaterialId } from '../game/content';
import { SquishyAudio } from '../game/SquishyAudio';
import { SHAPES, getShape, getShapeContours, shapeSvgPath, isPointInsideShape, type ShapeDefinition, type ShapeId } from '../game/shapes';
import { SquishSurface, type SquishMaterialStyle, type SquishMetrics } from '../squish/SquishSurface';
import type { PhaserSquishSurface, PhaserSandboxCallbacks } from './PhaserSquishSurface';
import {
  APPEARANCE_TEXTURE_SIZE,
  MAX_MIXIN_PLACEMENTS,
  createAppearanceStroke,
  createBodyFillStroke,
  createMixInPlacement,
  drawAppearanceSegment,
  drawAppearanceStamp,
  estimateAppearanceBytes,
  getMixInId,
  isBodyFillStroke,
  replayAppearanceDocument,
  type AppearanceDocumentV1,
  type AppearancePoint,
  type AppearanceStrokeMode,
  decodeAppearancePoints,
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
  drawAccessoryPiece,
  estimateDecorBytes,
  getDecorFrame,
  hasSurfaceDecor,
  renderSurfaceDecor,
  renderSurfaceFace,
  renderSurfaceStickers,
  type AccessoryId,
  type EyeStyleId,
  type MouthStyleId,
  type StickerId,
  type StickerPlacementV1,
} from './decor';
import { captureModalReturnFocus, focusModal, restoreModalFocus, trapModalTab } from './modalFocus';
import { createSandboxDraft, type SandboxDraft, type SavedSquishy } from './types';

export type SandboxLanguage = 'en' | 'ru';
type SandboxStage = 'home' | 'shape' | 'paint' | 'mixins' | 'mix' | 'decor' | 'finish' | 'squeeze';
type PaintTool = 'paint' | 'erase' | 'fill';
type DecorSection = 'face' | 'stickers' | 'accessory' | 'objects';

export interface SandboxAppOptions {
  readonly language: SandboxLanguage;
  readonly muted: boolean;
  readonly savedSquishy: SavedSquishy | null;
  readonly initialShapeId?: ShapeId;
  readonly startSavedInSqueeze?: boolean;
  readonly onExitToLibrary?: () => void;
  readonly onResetCraftContext?: () => void;
  readonly rendererBackend?: 'legacy' | 'phaser'; // Phaser is opt-in only in the isolated candidate.
  readonly makePhaserRenderer?: (
    canvas: HTMLCanvasElement,
    onMetrics: (metrics: SquishMetrics) => void,
    audio: SquishyAudio,
    callbacks: PhaserSandboxCallbacks,
  ) => PhaserSquishSurface;
  readonly onSaveSquishy: (draft: SandboxDraft, editingId: string | null) => Promise<SavedSquishy | null>;
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
  readonly fill: string;
  readonly exit: string;
  readonly exitTitle: string;
  readonly exitHint: string;
  readonly stay: string;
  readonly leave: string;
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
  readonly workbenchLabel: string;
  readonly squishyLabel: string;
  readonly decorCategories: string;
  readonly colorLabel: string;
  readonly saveFailed: string;
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
    paintHint: 'Draw freely. Tap Brush ▾ for palettes and stamps.',
    mixinsHint: 'Tap or drag to scatter. Skip it if you want.',
    mixHint: 'Grab the squishy and really move it around.',
    decorHint: 'Give it a face, stickers or a little something on top.',
    finishHint: 'Choose a material, then pull the squishy to feel it before you keep it.',
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
    fill: 'Fill',
    exit: 'EXIT',
    exitTitle: 'Leave this squishy?',
    exitHint: 'Unsaved changes will be lost.',
    stay: 'STAY',
    leave: 'LEAVE',
    mixReady: 'Nice. It is mixed!',
    mixMore: 'Keep stretching…',
    drawingFull: 'Mix-in tray is full. Undo or clear to add more.',
    muted: 'Sound off',
    sound: 'Sound on',
    soft: 'Soft',
    jelly: 'Jelly',
    holo: 'Holo',
    marshmallow: 'Marshmallow',
    pearl: 'Pearl',
    chrome: 'Metallic',
    face: 'Face',
    stickers: 'Stickers',
    head: 'Details',
    eyes: 'Eyes',
    mouth: 'Mouth',
    none: 'None',
    blush: 'Blush',
    back: 'BACK',
    workbenchLabel: 'Squishy workbench',
    squishyLabel: 'Squishy',
    decorCategories: 'Decor categories',
    colorLabel: 'Color',
    saveFailed: 'Save failed. Try again.',
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
    paintHint: 'Рисуй свободно. Кисть ▾ открывает палитры и штампы.',
    mixinsHint: 'Тапай или веди пальцем. Можно вообще пропустить.',
    mixHint: 'Хватай сквиш и хорошенько потяни его.',
    decorHint: 'Добавь мордочку, наклейки или что-нибудь на макушку.',
    finishHint: 'Выбери материал, потяни сквиша и почувствуй его перед сохранением.',
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
    fill: 'Заливка',
    exit: 'ВЫЙТИ',
    exitTitle: 'Выйти из студии?',
    exitHint: 'Несохранённые изменения пропадут.',
    stay: 'ОСТАТЬСЯ',
    leave: 'ВЫЙТИ',
    mixReady: 'Отлично замешано!',
    mixMore: 'Ещё немного потяни…',
    drawingFull: 'Наполнителей достаточно. Отмени или очисти, чтобы добавить ещё.',
    muted: 'Звук выкл.',
    sound: 'Звук вкл.',
    soft: 'Мягкий',
    jelly: 'Желе',
    holo: 'Голографик',
    marshmallow: 'Маршмеллоу',
    pearl: 'Перламутр',
    chrome: 'Металлик',
    face: 'Мордочка',
    stickers: 'Наклейки',
    head: 'Детали',
    eyes: 'Глаза',
    mouth: 'Ротик',
    none: 'Нет',
    blush: 'Румянец',
    back: 'НАЗАД',
    workbenchLabel: 'Стол для сквиша',
    squishyLabel: 'Сквиш',
    decorCategories: 'Категории украшений',
    colorLabel: 'Цвет',
    saveFailed: 'Не удалось сохранить. Попробуй ещё раз.',
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
    accessories: { 'cat-ears': 'Cat ears', 'bunny-ears': 'Bunny ears', horns: 'Horns', bow: 'Bow', crown: 'Crown', glasses:'Glasses', headphones:'Headphones', 'bucket-hat':'Bucket hat', 'petal-flower':'Flower', leaves:'Leaves', butterfly:'Butterfly', cream:'Cream', cherry:'Cherry', 'heart-patch':'Heart patch', handbag:'Bag', wings:'Wings' },
    stickerTip: 'Tap the squishy to place it.',
  },
  ru: {
    eyes: { dot: 'Точки', happy: 'Весёлые', sleepy: 'Сонные' },
    mouths: { smile: 'Улыбка', o: 'О', cat: 'Котик' },
    stickers: { heart: 'Сердце', star: 'Звезда', flower: 'Цветок', sparkle: 'Искра' },
    accessories: { 'cat-ears': 'Кошачьи', 'bunny-ears': 'Заячьи', horns: 'Рожки', bow: 'Бант', crown: 'Корона', glasses:'Очки', headphones:'Наушники', 'bucket-hat':'Панамка', 'petal-flower':'Цветок', leaves:'Листики', butterfly:'Бабочка', cream:'Сливки', cherry:'Вишенка', 'heart-patch':'Пластырь', handbag:'Сумочка', wings:'Крылышки' },
    stickerTip: 'Тапни по сквишу, чтобы наклеить.',
  },
};

const SHAPE_LABELS: Readonly<Record<SandboxLanguage, Readonly<Record<ShapeId, string>>>> = {
  en: {
    'soft-square': 'Soft Cube',
    heart: 'Heart',
    mochi: 'Mochi',
    peach: 'Peach',
    mushroom: 'Mushroom',
    paw: 'Paw',
    dumpling: 'Dumpling',
    strawberry: 'Strawberry',
  donut: 'Donut',
  bun: 'Puffy Bun', 'ice-cream': 'Ice Cream', cupcake: 'Cupcake', watermelon: 'Watermelon', 'mochi-cat': 'Mochi Cat', 'mochi-bunny': 'Mochi Bunny',
  },
  ru: {
    'soft-square': 'Кубик',
    heart: 'Сердечко',
    mochi: 'Моти',
    peach: 'Персик',
    mushroom: 'Грибочек',
    paw: 'Лапка',
    dumpling: 'Дамплинг',
    strawberry: 'Клубничка',
  donut: 'Пончик',
  bun: 'Булочка', 'ice-cream': 'Мороженое', cupcake: 'Кексик', watermelon: 'Арбузик', 'mochi-cat': 'Котик-моти', 'mochi-bunny': 'Зайчик-моти',
  },
};

const MIXIN_LABELS: Readonly<Record<SandboxLanguage, Readonly<Record<MixInId, string>>>> = {
  en: { glitter: 'Glitter', stars: 'Stars', foam: 'Foam', pearls: 'Pearls', hearts: 'Hearts', confetti: 'Confetti', crescents:'Crescents', bubbles:'Bubbles', 'strawberry-slices':'Berry slices', 'lemon-slices':'Lemon slices', 'kiwi-slices':'Kiwi slices', flowers:'Flowers', flakes:'Pearl flakes' },
  ru: { glitter: 'Блёстки', stars: 'Звёзды', foam: 'Пена', pearls: 'Жемчужины', hearts: 'Сердечки', confetti: 'Конфетти', crescents:'Полумесяцы', bubbles:'Пузырьки', 'strawberry-slices':'Клубника', 'lemon-slices':'Лимон', 'kiwi-slices':'Киви', flowers:'Цветочки', flakes:'Хлопья' },
};

const PAINT_COLORS = [
  0xd58cff, 0x63e6e2, 0xff79a8, 0x92df83, 0xffa46f, 0xffdc70,
  0xf8f1df, 0xffb6c8, 0x8fd3ff, 0xb7f2cf, 0xb9a0ff, 0xff6f61,
  0x48bfe3, 0xb8e34a, 0xd94f9d, 0x2f8f83, 0x6d3a8a, 0x9a6b52,
] as const;
const PAINT_COLOR_LABELS: Readonly<Record<SandboxLanguage, readonly string[]>> = {
  en: ['Orchid', 'Turquoise', 'Pink', 'Green', 'Peach', 'Yellow', 'Ivory', 'Rose', 'Sky blue', 'Mint', 'Lavender', 'Coral', 'Cyan', 'Lime', 'Magenta', 'Teal', 'Purple', 'Brown'],
  ru: ['Орхидея', 'Бирюзовый', 'Розовый', 'Зелёный', 'Персиковый', 'Жёлтый', 'Слоновая кость', 'Нежно-розовый', 'Голубой', 'Мятный', 'Лавандовый', 'Коралловый', 'Лазурный', 'Лаймовый', 'Малиновый', 'Морская волна', 'Фиолетовый', 'Коричневый'],
};
const BRUSH_SIZE_LABELS: Readonly<Record<SandboxLanguage, readonly string[]>> = {
  en: ['Small brush', 'Medium brush', 'Large brush'],
  ru: ['Маленькая кисть', 'Средняя кисть', 'Большая кисть'],
};
const BRUSH_SIZES = [18, 34, 56] as const;
const MIXIN_IDS: readonly MixInId[] = ['glitter', 'stars', 'foam', 'pearls', 'hearts', 'confetti', 'crescents', 'bubbles', 'strawberry-slices', 'lemon-slices', 'kiwi-slices', 'flowers', 'flakes'];
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
  context.translate(32, 32);
  drawToyMixIn(context, 'pearls', 30);
  return canvas;
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const shapeSvg = (shape: ShapeDefinition): string => {
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><path fill-rule="evenodd" d="${shapeSvgPath(shape)}" />${shapeReliefSvg(shape.id)}</svg>`;
};

export class SandboxApp {
  private readonly abortController = new AbortController();
  private readonly shell: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly accessoryCanvas: HTMLCanvasElement;
  private readonly accessorySecond = document.createElement('canvas');
  private readonly extraAccessories: HTMLCanvasElement[] = [];
  private readonly foregroundFace = document.createElement('canvas');
  private readonly foregroundFaceSource = document.createElement('canvas');
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
  private readonly inclusionCanvas = document.createElement('canvas');
  private readonly faceCanvas = document.createElement('canvas');
  private readonly faceContext: CanvasRenderingContext2D;
  private readonly copy: SandboxCopy;

  private stage: SandboxStage;
  private readonly draftHistory = new DraftHistory();
  private readonly freeEditor: FreeCraftEditor;
  private draftValue: SandboxDraft = createSandboxDraft();
  private cleanDraft = JSON.stringify(this.draftValue);
  private get draft(): SandboxDraft { return this.draftValue; }
  private set draft(value: SandboxDraft) { this.draftHistory.record(this.draftValue, value); this.draftValue = value; }
  private savedSquishy: SavedSquishy | null;
  private paintTool: PaintTool = 'paint';
  private paintStampId: PaintStampId | null = null;
  private editingId: string | null = null;
  private stickerErase = false;
  private toolsOpen = false;
  private toolsReturnFocus: HTMLElement | null = null;
  private readonly reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  private reaction: FaceReaction = REST_FACE;
  private reactionKey = '0:0';
  private gestureActive = false;
  private gestureBeganAt = -Infinity;
  private gestureStrength = 0;
  private contactKey = '';
  private lastPress = 0;
  private lastCompression = 0;
  private strokeDelight = 0;
  private stretchReaction = 0;
  private gestureHintSeen = false;
  private releaseStrength = 0;
  private releasedAt = -Infinity;
  private paintColor: number = PAINT_COLORS[0];
  private brushSize: number = BRUSH_SIZES[1];
  private selectedMixIn: MixInId = 'glitter';
  private mixinErase = false;
  private tryOn = false;
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
  private accessorySelectionFrame: HTMLDivElement | null = null;
  private readonly accessoryInkBounds = new WeakMap<HTMLCanvasElement, { x: number; y: number; width: number; height: number }>();
  private rigidMixinFrame = 0;
  private accessoryRestU = [0, 0];
  private accessoryRestV = [0, 0];
  private muted = false;
  private activityBlocked = false;
  private placementAnimation: Animation | null = null;
  private sprinkle: HTMLElement | null = null;
  private stickerPreview: HTMLElement | null = null;
  private stickerPreviewKey = '';
  private roomReaction: Animation | null = null;
  private roomLight: Animation | null = null;
  private readonly sprinkleImages = new Map<MixInId, string>();
  private appearanceLimitReached = false;
  private exitConfirmOpen = false;
  private exitReturnFocus: HTMLElement | null = null;
  private saving = false;
  private disposed = false;
  private readonly disposeCatalogScrollHints: () => void;

  public constructor(
    private readonly root: HTMLDivElement,
    private readonly options: SandboxAppOptions,
  ) {
    this.copy = COPY[options.language];
    this.savedSquishy = options.savedSquishy;
    if (!this.savedSquishy && options.initialShapeId) {
      this.draft = { ...this.draft, shapeId: options.initialShapeId };
    }
    this.cleanDraft = JSON.stringify(this.draft);
    this.muted = options.muted;
    this.stage = this.savedSquishy ? (options.startSavedInSqueeze ? 'squeeze' : 'home') : 'shape';

    this.appearanceCanvas.width = APPEARANCE_TEXTURE_SIZE;
    this.appearanceCanvas.height = APPEARANCE_TEXTURE_SIZE;
    const appearanceContext = this.appearanceCanvas.getContext('2d');
    if (!appearanceContext) throw new Error('Sandbox appearance requires Canvas 2D.');
    this.appearanceContext = appearanceContext;
    this.faceCanvas.width = APPEARANCE_TEXTURE_SIZE;
    this.faceCanvas.height = APPEARANCE_TEXTURE_SIZE;
    const faceContext = this.faceCanvas.getContext('2d');
    if (!faceContext) throw new Error('Sandbox face overlay requires Canvas 2D.');
    this.faceContext = faceContext;

    root.innerHTML = this.renderShell();
    mountCraftWorkspace(root, this.options.language === 'ru');
    this.disposeCatalogScrollHints = mountCatalogScrollHints(root, this.abortController.signal);
    this.shell = this.requireElement<HTMLElement>('[data-sandbox-app]');
    for (const icon of this.root.querySelectorAll<HTMLCanvasElement>('[data-mixin-icon]')) {
      const ctx = icon.getContext('2d'); const id = icon.dataset.mixinIcon as MixInId;
      if (!ctx) continue;
      for (const [x, y, radius, angle, variation] of [[28, 34, 13, -.25, 0], [50, 23, 17, .2, 1], [71, 37, 12, .4, 2]] as const) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(angle); drawToyMixIn(ctx, id, radius, variation); ctx.restore();
      }
      this.sprinkleImages.set(id, icon.toDataURL());
    }
    for (const icon of this.root.querySelectorAll<HTMLCanvasElement>('[data-accessory-icon]')) {
      const ctx = icon.getContext('2d'); const id = icon.dataset.accessoryIcon as AccessoryId;
      if (ctx && !drawToyAccessory(ctx, id, 180, 120, undefined, true)) drawAccessoryGraphic(ctx, id, 180, 120);
    }
    for (const icon of this.root.querySelectorAll<HTMLCanvasElement>('[data-face-icon]')) {
      const ctx = icon.getContext('2d');
      if (ctx) drawPagesFaceChoice(ctx, icon.dataset.faceIcon as 'eyes' | 'mouth', icon.dataset.faceStyle as EyeStyleId | MouthStyleId, icon.width, icon.height);
    }
    for (const icon of this.root.querySelectorAll<HTMLCanvasElement>('[data-sticker-icon]')) {
      const ctx = icon.getContext('2d');
      if (ctx) drawPagesStickerChoice(ctx, icon.dataset.stickerIcon as StickerId, icon.width, icon.height);
    }
    this.canvas = this.requireElement<HTMLCanvasElement>('[data-sandbox-canvas]');
    this.accessoryCanvas = this.requireElement<HTMLCanvasElement>('[data-sandbox-accessory]');
    this.accessoryCanvas.width = 180;
    this.accessoryCanvas.height = 120;
    const accessoryContext = this.accessoryCanvas.getContext('2d');
    if (!accessoryContext) throw new Error('Sandbox accessory overlay requires Canvas 2D.');
    this.accessorySecond.width = 180; this.accessorySecond.height = 120;
    this.accessorySecond.className = 'sandbox-accessory-layer';
    this.accessorySecond.setAttribute('aria-hidden', 'true');
    this.accessorySecond.dataset.accessoryPart = 'right'; this.accessorySecond.hidden = true;
    this.accessoryCanvas.after(this.accessorySecond);
    this.foregroundFace.className='free-face-foreground';this.foregroundFace.setAttribute('aria-hidden','true');this.foregroundFace.hidden=true;
    this.foregroundFaceSource.width=this.foregroundFaceSource.height=256;
    this.accessorySecond.after(this.foregroundFace);
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
          authoringBegin: () => this.draftHistory.begin(this.draft),
          authoringEnd: () => { this.draftHistory.end(this.draft); this.updateHistoryUi(); },
          beginDecorEdit: pointer => {
            if (!this.freeEditor.begin(pointer)) return false;
            this.setDecorSection('objects'); return true;
          },
          moveDecorEdit: pointer => this.freeEditor.move(pointer),
          endDecorEdit: cancelled => { this.freeEditor.end(cancelled); this.updateHistoryUi(); },
          paintStamp: (point) => {
            if (this.paintStampId && this.paintTool === 'paint') { this.applyPaintStamp(point); return; }
            if (this.paintTool === 'fill') {
              this.applyPaintFill(point);
              return;
            }
            this.authoredStrokeMode = this.paintTool === 'erase' ? 1 : 0;
            this.authoredStrokeColor = this.paintColor;
            this.authoredPoints = [point];
            drawAppearanceStamp(this.appearanceContext, this.authoredStrokeMode, this.authoredStrokeColor, this.brushSize, point);
            this.uploadAppearanceNow();
          },
          paintSegment: (from, to) => {
            if ((this.paintStampId && this.paintTool === 'paint') || this.paintTool === 'fill') return;
            drawAppearanceSegment(this.appearanceContext, this.authoredStrokeMode, this.authoredStrokeColor, this.brushSize, from, to);
            this.authoredPoints.push(to);
            this.uploadAppearanceNow();
          },
          paintEnd: () => {
            if (this.paintTool !== 'fill') this.finishPaintStroke();
            this.authoredPoints = [];
          },
          mixinSpacing: () => 24 / (this.draft.appearance.mixinBrush?.density ?? 1),
          addMixin: (point) => this.addMixinAt(point),
          addSticker: (point) => this.editStickerAt(point),
          previewSticker: (point) => this.previewStickerAt(point),
          mixProgress: (distance, progress) => {
            // A saved toy has already completed Mix. Revisiting it is optional;
            // the gesture router still owns physical input and its own distance.
            if (this.editingId) { distance = Math.max(distance, MIX_DISTANCE_FOR_COMPLETE_PX); progress = 1; }
            this.mixDistance = distance;
            this.mixProgressFill.style.transform = `scaleX(${progress})`;
            this.mixContinueButton.disabled = progress < 1;
            this.status.textContent = progress >= 1 ? this.copy.mixReady : this.copy.mixMore;
            this.shell.dataset.mixProgress = progress.toFixed(3);
          },
          onSquishBegin: () => {
            this.gestureBeganAt = performance.now();
            this.gestureActive = true;
            this.gestureHintSeen = true;
            if (this.stage === 'squeeze') this.stageHint.textContent = this.copy.squeezeHint;
            this.releasedAt = -Infinity;
          },
          onSquishRelease: (energy) => {
            this.releasedAt = performance.now();
            this.releaseStrength = Math.min(1, Math.max(this.gestureStrength, energy));
            if (this.stage === 'squeeze') this.reactWorkshop(energy);
            this.gestureActive = false; this.gestureStrength = 0;
          },
          onSquishCancel: () => {
            this.releasedAt = -Infinity; this.releaseStrength = 0;
            this.gestureActive = false; this.gestureStrength = 0;
          },
          onFrame: () => {
            this.updateToyReaction();
            this.updateContactFeedback();
            if (!this.rigidMixinCanvas.hidden) this.updateRigidMixinOverlay();
            if (!this.accessoryCanvas.hidden) this.updateAccessoryOverlay();
            this.updateObjectSelection();
          },
        })
      : new SquishSurface(this.canvas, this.handleMetrics, this.audio);
    this.renderer.setFillProgress(1);
    this.renderer.setMoldProgress(1);
    this.renderer.setFillingAmount(0);
    this.renderer.setMuted(this.muted);

    this.freeEditor = new FreeCraftEditor(this.shell, this.options.language === 'ru', {
      get: () => this.draft,
      set: decor => { this.draft = {...this.draft, decor}; this.refreshAccessoryGraphic(); this.replayAndUpload(); },
      project: (u, v) => { const p = this.renderer.projectUvToCanvas(u, v), rect = this.canvas.getBoundingClientRect(); return {x: rect.left + p.x, y: rect.top + p.y}; },
      blocked: () => this.activityBlocked || this.saving || this.exitConfirmOpen,
      accessoryHit: (index, x, y) => this.accessoryHit(index, x, y),
      radius: () => { const rect = this.canvas.getBoundingClientRect(); return Math.min(rect.width, rect.height) * (Number.parseFloat(getComputedStyle(this.canvas).getPropertyValue('--squish-radius-ratio')) || .34); },
      begin: () => this.draftHistory.begin(this.draft),
      end: () => { this.draftHistory.end(this.draft); this.updateHistoryUi(); },
    });
    this.bindEvents();
    if (this.savedSquishy) this.loadSavedSquishy(this.savedSquishy);
    else this.applyDraftToRenderer();
    this.updateAppearanceDataset();
    this.setStage(this.stage);
    this.draftHistory.clear();
    this.updateAppearanceDataset(); this.updateHistoryUi();
    this.freeEditor.refresh();
  }

  public setActivityBlocked(blocked: boolean): void {
    if (this.disposed) return;
    if (blocked) { this.freeEditor.end(true); this.draftHistory.end(this.draft); this.updateHistoryUi(); }
    this.activityBlocked = blocked;
    this.audio.setActivityBlocked(blocked);
    if (blocked && this.toolsOpen) this.setToolsOpen(false);
    if (blocked) { this.clearPlacementFeedback(); this.roomReaction?.cancel(); this.roomLight?.cancel(); this.shell.dataset.workshopReaction = 'rest'; }
    this.shell.classList.toggle('is-blocked', blocked);
    this.shell.setAttribute('aria-busy', String(blocked));
    this.syncInteractivity();
  }

  public dispose(): void {
    if (this.disposed) return;
    this.previewStickerAt(null); this.roomReaction?.cancel(); this.roomLight?.cancel();
    this.disposed = true;
    if (this.uploadFrame !== 0) cancelAnimationFrame(this.uploadFrame);
    if (this.accessoryFrame !== 0) cancelAnimationFrame(this.accessoryFrame);
    if (this.rigidMixinFrame !== 0) cancelAnimationFrame(this.rigidMixinFrame);
    this.freeEditor.dispose();
    this.disposeCatalogScrollHints();
    this.abortController.abort();
    this.clearPlacementFeedback();
    this.renderer.dispose();
    this.audio.dispose();
  }

  private renderShell(): string {
    const decorLabels = DECOR_LABELS[this.options.language];
    const shapeLabels = SHAPE_LABELS[this.options.language];
    const mixinLabels = MIXIN_LABELS[this.options.language];
    const shapes = SHAPES.map((shape) => `
      <button class="sandbox-shape" type="button" data-shape="${shape.id}" aria-pressed="${shape.id === this.draft.shapeId}">
        <span class="sandbox-shape__icon">${shapeSvg(shape)}</span>
        <span>${shapeLabels[shape.id]}</span>
      </button>
    `).join('');
    const paintColors = PAINT_COLORS.map((color, index) => `
      <button class="sandbox-swatch" type="button" data-paint-color="${color}" aria-label="${PAINT_COLOR_LABELS[this.options.language][index]}" aria-pressed="${index === 0}" style="--swatch:#${color.toString(16).padStart(6, '0')}"></button>
    `).join('');
    const brushSizes = BRUSH_SIZES.map((size, index) => `
      <button type="button" data-brush-size="${size}" aria-label="${BRUSH_SIZE_LABELS[this.options.language][index]}" title="${BRUSH_SIZE_LABELS[this.options.language][index]}" aria-pressed="${size === this.brushSize}">${size === 18 ? 'S' : size === 34 ? 'M' : 'L'}</button>
    `).join('');
    const mixins = MIXIN_IDS.map((id, index) => `
      <button class="sandbox-mixin" type="button" data-mixin="${id}" aria-pressed="${index === 0}">
        <span><canvas class="toy-choice-art" data-mixin-icon="${id}" width="96" height="56" aria-hidden="true"></canvas></span><small>${mixinLabels[id]}</small>
      </button>
    `).join('');
    const materials = MATERIALS.map((material) => `
      <button class="sandbox-material" type="button" data-material="${material.id}" aria-pressed="${material.id === 'soft'}">
        <span class="sandbox-material__orb sandbox-material__orb--${material.id}"></span>
        <span>${this.copy[material.id]}</span>
      </button>
    `).join('');

    const eyes = [null, ...EYE_STYLE_IDS].map((id) => `
      <button class="sandbox-decor-choice" type="button" data-decor-eyes="${id ?? 'none'}" aria-label="${id ? decorLabels.eyes[id] : this.copy.none}" title="${id ? decorLabels.eyes[id] : this.copy.none}" aria-pressed="${id === null}">
        <span>${id ? `<canvas class="toy-choice-art" data-face-icon="eyes" data-face-style="${id}" width="96" height="56" aria-hidden="true"></canvas>` : '—'}</span><small>${id ? decorLabels.eyes[id] : this.copy.none}</small>
      </button>
    `).join('');
    const mouths = [null, ...MOUTH_STYLE_IDS].map((id) => `
      <button class="sandbox-decor-choice" type="button" data-decor-mouth="${id ?? 'none'}" aria-label="${id ? decorLabels.mouths[id] : this.copy.none}" title="${id ? decorLabels.mouths[id] : this.copy.none}" aria-pressed="${id === null}">
        <span>${id ? `<canvas class="toy-choice-art" data-face-icon="mouth" data-face-style="${id}" width="96" height="56" aria-hidden="true"></canvas>` : '—'}</span><small>${id ? decorLabels.mouths[id] : this.copy.none}</small>
      </button>
    `).join('');
    const stickers = STICKER_IDS.map((id) => `
      <button class="sandbox-decor-choice" type="button" data-decor-sticker="${id}" aria-pressed="${id === this.selectedSticker}">
        <span><canvas class="toy-choice-art" data-sticker-icon="${id}" width="96" height="56" aria-hidden="true"></canvas></span><small>${decorLabels.stickers[id]}</small>
      </button>
    `).join('');
    const accessories = [null, ...ACCESSORY_IDS].map((id) => `
      <button class="sandbox-decor-choice" type="button" data-decor-accessory="${id ?? 'none'}" aria-pressed="${id === null}">
        <span>${id ? `<canvas class="toy-choice-art" data-accessory-icon="${id}" width="180" height="120" aria-hidden="true"></canvas>` : '—'}</span><small>${id ? decorLabels.accessories[id] : this.copy.none}</small>
      </button>
    `).join('');

    return `
      <main class="sandbox-shell" data-sandbox-app data-stage="${this.stage}" data-shape="${this.draft.shapeId}" data-material="soft" data-sandbox-squeezes="0">
        <header class="sandbox-topbar">
          <strong data-sandbox-brand>${this.copy.studio}</strong>
          <button class="sandbox-sound" type="button" data-action="stage-back" hidden>← ${this.copy.back}</button>
          <button class="sandbox-sound sandbox-exit-craft" type="button" data-action="exit-craft" hidden>${this.copy.exit}</button>
          <button class="sandbox-sound" type="button" data-action="mute" aria-pressed="${this.muted}">${this.muted ? this.copy.muted : this.copy.sound}</button>
        </header>

        <section class="sandbox-copy">
          <div class="sandbox-heading">
            <span data-sandbox-step></span>
            <h1 data-sandbox-title></h1>
          </div>
          <p data-sandbox-hint></p>
        </section>

        <section class="sandbox-stage" aria-label="${this.copy.workbenchLabel}">
          <div class="sandbox-glow" aria-hidden="true"></div>
          <canvas class="sandbox-accessory-layer" data-sandbox-accessory aria-hidden="true" hidden></canvas>
          <canvas class="sandbox-canvas" data-sandbox-canvas aria-label="${this.copy.squishyLabel}"></canvas>
          <canvas class="sandbox-rigid-mixin-layer" data-sandbox-rigid-mixins aria-hidden="true" hidden></canvas>
        </section>

        <button class="free-try-return" type="button" data-action="try-return" hidden>${this.options.language === 'ru' ? 'Вернуться к крафту' : 'Back to craft'}</button>
        <section class="sandbox-controls">
          <div class="sandbox-panel" data-panel="shape"><div class="free-shape-catalog">${shapes}</div><div class="free-craft-footer"><div class="free-history-bar" data-free-history><button type="button" data-action="draft-undo" aria-label="${this.copy.undo}">↶</button><button type="button" data-action="draft-redo" aria-label="${this.options.language === 'ru' ? 'Вернуть' : 'Redo'}">↷</button></div><button class="sandbox-primary sandbox-panel__wide" type="button" data-action="shape-continue">${this.copy.next}</button></div></div>

          <div class="sandbox-panel" data-panel="paint">
            <div class="sandbox-palette-grid">${paintColors}</div>
            <div class="sandbox-tool-row sandbox-paint-tools">
              <button type="button" data-paint-tool="paint" aria-pressed="true">${this.copy.brush}</button>
              <button type="button" data-paint-tool="erase" aria-pressed="false">${this.copy.eraser}</button>
              <button type="button" data-paint-tool="fill" aria-pressed="false">${this.copy.fill}</button>
              ${brushSizes}
            </div>
            <div class="sandbox-tool-row sandbox-tool-row--actions">
              <button type="button" data-action="paint-undo" aria-label="${this.copy.undo}">↶</button><button type="button" data-action="draft-redo" aria-label="${this.options.language === 'ru' ? 'Вернуть' : 'Redo'}">↷</button>
              <button type="button" data-action="paint-clear">${this.copy.clear}</button>
              <button class="sandbox-primary" type="button" data-action="paint-continue">${this.copy.next}</button>
            </div>
          </div>

          <div class="sandbox-panel" data-panel="mixins">
            <div class="free-mixin-catalog"><div class="sandbox-mixin-grid">${mixins}</div>
              <div class="free-mixin-settings"><label>${this.options.language === 'ru' ? 'Размер' : 'Size'}<input type="range" data-mixin-setting="size" min="6" max="60" value="18"></label><label>${this.options.language === 'ru' ? 'Плотность' : 'Density'}<input type="range" data-mixin-setting="density" min=".25" max="2" step=".05" value="1"></label></div><button type="button" data-action="mixin-clear">${this.copy.clear}</button></div>
            <div class="sandbox-tool-row sandbox-tool-row--actions">
              <button type="button" data-action="mixin-undo" aria-label="${this.copy.undo}">↶</button><button type="button" data-action="draft-redo" aria-label="${this.options.language === 'ru' ? 'Вернуть' : 'Redo'}">↷</button>
              <button type="button" data-action="mixin-erase" aria-pressed="false">${this.copy.eraser}</button>
              <button class="sandbox-primary" type="button" data-action="mixin-continue">${this.copy.next}</button>
            </div>
          </div>

          <div class="sandbox-panel sandbox-panel--center" data-panel="mix">
            <div class="sandbox-mix-progress" aria-hidden="true"><span data-mix-progress-fill></span></div>
            <button class="sandbox-primary sandbox-panel__wide" type="button" data-action="mix-continue" disabled>${this.copy.next}</button>
          </div>

          <div class="sandbox-panel sandbox-panel--decor" data-panel="decor">
            <div class="sandbox-decor-tabs" role="tablist" aria-label="${this.copy.decorCategories}">
              <button type="button" role="tab" id="decor-tab-face" aria-controls="decor-panel-face" aria-selected="true" tabindex="0" data-decor-section="face"><span class="decor-tab-icon" aria-hidden="true">☺</span> <span>${this.copy.face}</span></button>
              <button type="button" role="tab" id="decor-tab-stickers" aria-controls="decor-panel-stickers" aria-selected="false" tabindex="-1" data-decor-section="stickers"><span class="decor-tab-icon" aria-hidden="true">✦</span> <span>${this.copy.stickers}</span></button>
              <button type="button" role="tab" id="decor-tab-accessory" aria-controls="decor-panel-accessory" aria-selected="false" tabindex="-1" data-decor-section="accessory"><span class="decor-tab-icon" aria-hidden="true">♛</span> <span>${this.copy.head}</span></button>
              <button type="button" role="tab" id="decor-tab-objects" aria-controls="decor-panel-objects" aria-selected="false" tabindex="-1" data-decor-section="objects"><span class="decor-tab-icon" aria-hidden="true">↔</span> <span>${this.options.language === 'ru' ? 'Править' : 'Arrange'}</span></button>
            </div>
            <div class="sandbox-decor-section" role="tabpanel" id="decor-panel-face" aria-labelledby="decor-tab-face" data-decor-panel="face">
              <div class="sandbox-face-group"><span>${this.copy.eyes}</span><div class="sandbox-decor-grid sandbox-decor-grid--four">${eyes}</div></div>
              <div class="sandbox-face-group"><span>${this.copy.mouth}</span><div class="sandbox-decor-grid sandbox-decor-grid--four">${mouths}</div></div>
              <button class="sandbox-decor-toggle" type="button" data-action="decor-blush" aria-pressed="false">● ● <span>${this.copy.blush}</span></button>
            </div>
            <div class="sandbox-decor-section" role="tabpanel" id="decor-panel-stickers" aria-labelledby="decor-tab-stickers" data-decor-panel="stickers" hidden>
              <div class="sandbox-decor-grid sandbox-decor-grid--four">${stickers}</div>
              <p class="sandbox-decor-tip">${decorLabels.stickerTip}</p>
              <div class="sandbox-tool-row sandbox-tool-row--actions"><button type="button" data-action="decor-clear">${this.copy.clear}</button><button type="button" data-action="decor-erase" aria-pressed="false">${this.copy.eraser}</button></div>
            </div>
            <div class="sandbox-decor-section" role="tabpanel" id="decor-panel-accessory" aria-labelledby="decor-tab-accessory" data-decor-panel="accessory" hidden>
              <div class="sandbox-decor-grid sandbox-decor-grid--three">${accessories}</div>
            </div>
            <div class="sandbox-decor-section free-object-panel" role="tabpanel" id="decor-panel-objects" aria-labelledby="decor-tab-objects" data-decor-panel="objects" data-free-objects hidden></div>
            <div class="free-craft-footer"><div class="free-history-bar" data-free-history><button type="button" data-action="draft-undo" aria-label="${this.copy.undo}">↶</button><button type="button" data-action="draft-redo" aria-label="${this.options.language === 'ru' ? 'Вернуть' : 'Redo'}">↷</button></div><button class="sandbox-primary sandbox-panel__wide" type="button" data-action="decor-continue">${this.copy.next}</button></div>
          </div>

          <div class="sandbox-panel" data-panel="finish">
            <div class="free-finish-tabs"><button type="button" data-finish-tab="material" aria-pressed="true">${this.options.language === 'ru' ? 'Материал' : 'Material'}</button><button type="button" data-finish-tab="light" aria-pressed="false">${this.options.language === 'ru' ? 'Свет' : 'Light'}</button><button type="button" data-action="try-on">${this.options.language === 'ru' ? 'Примерка' : 'Try it'}</button></div>
            <div class="sandbox-material-grid" data-finish-panel="material">${materials}</div>
            <div class="free-light-panel" data-finish-panel="light" hidden><div class="free-light-presets">${LIGHT_PRESETS.map((preset,index)=>`<button type="button" data-light-preset="${preset}">${(this.options.language === 'ru' ? ['Студия','Нежный','Закат','Лунный'] : ['Studio','Soft','Sunset','Moon'])[index]}</button>`).join('')}</div><label>${this.options.language === 'ru' ? 'Слева / справа' : 'Left / right'}<input type="range" data-light-axis="x" min="-1" max="1" step=".01" value="-.45"></label><label>${this.options.language === 'ru' ? 'Снизу / сверху' : 'Low / high'}<input type="range" data-light-axis="y" min="-1" max="1" step=".01" value=".65"></label><button type="button" data-action="light-reset">${this.options.language === 'ru' ? 'Сброс света' : 'Reset light'}</button></div>
            <div class="sandbox-finish-actions"><div class="free-history-bar" data-free-history><button type="button" data-action="draft-undo" aria-label="${this.copy.undo}">↶</button><button type="button" data-action="draft-redo" aria-label="${this.options.language === 'ru' ? 'Вернуть' : 'Redo'}">↷</button></div><button class="sandbox-secondary" type="button" data-action="finish-back">${this.copy.back}</button><button class="sandbox-primary" type="button" data-action="save">${this.copy.save}</button></div>
          </div>

          <div class="sandbox-panel sandbox-panel--center" data-panel="home">
            <button class="sandbox-primary sandbox-panel__wide" type="button" data-action="play-saved">${this.copy.play}</button>
            <button class="sandbox-secondary sandbox-panel__wide" type="button" data-action="new">${this.copy.newSquishy}</button>
          </div>

          <div class="sandbox-panel sandbox-panel--center" data-panel="squeeze">
            <button class="sandbox-secondary" type="button" data-action="edit-saved">${this.options.language === 'ru' ? 'Редактировать' : 'Edit'}</button>
            <button class="sandbox-secondary" type="button" data-action="home">${this.copy.done}</button>
            <button class="sandbox-primary" type="button" data-action="new">${this.copy.newSquishy}</button>
          </div>
        </section>
        <div class="sandbox-status" data-sandbox-status aria-live="polite"></div>
        <div class="sandbox-tools-overlay" data-tools-overlay hidden>
          <section class="sandbox-tools-dialog" role="dialog" aria-modal="true" aria-labelledby="tools-title">
            <strong id="tools-title">${this.options.language === 'ru' ? 'Краски и штампы' : 'Colors & stamps'}</strong>
            <div class="sandbox-theme-choices">${CREATIVE_PALETTES.map(theme => `<button type="button" data-paint-theme="${theme.id}" aria-pressed="false"><span>${theme.colors.map(c => `<i style="background:#${c.toString(16).padStart(6, '0')}"></i>`).join('')}</span>${theme[this.options.language]}</button>`).join('')}</div>
            <div class="sandbox-stamp-choices">
              <button type="button" data-paint-stamp="none" aria-pressed="true">${this.copy.brush}</button>
              ${PAINT_STAMPS.map(stamp => `<button type="button" data-paint-stamp="${stamp.id}" aria-pressed="false"><span aria-hidden="true">${stamp.icon}</span>${stamp[this.options.language]}</button>`).join('')}
            </div>
            <button class="sandbox-secondary" type="button" data-action="tools-close">${this.copy.done}</button>
          </section>
        </div>
        <div class="sandbox-exit-overlay" data-exit-overlay hidden>
          <section class="sandbox-exit-dialog" role="dialog" aria-modal="true" aria-labelledby="sandbox-exit-title">
            <strong id="sandbox-exit-title">${this.copy.exitTitle}</strong>
            <p>${this.copy.exitHint}</p>
            <div>
              <button class="sandbox-secondary" type="button" data-action="exit-cancel">${this.copy.stay}</button>
              <button class="sandbox-exit-danger" type="button" data-action="exit-confirm">${this.copy.leave}</button>
            </div>
          </section>
        </div>
      </main>
    `;
  }

  private bindEvents(): void {
    const signal = this.abortController.signal;
    this.root.addEventListener('click', this.handleClick, { signal });
    this.root.addEventListener('pointerdown', () => { if (!this.activityBlocked) void this.audio.prime().catch(() => {}); }, { signal });
    this.root.addEventListener('input', event => {
      const input = event.target instanceof HTMLInputElement ? event.target : null; if (!input || this.activityBlocked || this.saving || this.exitConfirmOpen) return;
      if (input.dataset.mixinSetting) {
        this.draftHistory.begin(this.draft);
        const settings = this.draft.appearance.mixinBrush ?? {size:18,density:1};
        this.draft = {...this.draft, appearance:{...this.draft.appearance,mixinBrush:{...settings,[input.dataset.mixinSetting]:Number(input.value)}}};
      } else if (input.dataset.lightAxis) {
        this.draftHistory.begin(this.draft);
        const light = this.draft.appearance.light ?? {preset:'studio' as const,x:-.45,y:.65};
        this.draft = {...this.draft,appearance:{...this.draft.appearance,light:{...light,[input.dataset.lightAxis]:Number(input.value)}}};
        this.applyMaterial(this.draft.materialId);
      }
    }, {signal});
    this.root.addEventListener('change', event => { if(event.target instanceof HTMLInputElement && (event.target.dataset.mixinSetting || event.target.dataset.lightAxis)) {this.draftHistory.end(this.draft);this.updateHistoryUi();} }, {signal});
    this.root.addEventListener('keydown' , this.handleKeyDown, { signal });
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

    const section = target.dataset.craftSection;
    if (section === 'shape' || section === 'paint' || section === 'mixins' || section === 'decor') {
      this.freeEditor.end(); this.setStage(section); return;
    }
    if (target.dataset.baseTab) {
      for (const panel of this.root.querySelectorAll<HTMLElement>('[data-base-panel]')) panel.hidden = panel.dataset.basePanel !== target.dataset.baseTab;
      this.updatePressed('[data-base-tab]', 'baseTab', target.dataset.baseTab); return;
    }
    if (target.dataset.action === 'paint-settings') { this.setToolsOpen(true); return; }
    if (target.dataset.action === 'mixin-settings') {
      const settings = this.requireElement<HTMLElement>('.free-mixin-settings');
      settings.hidden = !settings.hidden;
      this.requireElement<HTMLElement>('.sandbox-mixin-grid').hidden = !settings.hidden;
      target.setAttribute('aria-expanded', String(!settings.hidden)); return;
    }

    if (target.dataset.action === 'draft-undo' || target.dataset.action === 'draft-redo') { this.restoreDraftHistory(target.dataset.action === 'draft-redo'); return; }
    if (target.dataset.finishTab) {
      for(const panel of this.root.querySelectorAll<HTMLElement>('[data-finish-panel]'))panel.hidden=panel.dataset.finishPanel!==target.dataset.finishTab;
      this.updatePressed('[data-finish-tab]','finishTab',target.dataset.finishTab);return;
    }
    if(target.dataset.action==='try-on'||target.dataset.action==='try-return'){
      this.tryOn=target.dataset.action==='try-on';this.shell.dataset.tryOn=String(this.tryOn);
      this.requireElement<HTMLButtonElement>('[data-action="try-return"]').hidden=!this.tryOn;
      this.syncInteractivity();return;
    }
    if(target.dataset.lightPreset){
      const preset=target.dataset.lightPreset as CraftLight['preset'];if(!LIGHT_PRESETS.includes(preset))return;
      this.draft={...this.draft,appearance:{...this.draft.appearance,light:{...(this.draft.appearance.light??{x:-.45,y:.65}),preset}}};
      this.applyMaterial(this.draft.materialId);this.updateHistoryUi();this.updatePressed('[data-light-preset]','lightPreset',preset);return;
    }
    if(target.dataset.action==='light-reset'){
      const {light:_light,...appearance}=this.draft.appearance;this.draft={...this.draft,appearance};this.applyMaterial(this.draft.materialId);this.syncCraftSettings();this.updateHistoryUi();return;
    }
    if(target.dataset.action==='mixin-erase'){this.mixinErase=!this.mixinErase;target.setAttribute('aria-pressed',String(this.mixinErase));return;}
    const shapeId = target.dataset.shape as ShapeId | undefined;
    if (shapeId && SHAPES.some((shape) => shape.id === shapeId)) {
      this.draftHistory.begin(this.draft);
      this.draft = { ...this.draft, shapeId };
      if (shapeId === 'strawberry' && this.stage === 'shape' && !this.editingId && this.draft.appearance.strokes.length === 0) {
        // A normal editable pigment fill; never recolour an existing toy.
        this.draft = { ...this.draft, appearance: { ...this.draft.appearance, strokes: [createBodyFillStroke(0xff92b2)] } };

      }
      this.draftHistory.end(this.draft);
      this.applyDraftToRenderer();
      this.replayAndUpload();
      this.updatePressed('[data-shape]', 'shape', shapeId);
      return;
    }

    if (target.dataset.action === 'tools-close') { this.setToolsOpen(false); return; }
    const theme = CREATIVE_PALETTES.find(t => t.id === target.dataset.paintTheme);
    if (theme) {
      const grid = this.requireElement<HTMLElement>('.sandbox-palette-grid');
      const buttons = [...grid.querySelectorAll<HTMLButtonElement>('[data-paint-color]')];
      const colors: readonly number[] = theme.colors;
      for (const button of buttons) button.classList.toggle('is-theme-color', colors.includes(Number(button.dataset.paintColor)));
      for (const color of [...colors, ...PAINT_COLORS.filter(c => !colors.includes(c))]) {
        const button = buttons.find(b => Number(b.dataset.paintColor) === color);
        if (button) grid.append(button);
      }
      this.paintColor = theme.colors[0];
      this.updatePressed('[data-paint-color]', 'paintColor', String(this.paintColor));
      this.shell.dataset.paintTheme = theme.id;
      this.updatePressed('[data-paint-theme]', 'paintTheme', theme.id);
      this.status.textContent = theme[this.options.language];
      this.setToolsOpen(false); return;
    }
    const stamp = target.dataset.paintStamp;
    if (stamp !== undefined && (stamp === 'none' || PAINT_STAMPS.some(s => s.id === stamp))) {
      this.paintStampId = stamp === 'none' ? null : stamp as PaintStampId;
      this.paintTool = 'paint';
      const brush = this.requireElement<HTMLButtonElement>('[data-paint-tool="paint"]');
      const selected = PAINT_STAMPS.find(s => s.id === stamp);
      brush.textContent = selected?.icon ?? this.copy.brush;
      brush.setAttribute('aria-label', selected?.[this.options.language] ?? this.copy.brush);
      this.shell.dataset.paintStamp = stamp;
      this.updatePressed('[data-paint-stamp]', 'paintStamp', stamp);
      this.updatePressed('[data-paint-tool]', 'paintTool', 'paint');
      this.setToolsOpen(false); return;
    }

    const paintColor = target.dataset.paintColor;
    if (paintColor) {
      this.paintColor = Number(paintColor);
      // Colour selection exits Eraser, but keeps Fill selected so choosing a new
      // bucket colour does not silently switch tools underneath the player.
      if (this.paintTool === 'erase') this.paintTool = 'paint';
      this.updatePressed('[data-paint-color]', 'paintColor', paintColor);
      this.updatePressed('[data-paint-tool]', 'paintTool', this.paintTool);
      return;
    }

    const paintTool = target.dataset.paintTool as PaintTool | undefined;
    if (paintTool === 'paint' || paintTool === 'erase' || paintTool === 'fill') {
      this.paintTool = paintTool;
      if (paintTool !== 'paint') {
        this.paintStampId = null;
        this.updatePressed('[data-paint-stamp]', 'paintStamp', 'none');
        const brush = this.requireElement<HTMLButtonElement>('[data-paint-tool="paint"]');
        brush.textContent = this.copy.brush; brush.setAttribute('aria-label', this.copy.brush);
      }
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
      this.mixinErase = false;
      this.requireElement<HTMLButtonElement>('[data-action="mixin-erase"]').setAttribute('aria-pressed', 'false');
      this.updatePressed('[data-mixin]', 'mixin', mixin);
      return;
    }

    const decorSection = target.dataset.decorSection as DecorSection | undefined;
    if (decorSection === 'face' || decorSection === 'stickers' || decorSection === 'accessory' || decorSection === 'objects') {
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
      this.stickerErase = false;
      this.selectedSticker = decorSticker;
      this.updateDecorUi();
      this.updatePressed('[data-decor-sticker]', 'decorSticker', decorSticker);
      return;
    }

    const decorAccessory = target.dataset.decorAccessory;
    if (decorAccessory !== undefined) {
      const accessory = decorAccessory === 'none' ? null : decorAccessory as AccessoryId;
      if (accessory === null || ACCESSORY_IDS.includes(accessory)) {
        const items = accessoryPlacements(this.draft.decor, getShape(this.draft.shapeId));
        if (accessory && items.length + initialAccessoryPlacements(getShape(this.draft.shapeId), accessory).length > MAX_ACCESSORY_PLACEMENTS) return;
        const accessories = accessory ? [...items, ...initialAccessoryPlacements(getShape(this.draft.shapeId), accessory)] : [];
        const { accessories: _oldItems, ...legacyDecor } = this.draft.decor;
        this.draft = { ...this.draft, decor: accessory && !items.length
          ? { ...legacyDecor, accessory }
          : { ...this.draft.decor, accessory: null, accessories } };
        this.refreshAccessoryGraphic();
        if (accessory) { this.freeEditor.selectAccessory(accessories.length - 1); this.playPlacementFeedback(this.accessoryCanvasAt(accessories.length - 1), 'bow'); }
        this.updateDecorUi();
        this.freeEditor.refresh();
        if (accessory) this.setDecorSection('objects');
      }
      return;
    }

    const materialId = target.dataset.material as MaterialId | undefined;
    if (materialId && MATERIALS.some((material) => material.id === materialId)) {
      this.draft = { ...this.draft, materialId };
      this.applyMaterial(materialId);
      this.replayAndUpload();
      this.updatePressed('[data-material]', 'material', materialId);
      return;
    }

    const action = target.dataset.action;
    if (action === 'stage-back') this.goBack();
    else if (action === 'exit-craft') this.requestCraftExit();
    else if (action === 'exit-cancel') this.setExitConfirmOpen(false);
    else if (action === 'exit-confirm') this.confirmCraftExit();
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
    else if (action === 'decor-erase') { this.stickerErase = !this.stickerErase; this.updateDecorUi(); }
    else if (action === 'decor-continue') this.setStage('finish');
    else if (action === 'finish-back') this.setStage('decor');
    else if (action === 'save') void this.saveDraft();
    else if (action === 'edit-saved' && this.savedSquishy) {
      this.options.onResetCraftContext?.();
      this.loadSavedSquishy(this.savedSquishy);
      this.editingId = this.savedSquishy.id;
      this.shell.dataset.saveKind = 'edit';
      this.mixDistance = MIX_DISTANCE_FOR_COMPLETE_PX;
      this.setDecorSection('face');
      this.setStage('decor');
    }
    else if (action === 'free-squeeze' && this.options.rendererBackend === 'phaser') (this.renderer as PhaserSquishSurface).toggleFreeSqueeze();
    else if (action === 'play-saved') this.openSavedForSqueeze();
    else if (action === 'new') this.startNew();
    else if (action === 'home') {
      if (this.options.onExitToLibrary) this.options.onExitToLibrary();
      else this.setStage(this.savedSquishy ? 'home' : 'shape');
    }
    else if (action === 'mute') this.toggleMuted();
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (this.activityBlocked || this.saving) {
      const dialog = this.exitConfirmOpen
        ? this.root.querySelector<HTMLElement>('[data-exit-overlay] [role="dialog"]')
        : null;
      if (event.key === 'Escape' && dialog) event.preventDefault();
      else if (dialog) trapModalTab(event, dialog);
      return;
    }

    if (this.toolsOpen) {
      const dialog = this.requireElement<HTMLElement>('[data-tools-overlay] [role="dialog"]');
      if (event.key === 'Escape') { event.preventDefault(); this.setToolsOpen(false); return; }
      if (trapModalTab(event, dialog)) return;
    }

    if (this.exitConfirmOpen) {
      const dialog = this.root.querySelector<HTMLElement>('[data-exit-overlay] [role="dialog"]');
      if (event.key === 'Escape') {
        event.preventDefault();
        this.setExitConfirmOpen(false);
        return;
      }
      if (dialog && trapModalTab(event, dialog)) return;
    }

    const tab = event.target instanceof HTMLElement ? event.target.closest<HTMLButtonElement>('[role="tab"][data-decor-section]') : null;
    if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const tabs = [...this.root.querySelectorAll<HTMLButtonElement>('[role="tab"][data-decor-section]')];
    const index = tabs.indexOf(tab);
    if (index < 0) return;
    event.preventDefault();
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? tabs.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    const next = tabs[nextIndex];
    const section = next?.dataset.decorSection as DecorSection | undefined;
    if (!next || !section) return;
    this.setDecorSection(section);
    next.focus();
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (this.activityBlocked) return;
    if (this.stage === 'paint') {
      if (this.authoredPointerId !== null) return;
      const point = this.renderer.clientPointToAppearanceUv(event.clientX, event.clientY);
      if (this.paintStampId && this.paintTool === 'paint') { if (point) this.applyPaintStamp(point); event.preventDefault(); return; }
      if (this.paintTool === 'fill') {
        if (point) this.applyPaintFill(point);
        event.preventDefault();
        return;
      }
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
      if (!point) return;
      this.editStickerAt(point);
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
      const point = this.renderer.clientPointToAppearanceUv(event.clientX, event.clientY);
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

  private setToolsOpen(open: boolean): void {
    if (open === this.toolsOpen) return;
    this.toolsOpen = open;
    this.requireElement<HTMLButtonElement>('[data-action="paint-settings"]').setAttribute('aria-expanded', String(open));
    const overlay = this.requireElement<HTMLElement>('[data-tools-overlay]');
    overlay.hidden = !open;
    if (open) {
      this.toolsReturnFocus = captureModalReturnFocus();
      focusModal(this.requireElement<HTMLElement>('[data-tools-overlay] [role="dialog"]'));
    } else restoreModalFocus(this.toolsReturnFocus);
    this.syncInteractivity();
  }

  private applyPaintStamp(point: AppearancePoint): void {
    if (!this.paintStampId) return;
    const shape = getShape(this.draft.shapeId);
    if (!isPointInsideShape(shape, point.u * 2 - 1, point.v * 2 - 1)) return;
    const stroke = createPaintStamp(this.paintStampId, this.paintColor, this.brushSize, point);
    const next = { ...this.draft.appearance, strokes: [...this.draft.appearance.strokes, stroke] };

    this.draft = { ...this.draft, appearance: next };
    const points = decodeAppearancePoints(stroke.p);
    if (points[0]) drawAppearanceStamp(this.appearanceContext, 0, stroke.c, stroke.s, points[0]);
    for (let i = 1; i < points.length; i++) drawAppearanceSegment(this.appearanceContext, 0, stroke.c, stroke.s, points[i - 1]!, points[i]!);
    this.uploadAppearanceNow(); this.updateAppearanceDataset();
    this.audio.playToyPlacement('stars');
  }

  private updateToyReaction(): void {
    if (this.disposed || this.options.rendererBackend !== 'phaser') return;
    const enabled = (this.draft.decor.eyes !== null || this.draft.decor.mouth !== null) && !this.activityBlocked && !this.toolsOpen && !this.exitConfirmOpen && !this.reducedMotion.matches
      && (this.stage === 'finish' || this.stage === 'squeeze' || this.stage === 'mix');
    const idle = (this.renderer as PhaserSquishSurface).presentation();
    const extras = (this.renderer as PhaserSquishSurface).reactionExtras();
    const blink = enabled ? Math.max(this.gestureActive ? 0 : idle.blink, extras.blink) : 0;
    const next: FaceReaction = enabled ? { ...faceReaction(Math.max(this.gestureStrength, this.gestureActive ? 0 : idle.squeeze), this.gestureActive ? -1 : performance.now() - this.releasedAt, this.releaseStrength, this.gestureActive ? this.strokeDelight : idle.delight, this.gestureActive ? this.stretchReaction : 0), ...(blink ? { blink } : {}), ...(extras.surprise ? { surprise: extras.surprise } : {}), ...(extras.cheek ? { cheek: extras.cheek } : {}) } : REST_FACE;
    const key = `${next.squeeze}:${next.delight}${next.stretch ? `:${next.stretch}` : ''}${blink ? `:b${blink}` : ''}${next.surprise ? `:s${next.surprise}` : ''}${next.cheek ? `:c${next.cheek}` : ''}`;
    if (key === this.reactionKey) return;
    this.reaction = next; this.reactionKey = key;
    this.shell.dataset.faceReaction = key;
    // Preserve relief/stickers in the same front UV layer; repaint only on a
    // quantized expression change, not every frame or throughout an idle scene.
    this.faceContext.clearRect(0, 0, APPEARANCE_TEXTURE_SIZE, APPEARANCE_TEXTURE_SIZE);
    renderToyInk(this.faceContext, this.draft.decor, this.draft.shapeId, next);
    this.refreshForegroundFaceSource();
    this.uploadFaceNow();
  }

  private finishPaintStroke(): void {
    if (this.authoredPoints.length === 0) return;
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

    this.draft = { ...this.draft, appearance: next };
    this.updateAppearanceDataset();
  }

  private applyPaintFill(point: AppearancePoint): void {
    const localX = point.u * 2 - 1;
    const localY = point.v * 2 - 1;
    if (!isPointInsideShape(getShape(this.draft.shapeId), localX, localY)) return;
    const strokesWithoutFill = this.draft.appearance.strokes.filter((stroke) => !isBodyFillStroke(stroke));
    const stroke = createBodyFillStroke(this.paintColor);
    const next: AppearanceDocumentV1 = {
      ...this.draft.appearance,
      // Keep Fill as the latest action so Undo removes it first. The replay
      // pipeline renders the recognized Fill stroke underneath ordinary paint.
      strokes: [...strokesWithoutFill, stroke],
    };

    this.draft = { ...this.draft, appearance: next };
    this.replayAndUpload();
  }

  private addMixinAt(point: AppearancePoint): void {
    if(this.mixinErase){
      const radius=(this.draft.appearance.mixinBrush?.size??18)/256;
      const mixins=this.draft.appearance.mixins.filter(item=>Math.hypot(item.x/255-point.u,item.y/255-point.v)>radius+item.s/512);
      if(mixins.length!==this.draft.appearance.mixins.length){this.draft={...this.draft,appearance:{...this.draft.appearance,mixins}};this.replayAndUpload();}return;
    }
    if (this.appearanceLimitReached) return;
    if (this.draft.appearance.mixins.length >= MAX_MIXIN_PLACEMENTS) {
      this.setAppearanceLimitReached(true);
      return;
    }
    const index = this.draft.appearance.mixins.length;
    const size = (this.draft.appearance.mixinBrush?.size ?? 18) * (.84 + ((index * 7) % 5) * .08);
    const rotation = ((index * 37 + this.selectedMixIn.length * 19) % 255) / 255;
    const placement = createMixInPlacement(this.selectedMixIn, point, size, rotation);
    const next: AppearanceDocumentV1 = {
      ...this.draft.appearance,
      mixins: [...this.draft.appearance.mixins, placement],
    };

    this.draft = { ...this.draft, appearance: next };
    if (this.options.rendererBackend === 'phaser') {
      this.replayAndUpload();
      this.showMixinSprinkle(point);
      return;
    }
    replayAppearanceDocument(this.appearanceContext, next, { excludeMixIns: this.overlayMixinIds(), materialId: this.draft.materialId, shapeId: this.draft.shapeId });
    this.scheduleTextureUpload();
    this.refreshRigidMixins();
    this.updateAppearanceDataset();
    this.showMixinSprinkle(point);
  }

  private playPlacementFeedback(element: HTMLElement, kind: 'bow' | 'stars'): void {
    if (this.activityBlocked || this.exitConfirmOpen) return;
    this.audio.playToyPlacement(kind);
    this.clearPlacementFeedback();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Animate individual scale, leaving the live mesh-projection matrix intact.
    this.placementAnimation = element.animate([
      { scale: kind === 'bow' ? '.84' : '.88', opacity: .75 },
      { scale: '1.06', opacity: 1, offset: .55 },
      { scale: '1', opacity: 1 },
    ], { duration: 260, easing: 'ease-out' });
  }

  private clearPlacementFeedback(): void {
    this.previewStickerAt(null);
    this.placementAnimation?.cancel();
    this.placementAnimation = null;
    this.sprinkle?.remove();
    this.sprinkle = null;
  }

  private showMixinSprinkle(point: AppearancePoint): void {
    this.clearPlacementFeedback();
    this.audio.playToyPlacement('stars');
    if (this.activityBlocked || this.exitConfirmOpen || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const center = this.renderer.projectUvToCanvas(point.u, point.v);
    const rect = this.canvas.getBoundingClientRect();
    const stage = this.canvas.parentElement;
    if (!stage) return;
    const stageRect = stage.getBoundingClientRect();
    const sprinkle = document.createElement('span');
    sprinkle.className = 'toy-star-sprinkle';
    sprinkle.setAttribute('aria-hidden', 'true');
    sprinkle.style.backgroundImage = `url(${this.sprinkleImages.get(this.selectedMixIn) ?? ''})`;
    sprinkle.style.left = `${rect.left - stageRect.left + center.x}px`;
    sprinkle.style.top = `${rect.top - stageRect.top + center.y}px`;
    stage.append(sprinkle);
    this.sprinkle = sprinkle;
    const animation = sprinkle.animate([
      { transform: 'translate(-50%, -150%) scale(.6)', opacity: 0 },
      { transform: 'translate(-50%, -80%) scale(1)', opacity: .85, offset: .35 },
      { transform: 'translate(-50%, -50%) scale(.85)', opacity: 0 },
    ], { duration: 320, easing: 'ease-out' });
    this.placementAnimation = animation;
    animation.onfinish = () => {
      sprinkle.remove();
      if (this.sprinkle === sprinkle) this.sprinkle = null;
    };
  }


  private undoPaint(): void { this.restoreDraftHistory(false); }


  private clearPaint(): void {
    if (!this.draft.appearance.strokes.length) return;

    this.setAppearanceLimitReached(false);
    this.draft = { ...this.draft, appearance: { ...this.draft.appearance, strokes: [] } };
    this.replayAndUpload();
  }

  private undoMixin(): void { this.restoreDraftHistory(false); }


  private clearMixins(): void {
    if (!this.draft.appearance.mixins.length) return;

    this.setAppearanceLimitReached(false);
    this.draft = { ...this.draft, appearance: { ...this.draft.appearance, mixins: [] } };
    this.replayAndUpload();
  }

  private stickerHit(point: AppearancePoint): number {
    const hit = this.renderer.projectUvToCanvas(point.u, point.v), current = this.draft.decor.stickers;
    for (let i = current.length - 1; i >= 0; i--) {
      const p = current[i]!, center = this.renderer.projectUvToCanvas(p.x / 255, p.y / 255);
      const edge = this.renderer.projectUvToCanvas(Math.min(1, p.x / 255 + p.s / (2 * APPEARANCE_TEXTURE_SIZE)), p.y / 255);
      if (Math.hypot(hit.x - center.x, hit.y - center.y) <= Math.max(22, Math.hypot(edge.x - center.x, edge.y - center.y))) return i;
    }
    return -1;
  }

  private previewStickerAt(point: AppearancePoint | null): void {
    if (!point || this.disposed || this.activityBlocked || this.stage !== 'decor' || this.decorSection !== 'stickers') {
      this.stickerPreview?.remove(); this.stickerPreview = null; this.stickerPreviewKey = ''; return;
    }
    const target = this.stickerErase ? this.stickerHit(point) : -1;
    if (this.stickerErase && target < 0) { this.previewStickerAt(null); return; }
    if (!this.stickerErase && this.draft.decor.stickers.length >= MAX_DECOR_STICKERS) { this.previewStickerAt(null); return; }
    const placement = this.stickerErase ? this.draft.decor.stickers[target]! : createStickerPlacement(this.selectedSticker, point, this.draft.decor.stickers.length);
    const key = `${this.stickerErase}:${placement.t}:${placement.s}:${placement.r}:${target}:${placement.x}:${placement.y}`;
    if (!this.stickerPreview) {
      this.stickerPreview = document.createElement('span'); this.stickerPreview.className = 'toy-sticker-preview';
      this.stickerPreview.setAttribute('aria-hidden', 'true'); this.stickerPreview.dataset.stickerPreview = 'true';
      this.canvas.parentElement?.append(this.stickerPreview);
    }
    const element = this.stickerPreview;
    element.dataset.previewTool = this.stickerErase ? 'erase' : 'place';
    element.dataset.previewTarget = String(target);
    if (key !== this.stickerPreviewKey) {
      const art = document.createElement('canvas'); art.width = art.height = 96;
      const ctx = art.getContext('2d');
      if (ctx) {
        // Move the drawing origin, preserving position-dependent color and face fade.
        ctx.translate(48 - placement.x / 255 * APPEARANCE_TEXTURE_SIZE, 48 - (1 - placement.y / 255) * APPEARANCE_TEXTURE_SIZE);
        renderSurfaceStickers(ctx, { ...this.draft.decor, stickers: [placement] }, getShape(this.draft.shapeId));
      }
      element.style.backgroundImage = `url(${art.toDataURL()})`; this.stickerPreviewKey = key;
    }
    const rect = this.canvas.getBoundingClientRect(), stage = this.canvas.parentElement!.getBoundingClientRect();
    const center = this.renderer.projectUvToCanvas(placement.x / 255, placement.y / 255);
    const ratio = Number.parseFloat(getComputedStyle(this.canvas).getPropertyValue('--squish-radius-ratio')) || .34;
    const size = 96 * Math.min(rect.width, rect.height) * ratio * 2 / APPEARANCE_TEXTURE_SIZE;
    element.style.width = element.style.height = `${size}px`;
    element.style.left = `${rect.left - stage.left + center.x}px`; element.style.top = `${rect.top - stage.top + center.y}px`;
  }

  private accessoryHit(index: number, clientX: number, clientY: number): boolean {
    const canvas = this.accessoryCanvasAt(index), rect = canvas.getBoundingClientRect();
    if (canvas.hidden || clientX < rect.left - 6 || clientX > rect.right + 6 || clientY < rect.top - 6 || clientY > rect.bottom + 6) return false;
    const style = getComputedStyle(canvas), matrix = new DOMMatrix(style.transform === 'none' ? undefined : style.transform);
    const origin = style.transformOrigin.split(' ').map(Number.parseFloat);
    const stage = canvas.offsetParent?.getBoundingClientRect(); if (!stage) return false;
    const local = matrix.inverse().transformPoint(new DOMPoint(clientX - stage.left - canvas.offsetLeft - origin[0]!, clientY - stage.top - canvas.offsetTop - origin[1]!));
    const x = (local.x + origin[0]!) * canvas.width / canvas.offsetWidth, y = (local.y + origin[1]!) * canvas.height / canvas.offsetHeight;
    const margin = 6 * canvas.width / canvas.offsetWidth;
    const left = Math.max(0, Math.floor(x - margin)), top = Math.max(0, Math.floor(y - margin));
    const width = Math.min(canvas.width, Math.ceil(x + margin)) - left, height = Math.min(canvas.height, Math.ceil(y + margin)) - top;
    if (width <= 0 || height <= 0) return false;
    const pixels = canvas.getContext('2d')!.getImageData(left, top, width, height).data;
    return pixels.some((alpha, i) => i % 4 === 3 && alpha > 24);
  }

  private reactWorkshop(energy: number): void {
    if (energy < .22 || this.activityBlocked || this.reducedMotion.matches) return;
    const dust = this.root.querySelector<HTMLElement>('.studio-env-stage-art')
      ?? this.shell.closest('[data-sandbox-library]')?.querySelector<HTMLElement>('.library-hall-scene');
    if (!dust) return;
    this.roomReaction?.cancel(); this.roomLight?.cancel();
    this.roomReaction = dust.animate([
      { translate: '0px 0px', opacity: 1 },
      { translate: `${Math.min(8, energy * 10)}px -6px`, opacity: .72, offset: .32 },
      { translate: '0px 0px', opacity: 1 },
    ], { duration: 850, easing: 'ease-out', pseudoElement: '::after' });
    if (dust.classList.contains('studio-env-stage-art')) {
      this.roomLight = dust.animate([{ opacity: 1 }, { opacity: .72, offset: .4 }, { opacity: 1 }], { duration: 850, easing: 'ease-out', pseudoElement: '::before' });
    }
    this.shell.dataset.workshopReaction = 'release';
    this.roomReaction.onfinish = () => { this.shell.dataset.workshopReaction = 'rest'; };
  }

  private editStickerAt(point: AppearancePoint): void {
    const current = this.draft.decor.stickers;
    let stickers: readonly StickerPlacementV1[];
    if (this.stickerErase) {
      const index = this.stickerHit(point);
      if (index < 0) return;
      stickers = current.filter((_, i) => i !== index);
    } else {
      if (current.length >= MAX_DECOR_STICKERS) {
        this.status.textContent = this.options.language === 'ru' ? `Наклеек: ${MAX_DECOR_STICKERS}. Убери одну ластиком.` : `${MAX_DECOR_STICKERS} stickers. Erase one to add more.`;
        return;
      }
      stickers = [...current, createStickerPlacement(this.selectedSticker, point, current.length)];
    }

    this.draft = { ...this.draft, decor: { ...this.draft.decor, stickers } };
    this.status.textContent = '';
    this.replayAndUpload();
    if (!this.stickerErase) {
      const index = stickers.length - 1;
      queueMicrotask(() => {
        if (this.disposed || this.stage !== 'decor' || !this.draft.decor.stickers[index]) return;
        this.freeEditor.selectSticker(index); this.setDecorSection('objects');
      });
    }
  }

  private undoSticker(): void { this.restoreDraftHistory(false); }


  private clearStickers(): void {
    if (!this.draft.decor.stickers.length) return;

    this.draft = { ...this.draft, decor: { ...this.draft.decor, stickers: [] } };
    this.status.textContent = '';
    this.replayAndUpload();
  }

  private setDecorSection(next: DecorSection): void {
    this.decorSection = next;
    this.shell.dataset.decorSection = next;
    this.updatePressed('[data-decor-section]', 'decorSection', next);
    for (const panel of this.root.querySelectorAll<HTMLElement>('[data-decor-panel]')) panel.hidden = panel.dataset.decorPanel !== next;
    this.freeEditor.refresh();
    this.syncInteractivity();
  }

  private updateDecorUi(): void {
    this.updatePressed('[data-decor-eyes]', 'decorEyes', this.draft.decor.eyes ?? 'none');
    this.updatePressed('[data-decor-mouth]', 'decorMouth', this.draft.decor.mouth ?? 'none');
    this.updatePressed('[data-decor-accessory]', 'decorAccessory', this.draft.decor.accessory ?? 'none');
    this.updatePressed('[data-decor-sticker]', 'decorSticker', this.stickerErase ? '' : this.selectedSticker);
    this.requireElement<HTMLButtonElement>('[data-action="decor-erase"]').setAttribute('aria-pressed', String(this.stickerErase));
    this.shell.dataset.decorTool = this.stickerErase ? 'erase' : 'sticker';
    const stickerTip = this.requireElement<HTMLElement>('.sandbox-decor-tip');
    const stickersFull = this.draft.decor.stickers.length >= MAX_DECOR_STICKERS;
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-decor-sticker]')) button.disabled = stickersFull;
    stickerTip.textContent = this.stickerErase
      ? (this.options.language === 'ru' ? 'Коснись наклейки, чтобы убрать её. Отменой можно вернуть.' : 'Tap a sticker to erase it. Undo brings it back.')
      : stickersFull ? (this.options.language === 'ru' ? 'Лимит наклеек. Удали одну, чтобы добавить новую.' : 'Sticker limit reached. Delete one to add another.')
        : DECOR_LABELS[this.options.language].stickerTip;
    const items = accessoryPlacements(this.draft.decor, getShape(this.draft.shapeId));
    let blockedAccessory = false;
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('button[data-decor-accessory]')) {
      const id = button.dataset.decorAccessory as AccessoryId | 'none';
      button.disabled = id !== 'none' && items.length + initialAccessoryPlacements(getShape(this.draft.shapeId), id).length > MAX_ACCESSORY_PLACEMENTS;
      blockedAccessory ||= button.disabled;
    }
    const grid = this.root.querySelector<HTMLElement>('[data-decor-panel="accessory"] .sandbox-decor-grid');
    if (grid && !grid.querySelector('[data-accessory-limit]')) grid.insertAdjacentHTML('afterbegin', '<p class="decor-limit-notice" data-accessory-limit role="status" hidden></p>');
    const notice = grid?.querySelector<HTMLElement>('[data-accessory-limit]');
    if (notice) {
      notice.hidden = !blockedAccessory;
      notice.textContent = this.options.language === 'ru'
        ? `Детали: ${items.length}/${MAX_ACCESSORY_PLACEMENTS}. Удали деталь, чтобы освободить место.`
        : `Details: ${items.length}/${MAX_ACCESSORY_PLACEMENTS}. Delete an item to make room.`;
    }
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
      if (button) button.disabled = action === 'decor-undo' ? !this.draftHistory.canUndo : this.draft.decor.stickers.length === 0;
    }
  }

  private isDraftDirty(): boolean {
    return JSON.stringify(this.draft) !== this.cleanDraft;
  }

  private requestCraftExit(): void {
    if (!this.options.onExitToLibrary) return;
    if (!this.isDraftDirty()) {
      this.options.onExitToLibrary();
      return;
    }
    this.setExitConfirmOpen(true);
  }

  private confirmCraftExit(): void {
    this.setExitConfirmOpen(false);
    this.options.onExitToLibrary?.();
  }

  private setExitConfirmOpen(open: boolean): void {
    const overlay = this.requireElement<HTMLElement>('[data-exit-overlay]');
    if (open && !this.exitConfirmOpen) this.exitReturnFocus = captureModalReturnFocus();
    this.exitConfirmOpen = open;
    this.shell.dataset.exitConfirm = String(open);
    overlay.hidden = !open;
    this.syncInteractivity();
    if (open) {
      const dialog = overlay.querySelector<HTMLElement>('[role="dialog"]');
      if (dialog) focusModal(dialog);
    } else {
      restoreModalFocus(this.exitReturnFocus);
      this.exitReturnFocus = null;
    }
  }

  private setAppearanceLimitReached(value: boolean): void {
    this.appearanceLimitReached = value;
    this.shell.dataset.appearanceFull = String(value);
    this.updateAppearanceLimitUi();
  }

  private updateAppearanceLimitUi(): void {
    const showNotice = this.appearanceLimitReached && this.stage === 'mixins';
    this.status.toggleAttribute('data-limit', showNotice);
    if (showNotice) this.status.textContent = this.copy.drawingFull;
    else if (this.status.textContent === this.copy.drawingFull) this.status.textContent = '';
    for (const selector of ['[data-mixin]']) {
      for (const button of this.root.querySelectorAll<HTMLButtonElement>(selector)) button.disabled = this.appearanceLimitReached;
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
    this.syncInteractivity();
    this.saveButton.disabled = true;
    this.saveButton.textContent = this.copy.saving;
    try {
      const saved = await this.options.onSaveSquishy(this.draft, this.editingId);
      if (this.disposed) return;
      if (!saved) {
        this.status.textContent = '';
        return;
      }
      this.shell.dataset.saveKind = this.editingId ? 'edit' : 'craft';
      this.editingId = null;
      this.savedSquishy = saved;
      this.shell.dataset.savedSquishyId = saved.id;
      this.shell.dataset.saveComplete = 'true';
      this.loadSavedSquishy(saved);
      this.setStage('squeeze');
    } catch (error: unknown) {
      if (this.disposed) return;
      console.error('[squishy:sandbox-save]', error);
      this.shell.dataset.saveComplete = 'false';
      this.status.textContent = this.copy.saveFailed;
    } finally {
      this.saving = false;
      if (!this.disposed) {
        this.saveButton.disabled = false;
        this.saveButton.textContent = this.options.language === 'ru' ? 'Сохранить' : 'Save';
        this.syncInteractivity();
      }
    }
  }

  private openSavedForSqueeze(): void {
    if (!this.savedSquishy) return;
    this.loadSavedSquishy(this.savedSquishy);
    this.setStage('squeeze');
  }

  private startNew(): void {
    this.options.onResetCraftContext?.();
    this.setExitConfirmOpen(false);
    this.setAppearanceLimitReached(false);
    this.editingId = null;
    this.shell.dataset.saveKind = 'craft';
    this.stickerErase = false;
    this.mixinErase = false;
    this.requireElement<HTMLButtonElement>('[data-action="mixin-erase"]').setAttribute('aria-pressed', 'false');
    this.requireElement<HTMLElement>('.free-mixin-settings').hidden = true;
    this.requireElement<HTMLElement>('.sandbox-mixin-grid').hidden = false;
    this.requireElement<HTMLButtonElement>('[data-action="mixin-settings"]').setAttribute('aria-expanded', 'false');
    this.draftHistory.clear();
    this.draft = createSandboxDraft();
    this.cleanDraft = JSON.stringify(this.draft);
    this.paintStampId = null;
    this.updatePressed('[data-paint-stamp]', 'paintStamp', 'none');
    const brush = this.requireElement<HTMLButtonElement>('[data-paint-tool="paint"]');
    brush.textContent = this.copy.brush; brush.setAttribute('aria-label', this.copy.brush);
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
    for (const panel of this.root.querySelectorAll<HTMLElement>('[data-base-panel]')) panel.hidden = panel.dataset.basePanel !== 'shape';
    this.updatePressed('[data-base-tab]', 'baseTab', 'shape');
    this.setStage('shape');
    this.draftHistory.clear(); this.updateAppearanceDataset(); this.updateHistoryUi();
  }

  private loadSavedSquishy(saved: SavedSquishy): void {
    this.draftHistory.clear();
    this.stickerErase = false;
    this.draft = {
      shapeId: saved.shapeId,
      materialId: saved.materialId,
      appearance: saved.appearance,
      decor: saved.decor,
    };
    this.cleanDraft = JSON.stringify(this.draft);
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
    this.syncCraftSettings();
    this.shell.dataset.shape = this.draft.shapeId;
    this.shell.dataset.material = this.draft.materialId;
    this.refreshAccessoryGraphic();
  }

  private syncCraftSettings(): void {
    for(const input of this.root.querySelectorAll<HTMLInputElement>('[data-mixin-setting]'))input.value=String(input.dataset.mixinSetting==='size'?(this.draft.appearance.mixinBrush?.size??18):(this.draft.appearance.mixinBrush?.density??1));
    for(const input of this.root.querySelectorAll<HTMLInputElement>('[data-light-axis]'))input.value=String(input.dataset.lightAxis==='x'?(this.draft.appearance.light?.x??-.45):(this.draft.appearance.light?.y??.65));
    this.updatePressed('[data-light-preset]', 'lightPreset', this.draft.appearance.light?.preset ?? 'studio');
  }

  private overlayMixinIds(): readonly MixInId[] {
    return this.options.rendererBackend === 'phaser' && this.stage === 'squeeze' ? MIXIN_IDS : RIGID_MIXIN_IDS;
  }

  private updateContactFeedback(): void {
    const stage = this.canvas.parentElement;
    if (!stage || this.options.rendererBackend !== 'phaser') return;
    const enabled = (this.stage === 'squeeze' || this.stage === 'finish') && !this.activityBlocked && !this.exitConfirmOpen && !this.toolsOpen && !this.reducedMotion.matches;
    if (!enabled && (this.roomReaction || this.roomLight)) {
      this.roomReaction?.cancel(); this.roomLight?.cancel();
      this.roomReaction = this.roomLight = null; this.shell.dataset.workshopReaction = 'rest';
    }
    const pose = (this.renderer as PhaserSquishSurface).presentation();
    const feedback = enabled ? contactFeedback(this.gestureActive ? this.lastPress : 0, this.lastCompression, this.stretchReaction, pose.y) : contactFeedback(0, 0, 0, 0);
    const radiusRatio = Number.parseFloat(getComputedStyle(this.canvas).getPropertyValue('--squish-radius-ratio')) || .34;
    const offset = (this.renderer as PhaserSquishSurface).bodyOffset();
    const x = enabled ? offset.x * Math.min(this.canvas.clientWidth, this.canvas.clientHeight) * radiusRatio + pose.rotation * 20 : 0;
    const key = `${feedback.width.toFixed(3)}:${feedback.opacity.toFixed(3)}:${feedback.blur.toFixed(3)}:${x.toFixed(2)}`;
    if (key === this.contactKey) return;
    this.contactKey = key;
    stage.style.setProperty('--toy-contact-width', String(feedback.width));
    stage.style.setProperty('--toy-contact-opacity', String(feedback.opacity));
    stage.style.setProperty('--toy-contact-blur', `${feedback.blur}px`);
    stage.style.setProperty('--toy-contact-x', `${x.toFixed(2)}px`);
  }

  private refreshRigidMixins(): void {
    if (this.options.rendererBackend === 'phaser') { this.rigidMixinCanvas.hidden = true; return; }
    const hasRigidMixins = this.draft.appearance.mixins.some((placement) => this.overlayMixinIds().includes(getMixInId(placement)));
    if (!hasRigidMixins) {
      this.rigidMixinCanvas.hidden = true;
      if (this.rigidMixinFrame !== 0) cancelAnimationFrame(this.rigidMixinFrame);
      this.rigidMixinFrame = 0;
      this.rigidMixinContext.clearRect(0, 0, this.rigidMixinCanvas.width, this.rigidMixinCanvas.height);
      return;
    }
    this.rigidMixinCanvas.hidden = false;
    if (this.rigidMixinFrame === 0) this.rigidMixinFrame = requestAnimationFrame(this.updateRigidMixinOverlay);
  }

  private readonly updateRigidMixinOverlay = (): void => {
    const rigidPlacements = this.draft.appearance.mixins.filter((placement) => this.overlayMixinIds().includes(getMixInId(placement)));
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
      const cssRadiusRatio = Number.parseFloat(getComputedStyle(this.canvas).getPropertyValue('--squish-radius-ratio'));
      const radiusRatio = Number.isFinite(cssRadiusRatio) ? cssRadiusRatio : 0.34;
      const appearanceScale = Math.min(canvasRect.width, canvasRect.height) * radiusRatio * 2 / APPEARANCE_TEXTURE_SIZE;
      context.save();
      context.globalAlpha = this.draft.materialId === 'chrome' ? 0.42 : 1;
      if (this.options.rendererBackend === 'phaser' && this.stage === 'squeeze') {
        context.beginPath();
        for (const contour of getShapeContours(getShape(this.draft.shapeId))) {
        contour.forEach((p, index) => {
          const point = this.renderer.projectUvToCanvas(p.x * .5 + .5, p.y * .5 + .5);
          if (index === 0) context.moveTo(point.x, point.y); else context.lineTo(point.x, point.y);
        });
        context.closePath();
        }
        context.clip();
      }
      for (const placement of rigidPlacements) {
        const lag = this.options.rendererBackend === 'phaser' ? (this.renderer as PhaserSquishSurface).inclusionOffset() : { x: 0, y: 0 };
        const u = Math.min(.98, Math.max(.02, placement.x / 255 + lag.x * .5));
        const v = Math.min(.98, Math.max(.02, placement.y / 255 + lag.y * .5));
        // Taper drift near the canonical edge so authored inclusions stay inside.
        const bodyPoint = getShape(this.draft.shapeId);
        const inside = isPointInsideShape(bodyPoint, u * 2 - 1, v * 2 - 1);
        const center = this.renderer.projectUvToCanvas(inside ? u : placement.x / 255, inside ? v : placement.y / 255);
        const radius = Math.max(3.5, placement.s * appearanceScale * 0.5);
        if (getMixInId(placement) === 'pearls') context.drawImage(this.pearlSprite, center.x - radius, center.y - radius, radius * 2, radius * 2);
        else {
          context.save(); context.translate(center.x, center.y);
          const pose = (this.renderer as PhaserSquishSurface).presentation();
          context.rotate((placement.r / 255) * Math.PI * 2 - pose.rotation + (this.renderer as PhaserSquishSurface).freeRotation());
          const depth = this.draft.materialId === 'jelly' ? ((placement.x * 7 + placement.y * 3 + placement.r) % 5) / 4 : 0;
          drawToyMixIn(context, getMixInId(placement), radius, placement.r, depth);
          context.restore();
        }
      }
      context.restore();
    }

    if (this.options.rendererBackend !== 'phaser') this.rigidMixinFrame = requestAnimationFrame(this.updateRigidMixinOverlay);
  };

  private accessoryCanvasAt(index: number): HTMLCanvasElement {
    if (index === 0) return this.accessoryCanvas;
    if (index === 1) return this.accessorySecond;
    if (!this.extraAccessories[index - 2]) {
      const canvas = document.createElement('canvas'); canvas.width = 180; canvas.height = 120;
      canvas.className = 'sandbox-accessory-layer'; canvas.setAttribute('aria-hidden', 'true');
      this.accessorySecond.after(canvas); this.extraAccessories[index - 2] = canvas;
    }
    return this.extraAccessories[index - 2]!;
  }

  private refreshAccessoryGraphic(): void {
    const pieces = accessoryPlacements(this.draft.decor, getShape(this.draft.shapeId));
    this.accessoryRestU = pieces.map(() => 0); this.accessoryRestV = pieces.map(() => 0);
    for (const canvas of [this.accessoryCanvas, this.accessorySecond, ...this.extraAccessories]) canvas.hidden = true;
    for (const [index, placement] of pieces.entries()) {
      const canvas = this.accessoryCanvasAt(index), ctx = canvas.getContext('2d')!;
      canvas.hidden = false; canvas.dataset.accessoryId = placement.a;
      canvas.dataset.accessoryIndex = String(index); canvas.dataset.accessoryDepth = getAccessoryDepth(placement.a);
      drawAccessoryPiece(ctx, placement.a, 180, 120, placement.side, placement.mirrored);
      if (placement.color !== undefined) tintAccessory(ctx, 180, 120, placement.color);
      // Measure once when the art changes; transparent source margins are not part of the selection.
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let left = canvas.width, top = canvas.height, right = -1, bottom = -1;
      for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
        if (pixels[(y * canvas.width + x) * 4 + 3]! <= 24) continue;
        left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
      }
      if (right >= left) this.accessoryInkBounds.set(canvas, { x: left / canvas.width, y: top / canvas.height,
        width: (right - left + 1) / canvas.width, height: (bottom - top + 1) / canvas.height });
      else this.accessoryInkBounds.delete(canvas);
    }
    if (!pieces.length) {
      this.updateObjectSelection();
      this.foregroundFace.hidden=true;
      this.accessoryCanvas.removeAttribute('data-accessory-id');
      if (this.accessoryFrame) cancelAnimationFrame(this.accessoryFrame); this.accessoryFrame = 0; return;
    }
    this.updateAccessoryOverlay();
  }

  private readonly updateAccessoryOverlay = (): void => {
    if (this.disposed || !accessoryPlacements(this.draft.decor, getShape(this.draft.shapeId)).length) {
      this.accessoryFrame = 0;
      return;
    }
    const shape = getShape(this.draft.shapeId), pieces = accessoryPlacements(this.draft.decor, shape);
    for (let piece = 0; piece < pieces.length; piece++) {
      const placement = pieces[piece]!, accessoryCanvas = this.accessoryCanvasAt(piece);
      const frame = this.draft.decor.accessories ? accessoryFrame(shape, placement) : getDecorFrame(shape, placement.a, placement.side);
      // Project the actual accessory seat through the deformed mesh. The previous
      // anchor+offset extrapolation was only locally linear and visibly detached
      // crown/bow under strong full-screen pulls.
      const seatV = Math.min(1, Math.max(0, frame.headAnchor.v + frame.headSeatOffsetV));
      const seat = this.renderer.projectUvToCanvas(frame.headAnchor.u, seatV);
      const left = this.renderer.projectUvToCanvas(frame.headAnchor.u - frame.headBasisU, seatV);
      const right = this.renderer.projectUvToCanvas(frame.headAnchor.u + frame.headBasisU, seatV);
      const down = this.renderer.projectUvToCanvas(frame.headAnchor.u, Math.max(0, seatV - frame.headBasisV));
      const basisU = { x: right.x - left.x, y: right.y - left.y };
      const basisV = { x: down.x - seat.x, y: down.y - seat.y };
      const lengthU = Math.max(0.001, Math.hypot(basisU.x, basisU.y));
      const lengthV = Math.max(0.001, Math.hypot(basisV.x, basisV.y));
      if (this.accessoryRestU[piece]! <= 0) this.accessoryRestU[piece] = lengthU;
      if (this.accessoryRestV[piece]! <= 0) this.accessoryRestV[piece] = lengthV;
      const clampRatio = (value: number): number => Math.min(1.35, Math.max(0.72, value));
      const ratioU = clampRatio(lengthU / this.accessoryRestU[piece]!);
      const ratioV = clampRatio(lengthV / this.accessoryRestV[piece]!);
      const normUx = basisU.x / lengthU;
      const normUy = basisU.y / lengthU;
      // Head gear is rigid: it follows the deformed attachment point, but must not
      // inherit arbitrary mesh shear or a near-vertical tangent during an extreme
      // full-screen pull. A modest tilt still sells the deformation.
      const rawAngle = Math.atan2(normUy, normUx);
      const idleSway = this.options.rendererBackend === 'phaser' ? (this.renderer as PhaserSquishSurface).presentation().sway : 0;
      const motion = this.activityBlocked || this.reducedMotion.matches ? { angle: 0, lift: 0, scale: 1 } : accessoryMotion(placement.a, performance.now() - this.releasedAt, this.releaseStrength, piece);
      const sway = this.activityBlocked || this.reducedMotion.matches ? 0 : idleSway + motion.angle;
      const free = this.options.rendererBackend === 'phaser' && (this.renderer as PhaserSquishSurface).isFreeSqueeze();
      const angle = (free ? rawAngle : Math.min(Math.PI / 6, Math.max(-Math.PI / 6, rawAngle))) + frame.headAngle + sway;
      accessoryCanvas.dataset.accessorySway = sway.toFixed(4);
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);
      const rigidScale = Math.min(1.12, Math.max(0.90, Math.sqrt(ratioU * ratioV))) * motion.scale * placement.s;
      const a = cosAngle * rigidScale;
      const b = sinAngle * rigidScale;
      const c = -sinAngle * rigidScale;
      const d = cosAngle * rigidScale;
      const canvasRect = this.canvas.getBoundingClientRect();
      const stageRect = this.canvas.parentElement?.getBoundingClientRect();
      if (stageRect) {
        const anchorX = canvasRect.left - stageRect.left + seat.x;
        const anchorY = canvasRect.top - stageRect.top + seat.y - motion.lift * canvasRect.height;
        const width = accessoryCanvas.offsetWidth || 160;
        const height = accessoryCanvas.offsetHeight || 107;
        // Pages' live overlay previously left the broad crown/bow visibly hovering
        // even after the shared surface anchor was correct in Hall. Seat only these
        // Phaser preview assets a few pixels deeper; ordinary/Yandex keeps the
        // established overlay position.
        const liveSeatFactor = this.options.rendererBackend === 'phaser'
          ? getAccessorySeatFactor(shape, placement.a)
          : 0.92;
        accessoryCanvas.style.left = (anchorX - width * 0.5).toFixed(2) + 'px';
        accessoryCanvas.style.top = (anchorY - height * liveSeatFactor).toFixed(2) + 'px';
        // Rotate/scale around the exact attachment point. A fixed 92% origin made
        // crown/bow orbit away from the deformed head because their reviewed
        // seating factors are intentionally lower than the generic accessory seat.
        accessoryCanvas.style.transformOrigin = `50% ${(liveSeatFactor * 100).toFixed(1)}%`;
        accessoryCanvas.style.transform = 'matrix(' + [a, b, c, d].map((value) => value.toFixed(4)).join(',') + ',0,0)';
        accessoryCanvas.dataset.accessoryAnchorX = anchorX.toFixed(2);
        accessoryCanvas.dataset.accessoryAnchorY = anchorY.toFixed(2);
        accessoryCanvas.dataset.accessoryMatrix = [a, b, c, d].map((value) => value.toFixed(4)).join(',');
      }
    }
    if (this.options.rendererBackend !== 'phaser') this.updateObjectSelection();
    this.updateForegroundFace();
    if (this.options.rendererBackend !== 'phaser') this.accessoryFrame = requestAnimationFrame(this.updateAccessoryOverlay);
  };

  private updateObjectSelection(): void {
    const selected = this.shell.dataset.selectedObject?.match(/^(accessory|sticker):(\d+)$/);
    const visible = this.stage === 'decor' && this.decorSection === 'objects' && !this.tryOn && !!selected;
    if (!visible) {
      if (this.accessorySelectionFrame) this.accessorySelectionFrame.hidden = true;
      return;
    }
    const index = Number(selected![2]);
    if (selected![1] === 'sticker') {
      const item = this.draft.decor.stickers[index];
      if (!item) { if (this.accessorySelectionFrame) this.accessorySelectionFrame.hidden = true; return; }
      if (!this.accessorySelectionFrame) {
        this.accessorySelectionFrame = document.createElement('div');
        this.accessorySelectionFrame.className = 'accessory-selection-frame';
        this.accessorySelectionFrame.setAttribute('aria-hidden', 'true');
        this.canvas.parentElement!.append(this.accessorySelectionFrame);
      }
      const frame = this.accessorySelectionFrame;
      const center = this.renderer.projectUvToCanvas(item.x / 255, item.y / 255);
      const left = this.renderer.projectUvToCanvas(item.x / 255 - item.s / 512, item.y / 255);
      const right = this.renderer.projectUvToCanvas(item.x / 255 + item.s / 512, item.y / 255);
      const size = Math.hypot(right.x - left.x, right.y - left.y) + 10;
      const canvasRect = this.canvas.getBoundingClientRect(), parent = this.canvas.parentElement!.getBoundingClientRect();
      frame.hidden = false; frame.removeAttribute('data-accessory-selection');
      frame.dataset.stickerSelection = String(index);
      frame.style.left = `${canvasRect.left - parent.left + center.x - size / 2}px`;
      frame.style.top = `${canvasRect.top - parent.top + center.y - size / 2}px`;
      frame.style.width = frame.style.height = `${size}px`;
      frame.style.transformOrigin = '50% 50%';
      frame.style.transform = `rotate(${item.r / 255 * 360}deg)`;
      return;
    }
    const canvas = this.accessoryCanvasAt(index), bounds = this.accessoryInkBounds.get(canvas);
    if (canvas.hidden || !bounds) {
      if (this.accessorySelectionFrame) this.accessorySelectionFrame.hidden = true;
      return;
    }
    if (!this.accessorySelectionFrame) {
      this.accessorySelectionFrame = document.createElement('div');
      this.accessorySelectionFrame.className = 'accessory-selection-frame';
      this.accessorySelectionFrame.setAttribute('aria-hidden', 'true');
      canvas.parentElement!.append(this.accessorySelectionFrame);
    }
    const frame = this.accessorySelectionFrame, padding = 5;
    const x = bounds.x * canvas.offsetWidth - padding, y = bounds.y * canvas.offsetHeight - padding;
    const origin = canvas.style.transformOrigin.split(' ');
    frame.hidden = false; frame.removeAttribute('data-sticker-selection'); frame.dataset.accessorySelection = String(index);
    frame.style.left = `${Number.parseFloat(canvas.style.left) + x}px`;
    frame.style.top = `${Number.parseFloat(canvas.style.top) + y}px`;
    frame.style.width = `${bounds.width * canvas.offsetWidth + padding * 2}px`;
    frame.style.height = `${bounds.height * canvas.offsetHeight + padding * 2}px`;
    frame.style.transformOrigin = `${Number.parseFloat(origin[0]!) / 100 * canvas.offsetWidth - x}px ${Number.parseFloat(origin[1]!) / 100 * canvas.offsetHeight - y}px`;
    frame.style.transform = canvas.style.transform;
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
      roughness: material.roughness,
      metallic: material.metallic,
      pearlescence: material.pearlescence,
      cloudiness: material.cloudiness,
      materialId,
      ...(this.draft.appearance.light ? { light: this.draft.appearance.light } : {}),
    };
    this.audio.setMaterial(materialId);
    this.renderer.setMaterial(style);
    this.shell.dataset.material = materialId;
  }

  private setStage(next: SandboxStage): void {
    this.clearPlacementFeedback();
    if (this.toolsOpen) this.setToolsOpen(false);
    this.releasedAt = -Infinity; this.gestureStrength = 0; this.gestureActive = false;
    const overlayChanged = this.options.rendererBackend === 'phaser' && (next === 'squeeze') !== (this.stage === 'squeeze');
    this.stage = next;
    this.shell.dataset.stage = next;
    const crafting = next === 'shape' || next === 'paint' || next === 'mixins' || next === 'decor';
    this.shell.dataset.crafting = String(crafting);
    this.updatePressed('[data-craft-section]', 'craftSection', next);
    if (!crafting) {
      this.tryOn = false; this.shell.dataset.tryOn = 'false';
      this.requireElement<HTMLButtonElement>('[data-action="try-return"]').hidden = true;
    }
    const details = this.stageCopy(next);
    this.stageStep.textContent = details.step;
    this.stageTitle.textContent = details.title;
    this.stageHint.textContent = details.hint;
    this.status.textContent = next === 'mix'
      ? (this.mixDistance >= MIX_DISTANCE_FOR_COMPLETE_PX ? this.copy.mixReady : this.copy.mixMore) : '';
    this.updateHistoryUi();
    const inCraft = next === 'shape' || next === 'paint' || next === 'mixins' || next === 'mix' || next === 'decor' || next === 'finish';
    this.requireElement<HTMLButtonElement>('[data-action="stage-back"]').hidden = true;
    this.requireElement<HTMLButtonElement>('[data-action="exit-craft"]').hidden = !inCraft || !this.options.onExitToLibrary;
    this.requireElement<HTMLElement>('[data-sandbox-brand]').hidden = false;
    for (const panel of this.root.querySelectorAll<HTMLElement>('[data-panel]')) {
      panel.hidden = panel.dataset.panel !== next;
    }
    this.updateAppearanceLimitUi();
    this.syncInteractivity();
    if (overlayChanged) this.replayAndUpload();
    if (next === 'squeeze' && !this.gestureHintSeen) this.stageHint.textContent = this.options.language === 'ru' ? 'Погладь или сожми двумя пальцами.' : 'Stroke it or squeeze with two fingers.';
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
    const blocked = this.activityBlocked || this.exitConfirmOpen || this.toolsOpen || this.saving;
    if (blocked) { this.clearPlacementFeedback(); this.roomReaction?.cancel(); this.roomLight?.cancel(); this.shell.dataset.workshopReaction = 'rest'; }
    if (this.options.rendererBackend === 'phaser') {
      (this.renderer as PhaserSquishSurface).setStudioStage(this.tryOn ? 'finish' : this.stage, this.decorSection);
      (this.renderer as PhaserSquishSurface).setActivityBlocked(blocked);
      return;
    }
    const shouldRenderInteract = !blocked && (this.tryOn || this.stage === 'mix' || this.stage === 'finish' || this.stage === 'squeeze');
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
    const hasLiveStroke = this.authoredPoints.length > 0;
    const hasMaterialDecor = this.options.rendererBackend === 'phaser'
      ? this.draft.decor.stickers.length > 0
      : hasSurfaceDecor(this.draft.decor);
    if (!hasLiveStroke && appearance.strokes.length === 0 && appearance.mixins.length === 0 && !hasMaterialDecor && !hasShapeRelief(this.draft.shapeId)) {
      this.renderer.setAppearanceTexture(null);
    } else {
      this.renderer.setAppearanceTexture(this.appearanceCanvas);
    }
  }

  private uploadFaceNow(): void {
    if (this.options.rendererBackend !== 'phaser') return;
    const hasFace = hasShapeRelief(this.draft.shapeId) || hasSurfaceDecor(this.draft.decor);
    (this.renderer as PhaserSquishSurface).setFaceTexture(hasFace ? this.faceCanvas : null);
  }

  private replayAndUpload(): void {
    this.updateHistoryUi();
    if (this.options.rendererBackend === 'phaser') {
      renderToyPigment(this.appearanceContext, this.draft.appearance, this.draft.materialId, this.draft.shapeId);
      this.inclusionCanvas.width = this.inclusionCanvas.height = APPEARANCE_TEXTURE_SIZE;
      const inclusions = this.inclusionCanvas.getContext('2d');
      if (inclusions) renderToyInclusions(inclusions, this.draft.appearance, this.draft.materialId);
      (this.renderer as PhaserSquishSurface).setInclusionTexture(this.draft.appearance.mixins.length ? this.inclusionCanvas : null);
      renderToyInk(this.faceContext, this.draft.decor, this.draft.shapeId, this.reaction);
    } else {
      replayAppearanceDocument(this.appearanceContext, this.draft.appearance, { excludeMixIns: this.overlayMixinIds(), materialId: this.draft.materialId, shapeId: this.draft.shapeId });
      renderSurfaceDecor(this.appearanceContext, this.draft.decor, getShape(this.draft.shapeId));
    }
    this.refreshForegroundFaceSource();
    this.uploadAppearanceNow();
    this.uploadFaceNow();
    this.refreshRigidMixins();
    this.updateAppearanceDataset();
  }

  private updateAppearanceDataset(): void {
    this.shell.dataset.appearanceBytes = String(estimateAppearanceBytes(this.draft.appearance));
    this.shell.dataset.paintStrokes = String(this.draft.appearance.strokes.length);
    this.shell.dataset.mixinCount = String(this.draft.appearance.mixins.length);
    this.setAppearanceLimitReached(this.draft.appearance.mixins.length >= MAX_MIXIN_PLACEMENTS);
    this.updateAppearanceLimitUi();
    for (const [action, empty] of [
      ['paint-undo', !this.draftHistory.canUndo],
      ['paint-clear', this.draft.appearance.strokes.length === 0],
      ['mixin-undo', !this.draftHistory.canUndo],
      ['mixin-clear', this.draft.appearance.mixins.length === 0],
    ] as const) {
      const button = this.root.querySelector<HTMLButtonElement>(`[data-action="${action}"]`);
      if (button) button.disabled = empty;
    }
    this.updateDecorUi();
  }

  public setMuted(muted: boolean): void {
    if (this.disposed) return;
    this.muted = muted;
    this.renderer.setMuted(this.muted);
    this.muteButton.setAttribute('aria-pressed', String(this.muted));
    this.muteButton.textContent = this.muted ? this.copy.muted : this.copy.sound;
  }

  private toggleMuted(): void {
    this.setMuted(!this.muted);
    void this.options.onMutedChange(this.muted);
  }

  private updatePressed(selector: string, datasetKey: string, value: string): void {
    for (const button of this.root.querySelectorAll<HTMLButtonElement>(selector)) {
      const selected = button.dataset[datasetKey] === value;
      if (button.getAttribute('role') === 'tab') {
        button.setAttribute('aria-selected', String(selected));
        button.tabIndex = selected ? 0 : -1;
      } else {
        button.setAttribute('aria-pressed', String(selected));
      }
    }
  }

  private readonly handleMetrics = (metrics: SquishMetrics): void => {
    if (!this.shell || this.disposed) return;
    if (this.options.rendererBackend !== 'phaser' && this.gestureActive && !metrics.active && this.gestureStrength > .05) {
      this.releasedAt = performance.now(); this.releaseStrength = this.gestureStrength;
    }
    this.gestureActive = metrics.active;
    this.lastPress = metrics.pressDepth; this.lastCompression = metrics.compression;
    this.strokeDelight = metrics.stroking ?? 0;
    this.stretchReaction = metrics.stretch ?? 0;
    this.shell.dataset.squishPointers = String(metrics.pointers ?? (metrics.active ? 1 : 0));
    this.shell.dataset.squishStroking = this.strokeDelight.toFixed(3);
    this.shell.dataset.squishStretch = this.stretchReaction.toFixed(3);
    this.gestureStrength = metrics.active ? (this.options.rendererBackend === 'phaser'
      ? heldFaceStrength(metrics.pressDepth, metrics.compression, metrics.maxDisplacement, performance.now() - this.gestureBeganAt)
      : Math.min(1, Math.max(metrics.pressDepth * 2, metrics.compression * 3, metrics.maxDisplacement * 1.5))) : 0;
    this.shell.dataset.sandboxSqueezes = String(metrics.squeezes);
    this.shell.dataset.fps = String(Math.round(metrics.fps));
    this.shell.dataset.squishMaxDisplacement = metrics.maxDisplacement.toFixed(3);
    this.shell.dataset.gestureX = metrics.gestureX.toFixed(3);
    this.shell.dataset.gestureY = metrics.gestureY.toFixed(3);
    this.shell.dataset.squishActive = String(metrics.active);
  };

  private requireElement<T extends Element>(selector: string): T {
    const element = this.root.querySelector<T>(selector);
    if (!element) throw new Error(`Sandbox UI missing: ${selector}`);
    return element;
  }
  private updateHistoryUi(): void {
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-action="draft-undo"], [data-action="paint-undo"], [data-action="mixin-undo"]')) button.disabled = !this.draftHistory.canUndo;
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-action="draft-redo"]')) button.disabled = !this.draftHistory.canRedo;
  }
  private restoreDraftHistory(redo: boolean): void {
    this.freeEditor.end(); this.draftHistory.end(this.draft);
    const draft = redo ? this.draftHistory.redo(this.draft) : this.draftHistory.undo(this.draft);
    if (!draft) return;
    this.draftHistory.restoring = true; this.draft = draft; this.draftHistory.restoring = false;
    this.setAppearanceLimitReached(false); this.applyDraftToRenderer(); this.replayAndUpload();
    this.updatePressed('[data-shape]', 'shape', draft.shapeId);
    this.updatePressed('[data-material]', 'material', draft.materialId);
    this.syncCraftSettings(); this.updateDecorUi(); this.freeEditor.refresh(); this.updateHistoryUi();
  }

  private refreshForegroundFaceSource(): void {
    const ctx=this.foregroundFaceSource.getContext('2d')!;ctx.clearRect(0,0,256,256);
    renderSurfaceFace(ctx,{...this.draft.decor,blush:false},getShape(this.draft.shapeId),this.reaction);
  }
  private updateForegroundFace(): void {
    const show=Boolean(this.draft.decor.accessories?.length&&(this.draft.decor.eyes||this.draft.decor.mouth));
    this.foregroundFace.hidden=!show;if(!show)return;
    const rect=this.canvas.getBoundingClientRect(),stage=this.canvas.parentElement!.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
    const width=Math.round(rect.width*dpr),height=Math.round(rect.height*dpr);
    if(this.foregroundFace.width!==width||this.foregroundFace.height!==height){this.foregroundFace.width=width;this.foregroundFace.height=height;}
    Object.assign(this.foregroundFace.style,{left:`${rect.left-stage.left}px`,top:`${rect.top-stage.top}px`,width:`${rect.width}px`,height:`${rect.height}px`});
    const ctx=this.foregroundFace.getContext('2d')!;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,rect.width,rect.height);
    drawFaceForeground(ctx,this.foregroundFaceSource,getShape(this.draft.shapeId),(u,v)=>this.renderer.projectUvToCanvas(u,v));
  }

}
