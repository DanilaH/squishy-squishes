import { REST_FACE, type FaceReaction } from './toyReactions';
import { drawToyMixIn } from './toyMixins';
import { drawPearlStar } from './pearlStars';
import { drawToyAccessory } from './toyArt';
import type { ShapeDefinition, ShapeId } from '../game/shapes';
import { APPEARANCE_TEXTURE_SIZE } from './appearance';
import type { AccessoryId, DecorDocumentV1, DecorFrame, StickerId } from './decor';

/** Shared production decor profile. Studio, Squeeze and Hall share these pixels;
 * IDs and V3 documents retain their original meaning. */
const TAU = Math.PI * 2;
const INK = '#503e50';
const stickerColors = [
  ['#ffe5e7', '#fda3c8', '#d660a0'],
  ['#effff7', '#8fdec4', '#409b9b'],
  ['#fffbdc', '#f6d078', '#bd893d'],
  ['#f5edff', '#c5a5f2', '#8861be'],
] as const;
const S = APPEARANCE_TEXTURE_SIZE;
const point = (p: { u: number; v: number }): [number, number] => [p.u * S, (1 - p.v) * S];
const gradient = (ctx: CanvasRenderingContext2D, top: string, mid: string, bottom: string, height: number): CanvasGradient => {
  const g = ctx.createLinearGradient(0, -height, 0, 5);
  g.addColorStop(0, top);
  g.addColorStop(.53, mid);
  g.addColorStop(1, bottom);
  return g;
};
const bead = (ctx: CanvasRenderingContext2D, x: number, y: number, radius = 8.6): void => {
  ctx.save();
  const g = ctx.createRadialGradient(x - 3, y - 4, 1, x, y, radius + 1);
  g.addColorStop(0, '#776476');
  g.addColorStop(.62, INK);
  g.addColorStop(1, '#302936');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.92)';
  ctx.beginPath(); ctx.ellipse(x - radius * .28, y - radius * .32, radius * .24, radius * .32, -.35, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.36)';
  ctx.beginPath(); ctx.arc(x + radius * .35, y + radius * .27, radius * .115, 0, TAU); ctx.fill();
  ctx.restore();
};
const eye = (ctx: CanvasRenderingContext2D, style: NonNullable<DecorDocumentV1['eyes']>, p: { u: number; v: number }, reaction: FaceReaction = REST_FACE): void => {
  const [x, y] = point(p);
  ctx.save(); ctx.translate(x, y);
  ctx.scale(1 + reaction.squeeze * .08, 1 - reaction.squeeze * .62); ctx.translate(-x, -y);
  if (style === 'dot') { bead(ctx, x, y); ctx.restore(); return; }
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = INK; ctx.lineWidth = 3.6;
  ctx.beginPath();
  if (style === 'happy') { ctx.moveTo(x - 8, y + 1); ctx.bezierCurveTo(x - 5, y - 7, x + 5, y - 7, x + 8, y + 1); }
  else { ctx.moveTo(x - 8, y); ctx.quadraticCurveTo(x, y + 4.5, x + 8, y); }
  ctx.stroke();
  ctx.restore(); ctx.restore();
};
const mouth = (ctx: CanvasRenderingContext2D, style: NonNullable<DecorDocumentV1['mouth']>, p: { u: number; v: number }, reaction: FaceReaction = REST_FACE): void => {
  const [x, y] = point(p);
  ctx.save(); ctx.translate(x, y);
  ctx.scale(1 + reaction.delight * .18, 1 - reaction.squeeze * .22 + reaction.delight * .22); ctx.translate(-x, -y);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (style === 'o') {
    ctx.beginPath(); ctx.ellipse(x, y + 2, 5.4, 6.8, 0, 0, TAU);
    ctx.fillStyle = '#73516c'; ctx.fill(); ctx.strokeStyle = '#4b384f'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x - 1.5, y - 1, 2.1, 1.4, -.2, 0, TAU);
    ctx.fillStyle = 'rgba(255,235,248,.9)'; ctx.fill();
  } else {
    ctx.strokeStyle = INK; ctx.lineWidth = 3.3; ctx.beginPath();
    if (style === 'smile') { ctx.moveTo(x - 11, y - 1); ctx.bezierCurveTo(x - 7, y + 9, x + 7, y + 9, x + 11, y - 1); }
    else { ctx.moveTo(x - 10, y - 1); ctx.quadraticCurveTo(x - 5, y + 7, x, y + 1); ctx.quadraticCurveTo(x + 5, y + 7, x + 10, y - 1); }
    ctx.stroke();
  }
  ctx.restore();
};
const blush = (ctx: CanvasRenderingContext2D, p: { u: number; v: number }): void => {
  const [x, y] = point(p);
  ctx.save();
  ctx.translate(x, y); ctx.scale(1, .62);
  const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 17);
  g.addColorStop(0, 'rgba(233,112,151,.40)');
  g.addColorStop(.45, 'rgba(245,138,172,.24)');
  g.addColorStop(1, 'rgba(245,138,172,0)');
  ctx.fillStyle = g; ctx.fillRect(-17, -17, 34, 34);
  ctx.restore();
};
const sticker = (ctx: CanvasRenderingContext2D, id: StickerId, size: number, variant = 0): void => {
  const r = size * .5;
  const base = { heart: 0, flower: 1, star: 2, sparkle: 3 }[id];
  const colors = stickerColors[(base + variant) % stickerColors.length]!;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(61,42,45,.25)'; ctx.shadowBlur = 1.5; ctx.shadowOffsetY = 1.2;
  if (id === 'heart') {
    drawToyMixIn(ctx, 'hearts', r, 0, 0, colors);
  } else if (id === 'star') {
    drawPearlStar(ctx, r, 0, [colors[0], colors[1], colors[0], colors[1], colors[2]]);
  } else if (id === 'flower') {
    for (let i = 0; i < 5; i++) {
      const a = i * TAU / 5 - Math.PI / 2;
      const x = Math.cos(a) * r * .46, y = Math.sin(a) * r * .46;
      const g = ctx.createRadialGradient(x - r * .12, y - r * .16, 0, x, y, r * .5);
      g.addColorStop(0, colors[0]); g.addColorStop(.45, colors[1]); g.addColorStop(1, colors[2]);
      ctx.beginPath(); ctx.ellipse(x, y, r * .46, r * .32, a, 0, TAU);
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = 'rgba(255,236,246,.7)'; ctx.lineWidth = Math.max(.6, r * .05); ctx.stroke();
    }
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    drawToyMixIn(ctx, 'pearls', r * .28);
  } else {
    ctx.beginPath(); ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(r * .14, -r * .14, r, 0);
    ctx.quadraticCurveTo(r * .14, r * .14, 0, r);
    ctx.quadraticCurveTo(-r * .14, r * .14, -r, 0);
    ctx.quadraticCurveTo(-r * .14, -r * .14, 0, -r); ctx.closePath();
    ctx.fillStyle = gradient(ctx, colors[0], colors[1], colors[2], r); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,244,.85)'; ctx.lineWidth = Math.max(.6, r * .07); ctx.stroke();
  }
  ctx.restore();
};

