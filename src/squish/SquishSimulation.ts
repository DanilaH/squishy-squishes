import { sampleContinuousInteraction } from '@danilah/mini-games-kit/core';
import type { MaterialId } from '../game/content';
import { getShape, isPointInsideShape, type ShapeDefinition } from '../game/shapes';

/** Engine-neutral mesh state. No DOM, WebGL, Phaser or WebAudio dependencies. */
export interface SquishVertexState {
  readonly restX: number;
  readonly restY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  readonly u: number;
  readonly v: number;
}

export interface SquishSimulationSample {
  readonly active: boolean;
  readonly compression: number;
  readonly pressDepth: number;
  readonly normalizedVelocity: number;
  readonly tactileActive: boolean;
  readonly tactileProgress: number;
  readonly maxDisplacement: number;
  readonly gestureX: number;
  readonly gestureY: number;
  readonly sheenX: number;
  readonly sheenY: number;
  readonly squeezes: number;
  readonly stretch: number;
  readonly stroking: number;
  readonly pointers: number;
}

export const SQUISH_GRID_CELLS = 16;
const GRAB_RADIUS = 0.92;
const PRESS_RADIUS = 0.58;
const MAX_POINTER_DISPLACEMENT = 0.92;
const MAX_VERTEX_DISPLACEMENT = 0.72;
const VIEWPORT_FOLLOW_RATIO = 0.22;
const MAX_VIEWPORT_FOLLOW = 0.30;
const VIEWPORT_FOLLOW_ATTACK = 12;
const VIEWPORT_FOLLOW_RELEASE = 7;
const GRAB_STIFFNESS_NEAR = 245;
const GRAB_STIFFNESS_FAR = 92;
const REST_STIFFNESS = 44;
const DAMPING = 10.5;
const VISUAL_COMPRESSION_RELEASE_RATE = DAMPING * 0.5;
const BULGE_STRENGTH = 0.085;
const PRESS_DENT_STRENGTH = 0.14;
const PRESS_RING_BULGE = 0.045;
const PRESS_COMPRESSION_WEIGHT = 0.22;
const PRESS_ATTACK = 12;
const PRESS_RELEASE = 18;
const RELEASE_DRAG_KICK = 1.05;
const RELEASE_PRESS_KICK = 0.24;
const POKE_MAX_TRAVEL = 0.10;
const POKE_MAX_DURATION_MS = 220;
const POKE_REBOUND_KICK = 1.08;
const PINCH_MAX_STRETCH = .45;
const PINCH_MAX_COMPRESSION = .38;
// Resist mesh folding when two fingers abruptly reverse direction.
const PINCH_DAMPING = 30;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const clamp01 = (value: number): number => clamp(value, 0, 1);
const smoothstep01 = (value: number): number => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

export class SquishSimulation {
  public readonly vertices: SquishVertexState[] = [];
  public readonly triangleIndices: Uint16Array;
  public readonly lineIndices: Uint16Array;

  private shape: ShapeDefinition;
  private pointerId: number | null = null;
  private grabStartX = 0;
  private grabStartY = 0;
  private pointerX = 0;
  private pointerY = 0;
  private viewportFollowEnabled = false;
  private bodyOffsetX = 0;
  private bodyOffsetY = 0;
  private grabPointerStartX = 0;
  private grabPointerStartY = 0;
  private grabBodyStartX = 0;
  private grabBodyStartY = 0;
  private sheenX = 0;
  private sheenY = 0;
  private gestureX = 0;
  private gestureY = 0;
  private pressDepth = 0;
  private compression = 0;
  private previousCompression = 0;
  private previousSampleAt: number;
  private normalizedVelocity = 0;
  private maxDisplacement = 0;
  private maxGestureCompression = 0;
  private squeezes = 0;
  private gestureDurationMs = 0;
  private second: { id: number; x: number; y: number; startX: number; startY: number } | null = null;
  private pinchStartX = 0;
  private pinchStartY = 0;
  private multiTouch = false;
  private hadSecond = false;
  private stretch = 0;
  private stroking = 0;
  private motionSpeed = 0;
  private strokeGraceMs = 0;
  private previousPointerX = 0;
  private previousPointerY = 0;
  private material: MaterialId = 'soft';

