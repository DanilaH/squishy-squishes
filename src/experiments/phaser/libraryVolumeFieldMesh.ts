import { createShapeField, getShape, type ShapeId } from '../../game/shapes';
import { drawAccessoryGraphic, getDecorFrame } from '../../sandbox/decor';
import type { SavedSquishy } from '../../sandbox/types';

/** Isolated Pages visual study: localized inflated 3D surface without the radial
 * convergence that pinches the heart cleft and paw valleys. Never a Hall card
 * renderer; a single disposable GPU context handles the open lab on demand. */
const SIZE = 512;
const FIELD_SIZE = 128;
const DISTANCE_RANGE = 0.85;
const GRID = 96;
const STRIDE = 11;
const fields = new Map<ShapeId, Uint8Array>();

const VERTEX_SHADER = `#version 300 es
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec2 aUv;
layout(location=3) in float aFront;
layout(location=4) in vec2 aFieldUv;
out vec3 vNormal;
out vec2 vUv;
out float vFront;
out vec2 vFieldUv;
void main() {
  // The former -0.19 yaw hid all but a hairline of the actual 3D side.
  // The fixed three-quarter pose exposes thickness; this is NOT a perspective
  // transform of a flat image. All specimens still occupy equal CSS bounds.
  const float yaw = -0.36;
  const float pitch = -0.14;
  float cy = cos(yaw), sy = sin(yaw), cp = cos(pitch), sp = sin(pitch);
  vec3 p = vec3(aPosition.x * cy + aPosition.z * sy,
                aPosition.y, -aPosition.x * sy + aPosition.z * cy);
  vec3 n = vec3(aNormal.x * cy + aNormal.z * sy,
                aNormal.y, -aNormal.x * sy + aNormal.z * cy);
  p = vec3(p.x, p.y * cp - p.z * sp, p.y * sp + p.z * cp);
  n = vec3(n.x, n.y * cp - n.z * sp, n.y * sp + n.z * cp);
  vNormal = normalize(n);
  vUv = aUv;
  vFront = aFront;
  vFieldUv = aFieldUv;
  gl_Position = vec4(p.x * 0.80, p.y * 0.80, -p.z * 0.16, 1.0);
}`;
const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec2 vUv;
in float vFront;
in vec2 vFieldUv;
uniform sampler2D uPaint;
uniform sampler2D uField;
out vec4 outColor;
void main() {
  vec3 n = normalize(vNormal);
  vec3 light = normalize(vec3(-0.42, 0.51, 0.75));
  float diffuse = max(dot(n, light), 0.0);
  if (vFront > 0.5) {
    float encoded = texture(uField, vFieldUv).r;
    float coverage = 1.0 - smoothstep(0.494, 0.506, encoded);
    if (coverage <= 0.01) discard;
    vec4 paint = texture(uPaint, vUv);
    float opacity = paint.a * coverage;
    if (opacity <= 0.015) discard;
    // Studio has its own painted lighting; avoid double-lighting or losing eyes.
    vec3 color = paint.rgb * (0.89 + 0.12 * diffuse);
    outColor = vec4(clamp(color, 0.0, 1.0), opacity);
  } else {
    // Earlier side (#f5e0c2) escaped as a bright white outline. A warmer,
    // slightly darker body side makes the silhouette's real depth legible.
    vec3 color = vec3(0.84, 0.74, 0.63) * (0.79 + 0.18 * diffuse);
    outColor = vec4(color, 1.0);
  }
}`;

const clamp = (value: number, min = 0, max = 1): number => Math.max(min, Math.min(max, value));

/** A bilinear signed-distance sample, not a nearest-neighbour staircase. */
const fieldAt = (field: Uint8Array, x: number, y: number): number => {
  const fx = clamp((x + 1) * 0.5) * FIELD_SIZE - 0.5;
  const fy = clamp((y + 1) * 0.5) * FIELD_SIZE - 0.5;
  const x0 = clamp(Math.floor(fx), 0, FIELD_SIZE - 1);
  const y0 = clamp(Math.floor(fy), 0, FIELD_SIZE - 1);
  const x1 = Math.min(FIELD_SIZE - 1, x0 + 1);
  const y1 = Math.min(FIELD_SIZE - 1, y0 + 1);
  const dx = clamp(fx - x0);
  const dy = clamp(fy - y0);
  const a = field[y0 * FIELD_SIZE + x0]! * (1 - dx) + field[y0 * FIELD_SIZE + x1]! * dx;
  const b = field[y1 * FIELD_SIZE + x0]! * (1 - dx) + field[y1 * FIELD_SIZE + x1]! * dx;
  return (a * (1 - dy) + b * dy) / 255;
};

const heightAt = (field: Uint8Array, x: number, y: number): number => {
  const d = Math.max(0, (0.5 - fieldAt(field, x, y)) * DISTANCE_RANGE * 2);
  // Local rather than radial inflation preserves four paw toes independently.
  return 0.12 + 0.35 * (1 - Math.exp(-5 * d));
};

const createMesh = (toy: SavedSquishy, field: Uint8Array): {
  vertices: Float32Array; indices: Uint16Array;
} => {
  const vertices: number[] = [];
  const indices: number[] = [];
  const vertex = (x: number, y: number, z: number, nx: number, ny: number, nz: number, front: number): void => {
    vertices.push(x, y, z, nx, ny, nz,
      0.5 + x * 0.43, 0.5 + y * 0.362 - 0.0072, front,
      0.5 + x * 0.5, 0.5 + y * 0.5);
  };
  const step = 2.08 / GRID;
  const normalStep = 2 / FIELD_SIZE;
  for (let iy = 0; iy <= GRID; iy += 1) {
    const y = -1.04 + iy * step;
    for (let ix = 0; ix <= GRID; ix += 1) {
      const x = -1.04 + ix * step;
      const z = heightAt(field, x, y);
      const dx = (heightAt(field, x + normalStep, y) - heightAt(field, x - normalStep, y)) / (2 * normalStep);
      const dy = (heightAt(field, x, y + normalStep) - heightAt(field, x, y - normalStep)) / (2 * normalStep);
      const length = Math.hypot(dx, dy, 1);
      vertex(x, y, z, -dx / length, -dy / length, 1 / length, 1);
      if (ix < GRID && iy < GRID) {
        const a = iy * (GRID + 1) + ix;
        const b = a + 1;
        const c = a + GRID + 1;
        indices.push(a, c, b, b, c, c + 1);
      }
    }
  }

  const boundary = getShape(toy.shapeId).boundary;
  const count = boundary.length;
  let signedArea = 0;
  for (let i = 0; i < count; i += 1) {
    const a = boundary[i]!, b = boundary[(i + 1) % count]!;
    signedArea += a.x * b.y - b.x * a.y;
  }
  const orientation = signedArea >= 0 ? 1 : -1;
  const start = vertices.length / STRIDE;
  // Shallow rounded sides, not a boxy extruded cutout. The front and side
  // profiles meet at the same contour, height and projected coordinate.
  const sections = [
    { r: 1.000, z: 0.120, nz: 0.19 },
    { r: 1.015, z: 0.052, nz: 0.055 },
    { r: 1.014, z: -0.033, nz: -0.08 },
    { r: 0.988, z: -0.097, nz: -0.34 },
    { r: 0.965, z: -0.145, nz: -0.62 },
  ] as const;
  for (const section of sections) {
    for (let i = 0; i < count; i += 1) {
      const point = boundary[i]!;
      const previous = boundary[(i + count - 1) % count]!;
      const next = boundary[(i + 1) % count]!;
      const tx = next.x - previous.x, ty = next.y - previous.y;
      const tangentLength = Math.hypot(tx, ty) || 1;
      const nx = orientation * ty / tangentLength;
      const ny = -orientation * tx / tangentLength;
      const length = Math.hypot(nx, ny, section.nz);
      vertex(point.x * section.r, point.y * section.r, section.z,
        nx / length, ny / length, section.nz / length, 0);
    }
  }
  for (let ring = 0; ring < sections.length - 1; ring += 1) {
    for (let i = 0; i < count; i += 1) {
      const next = (i + 1) % count;
      const a = start + ring * count + i;
      const b = start + ring * count + next;
      const c = start + (ring + 1) * count + i;
      const d = start + (ring + 1) * count + next;
      // Explicit wrapped d: c+1 crossed into the next ring at the seam.
      indices.push(a, c, b, b, c, d);
    }
  }
  if (vertices.length / STRIDE >= 65536) throw new Error('Field mesh exceeds 16-bit index capacity');
  return { vertices: new Float32Array(vertices), indices: new Uint16Array(indices) };
};

class FieldMeshRenderer {
  private readonly canvas = document.createElement('canvas');
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly vao: WebGLVertexArrayObject;
  private readonly vertexBuffer: WebGLBuffer;
  private readonly indexBuffer: WebGLBuffer;
  private readonly paintTexture: WebGLTexture;
  private readonly fieldTexture: WebGLTexture;

  constructor() {
    this.canvas.width = SIZE;
    this.canvas.height = SIZE;
    const gl = this.canvas.getContext('webgl2', {
      alpha: true, antialias: true, preserveDrawingBuffer: true,
      premultipliedAlpha: false, depth: true, stencil: false, powerPreference: 'low-power',
    });
    if (!gl) throw new Error('WebGL2 unavailable for the isolated height-field review');
    this.gl = gl;
    const compile = (kind: number, source: string): WebGLShader => {
      const shader = gl.createShader(kind);
      if (!shader) throw new Error('Height-field shader allocation failed');
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader) ?? 'Height-field shader compilation failed';
        gl.deleteShader(shader);
        throw new Error(error);
      }
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!program) throw new Error('Height-field program allocation failed');
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const error = gl.getProgramInfoLog(program) ?? 'Height-field shader link failed';
      gl.deleteProgram(program);
      throw new Error(error);
    }
    this.program = program;
    const vao = gl.createVertexArray();
    const vertexBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();
    const paintTexture = gl.createTexture();
    const fieldTexture = gl.createTexture();
    if (!vao || !vertexBuffer || !indexBuffer || !paintTexture || !fieldTexture) {
      throw new Error('Height-field GPU allocation failed');
    }
    this.vao = vao;
    this.vertexBuffer = vertexBuffer;
    this.indexBuffer = indexBuffer;
    this.paintTexture = paintTexture;
    this.fieldTexture = fieldTexture;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    const stride = STRIDE * Float32Array.BYTES_PER_ELEMENT;
    for (const [index, size, offset] of [[0, 3, 0], [1, 3, 3], [2, 2, 6], [3, 1, 8], [4, 2, 9]] as const) {
      gl.enableVertexAttribArray(index);
      gl.vertexAttribPointer(index, size, gl.FLOAT, false, stride, offset * Float32Array.BYTES_PER_ELEMENT);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bindVertexArray(null);
    for (const [unit, texture] of [[gl.TEXTURE0, paintTexture], [gl.TEXTURE1, fieldTexture]] as const) {
      gl.activeTexture(unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    gl.useProgram(program);
    gl.uniform1i(gl.getUniformLocation(program, 'uPaint'), 0);
    gl.uniform1i(gl.getUniformLocation(program, 'uField'), 1);
  }

  render(toy: SavedSquishy, source: HTMLCanvasElement): HTMLCanvasElement {
    const gl = this.gl;
    if (gl.isContextLost()) throw new Error('Height-field WebGL context lost');
    let field = fields.get(toy.shapeId);
    if (!field) {
      field = createShapeField(getShape(toy.shapeId), FIELD_SIZE, DISTANCE_RANGE);
      fields.set(toy.shapeId, field);
    }
    const mesh = createMesh(toy, field);
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.DYNAMIC_DRAW);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.paintTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.fieldTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, FIELD_SIZE, FIELD_SIZE, 0,
      gl.RED, gl.UNSIGNED_BYTE, field);
    gl.viewport(0, 0, SIZE, SIZE);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
    const output = document.createElement('canvas');
    output.width = SIZE;
    output.height = SIZE;
    const context = output.getContext('2d');
    if (!context) throw new Error('Height-field output context unavailable');
    if (toy.decor.accessory) {
      const frame = getDecorFrame(getShape(toy.shapeId), toy.decor.accessory);
      const x = 128 + (frame.headAnchor.u * 2 - 1) * 98;
      const y = 128 - ((frame.headAnchor.v + frame.headSeatOffsetV) * 2 - 1) * 98;
      const accessory = document.createElement('canvas');
      accessory.width = 360;
      accessory.height = 240;
      const accessoryContext = accessory.getContext('2d');
      if (accessoryContext) {
        accessoryContext.setTransform(2, 0, 0, 2, 0, 0);
        drawAccessoryGraphic(accessoryContext, toy.decor.accessory, 180, 120, toy.shapeId);
        context.drawImage(accessory, (x - 56) * 2 - 10, (y - 67.5) * 2 - 7, 224, 150);
      }
    }
    context.drawImage(this.canvas, 0, 0);
    output.dataset.volumeRenderer = 'sdf-field-mesh-512';
    return output;
  }

  dispose(): void {
    const gl = this.gl;
    if (gl.isContextLost()) return;
    gl.deleteVertexArray(this.vao);
    gl.deleteBuffer(this.vertexBuffer);
    gl.deleteBuffer(this.indexBuffer);
    gl.deleteTexture(this.paintTexture);
    gl.deleteTexture(this.fieldTexture);
    gl.deleteProgram(this.program);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

let shared: FieldMeshRenderer | null = null;
export const renderVolumeFieldMesh = (toy: SavedSquishy, source: HTMLCanvasElement): HTMLCanvasElement => {
  try {
    shared ??= new FieldMeshRenderer();
    return shared.render(toy, source);
  } catch (error) {
    console.warn('Isolated height-field review unavailable; displaying source instead.', error);
    shared?.dispose();
    shared = null;
    const output = document.createElement('canvas');
    output.width = SIZE;
    output.height = SIZE;
    output.getContext('2d')?.drawImage(source, 0, 0);
    output.dataset.volumeRenderer = 'field-mesh-unavailable';
    return output;
  }
};
export const releaseVolumeFieldMesh = (): void => { shared?.dispose(); shared = null; fields.clear(); };
