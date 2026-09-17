// Decode the immediately reachable UI art before displaying the Library.
// A failed fetch/decode leaves the previous CSS-only buttons fully usable.
const paths = [
  './ui-assets/honey-wide.webp',
  './ui-assets/honey-pill.webp',
  './ui-assets/honey-small.webp',
  './ui-assets/honey-wave.webp',
  './ui-assets/red-wide.webp',
] as const;

const decodeImage = async (url: string): Promise<void> => {
  const image = new Image();
  image.src = url;
  await image.decode();
  if (image.naturalWidth === 0 || image.naturalHeight === 0) throw new Error(`Empty UI image: ${url}`);
};

export const preloadJellyUi = async (): Promise<boolean> => {
  try {
    await Promise.all(paths.map((path) => decodeImage(new URL(path, import.meta.url).href)));
    return true;
  } catch (error) {
    console.warn('[squishy:jelly-ui] Image preload failed; using CSS-only controls.', error);
    return false;
  }
};