  public setTactileFeatures(enabled: boolean, material: MaterialId = 'soft'): void {
    if (this.multiTouch && !enabled) this.cancel();
    this.multiTouch = enabled;
    this.material = material;
  }

  public pointerOwner(): number | null { return this.pointerId; }

  public constructor(shape: ShapeDefinition = getShape('soft-square'), startAtMs = 0) {
    this.shape = shape;
    this.previousSampleAt = startAtMs;
    const triangles: number[] = [];
    const lines: number[] = [];
    const row = SQUISH_GRID_CELLS + 1;
    for (let y = 0; y <= SQUISH_GRID_CELLS; y += 1) {
      for (let x = 0; x <= SQUISH_GRID_CELLS; x += 1) {
        const u = x / SQUISH_GRID_CELLS;
        const v = y / SQUISH_GRID_CELLS;
        const restX = u * 2 - 1;
        const restY = v * 2 - 1;
        this.vertices.push({ restX, restY, x: restX, y: restY, vx: 0, vy: 0, u, v });
      }
    }
    for (let y = 0; y < SQUISH_GRID_CELLS; y += 1) {
      for (let x = 0; x < SQUISH_GRID_CELLS; x += 1) {
        const a = y * row + x;
        const b = a + 1;
        const c = a + row;
        const d = c + 1;
        triangles.push(a, c, b, b, c, d);
      }
    }
    for (let y = 0; y <= SQUISH_GRID_CELLS; y += 1) {
      for (let x = 0; x < SQUISH_GRID_CELLS; x += 1) {
        const a = y * row + x;
        lines.push(a, a + 1);
      }
    }
    for (let x = 0; x <= SQUISH_GRID_CELLS; x += 1) {
      for (let y = 0; y < SQUISH_GRID_CELLS; y += 1) {
        const a = y * row + x;
        lines.push(a, a + row);
      }
    }
    this.triangleIndices = new Uint16Array(triangles);
    this.lineIndices = new Uint16Array(lines);
  }

  public setShape(shape: ShapeDefinition): void {
    if (shape.id === this.shape.id) return;
    this.cancel();
    this.bodyOffsetX = 0;
    this.bodyOffsetY = 0;
    this.shape = shape;
  }

  public resetTiming(nowMs: number): void {
    this.previousSampleAt = nowMs;
  }

  /**
   * Pages tactile stages may let the whole soft body chase a captured pointer
   * while the local grab still deforms. The default stays disabled so the
   * ordinary/Yandex renderer preserves its existing interaction contract.
   */
  public setViewportFollowEnabled(enabled: boolean): void {
    if (!enabled && this.viewportFollowEnabled && this.pointerId === null) {
      this.recenterViewportFollow();
    }
    this.viewportFollowEnabled = enabled;
  }

  /** Current whole-body translation used by Pages tactile stages. */
  public viewportFollowOffset(): { readonly x: number; readonly y: number } {
    return { x: this.bodyOffsetX, y: this.bodyOffsetY };
  }

  /**
   * Stage changes are scene boundaries, not part of a drag. Remove only the
   * global viewport translation while preserving local deformation/jiggle.
   * This prevents a fast Finish -> Save -> Squeeze transition from inheriting
   * the previous drag's screen-space offset.
   */
  public recenterViewportFollow(): void {
    const offsetX = this.bodyOffsetX;
    const offsetY = this.bodyOffsetY;
    this.cancel();
    if (Math.hypot(offsetX, offsetY) > 0.00001) {
      let averageVx = 0;
      let averageVy = 0;
      for (const vertex of this.vertices) {
        vertex.x -= offsetX;
        vertex.y -= offsetY;
        averageVx += vertex.vx;
        averageVy += vertex.vy;
      }
      averageVx /= Math.max(1, this.vertices.length);
      averageVy /= Math.max(1, this.vertices.length);
      for (const vertex of this.vertices) {
        // Remove bulk translation velocity but retain relative spring motion.
        vertex.vx -= averageVx;
        vertex.vy -= averageVy;
      }
    }
    this.bodyOffsetX = 0;
    this.bodyOffsetY = 0;
    this.grabBodyStartX = 0;
    this.grabBodyStartY = 0;
  }

