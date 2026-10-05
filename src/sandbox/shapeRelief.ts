import type { ShapeId } from '../game/shapes';

interface ReliefPart { readonly path: string; readonly fill?: string; readonly stroke?: string; readonly width?: number }
const ellipse = (x: number, y: number, rx: number, ry: number, angle = 0): string => {
  const dx = rx * Math.cos(angle), dy = rx * Math.sin(angle), degrees = angle * 180 / Math.PI;
  return `M ${x - dx} ${y - dy} a ${rx} ${ry} ${degrees} 1 0 ${dx * 2} ${dy * 2} a ${rx} ${ry} ${degrees} 1 0 ${-dx * 2} ${-dy * 2}`;
};
const parts: Partial<Record<ShapeId, readonly ReliefPart[]>> = {
  bun: [-.32,0,.32].flatMap(x=>[
    {path:`M ${x-.09} .57 Q ${x-.04} .42 ${x+.04} .34`,stroke:'rgba(161,119,89,.26)',width:.024},
    {path:`M ${x-.065} .57 Q ${x-.015} .43 ${x+.065} .35`,stroke:'rgba(255,250,228,.7)',width:.012},
  ]),
  'ice-cream': [
    {path:'M -.49 .04 Q 0 -.06 .49 .04 L .07 -.88 Q 0 -.94 -.07 -.88 Z',fill:'rgba(236,193,137,.84)',stroke:'rgba(162,119,80,.24)',width:.018},
    ...[-.65,-.40,-.15,.10,.35].flatMap(y=>[
      {path:`M -.36 ${y+.35} L .25 ${y-.08} M .36 ${y+.35} L -.25 ${y-.08}`,stroke:'rgba(162,119,80,.28)',width:.013},
    ]),
    {path:'M -.76 .24 Q -.63 .13 -.44 .20 Q -.20 .05 0 .15 Q .23 .02 .43 .17 Q .62 .10 .76 .22',stroke:'rgba(197,153,174,.26)',width:.025},
  ],
  cupcake: [
    {path:'M -.75 .10 Q 0 -.03 .75 .10 L .52 -.76 Q 0 -.87 -.52 -.76 Z',fill:'rgba(232,191,220,.62)',stroke:'rgba(149,104,146,.23)',width:.018},
    ...[-.50,-.25,0,.25,.50].map(x=>({path:`M ${x} -.07 L ${x*.74} -.73`,stroke:'rgba(161,116,155,.29)',width:.022})),
    {path:'M -.46 .57 Q 0 .44 .46 .57',stroke:'rgba(192,159,171,.23)',width:.025},
  ],
  watermelon: [
    {path:'M -.88 .01 C -.65 -.95 .65 -.95 .88 .01 L .72 .04 C .46 -.66 -.46 -.66 -.72 .04 Z',fill:'rgba(134,186,131,.75)'},
    {path:'M -.76 .03 C -.51 -.75 .51 -.75 .76 .03',stroke:'rgba(237,246,182,.8)',width:.055},
    ...[[-.5,.08],[.5,.08],[-.29,-.25],[.29,-.25],[0,-.43]].map(([x,y])=>({path:ellipse(x!,y!,.022,.038,x!*.5),fill:'rgba(111,85,98,.68)'})),
  ],
  'mochi-cat': [
    {path:'M -.67 .41 Q -.63 .63 -.53 .70 Q -.41 .51 -.43 .39 Z',fill:'rgba(245,180,204,.72)'},
    {path:'M .67 .41 Q .63 .63 .53 .70 Q .41 .51 .43 .39 Z',fill:'rgba(245,180,204,.72)'},
    ...[-1,1].map(dir=>({path:`M ${dir*.32} -.12 L ${dir*.59} -.08 M ${dir*.33} -.19 L ${dir*.57} -.24`,stroke:'rgba(121,84,115,.32)',width:.014})),
  ],
  'mochi-bunny': [-1,1].map(dir=>({path:ellipse(dir*.47,.54,.07,.25,dir*.05),fill:'rgba(245,180,204,.65)',stroke:'rgba(204,135,170,.22)',width:.012})),
  donut: [
    {path:'M -.83 .12 C -.86 .55 -.54 .78 0 .79 C .51 .79 .85 .53 .83 .12 C .72 .27 .65 .15 .55 .27 C .40 .35 .35 .33 .30 .34 C .10 .53 -.14 .48 -.28 .35 C -.46 .21 -.50 .35 -.62 .20 C -.72 .31 -.76 .13 -.83 .12 Z',fill:'rgba(246,178,207,.66)',stroke:'rgba(195,117,161,.22)',width:.014},
    {path:'M -.65 .39 Q -.49 .63 -.21 .65',stroke:'rgba(255,247,244,.69)',width:.025},
  ],
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
