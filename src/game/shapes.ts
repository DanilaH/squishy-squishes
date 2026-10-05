export type ShapeId = 'soft-square' | 'heart' | 'mochi' | 'peach' | 'mushroom' | 'paw' | 'dumpling' | 'strawberry' | 'donut' | 'bun' | 'ice-cream' | 'cupcake' | 'watermelon' | 'mochi-cat' | 'mochi-bunny';

export interface ShapePoint {
  readonly x: number;
  readonly y: number;
}

export interface ShapeDefinition {
  readonly id: ShapeId;
  readonly label: string;
  readonly boundary: readonly ShapePoint[];
  /** Inner contours use the opposite winding to the outer skin. */
  readonly holes?: readonly (readonly ShapePoint[])[];
}

const TAU = Math.PI * 2;
const SOFT_SQUARE_POINTS = 112;
const HEART_POINTS = 128;
const MOCHI_POINTS = 112;
const PEACH_POINTS = 128;
const MUSHROOM_SIDE_POINTS = 72;

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
  // Overlapping soft lobes form one continuous palm with four short, plump
  // toes. Radial union keeps the same generic mesh and canonical hit boundary.
  const lobes = [
    { x: 0, y: -0.23, rx: 0.70, ry: 0.64 },
    { x: -0.57, y: 0.24, rx: 0.245, ry: 0.275 },
    { x: -0.20, y: 0.43, rx: 0.235, ry: 0.32 },
    { x: 0.20, y: 0.43, rx: 0.235, ry: 0.32 },
    { x: 0.57, y: 0.24, rx: 0.245, ry: 0.275 },
  ] as const;
  const points = Array.from({ length: 192 }, (_, index) => {
    const angle = index / 192 * TAU;
    const x = Math.cos(angle), y = Math.sin(angle);
    let radius = 0;
    for (const lobe of lobes) {
      const a = (x / lobe.rx) ** 2 + (y / lobe.ry) ** 2;
      const b = -2 * (x * lobe.x / lobe.rx ** 2 + y * lobe.y / lobe.ry ** 2);
      const c = (lobe.x / lobe.rx) ** 2 + (lobe.y / lobe.ry) ** 2 - 1;
      const discriminant = b * b - 4 * a * c;
      if (discriminant >= 0) radius = Math.max(radius, (-b + Math.sqrt(discriminant)) / (2 * a));
    }
    return { x: x * radius, y: y * radius };
  });
  return normalizeBoundary(points);
};

type CubicSegment = readonly [ShapePoint, ShapePoint, ShapePoint, ShapePoint];
const sampleCubicBoundary = (segments: readonly CubicSegment[]): readonly ShapePoint[] =>
  normalizeBoundary(segments.flatMap(([a, b, c, d]) => Array.from({ length: 20 }, (_, index) => {
    const t = index / 20, s = 1 - t;
    return { x: s ** 3 * a.x + 3 * s * s * t * b.x + 3 * s * t * t * c.x + t ** 3 * d.x,
      y: s ** 3 * a.y + 3 * s * s * t * b.y + 3 * s * t * t * c.y + t ** 3 * d.y };
  })));

const createDumplingBoundary = (): readonly ShapePoint[] => sampleCubicBoundary([
  [{ x: -.12, y: .69 }, { x: -.26, y: .84 }, { x: -.15, y: .98 }, { x: 0, y: .98 }],
  [{ x: 0, y: .98 }, { x: .18, y: 1.01 }, { x: .27, y: .81 }, { x: .14, y: .67 }],
  [{ x: .14, y: .67 }, { x: .55, y: .65 }, { x: .91, y: .36 }, { x: .94, y: -.03 }],
  [{ x: .94, y: -.03 }, { x: .98, y: -.60 }, { x: .54, y: -.81 }, { x: 0, y: -.81 }],
  [{ x: 0, y: -.81 }, { x: -.54, y: -.81 }, { x: -.98, y: -.60 }, { x: -.94, y: -.03 }],
  [{ x: -.94, y: -.03 }, { x: -.91, y: .36 }, { x: -.55, y: .65 }, { x: -.12, y: .69 }],
]);

const createStrawberryBoundary = (): readonly ShapePoint[] => sampleCubicBoundary([
  [{ x: 0, y: .72 }, { x: .34, y: .77 }, { x: .80, y: .78 }, { x: .85, y: .36 }],
  [{ x: .85, y: .36 }, { x: .91, y: -.06 }, { x: .40, y: -.80 }, { x: .12, y: -.87 }],
  [{ x: .12, y: -.87 }, { x: .04, y: -.90 }, { x: -.04, y: -.90 }, { x: -.12, y: -.87 }],
  [{ x: -.12, y: -.87 }, { x: -.40, y: -.80 }, { x: -.91, y: -.06 }, { x: -.85, y: .36 }],
  [{ x: -.85, y: .36 }, { x: -.80, y: .78 }, { x: -.34, y: .77 }, { x: 0, y: .72 }],
]);

