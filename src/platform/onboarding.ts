import { JsonStorageRepository, type StorageAdapter } from '@danilah/mini-games-kit/platform';
import { createDefaultSaveV3, decodeSaveStateV3 } from './saveV3';
import type { SandboxDraft } from '../sandbox/types';
export const ONBOARDING_KEY = 'squishy.onboarding.v1';
export interface OnboardingState {
  readonly version: 1;
  readonly status: 'active' | 'skipped' | 'done';
  readonly draft: SandboxDraft | null;
  readonly painted: boolean;
  readonly decorated: boolean;
  readonly fillingsSeen: boolean;
  readonly roomSeen: boolean;
}
export const onboardingState = (fresh: boolean): OnboardingState => ({version:1,status:fresh?'active':'done',draft:null,painted:false,decorated:false,fillingsSeen:!fresh,roomSeen:!fresh});
export function decodeOnboarding(value: unknown): OnboardingState {
  if (!value || typeof value !== 'object') throw new TypeError('Invalid onboarding');
  const v=value as Record<string,unknown>;
  if(v.version!==1 || !['active','skipped','done'].includes(String(v.status))) throw new TypeError('Invalid onboarding status');
  for(const key of ['painted','decorated','fillingsSeen','roomSeen']) if(typeof v[key]!=='boolean') throw new TypeError('Invalid onboarding flag');
  let draft:SandboxDraft|null=null;
  if(v.draft!==null) {
    if(!v.draft || typeof v.draft!=='object') throw new TypeError('Invalid first draft');
    const toy=decodeSaveStateV3({...createDefaultSaveV3(),library:[{...v.draft,id:'first-draft',createdAt:0}]}).library[0]!;
    draft={shapeId:toy.shapeId,materialId:toy.materialId,appearance:toy.appearance,decor:toy.decor};
  }
  return {version:1,status:v.status as OnboardingState['status'],draft,painted:v.painted as boolean,decorated:v.decorated as boolean,fillingsSeen:v.fillingsSeen as boolean,roomSeen:v.roomSeen as boolean};
}
export const createOnboardingRepository=(storage:StorageAdapter,fresh:boolean)=>new JsonStorageRepository<OnboardingState>({storage,key:ONBOARDING_KEY,createDefault:()=>onboardingState(fresh),codec:{decode:decodeOnboarding,encode:s=>s}});
