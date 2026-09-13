export const vertexShaderSource = `#version 300 es
precision highp float;

layout(location = 0) in vec2 aPosition;
layout(location = 1) in vec2 aUv;

uniform vec2 uScale;

out vec2 vUv;

void main() {
  vUv = aUv;
  gl_Position = vec4(aPosition * uScale, 0.0, 1.0);
}
`;

export const fragmentShaderSource = `#version 300 es
precision highp float;

in vec2 vUv;

uniform vec2 uPointerUv;
uniform float uCompression;
uniform bool uWireframePass;

out vec4 outColor;

float superellipse(vec2 p) {
  vec2 q = abs(p);
  return pow(q.x, 4.0) + pow(q.y, 4.0);
}

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float shape = superellipse(p);
  if (shape > 1.0) discard;

  if (uWireframePass) {
    outColor = vec4(1.0, 1.0, 1.0, 0.22);
    return;
  }

  float vertical = smoothstep(0.0, 1.0, vUv.y);
  vec3 low = vec3(0.43, 0.16, 0.58);
  vec3 high = vec3(0.83, 0.47, 0.89);
  vec3 base = mix(low, high, vertical);

  float edge = smoothstep(0.5, 1.0, shape);
  base *= 1.0 - edge * 0.26;

  float sheenDistance = distance(vUv, uPointerUv);
  float sheen = exp(-sheenDistance * sheenDistance * 18.0);
  sheen *= 0.10 + uCompression * 0.16;
  base += vec3(0.95, 0.82, 1.0) * sheen;

  float centerGlow = exp(-dot(p, p) * 1.7) * 0.07;
  base += vec3(0.18, 0.08, 0.20) * centerGlow;

  float rim = smoothstep(0.68, 1.0, shape) * (1.0 - smoothstep(0.92, 1.0, shape));
  base += vec3(0.30, 0.16, 0.36) * rim * (0.10 + uCompression * 0.10);

  outColor = vec4(base, 0.98);
}
`;
