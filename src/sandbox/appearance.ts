export const APPEARANCE_TEXTURE_SIZE = 256;
export const APPEARANCE_TARGET_BYTES = 6_000;
export const MAX_APPEARANCE_STROKES = 96;
export const MAX_STROKE_PAYLOAD_CHARS = 1_024;
export const MAX_MIXIN_PLACEMENTS = 160;
export const BODY_FILL_BRUSH_SIZE = 112;

export type AppearanceStrokeMode = 0 | 1;
export type MixInId = 'glitter' | 'stars' | 'foam' | 'pearls' | 'hearts' | 'confetti';

export interface AppearancePoint {
  readonly u: number;
  readonly v: number;
}

export interface AppearanceStrokeV1 {
  readonly m: AppearanceStrokeMode;
  readonly c: number;
  readonly s: number;
  readonly p: string;
}

export interface MixInPlacementV1 {
  readonly t: number;
  readonly x: number;
  readonly y: number;
  readonly s: number;
  readonly r: number;
}

export interface AppearanceDocumentV1 {
  readonly v: 1;
  readonly strokes: readonly AppearanceStrokeV1[];
  readonly mixins: readonly MixInPlacementV1[];
}

const MIXIN_IDS: readonly MixInId[] = ['glitter', 'stars', 'foam', 'pearls', 'hearts', 'confetti'];
const mixinCodeById = new Map<MixInId, number>(MIXIN_IDS.map((id, index) => [id, index]));

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const clamp01 = (value: number): number => clamp(value, 0, 1);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const encodeBytes = (bytes: Uint8Array): string => {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

const decodeBytes = (encoded: string): Uint8Array => {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
};

export const encodeAppearancePoints = (points: readonly AppearancePoint[]): string => {
  const quantized: number[] = [];
  let previousU = -1;
  let previousV = -1;

  for (const point of points) {
    const u = Math.round(clamp01(point.u) * 255);
    const v = Math.round(clamp01(point.v) * 255);
    if (u === previousU && v === previousV) continue;
    quantized.push(u, v);
    previousU = u;
    previousV = v;
  }

  return encodeBytes(Uint8Array.from(quantized));
};

export const decodeAppearancePoints = (encoded: string): readonly AppearancePoint[] => {
  if (encoded.length > MAX_STROKE_PAYLOAD_CHARS) throw new TypeError('Appearance stroke point payload is too large.');
  const bytes = decodeBytes(encoded);
  if (bytes.length % 2 !== 0) throw new TypeError('Appearance point payload must contain UV byte pairs.');

  const points: AppearancePoint[] = [];
  for (let index = 0; index < bytes.length; index += 2) {
    points.push({
      u: (bytes[index] ?? 0) / 255,
      v: (bytes[index + 1] ?? 0) / 255,
    });
  }
  return points;
};

export const createAppearanceStroke = (
  mode: AppearanceStrokeMode,
  color: number,
  sizePx: number,
  points: readonly AppearancePoint[],
): AppearanceStrokeV1 => ({
  m: mode,
  c: clamp(Math.floor(color), 0, 0xffffff),
  s: clamp(Math.round(sizePx), 1, 255),
  p: encodeAppearancePoints(points),
});

const BODY_FILL_POINTS: readonly AppearancePoint[] = Array.from({ length: 6 }, (_, row) => {
  const v = 0.04 + row * 0.184;
  return row % 2 === 0
    ? [{ u: 0.02, v }, { u: 0.98, v }]
    : [{ u: 0.98, v }, { u: 0.02, v }];
}).flat();
const BODY_FILL_POINT_PAYLOAD = encodeAppearancePoints(BODY_FILL_POINTS);

export const createBodyFillStroke = (color: number): AppearanceStrokeV1 =>
  createAppearanceStroke(0, color, BODY_FILL_BRUSH_SIZE, BODY_FILL_POINTS);

export const isBodyFillStroke = (stroke: AppearanceStrokeV1): boolean =>
  stroke.m === 0 && stroke.s === BODY_FILL_BRUSH_SIZE && stroke.p === BODY_FILL_POINT_PAYLOAD;

export const createMixInPlacement = (
  id: MixInId,
  point: AppearancePoint,
  sizePx: number,
  rotationTurns: number,
): MixInPlacementV1 => ({
  t: mixinCodeById.get(id) ?? 0,
  x: Math.round(clamp01(point.u) * 255),
  y: Math.round(clamp01(point.v) * 255),
  s: clamp(Math.round(sizePx), 4, 80),
  r: Math.round(((rotationTurns % 1 + 1) % 1) * 255),
});

export const getMixInId = (placement: MixInPlacementV1): MixInId => MIXIN_IDS[placement.t] ?? 'glitter';

export const createEmptyAppearanceDocument = (): AppearanceDocumentV1 => ({ v: 1, strokes: [], mixins: [] });

const readStroke = (value: unknown): AppearanceStrokeV1 => {
  if (!isRecord(value)) throw new TypeError('Appearance stroke must be an object.');
  if (value.m !== 0 && value.m !== 1) throw new TypeError('Appearance stroke mode is invalid.');
  if (typeof value.c !== 'number' || !Number.isInteger(value.c) || value.c < 0 || value.c > 0xffffff) {
    throw new TypeError('Appearance stroke color is invalid.');
  }
  if (typeof value.s !== 'number' || !Number.isInteger(value.s) || value.s < 1 || value.s > 255) {
    throw new TypeError('Appearance stroke size is invalid.');
  }
  if (typeof value.p !== 'string') throw new TypeError('Appearance stroke points are invalid.');
  decodeAppearancePoints(value.p);
  return { m: value.m, c: value.c, s: value.s, p: value.p };
};

const readByte = (value: unknown, field: string): number => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 255) {
    throw new TypeError(`Appearance mix-in ${field} is invalid.`);
  }
  return value;
};

