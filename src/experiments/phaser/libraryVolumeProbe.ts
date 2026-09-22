/** Isolated visual experiment. Enabled only via ?volume-probe=1 on Phaser Pages. */
import { createShapeField, getShape, type ShapeId } from '../../game/shapes';
import { getMaterial, getPalette } from '../../game/content';
import { encodeAppearancePoints, replayAppearanceDocument } from '../../sandbox/appearance';
import { drawAccessoryGraphic, getDecorFrame, renderSurfaceDecor } from '../../sandbox/decor';
import { renderLibraryThumbnail } from '../../sandbox/libraryThumbnail';
import type { SavedSquishy } from '../../sandbox/types';
import { renderVolumeThickness } from './libraryVolumeThickness';

const SIZE = 512;
const FIELD_SIZE = 256;
// The former .22 range saturated throughout the body's interior, producing a
// hard fake bevel and a flat central decal. Preserve signed distance across it.
const FIELD_RANGE = 0.85;
const SIDE_DEPTH_PX = 7;
const SHAPES: readonly ShapeId[] = ['soft-square', 'heart', 'paw'];
const palette = getPalette('milk');
const clamp = (n: number, a = 0, b = 1): number => Math.max(a, Math.min(b, n));
const fields = new Map<ShapeId, Uint8Array>();

/** Bilinear rather than nearest SDF fetch: 512px edges must not inherit a 256px stair-step. */
const sampleField = (field: Uint8Array, u: number, v: number): number => {
  const fx = clamp(u) * FIELD_SIZE - 0.5;
  const fy = clamp(v) * FIELD_SIZE - 0.5;
  const x0 = Math.max(0, Math.min(FIELD_SIZE - 1, Math.floor(fx)));
  const y0 = Math.max(0, Math.min(FIELD_SIZE - 1, Math.floor(fy)));
  const x1 = Math.min(FIELD_SIZE - 1, x0 + 1);
  const y1 = Math.min(FIELD_SIZE - 1, y0 + 1);
  const tx = clamp(fx - x0);
  const ty = clamp(fy - y0);
  const row0 = y0 * FIELD_SIZE;
  const row1 = y1 * FIELD_SIZE;
  const top = field[row0 + x0]! * (1 - tx) + field[row0 + x1]! * tx;
  const bottom = field[row1 + x0]! * (1 - tx) + field[row1 + x1]! * tx;
  return (top * (1 - ty) + bottom * ty) / 255;
};

const createToy = (shapeId: ShapeId): SavedSquishy => ({
  id: 'volume-probe-fixed-toy',
  createdAt: 0,
  shapeId,
  materialId: 'soft',
  appearance: {
    v: 1,
    strokes: [{
      m: 0,
      c: 0xff9cb3,
      s: 57,
      p: encodeAppearancePoints([{ u: 0.27, v: 0.37 }, { u: 0.39, v: 0.34 }, { u: 0.54, v: 0.32 }, { u: 0.65, v: 0.38 }]),
    }],
    mixins: [],
  },
  decor: { v: 1, eyes: 'dot', mouth: 'smile', blush: true, stickers: [{ t: 1, x: 69, y: 119, s: 48, r: 0 }], accessory: 'bow' },
});

const makeCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  return canvas;
};

