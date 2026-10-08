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
  readonly mirrored?: true;
}
export interface FaceTransform { readonly x: number; readonly y: number; readonly s: number }
export const MAX_ACCESSORY_PLACEMENTS = 128;

export const initialAccessoryPlacements = (shape: ShapeDefinition, a: AccessoryId): readonly AccessoryPlacement[] =>
  getAccessorySeats(shape, a).map(seat => ({ a, x: Math.round(seat.u * 255), y: Math.round(seat.v * 255),
    s: a === 'glasses' ? 1.5 : a === 'headphones' ? 1.8 : a === 'antennae' ? .65 : 1, r: seat.angle, side: seat.side }));

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

/** Recolour pigment while retaining its authored shading, highlights and alpha. */
export const tintAccessory = (context: CanvasRenderingContext2D, width: number, height: number, color: number): void => {
  const pixels = context.getImageData(0, 0, width, height), bytes = pixels.data;
  const channels = [(color >> 16) & 255, (color >> 8) & 255, color & 255];
  for (let i = 0; i < bytes.length; i += 4) {
    if (!bytes[i + 3]) continue;
    const luminance = (bytes[i]! * .2126 + bytes[i + 1]! * .7152 + bytes[i + 2]! * .0722) / 255;
    const shade = Math.min(1.1, Math.max(.38, luminance / .72));
    const highlight = Math.max(0, (luminance - .86) / .14) * .8;
    for (let channel = 0; channel < 3; channel++) {
      const pigment = Math.min(255, channels[channel]! * shade);
      bytes[i + channel] = Math.round(pigment + (255 - pigment) * highlight);
    }
  }
  context.putImageData(pixels, 0, 0);
};

/** Canvas and Hall share placement, rotation, scale, mirroring and depth. */
export const composeAccessory = (ctx: CanvasRenderingContext2D, shape: ShapeDefinition, placement: AccessoryPlacement,
  project: (u: number, v: number) => readonly [number, number], width: number, height: number,
  draw: (ctx: CanvasRenderingContext2D, id: AccessoryId, width: number, height: number, side: AccessoryPlacement['side'], mirrored?: boolean) => void): void => {
  const [x, y] = project(placement.x / 255, placement.y / 255);
  const canvas = document.createElement('canvas'); canvas.width = 180; canvas.height = 120;
  const art = canvas.getContext('2d'); if (!art) return;
  draw(art, placement.a, 180, 120, placement.side, placement.mirrored);
  if (placement.color !== undefined) tintAccessory(art, 180, 120, placement.color);

  ctx.save(); ctx.translate(x, y); ctx.rotate(placement.r); ctx.scale(placement.s, placement.s);
  ctx.drawImage(canvas, -width / 2, -height * getAccessorySeatFactor(shape, placement.a), width, height);
  ctx.restore();
};