/** Native controls preview the same face lines as the UV overlay. */
export const drawPagesFaceChoice = (ctx: CanvasRenderingContext2D, kind: 'eyes' | 'mouth', style: NonNullable<DecorDocumentV1['eyes']> | NonNullable<DecorDocumentV1['mouth']>, width: number, height: number): void => {
  ctx.save(); ctx.translate(width / 2, height / 2); ctx.scale(1.3, 1.3); ctx.translate(-S / 2, -S / 2);
  if (kind === 'eyes') {
    eye(ctx, style as NonNullable<DecorDocumentV1['eyes']>, { u: .5 - 16 / S, v: .5 });
    eye(ctx, style as NonNullable<DecorDocumentV1['eyes']>, { u: .5 + 16 / S, v: .5 });
  } else mouth(ctx, style as NonNullable<DecorDocumentV1['mouth']>, { u: .5, v: .5 });
  ctx.restore();
};
export const drawPagesStickerChoice = (ctx: CanvasRenderingContext2D, id: StickerId, width: number, height: number): void => {
  ctx.save(); ctx.translate(width / 2, height / 2); sticker(ctx, id, Math.min(width, height) * .78); ctx.restore();
};

export const renderPagesSurfaceStickers = (
  ctx: CanvasRenderingContext2D, decor: DecorDocumentV1, _shape: ShapeDefinition, frame: DecorFrame,
): void => {
  const [faceX, faceY] = point(frame.mouth);
  const ids: readonly StickerId[] = ['heart', 'star', 'flower', 'sparkle'];
  for (const placed of decor.stickers) {
    const x = placed.x / 255 * S;
    const y = (1 - placed.y / 255) * S;
    ctx.save();
    if (Math.abs(x - faceX) < 42 && Math.abs(y - faceY) < 35) ctx.globalAlpha = .55;
    ctx.translate(x, y); ctx.rotate(placed.r / 255 * TAU);
    sticker(ctx, ids[placed.t] ?? 'heart', placed.s, (placed.x * 3 + placed.y * 7 + placed.r) % 4);
    ctx.restore();
  }
};

