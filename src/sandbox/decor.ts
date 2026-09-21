import type { ShapeDefinition } from '../game/shapes';
import { APPEARANCE_TEXTURE_SIZE, type AppearancePoint } from './appearance';

export const MAX_DECOR_STICKERS = 12;

export const EYE_STYLE_IDS = ['dot', 'happy', 'sleepy'] as const;
export const MOUTH_STYLE_IDS = ['smile', 'o', 'cat'] as const;
export const STICKER_IDS = ['heart', 'star', 'flower', 'sparkle'] as const;
export const ACCESSORY_IDS = ['cat-ears', 'bunny-ears', 'horns', 'bow', 'crown'] as const;

export type EyeStyleId = (typeof EYE_STYLE_IDS)[number];
export type MouthStyleId = (typeof MOUTH_STYLE_IDS)[number];
export type StickerId = (typeof STICKER_IDS)[number];
export type AccessoryId = (typeof ACCESSORY_IDS)[number];

export interface StickerPlacementV1 {
  readonly t: number;
  readonly x: number;
  readonly y: number;
  readonly s: number;
  readonly r: number;
}

export interface DecorDocumentV1 {
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

export interface DecorFrame {
  readonly eyesLeft: AppearancePoint;
  readonly eyesRight: AppearancePoint;
  readonly mouth: AppearancePoint;
  readonly blushLeft: AppearancePoint;
  readonly blushRight: AppearancePoint;
  readonly headAnchor: AppearancePoint;
  readonly headBasisU: number;
  readonly headBasisV: number;
  readonly headSeatOffsetV: number;
}

type PagesDecorArt = {
  render: (context: CanvasRenderingContext2D, decor: DecorDocumentV1, shape: ShapeDefinition, frame: DecorFrame) => void;
  accessory: (context: CanvasRenderingContext2D, accessory: AccessoryId, width: number, height: number) => void;
};
let pagesDecorArt: PagesDecorArt | null = null;
/** Only the /phaser/ entrypoint opts into the new authored transparent art. */
export const registerPagesDecorArt = (renderer: PagesDecorArt): void => { pagesDecorArt = renderer; };

const eyeIdSet = new Set<string>(EYE_STYLE_IDS);
const mouthIdSet = new Set<string>(MOUTH_STYLE_IDS);
const accessoryIdSet = new Set<string>(ACCESSORY_IDS);
const stickerCodeById = new Map<StickerId, number>(STICKER_IDS.map((id, index) => [id, index]));
const TAU = Math.PI * 2;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const clamp01 = (value: number): number => clamp(value, 0, 1);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const toUv = (x: number, y: number): AppearancePoint => ({
  u: clamp01(x * 0.5 + 0.5),
  v: clamp01(y * 0.5 + 0.5),
});
const pointToCanvas = (point: AppearancePoint): readonly [number, number] => [
  point.u * APPEARANCE_TEXTURE_SIZE,
  (1 - point.v) * APPEARANCE_TEXTURE_SIZE,
];

export const createEmptyDecorDocument = (): DecorDocumentV1 => ({
  v: 1,
  eyes: null,
  mouth: null,
  blush: false,
  stickers: [],
  accessory: null,
});

const readNullableKnownId = <T extends string>(
  value: unknown,
  known: ReadonlySet<string>,
  field: string,
): T | null => {
  if (value === null) return null;
  if (typeof value !== 'string' || !known.has(value)) throw new TypeError(`Decor ${field} is invalid.`);
  return value as T;
};

const readByte = (value: unknown, field: string): number => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 255) {
    throw new TypeError(`Decor ${field} must be a byte.`);
  }
  return value;
};

