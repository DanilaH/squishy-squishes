import { sampleContinuousInteraction } from '@danilah/mini-games-kit/core';
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
}

export const SQUISH_GRID_CELLS = 16;
const GRAB_RADIUS = 0.92;
const PRESS_RADIUS = 0.58;
const MAX_POINTER_DISPLACEMENT = 0.72;
const MAX_VERTEX_DISPLACEMENT = 0.72;
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
    this.shape = shape;
  }

  public resetTiming(nowMs: number): void {
    this.previousSampleAt = nowMs;
  }

  /** Coordinates in [-1, 1], already transformed from client/Phaser pixels by the host. */
  public pointToUv(x: number, y: number): { u: number; v: number } | null {
    if (!isPointInsideShape(this.shape, x, y)) return null;
    return { u: clamp01(x * 0.5 + 0.5), v: clamp01(y * 0.5 + 0.5) };
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
    if (this.pointerId !== null || !isPointInsideShape(this.shape, x, y)) return false;
    this.pointerId = pointerId;
    this.grabStartX = x;
    this.grabStartY = y;
    this.pointerX = x;
    this.pointerY = y;
    this.maxGestureCompression = 0;
    this.sheenX += (x - this.sheenX) * 0.55;
    this.sheenY += (y - this.sheenY) * 0.55;
    return true;
  }

  public move(pointerId: number, x: number, y: number): void {
    if (pointerId !== this.pointerId) return;
    this.pointerX = x;
    this.pointerY = y;
  }

  /** Returns tactile release energy; a weak gesture does not count as a squeeze. */
  public end(pointerId: number): number | null {
    if (pointerId !== this.pointerId) return null;
    const energy = clamp01(Math.max(this.maxGestureCompression, this.pressDepth * PRESS_COMPRESSION_WEIGHT));
    if (energy >= 0.08) {
      this.squeezes += 1;
      this.applyReleaseImpulse();
    }
    this.cancel();
    return energy;
  }

  /** Cancel without adding a squeeze or a release impulse. */
  public cancel(): void {
    this.pointerId = null;
  }

  private applyReleaseImpulse(): void {
    let dx = this.pointerX - this.grabStartX;
    let dy = this.pointerY - this.grabStartY;
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
      const dragInfluence = smoothstep01(1 - distance / GRAB_RADIUS) ** 2;
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
    let dx = active ? this.pointerX - this.grabStartX : 0;
    let dy = active ? this.pointerY - this.grabStartY : 0;
    const magnitude = Math.hypot(dx, dy);
    if (magnitude > MAX_POINTER_DISPLACEMENT) {
      const scale = MAX_POINTER_DISPLACEMENT / magnitude;
      dx *= scale;
      dy *= scale;
    }
    const dragMagnitude = Math.hypot(dx, dy);
    const pressBlend = 1 - Math.exp(-(active ? PRESS_ATTACK : PRESS_RELEASE) * dt);
    this.pressDepth += ((active ? 1 : 0) - this.pressDepth) * pressBlend;
    const dragCompression = active ? clamp01(dragMagnitude / MAX_POINTER_DISPLACEMENT) : 0;
    const target = active ? clamp01(Math.max(dragCompression, this.pressDepth * PRESS_COMPRESSION_WEIGHT)) : 0;
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
    this.sheenX += ((active ? this.pointerX : 0) - this.sheenX) * sheenBlend;
    this.sheenY += ((active ? this.pointerY : 0) - this.sheenY) * sheenBlend;
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
      let targetX = vertex.restX;
      let targetY = vertex.restY;
      let responseInfluence = 0;
      if (active) {
        const lx = vertex.restX - this.grabStartX;
        const ly = vertex.restY - this.grabStartY;
        const grabDistance = Math.hypot(lx, ly);
        const influence = smoothstep01(1 - grabDistance / GRAB_RADIUS);
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
      const stiffness = active ? GRAB_STIFFNESS_FAR + (GRAB_STIFFNESS_NEAR - GRAB_STIFFNESS_FAR) * responseInfluence : 0;
      const damping = Math.exp(-(DAMPING * (0.88 + responseInfluence * 0.12)) * dt);
      const ax = (targetX - vertex.x) * stiffness + (vertex.restX - vertex.x) * REST_STIFFNESS;
      const ay = (targetY - vertex.y) * stiffness + (vertex.restY - vertex.y) * REST_STIFFNESS;
      vertex.vx = (vertex.vx + ax * dt) * damping;
      vertex.vy = (vertex.vy + ay * dt) * damping;
      vertex.x += vertex.vx * dt;
      vertex.y += vertex.vy * dt;
      const offsetX = vertex.x - vertex.restX;
      const offsetY = vertex.y - vertex.restY;
      const offset = Math.hypot(offsetX, offsetY);
      if (offset > MAX_VERTEX_DISPLACEMENT) {
        const scale = MAX_VERTEX_DISPLACEMENT / offset;
        vertex.x = vertex.restX + offsetX * scale;
        vertex.y = vertex.restY + offsetY * scale;
        vertex.vx *= 0.55;
        vertex.vy *= 0.55;
      }
      frameMax = Math.max(frameMax, Math.hypot(vertex.x - vertex.restX, vertex.y - vertex.restY));
    }
    this.maxDisplacement = frameMax;
    return {
      active, compression: this.compression, pressDepth: this.pressDepth,
      normalizedVelocity: this.normalizedVelocity,
      tactileActive: sample.active, tactileProgress: sample.progress,
      maxDisplacement: this.maxDisplacement, gestureX: this.gestureX,
      gestureY: this.gestureY, sheenX: this.sheenX, sheenY: this.sheenY,
      squeezes: this.squeezes,
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
      squeezes: this.squeezes,
    };
  }
}
