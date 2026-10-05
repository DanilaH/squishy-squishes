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
  private second: { id: number; x: number; y: number; startX: number; startY: number; anchorX: number; anchorY: number } | null = null;
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
  private readonly previousField = new Float32Array((SQUISH_GRID_CELLS + 1) ** 2 * 2);
  private readonly capturedField = new Float32Array((SQUISH_GRID_CELLS + 1) ** 2 * 2);
  private readonly foamMemory = new Float32Array((SQUISH_GRID_CELLS + 1) ** 2 * 2);
  private foamMemoryWeight = 0;
  private capturedX = 0;
  private capturedY = 0;

  public setTactileFeatures(enabled: boolean, material: MaterialId = 'soft'): void {
    if (material !== this.material) this.foamMemoryWeight = 0;
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

  /** Inverse of the actual rendered triangles, clipped by canonical pigment UVs.
   * Called on grab only; authoring keeps the static pointToUv convention. */
  public surfacePointToUv(x: number, y: number, edgeTolerance = 0): { u: number; v: number } | null {
    for (let i = 0; i < this.triangleIndices.length; i += 3) {
      const a = this.vertices[this.triangleIndices[i]!]!, b = this.vertices[this.triangleIndices[i + 1]!]!, c = this.vertices[this.triangleIndices[i + 2]!]!;
      const bx = b.x - a.x, by = b.y - a.y, cx = c.x - a.x, cy = c.y - a.y;
      const determinant = bx * cy - by * cx;
      if (Math.abs(determinant) < 1e-9) continue;
      const px = x - a.x, py = y - a.y;
      const wb = (px * cy - py * cx) / determinant, wc = (bx * py - by * px) / determinant;
      if (wb < -1e-7 || wc < -1e-7 || wb + wc > 1 + 1e-7) continue;
      const u = a.u + (b.u - a.u) * wb + (c.u - a.u) * wc;
      const v = a.v + (b.v - a.v) * wb + (c.v - a.v) * wc;
      if (isPointInsideShape(this.shape, u * 2 - 1, v * 2 - 1)) return { u: clamp01(u), v: clamp01(v) };
    }
    if (!(edgeTolerance > 0)) return null;
    let closest = edgeTolerance ** 2, result: { u: number; v: number } | null = null;
    const boundary = this.shape.boundary;
    for (let i = 0; i < boundary.length; i++) {
      const a = boundary[i]!, b = boundary[(i + 1) % boundary.length]!;
      const pa = this.projectUvToLocal(a.x * .5 + .5, a.y * .5 + .5), pb = this.projectUvToLocal(b.x * .5 + .5, b.y * .5 + .5);
      const dx = pb.x - pa.x, dy = pb.y - pa.y;
      const t = clamp01(((x - pa.x) * dx + (y - pa.y) * dy) / Math.max(1e-9, dx * dx + dy * dy));
      const distance = (x - pa.x - dx * t) ** 2 + (y - pa.y - dy * t) ** 2;
      if (distance <= closest) { closest = distance; result = { u: (a.x + (b.x - a.x) * t) * .5 + .5, v: (a.y + (b.y - a.y) * t) * .5 + .5 }; }
    }
    return result;
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
    // Match the a/c/b and b/c/d GPU triangles, rather than a bilinear quad.
    return tx + ty <= 1
      ? { x: a.x + (b.x - a.x) * tx + (c.x - a.x) * ty, y: a.y + (b.y - a.y) * tx + (c.y - a.y) * ty }
      : { x: d.x + (c.x - d.x) * (1 - tx) + (b.x - d.x) * (1 - ty), y: d.y + (c.y - d.y) * (1 - tx) + (b.y - d.y) * (1 - ty) };
  }

  /** Returns true only when a valid object hit claims this pointer. */
  public begin(pointerId: number, x: number, y: number, edgeTolerance = 0): boolean {
    const hit = this.multiTouch ? this.surfacePointToUv(x, y, edgeTolerance) : this.pointToUv(x, y);
    if (!hit) return false;
    const localX = hit.u * 2 - 1, localY = hit.v * 2 - 1;
    if (this.pointerId !== null) {
      if (!this.multiTouch || this.second || pointerId === this.pointerId) return false;
      if (Math.hypot(x - this.pointerX, y - this.pointerY) < 0.12) return false;
      this.second = { id: pointerId, x, y, startX: x, startY: y, anchorX: localX, anchorY: localY };
      this.pinchStartX = this.pointerX;
      this.pinchStartY = this.pointerY;
      this.hadSecond = true;
      this.captureField();
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
    this.captureField();
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
        this.grabStartX = this.second.anchorX;
        this.grabStartY = this.second.anchorY;
      }
      this.second = null;
      this.grabPointerStartX = this.pointerX; this.grabPointerStartY = this.pointerY;
      this.grabBodyStartX = this.bodyOffsetX; this.grabBodyStartY = this.bodyOffsetY;
      this.captureField();
      this.previousPointerX = this.pointerX; this.previousPointerY = this.pointerY;
      return null;
    }
    if (pointerId !== this.pointerId) return null;
    const tapTravel = Math.hypot(this.pointerX - this.grabPointerStartX, this.pointerY - this.grabPointerStartY);
    const poke = pokeOnTap && !this.hadSecond && tapTravel <= POKE_MAX_TRAVEL && this.gestureDurationMs <= POKE_MAX_DURATION_MS;
    const energy = clamp01(Math.max(this.maxGestureCompression, this.pressDepth * PRESS_COMPRESSION_WEIGHT));
    if (energy >= 0.08) {
      this.squeezes += 1;
      if (!poke || !this.multiTouch) this.applyReleaseImpulse();
    }
    if (poke) this.applyPokeImpulse();
    const rememberFoam = this.multiTouch && this.material === 'marshmallow' && this.gestureDurationMs > 350;
    this.cancel();
    if (rememberFoam) {
      this.foamMemoryWeight = .28;
      for (let i = 0; i < this.vertices.length; i++) {
        const vertex = this.vertices[i]!;
        this.foamMemory[i * 2] = vertex.x - vertex.restX - this.bodyOffsetX;
        this.foamMemory[i * 2 + 1] = vertex.y - vertex.restY - this.bodyOffsetY;
      }
    }
    return poke ? Math.max(energy, 0.16) : energy;
  }

  /** A short click creates a local rebound without translating the whole toy. */
  private applyPokeImpulse(): void {
    for (const vertex of this.vertices) {
      const lx = vertex.restX - this.grabStartX;
      const ly = vertex.restY - this.grabStartY;
      const distance = Math.hypot(lx, ly);
      const influence = smoothstep01(1 - distance / this.pressRadius()) ** 2;
      if (influence <= 0) continue;
      const inverse = distance > 0.0001 ? 1 / distance : 0;
      const radialX = distance > 0.0001 ? lx * inverse : 0;
      const radialY = distance > 0.0001 ? ly * inverse : 1;
      const kick = POKE_REBOUND_KICK * (this.multiTouch && this.material === 'chrome' ? .35 : 1) * influence * (0.55 + this.pressDepth * 0.45);
      vertex.vx += radialX * kick;
      vertex.vy += radialY * kick;
    }
  }

  /** Cancel without adding a squeeze or a release impulse. */
  public cancel(): void {
    this.foamMemoryWeight = 0;
    this.pointerId = null;
    this.second = null;
    this.stroking = 0; this.stretch = 0; this.motionSpeed = 0; this.strokeGraceMs = 0;
  }

  private grabRadius(): number {
    const edge = this.multiTouch ? smoothstep01((Math.hypot(this.grabStartX, this.grabStartY) - .4) / .55) : 0;
    return GRAB_RADIUS * (1 - edge * .28);
  }

  private pressRadius(): number { return this.multiTouch ? this.material === 'chrome' ? .32 : .46 : PRESS_RADIUS; }

  private captureField(): void {
    this.capturedX = this.pointerX - this.bodyOffsetX - this.grabStartX;
    this.capturedY = this.pointerY - this.bodyOffsetY - this.grabStartY;
    for (let i = 0; i < this.vertices.length; i++) {
      const vertex = this.vertices[i]!;
      this.capturedField[i * 2] = vertex.x - vertex.restX - this.bodyOffsetX;
      this.capturedField[i * 2 + 1] = vertex.y - vertex.restY - this.bodyOffsetY;
    }
  }

  /** Linear near the hand, then continuously increasing resistance. */
  private resistedTravel(distance: number): number {
    if (!this.multiTouch) return Math.min(distance, MAX_POINTER_DISPLACEMENT);
    const metallic = this.material === 'chrome', jelly = this.material === 'jelly';
    const knee = metallic ? .06 : jelly ? 1.2 : .65;
    const limit = metallic ? .32 : jelly ? 3.1 : 1;
    if (distance <= knee) return distance;
    const reserve = limit - knee, excess = distance - knee;
    return knee + reserve * excess / (reserve + excess);
  }

  private applyReleaseImpulse(): void {
    let dx = (this.pointerX - this.bodyOffsetX) - this.grabStartX;
    let dy = (this.pointerY - this.bodyOffsetY) - this.grabStartY;
    if (this.multiTouch) { dx -= this.capturedX; dy -= this.capturedY; }
    const magnitude = Math.hypot(dx, dy);
    if (magnitude > 0) {
      const scale = this.resistedTravel(magnitude) / magnitude;
      dx *= scale;
      dy *= scale;
    }
    for (const vertex of this.vertices) {
      const lx = vertex.restX - this.grabStartX;
      const ly = vertex.restY - this.grabStartY;
      const distance = Math.hypot(lx, ly);
      const dragInfluence = smoothstep01(1 - distance / this.grabRadius()) ** 2;
      const pressInfluence = smoothstep01(1 - distance / this.pressRadius()) ** 2;
      vertex.vx -= dx * dragInfluence * RELEASE_DRAG_KICK * (this.multiTouch && this.material === 'chrome' ? .3 : 1);
      vertex.vy -= dy * dragInfluence * RELEASE_DRAG_KICK * (this.multiTouch && this.material === 'chrome' ? .3 : 1);
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
    const metallic = this.multiTouch && this.material === 'chrome';
    const restResponse = foam ? .40 : jelly ? .95 : metallic ? 2.3 : 1;
    const dampingResponse = foam ? 1.35 : jelly ? .48 : metallic ? 1.8 : 1;
    this.foamMemoryWeight *= Math.exp(-dt / .55);
    if (this.foamMemoryWeight < .0001) this.foamMemoryWeight = 0;
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
    const bodyLimit = metallic ? .08 : MAX_VIEWPORT_FOLLOW;
    if (targetBodyMagnitude > bodyLimit) {
      const scale = bodyLimit / targetBodyMagnitude;
      targetBodyX *= scale;
      targetBodyY *= scale;
    }
    // The workshop surface supplies the same generic floor for every mold.
    // Upward travel stays free; downward body travel meets the tabletop.
    if (this.viewportFollowEnabled) targetBodyY = Math.max(-.08, targetBodyY);
    const floor = Math.min(...this.shape.boundary.map(point => point.y)) - .10;
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
    if (active && this.multiTouch) { dx -= this.capturedX; dy -= this.capturedY; }
    const magnitude = Math.hypot(dx, dy);
    if (magnitude > 0) {
      const scale = this.resistedTravel(magnitude) / magnitude;
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
    this.sheenX += ((active ? this.multiTouch ? this.grabStartX : localPointerX : 0) - this.sheenX) * sheenBlend;
    this.sheenY += ((active ? this.multiTouch ? this.grabStartY : localPointerY : 0) - this.sheenY) * sheenBlend;
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
    if (this.multiTouch) for (let i = 0; i < this.vertices.length; i++) {
      const vertex = this.vertices[i]!;
      this.previousField[i * 2] = vertex.x - vertex.restX;
      this.previousField[i * 2 + 1] = vertex.y - vertex.restY;
    }
    let frameMax = 0;
    for (let index = 0; index < this.vertices.length; index++) {
      const vertex = this.vertices[index]!;
      const bodyRestX = vertex.restX + this.bodyOffsetX;
      const bodyRestY = vertex.restY + this.bodyOffsetY;
      let targetX = bodyRestX;
      let targetY = bodyRestY;
      let heldRestX = bodyRestX, heldRestY = bodyRestY;
      if (!active && foam && this.foamMemoryWeight) {
        heldRestX += this.foamMemory[index * 2]! * this.foamMemoryWeight;
        heldRestY += this.foamMemory[index * 2 + 1]! * this.foamMemoryWeight;
      }
      let responseInfluence = 0;
      if (active) {
        const lx = vertex.restX - this.grabStartX;
        const ly = vertex.restY - this.grabStartY;
        const grabDistance = Math.hypot(lx, ly);
        const influence = smoothstep01(1 - grabDistance / this.grabRadius());
        const longPull = jelly && !second ? smoothstep01((dragMagnitude - .08) / .22) : 0;
        const along = lx * gestureDirX + ly * gestureDirY;
        const across = -lx * gestureDirY + ly * gestureDirX;
        // Monotone along the pull: extending the tip must not fold the grid
        // beyond it back toward the root. The transverse falloff stays local.
        const tetherWeight = smoothstep01(1 + along / .9) ** 2 * Math.exp(-((across / .52) ** 2));
        const weighted = influence * influence * (1 - longPull) + tetherWeight * longPull;
        if (this.multiTouch) {
          // Preserve the caught deformation locally. Away from the grab it
          // blends back to rest, without resetting a returning mesh on down.
          const keep = weighted + (1 - weighted) * Math.exp(-this.gestureDurationMs / 180);
          heldRestX += this.capturedField[index * 2]! * keep;
          heldRestY += this.capturedField[index * 2 + 1]! * keep;
          targetX = heldRestX; targetY = heldRestY;
        }
        const pressRadius = this.pressRadius();
        const pressInfluence = smoothstep01(1 - grabDistance / pressRadius) ** 2;
        const dent = metallic ? .065 : this.multiTouch ? .20 : PRESS_DENT_STRENGTH;
        responseInfluence = Math.max(weighted, pressInfluence * 0.9);
        targetX += dx * weighted * (1 + longPull * .17) - lx * pressInfluence * this.pressDepth * dent;
        targetY += dy * weighted * (1 + longPull * .17) - ly * pressInfluence * this.pressDepth * dent;
        if (grabDistance > 0.0001) {
          const rx = lx / grabDistance;
          const ry = ly / grabDistance;
          const ring = smoothstep01(1 - Math.abs(grabDistance - pressRadius * 0.72) / (pressRadius * 0.38));
          const bulge = ring * this.pressDepth * (metallic ? .02 : this.multiTouch ? .07 : PRESS_RING_BULGE) * (1 - pressInfluence * 0.65);
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
        if (this.multiTouch && !second) {
          // A stretched local section narrows across the pull, retaining volume.
          const across = -lx * gestureDirY + ly * gestureDirX;
          const narrowing = dragCompression * .10 * influence;
          targetX += gestureDirY * across * narrowing;
          targetY -= gestureDirX * across * narrowing;
        }
      }
      if (second) {
        // Axial stretch/compression with sideways bulge.
        // Bounded common field; the canonical mesh/UVs and silhouette stay shared.
        const along = vertex.restX * ux + vertex.restY * uy;
        const across = -vertex.restX * uy + vertex.restY * ux;
        // Axial scale × both transverse scales = 1: bounded volume proxy.
        const sideways = Math.pow(1 + pinch, -.5) - 1;
        targetX += ux * along * pinch - uy * across * sideways;
        targetY += uy * along * pinch + ux * across * sideways;
        responseInfluence = Math.max(responseInfluence, .65);
      }
      const vertexFloor = Math.min(vertex.restY - .08, floor);
      if (this.viewportFollowEnabled) targetY = Math.max(vertexFloor, targetY);
      const stiffness = active ? GRAB_STIFFNESS_FAR + (GRAB_STIFFNESS_NEAR - GRAB_STIFFNESS_FAR) * responseInfluence : 0;
      const dampingRate = second ? PINCH_DAMPING : DAMPING * dampingResponse;
      const damping = Math.exp(-(dampingRate * (0.88 + responseInfluence * 0.12)) * dt);
      const ax = (targetX - vertex.x) * stiffness + (heldRestX - vertex.x) * REST_STIFFNESS * restResponse;
      const ay = (targetY - vertex.y) * stiffness + (heldRestY - vertex.y) * REST_STIFFNESS * restResponse;
      // A weak shared elastic field spreads release into nearby vertices.
      // Read the previous frame so traversal order cannot bias the wave.
      let waveX = 0, waveY = 0;
      if (this.multiTouch) {
        const row = SQUISH_GRID_CELLS + 1;
        let count = 0;
        for (let direction = 0; direction < 4; direction++) {
          if ((direction === 0 && index % row === 0) || (direction === 1 && index % row === SQUISH_GRID_CELLS)) continue;
          const neighbour = index + (direction === 0 ? -1 : direction === 1 ? 1 : direction === 2 ? -row : row);
          if (neighbour < 0 || neighbour >= this.vertices.length) continue;
          waveX += this.previousField[neighbour * 2]!; waveY += this.previousField[neighbour * 2 + 1]!; count++;
        }
        waveX = (waveX / count - this.previousField[index * 2]!) * 12;
        waveY = (waveY / count - this.previousField[index * 2 + 1]!) * 12;
      }
      vertex.vx = (vertex.vx + (ax + waveX) * dt) * damping;
      vertex.vy = (vertex.vy + (ay + waveY) * dt) * damping;
      vertex.x += vertex.vx * dt;
      vertex.y += vertex.vy * dt;
      const deformationX = vertex.x - bodyRestX;
      const deformationY = vertex.y - bodyRestY;
      const deformation = Math.hypot(deformationX, deformationY);
      const vertexLimit = this.multiTouch && jelly ? 3.1 : metallic ? .30 : MAX_VERTEX_DISPLACEMENT;
      if (deformation > vertexLimit) {
        const scale = vertexLimit / deformation;
        vertex.x = bodyRestX + deformationX * scale;
        vertex.y = bodyRestY + deformationY * scale;
        vertex.vx *= 0.55;
        vertex.vy *= 0.55;
      }
      if (this.viewportFollowEnabled && vertex.y < vertexFloor) {
        vertex.y = vertexFloor; vertex.vy = Math.max(0, vertex.vy);
      }
      // maxDisplacement is the deformation contract, not screen-space travel.
      // Whole-body viewport follow is published separately by the Pages adapter.
      frameMax = Math.max(frameMax, Math.hypot(vertex.x - bodyRestX, vertex.y - bodyRestY));
    }
    // Extreme impulses can invert neighbouring triangles despite each vertex
    // staying inside its displacement bound. Limit only that invalid residual,
    // preserving the spring field and body travel during normal interaction.
    const valid = (factor: number): boolean => {
      const minimumArea = .15 * (2 / SQUISH_GRID_CELLS) ** 2;
      for (let i = 0; i < this.triangleIndices.length; i += 3) {
        const a = this.vertices[this.triangleIndices[i]!]!, b = this.vertices[this.triangleIndices[i + 1]!]!, c = this.vertices[this.triangleIndices[i + 2]!]!;
        const bx = (b.restX - a.restX) * (1 - factor) + (b.x - a.x) * factor;
        const by = (b.restY - a.restY) * (1 - factor) + (b.y - a.y) * factor;
        const cx = (c.restX - a.restX) * (1 - factor) + (c.x - a.x) * factor;
        const cy = (c.restY - a.restY) * (1 - factor) + (c.y - a.y) * factor;
        if (by * cx - bx * cy < minimumArea) return false;
      }
      return true;
    };
    if (!valid(1)) {
      let low = 0, high = 1;
      for (let i = 0; i < 10; i++) { const middle = (low + high) * .5; if (valid(middle)) low = middle; else high = middle; }
      for (const vertex of this.vertices) {
        const rx = vertex.restX + this.bodyOffsetX, ry = vertex.restY + this.bodyOffsetY;
        vertex.x = rx + (vertex.x - rx) * low; vertex.y = ry + (vertex.y - ry) * low;
        vertex.vx *= low; vertex.vy *= low;
      }
      frameMax *= low;
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
