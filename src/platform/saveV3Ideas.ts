import { ALL_VARIANT_IDS } from '../game/content';
import type { SaveStateV3 } from './saveV3';

const knownIdeaIds = new Set(ALL_VARIANT_IDS);

export const completeRecipeIdea = (
  state: SaveStateV3,
  ideaId: string,
  updatedAt = Date.now(),
): SaveStateV3 => {
  if (!knownIdeaIds.has(ideaId)) throw new TypeError(`Unknown Idea id: ${ideaId}`);
  if (state.completedRecipeIds.includes(ideaId)) return state;
  return {
    ...state,
    completedRecipeIds: [...state.completedRecipeIds, ideaId],
    updatedAt,
  };
};