const readSticker = (value: unknown): StickerPlacementV1 => {
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

export const getStickerId = (placement: StickerPlacementV1): StickerId =>
  STICKER_IDS[placement.t] ?? 'heart';

export const createStickerPlacement = (
  id: StickerId,
  point: AppearancePoint,
  index: number,
): StickerPlacementV1 => ({
  t: stickerCodeById.get(id) ?? 0,
  x: Math.round(clamp01(point.u) * 255),
  y: Math.round(clamp01(point.v) * 255),
  s: 28 + ((index * 11 + (stickerCodeById.get(id) ?? 0) * 7) % 17),
  r: (index * 47 + (stickerCodeById.get(id) ?? 0) * 29) % 256,
});

export const stickerPlacementPoint = (placement: StickerPlacementV1): AppearancePoint => ({
  u: placement.x / 255,
  v: placement.y / 255,
});

export const estimateDecorBytes = (decor: DecorDocumentV1): number =>
  new TextEncoder().encode(JSON.stringify(encodeDecorDocument(decor))).byteLength;

export const hasSurfaceDecor = (decor: DecorDocumentV1): boolean =>
  decor.eyes !== null || decor.mouth !== null || decor.blush || decor.stickers.length > 0;

export const getDecorFrame = (shape: ShapeDefinition): DecorFrame => {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const point of shape.boundary) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }
  const width = Math.max(0.3, maxX - minX);
  const height = Math.max(0.3, maxY - minY);
  const centerX = (minX + maxX) * 0.5;
  const centerY = (minY + maxY) * 0.5;
  const eyeY = centerY + height * 0.085;
  const eyeDx = width * 0.135;
  const mouthY = centerY - height * 0.075;
  const blushY = centerY - height * 0.015;
  const blushDx = width * 0.225;

  // Attach head accessories to the actual upper contour at the horizontal center.
  // Using only maxY makes concave shapes (notably the heart) place the anchor in empty space.
  let topBoundaryY = Number.NEGATIVE_INFINITY;
  for (let index = 0; index < shape.boundary.length; index += 1) {
    const a = shape.boundary[index]!;
    const b = shape.boundary[(index + 1) % shape.boundary.length]!;
    const minSegmentX = Math.min(a.x, b.x);
    const maxSegmentX = Math.max(a.x, b.x);
    if (centerX < minSegmentX - 1e-6 || centerX > maxSegmentX + 1e-6) continue;
    const dx = b.x - a.x;
    if (Math.abs(dx) <= 1e-6) {
      if (Math.abs(centerX - a.x) <= 1e-6) topBoundaryY = Math.max(topBoundaryY, a.y, b.y);
      continue;
    }
    const t = (centerX - a.x) / dx;
    if (t >= 0 && t <= 1) topBoundaryY = Math.max(topBoundaryY, a.y + (b.y - a.y) * t);
  }
  const headSurfaceY = Number.isFinite(topBoundaryY) ? topBoundaryY : maxY;
  const headY = headSurfaceY - height * 0.025;
  // Keep the accessory's familiar visual seat near the top of the shape, but derive
  // deformation from a real surface point. The offset is replayed along the live
  // projected vertical basis, so concave shapes do not float or swallow accessories.
  const headSeatY = maxY - height * 0.055;
  const headSeatOffsetV = (headSeatY - headY) * 0.5;
  return {
    eyesLeft: toUv(centerX - eyeDx, eyeY),
    eyesRight: toUv(centerX + eyeDx, eyeY),
    mouth: toUv(centerX, mouthY),
    blushLeft: toUv(centerX - blushDx, blushY),
    blushRight: toUv(centerX + blushDx, blushY),
    headAnchor: toUv(centerX, headY),
    headBasisU: clamp(width * 0.11 * 0.5, 0.055, 0.12),
    headBasisV: clamp(height * 0.09 * 0.5, 0.045, 0.10),
    headSeatOffsetV,
  };
};

const strokeRoundLine = (
  context: CanvasRenderingContext2D,
  points: readonly [number, number][],
  width: number,
  color: string,
): void => {
  const first = points[0];
  if (!first) return;
  context.save();
  context.beginPath();
  context.moveTo(first[0], first[1]);
  for (const point of points.slice(1)) context.lineTo(point[0], point[1]);
  context.lineWidth = width;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = color;
  context.stroke();
  context.restore();
};

const drawEye = (
  context: CanvasRenderingContext2D,
  style: EyeStyleId,
  point: AppearancePoint,
): void => {
  const [x, y] = pointToCanvas(point);
  context.save();
  context.strokeStyle = '#49384f';
  context.fillStyle = '#49384f';
  context.lineCap = 'round';
  if (style === 'dot') {
    context.beginPath();
    context.arc(x, y, 7.2, 0, TAU);
    context.fill();
  } else if (style === 'happy') {
    context.beginPath();
    context.arc(x, y + 5, 10, Math.PI * 1.12, Math.PI * 1.88);
    context.lineWidth = 6;
    context.stroke();
  } else {
    strokeRoundLine(context, [[x - 9, y], [x, y + 3], [x + 9, y]], 5.5, '#49384f');
  }
  context.restore();
};

