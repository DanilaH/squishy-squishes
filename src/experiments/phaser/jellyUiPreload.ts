import './jellyIconPreview.css';

// Decode only art that can be visible on the first Library frame. Maker-only
// icons are warmed together with the lazy Phaser/Studio payload before maker
// mount, so Library startup does not pay for assets it cannot show yet.
// Every URL stays a static literal so Vite rewrites it to the hashed build path.
const libraryUrls = [
  new URL('./ui-assets/honey-wide.webp', import.meta.url).href,
  new URL('./ui-assets/honey-pill.webp', import.meta.url).href,
  new URL('./ui-assets/honey-small.webp', import.meta.url).href,
  new URL('./ui-assets/red-wide.webp', import.meta.url).href,
  new URL('../../../biba/no-padding/128px/white/11-symbols/plus.png', import.meta.url).href,
  new URL('../../../biba/no-padding/128px/white/2-items/book.png', import.meta.url).href,
  new URL('../../../biba/no-padding/128px/white/9-media/volume.png', import.meta.url).href,
  new URL('../../../biba/no-padding/128px/white/9-media/mute.png', import.meta.url).href,
];

const makerUrls = [
  new URL('./ui-assets/honey-wave.webp', import.meta.url).href,
  new URL('../../../biba/no-padding/128px/white/6-buildings/house.png', import.meta.url).href,
  new URL('../../../biba/no-padding/128px/white/8-ui/save.png', import.meta.url).href,
  new URL('../../../biba/no-padding/128px/white/10-editing/brush.png', import.meta.url).href,
  new URL('../../../biba/no-padding/128px/white/10-editing/eraser.png', import.meta.url).href,
  new URL('../../../biba/no-padding/128px/white/10-editing/undo.png', import.meta.url).href,
];

const decodeImage = async (url: string): Promise<void> => {
  const image = new Image();
  image.src = url;
  await image.decode();
  if (!image.naturalWidth || !image.naturalHeight) throw new Error(`Empty UI image: ${url}`);
};

let libraryPreload: Promise<boolean> | null = null;
let makerPreload: Promise<boolean> | null = null;

const preload = (urls: readonly string[], scope: 'library' | 'maker'): Promise<boolean> =>
  Promise.all(urls.map(decodeImage))
    .then(() => true)
    .catch((error: unknown) => {
      console.warn(`[squishy:jelly-ui] ${scope} image preload failed; CSS/native controls remain usable.`, error);
      return false;
    });

/** First-frame Library chrome only. */
export const preloadJellyUi = (): Promise<boolean> => {
  libraryPreload ??= preload(libraryUrls, 'library');
  return libraryPreload;
};

/** Maker-only art; call from the same lazy/idle path as Phaser. */
export const preloadMakerJellyUi = (): Promise<boolean> => {
  if (!makerPreload) {
    makerPreload = preload(makerUrls, 'maker').then((ready) => {
      // A failed idle warmup should not permanently disable authored maker
      // icons; the first real maker entry gets one clean retry.
      if (!ready) makerPreload = null;
      return ready;
    });
  }
  return makerPreload;
};
