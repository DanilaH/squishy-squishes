import type { ShapeId } from '../game/shapes';

interface ReliefPart { readonly path: string; readonly fill?: string; readonly stroke?: string; readonly width?: number }
const ellipse = (x: number, y: number, rx: number, ry: number, angle = 0): string => {
  const dx = rx * Math.cos(angle), dy = rx * Math.sin(angle), degrees = angle * 180 / Math.PI;
  return `M ${x - dx} ${y - dy} a ${rx} ${ry} ${degrees} 1 0 ${dx * 2} ${dy * 2} a ${rx} ${ry} ${degrees} 1 0 ${-dx * 2} ${-dy * 2}`;
};
const parts: Partial<Record<ShapeId, readonly ReliefPart[]>> = {
  dumpling: [-.48, -.25, .26, .49].flatMap((x) => [
    { path: `M .02 .70 Q ${x * .45} .59 ${x} .35`, stroke: 'rgba(139,92,92,.26)', width: .025 },
    { path: `M .04 .71 Q ${x * .45 + .025} .61 ${x + .02} .37`, stroke: 'rgba(255,250,230,.65)', width: .012 },
  ]),
  paw: [
    ...[[-.64, .32, .125, .16], [-.23, .54, .13, .18], [.23, .54, .13, .18], [.64, .32, .125, .16]].map(([x, y, rx, ry]) => ({
      path: ellipse(x!, y!, rx!, ry!), fill: 'rgba(245,151,184,.78)', stroke: 'rgba(189,94,136,.25)', width: .015,
    })),
    { path: 'M 0 -.39 C -.13 -.21 -.34 -.32 -.34 -.49 C -.34 -.70 -.13 -.76 0 -.70 C .13 -.76 .34 -.70 .34 -.49 C .34 -.32 .13 -.21 0 -.39 Z', fill: 'rgba(245,151,184,.78)', stroke: 'rgba(189,94,136,.25)', width: .017 },
    ...[[-.66, .38], [-.25, .62], [.21, .62], [.62, .38], [-.13, -.38]].map(([x, y]) => ({ path: ellipse(x!, y!, .045, .025), fill: 'rgba(255,243,247,.68)' })),
  ],
  strawberry: [
    // Individual padded leaves: darker underside, light fold and shared veins.
    ...[
      'M 0 .72 C -.13 .88 -.28 .84 -.34 .73 C -.28 .64 -.12 .62 0 .68 Z',
      'M 0 .72 C .13 .88 .28 .84 .34 .73 C .28 .64 .12 .62 0 .68 Z',
      'M 0 .74 C -.19 .73 -.32 .64 -.35 .52 C -.17 .52 -.05 .60 0 .70 Z',
      'M 0 .74 C .19 .73 .32 .64 .35 .52 C .17 .52 .05 .60 0 .70 Z',
      'M 0 .75 C -.11 .65 -.11 .48 0 .41 C .11 .48 .11 .65 0 .75 Z',
    ].map(path => ({ path, fill: '#78ad78', stroke: 'rgba(50,103,64,.40)', width: .014 })),
    { path: 'M -.28 .73 Q -.13 .80 -.03 .72 M .28 .73 Q .13 .80 .03 .72 M -.28 .57 Q -.15 .64 -.03 .70 M .28 .57 Q .15 .64 .03 .70 M 0 .48 Q -.025 .59 0 .70', stroke: 'rgba(207,237,153,.78)', width: .016 },
    { path: 'M -.04 .72 Q -.02 .77 .03 .74', stroke: '#afd68d', width: .038 },
    // Leave the centre open for the chosen face; seeds follow the curved flanks.
    ...[[-.43, .39], [.43, .39], [-.61, .10], [.61, .10], [-.54, -.17], [.54, -.17], [-.38, -.43], [.38, -.43], [-.17, -.64], [.17, -.64], [0, -.78]].flatMap(([x, y]) => {
      const angle = -x! * .65;
      const path = ellipse(x!, y!, .020, .036, angle);
      return [
        { path: ellipse(x!, y! - .007, .031, .046, angle), fill: 'rgba(131,49,67,.16)' },
        { path, fill: '#f6dca3', stroke: 'rgba(144,76,62,.32)', width: .008 },
        { path: ellipse(x! - .006, y! + .013, .007, .013, angle), fill: 'rgba(255,252,220,.86)' },
      ];
    }),
  ],
};

/** Mold details share canonical body UVs and deform with the existing surface.
 * They are presentation, never extra strokes or fields in the player's save. */
export const hasShapeRelief = (id: ShapeId): boolean => Boolean(parts[id]);
export const drawShapeRelief = (context: CanvasRenderingContext2D, id: ShapeId, size = 256): void => {
  context.save();
  context.translate(size / 2, size / 2);
  context.scale(size / 2, -size / 2);
  context.lineCap = 'round'; context.lineJoin = 'round';
  for (const part of parts[id] ?? []) {
    const path = new Path2D(part.path);
    if (part.fill) { context.fillStyle = part.fill; context.fill(path); }
    if (part.stroke) { context.strokeStyle = part.stroke; context.lineWidth = part.width ?? .015; context.stroke(path); }
  }
  context.restore();
};
export const shapeReliefSvg = (id: ShapeId): string => `<g transform="translate(50 50) scale(42 -42)">${(parts[id] ?? []).map((part) =>
  `<path d="${part.path}" fill="${part.fill ?? 'none'}" stroke="${part.stroke ?? 'none'}" stroke-width="${part.width ?? .015}" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</g>`;