/** Both high-res controls share exact paint/decor and contour; only relief lighting differs. */
export const renderVolumeControl = (toy: SavedSquishy, relief: boolean): HTMLCanvasElement => {
  const body = makeCanvas();
  const pixelsContext = body.getContext('2d', { willReadFrequently: true });
  if (!pixelsContext) throw new Error('Canvas2D unavailable for volume probe');
  const image = pixelsContext.createImageData(SIZE, SIZE);
  const appearance = makeCanvas();
  const appearanceContext = appearance.getContext('2d', { willReadFrequently: true });
  if (!appearanceContext) throw new Error('Appearance canvas unavailable for volume probe');
  appearanceContext.setTransform(2, 0, 0, 2, 0, 0);
  replayAppearanceDocument(appearanceContext, toy.appearance);
  renderSurfaceDecor(appearanceContext, toy.decor, getShape(toy.shapeId));
  const painted = appearanceContext.getImageData(0, 0, SIZE, SIZE).data;
  let field = fields.get(toy.shapeId);
  if (!field) {
    field = createShapeField(getShape(toy.shapeId), FIELD_SIZE, FIELD_RANGE);
    fields.set(toy.shapeId, field);
  }
  const material = getMaterial(toy.materialId);
  const halfX = SIZE * 0.5 * 0.80 * 1.075;
  const halfY = SIZE * 0.5 * 0.80 * 0.905;
  const cy = SIZE * 0.5 + SIZE * 0.5 * 0.80 * 0.018;
  // A wider derivative baseline damps 8-bit field quantization without blurring paint.
  const delta = 4 / FIELD_SIZE;
  const lightX = -0.44, lightY = -0.40, lightZ = 0.81;
  const lightLen = Math.hypot(lightX, lightY, lightZ);
  const light = [lightX / lightLen, lightY / lightLen, lightZ / lightLen] as const;
  const half = [-0.25, -0.23, 0.94] as const;
  const color = image.data;

  for (let y = 0; y < SIZE; y += 1) {
    const v = 0.5 - (y + 0.5 - cy) / (2 * halfY);
    if (v < 0 || v > 1) continue;
    const highMix = clamp(v);
    for (let x = 0; x < SIZE; x += 1) {
      const u = 0.5 + (x + 0.5 - SIZE * 0.5) / (2 * halfX);
      if (u < 0 || u > 1) continue;
      const signed = sampleField(field, u, v);
      const distance = (0.5 - signed) * FIELD_RANGE * 2;
      const alpha = clamp(distance * Math.min(halfX, halfY) + 0.5);
      if (alpha <= 0) continue;
      const pixel = (y * SIZE + x) * 4;
      const paintedAlpha = painted[pixel + 3]! / 255;
      let shading = 1;
      let gloss = 0;
      if (relief) {
        // A broad rounded front surface: the earlier SDF saturated at 0.22 and
        // switched abruptly from a dark bevel to a white flat square.
        const dx = sampleField(field, u + delta, v) - sampleField(field, u - delta, v);
        const dy = sampleField(field, u, v + delta) - sampleField(field, u, v - delta);
        const length = Math.hypot(dx, dy);
        const radius = clamp(distance / 0.54);
        const side = length > 1e-5 ? 0.66 * Math.pow(1 - radius, 0.73) : 0;
        const nx = length > 1e-5 ? dx / length * side : 0;
        const ny = length > 1e-5 ? -dy / length * side : 0;
        const nz = Math.sqrt(Math.max(0, 1 - side * side));
        const diffuse = Math.max(0, nx * light[0] + ny * light[1] + nz * light[2]);
        shading = 0.65 + 0.44 * diffuse;
        // Soft matte gel: specular adds a highlight, not a white clipped border.
        gloss = Math.pow(Math.max(0, nx * half[0] + ny * half[1] + nz * half[2]),
          12 + material.roughness * 14) * 0.055;
      } else {
        // Sharper raster CONTROL, intentionally not a claimed shader-parity render.
        shading = 0.92 + 0.09 * highMix - 0.09 * clamp(distance / 0.095, 0, 1) * 0.14;
      }
      for (let channel = 0; channel < 3; channel += 1) {
        const base = (palette.low[channel]! * (1 - highMix) + palette.high[channel]! * highMix) * 255;
        const decorated = base * (1 - paintedAlpha) + painted[pixel + channel]! * paintedAlpha;
        color[pixel + channel] = Math.round(clamp(decorated * shading + gloss * 255, 0, 255));
      }
      color[pixel + 3] = Math.round(alpha * 255);
    }
  }
  pixelsContext.putImageData(image, 0, 0);
  const output = makeCanvas();
  const context = output.getContext('2d');
  if (!context) throw new Error('Volume output canvas unavailable');
  if (relief) {
    const bodyPath = new Path2D();
    getShape(toy.shapeId).boundary.forEach((point, i) => {
      const x = SIZE * 0.5 + point.x * halfX;
      const y = cy - point.y * halfY;
      if (i === 0) bodyPath.moveTo(x, y);
      else bodyPath.lineTo(x, y);
    });
    bodyPath.closePath();
    context.save();
    context.shadowColor = 'rgba(87, 52, 34, 0.19)';
    context.shadowBlur = 10;
    context.shadowOffsetY = 5;
    context.translate(2, SIDE_DEPTH_PX);
    const side = context.createLinearGradient(0, 100, 0, 480);
    side.addColorStop(0, '#e2cba9');
    side.addColorStop(1, '#a98d72');
    context.fillStyle = side;
    context.fill(bodyPath);
    context.restore();
  }
  if (toy.decor.accessory) {
    // Same anchor math as the existing Library renderer, but rasterized at 2x.
    const frame = getDecorFrame(getShape(toy.shapeId), toy.decor.accessory);
    const localX = frame.headAnchor.u * 2 - 1;
    const localY = (frame.headAnchor.v + frame.headSeatOffsetV) * 2 - 1;
    const anchorX = 128 + localX * 98;
    const anchorY = 128 - localY * 98;
    const accessory = document.createElement('canvas');
    accessory.width = 360;
    accessory.height = 240;
    const accessoryContext = accessory.getContext('2d');
    if (accessoryContext) {
      accessoryContext.setTransform(2, 0, 0, 2, 0, 0);
      drawAccessoryGraphic(accessoryContext, toy.decor.accessory, 180, 120, toy.shapeId);
      context.drawImage(accessory, (anchorX - 56) * 2, (anchorY - 67.5) * 2, 224, 150);
    }
  }
  context.drawImage(body, 0, 0);
  output.dataset.volumeRenderer = relief ? 'sdf-relief-512' : 'flat-control-512';
  return output;
};

