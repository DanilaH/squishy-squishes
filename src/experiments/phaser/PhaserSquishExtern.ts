import Phaser from 'phaser';

import { createShapeField, getShape, isPointInsideShape } from '../../game/shapes';
import { fragmentShaderSource, vertexShaderSource } from '../../squish/shaders';
import type { SquishMaterialStyle } from '../../squish/SquishSurface';

// Experimental single-shape port of SquishSurface's mesh and spring response.
// It deliberately reuses the production shape field and BOTH production shaders,
// but duplicates physics until the engine-independent simulation is extracted.
const CELLS = 16;
const FIELD_SIZE = 128;
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

const material: SquishMaterialStyle = {
  low: [0.39, 0.12, 0.54],
  high: [0.84, 0.48, 0.91],
  sheen: [0.98, 0.86, 1],
  rim: [0.44, 0.22, 0.54],
  seed: 0.17,
  translucency: 0,
  iridescence: 0,
  roughness: 0.42,
  metallic: 0,
  pearlescence: 0,
  cloudiness: 0.05,
};

interface Vertex {
  restX: number;
  restY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  u: number;
  v: number;
}

interface Gpu {
  program: WebGLProgram;
  vao: WebGLVertexArrayObject;
  vertexBuffer: WebGLBuffer;
  indexBuffer: WebGLBuffer;
  shapeTexture: WebGLTexture;
  appearanceTexture: WebGLTexture;
  uniforms: ReadonlyMap<string, WebGLUniformLocation>;
}

export interface SpikeSnapshot {
  readonly renderer: 'phaser-extern-webgl2';
  readonly canvasCount: number;
  readonly drawCalls: number;
  readonly compression: number;
  readonly maxDisplacement: number;
  readonly active: boolean;
  readonly squeezes: number;
  readonly disposed: boolean;
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const clamp01 = (value: number): number => clamp(value, 0, 1);
const smoothstep01 = (value: number): number => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

const compile = (gl: WebGL2RenderingContext, type: number, source: string): WebGLShader => {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Could not create spike shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? 'Unknown shader error';
    gl.deleteShader(shader);
    throw new Error(log);
  }
  return shader;
};

const createGpu = (gl: WebGL2RenderingContext, indices: Uint16Array, field: Uint8Array, bytes: number): Gpu => {
  const vs = compile(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = gl.createProgram();
  if (!program) throw new Error('Could not create spike program');
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? 'Unknown link error';
    gl.deleteProgram(program);
    throw new Error(log);
  }

  const vao = gl.createVertexArray();
  const vertexBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();
  const shapeTexture = gl.createTexture();
  const appearanceTexture = gl.createTexture();
  if (!vao || !vertexBuffer || !indexBuffer || !shapeTexture || !appearanceTexture) {
    throw new Error('Could not allocate spike GPU resources');
  }
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, bytes, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  gl.bindVertexArray(null);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, shapeTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, FIELD_SIZE, FIELD_SIZE, 0, gl.RED, gl.UNSIGNED_BYTE, field);

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, appearanceTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.activeTexture(gl.TEXTURE0);

  const uniforms = new Map<string, WebGLUniformLocation>();
  for (const name of [
    'uScale', 'uMoldProgress', 'uShapeField', 'uAppearanceTexture', 'uAppearanceEnabled',
    'uPointerUv', 'uStrainDirection', 'uColorLow', 'uColorHigh', 'uSheenColor', 'uRimColor',
    'uCompression', 'uPressDepth', 'uFillingAmount', 'uFillingStyle', 'uFillProgress',
    'uMaterialSeed', 'uTranslucency', 'uIridescence', 'uRoughness', 'uMetallic',
    'uPearlescence', 'uCloudiness', 'uWireframePass',
  ]) {
    const location = gl.getUniformLocation(program, name);
    if (location === null) throw new Error(`Missing squishy shader uniform: ${name}`);
    uniforms.set(name, location);
  }
  return { program, vao, vertexBuffer, indexBuffer, shapeTexture, appearanceTexture, uniforms };
};

