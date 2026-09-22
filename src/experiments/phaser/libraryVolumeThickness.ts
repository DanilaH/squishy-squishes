import { getShape } from '../../game/shapes';
import type { SavedSquishy } from '../../sandbox/types';

/** An explicitly labeled 2D pseudo-extrusion experiment, NOT a real 3D mesh.
 * It keeps the already-rendered 512px face and its exact saved decor unchanged.
 * Depth appears only on the occluded side, and a single static Canvas2D is used. */
export const renderVolumeThickness = (toy: SavedSquishy, front: HTMLCanvasElement): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = front.width;
  canvas.height = front.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2.5D thickness canvas unavailable');
  const halfX = canvas.width * 0.5 * 0.80 * 1.075;
  const halfY = canvas.height * 0.5 * 0.80 * 0.905;
  const cy = canvas.height * 0.5 + canvas.height * 0.5 * 0.80 * 0.018;
  const contour = new Path2D();
  for (const [index, point] of getShape(toy.shapeId).boundary.entries()) {
    const x = canvas.width * 0.5 + point.x * halfX;
    const y = cy - point.y * halfY;
    if (index === 0) contour.moveTo(x, y);
    else contour.lineTo(x, y);
  }
  contour.closePath();

  // Back body and a narrow extruded silhouette. The last side layers sit
  // behind the painted, inflated face; no stickers or eyes get offset.
  const steps = 22;
  for (let depth = steps; depth >= 1; depth -= 1) {
    const t = depth / steps;
    context.save();
    context.translate(t * 20, t * 13);
    const side = context.createLinearGradient(50, 100, 420, 425);
    side.addColorStop(0, '#ead2b0');
    side.addColorStop(0.55, '#cab092');
    side.addColorStop(1, '#9e816c');
    context.fillStyle = side;
    if (depth === steps) {
      context.shadowColor = 'rgba(83, 48, 35, 0.23)';
      context.shadowBlur = 15;
      context.shadowOffsetX = 5;
      context.shadowOffsetY = 8;
    }
    context.fill(contour);
    context.restore();
  }
  context.drawImage(front, 0, 0);
  canvas.dataset.volumeRenderer = 'pseudo-extruded-512';
  return canvas;
};