  /** Coordinates in [-1, 1], already transformed from client/Phaser pixels by the host. */
  public pointToUv(x: number, y: number): { u: number; v: number } | null {
    const localX = x - this.bodyOffsetX;
    const localY = y - this.bodyOffsetY;
    if (!isPointInsideShape(this.shape, localX, localY)) return null;
    return { u: clamp01(localX * 0.5 + 0.5), v: clamp01(localY * 0.5 + 0.5) };
  }

  /** Project a normalized appearance coordinate through the current deformed mesh. */
  public projectUvToLocal(u: number, v: number): { x: number; y: number } {
    const gridU = clamp01(u) * SQUISH_GRID_CELLS;
    const gridV = clamp01(v) * SQUISH_GRID_CELLS;
    const x0 = Math.min(SQUISH_GRID_CELLS - 1, Math.floor(gridU));
    const y0 = Math.min(SQUISH_GRID_CELLS - 1, Math.floor(gridV));
    const x1 = Math.min(SQUISH_GRID_CELLS, x0 + 1);
    const y1 = Math.min(SQUISH_GRID_CELLS, y0 + 1);
    const tx = gridU - x0;
    const ty = gridV - y0;
    const row = SQUISH_GRID_CELLS + 1;
    const a = this.vertices[y0 * row + x0]!;
    const b = this.vertices[y0 * row + x1]!;
    const c = this.vertices[y1 * row + x0]!;
    const d = this.vertices[y1 * row + x1]!;
    const topX = a.x + (b.x - a.x) * tx;
    const topY = a.y + (b.y - a.y) * tx;
    const bottomX = c.x + (d.x - c.x) * tx;
    const bottomY = c.y + (d.y - c.y) * tx;
    return { x: topX + (bottomX - topX) * ty, y: topY + (bottomY - topY) * ty };
  }

  /** Returns true only when a valid object hit claims this pointer. */
  public begin(pointerId: number, x: number, y: number): boolean {
    const localX = x - this.bodyOffsetX;
    const localY = y - this.bodyOffsetY;
    if (!isPointInsideShape(this.shape, localX, localY)) return false;
    if (this.pointerId !== null) {
      if (!this.multiTouch || this.second || pointerId === this.pointerId) return false;
      if (Math.hypot(x - this.pointerX, y - this.pointerY) < 0.12) return false;
      this.second = { id: pointerId, x, y, startX: x, startY: y };
      this.pinchStartX = this.pointerX;
      this.pinchStartY = this.pointerY;
      this.hadSecond = true;
      return true;
    }
    this.pointerId = pointerId;
    this.grabStartX = localX;
    this.grabStartY = localY;
    this.pointerX = x;
    this.pointerY = y;
    this.grabPointerStartX = x;
    this.grabPointerStartY = y;
    this.grabBodyStartX = this.bodyOffsetX;
    this.grabBodyStartY = this.bodyOffsetY;
    this.maxGestureCompression = 0;
    this.gestureDurationMs = 0;
    this.hadSecond = false;
    this.previousPointerX = x; this.previousPointerY = y;
    this.motionSpeed = 0; this.strokeGraceMs = 0;
    this.sheenX += (localX - this.sheenX) * 0.55;
    this.sheenY += (localY - this.sheenY) * 0.55;
    return true;
  }

  public move(pointerId: number, x: number, y: number): void {
    if (pointerId === this.second?.id) { this.second.x = x; this.second.y = y; return; }
    if (pointerId !== this.pointerId) return;
    this.pointerX = x;
    this.pointerY = y;
  }

