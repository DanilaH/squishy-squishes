import { readFileSync, writeFileSync } from 'node:fs';

const replaceOnce = (path, from, to) => {
  const source = readFileSync(path, 'utf8');
  if (!source.includes(from)) throw new Error(`${path}: missing anchor: ${from.slice(0, 80)}`);
  writeFileSync(path, source.replace(from, to));
};

// Decor helpers used by renderer composition.
replaceOnce(
  'src/sandbox/decor.ts',
  "export const estimateDecorBytes = (decor: DecorDocumentV1): number =>\n  new TextEncoder().encode(JSON.stringify(decor)).byteLength;",
  "export const estimateDecorBytes = (decor: DecorDocumentV1): number =>\n  new TextEncoder().encode(JSON.stringify(decor)).byteLength;\n\nexport const hasSurfaceDecor = (decor: DecorDocumentV1): boolean =>\n  decor.eyes !== null || decor.mouth !== null || decor.blush || decor.stickers.length > 0;",
);

// Backwards-compatible SaveState V3 decor normalization.
let save = readFileSync('src/platform/saveV3.ts', 'utf8');
save = save.replace(
  "import { decodeAppearanceDocument } from '../sandbox/appearance';",
  "import { decodeAppearanceDocument } from '../sandbox/appearance';\nimport { createEmptyDecorDocument, decodeDecorDocument } from '../sandbox/decor';",
);
save = save.replace(
  "    appearance: decodeAppearanceDocument(value.appearance),\n  };",
  "    appearance: decodeAppearanceDocument(value.appearance),\n    decor: value.decor === undefined ? createEmptyDecorDocument() : decodeDecorDocument(value.decor),\n  };",
);
save = save.replace(
  "  appearance: input.appearance,\n});",
  "  appearance: input.appearance,\n  decor: input.decor,\n});",
);
writeFileSync('src/platform/saveV3.ts', save);

// Shared surface decor and static accessory thumbnail composition.
let thumb = readFileSync('src/sandbox/libraryThumbnail.ts', 'utf8');
thumb = thumb.replace(
  "import type { SavedSquishy } from './types';",
  "import { drawAccessoryGraphic, getDecorFrame, renderSurfaceDecor } from './decor';\nimport type { SavedSquishy } from './types';",
);
thumb = thumb.replace(
  "  context.clearRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);\n  context.save();",
  `  context.clearRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);\n\n  const shape = getShape(toy.shapeId);\n  if (toy.decor.accessory) {\n    const frame = getDecorFrame(shape);\n    const localX = frame.headAnchor.u * 2 - 1;\n    const localY = frame.headAnchor.v * 2 - 1;\n    const scale = Math.min(THUMBNAIL_SIZE, THUMBNAIL_SIZE) * 0.5 - SHAPE_PADDING;\n    const anchorX = THUMBNAIL_SIZE * 0.5 + localX * scale;\n    const anchorY = THUMBNAIL_SIZE * 0.5 - localY * scale;\n    const accessoryCanvas = document.createElement('canvas');\n    accessoryCanvas.width = 180;\n    accessoryCanvas.height = 120;\n    const accessoryContext = accessoryCanvas.getContext('2d');\n    if (accessoryContext) {\n      drawAccessoryGraphic(accessoryContext, toy.decor.accessory, 180, 120);\n      const drawWidth = 112;\n      const drawHeight = 75;\n      context.drawImage(accessoryCanvas, anchorX - drawWidth * 0.5, anchorY - drawHeight * 0.9, drawWidth, drawHeight);\n    }\n  }\n\n  context.save();`,
);
thumb = thumb.replace(
  "    replayAppearanceDocument(appearanceContext, toy.appearance);\n    context.drawImage(appearanceCanvas, 0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);",
  "    replayAppearanceDocument(appearanceContext, toy.appearance);\n    renderSurfaceDecor(appearanceContext, toy.decor, shape);\n    context.drawImage(appearanceCanvas, 0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);",
);
writeFileSync('src/sandbox/libraryThumbnail.ts', thumb);

