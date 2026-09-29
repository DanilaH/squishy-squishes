import { getPalette } from '../../game/content';
import { getShape } from '../../game/shapes';
import { replayAppearanceDocument } from '../../sandbox/appearance';
import { renderSurfaceDecor } from '../../sandbox/decor';
import type { SavedSquishy } from '../../sandbox/types';

/** Unlit pigment texture for the Pages Hall and its isolated volume comparison.
 * The 3D mesh owns the visible silhouette. Extending plain body pigment outside
 * the authored 2D path prevents concave toe/heart UVs from sampling transparent
 * black and creating dark wedges; authored strokes and decor stay shape-clipped.
 * No baked lighting or changes to V3 saves. */
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
  const rgb = (color: readonly number[]): string =>
    `rgb(${color.map((channel) => Math.round(channel * 255)).join(',')})`;
  // Keep the texture as pigment only. Material response belongs to the mesh
  // shader, exactly as it does in the live Studio/Squeeze surface; pre-baking
  // Jelly/Holo/Pearl/Chrome here made the Hall lose the selected material once
  // the same texture was lit as generic Soft.
  const pigment = context.createLinearGradient(0, 0, 0, size);
  pigment.addColorStop(0, rgb(milk.high));
  pigment.addColorStop(1, rgb(milk.low));
  context.fillStyle = pigment;
  // Radial rings fold across the narrow valleys of concave silhouettes. The
  // visible geometry, not this texture, clips the body: retain an opaque base
  // wherever a triangle needs to sample just outside the 2D silhouette.
  context.fillRect(0, 0, size, size);
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