/** No persist, no new game renderer, no default visual change. Remove the query to close. */
export const mountLibraryVolumeProbe = (): void => {
  if (new URLSearchParams(location.search).get('volume-probe') !== '1') return;
  const overlay = document.createElement('section');
  overlay.id = 'library-volume-probe';
  overlay.setAttribute('aria-label', 'Squishy volume comparison');
  overlay.innerHTML = `<style>
#library-volume-probe { position:fixed;inset:0;z-index:2147483647;overflow:auto;background:#f1dfcf;color:#4c3049;font:16px system-ui,sans-serif;padding:20px;box-sizing:border-box }
#library-volume-probe * { box-sizing:border-box }
#library-volume-probe .probe-bar { display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;max-width:1200px;margin:0 auto 20px }
#library-volume-probe h1 {font-size:clamp(20px,3vw,30px);margin:0}
#library-volume-probe .probe-grid {display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px;max-width:1200px;margin:auto}
#library-volume-probe article {padding:12px;background:#fff5e9;border-radius:16px;box-shadow:0 5px 20px #92674626;min-width:0}
#library-volume-probe article canvas {display:block;width:100%;max-width:340px;aspect-ratio:1;margin:auto}
#library-volume-probe h2 {font-size:16px;margin:10px 0 5px}
#library-volume-probe p {font-size:13px;line-height:1.4;margin:5px 0}
#library-volume-probe button {padding:10px 14px;border:1px solid #b4888b;border-radius:10px;background:white;color:#4c3049;cursor:pointer}
#library-volume-probe button[aria-pressed=true] {background:#5d3b60;color:white}
#library-volume-probe .probe-shapes {display:flex;gap:6px;flex-wrap:wrap}
@media (max-width:720px) {#library-volume-probe .probe-grid {grid-template-columns:1fr}#library-volume-probe article canvas {width:min(100%,340px)}}
</style><header class="probe-bar"><h1>Squishy volume · same toy / same size</h1><div class="probe-shapes"><button type="button" data-shape="soft-square">Square</button><button type="button" data-shape="heart">Heart</button><button type="button" data-shape="paw">Paw</button></div><button type="button" data-close>Close lab</button></header><main class="probe-grid"><article data-variant="current"><h2>01 · Current Hall</h2><p>Real Studio WebGL shader; 256px source enlarged in CSS.</p></article><article data-variant="hires"><h2>02 · 512px flat control</h2><p>Fresh 512px silhouette, face and paint; simplified flat light, not shader parity.</p></article><article data-variant="relief"><h2>03 · 512px relief + thin sidewall</h2><p>Same high-res art, signed-distance normals and restrained directional light.</p></article><article data-variant="extruded"><h2>04 · 512px pseudo-extrusion</h2><p>Same high-res relief and saved art with visible side thickness. Static 2D prototype, not a 3D mesh.</p></article></main>`;
  document.body.append(overlay);
  const draw = (shapeId: ShapeId): void => {
    const toy = createToy(shapeId);
    const current = document.createElement('canvas');
    renderLibraryThumbnail(current, toy);
    current.dataset.volumeRenderer = 'studio-shader-256';
    const flat = renderVolumeControl(toy, false);
    const relief = renderVolumeControl(toy, true);
    const extruded = renderVolumeThickness(toy, relief);
    const variants = [current, flat, relief, extruded];
    for (const [index, key] of ['current', 'hires', 'relief', 'extruded'].entries()) {
      const article = overlay.querySelector<HTMLElement>(`[data-variant="${key}"]`);
      article?.querySelector('canvas')?.remove();
      article?.insertBefore(variants[index]!, article.querySelector('h2'));
    }
    for (const button of overlay.querySelectorAll<HTMLButtonElement>('[data-shape]')) {
      button.setAttribute('aria-pressed', String(button.dataset.shape === shapeId));
    }
  };
  overlay.addEventListener('click', event => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('[data-close]')) {
      overlay.remove();
      const url = new URL(location.href);
      url.searchParams.delete('volume-probe');
      history.replaceState(history.state, '', url);
      return;
    }
    const value = target.closest<HTMLButtonElement>('[data-shape]')?.dataset.shape;
    if (value && SHAPES.some(shape => shape === value)) draw(value as ShapeId);
  });
  draw('soft-square');
};
