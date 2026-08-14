import * as THREE from 'three';
import { TIER } from '../core/utils.js';

/* rais de lumière + poussière en suspension — le séjour, l'après-midi */

const SHAFT_FRAG = /* glsl */ `
varying vec2 vUv;
uniform float uIntensity;
uniform vec3 uColor;
uniform float uTime;
float n21(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}
void main() {
  float across = pow(1.0 - abs(vUv.x - 0.5) * 2.0, 1.6);
  float along = pow(1.0 - vUv.y, 1.4) * smoothstep(0.0, 0.12, vUv.y);
  float streak = 0.55 + 0.45 * n21(vec2(floor(vUv.x * 26.0), 0.0));
  float breathe = 0.85 + 0.15 * sin(uTime * 0.4 + vUv.x * 9.0);
  float a = across * along * streak * breathe * uIntensity;
  gl_FragColor = vec4(uColor, a);
}
`;

export class InteriorFX {
  constructor(scene) {
    this.uniforms = {
      uIntensity: { value: 0 },
      uColor: { value: new THREE.Color(0xffd9a0) },
      uTime: { value: 0 }
    };
    const mat = new THREE.ShaderMaterial({
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: SHAFT_FRAG,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });

    this.group = new THREE.Group();
    const shaft = (x, w, tilt) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 5.6), mat);
      m.position.set(x, 2.3, 1.1);
      m.rotation.set(-1.02, tilt, 0.08);
      m.renderOrder = 15;
      this.group.add(m);
    };
    shaft(-2.6, 1.7, 0.1);
    shaft(0.4, 1.1, 0.16);
    shaft(3.1, 2.0, 0.05);
    scene.add(this.group);

    /* poussière */
    const N = TIER.dust;
    const pos = new Float32Array(N * 3);
    const seed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = -6.5 + Math.random() * 10.5;
      pos[i * 3 + 1] = 0.6 + Math.random() * 2.8;
      pos[i * 3 + 2] = -3.6 + Math.random() * 7.4;
      seed[i] = Math.random() * 100;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

    this.dustUniforms = {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uSize: { value: 26 }
    };
    const dustMat = new THREE.ShaderMaterial({
      uniforms: this.dustUniforms,
      vertexShader: /* glsl */ `
        attribute float aSeed;
        uniform float uTime;
        uniform float uSize;
        varying float vA;
        void main() {
          vec3 p = position;
          p.x += sin(uTime * 0.12 + aSeed) * 0.4;
          p.y += sin(uTime * 0.09 + aSeed * 1.7) * 0.3;
          p.z += cos(uTime * 0.1 + aSeed * 0.9) * 0.35;
          vA = 0.5 + 0.5 * sin(uTime * 0.5 + aSeed * 3.0);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = min(uSize * (0.4 + 0.6 * fract(aSeed * 0.37)) / -mv.z, 7.0);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uOpacity;
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.05, d) * vA * uOpacity;
          gl_FragColor = vec4(1.0, 0.88, 0.7, a);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.dust = new THREE.Points(geo, dustMat);
    this.dust.renderOrder = 16;
    scene.add(this.dust);
  }

  update(t, intensity) {
    this.uniforms.uTime.value = t;
    this.uniforms.uIntensity.value = intensity * 0.55;
    this.dustUniforms.uTime.value = t;
    this.dustUniforms.uOpacity.value = intensity * 0.5;
    this.group.visible = intensity > 0.01;
    this.dust.visible = intensity > 0.01;
  }
}
