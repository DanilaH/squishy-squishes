import type { Page } from '@playwright/test';
/** Inject the native transport in the test runner, never via a shipped hook. */
export async function installAndroidBridge(page: Page) {
  await page.addInitScript(() => {
    const events: Record<string, (data: unknown) => void> = {};
    const calls: { method: string; data: any }[] = [];
    const win = window as any;
    win.androidBridge = {};
    win.__nativeCalls = calls;
    win.__nativeEvent = (name: string, data: unknown) => events[name]?.(data);
    const names = ['initialize', 'banner', 'preload', 'show', 'pending', 'acknowledge', 'report', 'storageGet', 'storageSet', 'storageRemove'];
    win.Capacitor = {
      PluginHeaders: [
        { name: 'SquishyServices', methods: names.map(name => ({ name, rtype: 'promise' })) },
        { name: 'App', methods: ['getState', 'minimizeApp', 'removeListener'].map(name => ({ name, rtype: 'promise' })).concat([{ name: 'addListener', rtype: 'callback' }]) },
      ],
      nativeCallback: (_plugin: string, _method: string, data: any, callback: any) => { events[data.eventName] = callback; return data.eventName; },
      nativePromise: async (plugin: string, method: string, data: any = {}) => {
        calls.push({ method, data });
        if (plugin === 'App') return method === 'getState' ? { isActive: true } : {};
        if (method === 'initialize') return { enabled: true, test: true };
        if (method === 'storageGet') return { value: localStorage.getItem(data.key) };
        if (method === 'storageSet') { localStorage.setItem(data.key, data.value); return {}; }
        if (method === 'storageRemove') { localStorage.removeItem(data.key); return {}; }
        if (method === 'pending') return JSON.parse(localStorage.getItem('test.native.pending') ?? '{}');
        if (method === 'acknowledge') { localStorage.removeItem('test.native.pending'); return {}; }
        if (method === 'show') {
          const reward = { token: crypto.randomUUID(), attempt: data.attempt };
          if (data.kind === 'rewarded') localStorage.setItem('test.native.pending', JSON.stringify({ reward }));
          return { status: 'closed', shown: true, ...(data.kind === 'rewarded' ? { reward } : {}) };
        }
        return {};
      },
    };
  });
}
