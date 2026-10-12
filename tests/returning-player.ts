import type { Page } from '@playwright/test';
import { createDefaultSaveV3 } from '../src/platform/saveV3';
/** Existing-room regression suites start as returning players; onboarding has its own fresh-storage suite. */
export async function returningPlayer(page:Page):Promise<void>{
  await page.addInitScript(save=>{
    if(localStorage.getItem('squishy.save.v3')===null)localStorage.setItem('squishy.save.v3',JSON.stringify(save));
  },createDefaultSaveV3());
}