const ellipseBoundary = (rx: number, ry: number, clockwise = false): readonly ShapePoint[] =>
  Array.from({ length: 128 }, (_, i) => {
    const angle = i / 128 * TAU * (clockwise ? -1 : 1);
    return { x: Math.cos(angle) * rx, y: Math.sin(angle) * ry };
  });

/** All skin contours, shared by masks, field and deforming sidewalls. */
export const getShapeContours = (shape: ShapeDefinition): readonly (readonly ShapePoint[])[] =>
  [shape.boundary, ...(shape.holes ?? [])];


const createBunBoundary = (): readonly ShapePoint[] => normalizeBoundary(
  ellipseBoundary(1, .79).map(p => ({ x: p.x, y: p.y + (p.y > 0 ? .09 * Math.cos(p.x * Math.PI * 2) ** 2 : .04) })));

const createIceCreamBoundary = (): readonly ShapePoint[] => sampleCubicBoundary([
  [{x:0,y:.93},{x:.55,y:1.02},{x:.93,y:.72},{x:.87,y:.26}],
  [{x:.87,y:.26},{x:1,y:.06},{x:.72,y:-.03},{x:.58,y:.08}],
  [{x:.58,y:.08},{x:.44,y:-.24},{x:.23,y:-.74},{x:.08,y:-.89}],
  [{x:.08,y:-.89},{x:.04,y:-.95},{x:-.04,y:-.95},{x:-.08,y:-.89}],
  [{x:-.08,y:-.89},{x:-.23,y:-.74},{x:-.44,y:-.24},{x:-.58,y:.08}],
  [{x:-.58,y:.08},{x:-.72,y:-.03},{x:-1,y:.06},{x:-.87,y:.26}],
  [{x:-.87,y:.26},{x:-.93,y:.72},{x:-.55,y:1.02},{x:0,y:.93}],
]);
const createCupcakeBoundary = (): readonly ShapePoint[] => sampleCubicBoundary([
  [{x:0,y:.92},{x:.30,y:.99},{x:.58,y:.81},{x:.59,y:.61}],
  [{x:.59,y:.61},{x:.89,y:.65},{x:1,y:.22},{x:.83,y:.09}],
  [{x:.83,y:.09},{x:.79,y:-.14},{x:.66,y:-.64},{x:.55,y:-.75}],
  [{x:.55,y:-.75},{x:.39,y:-.84},{x:-.39,y:-.84},{x:-.55,y:-.75}],
  [{x:-.55,y:-.75},{x:-.66,y:-.64},{x:-.79,y:-.14},{x:-.83,y:.09}],
  [{x:-.83,y:.09},{x:-1,y:.22},{x:-.89,y:.65},{x:-.59,y:.61}],
  [{x:-.59,y:.61},{x:-.58,y:.81},{x:-.30,y:.99},{x:0,y:.92}],
]);
const createWatermelonBoundary = (): readonly ShapePoint[] => sampleCubicBoundary([
  [{x:-.88,y:.54},{x:-.99,y:.54},{x:-.99,y:.39},{x:-.90,y:.10}],
  [{x:-.90,y:.10},{x:-.65,y:-.80},{x:.65,y:-.80},{x:.90,y:.10}],
  [{x:.90,y:.10},{x:.99,y:.39},{x:.99,y:.54},{x:.88,y:.54}],
  [{x:.88,y:.54},{x:.45,y:.58},{x:-.45,y:.58},{x:-.88,y:.54}],
]);
const createMochiAnimalBoundary = (bunny: boolean): readonly ShapePoint[] => sampleCubicBoundary([
  [{x:-.77,y:.18},{x:-.83,y:.49},{x:-.69,y:bunny ? 1.18 : .79},{x:-.49,y:bunny ? 1.18 : .72}],
  [{x:-.49,y:bunny ? 1.18 : .72},{x:-.31,y:bunny ? 1.18 : .75},{x:-.25,y:.66},{x:-.23,y:.50}],
  [{x:-.23,y:.50},{x:-.12,y:.54},{x:.12,y:.54},{x:.23,y:.50}],
  [{x:.23,y:.50},{x:.25,y:.66},{x:.31,y:bunny ? 1.18 : .75},{x:.49,y:bunny ? 1.18 : .72}],
  [{x:.49,y:bunny ? 1.18 : .72},{x:.69,y:bunny ? 1.18 : .79},{x:.83,y:.49},{x:.77,y:.18}],
  [{x:.77,y:.18},{x:1,y:-.13},{x:.78,y:-.71},{x:0,y:-.72}],
  [{x:0,y:-.72},{x:-.78,y:-.71},{x:-1,y:-.13},{x:-.77,y:.18}],
]);

