import { type ShapeId } from '../../game/shapes';
import { encodeAppearancePoints } from '../../sandbox/appearance';
import { renderLibraryThumbnail } from '../../sandbox/libraryThumbnail';
import type { SavedSquishy } from '../../sandbox/types';
import { renderVolumeControl } from './libraryVolumeProbe';
import { renderVolumeThickness } from './libraryVolumeThickness';
import { releaseVolumeMesh, renderVolumeMesh } from './libraryVolumeMesh';
import { releaseVolumeFieldMesh, renderVolumeFieldMesh } from './libraryVolumeFieldMesh';

/** The review uses real V3-format appearance and decor but never reads or writes
 * player storage. No alternative render is installed in the regular Hall. */
const SHAPES: readonly ShapeId[] = ['soft-square', 'heart', 'paw'];
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
</style><header class="probe-bar"><h1>Squishy volume · identical toy / identical size</h1><div class="probe-shapes"><button type="button" data-shape="soft-square">Square</button><button type="button" data-shape="heart">Heart</button><button type="button" data-shape="paw">Paw</button></div><button type="button" data-legacy aria-pressed="false">Compare old 256px</button><button type="button" data-close>Close lab</button></header><p class="probe-note">01 is the current Hall shader (512px); old 256px is only a diagnostic. 02–04 are Canvas2D controls. 05–06 use a radial 3D mesh (flat or Studio texture). 07 uses a locally inflated height-field 3D surface with the real Studio texture; compare concave heart and paw contours. All are static lab-only specimens, not a Hall replacement.</p><main class="probe-grid"><article data-variant="current"><h2>01 · Actual Hall · Studio 512px</h2><p>Same static 512px WebGL snapshot used by the current Pages Library.</p></article><article data-variant="hires"><h2>02 · Flat Canvas · 512px</h2><p>Separate high-resolution silhouette and saved art, deliberately simplified light.</p></article><article data-variant="relief"><h2>03 · Relief · 512px</h2><p>Same Canvas art with SDF-derived surface normals and directional lighting.</p></article><article data-variant="extruded"><h2>04 · Contour thickness · 512px</h2><p>Same relief front with contour-facing 2.5D sidewalls. Not a 3D mesh.</p></article><article data-variant="mesh"><h2>05 · Radial mesh · flat texture</h2><p>Curved 3D body with simplified flat front; concave shapes can pinch.</p></article><article data-variant="mesh-studio"><h2>06 · Radial mesh · Studio texture</h2><p>Same radial geometry mapped with the actual Studio shader appearance.</p></article><article data-variant="mesh-field"><h2>07 · Local height-field mesh · Studio</h2><p>3D surface built from distance to the contour; localized bulges and notches, with the real Studio art.</p></article></main>`;
  document.body.append(overlay);
  let shape: ShapeId = 'soft-square';
  let showLegacy = false;
  const cleanup = (): void => { releaseVolumeMesh(); releaseVolumeFieldMesh(); };
  const onPageHide = (): void => cleanup();
  window.addEventListener('pagehide', onPageHide, { once: true });
  const draw = (): void => {
    const toy = makeToy(shape);
    const current = document.createElement('canvas');
    renderLibraryThumbnail(current, toy, showLegacy ? 256 : 512);
    current.dataset.volumeRenderer = showLegacy ? 'studio-shader-256' : 'studio-shader-512';
    // Even with the optional 256px diagnostic, the meshes always receive a
    // genuine 512px source. A blown-up 256px texture would falsify this trial.
    const source = showLegacy ? document.createElement('canvas') : current;
    if (showLegacy) renderLibraryThumbnail(source, toy, 512);
    const flat = renderVolumeControl(toy, false);
    const relief = renderVolumeControl(toy, true);
    const extruded = renderVolumeThickness(toy, relief);
    const mesh = renderVolumeMesh(toy, flat);
    const meshStudio = renderVolumeMesh(toy, source);
    if (meshStudio.dataset.volumeRenderer !== 'mesh-unavailable') meshStudio.dataset.volumeRenderer = 'studio-textured-mesh-512';
    const meshField = renderVolumeFieldMesh(toy, source);
    const variants = [current, flat, relief, extruded, mesh, meshStudio, meshField];
    for (const [index, key] of ['current', 'hires', 'relief', 'extruded', 'mesh', 'mesh-studio', 'mesh-field'].entries()) {
      const article = overlay.querySelector<HTMLElement>(`[data-variant="${key}"]`);
      article?.querySelector('canvas')?.remove();
      article?.insertBefore(variants[index]!, article.querySelector('h2'));
    }
    const title = overlay.querySelector('[data-variant="current"] h2');
    if (title) title.textContent = showLegacy ? '01 · Diagnostic Studio 256px' : '01 · Actual Hall · Studio 512px';
    for (const key of ['mesh', 'mesh-studio', 'mesh-field'] as const) {
      const specimen = overlay.querySelector(`[data-variant="${key}"] canvas`);
      const description = overlay.querySelector(`[data-variant="${key}"] p`);
      if (description && specimen instanceof HTMLCanvasElement && specimen.dataset.volumeRenderer?.includes('unavailable')) {
        description.textContent = 'WebGL2 unavailable: flat fallback only. This is NOT a 3D result.';
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
