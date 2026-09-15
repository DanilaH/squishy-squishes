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

export const SQUISHY_IDEAS: readonly SquishyIdea[] = ALL_VARIANTS.map((variant) => ({
  id: variant.id,
  labelEn: variant.label,
  shapeId: variant.choice.shape,
  paletteId: variant.choice.palette,
  paintColor: IDEA_PAINT_COLORS[variant.choice.palette],
  materialId: variant.choice.material,
  requiredMixin: MIXIN_BY_FILLING[variant.choice.filling],
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
};

const EN_MIXINS: Readonly<Record<MixInId, string>> = {
  glitter: 'Glitter',
  stars: 'Stars',
  foam: 'Foam',
  pearls: 'Pearls',
  hearts: 'Hearts',
  confetti: 'Confetti',
};

const RU_MIXINS: Readonly<Record<MixInId, string>> = {
  glitter: 'Блёстки',
  stars: 'Звёзды',
  foam: 'Пенки',
  pearls: 'Жемчуг',
  hearts: 'Сердечки',
  confetti: 'Конфетти',
};

export const getIdeaLabel = (idea: SquishyIdea, language: IdeaLanguage): string => {
  if (language === 'en') return idea.labelEn;
  return `${RU_SHAPES[idea.shapeId]} · ${RU_PALETTES[idea.paletteId]}`;
};

export const getIdeaMaterialLabel = (idea: SquishyIdea, language: IdeaLanguage): string => {
  if (language === 'ru') return RU_MATERIALS[idea.materialId];
  if (idea.materialId === 'soft') return 'Soft';
  if (idea.materialId === 'jelly') return 'Jelly';
  return 'Holo';
};

export const getIdeaMixinLabel = (idea: SquishyIdea, language: IdeaLanguage): string | null => {
  if (idea.requiredMixin === null) return null;
  return language === 'ru' ? RU_MIXINS[idea.requiredMixin] : EN_MIXINS[idea.requiredMixin];
};

export const getIdeaShapeLabel = (idea: SquishyIdea, language: IdeaLanguage): string => {
  if (language === 'ru') return RU_SHAPES[idea.shapeId];
  if (idea.shapeId === 'soft-square') return 'Soft Cube';
  return idea.shapeId.charAt(0).toUpperCase() + idea.shapeId.slice(1);
};
