import type { MixInId } from './appearance';
import { drawPearlStar } from './pearlStars';

const TAU = Math.PI * 2;
const heart = (ctx: CanvasRenderingContext2D, r: number): void => {
  ctx.beginPath(); ctx.moveTo(0, r * .82);
  ctx.bezierCurveTo(-r * 1.2, r * .1, -r * .85, -r * .92, 0, -r * .28);
  ctx.bezierCurveTo(r * .85, -r * .92, r * 1.2, r * .1, 0, r * .82); ctx.closePath();
};
const sphere = (ctx: CanvasRenderingContext2D, r: number, foam: boolean): void => {
  const g = ctx.createRadialGradient(-r * .32, -r * .36, r * .04, 0, 0, r);
  g.addColorStop(0, '#fffaf2'); g.addColorStop(.3, foam ? '#fff0f5' : '#f9dbea');
  g.addColorStop(.66, foam ? '#ecdfed' : '#cdc4e9'); g.addColorStop(1, foam ? '#b7afc9' : '#8a93bb');
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(255,244,254,.65)'; ctx.lineWidth = Math.max(.5, r * .06); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-r * .3, -r * .36, r * .26, r * .15, -.5, 0, TAU);
  ctx.fillStyle = foam ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.93)'; ctx.fill();
  if (!foam) { ctx.beginPath(); ctx.arc(r * .38, r * .3, r * .1, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fill(); }
};

/** Same small material drawing in the tray, UV bake and transient placement cue. */
export const drawToyMixIn = (ctx: CanvasRenderingContext2D, id: MixInId, r: number, variation = 0, depth = 0): void => {
  if (id === 'stars') { drawPearlStar(ctx, r, depth); return; }
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.globalAlpha *= 1 - depth * .25;
  if (id === 'pearls' || id === 'foam') sphere(ctx, r, id === 'foam');
  else if (id === 'hearts') {
    ctx.translate(0, r * .1); heart(ctx, r); ctx.fillStyle = '#ad527c'; ctx.fill(); ctx.translate(0, -r * .1);
    heart(ctx, r); const g = ctx.createLinearGradient(-r, -r, r, r);
    g.addColorStop(0, '#ffe5e7'); g.addColorStop(.4, '#fda3c8'); g.addColorStop(1, '#d660a0');
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(255,230,244,.8)'; ctx.lineWidth = Math.max(.6, r * .07); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-r * .34, -r * .25, r * .26, r * .12, -.45, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fill();
  } else if (id === 'confetti') {
    const colors = [['#d7fff2','#66c9b5','#398f99'], ['#fce7ff','#c699e0','#8658ad'], ['#fff5cc','#edbc6d','#be875c']] as const;
    const palette = colors[Math.abs(variation) % colors.length]!;
    ctx.beginPath(); ctx.roundRect(-r * .78, -r * .28, r * 1.56, r * .56, r * .12);
    const g = ctx.createLinearGradient(0, -r * .28, 0, r * .28);
    g.addColorStop(0, palette[0]); g.addColorStop(.45, palette[1]); g.addColorStop(1, palette[2]); ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-r * .6, -r * .16); ctx.lineTo(r * .55, -r * .16); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = Math.max(.5, r * .06); ctx.stroke();
  } else {
    // Small foil chips have crisp reflective facets, unlike molded stars.
    ctx.beginPath(); ctx.moveTo(0, -r * .74); ctx.lineTo(r * .55, 0); ctx.lineTo(0, r * .74); ctx.lineTo(-r * .55, 0); ctx.closePath();
    const g = ctx.createLinearGradient(-r, -r, r, r); g.addColorStop(0, '#fffbe5'); g.addColorStop(.4, '#f8d990'); g.addColorStop(.5, '#fffef5'); g.addColorStop(1, '#c78bba'); ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, -r * .74); ctx.lineTo(0, r * .74); ctx.strokeStyle = '#fffaf1'; ctx.lineWidth = Math.max(.6, r * .08); ctx.stroke();
  }
  ctx.restore();
};
