import type { StorageAdapter } from '@danilah/mini-games-kit/platform';
import { createDefaultSaveV3, decodeSaveStateV3, encodeSaveStateV3, SAVE_V3_STORAGE_KEY, type SaveStateV3 } from './saveV3';

export const COLLECTION_KEY = 'squishy.collection.v1';
interface Manifest { version: 1; state: Omit<SaveStateV3, 'library'>; records: string[] }
const PREFIX = 'squishy.toy.';
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
  async load(): Promise<SaveStateV3> {
    const raw = await this.storage.getItem(COLLECTION_KEY);
    if (raw === null) {
      const legacy = await this.storage.getItem(SAVE_V3_STORAGE_KEY);
      const state = legacy === null ? createDefaultSaveV3() : decodeSaveStateV3(JSON.parse(legacy));
      await this.cleanupPending([]).catch(error => console.error('[squishy:collection-cleanup]', error));
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
    const task = this.queue.catch(() => undefined).then(() => this.commit(state));
    this.queue = task; return task;
  }
  private async commit(state: SaveStateV3): Promise<void> {
    const previous = new Map(this.state?.library.map((toy, i) => [toy.id, { toy, key: this.records[i]! }]) ?? []);
    const records = state.library.map(toy => previous.get(toy.id)?.toy === toy ? previous.get(toy.id)!.key : `${PREFIX}${recordId()}`);
    const oldKeys = new Set(this.records);
    const staged = records.filter(key => !oldKeys.has(key));
    const retained = new Set(records);
    const obsolete = this.records.filter(key => !retained.has(key));
    // The staging journal makes orphan cleanup possible after a tab/process crash,
    // without requiring key enumeration from the Yandex storage adapter.
    await this.cleanupPending(this.records);
    await this.storage.setItem(PENDING_KEY, JSON.stringify([...staged, ...obsolete]));
    try {
      for (const [index, toy] of state.library.entries()) {
        const old = previous.get(toy.id);
        if (old?.toy === toy) continue;
        const key = records[index]!;
        const encoded = await pack((encodeSaveStateV3({ ...state, library: [toy] }) as { library: unknown[] }).library[0]);
        await this.storage.setItem(key, encoded);
        if (await this.storage.getItem(key) !== encoded) throw new Error('Toy write verification failed');
      }
      const { library: _library, ...metadata } = state;
      const manifest: Manifest = { version: 1, state: metadata, records };
      await this.storage.setItem(COLLECTION_KEY, JSON.stringify(manifest));
    } catch (error) {
      const cleaned = await Promise.allSettled(staged.map(key => this.storage.removeItem(key)));
      if (cleaned.every(result => result.status === 'fulfilled')) await this.storage.removeItem(PENDING_KEY).catch(() => undefined);
      throw error;
    }
    this.state = state; this.records = records;
    // Failure of best-effort cleanup must never turn a committed write into a failure.
    const cleaned = await Promise.allSettled(obsolete.map(key => this.storage.removeItem(key)));
    if (cleaned.every(result => result.status === 'fulfilled')) await this.storage.removeItem(PENDING_KEY).catch(() => undefined);
    // The legacy V3 bytes are deliberately retained as a migration recovery copy.
  }
  private async cleanupPending(retained: readonly string[]): Promise<void> {
    const raw = await this.storage.getItem(PENDING_KEY);
    if (raw === null) return;
    const keys: unknown = JSON.parse(raw);
    if (!Array.isArray(keys) || keys.some(key => typeof key !== 'string' || !key.startsWith(PREFIX))) throw new TypeError('Invalid staging journal');
    const live = new Set(retained);
    for (const key of keys as string[]) if (!live.has(key)) await this.storage.removeItem(key);
    await this.storage.removeItem(PENDING_KEY);
  }
  async flush(): Promise<void> { await this.queue; }
  async remove(): Promise<void> {
    await this.flush(); await this.storage.removeItem(COLLECTION_KEY);
    await Promise.all(this.records.map(key => this.storage.removeItem(key)));
    await this.storage.removeItem(SAVE_V3_STORAGE_KEY); this.state = null; this.records = [];
  }
}
