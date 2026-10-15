import manifest from './qualityArtManifest.json' with { type: 'json' };
import { resolveAuthoredImagePath } from '../app/runtimeAssets';

export type QualityArtId = keyof typeof manifest;
interface QualityArtAsset {
  file: string; hasAvif: boolean; crop: readonly number[];
  leftCrop?: readonly number[]; leftRoot?: readonly number[];
}
const assetFor = (id: string): QualityArtAsset | undefined =>
  Object.hasOwn(manifest, id) ? manifest[id as QualityArtId] : undefined;
const images = new Map<string, HTMLImageElement>();
let pending: Promise<void> | null = null;

/** Catalogs and saved toys can immediately use any asset: decode before entry. */
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
export function drawQualityArt(ctx: CanvasRenderingContext2D, id: string,
  x: number, y: number, width: number, height: number): boolean {
  const image = images.get(id), asset = assetFor(id); if (!image || !asset) return false;
  const [sx, sy, sw, sh] = asset.crop as [number, number, number, number];
  const scale = Math.min(width / sw, height / sh), w = sw * scale, h = sh * scale;
  ctx.drawImage(image, sx, sy, sw, sh, x + (width - w) / 2, y + (height - h) / 2, w, h);
  return true;
}

export function drawQualityAccessory(ctx: CanvasRenderingContext2D, id: string,
  width: number, height: number, icon: boolean): boolean {
  const asset = assetFor(id), image = images.get(id);
  if (!asset || !image || id.startsWith('sticker-') || id.startsWith('filler-')) return false;
  if (!icon && asset.leftCrop && asset.leftRoot) {
    // Reconstruct the existing paired logical frame. Each root must stay at
    // x=58.5/y=110.4 before drawAccessoryPiece separates and seats the halves.
    const [sx, sy, sw, sh] = asset.leftCrop as [number, number, number, number];
    const [rootX, rootY] = asset.leftRoot as [number, number];
    const scale = Math.min(width * .39 / sw, height * (id === 'leaves' ? .62 : .76) / sh);
    const w = sw * scale, h = sh * scale;
    for (const side of [-1, 1]) {
      ctx.save(); if (side === 1) { ctx.translate(width, 0); ctx.scale(-1, 1); }
      ctx.drawImage(image, sx, sy, sw, sh, width * .325 - rootX * w, height * .92 - rootY * h, w, h);
      ctx.restore();
    }
    return true;
  }
  // Geometry belongs to the asset's existing logical frame, never a viewport.
  const frames: Readonly<Record<string, readonly [number, number, number]>> = accessoryFrames;
  const [fw, fh, fy] = frames[id] ?? [.80, .82, .57];
  const w = width * (icon ? .88 : fw);
  const h = height * (icon ? .86 : fh);
  const centerY = height * (icon ? .5 : fy);
  // The eyepatch shield used to sit left of the shared face-zone anchor;
  // retain that focal offset instead of centering the shield on the nose.
  const centerX = width * (id === 'eye-patch' && !icon ? .24 : .5);
  return drawQualityArt(ctx, id, centerX - w / 2, centerY - h / 2, w, h);
}

const accessoryFrames = {
  headphones: [.80, .90, .53], butterfly: [.80, .78, .58], cherry: [.60, .82, .55],
  glasses: [.70, .43, .58], 'bucket-hat': [.86, .76, .60],
  'petal-flower': [.57, .65, .64], cream: [.68, .80, .53],
  'heart-patch': [.60, .42, .64], handbag: [.73, .80, .58],
  antennae: [.72, .78, .53], 'mushroom-hat': [.86, .62, .64],
  'witch-hat': [.86, .83, .53], halo: [.64, .32, .70],
  'eye-patch': [.76, .48, .52], bolt: [.43, .42, .60],
} as const;

/** Existing classic stickers keep their deterministic color variations. */
export function drawQualitySticker(ctx: CanvasRenderingContext2D, id: string, size: number, variant = 0): boolean {
  const key = `sticker-${id}`;
  if (!images.has(key)) return false;
  const bases: Readonly<Record<string, number>> = {heart: 0, flower: 1, star: 2, sparkle: 3};
  const sourceHues: Readonly<Record<string, number>> = {heart: 340, flower: 340, star: 45, sparkle: 270};
  ctx.save();
  if (Object.hasOwn(bases, id)) {
    const hues = [340, 160, 45, 270];
    const target = hues[(bases[id]! + variant) % 4]!;
    ctx.filter = `${ctx.filter === 'none' ? '' : ctx.filter + ' '}hue-rotate(${target - sourceHues[id]!}deg)`;
  }
  const drawn = drawQualityArt(ctx, key, -size * .45, -size * .45, size * .90, size * .90);
  ctx.restore(); return drawn;
}
