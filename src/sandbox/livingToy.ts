/** Bounded presentation only. No timer, random state, physics or saved data. */
export interface ToyPose {
  readonly kind: 'rest' | 'blink' | 'sway' | 'jiggle' | 'stretch';
  readonly rotation: number; readonly skew: number; readonly scaleY: number; readonly y: number;
  readonly blink: number; readonly delight: number; readonly squeeze: number; readonly sway: number;
}
export const REST_TOY: ToyPose = { kind: 'rest', rotation: 0, skew: 0, scaleY: 1, y: 0, blink: 0, delight: 0, squeeze: 0, sway: 0 };
const quantize = (n: number): number => Math.round(Math.min(1, Math.max(0, n)) * 8) / 8;
const intervals = [7000, 8500, 7500, 9500] as const;
const durations = [180, 1100, 850, 1250] as const;
export const idleToyPose = (quietMs: number): ToyPose => {
  if (quietMs < 5000) return REST_TOY;
  let phase = (quietMs - 5000) % 32500;
  let mode = 0;
  while (mode < 3 && phase >= intervals[mode]!) { phase -= intervals[mode]!; mode++; }
  if (phase >= durations[mode]!) return REST_TOY;
  const t = phase / durations[mode]!, envelope = Math.sin(Math.PI * t) ** 2;
  if (mode === 0) return { ...REST_TOY, kind: 'blink', blink: quantize(envelope) };
  if (mode === 1) return { ...REST_TOY, kind: 'sway', rotation: Math.sin(t * Math.PI * 2) * .042 * envelope, skew: Math.sin(t * Math.PI * 2) * .023 * envelope, delight: quantize(envelope * .6), sway: Math.sin(t * Math.PI * 3) * .018 * envelope };
  if (mode === 2) return { ...REST_TOY, kind: 'jiggle', rotation: Math.sin(t * Math.PI * 6) * .026 * envelope, y: Math.sin(t * Math.PI * 4) * .012 * envelope, scaleY: 1 + Math.sin(t * Math.PI * 4) * .012 * envelope, delight: quantize(envelope * .45), sway: Math.sin(t * Math.PI * 6) * .025 * envelope };
  return { ...REST_TOY, kind: 'stretch', scaleY: 1 + .035 * envelope, skew: .015 * envelope, squeeze: quantize(envelope * .35), delight: quantize(envelope * .5), blink: quantize(envelope * .5) };
};
export const posePoint = (x: number, y: number, pose: ToyPose): { x: number; y: number } => {
  if (pose === REST_TOY) return { x, y };
  const sy = (y + .65) * pose.scaleY, sx = x / pose.scaleY + pose.skew * sy;
  const c = Math.cos(pose.rotation), s = Math.sin(pose.rotation);
  return { x: sx * c - sy * s, y: sx * s + sy * c - .65 + pose.y };
};
export const unposePoint = (x: number, y: number, pose: ToyPose): { x: number; y: number } => {
  if (pose === REST_TOY) return { x, y };
  const py = y + .65 - pose.y, c = Math.cos(pose.rotation), s = Math.sin(pose.rotation);
  const sy = -x * s + py * c, sx = x * c + py * s;
  return { x: (sx - pose.skew * sy) * pose.scaleY, y: sy / pose.scaleY - .65 };
};
export const inclusionLag = (previous: number, motion: number, deltaMs: number): number => {
  const target = Math.max(-.035, Math.min(.035, -motion * 8));
  const result = previous + (target - previous) * (1 - Math.exp(-8 * Math.min(50, Math.max(0, deltaMs)) / 1000));
  return Math.abs(result) < .00001 ? 0 : result;
};
export const contactFeedback = (press: number, compression: number, stretch: number, lift: number) => ({
  width: 1 + Math.min(1, compression) * .20 + Math.min(1, press) * .08 - Math.min(1, stretch) * .10,
  opacity: Math.max(.48, Math.min(.92, .76 + press * .10 - Math.abs(lift) * .45 - stretch * .12)),
  blur: 2.2 + Math.abs(lift) * 3 + stretch * .7,
});
