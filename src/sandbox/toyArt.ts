import { resolveAuthoredImagePath } from '../app/runtimeAssets';

// Startup-required: existing V3 toys can display a bow immediately in the Hall.
// Both formats were emitted by asset:prepare; the original lives in assets-src.
const bowPath = `${import.meta.env.BASE_URL}assets/toy-polish/puffy-bow.webp`;
let bow: HTMLImageElement | null = null;
let pending: Promise<void> | null = null;

export const preloadToyArt = (): Promise<void> => {
  pending ??= (async () => {
    const image = new Image();
    const preferred = await resolveAuthoredImagePath(bowPath, true);
    image.src = preferred;
    try { await image.decode(); }
    catch (error: unknown) {
      if (preferred === bowPath) throw error;
      image.src = bowPath;
      await image.decode();
    }
    if (!image.naturalWidth) throw new Error('Empty puffy bow image');
    bow = image;
  })().catch((error: unknown) => {
    // Preserve the procedural bow on a genuine asset failure; retry next entry.
    pending = null;
    console.warn('[squishy:toy-art] Puffy bow unavailable; using drawn bow.', error);
  });
  return pending;
};

export const drawPuffyBow = (context: CanvasRenderingContext2D, width: number, height: number, icon = false): boolean => {
  if (!bow) return false;
  context.save();
  // Retain the old logical seat/extent: art never changes the projection basis.
  // The prepared 256px canvas contains alpha bounds x16..239, y72..183.
  context.shadowColor = 'rgba(108, 45, 76, .26)';
  context.shadowBlur = height * .025;
  context.shadowOffsetY = height * .018;
  context.drawImage(bow, 12, 68, 232, 120,
    width * (icon ? .05 : .16), height * (icon ? .14 : .53),
    width * (icon ? .90 : .68), height * (icon ? .70 : .48));
  context.restore();
  return true;
};