const drawMouth = (
  context: CanvasRenderingContext2D,
  style: MouthStyleId,
  point: AppearancePoint,
): void => {
  const [x, y] = pointToCanvas(point);
  context.save();
  context.strokeStyle = '#5a3e52';
  context.fillStyle = '#5a3e52';
  context.lineCap = 'round';
  context.lineJoin = 'round';
  if (style === 'smile') {
    context.beginPath();
    context.arc(x, y - 4, 14, 0.18 * Math.PI, 0.82 * Math.PI);
    context.lineWidth = 5.5;
    context.stroke();
  } else if (style === 'o') {
    context.beginPath();
    context.ellipse(x, y + 2, 6.5, 8.5, 0, 0, TAU);
    context.lineWidth = 4.5;
    context.stroke();
  } else {
    strokeRoundLine(context, [[x - 13, y - 1], [x - 5, y + 6], [x, y], [x + 5, y + 6], [x + 13, y - 1]], 4.5, '#5a3e52');
  }
  context.restore();
};

const drawBlush = (context: CanvasRenderingContext2D, point: AppearancePoint): void => {
  const [x, y] = pointToCanvas(point);
  const gradient = context.createRadialGradient(x, y, 0, x, y, 16);
  gradient.addColorStop(0, 'rgba(255, 112, 147, 0.55)');
  gradient.addColorStop(1, 'rgba(255, 112, 147, 0)');
  context.save();
  context.fillStyle = gradient;
  context.fillRect(x - 16, y - 16, 32, 32);
  context.restore();
};

