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
export const drawToyMixIn = (ctx: CanvasRenderingContext2D, id: MixInId, r: number, variation = 0, depth = 0, heartColors: readonly [string, string, string] = ['#ffe5e7', '#fda3c8', '#d660a0']): void => {
  if (id === 'stars') { drawPearlStar(ctx, r, depth); return; }
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.globalAlpha *= 1 - depth * .25;
  if (id === 'pearls' || id === 'foam') sphere(ctx, r, id === 'foam');
  else if (id === 'hearts') {
    ctx.translate(0, r * .1); heart(ctx, r); ctx.fillStyle = heartColors[2]; ctx.fill(); ctx.translate(0, -r * .1);
    heart(ctx, r); const g = ctx.createLinearGradient(-r, -r, r, r);
    g.addColorStop(0, heartColors[0]); g.addColorStop(.4, heartColors[1]); g.addColorStop(1, heartColors[2]);
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(255,230,244,.8)'; ctx.lineWidth = Math.max(.6, r * .07); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-r * .34, -r * .25, r * .26, r * .12, -.45, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fill();
  } else if (id === 'confetti') {
    const colors = [['#d7fff2','#66c9b5','#398f99'], ['#fce7ff','#c699e0','#8658ad'], ['#fff5cc','#edbc6d','#be875c']] as const;
    const palette = colors[Math.abs(variation) % colors.length]!;
    ctx.beginPath(); ctx.roundRect(-r * .78, -r * .28, r * 1.56, r * .56, r * .12);
    const g = ctx.createLinearGradient(0, -r * .28, 0, r * .28);
    g.addColorStop(0, palette[0]); g.addColorStop(.45, palette[1]); g.addColorStop(1, palette[2]); ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-r * .6, -r * .16); ctx.lineTo(r * .55, -r * .16); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = Math.max(.5, r * .06); ctx.stroke();
  } else if (id === 'crescents') {
    ctx.beginPath();ctx.arc(0,0,r,Math.PI*.32,Math.PI*1.68);ctx.bezierCurveTo(-r*.15,-r*.80,-r*.36,r*.60,Math.cos(Math.PI*.32)*r,Math.sin(Math.PI*.32)*r);ctx.closePath();
    const g=ctx.createLinearGradient(-r,-r,r,r);g.addColorStop(0,'#fffcec');g.addColorStop(.5,'#d9d2f2');g.addColorStop(1,'#a399c7');ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=Math.max(.5,r*.07);ctx.stroke();
  } else if (id === 'bubbles') {
    const g=ctx.createRadialGradient(-r*.3,-r*.3,0,0,0,r);g.addColorStop(0,'rgba(255,249,252,.07)');g.addColorStop(.67,'rgba(199,223,248,.18)');g.addColorStop(.88,'rgba(219,174,234,.53)');g.addColorStop(1,'rgba(137,180,207,.55)');ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fillStyle=g;ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=Math.max(.6,r*.08);ctx.beginPath();ctx.arc(0,0,r*.80,Math.PI*1.08,Math.PI*1.64);ctx.stroke();ctx.beginPath();ctx.arc(r*.4,r*.4,r*.12,0,TAU);ctx.fillStyle='rgba(255,255,255,.7)';ctx.fill();
  } else if (id === 'flowers') {
    const palettes=[['#fff0fa','#d59de0'],['#fff6de','#e8c274'],['#eaffee','#9cc9a4']];const colors=palettes[Math.abs(variation)%3]!;
    for(let i=0;i<5;i++){const a=i*TAU/5;ctx.beginPath();ctx.ellipse(Math.cos(a)*r*.47,Math.sin(a)*r*.47,r*.48,r*.33,a,0,TAU);const g=ctx.createRadialGradient(-r*.2,-r*.3,0,0,0,r);g.addColorStop(0,colors[0]!);g.addColorStop(1,colors[1]!);ctx.fillStyle=g;ctx.fill();}
    ctx.beginPath();ctx.arc(0,0,r*.25,0,TAU);ctx.fillStyle='#fff1ba';ctx.fill();
  } else if (id === 'strawberry-slices' || id === 'lemon-slices' || id === 'kiwi-slices') {
    const berry=id==='strawberry-slices',lemon=id==='lemon-slices';
    if(berry){heart(ctx,r);ctx.fillStyle='#c56181';ctx.fill();ctx.scale(.86,.86);heart(ctx,r);ctx.fillStyle='#f8abc0';ctx.fill();}
    else {ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fillStyle=lemon?'#eac982':'#92b981';ctx.fill();ctx.beginPath();ctx.arc(0,0,r*.82,0,TAU);ctx.fillStyle=lemon?'#fff0b2':'#c4e5a6';ctx.fill();}
    ctx.shadowColor='transparent';
    for(let i=0;i<(berry?7:9);i++){
      const a=i*TAU/(berry?7:9),x=Math.cos(a)*r*.52,y=Math.sin(a)*r*.52;
      if(lemon){ctx.strokeStyle='rgba(255,255,232,.86)';ctx.lineWidth=Math.max(.5,r*.06);ctx.beginPath();ctx.moveTo(x*.12,y*.12);ctx.lineTo(x*1.4,y*1.4);ctx.stroke();}
      else {ctx.beginPath();ctx.ellipse(x,y,r*.055,r*.11,a,0,TAU);ctx.fillStyle=berry?'#fff2c2':'#59644d';ctx.fill();}
    }
    ctx.beginPath();ctx.ellipse(-r*.32,-r*.35,r*.24,r*.08,-.5,0,TAU);ctx.fillStyle='rgba(255,255,255,.62)';ctx.fill();
  } else if (id === 'flakes') {
    ctx.beginPath();ctx.moveTo(-r*.75,-r*.4);ctx.lineTo(-r*.12,-r*.87);ctx.lineTo(r*.74,-r*.24);ctx.lineTo(r*.44,r*.58);ctx.lineTo(-r*.22,r*.81);ctx.lineTo(-r*.84,r*.13);ctx.closePath();
    const g=ctx.createLinearGradient(-r,-r,r,r);g.addColorStop(0,'rgba(255,255,229,.75)');g.addColorStop(.38,'rgba(212,229,252,.60)');g.addColorStop(.62,'rgba(242,193,231,.72)');g.addColorStop(1,'rgba(160,188,216,.46)');ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='rgba(255,255,255,.62)';ctx.lineWidth=Math.max(.5,r*.06);ctx.stroke();
  } else {
    // Small foil chips have crisp reflective facets, unlike molded stars.
    ctx.beginPath(); ctx.moveTo(0, -r * .74); ctx.lineTo(r * .55, 0); ctx.lineTo(0, r * .74); ctx.lineTo(-r * .55, 0); ctx.closePath();
    const g = ctx.createLinearGradient(-r, -r, r, r); g.addColorStop(0, '#fffbe5'); g.addColorStop(.4, '#f8d990'); g.addColorStop(.5, '#fffef5'); g.addColorStop(1, '#c78bba'); ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, -r * .74); ctx.lineTo(0, r * .74); ctx.strokeStyle = '#fffaf1'; ctx.lineWidth = Math.max(.6, r * .08); ctx.stroke();
  }
  ctx.restore();
};