// Read-only UV -> deformed canvas projection; no physics/shader changes.
let surface = readFileSync('src/squish/SquishSurface.ts', 'utf8');
const projectionAnchor = `  public clientPointToUv(clientX: number, clientY: number): { u: number; v: number } | null {\n    const local = this.clientPointToLocal(clientX, clientY);\n    if (!this.isInsideObject(local.x, local.y)) return null;\n    return {\n      u: clamp01(local.x * 0.5 + 0.5),\n      v: clamp01(local.y * 0.5 + 0.5),\n    };\n  }\n`;
const projectionMethod = `${projectionAnchor}\n  public projectUvToCanvas(u: number, v: number): { x: number; y: number } {\n    const gridU = clamp01(u) * GRID_CELLS;\n    const gridV = clamp01(v) * GRID_CELLS;\n    const x0 = Math.min(GRID_CELLS - 1, Math.floor(gridU));\n    const y0 = Math.min(GRID_CELLS - 1, Math.floor(gridV));\n    const x1 = Math.min(GRID_CELLS, x0 + 1);\n    const y1 = Math.min(GRID_CELLS, y0 + 1);\n    const tx = gridU - x0;\n    const ty = gridV - y0;\n    const row = GRID_CELLS + 1;\n    const a = this.vertices[y0 * row + x0]!;\n    const b = this.vertices[y0 * row + x1]!;\n    const c = this.vertices[y1 * row + x0]!;\n    const d = this.vertices[y1 * row + x1]!;\n    const topX = a.x + (b.x - a.x) * tx;\n    const topY = a.y + (b.y - a.y) * tx;\n    const bottomX = c.x + (d.x - c.x) * tx;\n    const bottomY = c.y + (d.y - c.y) * tx;\n    const localX = topX + (bottomX - topX) * ty;\n    const localY = topY + (bottomY - topY) * ty;\n    const rect = this.canvas.getBoundingClientRect();\n    const ndcX = localX * this.scaleX;\n    const ndcY = localY * this.scaleY;\n    return {\n      x: (ndcX * 0.5 + 0.5) * rect.width,\n      y: (0.5 - ndcY * 0.5) * rect.height,\n    };\n  }\n`;
if (!surface.includes(projectionAnchor)) throw new Error('SquishSurface projection anchor missing');
surface = surface.replace(projectionAnchor, projectionMethod);
writeFileSync('src/squish/SquishSurface.ts', surface);

// Composite decor into the real appearance texture even before the Decor UI exists.
let app = readFileSync('src/sandbox/SandboxApp.ts', 'utf8');
app = app.replace(
  "} from './appearance';\nimport { createSandboxDraft, type SandboxDraft, type SavedSquishy } from './types';",
  "} from './appearance';\nimport { hasSurfaceDecor, renderSurfaceDecor } from './decor';\nimport { createSandboxDraft, type SandboxDraft, type SavedSquishy } from './types';",
);
app = app.replace(
  "      appearance: saved.appearance,\n    };\n    replayAppearanceDocument(this.appearanceContext, saved.appearance);\n    this.applyDraftToRenderer();\n    this.uploadAppearanceNow();",
  "      appearance: saved.appearance,\n      decor: saved.decor,\n    };\n    this.applyDraftToRenderer();\n    this.replayAndUpload();",
);
app = app.replace(
  "    const appearance = this.draft.appearance;\n    if (appearance.strokes.length === 0 && appearance.mixins.length === 0) this.renderer.setAppearanceTexture(null);",
  "    const appearance = this.draft.appearance;\n    if (appearance.strokes.length === 0 && appearance.mixins.length === 0 && !hasSurfaceDecor(this.draft.decor)) this.renderer.setAppearanceTexture(null);",
);
app = app.replace(
  "    replayAppearanceDocument(this.appearanceContext, this.draft.appearance);\n    this.uploadAppearanceNow();",
  "    replayAppearanceDocument(this.appearanceContext, this.draft.appearance);\n    renderSurfaceDecor(this.appearanceContext, this.draft.decor, getShape(this.draft.shapeId));\n    this.uploadAppearanceNow();",
);
writeFileSync('src/sandbox/SandboxApp.ts', app);

// Existing S2 fixtures become explicit empty-decor fixtures.
let tests = readFileSync('tests/release/release.spec.ts', 'utf8');
if (!tests.includes("createEmptyDecorDocument")) {
  tests = tests.replace(
    "import { createAppearanceStroke, createMixInPlacement, type AppearanceDocumentV1 } from '../../src/sandbox/appearance';",
    "import { createAppearanceStroke, createMixInPlacement, type AppearanceDocumentV1 } from '../../src/sandbox/appearance';\nimport { createEmptyDecorDocument } from '../../src/sandbox/decor';",
  );
}
tests = tests.replace(
  "  appearance: createFixtureAppearance(index, rich),\n});",
  "  appearance: createFixtureAppearance(index, rich),\n  decor: createEmptyDecorDocument(),\n});",
);
writeFileSync('tests/release/release.spec.ts', tests);
