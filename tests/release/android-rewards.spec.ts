import { test, expect } from '@playwright/test';
import { RewardGrants } from '../../src/platform/rewardGrants';
import { createDefaultSaveV3 } from '../../src/platform/saveV3';
import { CollectionRepository } from '../../src/platform/collectionRepository';

function fixture() {
  const data = new Map<string, string>();
  const storage = {
    getItem: async (key: string) => data.get(key) ?? null,
    setItem: async (key: string, value: string) => { data.set(key, value); },
    removeItem: async (key: string) => { data.delete(key); },
  };
  return { storage, data };
}
test('Android receipt survives reload and duplicate delivery without duplicate capacity', async () => {
  const { storage } = fixture();
  let repository = new CollectionRepository(storage);
  let state = createDefaultSaveV3();
  const persist = async (next: typeof state) => { await repository.write(next); await repository.flush(); state = repository.current!; };
  let grants = new RewardGrants(storage, () => state, persist);
  const intent = JSON.stringify({ key: 'capacity', targetCapacity: state.libraryCapacity + 1 });
  await grants.recoverExternal(intent);
  const grantedCapacity = state.libraryCapacity;
  // Native acknowledgement fails; process then restarts and redelivers.
  repository = new CollectionRepository(storage); state = await repository.load();
  grants = new RewardGrants(storage, () => state, persist);
  await grants.recoverExternal(intent);
  expect(state.libraryCapacity).toBe(grantedCapacity);
  await grants.recoverExternal(JSON.stringify({ key: 'capacity', targetCapacity: grantedCapacity + 1 }));
  await grants.recoverExternal(intent);
  expect(state.libraryCapacity).toBe(grantedCapacity + 1);
});
test('failed native reward commit remains retryable; invalid receipt cannot grant', async () => {
  const { storage } = fixture();
  let state = createDefaultSaveV3();
  let fail = true;
  const grants = new RewardGrants(storage, () => state, async next => { if (fail) throw new Error('disk'); state = next; });
  const intent = JSON.stringify({ key: 'capacity', targetCapacity: state.libraryCapacity + 1 });
  await expect(grants.recoverExternal(intent)).rejects.toThrow('disk');
  expect(state.libraryCapacity).toBe(4);
  fail = false; await grants.recoverExternal(intent);
  expect(state.libraryCapacity).toBe(5);
  for (const raw of ['{}', 'null', '{"key":"capacity","targetCapacity":-1}', '{"key":"unknown","targetCapacity":10}']) {
    await expect(grants.recoverExternal(raw)).rejects.toThrow();
  }
  expect(state.libraryCapacity).toBe(5);
});
