import { ALL_VARIANTS, type VariantChoice } from './content';
import { SHAPES, type ShapeId } from './shapes';

export const FIRST_COMPLETION_XP = 100;
export const REPEAT_COMPLETION_XP = 25;

export type LabRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type RecipeCardState = 'locked' | 'available' | 'completed';
export type CollectionMilestone = 'first-squishy' | 'half-catalog' | 'full-shape' | 'full-catalog';

interface RankDefinition {
  readonly rank: LabRank;
  readonly minXp: number;
  readonly variantIds: readonly string[];
}

export const RANK_DEFINITIONS: readonly RankDefinition[] = [
  { rank: 1, minXp: 0, variantIds: ['grape-smooth', 'heart-strawberry-smooth'] },
  { rank: 2, minXp: 100, variantIds: ['strawberry-smooth', 'heart-grape-smooth', 'mochi-milk-soft-smooth'] },
  { rank: 3, minXp: 200, variantIds: ['grape-beads', 'heart-lime-smooth', 'peach-peach-soft-smooth'] },
  { rank: 4, minXp: 300, variantIds: ['lime-smooth', 'heart-grape-beads'] },
  { rank: 5, minXp: 400, variantIds: ['strawberry-beads', 'heart-strawberry-beads'] },
  { rank: 6, minXp: 500, variantIds: ['lime-beads', 'heart-lime-beads'] },
  { rank: 7, minXp: 600, variantIds: ['aqua-jelly-pearls', 'heart-aqua-jelly-smooth', 'peach-strawberry-jelly-smooth'] },
  { rank: 8, minXp: 700, variantIds: ['prism-holo-smooth', 'heart-prism-holo-pearls', 'mochi-prism-holo-pearls'] },
] as const;

const requiredRankByVariant = new Map<string, LabRank>();
for (const definition of RANK_DEFINITIONS) {
  for (const id of definition.variantIds) {
    if (requiredRankByVariant.has(id)) throw new Error(`Duplicate progression variant id: ${id}`);
    requiredRankByVariant.set(id, definition.rank);
  }
}

const canonicalIds = new Set(ALL_VARIANTS.map((variant) => variant.id));
if (requiredRankByVariant.size !== canonicalIds.size) throw new Error('Progression unlock table must cover every canonical variant exactly once.');
for (const id of canonicalIds) if (!requiredRankByVariant.has(id)) throw new Error(`Progression unlock table is missing variant: ${id}`);
for (const id of requiredRankByVariant.keys()) if (!canonicalIds.has(id)) throw new Error(`Progression unlock table contains unknown variant: ${id}`);

export interface ProgressionState {
  readonly completedVariantIds: readonly string[];
  readonly totalCrafts: number;
  readonly labXp: number;
}

export interface RankProgress {
  readonly rank: LabRank;
  readonly minXp: number;
  readonly nextRank: LabRank | null;
  readonly nextMinXp: number | null;
  readonly xpIntoRank: number;
  readonly xpForRank: number;
  readonly fraction: number;
}

export interface CollectionRecipeSnapshot {
  readonly id: string;
  readonly label: string;
  readonly choice: VariantChoice;
  readonly requiredRank: LabRank;
  readonly state: RecipeCardState;
}

export interface ShapeCollectionSnapshot {
  readonly shapeId: ShapeId;
  readonly shapeLabel: string;
  readonly completed: number;
  readonly total: number;
  readonly recipes: readonly CollectionRecipeSnapshot[];
}

export interface CollectionSnapshot {
  readonly completed: number;
  readonly total: number;
  readonly rank: LabRank;
  readonly rankProgress: RankProgress;
  readonly byShape: readonly ShapeCollectionSnapshot[];
}

export interface CompletionOutcome {
  readonly next: ProgressionState;
  readonly xpAward: number;
  readonly firstCompletion: boolean;
  readonly previousRank: LabRank;
  readonly currentRank: LabRank;
  readonly newlyUnlockedIds: readonly string[];
  readonly milestone: CollectionMilestone | null;
}

export const getRequiredRank = (variantId: string): LabRank => {
  const rank = requiredRankByVariant.get(variantId);
  if (rank === undefined) throw new Error(`Unknown progression variant: ${variantId}`);
  return rank;
};

export const getRankMinXp = (rank: LabRank): number => {
  const definition = RANK_DEFINITIONS.find((candidate) => candidate.rank === rank);
  if (!definition) throw new Error(`Unknown lab rank: ${rank}`);
  return definition.minXp;
};

export const getLabRank = (labXp: number): LabRank => {
  const xp = Math.max(0, Math.floor(labXp));
  let rank: LabRank = 1;
  for (const definition of RANK_DEFINITIONS) {
    if (xp >= definition.minXp) rank = definition.rank;
    else break;
  }
  return rank;
};

