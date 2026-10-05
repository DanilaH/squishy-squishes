import { drawAccessoryPiece, type DecorDocumentV1 } from './decor';
import { getAccessorySeatFactor } from './accessorySeats';
import type { ShapeDefinition } from '../game/shapes';
import type { AccessoryPlacement } from './freeCraft';

const bounds = new Map<string, readonly [number, number, number, number]>();
const artBounds = (piece: AccessoryPlacement): readonly [number, number, number, number] => {
  const key = `${piece.a}/${piece.side}/${piece.mirrored ?? false}`;
  const cached = bounds.get(key); if (cached) return cached;
  const canvas = document.createElement('canvas'); canvas.width = 180; canvas.height = 120;
  const ctx = canvas.getContext('2d')!;
  drawAccessoryPiece(ctx, piece.a, 180, 120, piece.side, piece.mirrored);
  const pixels = ctx.getImageData(0, 0, 180, 120).data;
  let left = 180, top = 120, right = 0, bottom = 0;
  for (let y = 0; y < 120; y++) for (let x = 0; x < 180; x++) {
    if (pixels[(y * 180 + x) * 4 + 3]! < 2) continue;
    left = Math.min(left, x); top = Math.min(top, y);
    right = Math.max(right, x + 1); bottom = Math.max(bottom, y + 1);
  }
  if (left > right || top > bottom) return [0, 0, 1, 1];
  const result = [left / 180, top / 120, right / 180, bottom / 120] as const;
  bounds.set(key, result); return result;
};

/** Fit the complete craft into a static card. Ordinary toys retain their camera. */
export const fitLibraryCraft = (ctx: CanvasRenderingContext2D, shape: ShapeDefinition, decor: DecorDocumentV1,
  project: (u: number, v: number) => readonly [number, number]): number => {
  let left = 0, top = 0, right = 256, bottom = 256;
  for (const piece of decor.accessories ?? []) {
    const [x, y] = project(piece.x / 255, piece.y / 255), [l, t, r, b] = artBounds(piece);
    const cosine = Math.cos(piece.r), sine = Math.sin(piece.r), seat = getAccessorySeatFactor(shape, piece.a);
    for (const u of [l, r]) for (const v of [t, b]) {
      const dx = (u - .5) * 112 * piece.s, dy = (v - seat) * 75 * piece.s;
      const px = x + dx * cosine - dy * sine, py = y + dx * sine + dy * cosine;
      left = Math.min(left, px - 2); right = Math.max(right, px + 2);
      top = Math.min(top, py - 2); bottom = Math.max(bottom, py + 2);
    }
  }
  // Hall CSS enlarges thumbnails by up to 1.7. A freely extended composition
  // needs that transparent margin too, otherwise its canvas fits while the
  // displayed wing or strap still runs outside the card.
  const needsFit = left < 0 || top < 0 || right > 256 || bottom > 256;
  const scale = needsFit ? Math.min(144 / (right - left), 144 / (bottom - top)) : 1;
  if (scale < 1) {
    ctx.translate(128, 128); ctx.scale(scale, scale);
    ctx.translate(-(left + right) / 2, -(top + bottom) / 2);
  }
  return scale;
};
