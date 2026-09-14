import { JsonStorageRepository, type StorageAdapter } from '@danilah/mini-games-kit/platform';
import { ALL_VARIANT_IDS } from '../game/content';

export const SAVE_STORAGE_KEY = 'squishy.save.v1';
export const LEGACY_DISCOVERED_STORAGE_KEY = 'squishy.vertical-slice.discovered.v2';

export interface SaveStateV1 {
  readonly version: 1;
  readonly completedVariantIds: readonly string[];
  readonly totalCrafts: number;
  readonly updatedAt: number;
}

const knownVariantIds = new Set<string>(ALL_VARIANT_IDS);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeVariantIds = (value: unknown): readonly string[] => {
  if (!Array.isArray(value)) throw new TypeError('Save completedVariantIds must be an array');
  const unique = new Set<string>();
  for (const candidate of value) {
    if (typeof candidate === 'string' && knownVariantIds.has(candidate)) unique.add(candidate);
  }
  return [...unique];
};

const readNonNegativeInteger = (value: unknown, field: string): number => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new TypeError(`Save ${field} must be a non-negative integer`);
  }
  return value;
};

const readFiniteTimestamp = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new TypeError('Save updatedAt must be a non-negative finite number');
  }
  return value;
};

export const createDefaultSave = (): SaveStateV1 => ({
  version: 1,
  completedVariantIds: [],
  totalCrafts: 0,
  updatedAt: 0,
});

export const decodeSaveState = (value: unknown): SaveStateV1 => {
  if (!isRecord(value)) throw new TypeError('Save root must be an object');
  if (value.version !== 1) throw new TypeError(`Unsupported save version: ${String(value.version)}`);

  return {
    version: 1,
    completedVariantIds: normalizeVariantIds(value.completedVariantIds),
    totalCrafts: readNonNegativeInteger(value.totalCrafts, 'totalCrafts'),
    updatedAt: readFiniteTimestamp(value.updatedAt),
  };
};

export const createSaveRepository = (storage: StorageAdapter): JsonStorageRepository<SaveStateV1> =>
  new JsonStorageRepository({
    storage,
    key: SAVE_STORAGE_KEY,
    createDefault: createDefaultSave,
    codec: {
      decode: decodeSaveState,
      encode: (state) => state,
    },
  });

export const loadSaveWithLegacyMigration = async (
  storage: StorageAdapter,
  repository: JsonStorageRepository<SaveStateV1>,
  onError: (error: unknown) => void,
): Promise<SaveStateV1> => {
  let productionRaw: string | null;
  try {
    productionRaw = await storage.getItem(SAVE_STORAGE_KEY);
  } catch (error: unknown) {
    onError(error);
    return createDefaultSave();
  }

  if (productionRaw !== null) {
    try {
      return await repository.load();
    } catch (error: unknown) {
      onError(error);
      return createDefaultSave();
    }
  }

  let legacyRaw: string | null;
  try {
    legacyRaw = await storage.getItem(LEGACY_DISCOVERED_STORAGE_KEY);
  } catch (error: unknown) {
    onError(error);
    return createDefaultSave();
  }

  if (legacyRaw === null) return createDefaultSave();

  let completedVariantIds: readonly string[];
  try {
    completedVariantIds = normalizeVariantIds(JSON.parse(legacyRaw) as unknown);
  } catch (error: unknown) {
    onError(error);
    return createDefaultSave();
  }

  const migrated: SaveStateV1 = {
    version: 1,
    completedVariantIds,
    totalCrafts: completedVariantIds.length,
    updatedAt: Date.now(),
  };

  try {
    await repository.write(migrated);
    await storage.removeItem(LEGACY_DISCOVERED_STORAGE_KEY);
  } catch (error: unknown) {
    onError(error);
  }

  return migrated;
};

export const applyCollectedVariant = (
  state: SaveStateV1,
  collectedVariantId: string,
  updatedAt = Date.now(),
): SaveStateV1 => {
  const completed = new Set(state.completedVariantIds);
  if (knownVariantIds.has(collectedVariantId)) completed.add(collectedVariantId);

  return {
    version: 1,
    completedVariantIds: [...completed],
    totalCrafts: state.totalCrafts + 1,
    updatedAt,
  };
};
