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

const PER_ROOM = 2;
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
  let room = 0;
  let lastCount: number | null = null;
  let currentShell: HTMLElement | null = null;

  const displayRoom = (): void => {
    const shell = currentShell;
    if (!shell?.isConnected) return;
    const cards = [...shell.querySelectorAll<HTMLElement>('.sandbox-library-card[data-library-toy]')];
    const count = cards.length;
    const pages = Math.max(1, Math.ceil(count / PER_ROOM));
    room = Math.max(0, Math.min(room, pages - 1));
    cards.forEach((card, index) => { card.hidden = Math.floor(index / PER_ROOM) !== room; });
    const grid = shell.querySelector<HTMLElement>('.library-hall-stage .sandbox-library-grid');
    if (!grid) return;
    grid.querySelectorAll('.library-hall-vacant').forEach((item) => item.remove());
    for (let slot = count - room * PER_ROOM; slot < PER_ROOM; slot += 1) {
      const stand = document.createElement('div');
      stand.className = 'library-hall-vacant';
      stand.setAttribute('aria-hidden', 'true');
      grid.append(stand);
    }
    const nav = shell.querySelector<HTMLElement>('.library-hall-nav');
    const prev = shell.querySelector<HTMLButtonElement>('[data-library-hall-prev]');
    const next = shell.querySelector<HTMLButtonElement>('[data-library-hall-next]');
    const counter = shell.querySelector<HTMLOutputElement>('[data-library-hall-page]');
    nav?.toggleAttribute('data-single-room', pages === 1);
    if (prev) prev.disabled = room === 0;
    if (next) next.disabled = room === pages - 1;
    if (counter) counter.textContent = `${room + 1} / ${pages}`;
    shell.dataset.libraryHallRoom = String(room + 1);
    shell.dataset.libraryHallRooms = String(pages);
  };

  const decorate = (): void => {
    if (disposed) return;
    if (!ready) {
      ensureAssets();
      return;
    }
    const shell = root.querySelector<HTMLElement>('[data-sandbox-library]');
    if (!shell || shell.dataset.libraryHallMounted === 'true') return;
    const count = Number(shell.dataset.libraryCount ?? 0);
    if (lastCount !== null && count > lastCount) room = Math.floor((count - 1) / PER_ROOM);
    lastCount = count;
    shell.dataset.libraryHallMounted = 'true';
    shell.classList.add('is-library-hall');
    shell.dataset.libraryHallArt = 'owner-library-223c843';
    currentShell = shell;

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

    const grid = shell.querySelector<HTMLElement>('.sandbox-library-grid') ?? document.createElement('section');
    grid.classList.add('sandbox-library-grid');
    if (!grid.hasAttribute('aria-label')) grid.setAttribute('aria-label', shell.querySelector('h1')?.textContent ?? 'Collection');
    grid.querySelector('.sandbox-library-add-card')?.remove();
    const stage = document.createElement('section');
    stage.className = 'library-hall-stage';
    stage.dataset.libraryHallStage = '';
    const ru = /^ru\b/i.test(document.documentElement.lang || navigator.language);
    stage.append(grid);
    const nav = document.createElement('nav');
    nav.className = 'library-hall-nav';
    nav.setAttribute('aria-label', ru ? 'Переключение залов' : 'Collection rooms');
    nav.innerHTML = `<button type="button" data-library-hall-prev aria-label="${ru ? 'Предыдущий зал' : 'Previous room'}">‹</button><output data-library-hall-page aria-live="polite">1 / 1</output><button type="button" data-library-hall-next aria-label="${ru ? 'Следующий зал' : 'Next room'}">›</button>`;
    stage.append(nav);
    shell.querySelector('.sandbox-library-heading')?.after(stage);
    displayRoom();
  };

  const observer = new MutationObserver(decorate);
  observer.observe(root, { childList: true, subtree: true });
  const handleClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-library-hall-prev], [data-library-hall-next]') : null;
    if (!target || target.disabled || !currentShell?.isConnected || currentShell.classList.contains('is-blocked')) return;
    room += target.hasAttribute('data-library-hall-next') ? 1 : -1;
    displayRoom();
  };
  root.addEventListener('click', handleClick, { capture: true });

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
    root.removeEventListener('click', handleClick, true);
    currentShell = null;
  };
};