  /** Returns tactile release energy; a weak gesture does not count as a squeeze. */
  public end(pointerId: number, pokeOnTap = false): number | null {
    if (this.second && (pointerId === this.pointerId || pointerId === this.second.id)) {
      if (pointerId === this.pointerId) {
        // Transfer ownership without a mesh reset or a credited release.
        this.pointerId = this.second.id;
        this.pointerX = this.second.x; this.pointerY = this.second.y;
        this.grabStartX = this.pointerX - this.bodyOffsetX;
        this.grabStartY = this.pointerY - this.bodyOffsetY;
      }
      this.second = null;
      this.grabPointerStartX = this.pointerX; this.grabPointerStartY = this.pointerY;
      this.grabBodyStartX = this.bodyOffsetX; this.grabBodyStartY = this.bodyOffsetY;
      this.previousPointerX = this.pointerX; this.previousPointerY = this.pointerY;
      return null;
    }
    if (pointerId !== this.pointerId) return null;
    const localPointerX = this.pointerX - this.bodyOffsetX;
    const localPointerY = this.pointerY - this.bodyOffsetY;
    const tapTravel = Math.hypot(localPointerX - this.grabStartX, localPointerY - this.grabStartY);
    const poke = pokeOnTap && !this.hadSecond && tapTravel <= POKE_MAX_TRAVEL && this.gestureDurationMs <= POKE_MAX_DURATION_MS;
    const energy = clamp01(Math.max(this.maxGestureCompression, this.pressDepth * PRESS_COMPRESSION_WEIGHT));
    if (energy >= 0.08) {
      this.squeezes += 1;
      this.applyReleaseImpulse();
    }
    if (poke) this.applyPokeImpulse();
    this.cancel();
    return poke ? Math.max(energy, 0.16) : energy;
  }

  /** A short click creates a local rebound without translating the whole toy. */
  private applyPokeImpulse(): void {
    for (const vertex of this.vertices) {
      const lx = vertex.restX - this.grabStartX;
      const ly = vertex.restY - this.grabStartY;
      const distance = Math.hypot(lx, ly);
      const influence = smoothstep01(1 - distance / PRESS_RADIUS) ** 2;
      if (influence <= 0) continue;
      const inverse = distance > 0.0001 ? 1 / distance : 0;
      const radialX = distance > 0.0001 ? lx * inverse : 0;
      const radialY = distance > 0.0001 ? ly * inverse : 1;
      const kick = POKE_REBOUND_KICK * influence * (0.55 + this.pressDepth * 0.45);
      vertex.vx += radialX * kick;
      vertex.vy += radialY * kick;
    }
  }

  /** Cancel without adding a squeeze or a release impulse. */
  public cancel(): void {
    this.pointerId = null;
    this.second = null;
    this.stroking = 0; this.stretch = 0; this.motionSpeed = 0; this.strokeGraceMs = 0;
  }

  private grabRadius(): number {
    const edge = this.multiTouch ? smoothstep01((Math.hypot(this.grabStartX, this.grabStartY) - .4) / .55) : 0;
    return GRAB_RADIUS * (1 - edge * .28);
  }

  private applyReleaseImpulse(): void {
    let dx = (this.pointerX - this.bodyOffsetX) - this.grabStartX;
    let dy = (this.pointerY - this.bodyOffsetY) - this.grabStartY;
    const magnitude = Math.hypot(dx, dy);
    if (magnitude > MAX_POINTER_DISPLACEMENT) {
      const scale = MAX_POINTER_DISPLACEMENT / magnitude;
      dx *= scale;
      dy *= scale;
    }
    for (const vertex of this.vertices) {
      const lx = vertex.restX - this.grabStartX;
      const ly = vertex.restY - this.grabStartY;
      const distance = Math.hypot(lx, ly);
      const dragInfluence = smoothstep01(1 - distance / this.grabRadius()) ** 2;
      const pressInfluence = smoothstep01(1 - distance / PRESS_RADIUS) ** 2;
      vertex.vx -= dx * dragInfluence * RELEASE_DRAG_KICK;
      vertex.vy -= dy * dragInfluence * RELEASE_DRAG_KICK;
      if (distance > 0.0001) {
        const kick = this.pressDepth * pressInfluence * RELEASE_PRESS_KICK;
        vertex.vx += (lx / distance) * kick;
        vertex.vy += (ly / distance) * kick;
      }
    }
  }

