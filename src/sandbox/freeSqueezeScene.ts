import type { MaterialId } from '../game/content';
import type { AppearancePoint } from './appearance';
import type { StagePointer } from './StageGestureRouter';
import { FreeSquishBody, type FreeSquishRoom, type RoomPoint } from './freeSquishBody';

interface FreeSqueezePort {
  radius(): number;
  points(): readonly RoomPoint[];
  uv(x: number, y: number): AppearancePoint | null;
  offset(x: number, y: number): void;
  impact(nx: number, ny: number, speed: number): void;
  resize(): void;
  reset(): void;
  locked(): void;
}

/** Presentation-only room state. Never writes the toy or room storage. */
export class FreeSqueezeScene {
  public readonly body = new FreeSquishBody();
  public enabled = false;
  private readonly shell: HTMLElement;
  private readonly stage: HTMLElement;
  private library: HTMLElement | null = null;
  private home = { x: 0, y: 0 };
  private rendered = { x: 0, y: 0 };
  private camera = { x: 0, y: 0 };
  private viewport = { width: 0, height: 0 };
  private readonly savedStyles = new Map<string, string>();
  private readonly accessorySizes = new Map<HTMLElement, { width: string; height: string }>();
  private shadow: HTMLDivElement | null = null;
  public constructor(private readonly canvas: HTMLCanvasElement, private readonly port: FreeSqueezePort) {
    this.shell = canvas.closest<HTMLElement>('[data-sandbox-app]')!;
    this.stage = canvas.parentElement!;
  }
  public setEnabled(enabled: boolean): void {
    if (enabled === this.enabled) return;
    if (!enabled) { this.restore(); return; }
    const rect = this.canvas.getBoundingClientRect(), radius = this.port.radius();
    this.home = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    this.viewport = { width: innerWidth, height: innerHeight };
    this.library = this.canvas.closest<HTMLElement>('[data-sandbox-library]');
    this.port.reset(); this.body.cancel(); this.body.x = this.body.y = 0;
    for (const name of ['--squish-seat-size', '--squish-radius-ratio']) this.savedStyles.set(name, this.canvas.style.getPropertyValue(name));
    for (const art of this.stage.querySelectorAll<HTMLElement>('.sandbox-accessory-layer')) {
      const size = getComputedStyle(art);
      this.accessorySizes.set(art, { width: art.style.width, height: art.style.height });
      art.style.width = size.width; art.style.height = size.height;
    }
    this.canvas.style.setProperty('--squish-seat-size', `${radius / .34}px`);
    this.shell.dataset.freeSqueeze = 'true'; this.library?.classList.add('has-free-squeeze');
    this.enabled = true;
    this.shadow = document.createElement('div'); this.shadow.className = 'free-squeeze-shadow'; this.shadow.setAttribute('aria-hidden', 'true'); this.stage.prepend(this.shadow);
    this.port.resize();
    this.camera = { x: this.home.x - innerWidth / 2, y: this.home.y - innerHeight / 2 };
    this.offset(); this.updateButton();
  }
  public returnHome(): void { if (this.enabled) { this.port.reset(); this.body.returnHome(); this.updateButton(); } }
  public begin(pointer: StagePointer): boolean {
    if (!this.enabled || this.body.returning || this.body.held !== null) return false;
    const uv = this.port.uv(pointer.x, pointer.y);
    if (!uv || Math.hypot(uv.u - .5, uv.v - .5) > .29) return false;
    this.body.begin(pointer.id, pointer.clientX, pointer.clientY, pointer.inputTime ?? performance.now()); return true;
  }
  public move(pointer: StagePointer): boolean {
    if (this.body.held !== pointer.id) return false;
    this.body.move(pointer.id, pointer.clientX, pointer.clientY, pointer.inputTime ?? performance.now());
    return true;
  }
  public end(id: number, time: number): boolean {
    if (this.body.held !== id) return false;
    this.body.end(id, time); return true;
  }
  public cancel(): void { this.body.cancel(); }
  private offset(): void { this.port.offset(this.camera.x + this.body.x, this.camera.y + this.body.y); this.rendered = { x: this.body.x, y: this.body.y }; }
  public advance(delta: number, material: MaterialId, deforming: boolean): void {
    if (!this.enabled) return;
    // Resize/orientation returns to the reviewed seat rather than keeping stale
    // viewport collision geometry or changing the toy's size mid-flight.
    if (innerWidth !== this.viewport.width || innerHeight !== this.viewport.height) { this.restore(); return; }
    const points = this.port.points().map(p => ({ x: p.x - this.rendered.x, y: p.y - this.rendered.y }));
    const room = this.room();
    const done = this.body.advance(deforming && this.body.held === null && !this.body.returning ? 0 : delta,
      points, room, material, this.port.radius(), (nx, ny, speed) => this.port.impact(nx, ny, speed));
    if (done) { this.restore(); return; }
    this.offset();
    this.canvas.dataset.freeBodyX = this.body.x.toFixed(2); this.canvas.dataset.freeBodyY = this.body.y.toFixed(2);
    this.canvas.dataset.freeBodyVx = this.body.vx.toFixed(2); this.canvas.dataset.freeBodyVy = this.body.vy.toFixed(2);
    this.canvas.dataset.freeBodyHeld = String(this.body.held !== null);
    const current = this.port.points();
    const bottom = Math.max(...current.map(p => p.y));
    this.canvas.dataset.freeSkinBounds = JSON.stringify({ left: Math.min(...current.map(p => p.x)), right: Math.max(...current.map(p => p.x)), top: Math.min(...current.map(p => p.y)), bottom });
    const centerX = this.home.x + this.body.x;
    const top = room.pedestal.length && centerX >= room.pedestal[0]!.x && centerX <= room.pedestal[1]!.x ? Math.min(...room.pedestal.map(p => p.y)) : room.bottom;
    const height = Math.max(0, top - bottom), ratio = Math.max(.35, 1 - height / Math.max(1, innerHeight));
    if (this.shadow) {
      this.shadow.style.left = `${centerX}px`; this.shadow.style.top = `${top}px`;
      this.shadow.style.width = `${this.port.radius() * 1.6 * ratio}px`; this.shadow.style.opacity = String(.25 * ratio);
    }
  }
  private room(): FreeSquishRoom {
    const root = this.library ?? this.shell;
    const controls = root.querySelectorAll<HTMLElement>('button');
    let top = 4, bottom = innerHeight - 4;
    for (const button of controls) {
      if (button.closest('.sandbox-stage')) continue;
      const r = button.getBoundingClientRect();
      if (!r.width || !r.height || getComputedStyle(button).visibility === 'hidden') continue;
      // Fixed controls win input and have a safe horizontal band above/below
      // the room. Hidden collection/catalog rows do not become fake walls.
      if (r.bottom < this.home.y) top = Math.max(top, r.bottom + 8);
      if (r.top > this.home.y) bottom = Math.min(bottom, r.top - 8);
    }
    const pedestal = this.library?.querySelector<HTMLElement>('.library-showcase-table') ?? this.shell.querySelector<HTMLElement>('[data-studio-desk]');
    const visible = pedestal && getComputedStyle(pedestal).display !== 'none';
    const r = visible ? pedestal.getBoundingClientRect() : null;
    const polygon: RoomPoint[] = r ? [
      { x: r.left + r.width * .06, y: r.top + r.height * .20 }, { x: r.right - r.width * .06, y: r.top + r.height * .20 },
      { x: r.right, y: r.top + r.height * .31 }, { x: r.right, y: r.bottom - r.height * .12 },
      { x: r.right - r.width * .12, y: r.bottom }, { x: r.left + r.width * .12, y: r.bottom },
      { x: r.left, y: r.bottom - r.height * .12 }, { x: r.left, y: r.top + r.height * .31 },
    ] : [];
    return { left: 4, right: innerWidth - 4, top, bottom, pedestal: polygon };
  }
  private updateButton(): void {
    const button = this.shell.querySelector<HTMLButtonElement>('[data-action="free-squeeze"]');
    if (!button) return;
    const ru = button.dataset.language === 'ru';
    button.textContent = this.body.returning ? ru ? 'Возвращаем…' : 'Returning…' : this.enabled ? ru ? 'На подставку' : 'On pedestal' : ru ? 'Отцепить' : 'Unpin';
    button.setAttribute('aria-pressed', String(this.enabled)); button.disabled = this.body.returning;
  }
  private restore(): void {
    this.enabled = false; this.body.returning = false; this.body.cancel(); this.body.x = this.body.y = 0;
    this.shell.removeAttribute('data-free-squeeze'); this.library?.classList.remove('has-free-squeeze');
    for (const [name, value] of this.savedStyles) { if (value) this.canvas.style.setProperty(name, value); else this.canvas.style.removeProperty(name); }
    this.savedStyles.clear(); this.rendered = { x: 0, y: 0 }; this.port.locked(); this.port.offset(0, 0); this.port.resize(); this.port.reset();
    for (const [art, size] of this.accessorySizes) { art.style.width = size.width; art.style.height = size.height; }
    this.accessorySizes.clear();
    this.shadow?.remove(); this.shadow = null; this.updateButton();
  }
  public dispose(): void { if (this.enabled) this.restore(); }
}
