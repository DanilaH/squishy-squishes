import './studioEnvironmentPreview.css';

// Isolated Pages-only visual experiment. The gameplay canvas and hit targets are untouched.
const assets = {
  wall: new URL('./studio-assets/studio-wall.png', import.meta.url).href,
  floor: new URL('./studio-assets/studio-floor.png', import.meta.url).href,
  left: new URL('./studio-assets/studio-desk-left.png', import.meta.url).href,
  middle: new URL('./studio-assets/studio-desk-middle.png', import.meta.url).href,
  right: new URL('./studio-assets/studio-desk-right.png', import.meta.url).href,
  decorLeft: new URL('./studio-assets/studio-decor-left.png', import.meta.url).href,
  decorRight: new URL('./studio-assets/studio-decor-right.png', import.meta.url).href,
} as const;

const loadImage = async (src: string): Promise<HTMLImageElement> => {
  const image = new Image();
  image.src = src;
  await image.decode();
  if (!image.naturalWidth || !image.naturalHeight) throw new Error(`Unable to decode ${src}`);
  return image;
};

// The source has matching edge pixels, but three independently scaled DOM layers
// create visible seams at fractional CSS widths/DPR. Compose at *integer source*
// coordinates and scale the resulting single image only once in the browser.
// The existing layout always uses the original 421:435:381 proportions, so the
// middle does not need to be repeated for the current Studio composition.
const composeDesk = (left: HTMLImageElement, middle: HTMLImageElement, right: HTMLImageElement): string => {
  if (left.naturalHeight !== middle.naturalHeight || middle.naturalHeight !== right.naturalHeight) {
    throw new Error('Studio desk slices have different heights');
  }
  const canvas = document.createElement('canvas');
  canvas.width = left.naturalWidth + middle.naturalWidth + right.naturalWidth;
  canvas.height = middle.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to compose Studio desk');
  context.drawImage(left, 0, 0);
  context.drawImage(middle, left.naturalWidth, 0);
  context.drawImage(right, left.naturalWidth + middle.naturalWidth, 0);
  return canvas.toDataURL('image/png');
};

const element = (tag: 'div' | 'img', className: string): HTMLDivElement | HTMLImageElement => {
  const node = document.createElement(tag);
  node.className = className;
  node.setAttribute('aria-hidden', 'true');
  if (node instanceof HTMLImageElement) node.draggable = false;
  return node;
};

