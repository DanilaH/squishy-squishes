import { getAccessorySeatFactor, getAccessorySeats } from './accessorySeats';
import { getDecorFrame, type AccessoryId, type DecorDocumentV1 } from './decor';
import type { ShapeDefinition } from '../game/shapes';

export interface AccessoryPlacement {
  readonly a: AccessoryId;
  readonly x: number;
  readonly y: number;
  readonly s: number;
  readonly r: number;
  readonly side: 'whole' | 'left' | 'right';
  readonly locked?: true;
  readonly color?: number;
}
export interface FaceTransform { readonly x: number; readonly y: number; readonly s: number }
export const MAX_ACCESSORY_PLACEMENTS = 128;

export const initialAccessoryPlacements = (shape: ShapeDefinition, a: AccessoryId): readonly AccessoryPlacement[] =>
  getAccessorySeats(shape, a).map(seat => ({ a, x: Math.round(seat.u * 255), y: Math.round(seat.v * 255),
    s: a === 'glasses' ? 1.5 : a === 'headphones' ? 1.8 : 1, r: seat.angle, side: seat.side }));

/** Legacy single accessories keep their exact unquantized seats until edited. */
export const accessoryPlacements = (decor: DecorDocumentV1, shape: ShapeDefinition): readonly AccessoryPlacement[] =>
  decor.accessories ?? (decor.accessory ? initialAccessoryPlacements(shape, decor.accessory) : []);

export const accessoryFrame = (shape: ShapeDefinition, placement: AccessoryPlacement) => {
  const frame = getDecorFrame(shape, placement.a, placement.side);
  return { ...frame, headAnchor: { u: placement.x / 255, v: placement.y / 255 }, headSeatOffsetV: 0, headAngle: placement.r };
};

export const withFaceTransform = (context: CanvasRenderingContext2D, decor: DecorDocumentV1, shape: ShapeDefinition, draw: () => void): void => {
  const transform = decor.face;
  if (!transform) { draw(); return; }
  const frame = getDecorFrame(shape), cx = (frame.eyesLeft.u + frame.eyesRight.u) * 128;
  const cy = (1 - (frame.eyesLeft.v + frame.mouth.v) / 2) * 256;
  context.save();
  context.translate(transform.x / 255 * 256, (1 - transform.y / 255) * 256);
  context.scale(transform.s, transform.s);
  context.translate(-cx, -cy);
  draw(); context.restore();
};

/** Canvas and Hall share placement, rotation, scale, mirroring and depth. */
export const composeAccessory = (ctx: CanvasRenderingContext2D, shape: ShapeDefinition, placement: AccessoryPlacement,
  project: (u: number, v: number) => readonly [number, number], width: number, height: number,
  draw: (ctx: CanvasRenderingContext2D, id: AccessoryId, width: number, height: number, side: AccessoryPlacement['side']) => void): void => {
  const [x, y] = project(placement.x / 255, placement.y / 255);
  const canvas = document.createElement('canvas'); canvas.width = 180; canvas.height = 120;
  const art = canvas.getContext('2d'); if (!art) return;
  draw(art, placement.a, 180, 120, placement.side);
  if (placement.color !== undefined) {
    art.globalCompositeOperation = 'source-atop';
    art.fillStyle = `#${placement.color.toString(16).padStart(6, '0')}`;
    art.globalAlpha = .38; art.fillRect(0, 0, 180, 120);
  }
  ctx.save(); ctx.translate(x, y); ctx.rotate(placement.r); ctx.scale(placement.s, placement.s);
  ctx.drawImage(canvas, -width / 2, -height * getAccessorySeatFactor(shape, placement.a), width, height);
  ctx.restore();
};
