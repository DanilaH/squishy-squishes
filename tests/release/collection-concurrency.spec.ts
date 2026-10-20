import {test, expect} from '@playwright/test';
import {CollectionRepository, COLLECTION_KEY, COLLECTION_BACKUP_KEY} from '../../src/platform/collectionRepository';
import {createDefaultSaveV3, appendSavedSquishy, updateSavedSquishy, deleteSavedSquishy} from '../../src/platform/saveV3';
import {createSandboxDraft} from '../../src/sandbox/types';
const toy = (id: string) => ({...createSandboxDraft(), id, createdAt:1});
const memory = () => { const data = new Map<string,string>(); return {data, getItem:async(k:string)=>data.get(k)??null, setItem:async(k:string,v:string)=>{data.set(k,v);},removeItem:async(k:string)=>{data.delete(k);}}; };

test('stale tabs preserve independent additions, reward ownership and capacity', async()=>{
 const storage=memory(),a=new CollectionRepository(storage),b=new CollectionRepository(storage);
 await a.write({...createDefaultSaveV3(),library:[toy('original')]});
 const sa=await a.load(),sb=await b.load();
 await a.write({...appendSavedSquishy(sa,toy('a')),libraryCapacity:9,unlockedRewardIds:['pedestal:ufo']});
 await b.write(appendSavedSquishy(sb,toy('b')));
 const result=await new CollectionRepository(storage).load();
 expect(result.library.map(t=>t.id).sort()).toEqual(['a','b','original']);
 expect(result.libraryCapacity).toBe(9);expect(result.unlockedRewardIds).toContain('pedestal:ufo');expect(result.totalCrafts).toBe(2);
});
test('a reader waits for the active writer before cleaning its journal',async()=>{
 const storage=memory(),a=new CollectionRepository(storage);await a.write({...createDefaultSaveV3(),library:[toy('original')]});
 let signal!:()=>void, release!:()=>void;
 const entered=new Promise<void>(r=>signal=r), gate=new Promise<void>(r=>release=r);
 const writer=new CollectionRepository({...storage,setItem:async(k,v)=>{if(k===COLLECTION_KEY){signal();await gate;}await storage.setItem(k,v);}});
 const state=await writer.load();const writing=writer.write(appendSavedSquishy(state,toy('new')));await entered;
 let finished=false;const reading=new CollectionRepository(storage).load().then(s=>{finished=true;return s;});
 await new Promise(r=>setTimeout(r,20));expect(finished).toBe(false);release();await writing;
 expect((await reading).library.map(t=>t.id)).toEqual(['original','new']);
});
test('concurrent edit conflicts preserve committed toy; unrelated writes do not resurrect deletion',async()=>{
 const s=memory(),a=new CollectionRepository(s),b=new CollectionRepository(s);
 await a.write({...createDefaultSaveV3(),library:[toy('original')]});const sa=await a.load(),sb=await b.load();
 await a.write(updateSavedSquishy(sa,'original',{...createSandboxDraft(),materialId:'jelly'}));
 await expect(b.write(updateSavedSquishy(sb,'original',{...createSandboxDraft(),materialId:'chrome'}))).rejects.toThrow('another tab');
 const current=await a.load();await a.write(deleteSavedSquishy(current,'original'));
 await b.write(appendSavedSquishy(sb,toy('b')));
 expect((await new CollectionRepository(s).load()).library.map(t=>t.id)).toEqual(['b']);
});
test('last-slot conflict refuses stale append without losing either committed save',async()=>{
 const s=memory(),a=new CollectionRepository(s),b=new CollectionRepository(s);
 await a.write({...createDefaultSaveV3(),libraryCapacity:1});const sa=await a.load(),sb=await b.load();
 await a.write(appendSavedSquishy(sa,toy('a')));
 await expect(b.write(appendSavedSquishy(sb,toy('b')))).rejects.toThrow('last place');
 expect((await new CollectionRepository(s).load()).library.map(t=>t.id)).toEqual(['a']);
});
test('previous complete generation survives cleanup and explicit restore preserves damaged bytes',async()=>{
 const s=memory(),a=new CollectionRepository(s);
 await a.write({...createDefaultSaveV3(),library:[toy('original')]});
 await a.write(updateSavedSquishy(a.current!,'original',{...createSandboxDraft(),materialId:'jelly'}));
 expect(s.data.has(COLLECTION_BACKUP_KEY)).toBe(true);
 s.data.set(COLLECTION_KEY,'{');const recovery=new CollectionRepository(s);
 await expect(recovery.load()).rejects.toThrow();expect(await recovery.hasRecovery()).toBe(true);
 const exported=JSON.parse(await recovery.exportRecovery());expect(exported.values[COLLECTION_KEY]).toBe('{');
 await recovery.restoreBackup();expect((await recovery.load()).library[0]!.materialId).toBe('soft');
 expect([...s.data].some(([k,v])=>k.startsWith('squishy.collection.corrupt.')&&v==='{')).toBe(true);
});
test('an adapter rejecting after a completed manifest write cannot destroy committed records',async()=>{
 const s=memory(),a=new CollectionRepository({...s,setItem:async(k,v)=>{await s.setItem(k,v);if(k===COLLECTION_KEY)throw new Error('late error');}});
 await a.write({...createDefaultSaveV3(),library:[toy('original')]});
 expect((await new CollectionRepository(s).load()).library.map(t=>t.id)).toEqual(['original']);
});
test('a repeated queued state does not duplicate craft credit or a toy',async()=>{
 const s=memory(),repo=new CollectionRepository(s);await repo.write(createDefaultSaveV3());const base=await repo.load();
 const next=appendSavedSquishy(base,toy('one'));await Promise.all([repo.write(next),repo.write(next)]);
 expect(repo.current!.library).toHaveLength(1);expect(repo.current!.totalCrafts).toBe(1);
});
test('recovery cannot roll back a collection repaired by another tab',async()=>{
 const s=memory(),repo=new CollectionRepository(s);await repo.write({...createDefaultSaveV3(),library:[toy('one')]});
 await repo.write(appendSavedSquishy(repo.current!,toy('two')));
 const recovery=new CollectionRepository(s);await recovery.restoreBackup();
 expect((await recovery.load()).library.map(t=>t.id)).toEqual(['one','two']);
});
