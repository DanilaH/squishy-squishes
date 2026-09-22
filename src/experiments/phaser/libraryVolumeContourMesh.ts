import { createShapeField, getShape, type ShapeId, type ShapePoint } from '../../game/shapes';
import { drawAccessoryGraphic, getDecorFrame } from '../../sandbox/decor';
import type { SavedSquishy } from '../../sandbox/types';

/** Lab-only contour-conforming volume. The face and side share the exact polygon
 * boundary; no raster SDF clipping, per-card renderer or saved-data mutation. */
const SIZE = 512;
const FIELD_SIZE = 128;
const FIELD_RANGE = 0.85;
const STRIDE = 9;
const SUBDIVISIONS = 3;
const fields = new Map<ShapeId, Uint8Array>();
const clamp = (x: number, min = 0, max = 1): number => Math.max(min, Math.min(max, x));
const edgeId = (a: number, b: number): string => `${Math.min(a, b)}:${Math.max(a, b)}`;

const VERTEX_SHADER = `#version 300 es
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec2 aUv;
layout(location=3) in float aFront;
out vec3 vNormal;
out vec2 vUv;
out float vFront;
void main() {
  const float yaw = -0.31;
  const float pitch = -0.12;
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
  gl_Position = vec4(p.x * 0.80, p.y * 0.80, -p.z * 0.16, 1.0);
}`;
const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec2 vUv;
in float vFront;
uniform sampler2D uPaint;
out vec4 outColor;
void main() {
  vec3 n = normalize(vNormal);
  vec3 light = normalize(vec3(-0.46, 0.54, 0.71));
  float diffuse = max(dot(n, light), 0.0);
  vec3 color;
  if (vFront > 0.5) {
    vec4 paint = texture(uPaint, vUv);
    // Exact mesh contour, not alpha in a separately rasterized silhouette,
    // owns coverage. Neutral base prevents alpha halos at rotated edges.
    color = mix(vec3(0.93, 0.82, 0.68), paint.rgb, paint.a);
    color *= 0.73 + 0.32 * diffuse;
    vec3 h = normalize(light + vec3(0.0, 0.0, 1.0));
    color += vec3(1.0, 0.96, 0.87) * pow(max(dot(n, h), 0.0), 22.0) * 0.032;
  } else {
    color = vec3(0.90, 0.79, 0.66) * (0.76 + 0.24 * diffuse);
  }
  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;

const fieldAt = (field: Uint8Array, x: number, y: number): number => {
  const fx = clamp((x + 1) * 0.5) * FIELD_SIZE - 0.5;
  const fy = clamp((y + 1) * 0.5) * FIELD_SIZE - 0.5;
  const x0 = clamp(Math.floor(fx), 0, FIELD_SIZE - 1);
  const y0 = clamp(Math.floor(fy), 0, FIELD_SIZE - 1);
  const x1 = Math.min(FIELD_SIZE - 1, x0 + 1);
  const y1 = Math.min(FIELD_SIZE - 1, y0 + 1);
  const tx = clamp(fx - x0), ty = clamp(fy - y0);
  const a = field[y0 * FIELD_SIZE + x0]! * (1 - tx) + field[y0 * FIELD_SIZE + x1]! * tx;
  const b = field[y1 * FIELD_SIZE + x0]! * (1 - tx) + field[y1 * FIELD_SIZE + x1]! * tx;
  return (a * (1 - ty) + b * ty) / 255;
};
const heightAt = (field: Uint8Array, x: number, y: number): number => {
  const distance = Math.max(0, (0.5 - fieldAt(field, x, y)) * FIELD_RANGE * 2);
  return 0.105 + 0.31 * (1 - Math.exp(-4.7 * distance));
};
const cross = (a: ShapePoint, b: ShapePoint, c: ShapePoint): number =>
  (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

/** Ear clipping respects the genuine concave heart cleft and paw valleys. */
const triangulate = (boundary: readonly ShapePoint[]): number[] => {
  const remaining = Array.from({ length: boundary.length }, (_, i) => i);
  const result: number[] = [];
  const area = boundary.reduce((sum, p, i) => {
    const next = boundary[(i + 1) % boundary.length]!;
    return sum + p.x * next.y - next.x * p.y;
  }, 0);
  const winding = area >= 0 ? 1 : -1;
  let guard = boundary.length * boundary.length;
  while (remaining.length > 3 && guard-- > 0) {
    let clipped = false;
    for (let i = 0; i < remaining.length; i += 1) {
      const prev = remaining[(i + remaining.length - 1) % remaining.length]!;
      const current = remaining[i]!;
      const next = remaining[(i + 1) % remaining.length]!;
      const a = boundary[prev]!, b = boundary[current]!, c = boundary[next]!;
      if (cross(a, b, c) * winding <= 1e-9) continue;
      let covered = false;
      for (const candidate of remaining) {
        if (candidate === prev || candidate === current || candidate === next) continue;
        const p = boundary[candidate]!;
        if (cross(a, b, p) * winding > 1e-9 &&
            cross(b, c, p) * winding > 1e-9 &&
            cross(c, a, p) * winding > 1e-9) {
          covered = true;
          break;
        }
      }
      if (covered) continue;
      result.push(prev, current, next);
      remaining.splice(i, 1);
      clipped = true;
      break;
    }
    if (!clipped) throw new Error('Contour triangulation stalled on a degenerate polygon');
  }
  if (remaining.length !== 3) throw new Error('Contour triangulation did not close');
  result.push(...remaining);
  return result;
};

const createMesh = (toy: SavedSquishy, field: Uint8Array): { vertices: Float32Array; indices: Uint16Array } => {
  const boundary = getShape(toy.shapeId).boundary;
  const count = boundary.length;
  const points: ShapePoint[] = boundary.map(p => ({ x: p.x, y: p.y }));
  let triangles = triangulate(points);
  let boundaryEdges = new Set<string>(boundary.map((_, i) => edgeId(i, (i + 1) % count)));
  const rimVertices = new Set<number>(Array.from({ length: count }, (_, i) => i));
  for (let iteration = 0; iteration < SUBDIVISIONS; iteration += 1) {
    const midpoints = new Map<string, number>();
    const nextBoundary = new Set<string>();
    const midpoint = (a: number, b: number): number => {
      const key = edgeId(a, b);
      const existing = midpoints.get(key);
      if (existing !== undefined) return existing;
      const first = points[a]!, second = points[b]!;
      const index = points.length;
      points.push({ x: (first.x + second.x) * 0.5, y: (first.y + second.y) * 0.5 });
      midpoints.set(key, index);
      if (boundaryEdges.has(key)) {
        rimVertices.add(index);
        nextBoundary.add(edgeId(a, index));
        nextBoundary.add(edgeId(index, b));
      }
      return index;
    };
    const refined: number[] = [];
    for (let i = 0; i < triangles.length; i += 3) {
      const a = triangles[i]!, b = triangles[i + 1]!, c = triangles[i + 2]!;
      const ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a);
      refined.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
    }
    triangles = refined;
    boundaryEdges = nextBoundary;
  }
  const vertices: number[] = [];
  const indices = [...triangles];
  const emit = (x: number, y: number, z: number, nx: number, ny: number, nz: number, front: number): void => {
    vertices.push(x, y, z, nx, ny, nz, 0.5 + x * 0.43, 0.5 + y * 0.362 - 0.0072, front);
  };
  const eps = 2 / FIELD_SIZE;
  for (const [i, point] of points.entries()) {
    const x = point.x, y = point.y;
    const z = rimVertices.has(i) ? 0.105 : heightAt(field, x, y);
    const dx = (heightAt(field, x + eps, y) - heightAt(field, x - eps, y)) / (2 * eps);
    const dy = (heightAt(field, x, y + eps) - heightAt(field, x, y - eps)) / (2 * eps);
    const len = Math.hypot(dx, dy, 1);
    emit(x, y, z, -dx / len, -dy / len, 1 / len, 1);
  }
  const area = boundary.reduce((sum, p, i) => {
    const next = boundary[(i + 1) % count]!;
    return sum + p.x * next.y - next.x * p.y;
  }, 0);
  const winding = area >= 0 ? 1 : -1;
  const sections = [
    { radius: 1.000, z: 0.105, nz: 0.18 },
    { radius: 1.020, z: 0.030, nz: 0.04 },
    { radius: 1.012, z: -0.052, nz: -0.12 },
    { radius: 0.973, z: -0.121, nz: -0.60 },
  ] as const;
  const sideStart = vertices.length / STRIDE;
  for (const section of sections) {
    for (let i = 0; i < count; i += 1) {
      const point = boundary[i]!;
      const prev = boundary[(i + count - 1) % count]!;
      const next = boundary[(i + 1) % count]!;
      const tx = next.x - prev.x, ty = next.y - prev.y;
      const len = Math.hypot(tx, ty) || 1;
      const nx = winding * ty / len, ny = -winding * tx / len;
      const normalLen = Math.hypot(nx, ny, section.nz);
      emit(point.x * section.radius, point.y * section.radius, section.z,
        nx / normalLen, ny / normalLen, section.nz / normalLen, 0);
    }
  }
  for (let ring = 0; ring < sections.length - 1; ring += 1) {
    for (let i = 0; i < count; i += 1) {
      const next = (i + 1) % count;
      const a = sideStart + ring * count + i;
      const b = sideStart + ring * count + next;
      const c = sideStart + (ring + 1) * count + i;
      const d = sideStart + (ring + 1) * count + next;
      indices.push(a, c, b, b, c, d);
    }
  }
  if (vertices.length / STRIDE >= 65536) throw new Error('Contour mesh exceeds Uint16 vertex capacity');
  return { vertices: new Float32Array(vertices), indices: new Uint16Array(indices) };
};

class ContourMeshRenderer {
  private readonly canvas = document.createElement('canvas');
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly vao: WebGLVertexArrayObject;
  private readonly vbo: WebGLBuffer;
  private readonly ibo: WebGLBuffer;
  private readonly paint: WebGLTexture;

  constructor() {
    this.canvas.width = SIZE;
    this.canvas.height = SIZE;
    const gl = this.canvas.getContext('webgl2', {
      alpha: true, antialias: true, preserveDrawingBuffer: true,
      premultipliedAlpha: false, depth: true, powerPreference: 'low-power',
    });
    if (!gl) throw new Error('Contour review requires WebGL2');
    this.gl = gl;
    const compile = (kind: number, source: string): WebGLShader => {
      const shader = gl.createShader(kind);
      if (!shader) throw new Error('Contour shader allocation failed');
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader) ?? 'Contour shader compilation failed';
        gl.deleteShader(shader);
        throw new Error(error);
      }
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!program) throw new Error('Contour program allocation failed');
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? 'Contour program linking failed');
    }
    this.program = program;
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    const vao = gl.createVertexArray();
    const vbo = gl.createBuffer();
    const ibo = gl.createBuffer();
    const paint = gl.createTexture();
    if (!vao || !vbo || !ibo || !paint) throw new Error('Contour GPU resource allocation failed');
    this.vao = vao;
    this.vbo = vbo;
    this.ibo = ibo;
    this.paint = paint;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    for (const [index, size, offset] of [[0, 3, 0], [1, 3, 3], [2, 2, 6], [3, 1, 8]] as const) {
      gl.enableVertexAttribArray(index);
      gl.vertexAttribPointer(index, size, gl.FLOAT, false, STRIDE * 4, offset * 4);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bindVertexArray(null);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, paint);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.useProgram(program);
    gl.uniform1i(gl.getUniformLocation(program, 'uPaint'), 0);
  }

  render(toy: SavedSquishy, source: HTMLCanvasElement): HTMLCanvasElement {
    const gl = this.gl;
    if (gl.isContextLost()) throw new Error('Contour review context lost');
    let field = fields.get(toy.shapeId);
    if (!field) {
      field = createShapeField(getShape(toy.shapeId), FIELD_SIZE, FIELD_RANGE);
      fields.set(toy.shapeId, field);
    }
    const mesh = createMesh(toy, field);
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.DYNAMIC_DRAW);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.paint);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.viewport(0, 0, SIZE, SIZE);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
    const output = document.createElement('canvas');
    output.width = SIZE;
    output.height = SIZE;
    const ctx = output.getContext('2d');
    if (!ctx) throw new Error('Contour output context unavailable');
    if (toy.decor.accessory) {
      const frame = getDecorFrame(getShape(toy.shapeId), toy.decor.accessory);
      const x = 128 + (frame.headAnchor.u * 2 - 1) * 98;
      const y = 128 - ((frame.headAnchor.v + frame.headSeatOffsetV) * 2 - 1) * 98;
      const acc = document.createElement('canvas');
      acc.width = 360;
      acc.height = 240;
      const accCtx = acc.getContext('2d');
      if (accCtx) {
        accCtx.setTransform(2, 0, 0, 2, 0, 0);
        drawAccessoryGraphic(accCtx, toy.decor.accessory, 180, 120, toy.shapeId);
        ctx.drawImage(acc, (x - 56) * 2 - 10, (y - 67.5) * 2 - 7, 224, 150);
      }
    }
    ctx.drawImage(this.canvas, 0, 0);
    output.dataset.volumeRenderer = 'contour-mesh-512';
    return output;
  }

  dispose(): void {
    const gl = this.gl;
    if (gl.isContextLost()) return;
    gl.deleteVertexArray(this.vao);
    gl.deleteBuffer(this.vbo);
    gl.deleteBuffer(this.ibo);
    gl.deleteTexture(this.paint);
    gl.deleteProgram(this.program);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

let shared: ContourMeshRenderer | null = null;
export const renderVolumeContourMesh = (toy: SavedSquishy, source: HTMLCanvasElement): HTMLCanvasElement => {
  try {
    shared ??= new ContourMeshRenderer();
    return shared.render(toy, source);
  } catch (error) {
    console.warn('Isolated contour mesh unavailable; showing flat control.', error);
    shared?.dispose();
    shared = null;
    const output = document.createElement('canvas');
    output.width = SIZE;
    output.height = SIZE;
    output.getContext('2d')?.drawImage(source, 0, 0);
    output.dataset.volumeRenderer = 'contour-mesh-unavailable';
    return output;
  }
};
export const releaseVolumeContourMesh = (): void => { shared?.dispose(); shared = null; fields.clear(); };
