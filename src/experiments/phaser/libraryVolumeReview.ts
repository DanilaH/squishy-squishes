import { type ShapeId } from '../../game/shapes';
import { encodeAppearancePoints } from '../../sandbox/appearance';
import { renderLibraryThumbnail } from '../../sandbox/libraryThumbnail';
import { renderStudioLibraryThumbnail } from '../../sandbox/libraryStudioThumbnail';
import type { SavedSquishy } from '../../sandbox/types';
import { renderNeutralVolumeAlbedo } from './libraryVolumeAlbedo';
import { renderVolumeControl } from './libraryVolumeProbe';
import { renderVolumeThickness } from './libraryVolumeThickness';
import { releaseVolumeMesh, renderVolumeMesh } from './libraryVolumeMesh';
import { releaseVolumeFieldMesh, renderVolumeFieldMesh } from './libraryVolumeFieldMesh';
import { releaseVolumeContourMesh, renderVolumeContourMesh } from './libraryVolumeContourMesh';

/** Only an isolated, disposable same-toy comparison: never read/write player saves. */
const SHAPES: readonly ShapeId[] = ['soft-square', 'heart', 'paw'];
const VARIANTS = ['current', 'hires', 'relief', 'extruded', 'mesh', 'mesh-studio', 'mesh-neutral', 'mesh-field', 'mesh-field-flat', 'mesh-contour'] as const;
const makeToy = (shapeId: ShapeId): SavedSquishy => ({
  id: 'review-only-same-toy', createdAt: 0, shapeId, materialId: 'soft',
  appearance: {
    v: 1,
    strokes: [{ m: 0, c: 0xff9cb3, s: 57, p: encodeAppearancePoints([
      { u: 0.27, v: 0.37 }, { u: 0.39, v: 0.34 },
      { u: 0.54, v: 0.32 }, { u: 0.65, v: 0.38 },
    ]) }],
    mixins: [],
  },
  decor: {
    v: 1, eyes: 'dot', mouth: 'smile', blush: true,
    stickers: [{ t: 1, x: 69, y: 119, s: 48, r: 0 }], accessory: 'bow',
  },
});

