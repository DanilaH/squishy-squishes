const TAU = Math.PI * 2;
const starPath = (context: CanvasRenderingContext2D, radius: number): void => {
  context.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * TAU / 10;
    const r = radius * (i % 2 === 0 ? 1 : .49);
    if (i === 0) context.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
    else context.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  context.closePath();
};

/** One shared molded, pearlescent star for the tray and authored UV texture.
 * Depth is presentation derived from existing placement bytes, never save data. */
export const drawPearlStar = (context: CanvasRenderingContext2D, radius: number, depth = 0): void => {
  context.save();
  context.globalAlpha *= 1 - depth * .38;
  context.lineJoin = 'round';
  // Lower bevel conveys thickness without a floating sticker drop shadow.
  context.translate(0, radius * .12);
  starPath(context, radius);
  context.fillStyle = '#bd87ac';
  context.fill();
  context.translate(0, -radius * .12);
  starPath(context, radius);
  const pearl = context.createLinearGradient(-radius, -radius, radius, radius);
  pearl.addColorStop(0, '#fffbe8');
  pearl.addColorStop(.32, '#fff0cd');
  pearl.addColorStop(.56, '#f6cde4');
  pearl.addColorStop(.78, '#d9d7fa');
  pearl.addColorStop(1, '#cfa2c9');
  context.fillStyle = pearl;
  context.fill();
  context.strokeStyle = `rgba(255,255,244,${.8 - depth * .3})`;
  context.lineWidth = Math.max(.6, radius * .08);
  context.stroke();
  // A small soft highlight, with less contrast for pieces deeper in the gel.
  const gleam = context.createRadialGradient(-radius * .22, -radius * .36, 0, -radius * .22, -radius * .36, radius * .55);
  gleam.addColorStop(0, `rgba(255,255,255,${.85 - depth * .45})`);
  gleam.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gleam;
  context.fill();
  context.restore();
};
