import './libraryHallPreview.css';

// The six room pieces and ground shadow are derived from owner's 223c843 PNGs.
// Floor uses the independent pinned Sep 21 parquet PNG export. Keep both
// sets of original sources and their verification manifests unchanged.
const art = {
  wall: new URL('./library-assets/wall.webp', import.meta.url).href,
  floor: new URL('./library-assets/floor-tile.webp', import.meta.url).href,
  pedestal: new URL('./library-assets/pedestal.webp', import.meta.url).href,
  cabinet: new URL('./library-assets/cabinet.webp', import.meta.url).href,
  shelf: new URL('./library-assets/shelf.webp', import.meta.url).href,
  plant: new URL('./library-assets/plant.webp', import.meta.url).href,
  groundShadow: new URL('./library-assets/ground-shadow.webp', import.meta.url).href,
} as const;

const decodedArt = new Map<string, string>();
const retainedImages = new Map<string, HTMLImageElement>();
const decode = async (url: string): Promise<void> => {
  const image = new Image();
  image.src = url;
  await image.decode();
  if (!image.naturalWidth || !image.naturalHeight) throw new Error(`Empty Library image: ${url}`);
  retainedImages.set(url, image);
  // Furniture and podiums must not start a second CSS request after readiness.
  // Keep decoded pixels for the room; source files and their provenance stay intact.
  if ([art.cabinet, art.shelf, art.plant, art.pedestal].includes(url)) {
    const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    canvas.getContext('2d')!.drawImage(image, 0, 0);
    decodedArt.set(url, canvas.toDataURL('image/png'));
  }
};

let hallAssetsReady: Promise<void> | null = null;
export const preloadLibraryHallAssets = (): Promise<void> => {
  hallAssetsReady ??= Promise.all(Object.values(art).map(decode)).then(() => undefined).catch((error: unknown) => {
    hallAssetsReady = null;
    throw error;
  });
  return hallAssetsReady;
};

/** Mount the accepted Hall profile used by production, review Pages and isolated Yandex DRAFT. */
export const mountLibraryHallPreview = (root: HTMLElement): (() => void) => {
  let disposed = false;
  let ready = false;
  let assetLoad: Promise<void> | null = null;
  let assetRetryCount = 0;
  let assetRetryTimer = 0;
  let frame = 0;
  const geometry = new ResizeObserver(() => schedule());
  let observed: Element | null = null;
  const sync = (): void => {
    frame = 0;
    const bench = root.querySelector<HTMLElement>('.library-showcase-workbench');
    const display = bench?.querySelector<HTMLElement>('[data-library-display-host]');
    if (!bench || !display) return;
    if (observed !== display) { geometry.disconnect(); geometry.observe(display); geometry.observe(bench); observed = display; }
    const hr = display.getBoundingClientRect(), br = bench.getBoundingClientRect();
    if (!hr.width || !hr.height) return;
    const stageHeight = Math.max(0, hr.height - 52);
    const radius = Math.min(hr.width * .8, stageHeight * 1.2, 440) * .34;
    const top = hr.top - br.top + stageHeight * .5 + radius * .76;
    bench.style.setProperty('--library-table-top', `${top}px`);
    const room = bench.closest<HTMLElement>('.room-library');
    const podium = bench.querySelector<HTMLElement>('.library-showcase-table');
    if (room && podium) {
      // The back wall meets the floor behind the whole stand, not at its foot.
      const pr = podium.getBoundingClientRect();
      bench.style.setProperty('--room-podium-foot', `${pr.bottom - br.top}px`);
      bench.style.setProperty('--room-podium-width', `${pr.width}px`);
      bench.style.setProperty('--room-podium-label-y', `${pr.top - br.top + pr.height * .635}px`);
      bench.style.setProperty('--room-podium-floor-center', `${pr.top - br.top + pr.height * .85}px`);
      const floorTop = pr.top - room.getBoundingClientRect().top - 28;
      room.style.setProperty('--room-floor-top', `${floorTop}px`);
    }
    bench.dataset.libraryTableReady = 'true';
  };
  const schedule = (): void => { if (!disposed && !frame) frame = requestAnimationFrame(sync); };
  const decorate = (): void => {
    schedule();
    if (disposed) return;
    if (!ready) {
      ensureAssets();
      return;
    }
    const shell = root.querySelector<HTMLElement>('[data-sandbox-library]');
    if (!shell || shell.dataset.libraryHallMounted === 'true') return;
    shell.dataset.libraryHallMounted = 'true';
    shell.classList.add('is-library-hall');
    shell.dataset.libraryHallArt = 'owner-library-223c843';

    const scene = document.createElement('div');
    scene.className = 'library-hall-scene';
    scene.setAttribute('aria-hidden', 'true');
    scene.innerHTML = `<div class="library-hall-scene__wall"></div><div class="library-hall-scene__floor"></div><div class="library-hall-scene__cabinet"></div><div class="library-hall-scene__shelf"></div><div class="library-hall-scene__plant"></div>`;
    scene.style.setProperty('--hall-wall', `url("${art.wall}")`);
    scene.style.setProperty('--hall-floor', `url("${art.floor}")`);
    scene.style.setProperty('--hall-cabinet', `url("${decodedArt.get(art.cabinet) ?? art.cabinet}")`);
    scene.style.setProperty('--hall-shelf', `url("${decodedArt.get(art.shelf) ?? art.shelf}")`);
    scene.style.setProperty('--hall-plant', `url("${decodedArt.get(art.plant) ?? art.plant}")`);
    shell.style.setProperty('--hall-pedestal', `url("${decodedArt.get(art.pedestal) ?? art.pedestal}")`);
    shell.style.setProperty('--hall-ground-shadow', `url("${art.groundShadow}")`);
    shell.prepend(scene);

  };

  const observer = new MutationObserver(decorate);
  observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-phaser-ready', 'data-stage'] });

  const ensureAssets = (): void => {
    if (disposed || ready || assetLoad) return;
    assetLoad = preloadLibraryHallAssets()
      .then(() => {
        if (disposed) return;
        ready = true;
        decorate();
      })
      .catch((error: unknown) => {
        if (disposed) return;
        console.warn('[squishy:library-hall] Art decode failed; keeping the original Library grid until a later retry.', error);
        if (assetRetryCount < 3 && root.querySelector('[data-sandbox-library]')) {
          assetRetryCount += 1;
          assetRetryTimer = globalThis.setTimeout(() => {
            assetRetryTimer = 0;
            ensureAssets();
          }, 900 * assetRetryCount);
        }
      })
      .finally(() => {
        assetLoad = null;
      });
  };
  ensureAssets();

  return () => {
    disposed = true;
    if (assetRetryTimer) globalThis.clearTimeout(assetRetryTimer);
    observer.disconnect();
    geometry.disconnect();
    if (frame) cancelAnimationFrame(frame);
  };
};
