import { registerPlugin } from '@capacitor/core';
import type { NativeRewardReceipt } from '../contracts';
export interface AndroidBridge {
  initialize(): Promise<{ enabled: boolean; test: boolean }>;
  banner(options: { visible: boolean }): Promise<void>;
  preload(): Promise<void>;
  show(options: { kind: 'interstitial' | 'rewarded'; attempt?: string }): Promise<{ status: string; shown?: boolean; reward?: NativeRewardReceipt }>;
  pending(): Promise<{ reward?: NativeRewardReceipt }>;
  acknowledge(options: { token: string }): Promise<void>;
  report(options: { name: string; data: Record<string, unknown> }): Promise<void>;
  storageGet(options: { key: string }): Promise<{ value: string | null }>;
  storageSet(options: { key: string; value: string }): Promise<void>;
  storageRemove(options: { key: string }): Promise<void>;
}
export const nativeBridge = registerPlugin<AndroidBridge>('SquishyServices');
