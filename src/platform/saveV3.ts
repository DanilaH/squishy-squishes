import { JsonStorageRepository, type StorageAdapter } from '@danilah/mini-games-kit/platform';
import { ALL_VARIANT_IDS, MATERIALS, type MaterialId } from '../game/content';
import { SHAPES, type ShapeId } from '../game/shapes';
import { decodeAppearanceDocument } from '../sandbox/appearance';
import type { SavedSquishy } from '../sandbox/types';
import {
  SAVE_STORAGE_KEY as SAVE_V2_STORAGE_KEY,
  createSaveRepository as createSaveV2Repository,
  loadSaveWithLegacyMigration,
  type SaveStateV2,
} from './save';

export const SAVE_V3_STORAGE_KEY = 'squishy.save.v3';
export const DEFAULT_LIBRARY_CAPACITY = 8;
export const MAX_LIBRARY_CAPACITY = 24;

export interface SaveStateV3 {
  readonly version: 3;
  readonly library: readonly SavedSquishy[];
  readonly libraryCapacity: number;
  readonly completedRecipeIds: readonly string[];
  readonly unlockedRewardIds: readonly string[];
  readonly totalCrafts: number;
  readonly updatedAt: number;
}

const knownShapeIds = new Set<ShapeId>(SHAPES.map((shape) => shape.id));
const knownMaterialIds = new Set<MaterialId>(MATERIALS.map((material) => material.id));
const knownRecipeIds = new Set<string>(ALL_VARIANT_IDS);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readNonNegativeInteger = (value: unknown, field: string): number => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new TypeError(`Save ${field} must be a non-negative integer.`);
  }
  return value;
};

const readTimestamp = (value: unknown, field: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new TypeError(`Save ${field} must be a non-negative finite number.`);
  }
  return value;
};

const readBoundedString = (value: unknown, field: string, maxLength = 96): string => {
  if (typeof value !== 'string' || value.length < 1 || value.length > maxLength) {
    throw new TypeError(`Save ${field} must be a bounded string.`);
  }
  return value;
};

const normalizeKnownStrings = (
  value: unknown,
  field: string,
  known: ReadonlySet<string> | null,
  maxItems: number,
): readonly string[] => {
  if (!Array.isArray(value)) throw new TypeError(`Save ${field} must be an array.`);
  if (value.length > maxItems) throw new TypeError(`Save ${field} has too many entries.`);
  const unique = new Set<string>();
  for (const candidate of value) {
    if (typeof candidate !== 'string' || candidate.length === 0 || candidate.length > 96) continue;
    if (known !== null && !known.has(candidate)) continue;
    unique.add(candidate);
  }
  return [...unique];
};

const readSavedSquishy = (value: unknown): SavedSquishy => {
  if (!isRecord(value)) throw new TypeError('Saved squishy must be an object.');
  const id = readBoundedString(value.id, 'saved squishy id');
  const createdAt = readTimestamp(value.createdAt, 'saved squishy createdAt');
  if (typeof value.shapeId !== 'string' || !knownShapeIds.has(value.shapeId as ShapeId)) {
    throw new TypeError('Saved squishy shapeId is invalid.');
  }
  if (typeof value.materialId !== 'string' || !knownMaterialIds.has(value.materialId as MaterialId)) {
    throw new TypeError('Saved squishy materialId is invalid.');
  }
  return {
    id,
    createdAt,
    shapeId: value.shapeId as ShapeId,
    materialId: value.materialId as MaterialId,
    appearance: decodeAppearanceDocument(value.appearance),
  };
};

export const createDefaultSaveV3 = (): SaveStateV3 => ({
  version: 3,
  library: [],
  libraryCapacity: DEFAULT_LIBRARY_CAPACITY,
  completedRecipeIds: [],
  unlockedRewardIds: [],
  totalCrafts: 0,
  updatedAt: 0,
});

