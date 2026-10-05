/** Mirrors the shared vertex shader; input and decorations must use its mold. */
export const moldFactors = (progress: number) => {
  const t = Math.min(1, Math.max(0, progress));
  const mold = t * t * (3 - 2 * t);
  return { x: 1 + mold * .075, y: 1 - mold * .095, offsetY: mold * .018 };
};
export const containClipAxis = (value: number): number => {
  const excess = Math.abs(value) - .88;
  return excess <= 0 ? value : Math.sign(value) * (.88 + .08 * excess / (.08 + excess));
};
/** Invert viewport containment before mold/pose/hit testing. */
export const uncontainClipAxis = (value: number): number => {
  const excess = Math.abs(value) - .88;
  if (excess <= 0) return value;
  return Math.sign(value) * (.88 + .08 * excess / Math.max(.0001, .08 - excess));
};
