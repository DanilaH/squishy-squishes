import { withCollectionLock } from './collectionLock';
import type { StorageAdapter } from '@danilah/mini-games-kit/platform';
import { createDefaultSaveV3, decodeSaveStateV3, encodeSaveStateV3, SAVE_V3_STORAGE_KEY, type SaveStateV3 } from './saveV3';

export const COLLECTION_KEY = 'squishy.collection.v1';
interface Manifest { version: 1; state: Omit<SaveStateV3, 'library'>; records: string[] }
const PREFIX = 'squishy.toy.';
export const COLLECTION_BACKUP_KEY = 'squishy.collection.backup.v1';
const PENDING_KEY = 'squishy.collection.pending';
const recordId = (): string => globalThis.crypto?.randomUUID?.() ?? `toy-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

async function pack(value: unknown): Promise<string> {
  const raw = JSON.stringify(value);
  if (new TextEncoder().encode(raw).byteLength > 16 * 1024 * 1024) throw new RangeError('Toy payload too large');
  if (typeof CompressionStream === 'undefined' || typeof DecompressionStream === 'undefined') return `json:${raw}`;
  const bytes = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
  let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte);
  const compressed = `gzip:${btoa(binary)}`;
  return compressed.length < raw.length + 5 ? compressed : `json:${raw}`;
}
async function unpack(raw: string): Promise<unknown> {
  if (raw.length > 16 * 1024 * 1024) throw new RangeError('Toy payload too large');
  if (raw.startsWith('json:')) return JSON.parse(raw.slice(5));
  if (!raw.startsWith('gzip:')) throw new TypeError('Unsupported toy encoding');
  const bytes = Uint8Array.from(atob(raw.slice(5)), c => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  // Bound decoded bytes before JSON parsing, including malformed compression bombs.
  const reader = stream.getReader(); const parts: Uint8Array[] = []; let total = 0;
  for (;;) { const { value, done } = await reader.read(); if (done) break; total += value.byteLength; if (total > 16 * 1024 * 1024) { await reader.cancel(); throw new RangeError('Toy payload too large'); } parts.push(value); }
  return JSON.parse(await new Blob(parts as BlobPart[]).text());
}

export class CollectionConflictError extends Error {
  constructor(readonly reason: 'changed' | 'full', message: string) { super(message); this.name = 'CollectionConflictError'; }
}

/** Merge only the caller's changes against its loaded base. Concurrent edits to
 * the same toy are rejected; unrelated additions and monotonic rewards survive. */
export function mergeCollection(base: SaveStateV3, next: SaveStateV3, current: SaveStateV3): SaveStateV3 {
  const signature = (toy: SaveStateV3['library'][number] | undefined): string => toy ? JSON.stringify((encodeSaveStateV3({...createDefaultSaveV3(), library:[toy]}) as {library:unknown[]}).library, (_key, value: unknown) => value && typeof value === 'object' && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) : value) : '';
  const same = (a: SaveStateV3['library'][number] | undefined, b: SaveStateV3['library'][number] | undefined): boolean => a === b || signature(a) === signature(b);
  const before = new Map(base.library.map(toy => [toy.id, toy]));
  const wanted = new Map(next.library.map(toy => [toy.id, toy]));
  const live = new Map(current.library.map(toy => [toy.id, toy]));
  for (const [id, old] of before) {
    const change = wanted.get(id);
    if (same(old, change)) continue;
    if (!same(live.get(id), old) && !same(live.get(id), change)) throw new CollectionConflictError('changed', 'This squishy changed in another tab. Your draft is still open.');
    if (change) live.set(id, change); else live.delete(id);
  }
  for (const [id, toy] of wanted) if (!before.has(id)) {
    if (live.has(id) && !same(live.get(id), toy)) throw new Error('Conflicting squishy ID.');
    live.set(id, toy);
  }
  const libraryCapacity = Math.max(current.libraryCapacity, next.libraryCapacity);
  if (live.size > libraryCapacity) throw new CollectionConflictError('full', 'The last place was used in another tab. Your draft is still open.');
  const ordered = [...next.library.map(toy => live.get(toy.id)).filter((toy): toy is SaveStateV3['library'][number] => !!toy), ...[...live.values()].filter(toy => !wanted.has(toy.id))];
  return {...current, library: ordered, libraryCapacity,
    legacyCatalogAccess: current.legacyCatalogAccess === true || next.legacyCatalogAccess === true,
    unlockedRewardIds: [...new Set([...current.unlockedRewardIds, ...next.unlockedRewardIds])],
    completedRecipeIds: [...new Set([...current.completedRecipeIds, ...next.completedRecipeIds])],
    totalCrafts: current.totalCrafts + Math.min(Math.max(0, next.totalCrafts - base.totalCrafts), next.library.filter(toy => !before.has(toy.id) && !current.library.some(existing => existing.id === toy.id)).length),
    updatedAt: Math.max(current.updatedAt, next.updatedAt)};
}

/** Copy-on-write toy records; the small manifest is the sole commit point. */
export class CollectionRepository {
  private queue: Promise<void> = Promise.resolve();
  private state: SaveStateV3 | null = null;
  private records: string[] = [];
  constructor(private readonly storage: StorageAdapter) {}
  async loadOrDefault(onError: (error: unknown) => void = () => undefined): Promise<SaveStateV3> {
    try { return await this.load(); } catch(error) { onError(error); throw error; }
  }
  async hasManifest(): Promise<boolean> { return await this.storage.getItem(COLLECTION_KEY) !== null; }
  get current(): SaveStateV3 | null { return this.state; }
  load(): Promise<SaveStateV3> { return withCollectionLock(() => this.read()); }
  private async read(): Promise<SaveStateV3> {
    const raw = await this.storage.getItem(COLLECTION_KEY);
    if (raw === null) {
      const legacy = await this.storage.getItem(SAVE_V3_STORAGE_KEY);
      const state = legacy === null ? createDefaultSaveV3() : decodeSaveStateV3(JSON.parse(legacy));
      await this.cleanupPending([]).catch(error => console.error('[squishy:collection-cleanup]', error));
      this.state = state; this.records = [];
      return state;
    }
    const manifest = JSON.parse(raw) as Manifest;
    if (manifest.version !== 1 || !Array.isArray(manifest.records) || manifest.records.some(k => typeof k !== 'string' || !k.startsWith(PREFIX))) throw new TypeError('Invalid collection manifest');
    const library = [];
    // Keep decoding sequential: a large collection must not inflate every toy at once.
    for (const key of manifest.records) {
      const toy = await this.storage.getItem(key);
      if (toy === null) throw new Error('Missing collection record');
      library.push(await unpack(toy));
    }
    this.state = decodeSaveStateV3({ ...manifest.state, library });
    this.records = manifest.records;
    await this.cleanupPending(this.records).catch(error => console.error('[squishy:collection-cleanup]', error));
    return this.state;
  }
  write(state: SaveStateV3): Promise<void> {
    const base = this.state ?? createDefaultSaveV3();
    const task = this.queue.catch(() => undefined).then(() => withCollectionLock(async () => {
      const previousState = this.state, previousRecords = this.records;
      try {
        const raw = await this.storage.getItem(COLLECTION_KEY);
        const current = raw === null ? base : await this.read();
        await this.commit(raw === null ? state : mergeCollection(base, state, current));
      } catch (error) { this.state = previousState; this.records = previousRecords; throw error; }
    }));
    this.queue = task; return task;
  }
  private async commit(state: SaveStateV3): Promise<void> {
    const previous = new Map(this.state?.library.flatMap((toy, i) => this.records[i] ? [[toy.id, {toy, key:this.records[i]!}] as const] : []) ?? []);
    const records = state.library.map(toy => previous.get(toy.id)?.toy === toy ? previous.get(toy.id)!.key : `${PREFIX}${recordId()}`);
    const oldKeys = new Set(this.records);
    const staged = records.filter(key => !oldKeys.has(key));
    const retained = new Set(records);
    const obsolete = this.records.filter(key => !retained.has(key));
    // The staging journal makes orphan cleanup possible after a tab/process crash,
    // without requiring key enumeration from the Yandex storage adapter.
    await this.cleanupPending(this.records);
    const backup = await this.storage.getItem(COLLECTION_BACKUP_KEY);
    const olderKeys = this.manifestKeys(backup);
    const oldManifest = await this.storage.getItem(COLLECTION_KEY);
    // Keep one complete previous generation, including its records.
    if (oldManifest !== null) await this.storage.setItem(COLLECTION_BACKUP_KEY, oldManifest);
    await this.storage.setItem(PENDING_KEY, JSON.stringify([...staged, ...obsolete, ...olderKeys]));
    const { library: _library, ...metadata } = state;
    const manifest: Manifest = { version: 1, state: metadata, records };
    const manifestRaw = JSON.stringify(manifest);
    try {
      for (const [index, toy] of state.library.entries()) {
        const old = previous.get(toy.id);
        if (old?.toy === toy) continue;
        const key = records[index]!;
        const encoded = await pack((encodeSaveStateV3({ ...state, library: [toy] }) as { library: unknown[] }).library[0]);
        await this.storage.setItem(key, encoded);
        if (await this.storage.getItem(key) !== encoded) throw new Error('Toy write verification failed');
      }
      await this.storage.setItem(COLLECTION_KEY, manifestRaw);
    } catch (error) {
      // An adapter can reject after the commit reached storage. Never delete
      // its records on an ambiguous outcome; a later reader safely reconciles.
      let actual: string | null;
      try { actual = await this.storage.getItem(COLLECTION_KEY); } catch { throw error; }
      if (actual === manifestRaw) { this.state = state; this.records = records; return; }
      if (backup === null) await this.storage.removeItem(COLLECTION_BACKUP_KEY).catch(() => undefined);
      else await this.storage.setItem(COLLECTION_BACKUP_KEY, backup).catch(() => undefined);
      const cleaned = await Promise.allSettled(staged.map(key => this.storage.removeItem(key)));
      if (cleaned.every(result => result.status === 'fulfilled')) await this.storage.removeItem(PENDING_KEY).catch(() => undefined);
      throw error;
    }
    this.state = state; this.records = records;
    // Failure of best-effort cleanup must never turn a committed write into a failure.
    const protectedKeys = new Set([...records, ...this.manifestKeys(oldManifest)]);
    const cleaned = await Promise.allSettled([...new Set([...obsolete, ...olderKeys])].filter(key => !protectedKeys.has(key)).map(key => this.storage.removeItem(key)));
    if (cleaned.every(result => result.status === 'fulfilled')) await this.storage.removeItem(PENDING_KEY).catch(() => undefined);
    // The legacy V3 bytes are deliberately retained as a migration recovery copy.
  }
  private async cleanupPending(retained: readonly string[]): Promise<void> {
    const raw = await this.storage.getItem(PENDING_KEY);
    if (raw === null) return;
    const keys: unknown = JSON.parse(raw);
    if (!Array.isArray(keys) || keys.some(key => typeof key !== 'string' || !key.startsWith(PREFIX))) throw new TypeError('Invalid staging journal');
    const live = new Set([...retained, ...this.manifestKeys(await this.storage.getItem(COLLECTION_BACKUP_KEY))]);
    for (const key of keys as string[]) if (!live.has(key)) await this.storage.removeItem(key);
    await this.storage.removeItem(PENDING_KEY);
  }
  private manifestKeys(raw: string | null): string[] {
    if (!raw) return [];
    try { const m = JSON.parse(raw) as Manifest; return Array.isArray(m.records) ? m.records.filter(k => typeof k === 'string' && k.startsWith(PREFIX)) : []; }
    catch { return []; }
  }
  async exportRecovery(): Promise<string> {
    return withCollectionLock(async () => {
      const keys = [COLLECTION_KEY, COLLECTION_BACKUP_KEY, PENDING_KEY, SAVE_V3_STORAGE_KEY, 'squishy.reward.pending.v1'];
      const values: Record<string, string | null> = {};
      for (const key of keys) values[key] = await this.storage.getItem(key);
      for (const key of new Set([...this.manifestKeys(values[COLLECTION_KEY]!), ...this.manifestKeys(values[COLLECTION_BACKUP_KEY]!)])) values[key] = await this.storage.getItem(key);
      return JSON.stringify({version: 1, exportedAt: new Date().toISOString(), values}, null, 2);
    });
  }
  async hasRecovery(): Promise<boolean> {
    try { await this.validateBackup(); return true; } catch { return false; }
  }
  private async validateBackup(): Promise<string> {
    const raw = await this.storage.getItem(COLLECTION_BACKUP_KEY);
    if (!raw) throw new Error('No previous save is available.');
    const m = JSON.parse(raw) as Manifest;
    if (m.version !== 1 || !Array.isArray(m.records) || this.manifestKeys(raw).length !== m.records.length) throw new Error('Invalid backup.');
    const library = [];
    for (const key of m.records) { const toy = await this.storage.getItem(key); if (toy === null) throw new Error('Incomplete backup.'); library.push(await unpack(toy)); }
    decodeSaveStateV3({...m.state, library});
    return raw;
  }
  async restoreBackup(): Promise<void> {
    await withCollectionLock(async () => {
      // Another tab may already have repaired the collection while this screen was open.
      try { await this.read(); return; } catch { /* Only restore an unreadable collection. */ }
      const backup = await this.validateBackup();
      const original = await this.storage.getItem(COLLECTION_KEY);
      // Preserve the damaged manifest before the user-requested rollback.
      if (original !== null) await this.storage.setItem(`squishy.collection.corrupt.${recordId()}`, original);
      await this.storage.setItem(COLLECTION_KEY, backup);
    });
  }
  async flush(): Promise<void> { await this.queue; }
  async remove(): Promise<void> {
    await this.flush();
    await withCollectionLock(async () => {
      const keys = [...this.manifestKeys(await this.storage.getItem(COLLECTION_KEY)), ...this.manifestKeys(await this.storage.getItem(COLLECTION_BACKUP_KEY))];
      await this.storage.removeItem(COLLECTION_KEY);
      await this.storage.removeItem(COLLECTION_BACKUP_KEY);
      await Promise.all([...new Set(keys)].map(key => this.storage.removeItem(key)));
      await this.storage.removeItem(SAVE_V3_STORAGE_KEY); this.state = null; this.records = [];
    });
  }
}
