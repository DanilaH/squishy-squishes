import { MAX_LIBRARY_CAPACITY, type SaveStateV3 } from './saveV3';

export const S5_SHELF_EXPANSION_REWARD_ID = 'reward:shelf-plus-2:v1';
export const S5_SHELF_EXPANSION_CAPACITY = 10;

export const hasS5ShelfExpansion = (state: Pick<SaveStateV3, 'unlockedRewardIds'>): boolean =>
  state.unlockedRewardIds.includes(S5_SHELF_EXPANSION_REWARD_ID);

export const grantS5ShelfExpansion = (
  state: SaveStateV3,
  updatedAt = Date.now(),
): SaveStateV3 => {
  const nextCapacity = Math.min(
    MAX_LIBRARY_CAPACITY,
    Math.max(state.libraryCapacity, S5_SHELF_EXPANSION_CAPACITY),
  );
  const alreadyOwned = hasS5ShelfExpansion(state);

  if (alreadyOwned && nextCapacity === state.libraryCapacity) return state;

  return {
    ...state,
    libraryCapacity: nextCapacity,
    unlockedRewardIds: alreadyOwned
      ? state.unlockedRewardIds
      : [...state.unlockedRewardIds, S5_SHELF_EXPANSION_REWARD_ID],
    updatedAt,
  };
};
