export type ShapeId = 'soft-square' | 'heart' | 'mochi' | 'peach' | 'mushroom' | 'paw';

export interface ShapePoint {
  readonly x: number;
  readonly y: number;
}

export interface ShapeDefinition {
  readonly id: ShapeId;
  readonly label: string;
  readonly boundary: readonly ShapePoint[];
}

const TAU = Math.PI * 2;
const SOFT_SQUARE_POINTS = 112;
const HEART_POINTS = 128;
const MOCHI_POINTS = 112;
const PEACH_POINTS = 128;
const MUSHROOM_SIDE_POINTS = 72;
const PAW_TOP_POINTS = 72;
const PAW_PALM_POINTS = 72;

const createSoftSquareBoundary = (): readonly ShapePoint[] =>
  Array.from({ length: SOFT_SQUARE_POINTS }, (_, index) => {
    const angle = (index / SOFT_SQUARE_POINTS) * TAU;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: Math.sign(cos) * Math.sqrt(Math.abs(cos)) * 0.98,
      y: Math.sign(sin) * Math.sqrt(Math.abs(sin)) * 0.98,
    };
  });

const normalizeBoundary = (points: readonly ShapePoint[], extent = 0.94): readonly ShapePoint[] => {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  const centerX = (minX + maxX) * 0.5;
  const centerY = (minY + maxY) * 0.5;
  const width = Math.max(0.0001, maxX - minX);
  const height = Math.max(0.0001, maxY - minY);
  const scale = (extent * 2) / Math.max(width, height);

  return points.map((point) => ({
    x: (point.x - centerX) * scale,
    y: (point.y - centerY) * scale,
  }));
};

const createHeartBoundary = (): readonly ShapePoint[] => {
  const raw = Array.from({ length: HEART_POINTS }, (_, index) => {
    const angle = (index / HEART_POINTS) * TAU;
    const sin = Math.sin(angle);
    return {
      x: 16 * sin * sin * sin,
      y:
        13 * Math.cos(angle)
        - 5 * Math.cos(angle * 2)
        - 2 * Math.cos(angle * 3)
        - Math.cos(angle * 4),
    };
  });

  return normalizeBoundary(raw, 0.94);
};

const createMochiBoundary = (): readonly ShapePoint[] => {
  const raw = Array.from({ length: MOCHI_POINTS }, (_, index) => {
    const angle = (index / MOCHI_POINTS) * TAU;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const horizontalRadius = 1 + Math.cos(angle * 2) * 0.055;
    const verticalRadius = 0.8 + Math.cos(angle * 2) * 0.03;
    const bottomFlatten = Math.max(0, -sin) ** 4 * 0.055;
    return {
      x: cos * horizontalRadius,
      y: sin * verticalRadius + bottomFlatten,
    };
  });

  return normalizeBoundary(raw, 0.94);
};

const createPeachBoundary = (): readonly ShapePoint[] => {
  const raw = Array.from({ length: PEACH_POINTS }, (_, index) => {
    const angle = (index / PEACH_POINTS) * TAU;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const radial = 0.88 + Math.cos(angle * 2) * 0.14 - Math.cos(angle * 4) * 0.025;
    const bottomPoint = Math.max(0, -sin) ** 6 * 0.1;
    return {
      x: cos * radial,
      y: sin * radial * 1.03 - bottomPoint,
    };
  });

  return normalizeBoundary(raw, 0.94);
};

const mushroomHalfWidth = (y: number): number => {
  if (y < -0.52) {
    const t = Math.min(1, Math.max(0, (y + 0.94) / 0.42));
    return 0.32 * Math.sqrt(Math.max(0, 1 - (1 - t) ** 2));
  }
  if (y < -0.18) return 0.32;
  if (y < 0.08) {
    const t = (y + 0.18) / 0.26;
    return 0.32 + 0.06 * t;
  }

  const t = Math.min(1, Math.max(0, (y - 0.08) / 0.86));
  const cap = 0.9 * Math.sin(t * Math.PI) ** 0.55;
  return Math.max(0.38 * (1 - t), cap);
};

const createMushroomBoundary = (): readonly ShapePoint[] => {
  const right = Array.from({ length: MUSHROOM_SIDE_POINTS }, (_, index) => {
    const y = -0.94 + (index / (MUSHROOM_SIDE_POINTS - 1)) * 1.88;
    return { x: mushroomHalfWidth(y), y };
  });
  const left = right.slice(1, -1).reverse().map((point) => ({ x: -point.x, y: point.y }));
  return normalizeBoundary([...right, ...left], 0.94);
};