const readMixIn = (value: unknown): MixInPlacementV1 => {
  if (!isRecord(value)) throw new TypeError('Appearance mix-in must be an object.');
  const t = readByte(value.t, 'type');
  if (t >= MIXIN_IDS.length) throw new TypeError('Appearance mix-in type is unknown.');
  const s = readByte(value.s, 'size');
  if (s < 4 || s > 80) throw new TypeError('Appearance mix-in size is out of range.');
  return {
    t,
    x: readByte(value.x, 'x'),
    y: readByte(value.y, 'y'),
    s,
    r: readByte(value.r, 'rotation'),
  };
};

export const decodeAppearanceDocument = (value: unknown): AppearanceDocumentV1 => {
  if (!isRecord(value) || value.v !== 1 || !Array.isArray(value.strokes)) {
    throw new TypeError('Unsupported appearance document.');
  }
  if (value.strokes.length > MAX_APPEARANCE_STROKES) throw new TypeError('Appearance has too many strokes.');
  const mixinsRaw = value.mixins === undefined ? [] : value.mixins;
  if (!Array.isArray(mixinsRaw)) throw new TypeError('Appearance mix-ins must be an array.');
  if (mixinsRaw.length > MAX_MIXIN_PLACEMENTS) throw new TypeError('Appearance has too many mix-ins.');
  return {
    v: 1,
    strokes: value.strokes.map(readStroke),
    mixins: mixinsRaw.map(readMixIn),
  };
};

export const stringifyAppearanceDocument = (document: AppearanceDocumentV1): string => JSON.stringify(document);
export const parseAppearanceDocument = (raw: string): AppearanceDocumentV1 =>
  decodeAppearanceDocument(JSON.parse(raw) as unknown);
export const estimateAppearanceBytes = (document: AppearanceDocumentV1): number =>
  new TextEncoder().encode(stringifyAppearanceDocument(document)).byteLength;

