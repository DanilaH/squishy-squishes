import { createEmptyDecorDocument, type DecorDocumentV1, type AccessoryId, type EyeStyleId } from './decor';
import {
  ALL_VARIANTS,
  type FillingId,
  type MaterialId,
  type PaletteId,
} from '../game/content';
import type { ShapeId } from '../game/shapes';
import { getMixInId, type MixInId } from './appearance';
import type { SandboxDraft } from './types';

export const IDEA_PAINT_COLORS: Readonly<Record<PaletteId, number>> = {
  grape: 0xd58cff,
  strawberry: 0xff79a8,
  lime: 0x92df83,
  aqua: 0x63e6e2,
  prism: 0xd58cff,
  milk: 0xffdc70,
  peach: 0xffa46f,
};

const MIXIN_BY_FILLING: Readonly<Record<FillingId, MixInId | null>> = {
  smooth: null,
  beads: 'foam',
  pearls: 'pearls',
};

export interface SquishyIdea {
  readonly id: string;
  readonly labelEn: string;
  readonly labelRu?: string;
  readonly decor?: DecorDocumentV1;
  readonly shapeId: ShapeId;
  readonly paletteId: PaletteId;
  readonly paintColor: number;
  readonly materialId: MaterialId;
  readonly requiredMixin: MixInId | null;
}

export interface IdeaMatchResult {
  readonly shape: boolean;
  readonly paint: boolean;
  readonly material: boolean;
  readonly mixin: boolean;
  readonly complete: boolean;
}

// Existing IDs and completion requirements remain stable. These free details
// are inspiration, never additional requirements for completing an old idea.
const featured: Record<string, readonly [string, string, AccessoryId, EyeStyleId]> = {
  'grape-smooth': ['Lavender royalty', 'Лавандовый принц', 'crown', 'happy'],
  'grape-beads': ['Bubble scientist', 'Пенный учёный', 'glasses', 'dot'],
  'strawberry-smooth': ['Berry ribbon', 'Ягодный бантик', 'bow', 'happy'],
  'strawberry-beads': ['Cherry pop', 'Вишнёвый поп', 'cherry', 'dot'],
  'lime-smooth': ['Garden friend', 'Садовый друг', 'petal-flower', 'sleepy'],
  'lime-beads': ['Tiny explorer', 'Маленький исследователь', 'antennae', 'happy'],
  'heart-grape-smooth': ['Sleepy kitten', 'Сонный котик', 'cat-ears', 'sleepy'],
  'heart-strawberry-smooth': ['Butterfly kiss', 'Поцелуй бабочки', 'butterfly', 'happy'],
};
const ideaDetails = (id: string): Pick<SquishyIdea, 'labelEn' | 'labelRu' | 'decor'> | Record<string, never> => {
  const spec = featured[id];
  return spec ? {labelEn: spec[0], labelRu: spec[1], decor: {...createEmptyDecorDocument(), eyes: spec[3], mouth: 'smile', blush: true, accessory: spec[2]}} : {};
};

export const SQUISHY_IDEAS: readonly SquishyIdea[] = ALL_VARIANTS.map((variant) => ({
  id: variant.id,
  labelEn: variant.label,
  shapeId: variant.choice.shape,
  paletteId: variant.choice.palette,
  paintColor: IDEA_PAINT_COLORS[variant.choice.palette],
  materialId: variant.choice.material,
  requiredMixin: MIXIN_BY_FILLING[variant.choice.filling],
  ...ideaDetails(variant.id),
}));

const ideaById = new Map(SQUISHY_IDEAS.map((idea) => [idea.id, idea] as const));

if (ideaById.size !== SQUISHY_IDEAS.length) throw new Error('Squishy Idea IDs must be unique.');

export const getSquishyIdea = (id: string): SquishyIdea | null => ideaById.get(id) ?? null;

export const matchSquishyIdea = (draft: SandboxDraft, idea: SquishyIdea): IdeaMatchResult => {
  const shape = draft.shapeId === idea.shapeId;
  const paint = draft.appearance.strokes.some((stroke) => stroke.m === 0 && stroke.c === idea.paintColor);
  const material = draft.materialId === idea.materialId;
  const mixin = idea.requiredMixin === null
    || draft.appearance.mixins.some((placement) => getMixInId(placement) === idea.requiredMixin);
  return {
    shape,
    paint,
    material,
    mixin,
    complete: shape && paint && material && mixin,
  };
};

