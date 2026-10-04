export interface FaceReaction { readonly squeeze: number; readonly delight: number; readonly stretch?: number; readonly blink?: number; readonly surprise?: number }
export const REST_FACE: FaceReaction = { squeeze: 0, delight: 0 };

/** Presentation only: reads existing deformation, never feeds the simulation. */
export const faceReaction = (strength: number, releasedMs: number, releaseStrength = 1, stroking = 0, stretch = 0): FaceReaction => ({
  squeeze: Math.round(Math.min(1, Math.max(0, strength * (1 - Math.min(1, Math.max(0, stroking)) * .65))) * 8) / 8,
  ...(stretch > 0 ? { stretch: Math.round(Math.min(1, stretch) * 8) / 8 } : {}),
  delight: stroking > .2 ? Math.round(Math.min(1, stroking) * 8) / 8 : releasedMs >= 0 && releasedMs < 650 ? Math.round((1 - releasedMs / 650) * Math.min(1, Math.max(0, releaseStrength)) * 8) / 8 : 0,
});

export const accessorySway = (releasedMs: number, strength: number, piece: number): number => {
  if (releasedMs < 0 || releasedMs > 900) return 0;
  const t = releasedMs / 1000;
  return Math.sin(t * 19) * Math.exp(-t * 5) * Math.min(1, Math.max(0, strength)) * .13 * (piece === 1 ? -1 : 1);
};

/** A stationary hold grows gently; pulling remains a separate, stronger cue. */
export const heldFaceStrength = (pressDepth: number, compression: number, displacement: number, heldMs: number): number => {
  const hold = Math.min(1, Math.max(0, heldMs - 120) / 700);
  return Math.min(1, Math.max(pressDepth * (.55 + .35 * hold), compression * 1.5, displacement * 1.5));
};

/** One brief, quantized blink after a long quiet interval; no extra clock. */
export const idleBlink = (elapsedMs: number): number => {
  if (elapsedMs < 5000) return 0;
  const phase = (elapsedMs - 5000) % 7000;
  return phase < 180 ? Math.round((1 - Math.abs(phase - 90) / 90) * 8) / 8 : 0;
};
