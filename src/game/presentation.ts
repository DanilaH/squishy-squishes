import type { VariantChoice } from './content';

export type PresentationTier = 'standard' | 'special' | 'showcase';

/** Cosmetic-only reward hierarchy derived from existing CMF choices. */
export const getPresentationTier = (choice: VariantChoice): PresentationTier => {
  if (choice.material === 'holo' || choice.filling === 'pearls') return 'showcase';
  if (choice.material === 'jelly' || choice.filling === 'beads') return 'special';
  return 'standard';
};
