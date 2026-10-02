export interface FaceReaction { readonly squeeze: number; readonly delight: number }
export const REST_FACE: FaceReaction = { squeeze: 0, delight: 0 };

/** Presentation only: reads existing deformation, never feeds the simulation. */
export const faceReaction = (strength: number, releasedMs: number): FaceReaction => ({
  squeeze: Math.round(Math.min(1, Math.max(0, strength)) * 4) / 4,
  delight: releasedMs >= 0 && releasedMs < 650 ? Math.round((1 - releasedMs / 650) * 4) / 4 : 0,
});

export const accessorySway = (releasedMs: number, strength: number, piece: number): number => {
  if (releasedMs < 0 || releasedMs > 900) return 0;
  const t = releasedMs / 1000;
  return Math.sin(t * 19) * Math.exp(-t * 5) * Math.min(1, Math.max(0, strength)) * .13 * (piece === 1 ? -1 : 1);
};
