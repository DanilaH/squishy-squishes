import { expect, test } from '@playwright/test';
import type { StorageAdapter } from '@danilah/mini-games-kit/platform';
import {
  SAVE_V3_RECOVERY_STORAGE_KEY,
  SAVE_V3_STORAGE_KEY,
  createDefaultSaveV3,
  createSaveV3Repository,
  loadSaveV3WithMigration,
} from '../../src/platform/saveV3';
import { SAVE_STORAGE_KEY as SAVE_V2_STORAGE_KEY } from '../../src/platform/save';

const createMemoryStorage = (initial: Readonly<Record<string, string>>): {
  readonly storage: StorageAdapter;
  readonly values: Map<string, string>;
} => {
  const values = new Map(Object.entries(initial));
  return {
    values,
    storage: {
      getItem: async (key) => values.get(key) ?? null,
      setItem: async (key, value) => { values.set(key, value); },
      removeItem: async (key) => { values.delete(key); },
    },
  };
};

test('corrupt V3 is preserved and a still-valid V2 save is recovered', async () => {
  const corrupt = '{"version":3,"library":"broken"}';
  const legacy = JSON.stringify({
    version: 2,
    completedVariantIds: [],
    totalCrafts: 3,
    labXp: 0,
    updatedAt: 2,
  });
  const { storage, values } = createMemoryStorage({
    [SAVE_V3_STORAGE_KEY]: corrupt,
    [SAVE_V2_STORAGE_KEY]: legacy,
  });
  const errors: unknown[] = [];

  const state = await loadSaveV3WithMigration(
    storage,
    createSaveV3Repository(storage),
    (error) => errors.push(error),
  );

  expect(state.version).toBe(3);
  expect(state.totalCrafts).toBe(3);
  expect(values.get(SAVE_V3_RECOVERY_STORAGE_KEY)).toBe(corrupt);
  expect(values.has(SAVE_V2_STORAGE_KEY)).toBe(false);
  expect(JSON.parse(values.get(SAVE_V3_STORAGE_KEY) ?? 'null')).toMatchObject({
    version: 3,
    totalCrafts: 3,
  });
  expect(errors).toHaveLength(1);
});

test('corrupt V3 without a legacy source falls back safely without discarding recovery bytes', async () => {
  const corrupt = 'not-json-at-all';
  const { storage, values } = createMemoryStorage({ [SAVE_V3_STORAGE_KEY]: corrupt });
  const errors: unknown[] = [];

  const state = await loadSaveV3WithMigration(
    storage,
    createSaveV3Repository(storage),
    (error) => errors.push(error),
  );

  expect(state).toEqual(createDefaultSaveV3());
  expect(values.get(SAVE_V3_RECOVERY_STORAGE_KEY)).toBe(corrupt);
  expect(JSON.parse(values.get(SAVE_V3_STORAGE_KEY) ?? 'null')).toEqual(createDefaultSaveV3());
  expect(errors).toHaveLength(1);

  const secondErrors: unknown[] = [];
  const second = await loadSaveV3WithMigration(
    storage,
    createSaveV3Repository(storage),
    (error) => secondErrors.push(error),
  );
  expect(second).toEqual(createDefaultSaveV3());
  expect(secondErrors).toEqual([]);
  expect(values.get(SAVE_V3_RECOVERY_STORAGE_KEY)).toBe(corrupt);
});
