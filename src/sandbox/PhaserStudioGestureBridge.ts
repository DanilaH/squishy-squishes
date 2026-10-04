import Phaser from 'phaser';
import { StageGestureRouter, type StageGestureHost, type StagePointer, type StudioDecorSection, type StudioGestureStage } from './StageGestureRouter';

/** The Phaser scene supplies its own shared simulation; the bridge never creates one. */
export interface PhaserStudioGestureHost extends Omit<StageGestureHost, 'beginSquish' | 'moveSquish' | 'endSquish'> {
  beginSquish(pointer: StagePointer): boolean;
  moveSquish(pointer: StagePointer): void;
  endSquish(pointerId: number): void;
}

/**
 * Single Phaser.Input owner for one playfield. The stage router delegates
 * authoring to the existing studio, and never attaches a second DOM pointer
 * handler. The native listeners handle interruption that Phaser may not emit.
 *
 * A caller owns the Phaser.Game and advances the shared simulation in Scene.update;
 * the bridge does not create a WebGL context, Scene or animation clock.
 */
export class PhaserStudioGestureBridge {
  private readonly router: StageGestureRouter;
  private readonly abort = new AbortController();
  private disposed = false;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly canvas: HTMLCanvasElement,
    host: PhaserStudioGestureHost,
  ) {
    this.router = new StageGestureRouter({
      pointToUv: (x, y) => host.pointToUv(x, y),
      paintPointToUv: (x, y) => host.paintPointToUv(x, y),
      beginSquish: (pointer) => host.beginSquish(pointer),
      moveSquish: (pointer) => host.moveSquish(pointer),
      endSquish: (id) => host.endSquish(id),
      cancelSquish: () => host.cancelSquish(),
      paintStamp: (point) => host.paintStamp(point),
      paintSegment: (from, to) => host.paintSegment(from, to),
      paintEnd: () => host.paintEnd(),
      addMixin: (point) => host.addMixin(point),
      addSticker: (point) => host.addSticker(point),
      mixProgress: (distance, progress) => host.mixProgress(distance, progress),
    });
    scene.input.on('pointerdown', this.handleDown);
    scene.input.on('pointermove', this.handleMove);
    scene.input.on('pointerup', this.handleUp);
    scene.input.on('pointerupoutside', this.handleUp);
    canvas.addEventListener('pointercancel', this.handleCancel, { signal: this.abort.signal });
    canvas.addEventListener('lostpointercapture', this.handleLostCapture, { signal: this.abort.signal });
    window.addEventListener('blur', this.handleCancel, { signal: this.abort.signal });
    document.addEventListener('visibilitychange', this.handleVisibility, { signal: this.abort.signal });
    window.addEventListener('pagehide', this.handleCancel, { signal: this.abort.signal });
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.dispose, this);
    scene.events.once(Phaser.Scenes.Events.DESTROY, this.dispose, this);
  }

  public setStage(stage: StudioGestureStage, decorSection?: StudioDecorSection): void {
    if (this.disposed) return;
    this.router.setStage(stage, decorSection);
    // Finish is a real tactile preview. UI layers decide which buttons win
    // hit-testing; the canvas itself must stay eligible for the initial grab.
    this.canvas.style.pointerEvents = 'auto';
  }

  public setBlocked(blocked: boolean): void {
    if (!this.disposed) this.router.setBlocked(blocked);
  }

  /** Cancel any captured gesture before changing shape or loading another toy. */
  public cancel(): void {
    if (this.disposed) return;
    this.router.cancel();
  }

  public snapshot(): ReturnType<StageGestureRouter['snapshot']> { return this.router.snapshot(); }

  /**
   * Phaser's cached pointer.x/y can use the initial game dimensions while the
   * original studio changes the canvas CSS size per stage (e.g. 370x556 backing
   * canvas displayed as 296x296 in portrait Decor). Recalculate from the native
   * client event and current bounding rect instead of treating those as equal.
   */
  private readonly point = (pointer: Phaser.Input.Pointer): StagePointer => {
    const rect = this.canvas.getBoundingClientRect();
    const native = pointer.event;
    // TouchEvent is absent on some desktop browsers (notably Firefox without a
    // touch device). An unguarded instanceof throws and drops every mouse gesture.
    const touch = typeof TouchEvent !== 'undefined' && native instanceof TouchEvent
      ? native.changedTouches.item(0) : null;
    const clientX = native instanceof MouseEvent ? native.clientX
      : touch?.clientX ?? rect.left + pointer.x * rect.width / Math.max(1, this.scene.scale.width);
    const clientY = native instanceof MouseEvent ? native.clientY
      : touch?.clientY ?? rect.top + pointer.y * rect.height / Math.max(1, this.scene.scale.height);
    return {
      id: pointer.id,
      x: (clientX - rect.left) * this.scene.scale.width / Math.max(1, rect.width),
      y: (clientY - rect.top) * this.scene.scale.height / Math.max(1, rect.height),
      clientX,
      clientY,
    };
  };

  private readonly handleDown = (pointer: Phaser.Input.Pointer): void => {
    if (this.disposed) return;
    if (!this.router.down(this.point(pointer))) return;
    if (pointer.event instanceof PointerEvent) {
      try { this.canvas.setPointerCapture(pointer.event.pointerId); } catch { /* best effort */ }
    }
  };

  private readonly handleMove = (pointer: Phaser.Input.Pointer): void => {
    if (this.disposed) return;
    if (pointer.id !== this.router.snapshot().owner) return;
    this.router.move(this.point(pointer));
  };

  private readonly handleUp = (pointer: Phaser.Input.Pointer): void => {
    if (this.disposed) return;
    // Phaser emits pointerup for TOUCH_CANCEL too; native pointercancel may
    // already have cleared ownership, but the engine flag must also be honored.
    this.router.up(pointer.id, pointer.wasCanceled);
  };

  private readonly handleCancel = (): void => { this.cancel(); };
  private readonly handleVisibility = (): void => { if (document.hidden) this.cancel(); };
  private readonly handleLostCapture = (): void => {
    if (this.router.snapshot().owner !== null) this.cancel();
  };

  public dispose(): void {
    if (this.disposed) return;
    this.router.cancel();
    this.disposed = true;
    this.abort.abort();
    this.scene.input.off('pointerdown', this.handleDown);
    this.scene.input.off('pointermove', this.handleMove);
    this.scene.input.off('pointerup', this.handleUp);
    this.scene.input.off('pointerupoutside', this.handleUp);
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.dispose, this);
    this.scene.events.off(Phaser.Scenes.Events.DESTROY, this.dispose, this);
  }
}
