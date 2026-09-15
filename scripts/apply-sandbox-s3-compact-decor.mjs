import { readFileSync, writeFileSync } from 'node:fs';

const decorPath = 'src/sandbox/decor.ts';
let decor = readFileSync(decorPath, 'utf8');
const replaceDecor = (from, to) => {
  if (!decor.includes(from)) throw new Error(`decor.ts missing anchor: ${from.slice(0, 100)}`);
  decor = decor.replace(from, to);
};

replaceDecor(
`export interface DecorDocumentV1 {
  readonly v: 1;
  readonly eyes: EyeStyleId | null;
  readonly mouth: MouthStyleId | null;
  readonly blush: boolean;
  readonly stickers: readonly StickerPlacementV1[];
  readonly accessory: AccessoryId | null;
}
`,
`export interface DecorDocumentV1 {
  readonly v: 1;
  readonly eyes: EyeStyleId | null;
  readonly mouth: MouthStyleId | null;
  readonly blush: boolean;
  readonly stickers: readonly StickerPlacementV1[];
  readonly accessory: AccessoryId | null;
}

type EncodedStickerPlacementV1 = readonly [number, number, number, number, number];

interface EncodedDecorDocumentV1 {
  readonly v: 1;
  readonly e?: EyeStyleId;
  readonly m?: MouthStyleId;
  readonly b?: 1;
  readonly s?: readonly EncodedStickerPlacementV1[];
  readonly a?: AccessoryId;
}
`,
);

replaceDecor(
`const readSticker = (value: unknown): StickerPlacementV1 => {
  if (!isRecord(value)) throw new TypeError('Decor sticker must be an object.');
  const t = readByte(value.t, 'sticker type');
  if (t >= STICKER_IDS.length) throw new TypeError('Decor sticker type is unknown.');
  const s = readByte(value.s, 'sticker size');
  if (s < 14 || s > 72) throw new TypeError('Decor sticker size is out of range.');
  return {
    t,
    x: readByte(value.x, 'sticker x'),
    y: readByte(value.y, 'sticker y'),
    s,
    r: readByte(value.r, 'sticker rotation'),
  };
};

export const decodeDecorDocument = (value: unknown): DecorDocumentV1 => {
  if (!isRecord(value) || value.v !== 1) throw new TypeError('Unsupported decor document.');
  if (typeof value.blush !== 'boolean') throw new TypeError('Decor blush flag is invalid.');
  if (!Array.isArray(value.stickers)) throw new TypeError('Decor stickers must be an array.');
  if (value.stickers.length > MAX_DECOR_STICKERS) throw new TypeError('Decor has too many stickers.');
  return {
    v: 1,
    eyes: readNullableKnownId<EyeStyleId>(value.eyes, eyeIdSet, 'eyes'),
    mouth: readNullableKnownId<MouthStyleId>(value.mouth, mouthIdSet, 'mouth'),
    blush: value.blush,
    stickers: value.stickers.map(readSticker),
    accessory: readNullableKnownId<AccessoryId>(value.accessory, accessoryIdSet, 'accessory'),
  };
};
`,
`const readSticker = (value: unknown): StickerPlacementV1 => {
  let tRaw: unknown;
  let xRaw: unknown;
  let yRaw: unknown;
  let sRaw: unknown;
  let rRaw: unknown;
  if (Array.isArray(value)) {
    if (value.length !== 5) throw new TypeError('Compact decor sticker tuple is invalid.');
    [tRaw, xRaw, yRaw, sRaw, rRaw] = value;
  } else if (isRecord(value)) {
    tRaw = value.t;
    xRaw = value.x;
    yRaw = value.y;
    sRaw = value.s;
    rRaw = value.r;
  } else {
    throw new TypeError('Decor sticker must be an object or compact tuple.');
  }
  const t = readByte(tRaw, 'sticker type');
  if (t >= STICKER_IDS.length) throw new TypeError('Decor sticker type is unknown.');
  const s = readByte(sRaw, 'sticker size');
  if (s < 14 || s > 72) throw new TypeError('Decor sticker size is out of range.');
  return {
    t,
    x: readByte(xRaw, 'sticker x'),
    y: readByte(yRaw, 'sticker y'),
    s,
    r: readByte(rRaw, 'sticker rotation'),
  };
};

const readCompactBlush = (value: unknown): boolean => {
  if (value === undefined) return false;
  if (value === 1) return true;
  if (value === 0) return false;
  throw new TypeError('Compact decor blush flag is invalid.');
};

export const decodeDecorDocument = (value: unknown): DecorDocumentV1 => {
  if (!isRecord(value) || value.v !== 1) throw new TypeError('Unsupported decor document.');
  const eyesRaw = value.eyes !== undefined ? value.eyes : (value.e ?? null);
  const mouthRaw = value.mouth !== undefined ? value.mouth : (value.m ?? null);
  const accessoryRaw = value.accessory !== undefined ? value.accessory : (value.a ?? null);
  const blush = value.blush !== undefined
    ? (typeof value.blush === 'boolean' ? value.blush : (() => { throw new TypeError('Decor blush flag is invalid.'); })())
    : readCompactBlush(value.b);
  const stickersRaw = value.stickers !== undefined ? value.stickers : (value.s ?? []);
  if (!Array.isArray(stickersRaw)) throw new TypeError('Decor stickers must be an array.');
  if (stickersRaw.length > MAX_DECOR_STICKERS) throw new TypeError('Decor has too many stickers.');
  return {
    v: 1,
    eyes: readNullableKnownId<EyeStyleId>(eyesRaw, eyeIdSet, 'eyes'),
    mouth: readNullableKnownId<MouthStyleId>(mouthRaw, mouthIdSet, 'mouth'),
    blush,
    stickers: stickersRaw.map(readSticker),
    accessory: readNullableKnownId<AccessoryId>(accessoryRaw, accessoryIdSet, 'accessory'),
  };
};

export const encodeDecorDocument = (decor: DecorDocumentV1): EncodedDecorDocumentV1 => {
  const encoded: {
    v: 1;
    e?: EyeStyleId;
    m?: MouthStyleId;
    b?: 1;
    s?: EncodedStickerPlacementV1[];
    a?: AccessoryId;
  } = { v: 1 };
  if (decor.eyes !== null) encoded.e = decor.eyes;
  if (decor.mouth !== null) encoded.m = decor.mouth;
  if (decor.blush) encoded.b = 1;
  if (decor.stickers.length > 0) {
    encoded.s = decor.stickers.map((placement) => [
      placement.t,
      placement.x,
      placement.y,
      placement.s,
      placement.r,
    ] as const);
  }
  if (decor.accessory !== null) encoded.a = decor.accessory;
  return encoded;
};
`,
);