/** One Phaser display-list item, one Phaser-owned canvas and GL context; no private RAF. */
export class PhaserSquishExtern extends Phaser.GameObjects.Extern {
  private readonly gl: WebGL2RenderingContext;
  private readonly shape = getShape('soft-square');
  private readonly vertices: Vertex[] = [];
  private readonly indices: Uint16Array;
  private readonly packed: Float32Array;
  private readonly field = createShapeField(this.shape, FIELD_SIZE);
  private gpu: Gpu | null = null;
  private pointerId: number | null = null;
  private grabStartX = 0;
  private grabStartY = 0;
  private pointerX = 0;
  private pointerY = 0;
  private sheenX = 0;
  private sheenY = 0;
  private gestureX = 0;
  private gestureY = 0;
  private compression = 0;
  private pressDepth = 0;
  private maxGestureCompression = 0;
  private maxDisplacement = 0;
  private squeezes = 0;
  private drawCalls = 0;
  private disposed = false;

  public constructor(scene: Phaser.Scene, gl: WebGL2RenderingContext) {
    super(scene);
    this.gl = gl;
    const indices: number[] = [];
    const row = CELLS + 1;
    for (let y = 0; y <= CELLS; y += 1) {
      for (let x = 0; x <= CELLS; x += 1) {
        const u = x / CELLS;
        const v = y / CELLS;
        const restX = u * 2 - 1;
        const restY = v * 2 - 1;
        this.vertices.push({ restX, restY, x: restX, y: restY, vx: 0, vy: 0, u, v });
      }
    }
    for (let y = 0; y < CELLS; y += 1) {
      for (let x = 0; x < CELLS; x += 1) {
        const a = y * row + x;
        const b = a + 1;
        const c = a + row;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }
    this.indices = new Uint16Array(indices);
    this.packed = new Float32Array(this.vertices.length * 4);
  }

  private toLocal(x: number, y: number): { x: number; y: number } {
    const { width, height } = this.scene.scale;
    const radius = Math.min(width, height) * 0.34;
    return { x: (x - width / 2) / radius, y: (height / 2 - y) / radius };
  }

  public begin(pointerId: number, x: number, y: number): boolean {
    if (this.disposed || this.pointerId !== null) return false;
    const point = this.toLocal(x, y);
    if (!isPointInsideShape(this.shape, point.x, point.y)) return false;
    this.pointerId = pointerId;
    this.grabStartX = point.x;
    this.grabStartY = point.y;
    this.pointerX = point.x;
    this.pointerY = point.y;
    this.maxGestureCompression = 0;
    this.sheenX += (point.x - this.sheenX) * 0.55;
    this.sheenY += (point.y - this.sheenY) * 0.55;
    return true;
  }

  public move(pointerId: number, x: number, y: number): void {
    if (pointerId !== this.pointerId || this.disposed) return;
    const point = this.toLocal(x, y);
    this.pointerX = point.x;
    this.pointerY = point.y;
  }

  public end(pointerId: number): void {
    if (pointerId !== this.pointerId || this.disposed) return;
    const releaseEnergy = clamp01(Math.max(this.maxGestureCompression, this.pressDepth * PRESS_COMPRESSION_WEIGHT));
    if (releaseEnergy >= 0.08) {
      this.squeezes += 1;
      this.releaseImpulse();
    }
    this.pointerId = null;
  }

  public cancel(): void {
    this.pointerId = null;
  }

  private releaseImpulse(): void {
    let dx = this.pointerX - this.grabStartX;
    let dy = this.pointerY - this.grabStartY;
    const magnitude = Math.hypot(dx, dy);
    if (magnitude > MAX_POINTER_DISPLACEMENT) {
      dx *= MAX_POINTER_DISPLACEMENT / magnitude;
      dy *= MAX_POINTER_DISPLACEMENT / magnitude;
    }
    for (const v of this.vertices) {
      const lx = v.restX - this.grabStartX;
      const ly = v.restY - this.grabStartY;
      const distance = Math.hypot(lx, ly);
      const dragInfluence = smoothstep01(1 - distance / GRAB_RADIUS) ** 2;
      const pressInfluence = smoothstep01(1 - distance / PRESS_RADIUS) ** 2;
      v.vx -= dx * dragInfluence * RELEASE_DRAG_KICK;
      v.vy -= dy * dragInfluence * RELEASE_DRAG_KICK;
      if (distance > 0.0001) {
        const kick = this.pressDepth * pressInfluence * RELEASE_PRESS_KICK;
        v.vx += (lx / distance) * kick;
        v.vy += (ly / distance) * kick;
      }
    }
  }

  /** Driven by Phaser's Scene.update, not a second requestAnimationFrame loop. */
  public advance(deltaMs: number): void {
    if (this.disposed) return;
    const dt = Math.min(Math.max(0.001, deltaMs / 1000), 1 / 30);
    const active = this.pointerId !== null;
    let dx = active ? this.pointerX - this.grabStartX : 0;
    let dy = active ? this.pointerY - this.grabStartY : 0;
    const distance = Math.hypot(dx, dy);
    if (distance > MAX_POINTER_DISPLACEMENT) {
      dx *= MAX_POINTER_DISPLACEMENT / distance;
      dy *= MAX_POINTER_DISPLACEMENT / distance;
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
    const dirX = active && dragMagnitude > 0.02 ? dx / dragMagnitude : 0;
    const dirY = active && dragMagnitude > 0.02 ? dy / dragMagnitude : 0;
    const directionBlend = 1 - Math.exp(-(active ? 11 : 5) * dt);
    this.gestureX += (dirX - this.gestureX) * directionBlend;
    this.gestureY += (dirY - this.gestureY) * directionBlend;
    const sheenBlend = 1 - Math.exp(-(active ? 9 : 3) * dt);
    this.sheenX += ((active ? this.pointerX : 0) - this.sheenX) * sheenBlend;
    this.sheenY += ((active ? this.pointerY : 0) - this.sheenY) * sheenBlend;

    const gestureDirX = dx / Math.max(0.0001, dragMagnitude);
    const gestureDirY = dy / Math.max(0.0001, dragMagnitude);
    let frameMax = 0;
    for (const v of this.vertices) {
      let targetX = v.restX;
      let targetY = v.restY;
      let responseInfluence = 0;
      if (active) {
        const lx = v.restX - this.grabStartX;
        const ly = v.restY - this.grabStartY;
        const grabDistance = Math.hypot(lx, ly);
        const weighted = smoothstep01(1 - grabDistance / GRAB_RADIUS) ** 2;
        const pressInfluence = smoothstep01(1 - grabDistance / PRESS_RADIUS) ** 2;
        responseInfluence = Math.max(weighted, pressInfluence * 0.9);
        targetX += dx * weighted - lx * pressInfluence * this.pressDepth * PRESS_DENT_STRENGTH;
        targetY += dy * weighted - ly * pressInfluence * this.pressDepth * PRESS_DENT_STRENGTH;
        if (grabDistance > 0.0001) {
          const ringCenter = PRESS_RADIUS * 0.72;
          const ringWidth = PRESS_RADIUS * 0.38;
          const ring = smoothstep01(1 - Math.abs(grabDistance - ringCenter) / ringWidth);
          const bulge = ring * this.pressDepth * PRESS_RING_BULGE * (1 - pressInfluence * 0.65);
          targetX += (lx / grabDistance) * bulge;
          targetY += (ly / grabDistance) * bulge;
        }
        const radialLength = Math.max(0.0001, Math.hypot(v.restX, v.restY));
        const radialX = v.restX / radialLength;
        const radialY = v.restY / radialLength;
        const sideWeight = 1 - Math.abs(radialX * gestureDirX + radialY * gestureDirY);
        const bulge = dragCompression * BULGE_STRENGTH * sideWeight * (1 - weighted * 0.75);
        targetX += radialX * bulge;
        targetY += radialY * bulge;
      }
      const stiffness = active ? GRAB_STIFFNESS_FAR + (GRAB_STIFFNESS_NEAR - GRAB_STIFFNESS_FAR) * responseInfluence : 0;
      const damping = Math.exp(-(DAMPING * (0.88 + responseInfluence * 0.12)) * dt);
      const ax = (targetX - v.x) * stiffness + (v.restX - v.x) * REST_STIFFNESS;
      const ay = (targetY - v.y) * stiffness + (v.restY - v.y) * REST_STIFFNESS;
      v.vx = (v.vx + ax * dt) * damping;
      v.vy = (v.vy + ay * dt) * damping;
      v.x += v.vx * dt;
      v.y += v.vy * dt;
      const offsetX = v.x - v.restX;
      const offsetY = v.y - v.restY;
      const offset = Math.hypot(offsetX, offsetY);
      if (offset > MAX_VERTEX_DISPLACEMENT) {
        const scale = MAX_VERTEX_DISPLACEMENT / offset;
        v.x = v.restX + offsetX * scale;
        v.y = v.restY + offsetY * scale;
        v.vx *= 0.55;
        v.vy *= 0.55;
      }
      frameMax = Math.max(frameMax, Math.hypot(v.x - v.restX, v.y - v.restY));
    }
    this.maxDisplacement = frameMax;
  }

  /** Called ONLY by Phaser 4's Extern render step (YieldContext -> render -> RebindContext). */
  public override render(renderer: Phaser.Renderer.WebGL.WebGLRenderer): void {
    if (this.disposed) return;
    if (renderer.gl !== this.gl) throw new Error('Spike must use Phaser-owned WebGL2 context');
    const gl = this.gl;
    this.gpu ??= createGpu(gl, this.indices, this.field, this.packed.byteLength);
    const gpu = this.gpu;
    const uniform = (name: string): WebGLUniformLocation => {
      const location = gpu.uniforms.get(name);
      if (!location) throw new Error(`Missing uniform ${name}`);
      return location;
    };

    for (let i = 0; i < this.vertices.length; i += 1) {
      const vertex = this.vertices[i]!;
      const offset = i * 4;
      this.packed[offset] = vertex.x;
      this.packed[offset + 1] = vertex.y;
      this.packed[offset + 2] = vertex.u;
      this.packed[offset + 3] = vertex.v;
    }

    const { width, height } = this.scene.scale;
    const radius = Math.min(width, height) * 0.34;
    gl.bindBuffer(gl.ARRAY_BUFFER, gpu.vertexBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.packed);
    // This spike intentionally uses the base framebuffer: no filters or render textures.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.STENCIL_TEST);
    gl.disable(gl.SCISSOR_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(gpu.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, gpu.shapeTexture);
    gl.uniform1i(uniform('uShapeField'), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, gpu.appearanceTexture);
    gl.uniform1i(uniform('uAppearanceTexture'), 1);
    gl.uniform1i(uniform('uAppearanceEnabled'), 0);
    gl.uniform2f(uniform('uScale'), radius * 2 / width, radius * 2 / height);
    gl.uniform1f(uniform('uMoldProgress'), 0);
    gl.uniform2f(uniform('uPointerUv'), clamp01(this.sheenX * 0.5 + 0.5), clamp01(this.sheenY * 0.5 + 0.5));
    gl.uniform2f(uniform('uStrainDirection'), this.gestureX, this.gestureY);
    gl.uniform1f(uniform('uCompression'), this.compression);
    gl.uniform1f(uniform('uPressDepth'), this.pressDepth);
    gl.uniform3f(uniform('uColorLow'), ...material.low);
    gl.uniform3f(uniform('uColorHigh'), ...material.high);
    gl.uniform3f(uniform('uSheenColor'), ...material.sheen);
    gl.uniform3f(uniform('uRimColor'), ...material.rim);
    gl.uniform1f(uniform('uFillingAmount'), 0);
    gl.uniform1f(uniform('uFillingStyle'), 0);
    gl.uniform1f(uniform('uFillProgress'), 1);
    gl.uniform1f(uniform('uMaterialSeed'), material.seed);
    gl.uniform1f(uniform('uTranslucency'), material.translucency);
    gl.uniform1f(uniform('uIridescence'), material.iridescence);
    gl.uniform1f(uniform('uRoughness'), material.roughness);
    gl.uniform1f(uniform('uMetallic'), material.metallic);
    gl.uniform1f(uniform('uPearlescence'), material.pearlescence);
    gl.uniform1f(uniform('uCloudiness'), material.cloudiness);
    gl.uniform1i(uniform('uWireframePass'), 0);
    gl.bindVertexArray(gpu.vao);
    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
    gl.activeTexture(gl.TEXTURE0);
    this.drawCalls += 1;
  }

  public snapshot(): SpikeSnapshot {
    return {
      renderer: 'phaser-extern-webgl2',
      canvasCount: document.querySelectorAll('canvas').length,
      drawCalls: this.drawCalls,
      compression: this.compression,
      maxDisplacement: this.maxDisplacement,
      active: this.pointerId !== null,
      squeezes: this.squeezes,
      disposed: this.disposed,
    };
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.cancel();
    const gpu = this.gpu;
    if (!gpu || this.gl.isContextLost()) return;
    this.gl.deleteBuffer(gpu.vertexBuffer);
    this.gl.deleteBuffer(gpu.indexBuffer);
    this.gl.deleteTexture(gpu.shapeTexture);
    this.gl.deleteTexture(gpu.appearanceTexture);
    this.gl.deleteVertexArray(gpu.vao);
    this.gl.deleteProgram(gpu.program);
    this.gpu = null;
  }

  public forgetLostContext(): void {
    this.gpu = null;
    this.cancel();
  }
}
