import type { Page } from '@playwright/test';
import { createLegacySaveV3 as createDefaultSaveV3 } from './collection';
/** Existing-room regression suites start as returning players; onboarding has its own fresh-storage suite. */
export async function returningPlayer(page:Page,prefix=''):Promise<void>{
  await page.addInitScript(({save,prefix})=>{
    if(localStorage.getItem(prefix+'squishy.save.v3')===null && localStorage.getItem(prefix+'squishy.collection.v1')===null)localStorage.setItem(prefix+'squishy.save.v3',JSON.stringify(save));
  },{save:createDefaultSaveV3(),prefix});
}
