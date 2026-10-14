import type { Page } from '@playwright/test';
import { createDefaultSaveV3, type SaveStateV3 } from '../src/platform/saveV3';
/** Existing behavior tests seed a returning player's already free catalog. */
export const createLegacySaveV3 = (): SaveStateV3 => ({...createDefaultSaveV3(),libraryCapacity:8,legacyCatalogAccess:true});
export const readCollection = (page:Page):Promise<SaveStateV3> => page.evaluate(async()=>{
 const raw=localStorage.getItem('squishy.collection.v1');
 if(!raw)return JSON.parse(localStorage.getItem('squishy.save.v3')??'null');
 const manifest=JSON.parse(raw);const library=[];
 for(const key of manifest.records){const record=localStorage.getItem(key);if(!record)throw new Error('Missing toy record');
  if(record.startsWith('json:'))library.push(JSON.parse(record.slice(5)));
  else{const bytes=Uint8Array.from(atob(record.slice(5)),c=>c.charCodeAt(0));library.push(JSON.parse(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text()));}
 }
 return {...manifest.state,library};
});
