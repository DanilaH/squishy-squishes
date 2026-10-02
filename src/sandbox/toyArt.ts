import { resolveAuthoredImagePath } from '../app/runtimeAssets';
import type { AccessoryId } from './decor';
import type { ShapeId } from '../game/shapes';

interface ToyAsset {
  readonly file: string;
  readonly hasAvif: boolean;
  readonly crop: readonly [number, number, number, number];
}
// Startup-required: any existing V3 toy can display its accessory in the Hall.
// Every crop is measured from the prepared image, including a 2px alpha margin.
const assets: Readonly<Record<AccessoryId, ToyAsset>> = {
  bow: { file: 'puffy-bow', hasAvif: true, crop: [12, 68, 232, 120] },
  'cat-ears': { file: 'cat-ears', hasAvif: true, crop: [14, 79, 228, 99] },
  'bunny-ears': { file: 'bunny-ears', hasAvif: true, crop: [14, 49, 228, 159] },
  horns: { file: 'horns', hasAvif: true, crop: [14, 75, 228, 107] },
  crown: { file: 'crown', hasAvif: true, crop: [14, 66, 228, 125] },
};
const images = new Map<AccessoryId, HTMLImageElement>();
let pending: Promise<void> | null = null;
export const preloadToyArt = (): Promise<void> => {
  pending ??= Promise.all((Object.entries(assets) as [AccessoryId, ToyAsset][]).map(async ([id, asset]) => {
    if (images.has(id)) return;
    const path = `${import.meta.env.BASE_URL}assets/toy-polish/${asset.file}.webp`;
    const image = new Image(); const preferred = await resolveAuthoredImagePath(path, asset.hasAvif);
    image.src = preferred;
    try {
      try { await image.decode(); }
      catch (error: unknown) { if (preferred === path) throw error; image.src = path; await image.decode(); }
      if (!image.naturalWidth) throw new Error('Empty toy image');
      images.set(id, image);
    } catch (error: unknown) {
      console.warn(`[squishy:toy-art] ${id} unavailable; using drawn accessory.`, error);
    }
  })).then(() => { if (images.size < Object.keys(assets).length) pending = null; });
  return pending;
};

export const drawToyAccessory = (ctx: CanvasRenderingContext2D, id: AccessoryId, width: number, height: number, shapeId?: ShapeId, icon = false): boolean => {
  const image = images.get(id); if (!image) return false;
  ctx.save(); ctx.shadowColor = id === 'bow' ? 'rgba(108,45,76,.26)' : 'rgba(108,45,76,.22)'; ctx.shadowBlur = height * .025; ctx.shadowOffsetY = height * .018;
  const [sx, sy, sw, sh] = assets[id].crop;
  if (id === 'bow') {
    // Preserve the owner-approved bow pixels and logical seat.
    ctx.drawImage(image, sx, sy, sw, sh, width * (icon ? .05 : .16), height * (icon ? .14 : .53), width * (icon ? .90 : .68), height * (icon ? .70 : .48));
  } else {
    const w = width * (icon ? .88 : .68);
    const h = Math.min(height * (icon ? .86 : .62), w * sh / sw);
    const y = height * (icon ? .5 : .92) - h * (icon ? .5 : 1);
    if (shapeId === 'heart' && id !== 'crown' && !icon) {
      // Paired roots straddle the heart cleft without stretching either ear.
      ctx.drawImage(image, sx, sy, sw / 2, sh, width / 2 - w / 2 - width * .08, y, w / 2, h);
      ctx.drawImage(image, sx + sw / 2, sy, sw / 2, sh, width / 2 + width * .08, y, w / 2, h);
    } else ctx.drawImage(image, sx, sy, sw, sh, (width - w) / 2, y, w, h);
  }
  ctx.restore(); return true;
};
