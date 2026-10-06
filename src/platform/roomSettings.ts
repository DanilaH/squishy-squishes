import { JsonStorageRepository, type StorageAdapter } from '@danilah/mini-games-kit/platform';
import { ROOM_ITEMS, ROOM_SLOTS, type RoomSlot } from '../sandbox/roomCatalog';
import { ROOM_PALETTES } from '../sandbox/roomPalettes';
export const ROOM_SETTINGS_KEY = 'squishy.room.v1';
export interface RoomSettings {
  readonly version: 1;
  readonly palette: number;
  readonly items: Readonly<Partial<Record<RoomSlot, string>>>;
}
export const defaultRoomSettings = (): RoomSettings => ({ version: 1, palette: 0, items: {} });
export const decodeRoomSettings = (value: unknown): RoomSettings => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new TypeError('Invalid room settings');
  const input = value as Record<string, unknown>;
  if (input.version !== 1) throw new TypeError('Unknown room version');
  if (typeof input.palette !== 'number' || !Number.isInteger(input.palette) || input.palette < 0 || input.palette >= ROOM_PALETTES.length) throw new TypeError('Invalid room palette');
  if (typeof input.items !== 'object' || input.items === null || Array.isArray(input.items)) throw new TypeError('Invalid room items');
  const raw = input.items as Record<string, unknown>;
  const items: Partial<Record<RoomSlot, string>> = {};
  for (const slot of ROOM_SLOTS) {
    if (raw[slot] === undefined) continue;
    const item = ROOM_ITEMS.find(candidate => candidate.id === raw[slot] && candidate.slots.includes(slot));
    // Unknown/removed content is discarded without losing remaining room choices.
    if (item) items[slot] = item.id;
  }
  return { version: 1, palette: input.palette, items };
};
export const createRoomSettingsRepository = (storage: StorageAdapter): JsonStorageRepository<RoomSettings> => new JsonStorageRepository({
  storage, key: ROOM_SETTINGS_KEY, createDefault: defaultRoomSettings,
  codec: { decode: decodeRoomSettings, encode: state => state },
});