export const SHAPES: readonly ShapeDefinition[] = [
  { id: 'soft-square', label: 'Soft Cube', boundary: createSoftSquareBoundary() },
  { id: 'heart', label: 'Soft Heart', boundary: createHeartBoundary() },
  { id: 'mochi', label: 'Mochi', boundary: createMochiBoundary() },
  { id: 'peach', label: 'Peach Puff', boundary: createPeachBoundary() },
  { id: 'mushroom', label: 'Mushroom', boundary: createMushroomBoundary() },
  { id: 'paw', label: 'Paw', boundary: createPawBoundary() },
  { id: 'dumpling', label: 'Dumpling', boundary: createDumplingBoundary() },
  { id: 'strawberry', label: 'Strawberry', boundary: createStrawberryBoundary() },
  { id: 'bun', label: 'Puffy Bun', boundary: createBunBoundary() },
  { id: 'ice-cream', label: 'Ice Cream', boundary: createIceCreamBoundary() },
  { id: 'cupcake', label: 'Cupcake', boundary: createCupcakeBoundary() },
  { id: 'watermelon', label: 'Watermelon', boundary: createWatermelonBoundary() },
  { id: 'mochi-cat', label: 'Mochi Cat', boundary: createMochiAnimalBoundary(false) },
  { id: 'mochi-bunny', label: 'Mochi Bunny', boundary: createMochiAnimalBoundary(true) },
  { id: 'donut', label: 'Donut', boundary: ellipseBoundary(.94, .87), holes: [ellipseBoundary(.30, .28, true)] },
] as const;

const SELECTOR_SHAPE_IDS = new Set<ShapeId>(['soft-square', 'heart']);

export const SELECTOR_SHAPES: readonly ShapeDefinition[] = SHAPES.filter((shape) => SELECTOR_SHAPE_IDS.has(shape.id));
export const isSelectorShapeId = (id: ShapeId): boolean => SELECTOR_SHAPE_IDS.has(id);

const shapeById: Readonly<Record<ShapeId, ShapeDefinition>> = Object.fromEntries(
  SHAPES.map((shape) => [shape.id, shape]),
) as Readonly<Record<ShapeId, ShapeDefinition>>;

export const getShape = (id: ShapeId): ShapeDefinition => shapeById[id];

/** Upper skin at a horizontal body coordinate, shared by all decoration seats. */
export const getShapeTopAtX = (shape: ShapeDefinition, x: number): number => {
  let top = Number.NEGATIVE_INFINITY;
  for (let index = 0; index < shape.boundary.length; index++) {
    const a = shape.boundary[index]!, b = shape.boundary[(index + 1) % shape.boundary.length]!;
    if (x < Math.min(a.x, b.x) - 1e-6 || x > Math.max(a.x, b.x) + 1e-6) continue;
    if (Math.abs(b.x - a.x) < 1e-6) top = Math.max(top, a.y, b.y);
    else { const t = (x - a.x) / (b.x - a.x); top = Math.max(top, a.y + (b.y - a.y) * t); }
  }
  return top;
};

const isPointInsideContour = (points: readonly ShapePoint[], x: number, y: number): boolean => {
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

export const isPointInsideShape = (shape: ShapeDefinition, x: number, y: number): boolean =>
  isPointInsideContour(shape.boundary, x, y)
  && !(shape.holes ?? []).some(hole => isPointInsideContour(hole, x, y));

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
  const contours = getShapeContours(shape);

  for (let y = 0; y < size; y += 1) {
    const localY = ((y + 0.5) / size) * 2 - 1;
    for (let x = 0; x < size; x += 1) {
      const localX = ((x + 0.5) / size) * 2 - 1;
      let minDistance = Number.POSITIVE_INFINITY;

      for (const points of contours) for (let index = 0; index < points.length; index += 1) {
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

  for (const contour of getShapeContours(shape)) {
  for (let index = 0; index < contour.length; index += 1) {
    const point = contour[index]!;
    const x = center + point.x * radius;
    const y = center - point.y * radius;
    if (index === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  }

  path.closePath();
  }
  return path;
};

/** Same compound silhouette for catalog previews; holes remain transparent. */
export const shapeSvgPath = (shape: ShapeDefinition, radius = 42): string =>
  getShapeContours(shape).map(contour => contour.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${50 + p.x * radius},${50 - p.y * radius}`).join(' ') + ' Z').join(' ');