replaceDecor(
`export const estimateDecorBytes = (decor: DecorDocumentV1): number =>
  new TextEncoder().encode(JSON.stringify(decor)).byteLength;`,
`export const estimateDecorBytes = (decor: DecorDocumentV1): number =>
  new TextEncoder().encode(JSON.stringify(encodeDecorDocument(decor))).byteLength;`,
);
writeFileSync(decorPath, decor);

const savePath = 'src/platform/saveV3.ts';
let save = readFileSync(savePath, 'utf8');
const replaceSave = (from, to) => {
  if (!save.includes(from)) throw new Error(`saveV3.ts missing anchor: ${from.slice(0, 100)}`);
  save = save.replace(from, to);
};
replaceSave(
  "import { createEmptyDecorDocument, decodeDecorDocument } from '../sandbox/decor';",
  "import { createEmptyDecorDocument, decodeDecorDocument, encodeDecorDocument } from '../sandbox/decor';",
);
replaceSave(
`export const createSaveV3Repository = (storage: StorageAdapter): JsonStorageRepository<SaveStateV3> =>
  new JsonStorageRepository({
    storage,
    key: SAVE_V3_STORAGE_KEY,
    createDefault: createDefaultSaveV3,
    codec: {
      decode: decodeSaveStateV3,
      encode: (state) => state,
    },
  });`,
`export const encodeSaveStateV3 = (state: SaveStateV3): unknown => ({
  ...state,
  library: state.library.map((toy) => ({
    ...toy,
    decor: encodeDecorDocument(toy.decor),
  })),
});

export const createSaveV3Repository = (storage: StorageAdapter): JsonStorageRepository<SaveStateV3> =>
  new JsonStorageRepository({
    storage,
    key: SAVE_V3_STORAGE_KEY,
    createDefault: createDefaultSaveV3,
    codec: {
      decode: decodeSaveStateV3,
      encode: encodeSaveStateV3,
    },
  });`,
);
replaceSave(
`export const estimateSaveStateV3Bytes = (state: SaveStateV3): number =>
  new TextEncoder().encode(JSON.stringify(state)).byteLength;`,
`export const estimateSaveStateV3Bytes = (state: SaveStateV3): number =>
  new TextEncoder().encode(JSON.stringify(encodeSaveStateV3(state))).byteLength;`,
);
writeFileSync(savePath, save);
