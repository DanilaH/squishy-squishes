export type RoomCategory = 'furniture' | 'shelves' | 'posters' | 'rugs' | 'details';
export type RoomSlot = 'left' | 'right' | 'shelf' | 'wall' | 'rug' | 'garland' | 'detail';
export const ROOM_SLOTS: readonly RoomSlot[] = ['left', 'right', 'shelf', 'wall', 'rug', 'garland', 'detail'];
export interface RoomItem {
  readonly id: string;
  readonly ru: string;
  readonly en: string;
  readonly category: RoomCategory;
  readonly slots: readonly RoomSlot[];
}
const floorSlots: readonly RoomSlot[] = ['left', 'right'];
export const ROOM_ITEMS: readonly RoomItem[] = [
  { id: 'dresser', ru: 'Комод', en: 'Dresser', category: 'furniture', slots: floorSlots },
  { id: 'cart', ru: 'Тележка', en: 'Craft cart', category: 'furniture', slots: floorSlots },
  { id: 'pouf', ru: 'Пуфик', en: 'Pouf', category: 'furniture', slots: floorSlots },
  { id: 'plant', ru: 'Растение', en: 'Plant', category: 'furniture', slots: floorSlots },
  { id: 'basket', ru: 'Корзинка', en: 'Basket', category: 'furniture', slots: floorSlots },
  { id: 'side-table', ru: 'Тумбочка', en: 'Side table', category: 'furniture', slots: floorSlots },
  { id: 'lamp', ru: 'Лампа-тюльпан', en: 'Tulip lamp', category: 'furniture', slots: floorSlots },
  { id: 'paw-pouf', ru: 'Пуфик-лапка', en: 'Paw pouf', category: 'furniture', slots: floorSlots },
  { id: 'shelf-fillers', ru: 'Баночки', en: 'Filler jars', category: 'shelves', slots: ['shelf'] },
  { id: 'shelf-ribbons', ru: 'Ленты и кисти', en: 'Ribbons and brushes', category: 'shelves', slots: ['shelf'] },
  { id: 'shelf-stickers', ru: 'Коробочки стикеров', en: 'Sticker boxes', category: 'shelves', slots: ['shelf'] },
  { id: 'figurine-shelf', ru: 'Мини-сквиши', en: 'Mini squishies', category: 'shelves', slots: ['shelf'] },
  { id: 'picture', ru: 'Картина', en: 'Picture', category: 'posters', slots: ['wall'] },
  { id: 'board', ru: 'Доска вдохновения', en: 'Mood board', category: 'posters', slots: ['wall'] },
  { id: 'mirror', ru: 'Зеркало-цветок', en: 'Flower mirror', category: 'posters', slots: ['wall'] },
  { id: 'organizer', ru: 'Органайзер', en: 'Organizer', category: 'posters', slots: ['wall'] },
  { id: 'rug-oval', ru: 'Овальный коврик', en: 'Oval rug', category: 'rugs', slots: ['rug'] },
  { id: 'rug-flower', ru: 'Коврик-цветок', en: 'Flower rug', category: 'rugs', slots: ['rug'] },
  { id: 'rug-cloud', ru: 'Коврик-облачко', en: 'Cloud rug', category: 'rugs', slots: ['rug'] },
  { id: 'rug-donut', ru: 'Коврик-пончик', en: 'Donut rug', category: 'rugs', slots: ['rug'] },
  { id: 'garland', ru: 'Гирлянда', en: 'Garland', category: 'details', slots: ['garland'] },
  { id: 'gift-box', ru: 'Коробка с бантом', en: 'Gift box', category: 'details', slots: ['detail'] },
];
export const CATEGORY_SLOTS: Readonly<Record<RoomCategory, readonly RoomSlot[]>> = {
  furniture: floorSlots, shelves: ['shelf'], posters: ['wall'], rugs: ['rug'], details: ['garland', 'detail'],
};
export const roomItemUrl = (id: string): string => `${import.meta.env.BASE_URL}assets/room/${id}.webp`;
let ready: Promise<void> | null = null;
const retained = new Map<string, HTMLImageElement>();
export const roomItemReady = (id: string): boolean => retained.has(id);
/** Room furniture is decoded before the default Library is shown. */
export const preloadRoomItems = (): Promise<void> => ready ??= Promise.allSettled(ROOM_ITEMS.map(async item => {
  const image = new Image(); image.src = roomItemUrl(item.id); await image.decode();
  if (!image.naturalWidth || !image.naturalHeight) throw new Error(`Empty room asset: ${item.id}`);
  retained.set(item.id, image);
})).then(results => {
  if (results.some(result => result.status === 'rejected')) throw new Error('Some room assets could not load');
}).catch(error => { ready = null; throw error; });
