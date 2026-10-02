import type { ShapeId } from '../game/shapes';

interface ReliefPart { readonly path: string; readonly fill?: string; readonly stroke?: string; readonly width?: number }
const ellipse = (x: number, y: number, rx: number, ry: number): string =>
  `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${rx * 2} 0 a ${rx} ${ry} 0 1 0 ${-rx * 2} 0`;
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
    { path: 'M 0 .62 Q -.14 .69 -.29 .55 Q -.24 .40 -.04 .44 Q -.15 .24 0 .23 Q .18 .34 .06 .47 Q .25 .39 .31 .55 Q .15 .67 0 .62 Z', fill: 'rgba(113,175,124,.83)', stroke: 'rgba(58,128,97,.35)', width: .018 },
    ...[[-.45, .32], [.45, .32], [-.62, .02], [.62, .02], [-.39, -.30], [.39, -.30], [-.19, -.55], [.19, -.55], [0, -.76]].map(([x, y]) => ({ path: ellipse(x!, y!, .029, .052), fill: 'rgba(255,238,188,.85)', stroke: 'rgba(174,109,104,.25)', width: .009 })),
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