export const getRankProgress = (labXp: number): RankProgress => {
  const xp = Math.max(0, Math.floor(labXp));
  const rank = getLabRank(xp);
  const currentIndex = RANK_DEFINITIONS.findIndex((definition) => definition.rank === rank);
  const current = RANK_DEFINITIONS[currentIndex]!;
  const next = RANK_DEFINITIONS[currentIndex + 1] ?? null;
  if (!next) return { rank, minXp: current.minXp, nextRank: null, nextMinXp: null, xpIntoRank: 0, xpForRank: 0, fraction: 1 };
  const xpForRank = next.minXp - current.minXp;
  const xpIntoRank = Math.min(xpForRank, Math.max(0, xp - current.minXp));
  return { rank, minXp: current.minXp, nextRank: next.rank, nextMinXp: next.minXp, xpIntoRank, xpForRank, fraction: xpForRank <= 0 ? 1 : xpIntoRank / xpForRank };
};

export const getUnlockedVariantIds = (labXp: number): readonly string[] => {
  const rank = getLabRank(labXp);
  return RANK_DEFINITIONS.filter((definition) => definition.rank <= rank).flatMap((definition) => definition.variantIds);
};

export const isVariantUnlocked = (variantId: string, labXp: number): boolean => getRequiredRank(variantId) <= getLabRank(labXp);

const normalizeCompleted = (ids: readonly string[]): Set<string> => {
  const completed = new Set<string>();
  for (const id of ids) if (canonicalIds.has(id)) completed.add(id);
  return completed;
};

export const getHistoricalLabXp = (completedVariantIds: readonly string[], totalCrafts: number): number => {
  const completed = normalizeCompleted(completedVariantIds);
  const repeats = Math.max(0, Math.floor(totalCrafts) - completed.size);
  const awardEquivalent = completed.size * FIRST_COMPLETION_XP + repeats * REPEAT_COMPLETION_XP;
  let accessFloor = 0;
  for (const id of completed) accessFloor = Math.max(accessFloor, getRankMinXp(getRequiredRank(id)));
  return Math.max(awardEquivalent, accessFloor);
};

export const getCollectionSnapshot = (labXp: number, completedVariantIds: readonly string[]): CollectionSnapshot => {
  const completed = normalizeCompleted(completedVariantIds);
  const rank = getLabRank(labXp);
  const byShape = SHAPES.map((shape) => {
    const recipes = ALL_VARIANTS.filter((variant) => variant.choice.shape === shape.id).map<CollectionRecipeSnapshot>((variant) => {
      const requiredRank = getRequiredRank(variant.id);
      const state: RecipeCardState = completed.has(variant.id) ? 'completed' : requiredRank <= rank ? 'available' : 'locked';
      return { id: variant.id, label: variant.label, choice: variant.choice, requiredRank, state };
    });
    return { shapeId: shape.id, shapeLabel: shape.label, completed: recipes.filter((recipe) => recipe.state === 'completed').length, total: recipes.length, recipes } satisfies ShapeCollectionSnapshot;
  });
  return { completed: completed.size, total: ALL_VARIANTS.length, rank, rankProgress: getRankProgress(labXp), byShape };
};

const resolveMilestone = (previousCompletedIds: readonly string[], nextCompletedIds: readonly string[]): CollectionMilestone | null => {
  const previous = normalizeCompleted(previousCompletedIds);
  const next = normalizeCompleted(nextCompletedIds);
  if (previous.size < ALL_VARIANTS.length && next.size === ALL_VARIANTS.length) return 'full-catalog';
  const newlyCompletedShape = SHAPES.some((shape) => {
    const ids = ALL_VARIANTS.filter((variant) => variant.choice.shape === shape.id).map((variant) => variant.id);
    return !ids.every((id) => previous.has(id)) && ids.every((id) => next.has(id));
  });
  if (newlyCompletedShape) return 'full-shape';
  const half = Math.ceil(ALL_VARIANTS.length / 2);
  if (previous.size < half && next.size >= half) return 'half-catalog';
  if (previous.size === 0 && next.size > 0) return 'first-squishy';
  return null;
};

export const applyVariantCompletion = (state: ProgressionState, variantId: string): CompletionOutcome => {
  if (!canonicalIds.has(variantId)) throw new Error(`Unknown variant completion: ${variantId}`);
  if (!isVariantUnlocked(variantId, state.labXp)) throw new Error(`Locked variant completion: ${variantId}`);
  const previousCompleted = normalizeCompleted(state.completedVariantIds);
  const firstCompletion = !previousCompleted.has(variantId);
  const xpAward = firstCompletion ? FIRST_COMPLETION_XP : REPEAT_COMPLETION_XP;
  const previousRank = getLabRank(state.labXp);
  const previousUnlocked = new Set(getUnlockedVariantIds(state.labXp));
  previousCompleted.add(variantId);
  const completedVariantIds = [...previousCompleted];
  const labXp = state.labXp + xpAward;
  const currentRank = getLabRank(labXp);
  const newlyUnlockedIds = getUnlockedVariantIds(labXp).filter((id) => !previousUnlocked.has(id));
  return {
    next: { completedVariantIds, totalCrafts: state.totalCrafts + 1, labXp },
    xpAward,
    firstCompletion,
    previousRank,
    currentRank,
    newlyUnlockedIds,
    milestone: resolveMilestone(state.completedVariantIds, completedVariantIds),
  };
};
