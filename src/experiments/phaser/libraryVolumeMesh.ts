import { getPalette } from '../../game/content';
import { getShape } from '../../game/shapes';
import { drawAccessoryGraphic, getDecorFrame } from '../../sandbox/decor';
import type { SavedSquishy } from '../../sandbox/types';

/** Lab-only real 3D geometry: an inflated front, smoothly rounded rim and rear.
 * A single reusable offscreen WebGL2 context belongs to the open review lab,
 * never to an individual Hall card. Player saves, Studio and ordinary Hall are
 * untouched. Painted frontal pixels come from the same saved V3-format toy. */
const SIZE = 512;
const FRONT_RINGS = 22;
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
  const float yaw = -0.30;
  const float pitch = -0.18;
  float cy = cos(yaw), sy = sin(yaw), cp = cos(pitch), sp = sin(pitch);
  vec3 p = vec3(aPosition.x * cy + aPosition.z * sy,
                aPosition.y,
                -aPosition.x * sy + aPosition.z * cy);
  vec3 n = vec3(aNormal.x * cy + aNormal.z * sy,
                aNormal.y,
                -aNormal.x * sy + aNormal.z * cy);
  p = vec3(p.x, p.y * cp - p.z * sp, p.y * sp + p.z * cp);
  n = vec3(n.x, n.y * cp - n.z * sp, n.y * sp + n.z * cp);
  vNormal = normalize(n);
  vUv = aUv;
  vFront = aFront;
  gl_Position = vec4(p.x * 0.80, p.y * 0.80, -p.z * 0.16, 1.0);
}`;
const FRAGMENT = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec2 vUv;
in float vFront;
uniform sampler2D uFront;
out vec4 outColor;
void main() {
  vec3 n = normalize(vNormal);
  vec3 light = normalize(vec3(-0.44, 0.56, 0.70));
  float diffuse = max(dot(n, light), 0.0);
  vec3 color;
  float alpha = 1.0;
  if (vFront > 0.5) {
    vec4 paint = texture(uFront, vUv);
    if (paint.a < 0.025) discard;
    alpha = paint.a;
    // Preserve saved paint/eyes; directional light only modifies the surface.
    color = paint.rgb * (0.70 + 0.33 * diffuse);
    vec3 halfDirection = normalize(light + vec3(0.0, 0.0, 1.0));
    color += vec3(1.0, 0.97, 0.88) * pow(max(dot(n, halfDirection), 0.0), 30.0) * 0.085;
  } else {
    // Real side geometry is deliberately darker and less reflective than the face.
    color = vec3(0.73, 0.60, 0.46) * (0.63 + 0.40 * diffuse);
  }
  outColor = vec4(clamp(color, 0.0, 1.0), alpha);
}`;

const addVertex = (vertices: number[], x: number, y: number, z: number,
  nx: number, ny: number, nz: number, front: number): void => {
  // The flat 512px control was authored in the same logical 256px domain.
  // UNPACK_FLIP_Y_WEBGL maps its top edge to v=1 after upload.
  vertices.push(x, y, z, nx, ny, nz,
    0.5 + x * 0.43, 0.5 + y * 0.362 - 0.0072, front);
};

const createMesh = (toy: SavedSquishy): { vertices: Float32Array; indices: Uint16Array } => {
  const boundary = getShape(toy.shapeId).boundary;
  const n = boundary.length;
  const vertices: number[] = [];
  const indices: number[] = [];
  let signedArea = 0;
  for (let i = 0; i < n; i += 1) {
    const a = boundary[i]!, b = boundary[(i + 1) % n]!;
    signedArea += a.x * b.y - b.x * a.y;
  }
  const orientation = signedArea >= 0 ? 1 : -1;
  const outward = boundary.map((_, i) => {
    const prev = boundary[(i + n - 1) % n]!, next = boundary[(i + 1) % n]!;
    const tx = next.x - prev.x, ty = next.y - prev.y;
    const length = Math.hypot(tx, ty) || 1;
    return { x: orientation * ty / length, y: -orientation * tx / length };
  });
  const connect = (start: number, count: number): void => {
    for (let ring = 0; ring < count - 1; ring += 1) {
      for (let i = 0; i < n; i += 1) {
        const next = (i + 1) % n;
        const a = start + ring * n + i;
        const b = start + ring * n + next;
        const c = start + (ring + 1) * n + i;
        const d = start + (ring + 1) * n + next;
        indices.push(a, c, b, b, c, d);
      }
    }
  };

  // Front is a true curved surface: its silhouette and texture are mapped on
  // 23 concentric rings, not one flat image translated in screen space.
  const frontStart = vertices.length / STRIDE;
  for (let ring = 0; ring <= FRONT_RINGS; ring += 1) {
    const r = ring / FRONT_RINGS;
    const z = 0.095 + 0.24 * Math.sqrt(Math.max(0, 1 - r * r));
    for (let i = 0; i < n; i += 1) {
      const point = boundary[i]!, normal = outward[i]!;
      const outwardStrength = 1.6 * Math.pow(r, 1.7);
      const forwardStrength = 1.15 - 0.92 * Math.pow(r, 1.9);
      const length = Math.hypot(normal.x * outwardStrength, normal.y * outwardStrength, forwardStrength);
      addVertex(vertices, point.x * r, point.y * r, z,
        normal.x * outwardStrength / length, normal.y * outwardStrength / length,
        forwardStrength / length, 1);
    }
  }
  connect(frontStart, FRONT_RINGS + 1);

  // Side profile flares slightly before rounding underneath the front; normals
  // flow from the front tangent to the rear. This is real surface thickness.
  const sideStart = vertices.length / STRIDE;
  const sections = [
    { radius: 1.0, z: 0.095, nz: 0.15 },
    { radius: 1.040, z: 0.005, nz: 0.02 },
    { radius: 1.018, z: -0.105, nz: -0.10 },
    { radius: 0.970, z: -0.160, nz: -0.52 },
  ] as const;
  for (const section of sections) {
    for (let i = 0; i < n; i += 1) {
      const point = boundary[i]!, normal = outward[i]!;
      const length = Math.hypot(normal.x, normal.y, section.nz);
      addVertex(vertices, point.x * section.radius, point.y * section.radius, section.z,
        normal.x / length, normal.y / length, section.nz / length, 0);
    }
  }
  connect(sideStart, sections.length);

  // A rear cap closes the mesh, including concave heart and paw silhouettes.
  const backStart = vertices.length / STRIDE;
  for (let ring = 0; ring <= 2; ring += 1) {
    const r = ring / 2;
    const z = -0.160 - 0.035 * Math.sqrt(Math.max(0, 1 - r * r));
    for (let i = 0; i < n; i += 1) {
      const point = boundary[i]!, normal = outward[i]!;
      addVertex(vertices, point.x * r * 0.97, point.y * r * 0.97, z,
        normal.x * r * 0.25, normal.y * r * 0.25, -1, 0);
    }
  }
  connect(backStart, 3);
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
