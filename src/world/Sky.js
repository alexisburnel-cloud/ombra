import * as THREE from 'three';

const VERT = /* glsl */ `
varying vec3 vWorld;
void main() {
  vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
}
`;

const FRAG = /* glsl */ `
varying vec3 vWorld;
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uGround;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunGlow;
uniform float uNight;
uniform float uTime;

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}

void main() {
  vec3 d = normalize(vWorld);
  float h = d.y;

  vec3 col = mix(uHorizon, uZenith, smoothstep(0.0, 0.55, h));
  col = mix(uGround, col, smoothstep(-0.1, 0.03, h));

  float s = max(dot(d, normalize(uSunDir)), 0.0);
  col += uSunColor * pow(s, 1400.0) * 1.6;
  col += uSunColor * pow(s, 32.0) * 0.28 * uSunGlow;
  col += uSunColor * pow(s, 6.0) * 0.10 * uSunGlow;

  if (uNight > 0.02 && h > 0.04) {
    vec3 cell = floor(d * 260.0);
    float star = step(0.9982, hash13(cell));
    float tw = 0.6 + 0.4 * sin(uTime * (0.6 + hash13(cell + 7.0) * 2.0) + hash13(cell + 3.0) * 6.28);
    col += vec3(0.9, 0.92, 1.0) * star * tw * uNight * smoothstep(0.04, 0.3, h) * 0.34;
  }

  gl_FragColor = vec4(col, 1.0);
}
`;

export class Sky {
  constructor(scene) {
    this.uniforms = {
      uZenith: { value: new THREE.Color(0x05060a) },
      uHorizon: { value: new THREE.Color(0x17130d) },
      uGround: { value: new THREE.Color(0x060505) },
      uSunDir: { value: new THREE.Vector3(0, -1, 0) },
      uSunColor: { value: new THREE.Color(0xff8746) },
      uSunGlow: { value: 0 },
      uNight: { value: 1 },
      uTime: { value: 0 }
    };
    const geo = new THREE.SphereGeometry(430, 32, 16);
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: this.uniforms,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.renderOrder = -10;
    scene.add(this.mesh);
  }
}
