// The glass sphere and its atmosphere are lit in view space, so they look the
// same however the globe turns. Rather than shade them every frame, they are
// ray-traced once into a still image (the "plate") that sits under the live
// canvas. This is the only pow-heavy shader in the whole scene, and it runs
// once per resize.
import { ATMOSPHERE, CAMERA_Z, HALF_FOV_TAN } from "./config";

const VERTEX = /* glsl */ `
  attribute vec2 aCorner;
  void main() {
    gl_Position = vec4(aCorner, 0.0, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;
  uniform vec2  uSize;      // drawing buffer, px
  uniform float uTan;       // tan(fov / 2)
  uniform float uCamera;    // camera distance from the globe's centre
  uniform float uAtmosphere;

  void main() {
    vec2 ndc = (gl_FragCoord.xy / uSize) * 2.0 - 1.0;
    ndc.x *= uSize.x / uSize.y;

    vec3 origin = vec3(0.0, 0.0, uCamera);
    vec3 ray = normalize(vec3(ndc * uTan, -1.0));
    vec3 v = -ray;
    vec3 nearest = origin - dot(origin, ray) * ray;   // point on the ray closest to the centre
    float d2 = dot(nearest, nearest);
    float d = sqrt(d2);

    // --- atmosphere: brightest at the limb, gone by uAtmosphere
    float limb = sqrt(1.0 - 1.0 / (uAtmosphere * uAtmosphere));
    float c = sqrt(max(1.0 - d2 / (uAtmosphere * uAtmosphere), 0.0));
    float halo = pow(clamp(c / limb, 0.0, 1.0), 3.4);
    vec2 dir = normalize(nearest.xy + vec2(1e-5));
    float warmSide = smoothstep(-0.45, 1.0, dot(dir, normalize(vec2(0.55, -0.83))));
    float coolSide = smoothstep(0.15, 1.0, dot(dir, normalize(vec2(-0.62, 0.78))));
    vec3 glow = vec3(1.00, 0.85, 0.06) * warmSide * 0.95
              + vec3(0.78, 0.83, 0.96) * coolSide * 0.30
              + vec3(1.00, 0.90, 0.30) * 0.05;
    vec4 atmosphere = vec4(min(glow, vec3(1.0)) * halo, halo);

    // --- glass core, with an analytically anti-aliased edge
    float pixel = uTan * 2.0 * uCamera / uSize.y;      // world units per pixel at the globe
    float cover = clamp((1.0 - d) / pixel + 0.5, 0.0, 1.0);
    vec4 core = vec4(0.0);
    if (cover > 0.0) {
      vec3 n = normalize(nearest + v * sqrt(max(1.0 - d2, 0.0)));
      float fres = pow(1.0 - max(dot(n, v), 0.0), 3.2);

      vec3 keyDir  = normalize(vec3(-0.55, 0.65, 0.52));
      vec3 warmDir = normalize(vec3(0.62, -0.74, 0.26));
      float key  = max(dot(n, keyDir), 0.0);
      float warm = max(dot(n, warmDir), 0.0);

      vec3 col = vec3(0.030, 0.030, 0.034);
      col += vec3(0.105, 0.105, 0.118) * pow(key, 1.7);                       // soft sheen
      col += vec3(0.80, 0.84, 0.94) * fres * pow(key, 1.2) * 0.62;            // cool rim
      col += vec3(1.00, 0.84, 0.06) * fres * (0.10 + pow(warm, 0.9)) * 1.05;  // warm rim
      col += vec3(1.00, 0.78, 0.00) * pow(warm, 3.0) * 0.085;                 // bounce from the wave below
      vec3 h = normalize(keyDir + v);
      col += vec3(1.0) * pow(max(dot(n, h), 0.0), 70.0) * 0.10;               // glassy glint

      core = vec4(min(col, vec3(1.0)) * cover, cover);
    }

    gl_FragColor = core + atmosphere * (1.0 - core.a);   // premultiplied "over"
  }
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

/**
 * Paints the sphere into `target` at `width × height` CSS px.
 * Returns false when WebGL is unavailable, so the caller can fall back.
 */
export function bakePlate(
  target: HTMLCanvasElement,
  width: number,
  height: number,
  ratio: number,
): boolean {
  const context = target.getContext("2d");
  if (!context) return false;

  const scratch = document.createElement("canvas");
  scratch.width = Math.max(1, Math.round(width * ratio));
  scratch.height = Math.max(1, Math.round(height * ratio));
  const gl = scratch.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: true,
  });
  if (!gl) return false;

  try {
    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return false;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;
    gl.useProgram(program);

    // one oversized triangle covers the viewport
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const corner = gl.getAttribLocation(program, "aCorner");
    gl.enableVertexAttribArray(corner);
    gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(gl.getUniformLocation(program, "uSize"), scratch.width, scratch.height);
    gl.uniform1f(gl.getUniformLocation(program, "uTan"), HALF_FOV_TAN);
    gl.uniform1f(gl.getUniformLocation(program, "uCamera"), CAMERA_Z);
    gl.uniform1f(gl.getUniformLocation(program, "uAtmosphere"), ATMOSPHERE);

    gl.viewport(0, 0, scratch.width, scratch.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    target.width = scratch.width;
    target.height = scratch.height;
    context.drawImage(scratch, 0, 0);
    return true;
  } catch {
    return false;
  } finally {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