export const decodeSaveStateV3 = (value: unknown): SaveStateV3 => {
  if (!isRecord(value)) throw new TypeError('Save root must be an object.');
  if (value.version !== 3) throw new TypeError(`Unsupported save version: ${String(value.version)}`);
  if (!Array.isArray(value.library)) throw new TypeError('Save library must be an array.');
  if (value.library.length > MAX_LIBRARY_CAPACITY) throw new TypeError('Save library exceeds the hard capacity.');

  const libraryCapacity = readNonNegativeInteger(value.libraryCapacity, 'libraryCapacity');
  if (libraryCapacity < 1 || libraryCapacity > MAX_LIBRARY_CAPACITY) {
    throw new TypeError('Save libraryCapacity is outside the supported range.');
  }

  const library = value.library.map(readSavedSquishy);
  if (library.length > libraryCapacity) throw new TypeError('Save library contains more toys than its capacity.');

  const ids = new Set<string>();
  for (const squishy of library) {
    if (ids.has(squishy.id)) throw new TypeError('Saved squishy ids must be unique.');
    ids.add(squishy.id);
  }

  return {
    version: 3,
    library,
    libraryCapacity,
    completedRecipeIds: normalizeKnownStrings(value.completedRecipeIds, 'completedRecipeIds', knownRecipeIds, 64),
    unlockedRewardIds: normalizeKnownStrings(value.unlockedRewardIds, 'unlockedRewardIds', null, 64),
    totalCrafts: readNonNegativeInteger(value.totalCrafts, 'totalCrafts'),
    updatedAt: readTimestamp(value.updatedAt, 'updatedAt'),
  };
};

export const createSaveV3Repository = (storage: StorageAdapter): JsonStorageRepository<SaveStateV3> =>
  new JsonStorageRepository({
    storage,
    key: SAVE_V3_STORAGE_KEY,
    createDefault: createDefaultSaveV3,
    codec: {
      decode: decodeSaveStateV3,
      encode: (state) => state,
    },
  });

export const migrateSaveV2ToV3 = (legacy: SaveStateV2, updatedAt = Date.now()): SaveStateV3 => ({
  version: 3,
  library: [],
  libraryCapacity: DEFAULT_LIBRARY_CAPACITY,
  completedRecipeIds: legacy.completedVariantIds.filter((id) => knownRecipeIds.has(id)),
  unlockedRewardIds: [],
  totalCrafts: legacy.totalCrafts,
  updatedAt,
});

export const loadSaveV3WithMigration = async (
  storage: StorageAdapter,
  repository: JsonStorageRepository<SaveStateV3>,
  onError: (error: unknown) => void,
): Promise<SaveStateV3> => {
  let currentRaw: string | null;
  try {
    currentRaw = await storage.getItem(SAVE_V3_STORAGE_KEY);
  } catch (error: unknown) {
    onError(error);
    return createDefaultSaveV3();
  }

  if (currentRaw !== null) {
    try {
      return await repository.load();
    } catch (error: unknown) {
      onError(error);
      return createDefaultSaveV3();
    }
  }

  const legacyRepository = createSaveV2Repository(storage);
  const legacyState = await loadSaveWithLegacyMigration(storage, legacyRepository, onError);
  const migrated = migrateSaveV2ToV3(legacyState);

  try {
    await repository.write(migrated);
    await repository.flush();
    await storage.removeItem(SAVE_V2_STORAGE_KEY);
  } catch (error: unknown) {
    onError(error);
  }

  return migrated;
};

const createSquishyId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `sq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export const createSavedSquishy = (
  input: Omit<SavedSquishy, 'id' | 'createdAt'>,
  createdAt = Date.now(),
): SavedSquishy => ({
  id: createSquishyId(),
  createdAt,
  shapeId: input.shapeId,
  materialId: input.materialId,
  appearance: input.appearance,
});

export const saveSingleS1Squishy = (
  state: SaveStateV3,
  squishy: SavedSquishy,
  updatedAt = Date.now(),
): SaveStateV3 => ({
  ...state,
  library: [squishy],
  totalCrafts: state.totalCrafts + 1,
  updatedAt,
});
