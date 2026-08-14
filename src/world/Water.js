import * as THREE from 'three';

const VERT = /* glsl */ `
varying vec3 vWorld;
varying vec2 vUv;
void main() {
  vUv = uv;
  vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = /* glsl */ `
varying vec3 vWorld;
varying vec2 vUv;
uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uDeep;
uniform float uCalm;
uniform float uScale;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;

float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1, 0)), f.x),
    mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y);
}
float waveH(vec2 p, float t) {
  float h = 0.0;
  h += vnoise(p * 1.3 + vec2(t * 0.06, t * 0.045)) * 0.6;
  h += vnoise(p * 3.1 - vec2(t * 0.085, t * 0.03)) * 0.28;
  h += vnoise(p * 7.0 + vec2(t * 0.12, -t * 0.08)) * 0.12;
  return h;
}

void main() {
  vec2 p = vWorld.xz * uScale;
  float t = uTime;
  float e = 0.06;
  float hC = waveH(p, t);
  float hX = waveH(p + vec2(e, 0.0), t);
  float hZ = waveH(p + vec2(0.0, e), t);
  float amp = mix(0.9, 0.22, uCalm);
  vec3 N = normalize(vec3((hC - hX) * amp, e * 3.2, (hC - hZ) * amp));

  vec3 V = normalize(cameraPosition - vWorld);
  float fres = pow(1.0 - max(dot(V, N), 0.0), 3.5);

  vec3 skyRef = mix(uHorizon, uZenith, 0.72);
  vec3 col = mix(uDeep, skyRef, clamp(fres * 0.75 + 0.42, 0.0, 1.0));
  /* teinte bassin — l'eau reste de l'eau, même sous un ciel d'aube */
  col = mix(col, vec3(0.42, 0.62, 0.58) * (0.35 + 0.65 * smoothstep(-0.05, 0.25, uSunDir.y)), 0.3);

  vec3 L = normalize(uSunDir);
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), 260.0);
  col += uSunColor * spec * 2.6 * smoothstep(-0.02, 0.06, L.y);

  float glint = pow(vnoise(p * 9.0 + t * 0.25), 14.0);
  col += uSunColor * glint * 0.35 * smoothstep(0.0, 0.15, L.y) * (1.0 - uCalm * 0.6);

  float depth = length(cameraPosition - vWorld);
  float fogF = smoothstep(uFogNear, uFogFar, depth);
  col = mix(col, uFogColor, fogF);

  gl_FragColor = vec4(col, 1.0);
}
`;

export class Water {
  constructor({ width, depth, calm = 0, scale = 0.9 }) {
    this.uniforms = {
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uSunColor: { value: new THREE.Color(0xffd7a6) },
      uZenith: { value: new THREE.Color(0x5c7280) },
      uHorizon: { value: new THREE.Color(0xcbb894) },
      uDeep: { value: new THREE.Color(0x21403c) },
      uCalm: { value: calm },
      uScale: { value: scale },
      uFogColor: { value: new THREE.Color(0x0a0908) },
      uFogNear: { value: 40 },
      uFogFar: { value: 160 }
    };
    const geo = new THREE.PlaneGeometry(width, depth, 1, 1);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: this.uniforms,
      fog: false
    });
    this.mesh = new THREE.Mesh(geo, mat);
  }

  sync(sun, fog, time) {
    const u = this.uniforms;
    u.uTime.value = time;
    u.uSunDir.value.copy(sun.dir);
    u.uSunColor.value.copy(sun.color);
    u.uZenith.value.copy(sun.zenith);
    u.uHorizon.value.copy(sun.horizon);
    u.uFogColor.value.copy(fog.color);
    u.uFogNear.value = fog.near;
    u.uFogFar.value = fog.far;
  }
}
