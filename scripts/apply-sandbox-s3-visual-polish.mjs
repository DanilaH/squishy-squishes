import { readFileSync, writeFileSync } from 'node:fs';

const replaceOnce = (source, before, after, label) => {
  if (!source.includes(before)) throw new Error(`Missing patch anchor: ${label}`);
  if (source.indexOf(before) !== source.lastIndexOf(before)) throw new Error(`Ambiguous patch anchor: ${label}`);
  return source.replace(before, after);
};

const appPath = 'src/sandbox/SandboxApp.ts';
let app = readFileSync(appPath, 'utf8');

const decorLabels = `
interface DecorLabels {
  readonly eyes: Readonly<Record<EyeStyleId, string>>;
  readonly mouths: Readonly<Record<MouthStyleId, string>>;
  readonly stickers: Readonly<Record<StickerId, string>>;
  readonly accessories: Readonly<Record<AccessoryId, string>>;
  readonly stickerTip: string;
}

const DECOR_LABELS: Readonly<Record<SandboxLanguage, DecorLabels>> = {
  en: {
    eyes: { dot: 'Dot', happy: 'Happy', sleepy: 'Sleepy' },
    mouths: { smile: 'Smile', o: 'O', cat: 'Cat' },
    stickers: { heart: 'Heart', star: 'Star', flower: 'Flower', sparkle: 'Sparkle' },
    accessories: { 'cat-ears': 'Cat ears', 'bunny-ears': 'Bunny ears', horns: 'Horns', bow: 'Bow', crown: 'Crown' },
    stickerTip: 'Tap the squishy to place it.',
  },
  ru: {
    eyes: { dot: 'Точки', happy: 'Весёлые', sleepy: 'Сонные' },
    mouths: { smile: 'Улыбка', o: 'О', cat: 'Котик' },
    stickers: { heart: 'Сердце', star: 'Звезда', flower: 'Цветок', sparkle: 'Искра' },
    accessories: { 'cat-ears': 'Кошачьи', 'bunny-ears': 'Заячьи', horns: 'Рожки', bow: 'Бант', crown: 'Корона' },
    stickerTip: 'Тапни по сквишу, чтобы наклеить.',
  },
};
`;

app = replaceOnce(
  app,
  "\nconst PAINT_COLORS = [0xd58cff, 0x63e6e2, 0xff79a8, 0x92df83, 0xffa46f, 0xffdc70] as const;",
  `${decorLabels}\nconst PAINT_COLORS = [0xd58cff, 0x63e6e2, 0xff79a8, 0x92df83, 0xffa46f, 0xffdc70] as const;`,
  'decor label catalog',
);

app = replaceOnce(
  app,
  '  private renderShell(): string {\n    const shapes = SHAPES.map((shape) => `',
  '  private renderShell(): string {\n    const decorLabels = DECOR_LABELS[this.options.language];\n    const shapes = SHAPES.map((shape) => `',
  'renderShell decor labels',
);

app = replaceOnce(
  app,
  '<span>${id ? eyeGlyph(id) : \'—\'}</span><small>${id ?? this.copy.none}</small>',
  '<span>${id ? eyeGlyph(id) : \'—\'}</span><small>${id ? decorLabels.eyes[id] : this.copy.none}</small>',
  'eye labels',
);
app = replaceOnce(
  app,
  '<span>${id ? mouthGlyph(id) : \'—\'}</span><small>${id ?? this.copy.none}</small>',
  '<span>${id ? mouthGlyph(id) : \'—\'}</span><small>${id ? decorLabels.mouths[id] : this.copy.none}</small>',
  'mouth labels',
);
app = replaceOnce(
  app,
  '<span>${stickerGlyph(id)}</span><small>${id}</small>',
  '<span>${stickerGlyph(id)}</span><small>${decorLabels.stickers[id]}</small>',
  'sticker labels',
);
app = replaceOnce(
  app,
  '<span>${id ? accessoryGlyph(id) : \'—\'}</span><small>${id ?? this.copy.none}</small>',
  '<span>${id ? accessoryGlyph(id) : \'—\'}</span><small>${id ? decorLabels.accessories[id] : this.copy.none}</small>',
  'accessory labels',
);
app = replaceOnce(
  app,
  '<p class="sandbox-decor-tip">${this.copy.stickers}: tap the squishy</p>',
  '<p class="sandbox-decor-tip">${decorLabels.stickerTip}</p>',
  'sticker instruction',
);

writeFileSync(appPath, app);

const decorPath = 'src/sandbox/decor.ts';
let decor = readFileSync(decorPath, 'utf8');
const oldAnchor = `  const blushDx = width * 0.225;\n  const headY = maxY - height * 0.055;\n  return {`;
const newAnchor = `  const blushDx = width * 0.225;\n\n  // Attach head accessories to the actual upper contour at the horizontal center.\n  // Using only maxY makes concave shapes (notably the heart) place the anchor in empty space.\n  let topBoundaryY = Number.NEGATIVE_INFINITY;\n  for (let index = 0; index < shape.boundary.length; index += 1) {\n    const a = shape.boundary[index]!;\n    const b = shape.boundary[(index + 1) % shape.boundary.length]!;\n    const minSegmentX = Math.min(a.x, b.x);\n    const maxSegmentX = Math.max(a.x, b.x);\n    if (centerX < minSegmentX - 1e-6 || centerX > maxSegmentX + 1e-6) continue;\n    const dx = b.x - a.x;\n    if (Math.abs(dx) <= 1e-6) {\n      if (Math.abs(centerX - a.x) <= 1e-6) topBoundaryY = Math.max(topBoundaryY, a.y, b.y);\n      continue;\n    }\n    const t = (centerX - a.x) / dx;\n    if (t >= 0 && t <= 1) topBoundaryY = Math.max(topBoundaryY, a.y + (b.y - a.y) * t);\n  }\n  const headSurfaceY = Number.isFinite(topBoundaryY) ? topBoundaryY : maxY;\n  const headY = headSurfaceY - height * 0.025;\n  return {`;
decor = replaceOnce(decor, oldAnchor, newAnchor, 'generic contour accessory anchor');
writeFileSync(decorPath, decor);

console.log('Applied Sandbox S3 visual polish.');