  /** Delta is elapsed milliseconds, not seconds; the host owns the frame clock. */
  public advance(deltaMs: number, nowMs: number): SquishSimulationSample {
    const dt = Math.min(Math.max(0.001, deltaMs / 1000), 1 / 30);
    const active = this.pointerId !== null;
    if (active) this.gestureDurationMs += Math.max(0, deltaMs);
    const speed = active ? Math.hypot(this.pointerX - this.previousPointerX, this.pointerY - this.previousPointerY) / dt : 0;
    this.previousPointerX = this.pointerX; this.previousPointerY = this.pointerY;
    this.motionSpeed += (speed - this.motionSpeed) * (1 - Math.exp(-10 * dt));
    const slowStroke = this.multiTouch && active && !this.second && this.gestureDurationMs > 180
      && this.motionSpeed > .06 && this.motionSpeed < .8
      && Math.hypot(this.pointerX - this.grabPointerStartX, this.pointerY - this.grabPointerStartY) < .32;
    this.strokeGraceMs = slowStroke ? 90 : Math.max(0, this.strokeGraceMs - Math.max(0, deltaMs));
    const keepStroke = slowStroke || (this.strokeGraceMs > 0 && active && !this.second && this.motionSpeed < .8);
    this.stroking += ((keepStroke ? 1 : 0) - this.stroking) * (1 - Math.exp(-8 * dt));
    // Same solver for every silhouette; soft/default retains the reviewed constants.
    const foam = this.multiTouch && this.material === 'marshmallow';
    const jelly = this.multiTouch && this.material === 'jelly';
    const restResponse = foam ? .40 : jelly ? .82 : 1;
    const dampingResponse = foam ? 1.35 : jelly ? .62 : 1;
    const second = this.second;
    const axisX = second ? second.startX - this.pinchStartX : 1;
    const axisY = second ? second.startY - this.pinchStartY : 0;
    const axisLength = Math.max(.12, Math.hypot(axisX, axisY));
    const ux = axisX / axisLength, uy = axisY / axisLength;
    const separation = second ? ((second.x - this.pointerX) * ux + (second.y - this.pointerY) * uy) / axisLength - 1 : 0;
    const pinch = clamp(separation, -PINCH_MAX_COMPRESSION, PINCH_MAX_STRETCH);
    this.stretch = second ? Math.max(0, pinch) / PINCH_MAX_STRETCH : 0;

    let targetBodyX = active && this.viewportFollowEnabled && !second
      ? this.grabBodyStartX + (this.pointerX - this.grabPointerStartX) * VIEWPORT_FOLLOW_RATIO
      : second ? this.bodyOffsetX : 0;
    let targetBodyY = active && this.viewportFollowEnabled && !second
      ? this.grabBodyStartY + (this.pointerY - this.grabPointerStartY) * VIEWPORT_FOLLOW_RATIO
      : second ? this.bodyOffsetY : 0;
    const targetBodyMagnitude = Math.hypot(targetBodyX, targetBodyY);
    if (targetBodyMagnitude > MAX_VIEWPORT_FOLLOW) {
      const scale = MAX_VIEWPORT_FOLLOW / targetBodyMagnitude;
      targetBodyX *= scale;
      targetBodyY *= scale;
    }
    const followRate = active ? VIEWPORT_FOLLOW_ATTACK : VIEWPORT_FOLLOW_RELEASE;
    const followBlend = 1 - Math.exp(-followRate * dt);
    this.bodyOffsetX += (targetBodyX - this.bodyOffsetX) * followBlend;
    this.bodyOffsetY += (targetBodyY - this.bodyOffsetY) * followBlend;
    if (!active && Math.hypot(this.bodyOffsetX, this.bodyOffsetY) < 0.0005) {
      this.bodyOffsetX = 0;
      this.bodyOffsetY = 0;
    }

    const localPointerX = active ? this.pointerX - this.bodyOffsetX : this.grabStartX;
    const localPointerY = active ? this.pointerY - this.bodyOffsetY : this.grabStartY;
    const heldX = second ? this.pinchStartX + ((this.pointerX + second.x) - (this.pinchStartX + second.startX)) * .5 : this.pointerX;
    const heldY = second ? this.pinchStartY + ((this.pointerY + second.y) - (this.pinchStartY + second.startY)) * .5 : this.pointerY;
    let dx = active ? heldX - this.bodyOffsetX - this.grabStartX : 0;
    let dy = active ? heldY - this.bodyOffsetY - this.grabStartY : 0;
    const magnitude = Math.hypot(dx, dy);
    if (magnitude > MAX_POINTER_DISPLACEMENT) {
      const scale = MAX_POINTER_DISPLACEMENT / magnitude;
      dx *= scale;
      dy *= scale;
    }
    const dragMagnitude = Math.hypot(dx, dy);
    const pressBlend = 1 - Math.exp(-(active ? PRESS_ATTACK : PRESS_RELEASE) * dt);
    this.pressDepth += ((active ? 1 - this.stroking * .65 : 0) - this.pressDepth) * pressBlend;
    const dragCompression = active ? clamp01(dragMagnitude / MAX_POINTER_DISPLACEMENT) : 0;
    const target = active ? clamp01(Math.max(dragCompression, Math.abs(pinch), this.pressDepth * PRESS_COMPRESSION_WEIGHT)) : 0;
    if (active) this.compression = target;
    else {
      this.compression += (target - this.compression) * (1 - Math.exp(-VISUAL_COMPRESSION_RELEASE_RATE * dt));
      if (this.compression < 0.0005) this.compression = 0;
    }
    this.maxGestureCompression = Math.max(this.maxGestureCompression, this.compression);
    const targetDirX = active && dragMagnitude > 0.02 ? dx / dragMagnitude : 0;
    const targetDirY = active && dragMagnitude > 0.02 ? dy / dragMagnitude : 0;
    const directionBlend = 1 - Math.exp(-(active ? 11 : 5) * dt);
    this.gestureX += (targetDirX - this.gestureX) * directionBlend;
    this.gestureY += (targetDirY - this.gestureY) * directionBlend;
    const sheenBlend = 1 - Math.exp(-(active ? 9 : 3) * dt);
    this.sheenX += ((active ? localPointerX : 0) - this.sheenX) * sheenBlend;
    this.sheenY += ((active ? localPointerY : 0) - this.sheenY) * sheenBlend;
    const sample = sampleContinuousInteraction(
      this.compression,
      this.previousCompression,
      nowMs,
      this.previousSampleAt,
      { velocityForMax: 4, minActiveProgress: 0.005, minActiveProgressDelta: 0.0005 },
    );
    this.previousCompression = this.compression;
    this.previousSampleAt = nowMs;
    this.normalizedVelocity = sample.normalizedVelocity;

    const gestureMagnitude = Math.max(0.0001, dragMagnitude);
    const gestureDirX = dx / gestureMagnitude;
    const gestureDirY = dy / gestureMagnitude;
    let frameMax = 0;
    for (const vertex of this.vertices) {
      const bodyRestX = vertex.restX + this.bodyOffsetX;
      const bodyRestY = vertex.restY + this.bodyOffsetY;
      let targetX = bodyRestX;
      let targetY = bodyRestY;
      let responseInfluence = 0;
      if (active) {
        const lx = vertex.restX - this.grabStartX;
        const ly = vertex.restY - this.grabStartY;
        const grabDistance = Math.hypot(lx, ly);
        const influence = smoothstep01(1 - grabDistance / this.grabRadius());
        const weighted = influence * influence;
        const pressInfluence = smoothstep01(1 - grabDistance / PRESS_RADIUS) ** 2;
        responseInfluence = Math.max(weighted, pressInfluence * 0.9);
        targetX += dx * weighted - lx * pressInfluence * this.pressDepth * PRESS_DENT_STRENGTH;
        targetY += dy * weighted - ly * pressInfluence * this.pressDepth * PRESS_DENT_STRENGTH;
        if (grabDistance > 0.0001) {
          const rx = lx / grabDistance;
          const ry = ly / grabDistance;
          const ring = smoothstep01(1 - Math.abs(grabDistance - PRESS_RADIUS * 0.72) / (PRESS_RADIUS * 0.38));
          const bulge = ring * this.pressDepth * PRESS_RING_BULGE * (1 - pressInfluence * 0.65);
          targetX += rx * bulge;
          targetY += ry * bulge;
        }
        const radialLength = Math.max(0.0001, Math.hypot(vertex.restX, vertex.restY));
        const radialX = vertex.restX / radialLength;
        const radialY = vertex.restY / radialLength;
        const sideWeight = 1 - Math.abs(radialX * gestureDirX + radialY * gestureDirY);
        const bulge = dragCompression * BULGE_STRENGTH * sideWeight * (1 - weighted * 0.75);
        targetX += radialX * bulge;
        targetY += radialY * bulge;
      }
      if (second) {
        // Axial stretch/compression with sideways bulge.
        // Bounded common field; the canonical mesh/UVs and silhouette stay shared.
        const along = vertex.restX * ux + vertex.restY * uy;
        const across = -vertex.restX * uy + vertex.restY * ux;
        const sideways = -pinch * .45;
        targetX += ux * along * pinch - uy * across * sideways;
        targetY += uy * along * pinch + ux * across * sideways;
        responseInfluence = Math.max(responseInfluence, .65);
      }
      const stiffness = active ? GRAB_STIFFNESS_FAR + (GRAB_STIFFNESS_NEAR - GRAB_STIFFNESS_FAR) * responseInfluence : 0;
      const dampingRate = second ? PINCH_DAMPING : DAMPING * dampingResponse;
      const damping = Math.exp(-(dampingRate * (0.88 + responseInfluence * 0.12)) * dt);
      const ax = (targetX - vertex.x) * stiffness + (bodyRestX - vertex.x) * REST_STIFFNESS * restResponse;
      const ay = (targetY - vertex.y) * stiffness + (bodyRestY - vertex.y) * REST_STIFFNESS * restResponse;
      vertex.vx = (vertex.vx + ax * dt) * damping;
      vertex.vy = (vertex.vy + ay * dt) * damping;
      vertex.x += vertex.vx * dt;
      vertex.y += vertex.vy * dt;
      const deformationX = vertex.x - bodyRestX;
      const deformationY = vertex.y - bodyRestY;
      const deformation = Math.hypot(deformationX, deformationY);
      if (deformation > MAX_VERTEX_DISPLACEMENT) {
        const scale = MAX_VERTEX_DISPLACEMENT / deformation;
        vertex.x = bodyRestX + deformationX * scale;
        vertex.y = bodyRestY + deformationY * scale;
        vertex.vx *= 0.55;
        vertex.vy *= 0.55;
      }
      // maxDisplacement is the deformation contract, not screen-space travel.
      // Whole-body viewport follow is published separately by the Pages adapter.
      frameMax = Math.max(frameMax, deformation);
    }
    this.maxDisplacement = frameMax;
    return {
      active, compression: this.compression, pressDepth: this.pressDepth,
      normalizedVelocity: this.normalizedVelocity,
      tactileActive: sample.active || this.stroking > .2, tactileProgress: Math.max(sample.progress, this.stroking * .08),
      maxDisplacement: this.maxDisplacement, gestureX: this.gestureX,
      gestureY: this.gestureY, sheenX: this.sheenX, sheenY: this.sheenY,
      squeezes: this.squeezes, stretch: this.stretch, stroking: this.stroking, pointers: this.pointerId === null ? 0 : this.second ? 2 : 1,
    };
  }

  public snapshot(): SquishSimulationSample {
    return {
      active: this.pointerId !== null,
      compression: this.compression,
      pressDepth: this.pressDepth,
      normalizedVelocity: this.normalizedVelocity,
      tactileActive: false,
      tactileProgress: this.compression,
      maxDisplacement: this.maxDisplacement,
      gestureX: this.gestureX,
      gestureY: this.gestureY,
      sheenX: this.sheenX,
      sheenY: this.sheenY,
      squeezes: this.squeezes, stretch: this.stretch, stroking: this.stroking, pointers: this.pointerId === null ? 0 : this.second ? 2 : 1,
    };
  }
}