/** Returns cleanup; never mutates non-Shape/Paint gameplay, storage, or main/Yandex entrypoints. */
export const mountStudioEnvironmentPreview = (root: HTMLElement): (() => void) => {
  let disposed = false;
  let decoded = false;
  let deskTexture: string | null = null;
  let frame = 0;
  const abort = new AbortController();
  const observer = new MutationObserver(() => schedule());
  // The real stage changes height AFTER its data-stage mutation (notably on wide Paint).
  // Observing layout keeps the floor and desk aligned without moving gameplay/UI.
  const geometryObserver = new ResizeObserver(() => schedule());
  let observedStage: HTMLElement | null = null;
  let observedCanvas: HTMLElement | null = null;
  let observedControls: HTMLElement | null = null;
  let observedHeading: HTMLElement | null = null;

  const sync = (): void => {
    if (disposed || !decoded || !deskTexture) return;
    const shell = root.querySelector<HTMLElement>('.sandbox-shell');
    if (!shell) return;
    const supported = shell.dataset.stage === 'shape' || shell.dataset.stage === 'paint';
    if (!supported) {
      geometryObserver.disconnect();
      observedStage = observedCanvas = observedControls = observedHeading = null;
      shell.classList.remove('studio-env-active');
      shell.querySelector('.studio-env-floor')?.remove();
      shell.querySelector('.studio-env-stage-art')?.remove();
      return;
    }
    const stage = shell.querySelector<HTMLElement>('.sandbox-stage');
    const canvas = stage?.querySelector<HTMLElement>('[data-sandbox-canvas]');
    const controls = shell.querySelector<HTMLElement>('.sandbox-controls');
    const heading = shell.querySelector<HTMLElement>('.sandbox-copy');
    if (!stage || !canvas || !controls) return;
    if (stage !== observedStage || canvas !== observedCanvas || controls !== observedControls || heading !== observedHeading) {
      geometryObserver.disconnect();
      for (const node of [stage, canvas, controls, heading]) if (node) geometryObserver.observe(node);
      observedStage = stage;
      observedCanvas = canvas;
      observedControls = controls;
      observedHeading = heading;
    }
    shell.classList.add('studio-env-active');
    let floor = shell.querySelector<HTMLElement>('.studio-env-floor');
    if (!floor) {
      floor = element('div', 'studio-env-floor') as HTMLDivElement;
      shell.insertBefore(floor, shell.firstChild);
    }
    let art = stage.querySelector<HTMLElement>('.studio-env-stage-art');
    if (!art) {
      art = element('div', 'studio-env-stage-art') as HTMLDivElement;
      const leftDecor = element('img', 'studio-env-decor studio-env-decor--left') as HTMLImageElement;
      leftDecor.src = assets.decorLeft;
      const rightDecor = element('img', 'studio-env-decor studio-env-decor--right') as HTMLImageElement;
      rightDecor.src = assets.decorRight;
      const desk = element('img', 'studio-env-desk') as HTMLImageElement;
      desk.dataset.studioDesk = '';
      desk.src = deskTexture;
      art.append(leftDecor, rightDecor, desk);
      stage.insertBefore(art, stage.firstChild);
    }
    const sr = stage.getBoundingClientRect();
    const cr = canvas.getBoundingClientRect();
    const pr = controls.getBoundingClientRect();
    // Based on real Gate 1 DOM geometry, not a guessed illustrated room.
    // 80% of canvas is only a proxy for the toy's lower silhouette, not a physics bound.
    const toyBottomProxy = cr.top + cr.height * 0.8;
    const top = Math.min(toyBottomProxy - 3, sr.bottom - 3);
    const visibleDepth = Math.max(0, Math.min(sr.bottom, pr.top - 8) - top);
    const landscapeShort = innerWidth > innerHeight && innerHeight <= 520;
    const desk = art.querySelector<HTMLElement>('[data-studio-desk]');
    if (!desk) return;
    // At 1280x800 Shape only a shallow tabletop fits. Clip its legs inside
    // the existing stage rather than removing the workbench entirely.
    const showDesk = !landscapeShort && visibleDepth >= 16;
    const scaleWidth = Math.min(innerWidth * 1.14, cr.width * 1.83);
    const imageHeight = scaleWidth * 435 / (421 + 435 + 381);
    const snap = (n: number): number => Math.round(n * devicePixelRatio) / devicePixelRatio;
    desk.style.display = showDesk ? 'block' : 'none';
    desk.style.top = `${snap(top - sr.top)}px`;
    desk.style.width = `${snap(scaleWidth)}px`;
    desk.style.height = `${snap(imageHeight)}px`;
    floor.style.top = `${snap(sr.bottom - shell.getBoundingClientRect().top - 22)}px`;
    shell.dataset.studioDeskVisible = String(showDesk);
    shell.dataset.studioDeskDepth = String(Math.round(visibleDepth));
    shell.dataset.studioDeskTop = String(snap(top));
  };

  const schedule = (): void => {
    if (disposed || !decoded || frame) return;
    frame = requestAnimationFrame(() => { frame = 0; sync(); });
  };

  observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-stage'] });
  window.addEventListener('resize', schedule, { signal: abort.signal });
  void Promise.all(Object.values(assets).map(loadImage)).then((images) => {
    if (disposed) return;
    deskTexture = composeDesk(images[2], images[3], images[4]);
    decoded = true;
    root.dataset.studioEnvReady = '';
    schedule();
  }).catch((error: unknown) => {
    console.warn('[squishy:studio-preview] Environment assets failed to decode or compose; original UI retained.', error);
  });

  return () => {
    disposed = true;
    abort.abort();
    observer.disconnect();
    geometryObserver.disconnect();
    if (frame) cancelAnimationFrame(frame);
    root.querySelectorAll('.studio-env-floor, .studio-env-stage-art').forEach((node) => node.remove());
    root.querySelectorAll('.studio-env-active').forEach((node) => node.classList.remove('studio-env-active'));
    delete root.dataset.studioEnvReady;
  };
};
