import type { ShapeDefinition, ShapeId } from '../game/shapes';
import { APPEARANCE_TEXTURE_SIZE } from './appearance';
import type { AccessoryId, DecorDocumentV1, DecorFrame, StickerId } from './decor';

/** Pages-only authored transparent vector art. Old V3 IDs and the ordinary/Yandex
 * rasterizer remain untouched; Studio, Squeeze and Hall share these same pixels. */
const TAU = Math.PI * 2;
const INK = '#514253';
const S = APPEARANCE_TEXTURE_SIZE;
const point = (p: { u: number; v: number }): [number, number] => [p.u * S, (1 - p.v) * S];
const gradient = (ctx: CanvasRenderingContext2D, top: string, mid: string, bottom: string, height: number): CanvasGradient => {
  const g = ctx.createLinearGradient(0, -height, 0, 5);
  g.addColorStop(0, top);
  g.addColorStop(.53, mid);
  g.addColorStop(1, bottom);
  return g;
};
const bead = (ctx: CanvasRenderingContext2D, x: number, y: number, radius = 9.5): void => {
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
const eye = (ctx: CanvasRenderingContext2D, style: NonNullable<DecorDocumentV1['eyes']>, p: { u: number; v: number }): void => {
  const [x, y] = point(p);
  if (style === 'dot') { bead(ctx, x, y); return; }
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = INK; ctx.lineWidth = 5;
  ctx.beginPath();
  if (style === 'happy') ctx.arc(x, y + 3, 10, Math.PI * 1.10, Math.PI * 1.90);
  else { ctx.moveTo(x - 9, y); ctx.quadraticCurveTo(x, y + 6, x + 9, y); }
  ctx.stroke();
  ctx.restore();
};
const mouth = (ctx: CanvasRenderingContext2D, style: NonNullable<DecorDocumentV1['mouth']>, p: { u: number; v: number }): void => {
  const [x, y] = point(p);
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (style === 'o') {
    ctx.beginPath(); ctx.ellipse(x, y + 2, 6.8, 8.8, 0, 0, TAU);
    ctx.fillStyle = '#73516c'; ctx.fill(); ctx.strokeStyle = '#4b384f'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x - 1.5, y - 1, 2.1, 1.4, -.2, 0, TAU);
    ctx.fillStyle = 'rgba(255,235,248,.9)'; ctx.fill();
  } else {
    ctx.strokeStyle = INK; ctx.lineWidth = 4.6; ctx.beginPath();
    if (style === 'smile') { ctx.moveTo(x - 13, y - 2); ctx.quadraticCurveTo(x, y + 18, x + 13, y - 2); }
    else { ctx.moveTo(x - 12, y - 2); ctx.quadraticCurveTo(x - 7, y + 9, x, y + 2); ctx.quadraticCurveTo(x + 7, y + 9, x + 12, y - 2); }
    ctx.stroke();
  }
  ctx.restore();
};
const blush = (ctx: CanvasRenderingContext2D, p: { u: number; v: number }): void => {
  const [x, y] = point(p);
  ctx.save();
  const g = ctx.createRadialGradient(x, y, 1, x, y, 16);
  g.addColorStop(0, 'rgba(232,116,145,.26)');
  g.addColorStop(.48, 'rgba(244,137,165,.14)');
  g.addColorStop(1, 'rgba(244,137,165,0)');
  ctx.fillStyle = g; ctx.fillRect(x - 16, y - 16, 32, 32);
  ctx.restore();
};
const sticker = (ctx: CanvasRenderingContext2D, id: StickerId, size: number): void => {
  const r = size * .5;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(61,42,45,.25)'; ctx.shadowBlur = 1.5; ctx.shadowOffsetY = 1.2;
  if (id === 'heart') {
    ctx.beginPath(); ctx.moveTo(0, r * .8);
    ctx.bezierCurveTo(-r * 1.35, r * .04, -r * .74, -r * 1.04, 0, -r * .34);
    ctx.bezierCurveTo(r * .74, -r * 1.04, r * 1.35, r * .04, 0, r * .8);
    ctx.fillStyle = gradient(ctx, '#ffe1e6', '#ef80a4', '#c95a88', r); ctx.fill();
  } else if (id === 'star') {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * TAU / 10;
      const d = i % 2 === 0 ? r : r * .49;
      if (i === 0) ctx.moveTo(Math.cos(a) * d, Math.sin(a) * d);
      else ctx.lineTo(Math.cos(a) * d, Math.sin(a) * d);
    }
    ctx.closePath(); ctx.fillStyle = gradient(ctx, '#fffce8', '#ffe7a1', '#dfae5f', r); ctx.fill();
  } else if (id === 'flower') {
    ctx.fillStyle = gradient(ctx, '#fff2f2', '#edb6d3', '#cb8eae', r);
    for (let i = 0; i < 5; i++) {
      const a = i * TAU / 5 - Math.PI / 2;
      ctx.beginPath(); ctx.ellipse(Math.cos(a) * r * .49, Math.sin(a) * r * .49, r * .42, r * .29, a, 0, TAU); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(0, 0, r * .31, 0, TAU);
    ctx.fillStyle = '#ffdfa4'; ctx.fill();
  } else {
    ctx.strokeStyle = '#fff7d7'; ctx.lineWidth = Math.max(2.5, r * .24);
    ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.moveTo(0, -r); ctx.lineTo(0, r);
    ctx.moveTo(-r * .48, -r * .48); ctx.lineTo(r * .48, r * .48);
    ctx.moveTo(r * .48, -r * .48); ctx.lineTo(-r * .48, r * .48); ctx.stroke();
  }
  if (id !== 'sparkle') {
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.strokeStyle = 'rgba(255,250,243,.83)'; ctx.lineWidth = 1.25; ctx.stroke();
  }
  ctx.restore();
};

export const renderPagesSurfaceDecor = (
  ctx: CanvasRenderingContext2D, decor: DecorDocumentV1, _shape: ShapeDefinition, frame: DecorFrame,
): void => {
  const [faceX, faceY] = point(frame.mouth);
  const ids: readonly StickerId[] = ['heart', 'star', 'flower', 'sparkle'];
  // Render stickers behind face details. Overlapping older save coordinates
  // stay intact; a softer overprint keeps the expression legible at 320px.
  for (const placed of decor.stickers) {
    const x = placed.x / 255 * S;
    const y = (1 - placed.y / 255) * S;
    ctx.save();
    if (Math.abs(x - faceX) < 42 && Math.abs(y - faceY) < 35) ctx.globalAlpha = .55;
    ctx.translate(x, y); ctx.rotate(placed.r / 255 * TAU);
    sticker(ctx, ids[placed.t] ?? 'heart', placed.s);
    ctx.restore();
  }
  if (decor.blush) { blush(ctx, frame.blushLeft); blush(ctx, frame.blushRight); }
  if (decor.eyes) { eye(ctx, decor.eyes, frame.eyesLeft); eye(ctx, decor.eyes, frame.eyesRight); }
  if (decor.mouth) mouth(ctx, decor.mouth, frame.mouth);
};

export const drawPagesAccessoryGraphic = (ctx: CanvasRenderingContext2D, id: AccessoryId, width: number, height: number, shapeId?: ShapeId): void => {
  ctx.clearRect(0, 0, width, height);
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
