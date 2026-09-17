// Decode immediately reachable UI art before the Library becomes playable.
// Each URL must use a static literal so Vite rewrites it to the hashed asset
// under the correct Pages/Yandex build prefix; dynamic new URL(path, import.meta.url)
// incorrectly requests /phaser/assets/ui-assets/*.webp in the staged preview.
const urls = [
  new URL('./ui-assets/honey-wide.webp', import.meta.url).href,
  new URL('./ui-assets/honey-pill.webp', import.meta.url).href,
  new URL('./ui-assets/honey-small.webp', import.meta.url).href,
  new URL('./ui-assets/honey-wave.webp', import.meta.url).href,
  new URL('./ui-assets/red-wide.webp', import.meta.url).href,
];

const decodeImage = async (url: string): Promise<void> => {
  const image = new Image();
  image.src = url;
  await image.decode();
  if (!image.naturalWidth || !image.naturalHeight) throw new Error(`Empty UI image: ${url}`);
};

export const preloadJellyUi = async (): Promise<boolean> => {
  try {
    await Promise.all(urls.map(decodeImage));
    return true;
  } catch (error) {
    console.warn('[squishy:jelly-ui] Image preload failed; using CSS-only controls.', error);
    return false;
  }
};
