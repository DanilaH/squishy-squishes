import manifest from './qualityArtManifest.json' with { type: 'json' };
import { resolveAuthoredImagePath } from '../app/runtimeAssets';

export type QualityArtId = keyof typeof manifest;
const images = new Map<QualityArtId, HTMLImageElement>();
let pending: Promise<void> | null = null;

/** All sample art is startup-required, since saved toys and catalogs share it. */
export function preloadQualityArt(): Promise<void> {
  pending ??= Promise.all((Object.keys(manifest) as QualityArtId[]).map(async id => {
    if (images.has(id)) return;
    const item = manifest[id];
    const fallback = `${import.meta.env.BASE_URL}assets/art-quality/${item.file}.webp`;
    try {
      const preferred = await resolveAuthoredImagePath(fallback, item.hasAvif);
      const image = new Image(); image.src = preferred;
      try { await image.decode(); }
      catch (error: unknown) { if (preferred === fallback) throw error; image.src = fallback; await image.decode(); }
      if (!image.naturalWidth) throw new Error('Empty quality art');
      images.set(id, image);
    } catch (error: unknown) {
      console.warn(`[squishy:quality-art] ${id} unavailable; retaining procedural fallback.`, error);
    }
  })).then(() => { if (images.size < Object.keys(manifest).length) pending = null; });
  return pending;
}

/** Fit measured source ink into the existing logical frame; never stretch it. */
export function drawQualityArt(ctx: CanvasRenderingContext2D, id: QualityArtId,
  x: number, y: number, width: number, height: number): boolean {
  const image = images.get(id); if (!image) return false;
  const [sx, sy, sw, sh] = manifest[id].crop as [number, number, number, number];
  const scale = Math.min(width / sw, height / sh), w = sw * scale, h = sh * scale;
  ctx.drawImage(image, sx, sy, sw, sh, x + (width - w) / 2, y + (height - h) / 2, w, h);
  return true;
}

export function drawQualityAccessory(ctx: CanvasRenderingContext2D, id: string,
  width: number, height: number, icon: boolean): boolean {
  if (id !== 'headphones' && id !== 'butterfly' && id !== 'cherry') return false;
  const w = width * (icon ? .88 : id === 'cherry' ? .60 : .80);
  const h = height * (icon ? .86 : id === 'butterfly' ? .78 : id === 'cherry' ? .82 : .90);
  const centerY = height * (icon ? .5 : id === 'butterfly' ? .58 : id === 'cherry' ? .55 : .53);
  return drawQualityArt(ctx, id, (width - w) / 2, centerY - h / 2, w, h);
}
