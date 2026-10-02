import { createAppearanceStroke, type AppearancePoint, type AppearanceStrokeV1 } from './appearance';

export const CREATIVE_PALETTES = [
  { id: 'strawberry', en: 'Strawberry milk', ru: 'Клубничное молоко', colors: [0xffb6c8, 0xff79a8, 0xf8f1df, 0xd94f9d, 0x9a6b52, 0xb7f2cf] },
  { id: 'mermaid', en: 'Mermaid', ru: 'Русалочка', colors: [0x63e6e2, 0x8fd3ff, 0xb9a0ff, 0x2f8f83, 0xf8f1df, 0xffb6c8] },
  { id: 'blueberry', en: 'Blueberry yogurt', ru: 'Черничный йогурт', colors: [0xb9a0ff, 0xd58cff, 0xf8f1df, 0x6d3a8a, 0x8fd3ff, 0xffb6c8] },
  { id: 'sunset', en: 'Sunset', ru: 'Закат', colors: [0xffa46f, 0xffdc70, 0xff6f61, 0xff79a8, 0xd58cff, 0x6d3a8a] },
] as const;
export const PAINT_STAMPS = [
  { id: 'heart', en: 'Heart', ru: 'Сердечко', icon: '♡' },
  { id: 'flower', en: 'Flower', ru: 'Цветочек', icon: '✿' },
  { id: 'star', en: 'Star', ru: 'Звёздочка', icon: '☆' },
  { id: 'dot', en: 'Dots', ru: 'Горошек', icon: '●' },
] as const;
export type PaintStampId = (typeof PAINT_STAMPS)[number]['id'];

/** A stamp is one ordinary V1 pigment stroke, including after reload and Undo. */
export const createPaintStamp = (id: PaintStampId, color: number, size: number, center: AppearancePoint): AppearanceStrokeV1 => {
  if (id === 'dot') return createAppearanceStroke(0, color, size * .48, [center, center, center]);
  const points: AppearancePoint[] = [];
  // Filled spiral stays a single undoable stroke. Bounds are clipped by the mold.
  const turns = 6, samples = 216, radius = size / 2 / 256;
  for (let i = 0; i <= samples; i++) {
    const scale = i / samples, angle = scale * turns * Math.PI * 2;
    let x: number, y: number;
    if (id === 'heart') {
      x = Math.pow(Math.sin(angle), 3);
      y = (13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle)) / 17;
    } else {
      if (id === 'star') {
        const step = angle / (Math.PI * 2) * 10, vertex = Math.floor(step), fraction = step - vertex;
        const a = vertex * Math.PI / 5, b = (vertex + 1) * Math.PI / 5;
        const ra = vertex % 2 ? .45 : 1, rb = vertex % 2 ? 1 : .45;
        x = Math.sin(a) * ra * (1 - fraction) + Math.sin(b) * rb * fraction;
        y = Math.cos(a) * ra * (1 - fraction) + Math.cos(b) * rb * fraction;
      } else {
        const r = .73 + .27 * Math.cos(angle * 5);
        x = Math.sin(angle) * r; y = Math.cos(angle) * r;
      }
    }
    points.push({ u: center.u + x * scale * radius, v: center.v + y * scale * radius });
  }
  return createAppearanceStroke(0, color, Math.max(3, size * .12), points);
};
