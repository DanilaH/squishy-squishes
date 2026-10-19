import { PEDESTAL_REWARD_KEYS } from '../game/pedestals';
import type { SaveStateV3 } from './saveV3';
import type { SandboxDraft } from '../sandbox/types';

export const LOCKED_SHAPES = ['mushroom','strawberry','ice-cream','cupcake','watermelon','mochi-cat','mochi-bunny'];
export const LOCKED_MATERIALS = ['holo','pearl','chrome'];
export const LOCKED_ACCESSORIES = ['headphones','bucket-hat','cream','handbag','wings','mushroom-hat','witch-hat','halo'];
export const FACE_KEYS: Record<string,string> = { 'eyes:sparkling':'face:love', 'eyes:sly':'face:cat', 'eyes:cross':'face:zombie', 'mouth:fangs':'face:vampire', 'mouth:sewn':'face:zombie' };
export const SEASONAL_CATALOG_KEYS = ['shape:bat','shape:pumpkin','accessory:monster-hat','accessory:bat-wings'];
export const CATALOG_KEYS = [...LOCKED_SHAPES.map(id=>`shape:${id}`),...LOCKED_MATERIALS.map(id=>`material:${id}`),...LOCKED_ACCESSORIES.map(id=>`accessory:${id}`),'face:love','face:cat','face:zombie','face:vampire',...SEASONAL_CATALOG_KEYS,...PEDESTAL_REWARD_KEYS];
// A legacy save keeps the catalog that existed before this seasonal expansion.
export const LEGACY_CATALOG_KEYS = CATALOG_KEYS.filter(key=>!SEASONAL_CATALOG_KEYS.includes(key)&&!PEDESTAL_REWARD_KEYS.includes(key));
export function catalogKey(category: string, id: string): string | null {
  if (category==='eyes'||category==='mouth') return FACE_KEYS[`${category}:${id}`] ?? null;
  const key = `${category}:${id}`; return CATALOG_KEYS.includes(key) ? key : null;
}
export const ownsCatalogItem = (state: SaveStateV3, key: string): boolean => (state.legacyCatalogAccess === true && LEGACY_CATALOG_KEYS.includes(key)) || state.unlockedRewardIds.includes(key);
export function draftLockedKeys(draft: SandboxDraft): string[] {
  const pairs = [['shape',draft.shapeId],['material',draft.materialId],['eyes',draft.decor.eyes],['mouth',draft.decor.mouth],['accessory',draft.decor.accessory],...(draft.decor.accessories??[]).map(p=>['accessory',p.a])];
  return [...new Set(pairs.flatMap(([category,id])=>{const key=id?catalogKey(category!,id):null;return key?[key]:[];}))];
}
export interface CatalogPort {
  owns(key: string): boolean;
  unlock(key: string): Promise<boolean>;
  track(event: string, key: string): void;
}
