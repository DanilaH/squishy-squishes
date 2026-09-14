import { JsonStorageRepository, type StorageAdapter } from '@danilah/mini-games-kit/platform';
import { ALL_VARIANT_IDS } from '../game/content';
import {
  applyVariantCompletion,
  getHistoricalLabXp,
  type CompletionOutcome,
} from '../game/progression';

export const SAVE_STORAGE_KEY = 'squishy.save.v2';
export const PREVIOUS_SAVE_STORAGE_KEY = 'squishy.save.v1';
export const LEGACY_DISCOVERED_STORAGE_KEY = 'squishy.vertical-slice.discovered.v2';

export interface SaveStateV2 {
  readonly version: 2;
  readonly completedVariantIds: readonly string[];
  readonly totalCrafts: number;
  readonly labXp: number;
  readonly updatedAt: number;
}

interface SaveStateV1 {
  readonly version: 1;
  readonly completedVariantIds: readonly string[];
  readonly totalCrafts: number;
  readonly updatedAt: number;
}

export interface SaveCollectResult {
  readonly state: SaveStateV2;
  readonly outcome: CompletionOutcome;
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

export const createDefaultSave = (): SaveStateV2 => ({
  version: 2,
  completedVariantIds: [],
  totalCrafts: 0,
  labXp: 0,
  updatedAt: 0,
});

export const decodeSaveState = (value: unknown): SaveStateV2 => {
  if (!isRecord(value)) throw new TypeError('Save root must be an object');
  if (value.version !== 2) throw new TypeError(`Unsupported save version: ${String(value.version)}`);

  return {
    version: 2,
    completedVariantIds: normalizeVariantIds(value.completedVariantIds),
    totalCrafts: readNonNegativeInteger(value.totalCrafts, 'totalCrafts'),
    labXp: readNonNegativeInteger(value.labXp, 'labXp'),
    updatedAt: readFiniteTimestamp(value.updatedAt),
  };
};

const decodePreviousSave = (value: unknown): SaveStateV1 => {
  if (!isRecord(value)) throw new TypeError('Previous save root must be an object');
  if (value.version !== 1) throw new TypeError(`Unsupported previous save version: ${String(value.version)}`);
  return {
    version: 1,
    completedVariantIds: normalizeVariantIds(value.completedVariantIds),
    totalCrafts: readNonNegativeInteger(value.totalCrafts, 'totalCrafts'),
    updatedAt: readFiniteTimestamp(value.updatedAt),
  };
};

export const createSaveRepository = (storage: StorageAdapter): JsonStorageRepository<SaveStateV2> =>
  new JsonStorageRepository({
    storage,
    key: SAVE_STORAGE_KEY,
    createDefault: createDefaultSave,
    codec: {
      decode: decodeSaveState,
      encode: (state) => state,
    },
  });

const writeMigratedSave = async (
  storage: StorageAdapter,
  repository: JsonStorageRepository<SaveStateV2>,
  migrated: SaveStateV2,
  oldKey: string,
  onError: (error: unknown) => void,
): Promise<void> => {
  try {
    await repository.write(migrated);
    await storage.removeItem(oldKey);
  } catch (error: unknown) {
    onError(error);
  }
};

export const loadSaveWithLegacyMigration = async (
  storage: StorageAdapter,
  repository: JsonStorageRepository<SaveStateV2>,
  onError: (error: unknown) => void,
): Promise<SaveStateV2> => {
  let currentRaw: string | null;
  try {
    currentRaw = await storage.getItem(SAVE_STORAGE_KEY);
  } catch (error: unknown) {
    onError(error);
    return createDefaultSave();
  }

  if (currentRaw !== null) {
    try {
      return await repository.load();
    } catch (error: unknown) {
      onError(error);
      return createDefaultSave();
    }
  }

  let previousRaw: string | null;
  try {
    previousRaw = await storage.getItem(PREVIOUS_SAVE_STORAGE_KEY);
  } catch (error: unknown) {
    onError(error);
    return createDefaultSave();
  }

  if (previousRaw !== null) {
    try {
      const previous = decodePreviousSave(JSON.parse(previousRaw) as unknown);
      const migrated: SaveStateV2 = {
        version: 2,
        completedVariantIds: previous.completedVariantIds,
        totalCrafts: previous.totalCrafts,
        labXp: getHistoricalLabXp(previous.completedVariantIds, previous.totalCrafts),
        updatedAt: Date.now(),
      };
      await writeMigratedSave(storage, repository, migrated, PREVIOUS_SAVE_STORAGE_KEY, onError);
      return migrated;
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

  try {
    const completedVariantIds = normalizeVariantIds(JSON.parse(legacyRaw) as unknown);
    const totalCrafts = completedVariantIds.length;
    const migrated: SaveStateV2 = {
      version: 2,
      completedVariantIds,
      totalCrafts,
      labXp: getHistoricalLabXp(completedVariantIds, totalCrafts),
      updatedAt: Date.now(),
    };
    await writeMigratedSave(storage, repository, migrated, LEGACY_DISCOVERED_STORAGE_KEY, onError);
    return migrated;
  } catch (error: unknown) {
    onError(error);
    return createDefaultSave();
  }
};

export const resetProgressSave = async (
  storage: StorageAdapter,
  repository: JsonStorageRepository<SaveStateV2>,
): Promise<SaveStateV2> => {
  await repository.flush();
  await storage.removeItem(PREVIOUS_SAVE_STORAGE_KEY);
  await storage.removeItem(LEGACY_DISCOVERED_STORAGE_KEY);
  await repository.remove();
  return createDefaultSave();
};

export const applyCollectedVariant = (
  state: SaveStateV2,
  collectedVariantId: string,
  updatedAt = Date.now(),
): SaveCollectResult => {
  const outcome = applyVariantCompletion(state, collectedVariantId);
  return {
    outcome,
    state: {
      version: 2,
      completedVariantIds: outcome.next.completedVariantIds,
      totalCrafts: outcome.next.totalCrafts,
      labXp: outcome.next.labXp,
      updatedAt,
    },
  };
};