const createPawBoundary = (): readonly ShapePoint[] => {
  const toeCenters = [-0.54, -0.18, 0.18, 0.54] as const;
  const top = Array.from({ length: PAW_TOP_POINTS }, (_, index) => {
    const x = -0.72 + (index / (PAW_TOP_POINTS - 1)) * 1.44;
    let y = 0.5;
    for (const center of toeCenters) y += 0.28 * Math.exp(-((x - center) / 0.105) ** 2);
    return { x, y };
  });

  const lowerPalm = Array.from({ length: PAW_PALM_POINTS }, (_, index) => {
    const angle = -((index + 1) / (PAW_PALM_POINTS + 1)) * Math.PI;
    return {
      x: 0.8 * Math.cos(angle),
      y: 0.18 + 0.78 * Math.sin(angle),
    };
  });

  const raw: readonly ShapePoint[] = [
    ...top,
    { x: 0.76, y: 0.42 },
    { x: 0.8, y: 0.18 },
    ...lowerPalm,
    { x: -0.8, y: 0.18 },
    { x: -0.76, y: 0.42 },
  ];

  return normalizeBoundary(raw, 0.94);
};

export const SHAPES: readonly ShapeDefinition[] = [
  { id: 'soft-square', label: 'Soft Cube', boundary: createSoftSquareBoundary() },
  { id: 'heart', label: 'Soft Heart', boundary: createHeartBoundary() },
  { id: 'mochi', label: 'Mochi', boundary: createMochiBoundary() },
  { id: 'peach', label: 'Peach Puff', boundary: createPeachBoundary() },
  { id: 'mushroom', label: 'Mushroom', boundary: createMushroomBoundary() },
  { id: 'paw', label: 'Paw', boundary: createPawBoundary() },
] as const;

const SELECTOR_SHAPE_IDS = new Set<ShapeId>(['soft-square', 'heart']);

export const SELECTOR_SHAPES: readonly ShapeDefinition[] = SHAPES.filter((shape) => SELECTOR_SHAPE_IDS.has(shape.id));
export const isSelectorShapeId = (id: ShapeId): boolean => SELECTOR_SHAPE_IDS.has(id);

const shapeById: Readonly<Record<ShapeId, ShapeDefinition>> = Object.fromEntries(
  SHAPES.map((shape) => [shape.id, shape]),
) as Readonly<Record<ShapeId, ShapeDefinition>>;

export const getShape = (id: ShapeId): ShapeDefinition => shapeById[id];

export const isPointInsideShape = (
  shape: ShapeDefinition,
  x: number,
  y: number,
): boolean => {
  const points = shape.boundary;
  let inside = false;

  for (let index = 0, previous = points.length - 1; index < points.length; previous = index, index += 1) {
    const a = points[index]!;
    const b = points[previous]!;
    const crosses = (a.y > y) !== (b.y > y)
      && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x;
    if (crosses) inside = !inside;
  }

  return inside;
};

const pointToSegmentDistance = (
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number => {
  const abX = bx - ax;
  const abY = by - ay;
  const lengthSquared = abX * abX + abY * abY;
  const t = lengthSquared <= 1e-9
    ? 0
    : Math.min(1, Math.max(0, ((px - ax) * abX + (py - ay) * abY) / lengthSquared));
  return Math.hypot(px - (ax + abX * t), py - (ay + abY * t));
};

export const createShapeField = (
  shape: ShapeDefinition,
  size = 128,
  distanceRange = 0.22,
): Uint8Array => {
  const data = new Uint8Array(size * size);
  const points = shape.boundary;

  for (let y = 0; y < size; y += 1) {
    const localY = ((y + 0.5) / size) * 2 - 1;
    for (let x = 0; x < size; x += 1) {
      const localX = ((x + 0.5) / size) * 2 - 1;
      let minDistance = Number.POSITIVE_INFINITY;

      for (let index = 0; index < points.length; index += 1) {
        const a = points[index]!;
        const b = points[(index + 1) % points.length]!;
        minDistance = Math.min(
          minDistance,
          pointToSegmentDistance(localX, localY, a.x, a.y, b.x, b.y),
        );
      }

      const inside = isPointInsideShape(shape, localX, localY);
      const signedDistance = (inside ? -1 : 1) * minDistance;
      const encoded = Math.min(1, Math.max(0, 0.5 + signedDistance / (distanceRange * 2)));
      data[y * size + x] = Math.round(encoded * 255);
    }
  }

  return data;
};

export const createShapePath = (shape: ShapeDefinition, size: number): Path2D => {
  const path = new Path2D();
  const center = size * 0.5;
  const radius = size * 0.5;

  for (let index = 0; index < shape.boundary.length; index += 1) {
    const point = shape.boundary[index]!;
    const x = center + point.x * radius;
    const y = center - point.y * radius;
    if (index === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  }

  path.closePath();
  return path;
};
