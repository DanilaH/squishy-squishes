import type { SandboxDraft } from './types';

/** Immutable documents make one pointer gesture one reversible edit. */
export class DraftHistory {
  private past: SandboxDraft[] = [];
  private future: SandboxDraft[] = [];
  private start: SandboxDraft | null = null;
  public restoring = false;
  public get canUndo(): boolean { return this.past.length > 0; }
  public get canRedo(): boolean { return this.future.length > 0; }
  private equal(a: SandboxDraft, b: SandboxDraft): boolean { return JSON.stringify(a) === JSON.stringify(b); }
  public record(before: SandboxDraft, after: SandboxDraft): void {
    if (this.restoring || this.start || this.equal(before, after)) return;
    this.past.push(before); this.future = [];
    if (this.past.length > 96) this.past.shift();
  }
  public begin(draft: SandboxDraft): void { this.start ??= draft; }
  public end(draft: SandboxDraft): void {
    const start = this.start; this.start = null;
    if (start) this.record(start, draft);
  }
  public undo(current: SandboxDraft): SandboxDraft | null {
    const previous = this.past.pop();
    if (previous) this.future.push(current);
    return previous ?? null;
  }
  public redo(current: SandboxDraft): SandboxDraft | null {
    const next = this.future.pop();
    if (next) this.past.push(current);
    return next ?? null;
  }
  public clear(): void { this.past = []; this.future = []; this.start = null; }
}
