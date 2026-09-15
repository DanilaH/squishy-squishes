export const APPEARANCE_TEXTURE_SIZE = 256;
export const APPEARANCE_PROBE_STORAGE_KEY = 'squishy.appearance-probe.v1';

export type AppearanceStrokeMode = 0 | 1;

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

export interface AppearanceDocumentV1 {
  readonly v: 1;
  readonly strokes: readonly AppearanceStrokeV1[];
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const clamp01 = (value: number): number => clamp(value, 0, 1);

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

export const createEmptyAppearanceDocument = (): AppearanceDocumentV1 => ({ v: 1, strokes: [] });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

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

export const decodeAppearanceDocument = (value: unknown): AppearanceDocumentV1 => {
  if (!isRecord(value) || value.v !== 1 || !Array.isArray(value.strokes)) {
    throw new TypeError('Unsupported appearance document.');
  }
  return { v: 1, strokes: value.strokes.map(readStroke) };
};

export const stringifyAppearanceDocument = (document: AppearanceDocumentV1): string => JSON.stringify(document);

export const parseAppearanceDocument = (raw: string): AppearanceDocumentV1 =>
  decodeAppearanceDocument(JSON.parse(raw) as unknown);

export const estimateAppearanceBytes = (document: AppearanceDocumentV1): number =>
  new TextEncoder().encode(stringifyAppearanceDocument(document)).byteLength;