export type IdeaLanguage = 'en' | 'ru';

const RU_SHAPES: Readonly<Record<ShapeId, string>> = {
  'soft-square': 'Кубик',
  heart: 'Сердечко',
  mochi: 'Моти',
  peach: 'Персик',
  mushroom: 'Грибочек',
  paw: 'Лапка',
  dumpling: 'Дамплинг',
  strawberry: 'Клубничка',
  donut: 'Пончик',
  bun: 'Булочка', 'ice-cream': 'Мороженое', cupcake: 'Кексик', watermelon: 'Арбузик', 'mochi-cat': 'Котик-моти', 'mochi-bunny': 'Зайчик-моти', ghost:'Призрак', bat:'Летучая мышь', pumpkin:'Тыква',
};

const RU_PALETTES: Readonly<Record<PaletteId, string>> = {
  grape: 'Лаванда',
  strawberry: 'Клубника',
  lime: 'Лайм',
  aqua: 'Аква',
  prism: 'Призма',
  milk: 'Ваниль',
  peach: 'Персик',
};

const RU_MATERIALS: Readonly<Record<MaterialId, string>> = {
  soft: 'Мягкий',
  jelly: 'Желе',
  holo: 'Голографик',
  marshmallow: 'Маршмеллоу',
  pearl: 'Перламутр',
  chrome: 'Металлик',
};

const EN_MATERIALS: Readonly<Record<MaterialId, string>> = {
  soft: 'Soft',
  jelly: 'Jelly',
  holo: 'Holo',
  marshmallow: 'Marshmallow',
  pearl: 'Pearl',
  chrome: 'Metallic',
};

const EN_MIXINS: Readonly<Record<MixInId, string>> = {
  glitter: 'Glitter',
  stars: 'Stars',
  foam: 'Foam',
  pearls: 'Pearls',
  hearts: 'Hearts',
  confetti: 'Confetti', crescents:'Crescents', bubbles:'Bubbles', 'strawberry-slices':'Berry slices', 'lemon-slices':'Lemon slices', 'kiwi-slices':'Kiwi slices', flowers:'Flowers', flakes:'Pearl flakes', bones:'Bones', candies:'Candy',
};

const RU_MIXINS: Readonly<Record<MixInId, string>> = {
  glitter: 'Блёстки',
  stars: 'Звёзды',
  foam: 'Пенки',
  pearls: 'Жемчуг',
  hearts: 'Сердечки',
  confetti: 'Конфетти', crescents:'Полумесяцы', bubbles:'Пузырьки', 'strawberry-slices':'Клубника', 'lemon-slices':'Лимон', 'kiwi-slices':'Киви', flowers:'Цветочки', flakes:'Хлопья', bones:'Косточки', candies:'Конфетки',
};

export const getIdeaLabel = (idea: SquishyIdea, language: IdeaLanguage): string => {
  if (language === 'en') return idea.labelEn;
  if (idea.labelRu) return idea.labelRu;
  return `${RU_SHAPES[idea.shapeId]} · ${RU_PALETTES[idea.paletteId]}`;
};

export const getIdeaMaterialLabel = (idea: SquishyIdea, language: IdeaLanguage): string =>
  language === 'ru' ? RU_MATERIALS[idea.materialId] : EN_MATERIALS[idea.materialId];

export const getIdeaMixinLabel = (idea: SquishyIdea, language: IdeaLanguage): string | null => {
  if (idea.requiredMixin === null) return null;
  return language === 'ru' ? RU_MIXINS[idea.requiredMixin] : EN_MIXINS[idea.requiredMixin];
};

export const getIdeaShapeLabel = (idea: SquishyIdea, language: IdeaLanguage): string => {
  if (language === 'ru') return RU_SHAPES[idea.shapeId];
  if (idea.shapeId === 'soft-square') return 'Soft Cube';
  return idea.shapeId.charAt(0).toUpperCase() + idea.shapeId.slice(1);
};
