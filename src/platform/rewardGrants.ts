import type { StorageAdapter } from '@danilah/mini-games-kit/platform';
import type { SaveStateV3 } from './saveV3';
import { CATALOG_KEYS } from './catalogOwnership';
export const REWARD_JOURNAL_KEY = 'squishy.reward.pending.v1';
interface Grant { key: string; targetCapacity: number }
/** Earned callback is journaled before applying; replay is idempotent after failure/reload. */
export class RewardGrants {
  private inFlight = false;
  private pendingGrant: Grant | null = null;
  constructor(private storage: StorageAdapter, private current:()=>SaveStateV3, private persist:(state:SaveStateV3)=>Promise<void>) {}
  async recover(): Promise<void> {
    const raw=this.pendingGrant ? JSON.stringify(this.pendingGrant) : await this.storage.getItem(REWARD_JOURNAL_KEY); if(raw===null)return;
    const grant=JSON.parse(raw) as Grant;
    if(!Number.isSafeInteger(grant.targetCapacity)||grant.targetCapacity<1||!(grant.key==='capacity'||CATALOG_KEYS.includes(grant.key)))throw new TypeError('Invalid reward journal');
    // Retain an earned callback in memory even if the journal's first write fails.
    if(this.pendingGrant){await this.storage.removeItem('squishy.reward.reserve');await this.storage.setItem(REWARD_JOURNAL_KEY,raw);}
    const state=this.current();
    const next=grant.key==='capacity'?{...state,libraryCapacity:Math.max(state.libraryCapacity,grant.targetCapacity),updatedAt:Date.now()}:{...state,unlockedRewardIds:[...new Set([...state.unlockedRewardIds,grant.key])],updatedAt:Date.now()};
    await this.persist(next); this.pendingGrant=null; await this.storage.removeItem(REWARD_JOURNAL_KEY);
  }
  async request(key:string, show:(onReward:()=>Promise<void>)=>Promise<unknown>):Promise<boolean>{
    if(key!=='capacity'&&!CATALOG_KEYS.includes(key))throw new TypeError('Unknown reward');
    if(this.inFlight)return false; this.inFlight=true;
    const reserve='squishy.reward.reserve';let earned=false;
    try {
      // Retry an already earned reward before another offer, without another ad.
      const pending=this.pendingGrant ? JSON.stringify(this.pendingGrant) : await this.storage.getItem(REWARD_JOURNAL_KEY);
      if(pending!==null){const old=JSON.parse(pending) as Grant;await this.recover();if(old.key===key)return true;}
      if(key!=='capacity' && (this.current().legacyCatalogAccess || this.current().unlockedRewardIds.includes(key)))return true;
      await this.storage.setItem(reserve,' '.repeat(128*1024));
      const grant:Grant={key,targetCapacity:this.current().libraryCapacity+1};
      if(!Number.isSafeInteger(grant.targetCapacity))throw new RangeError('Capacity overflow');
      let callback:Promise<void>|null=null;
      await show(()=>callback??=(async()=>{
        this.pendingGrant=grant;
        await this.recover();earned=true;
      })());
      if(callback)await callback;
      return earned;
    } finally {this.inFlight=false;await this.storage.removeItem(reserve).catch(()=>undefined);}
  }
}
