import type { AppearancePoint } from './appearance';

export type StudioGestureStage = 'home' | 'shape' | 'paint' | 'mixins' | 'mix' | 'decor' | 'finish' | 'squeeze';
export type StudioDecorSection = 'face' | 'stickers' | 'accessory';

/** x/y are the Phaser canvas CSS-pixel coordinates; clientX/Y are viewport CSS pixels. */
export interface StagePointer {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly clientX: number;
  readonly clientY: number;
}

export interface StageGestureHost {
  /** Return null outside the canonical shape. Used by physical/sticker/mix-in hit tests. */
  pointToUv(x: number, y: number): AppearancePoint | null;
  /** Paint may author in the full appearance texture so the brush footprint can feather over the silhouette edge. */
  paintPointToUv(x: number, y: number): AppearancePoint | null;
  beginSquish(pointer: StagePointer): boolean;
  moveSquish(pointer: StagePointer): void;
  endSquish(pointerId: number): void;
  cancelSquish(): void;
  paintStamp(point: AppearancePoint): void;
  paintSegment(from: AppearancePoint, to: AppearancePoint): void;
  paintEnd(): void;
  addMixin(point: AppearancePoint): void;
  addSticker(point: AppearancePoint): void;
  mixProgress(distancePx: number, progress: number): void;
}

export const MIX_DISTANCE_FOR_COMPLETE_PX = 1_650;
export const MIXIN_SPACING_PX = 24;
const PAINT_MIN_UV_DISTANCE = 0.004;
const MAX_MIX_STEP_PX = 160;

/**
 * One owner for one stage gesture. Phaser is the only pointer source; studio
 * callbacks author the *existing* Appearance/Decor documents. In particular,
 * Paint owns an outside down so a stroke may start on entering the silhouette.
 * No DOM canvas listeners and no second physics implementation are needed.
 */
export class StageGestureRouter {
  private stage: StudioGestureStage = 'shape';
  private decorSection: StudioDecorSection = 'face';
  private blocked = false;
  private owner: number | null = null;
  private squishOwner: number | null = null;
  private lastUv: AppearancePoint | null = null;
  private lastClientX = 0;
  private lastClientY = 0;
  private mixDistance = 0;

  public constructor(private readonly host: StageGestureHost) {}

  public setStage(stage: StudioGestureStage, decorSection: StudioDecorSection = this.decorSection): void {
    if (stage !== this.stage || decorSection !== this.decorSection) this.cancel();
    // A new toy resets Mix; revisiting an earlier creative stage does not.
    if (stage === 'shape' && (this.stage === 'home' || this.stage === 'squeeze')) {
      this.mixDistance = 0;
    }
    if (stage === 'mix' && this.stage !== 'mix') {
      this.host.mixProgress(this.mixDistance, Math.min(1, this.mixDistance / MIX_DISTANCE_FOR_COMPLETE_PX));
    }
    this.stage = stage;
    this.decorSection = decorSection;
  }

  public setBlocked(blocked: boolean): void {
    if (blocked && !this.blocked) this.cancel();
    this.blocked = blocked;
  }

  /** Whether this canvas event belongs to the stage, for pointer capture. */
  public down(pointer: StagePointer): boolean {
    if (this.blocked || this.owner !== null) return false;
    const point = this.host.pointToUv(pointer.x, pointer.y);
    if (this.stage === 'paint') {
      const paintPoint = this.host.paintPointToUv(pointer.x, pointer.y);
      this.owner = pointer.id; // IMPORTANT: outside down still belongs to Paint.
      this.lastUv = paintPoint;
      if (paintPoint) this.host.paintStamp(paintPoint);
      return true;
    }
    if (this.stage === 'mixins') {
      if (!point) return false;
      this.owner = pointer.id;
      this.lastClientX = pointer.clientX;
      this.lastClientY = pointer.clientY;
      this.host.addMixin(point);
      return true;
    }
    if (this.stage === 'decor' && this.decorSection === 'stickers') {
      if (!point) return false;
      this.owner = pointer.id;
      this.host.addSticker(point);
      return true;
    }
    if (this.stage === 'mix') {
      this.owner = pointer.id; // Original Mix counts movement even if down misses shape.
      this.lastClientX = pointer.clientX;
      this.lastClientY = pointer.clientY;
      if (this.host.beginSquish(pointer)) this.squishOwner = pointer.id;
      return true;
    }
    if (this.stage === 'finish' || this.stage === 'squeeze') {
      if (!this.host.beginSquish(pointer)) return false; // Invalid hits cannot squeeze.
      this.owner = pointer.id;
      this.squishOwner = pointer.id;
      return true;
    }
    // Shape/Home and non-sticker Decor never claim the playfield.
    return false;
  }

  public move(pointer: StagePointer): void {
    if (this.blocked || pointer.id !== this.owner) return;
    if (this.stage === 'paint') {
      const point = this.host.paintPointToUv(pointer.x, pointer.y);
      if (!point) {
        if (this.lastUv) this.host.paintEnd(); // Exit splits the stroke, no outside drawing.
        this.lastUv = null;
        return;
      }
      const previous = this.lastUv;
      if (!previous) this.host.paintStamp(point);
      else if (Math.hypot(point.u - previous.u, point.v - previous.v) < PAINT_MIN_UV_DISTANCE) return;
      else this.host.paintSegment(previous, point);
      this.lastUv = point;
      return;
    }
    if (this.stage === 'mixins') {
      if (Math.hypot(pointer.clientX - this.lastClientX, pointer.clientY - this.lastClientY) < MIXIN_SPACING_PX) return;
      const point = this.host.pointToUv(pointer.x, pointer.y);
      if (!point) return;
      this.lastClientX = pointer.clientX;
      this.lastClientY = pointer.clientY;
      this.host.addMixin(point);
      return;
    }
    if (this.stage === 'mix') {
      if (this.squishOwner === pointer.id) this.host.moveSquish(pointer);
      const distance = Math.hypot(pointer.clientX - this.lastClientX, pointer.clientY - this.lastClientY);
      this.lastClientX = pointer.clientX;
      this.lastClientY = pointer.clientY;
      if (distance <= 0 || distance > MAX_MIX_STEP_PX) return;
      this.mixDistance += distance;
      this.host.mixProgress(this.mixDistance, Math.min(1, this.mixDistance / MIX_DISTANCE_FOR_COMPLETE_PX));
      return;
    }
    if ((this.stage === 'finish' || this.stage === 'squeeze') && this.squishOwner === pointer.id) this.host.moveSquish(pointer);
  }

  /** Native pointercancel, focus loss and activity blockers must never credit a squeeze. */
  public up(pointerId: number, cancelled = false): void {
    if (pointerId !== this.owner) return;
    if (this.stage === 'paint' && this.lastUv) this.host.paintEnd();
    if (this.squishOwner === pointerId) {
      if (cancelled) this.host.cancelSquish();
      else this.host.endSquish(pointerId);
    }
    this.owner = null;
    this.squishOwner = null;
    this.lastUv = null;
  }

  public cancel(): void {
    if (this.owner !== null) this.up(this.owner, true);
    else this.host.cancelSquish();
  }

  public snapshot(): { readonly stage: StudioGestureStage; readonly owner: number | null; readonly squishOwner: number | null; readonly mixDistance: number; readonly blocked: boolean } {
    return { stage: this.stage, owner: this.owner, squishOwner: this.squishOwner, mixDistance: this.mixDistance, blocked: this.blocked };
  }
}