export const renderPagesSurfaceFace = (
  ctx: CanvasRenderingContext2D, decor: DecorDocumentV1, _shape: ShapeDefinition, frame: DecorFrame, reaction: FaceReaction = REST_FACE,
): void => {
  if (decor.blush) { blush(ctx, frame.blushLeft); blush(ctx, frame.blushRight); }
  if (decor.eyes) { eye(ctx, decor.eyes, frame.eyesLeft, reaction); eye(ctx, decor.eyes, frame.eyesRight, reaction); }
  if (decor.mouth) mouth(ctx, decor.mouth, frame.mouth, reaction);
};

export const renderPagesSurfaceDecor = (
  ctx: CanvasRenderingContext2D, decor: DecorDocumentV1, shape: ShapeDefinition, frame: DecorFrame,
): void => {
  renderPagesSurfaceStickers(ctx, decor, shape, frame);
  renderPagesSurfaceFace(ctx, decor, shape, frame);
};

export const drawPagesAccessoryGraphic = (ctx: CanvasRenderingContext2D, id: AccessoryId, width: number, height: number, shapeId?: ShapeId): void => {
  ctx.clearRect(0, 0, width, height);
  if (drawToyAccessory(ctx, id, width, height, shapeId)) return;
  ctx.save();
  ctx.translate(width * .5, height * .92);
  // The original 108px-tall bunny ears were cut by the native 256px Hall
  // canvas on square/heart/mushroom/paw. Shorten the authored geometry at its
  // shared source, so Studio, Squeeze and Hall retain the same seated asset.
  if (id === 'bunny-ears') ctx.scale(1, .66);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(84,61,78,.48)'; ctx.lineWidth = 2.4;
  ctx.shadowColor = 'rgba(67,42,56,.20)'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 2;
  if (id === 'bow') {
    for (const dir of [-1, 1]) {
      ctx.save(); ctx.scale(dir, 1);
      ctx.beginPath(); ctx.moveTo(0, -16);
      ctx.bezierCurveTo(25, -57, 63, -62, 58, -21);
      ctx.bezierCurveTo(52, 2, 16, -3, 0, -16);
      ctx.fillStyle = gradient(ctx, '#ffebec', '#f3a8c5', '#c976a0', 63); ctx.fill(); ctx.stroke();
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.moveTo(9, -19); ctx.quadraticCurveTo(37, -38, 52, -30);
      ctx.strokeStyle = 'rgba(255,255,255,.73)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(10, -17); ctx.quadraticCurveTo(25, -12, 43, -11);
      ctx.strokeStyle = 'rgba(147,73,109,.28)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath(); ctx.ellipse(0, -16, 13.5, 12, 0, 0, TAU);
    ctx.fillStyle = gradient(ctx, '#fff5eb', '#fbd0de', '#bc769b', 34); ctx.fill();
    ctx.strokeStyle = 'rgba(109,64,90,.48)'; ctx.lineWidth = 2.3; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-4, -20, 3, 2, -.4, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.fill();
  } else if (id === 'cat-ears' || id === 'bunny-ears') {
    for (const dir of [-1, 1]) {
      ctx.save(); ctx.scale(dir, 1);
      // Pair each root with its own heart lobe, not the empty center cleft.
      if (shapeId === 'heart') ctx.translate(22, 0);
      if (id === 'cat-ears') {
        ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(55, -6); ctx.quadraticCurveTo(46, -44, 35, -68); ctx.quadraticCurveTo(12, -42, 10, 0);
        ctx.fillStyle = gradient(ctx, '#fff4ee', '#efd9e6', '#c6adc9', 73); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(24, -15); ctx.lineTo(46, -18); ctx.lineTo(35, -49); ctx.closePath();
        ctx.fillStyle = gradient(ctx, '#ffe9ee', '#efb1c8', '#db8db0', 55); ctx.fill();
      } else {
        ctx.beginPath(); ctx.ellipse(30, -46, 16, 54, dir * .1, 0, TAU);
        ctx.fillStyle = gradient(ctx, '#fff9ed', '#eedbe7', '#c8b4ca', 101); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(30, -48, 6.8, 37, dir * .1, 0, TAU);
        ctx.fillStyle = gradient(ctx, '#ffe9ee', '#efa8c3', '#d38daa', 93); ctx.fill();
      }
      ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,.64)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(22, -37); ctx.lineTo(28, -53); ctx.stroke(); ctx.restore();
    }
  } else if (id === 'horns') {
    for (const dir of [-1, 1]) {
      ctx.save(); ctx.scale(dir, 1);
      if (shapeId === 'heart') ctx.translate(22, 0);
      ctx.beginPath(); ctx.moveTo(13, 0); ctx.quadraticCurveTo(49, -10, 55, -61);
      ctx.quadraticCurveTo(21, -49, 13, 0);
      ctx.fillStyle = gradient(ctx, '#fffcea', '#e7d5a0', '#c7a870', 63); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.72)'; ctx.lineWidth = 2.4; ctx.beginPath();
      ctx.moveTo(26, -13); ctx.quadraticCurveTo(39, -35, 46, -51); ctx.stroke(); ctx.restore();
    }
  } else {
    ctx.beginPath(); ctx.moveTo(-58, -5); ctx.lineTo(-47, -50); ctx.lineTo(-19, -28);
    ctx.lineTo(0, -68); ctx.lineTo(19, -28); ctx.lineTo(47, -50); ctx.lineTo(58, -5); ctx.closePath();
    ctx.fillStyle = gradient(ctx, '#fff9db', '#e9c46e', '#bd8a51', 73); ctx.fill(); ctx.stroke();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.moveTo(-49, -13); ctx.lineTo(49, -13); ctx.strokeStyle = 'rgba(255,244,196,.8)'; ctx.lineWidth = 3; ctx.stroke();
    for (const x of [-31, 0, 31]) {
      ctx.beginPath(); ctx.arc(x, -17, x === 0 ? 6 : 4.5, 0, TAU);
      ctx.fillStyle = x === 0 ? '#f5a3bf' : '#d0b2d9'; ctx.fill();
      ctx.beginPath(); ctx.arc(x - 1.4, -18.7, 1.25, 0, TAU);
      ctx.fillStyle = '#fff7f1'; ctx.fill();
    }
  }
  ctx.restore();
};