export const mountLibraryVolumeReview = (): void => {
  if (new URLSearchParams(location.search).get('volume-probe') !== '1') return;
  const overlay = document.createElement('section');
  overlay.id = 'library-volume-probe';
  overlay.setAttribute('aria-label', 'Squishy volume comparison');
  overlay.innerHTML = `<style>
#library-volume-probe {position:fixed;inset:0;z-index:2147483647;overflow:auto;background:#f1dfcf;color:#4c3049;font:16px system-ui,sans-serif;padding:20px;box-sizing:border-box}
#library-volume-probe * {box-sizing:border-box}
#library-volume-probe .probe-bar {display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;max-width:1420px;margin:0 auto 20px}
#library-volume-probe h1 {font-size:clamp(20px,3vw,29px);margin:0}
#library-volume-probe .probe-grid {display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;max-width:1420px;margin:auto}
#library-volume-probe article {padding:12px;background:#fff5e9;border-radius:16px;box-shadow:0 5px 20px #92674626;min-width:0}
#library-volume-probe article canvas {display:block;width:100%;max-width:330px;aspect-ratio:1;margin:auto}
#library-volume-probe h2 {font-size:16px;margin:10px 0 5px}
#library-volume-probe p {font-size:13px;line-height:1.4;margin:5px 0}
#library-volume-probe button {padding:10px 14px;border:1px solid #b4888b;border-radius:10px;background:white;color:#4c3049;cursor:pointer}
#library-volume-probe button[aria-pressed=true] {background:#5d3b60;color:white}
#library-volume-probe .probe-shapes {display:flex;gap:6px;flex-wrap:wrap}
#library-volume-probe .probe-note {max-width:1420px;margin:0 auto 14px;font-size:13px}
@media (max-width:1100px) {#library-volume-probe .probe-grid {grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:630px) {#library-volume-probe .probe-grid {grid-template-columns:1fr}#library-volume-probe article canvas {width:min(100%,330px)}}
</style><header class="probe-bar"><h1>Squishy volume · identical toy / identical size</h1><div class="probe-shapes"><button type="button" data-shape="soft-square">Square</button><button type="button" data-shape="heart">Heart</button><button type="button" data-shape="paw">Paw</button></div><button type="button" data-legacy aria-pressed="false">Compare old 256px</button><button type="button" data-close>Close lab</button></header><p class="probe-note">01 is the actual 512px Hall volume render; old 256px is diagnostic. 02–04 are Canvas2D controls. 05–07 use identical radial geometry with a flat gradient, baked Studio lighting and genuinely unlit saved-art albedo respectively. 08/09 use identical grid geometry, while 10 triangulates the actual contour. 07 is now the Pages Hall renderer; the other paths remain experimental.</p><main class="probe-grid"><article data-variant="current"><h2>01 · Actual Hall · Volume mesh 512px</h2><p>The static volume snapshot used by saved toys in the Pages Hall.</p></article><article data-variant="hires"><h2>02 · Flat Canvas · 512px</h2><p>Saved art with simplified light; not Studio parity.</p></article><article data-variant="relief"><h2>03 · Relief · 512px</h2><p>Canvas art with SDF normals and directional lighting.</p></article><article data-variant="extruded"><h2>04 · Contour thickness · 512px</h2><p>Contour-facing 2.5D sidewall, not geometry.</p></article><article data-variant="mesh"><h2>05 · Radial mesh · flat texture</h2><p>3D radial shape with a baked base gradient.</p></article><article data-variant="mesh-studio"><h2>06 · Radial mesh · Studio texture</h2><p>Exactly the same geometry with baked Studio lighting.</p></article><article data-variant="mesh-neutral"><h2>07 · Same radial mesh · unlit albedo</h2><p>Exactly the same geometry and GPU lighting, but the source contains no baked light. Saved paint, face and sticker remain.</p></article><article data-variant="mesh-field"><h2>08 · Grid height-field · Studio</h2><p>3D masked grid with baked Studio front.</p></article><article data-variant="mesh-field-flat"><h2>09 · Same grid height-field · flat</h2><p>Exactly the same grid geometry and shader as 08; flat saved-art source.</p></article><article data-variant="mesh-contour"><h2>10 · Exact contour mesh · flat</h2><p>Ear-clipped actual silhouette, subdivided inflated front, shared side boundary. No raster alpha cutout. Experimental.</p></article></main>`;
  document.body.append(overlay);
  let shape: ShapeId = 'soft-square';
  let showLegacy = false;
  const cleanup = (): void => { releaseVolumeMesh(); releaseVolumeFieldMesh(); releaseVolumeContourMesh(); };
  const onPageHide = (): void => cleanup();
  window.addEventListener('pagehide', onPageHide, { once: true });
  const draw = (): void => {
    const toy = makeToy(shape);
    const current = document.createElement('canvas');
    renderLibraryThumbnail(current, toy, showLegacy ? 256 : 512);
    current.dataset.volumeRenderer = showLegacy ? 'studio-shader-256' : 'volume-mesh-512';
    // Every mesh gets an independently genuine 512px source even in 256px mode.
    const studioSource = document.createElement('canvas');
  studioSource.width = 512;
  studioSource.height = 512;
  const studioContext = studioSource.getContext('2d');
  if (studioContext) {
    studioContext.setTransform(2, 0, 0, 2, 0, 0);
    renderStudioLibraryThumbnail(studioContext, toy, 512);
  }
    const flat = renderVolumeControl(toy, false);
    const relief = renderVolumeControl(toy, true);
    const extruded = renderVolumeThickness(toy, relief);
    const mesh = renderVolumeMesh(toy, flat);
    const meshStudio = renderVolumeMesh(toy, studioSource);
    if (meshStudio.dataset.volumeRenderer !== 'mesh-unavailable') meshStudio.dataset.volumeRenderer = 'studio-textured-mesh-512';
    const neutralAlbedo = renderNeutralVolumeAlbedo(toy);
    const meshNeutral = renderVolumeMesh(toy, neutralAlbedo);
    if (meshNeutral.dataset.volumeRenderer !== 'mesh-unavailable') meshNeutral.dataset.volumeRenderer = 'unlit-albedo-mesh-512';
    const meshField = renderVolumeFieldMesh(toy, studioSource);
    const meshFieldFlat = renderVolumeFieldMesh(toy, flat);
    if (meshFieldFlat.dataset.volumeRenderer !== 'field-mesh-unavailable') meshFieldFlat.dataset.volumeRenderer = 'sdf-field-flat-mesh-512';
    const contour = renderVolumeContourMesh(toy, flat);
    const canvases = [current, flat, relief, extruded, mesh, meshStudio, meshNeutral, meshField, meshFieldFlat, contour];
    for (const [index, key] of VARIANTS.entries()) {
      const article = overlay.querySelector<HTMLElement>(`[data-variant="${key}"]`);
      article?.querySelector('canvas')?.remove();
      article?.insertBefore(canvases[index]!, article.querySelector('h2'));
    }
    const title = overlay.querySelector('[data-variant="current"] h2');
    if (title) title.textContent = showLegacy ? '01 · Diagnostic Studio 256px' : '01 · Actual Hall · Volume mesh 512px';
    for (const key of ['mesh', 'mesh-studio', 'mesh-neutral', 'mesh-field', 'mesh-field-flat', 'mesh-contour'] as const) {
      const specimen = overlay.querySelector(`[data-variant="${key}"] canvas`);
      const description = overlay.querySelector(`[data-variant="${key}"] p`);
      if (description && specimen instanceof HTMLCanvasElement && specimen.dataset.volumeRenderer?.includes('unavailable')) {
        description.textContent = 'WebGL2 unavailable or invalid geometry: fallback only. This is NOT a 3D result.';
      }
    }
    for (const button of overlay.querySelectorAll<HTMLButtonElement>('[data-shape]')) {
      button.setAttribute('aria-pressed', String(button.dataset.shape === shape));
    }
    overlay.querySelector('[data-legacy]')?.setAttribute('aria-pressed', String(showLegacy));
  };
  overlay.addEventListener('click', event => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('[data-close]')) {
      cleanup();
      window.removeEventListener('pagehide', onPageHide);
      overlay.remove();
      const url = new URL(location.href);
      url.searchParams.delete('volume-probe');
      history.replaceState(history.state, '', url);
      return;
    }
    if (target.closest('[data-legacy]')) { showLegacy = !showLegacy; draw(); return; }
    const candidate = target.closest<HTMLButtonElement>('[data-shape]')?.dataset.shape;
    if (SHAPES.some(item => item === candidate)) { shape = candidate as ShapeId; draw(); }
  });
  draw();
};