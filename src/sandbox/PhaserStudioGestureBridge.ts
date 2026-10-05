import Phaser from 'phaser';
import { StageGestureRouter, type StageGestureHost, type StagePointer, type StudioDecorSection, type StudioGestureStage } from './StageGestureRouter';

/** The Phaser scene supplies its own shared simulation; the bridge never creates one. */
export interface PhaserStudioGestureHost extends Omit<StageGestureHost, 'beginSquish' | 'moveSquish' | 'endSquish'> {
  beginSquish(pointer: StagePointer): boolean;
  moveSquish(pointer: StagePointer): void;
  endSquish(pointerId: number, inputTime?: number): void;
}

/**
 * Single Phaser.Input owner for one playfield. The stage router delegates
 * authoring to the existing studio, and never attaches a second DOM pointer
 * handler. Native pointer capture retains mouse movement; the existing Phaser
 * touch listener is extended for owned tactile gestures outside the playfield.
 * Native interruption listeners cancel gestures Phaser may not end.
 *
 * A caller owns the Phaser.Game and advances the shared simulation in Scene.update;
 * the bridge does not create a WebGL context, Scene or animation clock.
 */
export class PhaserStudioGestureBridge {
  private readonly router: StageGestureRouter;
  private readonly abort = new AbortController();
  private disposed = false;
  private readonly releasedNativePointers = new Set<number>();
  private nativeMouseId: number | null = null;
  private restoreTouchMove: (() => void) | null = null;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly canvas: HTMLCanvasElement,
    host: PhaserStudioGestureHost,
  ) {
    this.router = new StageGestureRouter({
      pointToUv: (x, y) => host.pointToUv(x, y),
      paintPointToUv: (x, y) => host.paintPointToUv(x, y),
      beginSecondSquish: (pointer) => host.beginSecondSquish?.(pointer) ?? false,
      beginSquish: (pointer) => host.beginSquish(pointer),
      moveSquish: (pointer) => host.moveSquish(pointer),
      endSquish: (id, inputTime) => host.endSquish(id, inputTime),
      cancelSquish: () => host.cancelSquish(),
      beginDecorEdit: pointer => host.beginDecorEdit?.(pointer) ?? false,
      moveDecorEdit: pointer => host.moveDecorEdit?.(pointer),
      endDecorEdit: cancelled => host.endDecorEdit?.(cancelled),
      authoringBegin: () => host.authoringBegin?.(),
      authoringEnd: () => host.authoringEnd?.(),
      paintStamp: (point) => host.paintStamp(point),
      paintSegment: (from, to) => host.paintSegment(from, to),
      paintEnd: () => host.paintEnd(),
      mixinSpacing: () => host.mixinSpacing?.() ?? 24,
      addMixin: (point) => host.addMixin(point),
      addSticker: (point) => host.addSticker(point),
      ...(host.previewSticker ? { previewSticker: (point) => host.previewSticker?.(point) } : {}),
      mixProgress: (distance, progress) => host.mixProgress(distance, progress),
    });
    scene.input.on('pointerdown', this.handleDown);
    scene.input.on('pointermove', this.handleMove);
    scene.input.on('pointerup', this.handleUp);
    scene.input.on('pointerupoutside', this.handleUp);
    // Touch implicitly loses capture before Phaser receives touchend. Remember
    // a normal native release only to classify that interruption; Phaser still
    // exclusively owns the actual gesture end and authoring callbacks.
    canvas.addEventListener('pointerdown', (event) => {
      this.releasedNativePointers.delete(event.pointerId);
      if (event.pointerType !== 'touch') this.nativeMouseId = event.pointerId;
    }, { signal: this.abort.signal });
    canvas.addEventListener('pointerup', (event) => { this.releasedNativePointers.add(event.pointerId); }, { signal: this.abort.signal });
    canvas.addEventListener('pointercancel', this.handleCancel, { signal: this.abort.signal });
    canvas.addEventListener('lostpointercapture', this.handleLostCapture, { signal: this.abort.signal });
    // Phaser 4 drops touchmove when elementFromPoint is not its canvas,
    // even for an already-owned native touch. Extend its one existing listener
    // only for captured tactile pointers; authoring keeps the engine behaviour.
    const touchManager = scene.input.manager.touch;
    if (touchManager) {
      const originalMove = touchManager.onTouchMove as (event: TouchEvent) => void;
      const capturedMove = (event: TouchEvent): void => {
        originalMove(event);
        const state = this.router.snapshot();
        if (this.disposed || state.blocked || (state.stage !== 'finish' && state.stage !== 'squeeze')) return;
        for (const touch of Array.from(event.changedTouches)) {
          if (document.elementFromPoint(touch.clientX, touch.clientY) === canvas) continue;
          const pointer = scene.input.manager.pointers.find(p => p.active && p.identifier === touch.identifier);
          if (!pointer || (pointer.id !== state.owner && pointer.id !== state.secondOwner)) continue;
          const rect = canvas.getBoundingClientRect();
          this.router.move({ id: pointer.id, x: (touch.clientX - rect.left) * scene.scale.width / Math.max(1, rect.width),
            y: (touch.clientY - rect.top) * scene.scale.height / Math.max(1, rect.height), clientX: touch.clientX, clientY: touch.clientY, inputTime: event.timeStamp > 1e12 ? event.timeStamp - performance.timeOrigin : event.timeStamp });
        }
      };
      canvas.removeEventListener('touchmove', originalMove);
      touchManager.onTouchMove = capturedMove;
      canvas.addEventListener('touchmove', capturedMove, { passive: false });
      this.restoreTouchMove = () => {
        canvas.removeEventListener('touchmove', capturedMove);
        touchManager.onTouchMove = originalMove;
        canvas.addEventListener('touchmove', originalMove, { passive: false });
      };
    }
    window.addEventListener('blur', this.handleCancel, { signal: this.abort.signal });
    document.addEventListener('visibilitychange', this.handleVisibility, { signal: this.abort.signal });
    window.addEventListener('pagehide', this.handleCancel, { signal: this.abort.signal });
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.dispose, this);
    scene.events.once(Phaser.Scenes.Events.DESTROY, this.dispose, this);
  }

  public setStage(stage: StudioGestureStage, decorSection?: StudioDecorSection): void {
    if (this.disposed) return;
    const previous = this.router.snapshot();
    this.router.setStage(stage, decorSection);
    if (previous.owner !== null && this.router.snapshot().owner === null) this.releaseCapture();
    // Finish is a real tactile preview. UI layers decide which buttons win
    // hit-testing; the canvas itself must stay eligible for the initial grab.
    this.canvas.style.pointerEvents = 'auto';
  }

  public setBlocked(blocked: boolean): void {
    if (!this.disposed) { this.router.setBlocked(blocked); if (blocked) this.releaseCapture(); }
  }

  /** Cancel any captured gesture before changing shape or loading another toy. */
  public cancel(): void {
    if (this.disposed) return;
    this.router.cancel();
    this.releaseCapture();
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
      ? Array.from(native.changedTouches).find((touch) => touch.identifier === pointer.identifier) ?? null : null;
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
      inputTime: this.eventTime(pointer),
    };
  };

  private eventTime(pointer: Phaser.Input.Pointer): number {
    const stamp = pointer.event?.timeStamp;
    return Number.isFinite(stamp) && stamp > 0 ? stamp > 1e12 ? stamp - performance.timeOrigin : stamp : performance.now();
  }

  private readonly handleDown = (pointer: Phaser.Input.Pointer): void => {
    if (this.disposed) return;
    if (!this.router.down(this.point(pointer))) return;
    const nativeId = pointer.event instanceof PointerEvent ? pointer.event.pointerId
      : pointer.event instanceof MouseEvent ? this.nativeMouseId : null;
    if (nativeId !== null) {
      try { this.canvas.setPointerCapture(nativeId); } catch { /* pointer already released */ }
    }
  };

  private readonly handleMove = (pointer: Phaser.Input.Pointer): void => {
    if (this.disposed) return;
    this.router.move(this.point(pointer));
  };

  private readonly handleUp = (pointer: Phaser.Input.Pointer): void => {
    if (this.disposed) return;
    // Phaser emits pointerup for TOUCH_CANCEL too; native pointercancel may
    // already have cleared ownership, but the engine flag must also be honored.
    this.router.up(pointer.id, pointer.wasCanceled, this.eventTime(pointer));
    if (this.router.snapshot().owner === null) this.releaseCapture();
  };

  private releaseCapture(): void {
    const id = this.nativeMouseId; this.nativeMouseId = null;
    if (id !== null && this.canvas.hasPointerCapture(id)) {
      try { this.canvas.releasePointerCapture(id); } catch { /* native cancellation */ }
    }
  }

  private readonly handleCancel = (): void => { this.cancel(); };
  private readonly handleVisibility = (): void => { if (document.hidden) this.cancel(); };
  private readonly handleLostCapture = (event: PointerEvent): void => {
    if (this.releasedNativePointers.delete(event.pointerId)) {
      return;
    }
    if (this.router.snapshot().owner !== null) this.cancel();
  };

  public dispose(): void {
    if (this.disposed) return;
    this.router.cancel();
    this.releaseCapture();
    this.disposed = true;
    this.abort.abort();
    this.restoreTouchMove?.(); this.restoreTouchMove = null;
    this.scene.input.off('pointerdown', this.handleDown);
    this.scene.input.off('pointermove', this.handleMove);
    this.scene.input.off('pointerup', this.handleUp);
    this.scene.input.off('pointerupoutside', this.handleUp);
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.dispose, this);
    this.scene.events.off(Phaser.Scenes.Events.DESTROY, this.dispose, this);
  }
}
