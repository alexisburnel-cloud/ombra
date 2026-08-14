import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* grain de film, vignette, aberration marginale, voile éditorial */
const FinalShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uGrain: { value: 0.05 },
    uVignette: { value: 0.34 },
    uCA: { value: 0.0003 },
    uDim: { value: 0 }
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uGrain;
    uniform float uVignette;
    uniform float uCA;
    uniform float uDim;

    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      vec2 c = vUv - 0.5;
      float r2 = dot(c, c);

      vec2 off = c * r2 * uCA * 30.0;
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + off).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - off).b;

      float vig = 1.0 - smoothstep(0.18, 0.72, r2) * uVignette;
      col *= vig;

      float g = (hash(vUv * vec2(1920.0, 1080.0) + fract(uTime) * 43.0) - 0.5) * uGrain;
      col += g;

      /* voile des chapitres éditoriaux : assombrit et désature */
      float l = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(col, vec3(l), uDim * 0.5);
      col *= 1.0 - uDim * 0.74;

      gl_FragColor = vec4(col, 1.0);
    }`
};

export class Post {
  constructor(renderer, scene, camera, tier) {
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));
    this.pass = new ShaderPass(FinalShader);
    if (!tier.ca) this.pass.uniforms.uCA.value = 0;
    this.composer.addPass(this.pass);
    this.composer.addPass(new OutputPass());
  }

  setSize(w, h, dpr) {
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(w, h);
  }

  render(time, { dim = 0, night = 0 } = {}) {
    this.pass.uniforms.uTime.value = time;
    this.pass.uniforms.uDim.value = dim;
    this.pass.uniforms.uGrain.value = 0.045 + night * 0.04;
    this.composer.render();
  }
}
