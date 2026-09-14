import { JsonStorageRepository, type StorageAdapter } from '@danilah/mini-games-kit/platform';

export const SETTINGS_STORAGE_KEY = 'squishy.settings.v1';

export interface SettingsV1 {
  readonly version: 1;
  readonly muted: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const createDefaultSettings = (): SettingsV1 => ({
  version: 1,
  muted: false,
});

export const decodeSettings = (value: unknown): SettingsV1 => {
  if (!isRecord(value)) throw new TypeError('Settings root must be an object');
  if (value.version !== 1) throw new TypeError(`Unsupported settings version: ${String(value.version)}`);
  if (typeof value.muted !== 'boolean') throw new TypeError('Settings muted must be boolean');

  return {
    version: 1,
    muted: value.muted,
  };
};

export const createSettingsRepository = (storage: StorageAdapter): JsonStorageRepository<SettingsV1> =>
  new JsonStorageRepository({
    storage,
    key: SETTINGS_STORAGE_KEY,
    createDefault: createDefaultSettings,
    codec: {
      decode: decodeSettings,
      encode: (settings) => settings,
    },
  });
