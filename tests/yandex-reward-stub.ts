import type { Page } from '@playwright/test';
export async function installRewardStub(page:Page):Promise<void>{
 await page.addInitScript(()=>{
  const qa={mode:'earn',requests:0,stops:0,starts:0,failSave:false,failJournal:false};(window as unknown as {rewardQA:typeof qa}).rewardQA=qa;
  const write=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if((qa.failSave&&key==='squishy.collection.v1')||(qa.failJournal&&key==='squishy.reward.pending.v1'))throw new Error('Injected manifest quota');write.call(this,key,value);};
  const sdk={environment:{i18n:{lang:'ru'}},features:{GameplayAPI:{start:()=>{qa.starts++;},stop:()=>{qa.stops++;}},LoadingAPI:{ready:()=>{}}},on:()=>{},off:()=>{},getStorage:async()=>localStorage,
   adv:{showRewardedVideo:({callbacks:c}:{callbacks:{onOpen?:()=>void;onRewarded?:()=>void;onClose?:()=>void;onError?:(error:Error)=>void}})=>{
    qa.requests++;c.onOpen?.();if(qa.mode==='error'){c.onError?.(new Error('No ad'));return;}if(qa.mode==='earn'){c.onRewarded?.();c.onRewarded?.();}c.onClose?.();
   },showFullscreenAdv:({callbacks:c}:{callbacks:{onClose?:(shown:boolean)=>void}})=>c.onClose?.(false),showBannerAdv:async()=>({}),hideBannerAdv:async()=>({stickyAdvIsShowing:false}),getBannerAdvStatus:async()=>({stickyAdvIsShowing:false})}};
  (window as unknown as {YaGames:{init:()=>Promise<typeof sdk>}}).YaGames={init:async()=>sdk};
 });
}
