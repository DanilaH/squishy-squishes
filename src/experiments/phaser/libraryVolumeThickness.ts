import { getPalette } from '../../game/content';
import { getShape } from '../../game/shapes';
import type { SavedSquishy } from '../../sandbox/types';

/** Review-only static 2.5D sidewall, NOT a real 3D mesh.
 * Draw only contour edges facing the projected thickness direction. The actual
 * saved, decorated front stays in its original position and is composited last.
 * No frame loop, WebGL context, new saved state, or game renderer changes. */
export const renderVolumeThickness = (toy: SavedSquishy, front: HTMLCanvasElement): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = front.width;
  canvas.height = front.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2.5D thickness canvas unavailable');

  const width = canvas.width;
  const height = canvas.height;
  const centerX = width * 0.5;
  const centerY = height * 0.5 + height * 0.5 * 0.80 * 0.018;
  const halfX = width * 0.5 * 0.80 * 1.075;
  const halfY = height * 0.5 * 0.80 * 0.905;
  const depthX = 21;
  const depthY = 17;
  const backScale = 0.955;
  const contour = getShape(toy.shapeId).boundary.map(point => ({
    x: centerX + point.x * halfX,
    y: centerY - point.y * halfY,
    bx: centerX + point.x * halfX * backScale + depthX,
    by: centerY - point.y * halfY * backScale + depthY,
  }));
  const frontPath = new Path2D();
  const backPath = new Path2D();
  contour.forEach((point, index) => {
    if (index === 0) {
      frontPath.moveTo(point.x, point.y);
      backPath.moveTo(point.bx, point.by);
    } else {
      frontPath.lineTo(point.x, point.y);
      backPath.lineTo(point.bx, point.by);
    }
  });
  frontPath.closePath();
  backPath.closePath();

  // One grounded back silhouette, not 22 repeatedly overdrawn translucent rings.
  context.save();
  context.shadowColor = 'rgba(76, 49, 34, 0.23)';
  context.shadowBlur = 15;
  context.shadowOffsetX = 3;
  context.shadowOffsetY = 8;
  context.fillStyle = '#ad9279';
  context.fill(backPath);
  context.restore();

  // The shape boundary is counter-clockwise in mathematical (y-up) coordinates;
  // its screen-space outward normal is (-dy, dx). Only right/down-facing edges
  // are visible from this fixed view. Segment-specific lighting means that the
  // heart tip and the paw valleys no longer share a single cardboard-colored rim.
  const base = getPalette('milk').low;
  const clamp = (value: number): number => Math.max(0, Math.min(255, Math.round(value)));
  for (let index = 0; index < contour.length; index += 1) {
    const next = contour[(index + 1) % contour.length]!;
    const point = contour[index]!;
    const tangentX = next.x - point.x;
    const tangentY = next.y - point.y;
    const tangentLength = Math.hypot(tangentX, tangentY);
    if (tangentLength < 0.001) continue;
    const normalX = -tangentY / tangentLength;
    const normalY = tangentX / tangentLength;
    const facing = (normalX * depthX + normalY * depthY) / Math.hypot(depthX, depthY);
    if (facing <= 0.025) continue;
    const light = Math.max(0, normalX * -0.36 + normalY * -0.38 + 0.55);
    const intensity = 0.65 + 0.22 * light + 0.07 * (1 - (point.y + next.y) / (2 * height));
    const rgb = base.map(channel => clamp(channel * 255 * intensity)) as number[];
    const quad = new Path2D();
    quad.moveTo(point.x, point.y);
    quad.lineTo(next.x, next.y);
    quad.lineTo(next.bx, next.by);
    quad.lineTo(point.bx, point.by);
    quad.closePath();
    context.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
    context.fill(quad);
    // Tiny overdraw avoids subpixel seams between adjacent contours in Canvas2D.
    context.lineWidth = 0.7;
    context.strokeStyle = context.fillStyle;
    context.stroke(quad);
  }

  context.drawImage(front, 0, 0);
  canvas.dataset.volumeRenderer = 'pseudo-extruded-512';
  return canvas;
};