const drawStickerShape = (
  context: CanvasRenderingContext2D,
  id: StickerId,
  size: number,
): void => {
  const radius = size * 0.5;
  context.lineJoin = 'round';
  if (id === 'heart') {
    context.beginPath();
    context.moveTo(0, radius * 0.75);
    context.bezierCurveTo(-radius * 1.15, radius * 0.05, -radius * 0.8, -radius * 0.85, 0, -radius * 0.28);
    context.bezierCurveTo(radius * 0.8, -radius * 0.85, radius * 1.15, radius * 0.05, 0, radius * 0.75);
    context.fillStyle = '#ff719d';
    context.fill();
    return;
  }
  if (id === 'star') {
    context.beginPath();
    for (let index = 0; index < 10; index += 1) {
      const angle = -Math.PI / 2 + (index / 10) * TAU;
      const r = index % 2 === 0 ? radius : radius * 0.45;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
    context.fillStyle = '#ffd563';
    context.fill();
    return;
  }
  if (id === 'flower') {
    context.fillStyle = '#ff99c9';
    for (let index = 0; index < 6; index += 1) {
      const angle = (index / 6) * TAU;
      context.beginPath();
      context.ellipse(Math.cos(angle) * radius * 0.48, Math.sin(angle) * radius * 0.48, radius * 0.38, radius * 0.24, angle, 0, TAU);
      context.fill();
    }
    context.beginPath();
    context.arc(0, 0, radius * 0.24, 0, TAU);
    context.fillStyle = '#ffe170';
    context.fill();
    return;
  }
  context.strokeStyle = '#fff6a8';
  context.lineWidth = Math.max(3, size * 0.16);
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(-radius, 0);
  context.lineTo(radius, 0);
  context.moveTo(0, -radius);
  context.lineTo(0, radius);
  context.moveTo(-radius * 0.55, -radius * 0.55);
  context.lineTo(radius * 0.55, radius * 0.55);
  context.moveTo(radius * 0.55, -radius * 0.55);
  context.lineTo(-radius * 0.55, radius * 0.55);
  context.stroke();
};

export const renderSurfaceDecor = (
  context: CanvasRenderingContext2D,
  decor: DecorDocumentV1,
  shape: ShapeDefinition,
): void => {
  const frame = getDecorFrame(shape);
  if (pagesDecorArt) { pagesDecorArt.render(context, decor, shape, frame); return; }
  if (decor.eyes) {
    drawEye(context, decor.eyes, frame.eyesLeft);
    drawEye(context, decor.eyes, frame.eyesRight);
  }
  if (decor.mouth) drawMouth(context, decor.mouth, frame.mouth);
  if (decor.blush) {
    drawBlush(context, frame.blushLeft);
    drawBlush(context, frame.blushRight);
  }
  for (const placement of decor.stickers) {
    const [x, y] = pointToCanvas(stickerPlacementPoint(placement));
    context.save();
    context.translate(x, y);
    context.rotate((placement.r / 255) * TAU);
    drawStickerShape(context, getStickerId(placement), placement.s);
    context.restore();
  }
};

export const drawAccessoryGraphic = (
  context: CanvasRenderingContext2D,
  accessory: AccessoryId,
  width: number,
  height: number,
): void => {
  if (pagesDecorArt) { pagesDecorArt.accessory(context, accessory, width, height); return; }
  context.clearRect(0, 0, width, height);
  const cx = width * 0.5;
  const bottom = height * 0.92;
  const ink = '#6c4a72';
  const pink = '#f39dc2';
  context.save();
  context.translate(cx, bottom);
  context.lineJoin = 'round';
  context.lineCap = 'round';

  if (accessory === 'cat-ears') {
    context.fillStyle = '#d8a7df';
    context.strokeStyle = ink;
    context.lineWidth = 4;
    for (const dir of [-1, 1]) {
      context.beginPath();
      context.moveTo(dir * 8, 0);
      context.lineTo(dir * 58, -5);
      context.lineTo(dir * 40, -64);
      context.closePath();
      context.fill();
      context.stroke();
      context.beginPath();
      context.moveTo(dir * 26, -15);
      context.lineTo(dir * 45, -18);
      context.lineTo(dir * 39, -46);
      context.closePath();
      context.fillStyle = pink;
      context.fill();
      context.fillStyle = '#d8a7df';
    }
  } else if (accessory === 'bunny-ears') {
    context.strokeStyle = ink;
    context.lineWidth = 4;
    for (const dir of [-1, 1]) {
      context.save();
      context.translate(dir * 30, -30);
      context.rotate(dir * 0.08);
      context.beginPath();
      context.ellipse(0, -30, 19, 55, 0, 0, TAU);
      context.fillStyle = '#e6c6ee';
      context.fill();
      context.stroke();
      context.beginPath();
      context.ellipse(0, -31, 8, 37, 0, 0, TAU);
      context.fillStyle = pink;
      context.fill();
      context.restore();
    }
  } else if (accessory === 'horns') {
    context.fillStyle = '#f4d47b';
    context.strokeStyle = ink;
    context.lineWidth = 4;
    for (const dir of [-1, 1]) {
      context.beginPath();
      context.moveTo(dir * 14, 0);
      context.quadraticCurveTo(dir * 48, -18, dir * 52, -56);
      context.quadraticCurveTo(dir * 22, -43, dir * 14, 0);
      context.fill();
      context.stroke();
    }
  } else if (accessory === 'bow') {
    context.fillStyle = '#ff82b3';
    context.strokeStyle = ink;
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(-4, -18);
    context.bezierCurveTo(-28, -52, -68, -50, -58, -12);
    context.bezierCurveTo(-38, 4, -17, -2, -4, -12);
    context.closePath();
    context.fill();
    context.stroke();
    context.beginPath();
    context.moveTo(4, -18);
    context.bezierCurveTo(28, -52, 68, -50, 58, -12);
    context.bezierCurveTo(38, 4, 17, -2, 4, -12);
    context.closePath();
    context.fill();
    context.stroke();
    context.beginPath();
    context.arc(0, -16, 14, 0, TAU);
    context.fillStyle = '#ffd2e3';
    context.fill();
    context.stroke();
  } else {
    context.fillStyle = '#ffe06e';
    context.strokeStyle = ink;
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(-58, -4);
    context.lineTo(-48, -48);
    context.lineTo(-18, -24);
    context.lineTo(0, -66);
    context.lineTo(18, -24);
    context.lineTo(48, -48);
    context.lineTo(58, -4);
    context.closePath();
    context.fill();
    context.stroke();
    for (const x of [-34, 0, 34]) {
      context.beginPath();
      context.arc(x, -12, 5, 0, TAU);
      context.fillStyle = '#ff91b7';
      context.fill();
    }
  }
  context.restore();
};
