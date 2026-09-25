/** Fifth comparison column: original and 512px REAL Studio shader, same saved V3 toy.
 * This file mounts exclusively inside the query-gated visual lab; it never
 * changes the regular Hall renderer or serialised user state. */
import type { ShapeId } from '../../game/shapes';
import { encodeAppearancePoints } from '../../sandbox/appearance';
import { renderLibraryThumbnail } from '../../sandbox/libraryThumbnail';
import type { SavedSquishy } from '../../sandbox/types';

const createIdenticalSample = (shapeId: ShapeId): SavedSquishy => ({
  id: 'volume-probe-fixed-toy',
  createdAt: 0,
  shapeId,
  materialId: 'soft',
  appearance: {
    v: 1,
    strokes: [{ m: 0, c: 0xff9cb3, s: 57,
      p: encodeAppearancePoints([{ u: 0.27, v: 0.37 }, { u: 0.39, v: 0.34 }, { u: 0.54, v: 0.32 }, { u: 0.65, v: 0.38 }]),
    }],
    mixins: [],
  },
  decor: { v: 1, eyes: 'dot', mouth: 'smile', blush: true, stickers: [{ t: 1, x: 69, y: 119, s: 48, r: 0 }], accessory: 'bow' },
});

export const mountTrueShaderComparison = (): void => {
  const overlay = document.querySelector<HTMLElement>('#library-volume-probe');
  const grid = overlay?.querySelector<HTMLElement>('.probe-grid');
  if (!overlay || !grid) return;
  // Ensure all FIVE cards use the same actual display dimensions on desktop.
  const extra = document.createElement('article');
  extra.dataset.variant = 'studio512';
  extra.innerHTML = '<h2>05 · Real Studio shader at 512px</h2><p>Exact current material, saved V3 paint, face and bow, rasterized at 2×. Compare directly with 01.</p>';
  grid.append(extra);
  const draw = (shapeId: ShapeId): void => {
    const canvas = document.createElement('canvas');
    renderLibraryThumbnail(canvas, createIdenticalSample(shapeId), 512);
    canvas.dataset.volumeRenderer = 'studio-shader-512';
    extra.querySelector('canvas')?.remove();
    extra.insertBefore(canvas, extra.querySelector('h2'));
  };
  overlay.addEventListener('click', event => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const shape = target.closest<HTMLButtonElement>('[data-shape]')?.dataset.shape;
    if (shape === 'soft-square' || shape === 'heart' || shape === 'paw') draw(shape);
  });
  draw('soft-square');
};
