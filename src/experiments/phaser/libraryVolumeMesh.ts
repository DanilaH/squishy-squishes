import { getShape } from '../../game/shapes';
import { getMaterial } from '../../game/content';
import { drawAccessoryGraphic, getDecorFrame } from '../../sandbox/decor';
import type { SavedSquishy } from '../../sandbox/types';

/** Lab-only curved geometry. Exactly one disposable offscreen WebGL2 context
 * renders all five-way comparison specimens on demand, never per Hall card. */
const SIZE = 512;
const FRONT_RINGS = 26;
const STRIDE = 9;
const VERTEX = `#version 300 es
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec2 aUv;
layout(location=3) in float aFront;
out vec3 vNormal;
out vec2 vUv;
out float vFront;
void main() {
  // Subtle three-quarter angle shows thickness without distorting saved art.
  const float yaw = -0.12;
  const float pitch = -0.07;
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
  // Match the finished Studio mold and the existing neutral albedo UVs:
  // +7.5% horizontal stretch, -9.5% vertical stretch, -1.8% seat.
  gl_Position = vec4(p.x * 0.80 * 1.075, (p.y * 0.905 - 0.018) * 0.80, -p.z * 0.16, 1.0);
}`;
const FRAGMENT = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec2 vUv;
in float vFront;
uniform sampler2D uFront;
uniform vec3 uSideColor;
uniform float uMetallic;
out vec4 outColor;
void main() {
  vec3 n = normalize(vNormal);
  vec3 light = normalize(vec3(-0.42, 0.51, 0.75));
  float diffuse = max(dot(n, light), 0.0);
  vec3 color;
  float alpha = 1.0;
  if (vFront > 0.5) {
    vec4 paint = texture(uFront, vUv);
    if (paint.a < 0.025) paint = vec4(uSideColor, 1.0);
    alpha = paint.a;
    // Preserve saved brush, stickers, face and material tone. Soft matte light
    // should round the geometry, not turn the lower half into muddy cardboard.
    color = paint.rgb * (0.83 + 0.20 * diffuse);
    vec3 halfDirection = normalize(light + vec3(0.0, 0.0, 1.0));
    color += vec3(1.0, 0.97, 0.88) * pow(max(dot(n, halfDirection), 0.0), 21.0) * mix(0.055, 0.15, uMetallic);
  } else {
    // Match warm milk body, not the previous dark brown cut-out side.
    color = mix(uSideColor, texture(uFront, vUv).rgb, 0.92) * (0.82 + 0.20 * diffuse);
  }
  outColor = vec4(clamp(color, 0.0, 1.0), alpha);
}`;

const addVertex = (vertices: number[], x: number, y: number, z: number,
  nx: number, ny: number, nz: number, front: number, uvRadius = 1): void => {
  // Inverse of the 512px control's logical 256px silhouette transform. The
  // uploaded texture has UNPACK_FLIP_Y_WEBGL set for bottom-origin UVs.
  vertices.push(x, y, z, nx, ny, nz,
    0.5 + x * 0.43 * uvRadius, 0.5 + y * 0.362 * uvRadius - 0.0072, front);
};

const createMesh = (toy: SavedSquishy): { vertices: Float32Array; indices: Uint16Array } => {
  const boundary = getShape(toy.shapeId).boundary;
  const count = boundary.length;
  const vertices: number[] = [];
  const indices: number[] = [];
  let area = 0;
  for (let i = 0; i < count; i += 1) {
    const a = boundary[i]!, b = boundary[(i + 1) % count]!;
    area += a.x * b.y - b.x * a.y;
  }
  const orientation = area >= 0 ? 1 : -1;
  const outward = boundary.map((_, i) => {
    const previous = boundary[(i + count - 1) % count]!;
    const next = boundary[(i + 1) % count]!;
    const tx = next.x - previous.x, ty = next.y - previous.y;
    const length = Math.hypot(tx, ty) || 1;
    return { x: orientation * ty / length, y: -orientation * tx / length };
  });
  const joinRings = (start: number, rings: number): void => {
    for (let ring = 0; ring < rings - 1; ring += 1) {
      for (let i = 0; i < count; i += 1) {
        const next = (i + 1) % count;
        const a = start + ring * count + i;
        const b = start + ring * count + next;
        const c = start + (ring + 1) * count + i;
        const d = start + (ring + 1) * count + next;
        indices.push(a, c, b, b, c, d);
      }
    }
  };

  const frontStart = vertices.length / STRIDE;
  for (let ring = 0; ring <= FRONT_RINGS; ring += 1) {
    const radius = ring / FRONT_RINGS;
    const z = 0.09 + 0.30 * Math.sqrt(Math.max(0, 1 - radius * radius));
    for (let i = 0; i < count; i += 1) {
      const point = boundary[i]!, normal = outward[i]!;
      // Smooth radial normals avoid diagonal wedges across concave paw tips.
      const slope = 0.30 * radius / Math.sqrt(Math.max(0.045, 1 - radius * radius));
      const contourBlend = 0.18 * Math.pow(radius, 5);
      const nx = point.x * slope * 0.85 + normal.x * contourBlend;
      const ny = point.y * slope * 0.85 + normal.y * contourBlend;
      const length = Math.hypot(nx, ny, 1);
      addVertex(vertices, point.x * radius, point.y * radius, z,
        nx / length, ny / length, 1 / length, 1);
    }
  }
  joinRings(frontStart, FRONT_RINGS + 1);

  // The maximum side radius is just 1.025, not a rigid 1.04 lip. Multiple
  // cross-sections give smooth side normals and an actual shallow back roll.
  const sideStart = vertices.length / STRIDE;
  const sections = [
    { r: 1.000, z: 0.090, nz: 0.21 },
    { r: 1.025, z: 0.028, nz: 0.08 },
    { r: 1.017, z: -0.042, nz: -0.08 },
    { r: 0.990, z: -0.094, nz: -0.33 },
    { r: 0.962, z: -0.116, nz: -0.62 },
  ] as const;
  for (const section of sections) {
    for (let i = 0; i < count; i += 1) {
      const point = boundary[i]!, normal = outward[i]!;
      const length = Math.hypot(normal.x, normal.y, section.nz);
      addVertex(vertices, point.x * section.r, point.y * section.r, section.z,
        normal.x / length, normal.y / length, section.nz / length, 0, 0.91 / section.r);
    }
  }
  joinRings(sideStart, sections.length);

  const backStart = vertices.length / STRIDE;
  for (let ring = 0; ring <= 2; ring += 1) {
    const radius = ring / 2;
    const z = -0.116 - 0.025 * Math.sqrt(Math.max(0, 1 - radius * radius));
    for (let i = 0; i < count; i += 1) {
      const point = boundary[i]!, normal = outward[i]!;
      addVertex(vertices, point.x * radius * 0.962, point.y * radius * 0.962,
        z, normal.x * radius * 0.20, normal.y * radius * 0.20, -1, 0);
    }
  }
  joinRings(backStart, 3);
  return { vertices: new Float32Array(vertices), indices: new Uint16Array(indices) };
};

class VolumeMeshRenderer {
  private readonly canvas = document.createElement('canvas');
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly vao: WebGLVertexArrayObject;
  private readonly vertexBuffer: WebGLBuffer;
  private readonly indexBuffer: WebGLBuffer;
  private readonly frontTexture: WebGLTexture;

  constructor() {
    this.canvas.width = SIZE;
    this.canvas.height = SIZE;
    const gl = this.canvas.getContext('webgl2', {
      alpha: true, antialias: true, preserveDrawingBuffer: true,
      premultipliedAlpha: false, depth: true, stencil: false,
      powerPreference: 'low-power',
    });
    if (!gl) throw new Error('WebGL2 unavailable for the isolated 3D review');
    this.gl = gl;
    const compile = (kind: number, source: string): WebGLShader => {
      const shader = gl.createShader(kind);
      if (!shader) throw new Error('3D review shader allocation failed');
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader) ?? '3D review shader compilation failed');
      }
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!program) throw new Error('3D review program allocation failed');
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? '3D review shader link failed');
    }
    this.program = program;
    const vao = gl.createVertexArray();
    const vertexBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();
    const frontTexture = gl.createTexture();
    if (!vao || !vertexBuffer || !indexBuffer || !frontTexture) {
      throw new Error('3D review GPU resource allocation failed');
    }
    this.vao = vao;
    this.vertexBuffer = vertexBuffer;
    this.indexBuffer = indexBuffer;
    this.frontTexture = frontTexture;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    const stride = STRIDE * Float32Array.BYTES_PER_ELEMENT;
    for (const [index, size, offset] of [[0, 3, 0], [1, 3, 3], [2, 2, 6], [3, 1, 8]] as const) {
      gl.enableVertexAttribArray(index);
      gl.vertexAttribPointer(index, size, gl.FLOAT, false, stride, offset * Float32Array.BYTES_PER_ELEMENT);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bindVertexArray(null);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, frontTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.useProgram(program);
    gl.uniform1i(gl.getUniformLocation(program, 'uFront'), 0);
  }

  render(toy: SavedSquishy, flat: HTMLCanvasElement): HTMLCanvasElement {
    const gl = this.gl;
    if (gl.isContextLost()) throw new Error('3D review WebGL context lost');
    const mesh = createMesh(toy);
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.DYNAMIC_DRAW);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.frontTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, flat);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.viewport(0, 0, SIZE, SIZE);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program);
  const sides = {
    soft: [0.89, 0.79, 0.67], jelly: [0.75, 0.84, 0.75],
    holo: [0.86, 0.78, 0.75], marshmallow: [0.89, 0.84, 0.78],
    pearl: [0.87, 0.82, 0.81], chrome: [0.58, 0.59, 0.57],
  } as const;
  gl.uniform3f(gl.getUniformLocation(this.program, 'uSideColor'), sides[toy.materialId][0], sides[toy.materialId][1], sides[toy.materialId][2]);
  gl.uniform1f(gl.getUniformLocation(this.program, 'uMetallic'), getMaterial(toy.materialId).metallic);
  gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);

    const output = document.createElement('canvas');
    output.width = SIZE;
    output.height = SIZE;
    const context = output.getContext('2d');
    if (!context) throw new Error('3D review output canvas unavailable');
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
        // Front projects slightly up and left; the bow is behind the body.
        context.drawImage(accessory, (x - 56) * 2 - 10, (y - 67.5) * 2 - 7, 224, 150);
      }
    }
    context.drawImage(this.canvas, 0, 0);
    output.dataset.volumeRenderer = 'inflated-mesh-512';
    return output;
  }

  dispose(): void {
    const gl = this.gl;
    if (gl.isContextLost()) return;
    gl.deleteVertexArray(this.vao);
    gl.deleteBuffer(this.vertexBuffer);
    gl.deleteBuffer(this.indexBuffer);
    gl.deleteTexture(this.frontTexture);
    gl.deleteProgram(this.program);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

let shared: VolumeMeshRenderer | null = null;
export const renderVolumeMesh = (toy: SavedSquishy, flat: HTMLCanvasElement): HTMLCanvasElement => {
  try {
    shared ??= new VolumeMeshRenderer();
    return shared.render(toy, flat);
  } catch (error) {
    console.warn('Isolated 3D volume review unavailable; displaying the flat control.', error);
    shared?.dispose();
    shared = null;
    const output = document.createElement('canvas');
    output.width = SIZE;
    output.height = SIZE;
    output.getContext('2d')?.drawImage(flat, 0, 0);
    output.dataset.volumeRenderer = 'mesh-unavailable';
    return output;
  }
};
export const releaseVolumeMesh = (): void => { shared?.dispose(); shared = null; };