const colorToCss = (color: number, alpha: number): string => {
  const red = (color >> 16) & 0xff;
  const green = (color >> 8) & 0xff;
  const blue = color & 0xff;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const pointToCanvas = (point: AppearancePoint): readonly [number, number] => [
  point.u * APPEARANCE_TEXTURE_SIZE,
  (1 - point.v) * APPEARANCE_TEXTURE_SIZE,
];

export const drawAppearanceStamp = (
  context: CanvasRenderingContext2D,
  mode: AppearanceStrokeMode,
  color: number,
  sizePx: number,
  point: AppearancePoint,
): void => {
  const [x, y] = pointToCanvas(point);
  const radius = Math.max(1, sizePx * 0.5);
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  context.save();
  context.globalCompositeOperation = mode === 1 ? 'destination-out' : 'source-over';
  if (mode === 1) {
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.82)');
    gradient.addColorStop(0.58, 'rgba(0, 0, 0, 0.58)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  } else {
    gradient.addColorStop(0, colorToCss(color, 0.66));
    gradient.addColorStop(0.56, colorToCss(color, 0.44));
    gradient.addColorStop(1, colorToCss(color, 0));
  }
  context.fillStyle = gradient;
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  context.restore();
};

export const drawAppearanceSegment = (
  context: CanvasRenderingContext2D,
  mode: AppearanceStrokeMode,
  color: number,
  sizePx: number,
  from: AppearancePoint,
  to: AppearancePoint,
): void => {
  const [fromX, fromY] = pointToCanvas(from);
  const [toX, toY] = pointToCanvas(to);
  const distance = Math.hypot(toX - fromX, toY - fromY);
  const spacing = Math.max(1.5, sizePx * 0.16);
  const steps = Math.max(1, Math.ceil(distance / spacing));
  for (let index = 1; index <= steps; index += 1) {
    const t = index / steps;
    drawAppearanceStamp(context, mode, color, sizePx, {
      u: from.u + (to.u - from.u) * t,
      v: from.v + (to.v - from.v) * t,
    });
  }
};

const drawStar = (context: CanvasRenderingContext2D, radius: number): void => {
  context.beginPath();
  for (let index = 0; index < 10; index += 1) {
    const angle = -Math.PI / 2 + (index / 10) * Math.PI * 2;
    const r = index % 2 === 0 ? radius : radius * 0.44;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
};

const drawHeart = (context: CanvasRenderingContext2D, radius: number): void => {
  const r = radius;
  context.beginPath();
  context.moveTo(0, r * 0.82);
  context.bezierCurveTo(r * 1.08, r * 0.18, r * 0.92, -r * 0.76, 0, -r * 0.28);
  context.bezierCurveTo(-r * 0.92, -r * 0.76, -r * 1.08, r * 0.18, 0, r * 0.82);
  context.closePath();
};

const drawMixIn = (context: CanvasRenderingContext2D, placement: MixInPlacementV1): void => {
  const id = getMixInId(placement);
  const x = (placement.x / 255) * APPEARANCE_TEXTURE_SIZE;
  const y = (1 - placement.y / 255) * APPEARANCE_TEXTURE_SIZE;
  const radius = placement.s * 0.5;
  const rotation = (placement.r / 255) * Math.PI * 2;
  context.save();
  context.translate(x, y);
  context.rotate(rotation);

  if (id === 'glitter') {
    context.fillStyle = 'rgba(255, 247, 185, 0.92)';
    drawStar(context, radius * 0.72);
    context.fill();
  } else if (id === 'stars') {
    context.fillStyle = 'rgba(255, 217, 89, 0.94)';
    drawStar(context, radius);
    context.fill();
    context.strokeStyle = 'rgba(255,255,255,0.65)';
    context.lineWidth = Math.max(1, radius * 0.12);
    context.stroke();
  } else if (id === 'foam') {
    context.fillStyle = 'rgba(244, 249, 255, 0.92)';
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = 'rgba(167, 199, 226, 0.55)';
    context.lineWidth = Math.max(1, radius * 0.12);
    context.stroke();
  } else if (id === 'pearls') {
    const gradient = context.createRadialGradient(-radius * 0.28, -radius * 0.3, 0, 0, 0, radius);
    gradient.addColorStop(0, 'rgba(255,255,255,0.98)');
    gradient.addColorStop(0.46, 'rgba(236,229,255,0.94)');
    gradient.addColorStop(1, 'rgba(171,201,231,0.86)');
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.fill();
  } else if (id === 'hearts') {
    context.fillStyle = 'rgba(255, 116, 165, 0.92)';
    drawHeart(context, radius);
    context.fill();
  } else {
    context.fillStyle = placement.r % 2 === 0 ? 'rgba(99,230,226,0.9)' : 'rgba(213,140,255,0.9)';
    context.fillRect(-radius * 0.8, -radius * 0.28, radius * 1.6, radius * 0.56);
  }
  context.restore();
};

export const replayAppearanceDocument = (
  context: CanvasRenderingContext2D,
  document: AppearanceDocumentV1,
  options: { readonly excludeMixIns?: readonly MixInId[] } = {},
): void => {
  context.clearRect(0, 0, APPEARANCE_TEXTURE_SIZE, APPEARANCE_TEXTURE_SIZE);
  // Fill is stored as an ordinary V1 stroke for rollback compatibility, but it
  // behaves like a base paint layer. Replaying it first preserves hand-painted
  // details and eraser strokes while the array can still keep action order for Undo.
  const orderedStrokes = [
    ...document.strokes.filter(isBodyFillStroke),
    ...document.strokes.filter((stroke) => !isBodyFillStroke(stroke)),
  ];
  for (const stroke of orderedStrokes) {
    const points = decodeAppearancePoints(stroke.p);
    const first = points[0];
    if (!first) continue;
    drawAppearanceStamp(context, stroke.m, stroke.c, stroke.s, first);
    for (let index = 1; index < points.length; index += 1) {
      drawAppearanceSegment(context, stroke.m, stroke.c, stroke.s, points[index - 1]!, points[index]!);
    }
  }
  const excludedMixIns = new Set(options.excludeMixIns ?? []);
  for (const mixin of document.mixins) {
    if (!excludedMixIns.has(getMixInId(mixin))) drawMixIn(context, mixin);
  }
};
