import { getPalette } from '../../game/content';
import { getShape } from '../../game/shapes';
import { replayAppearanceDocument } from '../../sandbox/appearance';
import { renderSurfaceDecor } from '../../sandbox/decor';
import type { SavedSquishy } from '../../sandbox/types';

/** A genuinely unlit colour source for the isolated volume lab. It preserves
 * authored strokes and decor but bakes in no gradient, rim or Studio light.
 * The Pages Hall now accepts all six saved materials; the mesh provides light
 * exactly once. This does not change the V3 save format. */
export const renderNeutralVolumeAlbedo = (toy: SavedSquishy): HTMLCanvasElement => {
  const size = 512;
  const output = document.createElement('canvas');
  output.width = size;
  output.height = size;
  const context = output.getContext('2d');
  if (!context) throw new Error('Unlit volume albedo context unavailable');
  const shape = getShape(toy.shapeId);
  // Match the existing flat control and 3D mesh UVs precisely; different
  // geometry/UVs would make a baked-vs-unlit lighting comparison meaningless.
  const halfX = size * 0.5 * 0.80 * 1.075;
  const halfY = size * 0.5 * 0.80 * 0.905;
  const cy = size * 0.5 + size * 0.5 * 0.80 * 0.018;
  const path = new Path2D();
  shape.boundary.forEach((point, index) => {
    const x = size * 0.5 + point.x * halfX;
    const y = cy - point.y * halfY;
    if (index === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  });
  path.closePath();
  const milk = getPalette('milk');
  const base = milk.high.map((high, index) =>
    Math.round(255 * (high * 0.82 + milk.low[index]! * 0.18)),
  );
  const material = toy.materialId;
  const gradients = {
    jelly: ['#f6f3d7', '#dcefcf', '#a9d3c9'],
    holo: ['#f8dce8', '#f1eab9', '#d3eddf', '#ead4f2'],
    pearl: ['#f9efdf', '#e9e1e1', '#d7eae0', '#f6e3e2'],
    chrome: ['#eee8dc', '#8d908e', '#f2efdf', '#767b78', '#dbdad3'],
    marshmallow: ['#fff8eb', '#f5e8d9', '#e6d4c6'],
  } as const;
  if (material === 'soft') {
    context.fillStyle = `rgb(${base.join(',')})`;
  } else {
    const stops = gradients[material];
    const gradient = context.createLinearGradient(0, 12, size, size - 12);
    stops.forEach((color, index) => gradient.addColorStop(index / (stops.length - 1), color));
    context.fillStyle = gradient;
  }
  context.fill(path);
  const authored = document.createElement('canvas');
  authored.width = size;
  authored.height = size;
  const authoredContext = authored.getContext('2d');
  if (!authoredContext) throw new Error('Unlit volume authored-art context unavailable');
  authoredContext.setTransform(2, 0, 0, 2, 0, 0);
  replayAppearanceDocument(authoredContext, toy.appearance);
  renderSurfaceDecor(authoredContext, toy.decor, shape);
  context.save();
  context.clip(path);
  context.drawImage(authored, 0, 0);
  context.restore();
  output.dataset.volumeRenderer = 'neutral-albedo-source-512';
  return output;
};
