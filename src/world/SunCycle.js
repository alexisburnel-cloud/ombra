import * as THREE from 'three';
import { clamp, lerp } from '../core/utils.js';

/*
  La journée entière vit dans le défilement :
  aube → matin → midi → après-midi → or → crépuscule → nuit.
  Chaque arrêt définit soleil, ciel, brume, exposition.
*/

const S = (p, el, az, int, sun, zen, hor, gnd, fogC, fogN, fogF, hemi, exp, night, glow) => ({
  p, el: el * Math.PI / 180, az: az * Math.PI / 180, int,
  sun: new THREE.Color(sun), zen: new THREE.Color(zen), hor: new THREE.Color(hor),
  gnd: new THREE.Color(gnd), fogC: new THREE.Color(fogC),
  fogN, fogF, hemi, exp, night, glow
});

const STOPS = [
  S(0.00, -8, 148, 0.00, 0xff8746, 0x04050a, 0x191009, 0x050404, 0x080706, 26, 130, 0.05, 0.55, 0.92, 0.0),
  S(0.06, 0.5, 143, 0.22, 0xff7e3e, 0x0a0d16, 0x54290f, 0x0a0806, 0x150e08, 26, 135, 0.09, 0.62, 0.55, 0.9),
  S(0.13, 7, 134, 1.05, 0xffa763, 0x1d2733, 0x8a5732, 0x241d14, 0x453424, 34, 165, 0.22, 0.78, 0.12, 1.0),
  S(0.26, 24, 118, 1.55, 0xffd7a6, 0x4b616e, 0xc2a97e, 0x3f3c30, 0x8d7f63, 55, 230, 0.5, 0.95, 0.0, 0.55),
  S(0.40, 50, 95, 1.7, 0xfff0d8, 0x5f7c8a, 0xd6c8a9, 0x4a4638, 0xa99a7d, 70, 280, 0.62, 1.0, 0.0, 0.3),
  S(0.54, 38, 55, 1.6, 0xffe4b4, 0x577284, 0xd2bd97, 0x46422f, 0x9f8e6f, 62, 260, 0.55, 0.98, 0.0, 0.4),
  S(0.68, 14, 22, 1.35, 0xffb066, 0x3d4a5c, 0xcc8a4c, 0x3a3226, 0x77552f, 48, 210, 0.4, 0.94, 0.0, 0.85),
  S(0.78, 4, 6, 0.75, 0xff8043, 0x252c3c, 0x8a4a24, 0x241d15, 0x3d2716, 36, 175, 0.24, 0.83, 0.08, 1.0),
  S(0.86, -3, -6, 0.12, 0xff6a35, 0x121722, 0x3b2a1e, 0x100d0a, 0x181009, 30, 150, 0.13, 0.72, 0.5, 0.6),
  S(0.94, -9, -16, 0.0, 0xff6a35, 0x070910, 0x141311, 0x070606, 0x0a0908, 26, 140, 0.07, 0.64, 0.92, 0.0),
  S(1.00, -12, -22, 0.0, 0xff6a35, 0x04060c, 0x0e0f10, 0x050505, 0x080808, 26, 145, 0.06, 0.62, 1.0, 0.0)
];

export class SunCycle {
  constructor(scene, renderer, tier) {
    this.renderer = renderer;

    this.sun = new THREE.DirectionalLight(0xffffff, 0);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(tier.shadow, tier.shadow);
    const c = this.sun.shadow.camera;
    c.left = -30; c.right = 30; c.top = 30; c.bottom = -30;
    c.near = 30; c.far = 190;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.03;
    scene.add(this.sun, this.sun.target);

    this.moon = new THREE.DirectionalLight(0x9fb0c8, 0);
    this.moon.position.set(-40, 55, 60);
    scene.add(this.moon);

    this.hemi = new THREE.HemisphereLight(0x5c7280, 0x2a2620, 0.1);
    scene.add(this.hemi);

    scene.fog = new THREE.Fog(0x080706, 26, 130);
    this.fog = scene.fog;

    /* état interpolé — réutilisé par ciel & eau */
    this.state = {
      dir: new THREE.Vector3(0, 1, 0),
      color: new THREE.Color(),
      zenith: new THREE.Color(),
      horizon: new THREE.Color(),
      ground: new THREE.Color(),
      night: 0, glow: 0, intensity: 0
    };
  }

  apply(p, sky) {
    p = clamp(p, 0, 1);
    let i = 0;
    while (i < STOPS.length - 2 && STOPS[i + 1].p < p) i++;
    const a = STOPS[i], b = STOPS[i + 1];
    const t = clamp((p - a.p) / (b.p - a.p), 0, 1);
    const st = this.state;

    const el = lerp(a.el, b.el, t);
    const az = lerp(a.az, b.az, t);
    st.dir.set(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));

    st.color.lerpColors(a.sun, b.sun, t);
    st.zenith.lerpColors(a.zen, b.zen, t);
    st.horizon.lerpColors(a.hor, b.hor, t);
    st.ground.lerpColors(a.gnd, b.gnd, t);
    st.night = lerp(a.night, b.night, t);
    st.glow = lerp(a.glow, b.glow, t);
    st.intensity = lerp(a.int, b.int, t);

    this.sun.position.copy(st.dir).multiplyScalar(110);
    this.sun.color.copy(st.color);
    this.sun.intensity = st.intensity * 3.2;
    this.sun.castShadow = st.intensity > 0.02;

    this.moon.intensity = st.night * 0.18;
    this.hemi.color.copy(st.zenith);
    this.hemi.groundColor.copy(st.ground);
    this.hemi.intensity = lerp(a.hemi, b.hemi, t) * 1.6;

    this.fog.color.lerpColors(a.fogC, b.fogC, t);
    this.fog.near = lerp(a.fogN, b.fogN, t);
    this.fog.far = lerp(a.fogF, b.fogF, t);

    this.renderer.toneMappingExposure = lerp(a.exp, b.exp, t);

    if (sky) {
      const u = sky.uniforms;
      u.uZenith.value.copy(st.zenith);
      u.uHorizon.value.copy(st.horizon);
      u.uGround.value.copy(st.ground);
      u.uSunDir.value.copy(st.dir);
      u.uSunColor.value.copy(st.color);
      u.uSunGlow.value = st.glow;
      u.uNight.value = st.night;
    }
    return st;
  }
}
