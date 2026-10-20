// All readers, writers and journal cleanup share the same origin-scoped lock.
// Storage adapters do not expose atomic compare-and-swap. Never pretend an
// expiring localStorage lease is safe when a background tab can be suspended.
const queues = new Map<string, Promise<unknown>>();
export function withStorageLock<T>(name: string, work: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request(name, work);
  }
  if (typeof window !== 'undefined') return Promise.reject(new Error('Safe saving requires a browser with Web Locks support.'));
  const result = (queues.get(name) ?? Promise.resolve()).catch(() => undefined).then(work);
  queues.set(name, result);
  return result;
}

export const withCollectionLock = <T>(work: () => Promise<T>): Promise<T> => withStorageLock('squishy.collection.v1', work);
