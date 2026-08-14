import * as THREE from 'three';
import { clamp, lerp } from '../core/utils.js';

/*
  La journée drômoise vit dans le défilement :
  nuit verte → aube derrière les crêtes → matin doux → midi clair
  → après-midi → heure dorée → heure bleue, fenêtres allumées.
  Sud = +z. Le matin vient de l'est (+x).
*/

const S = (p, el, az, int, sun, zen, hor, gnd, fogC, fogN, fogF, hemi, exp, night, glow) => ({
  p, el: el * Math.PI / 180, az: az * Math.PI / 180, int,
  sun: new THREE.Color(sun), zen: new THREE.Color(zen), hor: new THREE.Color(hor),
  gnd: new THREE.Color(gnd), fogC: new THREE.Color(fogC),
  fogN, fogF, hemi, exp, night, glow
});

const STOPS = [
  S(0.00, -7, 96, 0.00, 0xff9a5c, 0x0a1512, 0x14231c, 0x070c0a, 0x0c1512, 30, 150, 0.07, 0.58, 0.9, 0.0),
  S(0.05, 1, 92, 0.3, 0xff9055, 0x14231f, 0x5c3a22, 0x101a15, 0x1d2620, 30, 160, 0.12, 0.66, 0.5, 0.9),
  S(0.11, 8, 84, 1.1, 0xffb377, 0x33454a, 0xb08050, 0x2c3229, 0x59544a, 40, 190, 0.26, 0.8, 0.1, 1.0),
  S(0.24, 26, 62, 1.55, 0xffe0b4, 0x5f7d8c, 0xcdbf9c, 0x49483a, 0x9d9880, 60, 250, 0.52, 0.95, 0.0, 0.5),
  S(0.38, 52, 24, 1.7, 0xfff2dc, 0x6b8a99, 0xd9d0b4, 0x54513f, 0xb0a98f, 76, 300, 0.64, 1.0, 0.0, 0.28),
  S(0.52, 44, -12, 1.62, 0xffe9c4, 0x64828f, 0xd5c9a9, 0x4e4b3a, 0xa79f85, 68, 280, 0.58, 0.98, 0.0, 0.35),
  S(0.70, 30, -38, 1.5, 0xffd9a2, 0x59737f, 0xd0bd94, 0x474436, 0x968d72, 60, 260, 0.5, 0.96, 0.0, 0.45),
  S(0.84, 13, -62, 1.3, 0xffb26a, 0x46596b, 0xc99458, 0x3b382c, 0x6f5c3d, 50, 220, 0.36, 0.92, 0.0, 0.85),
  S(0.92, 4, -76, 0.65, 0xff8a4a, 0x2b3a4d, 0x8f5a34, 0x272419, 0x3d3222, 38, 185, 0.22, 0.82, 0.12, 1.0),
  S(0.97, -3, -84, 0.1, 0xff7a42, 0x182534, 0x41332c, 0x131511, 0x1a1c1a, 32, 165, 0.12, 0.72, 0.55, 0.55),
  S(1.00, -8, -88, 0.0, 0xff7a42, 0x0d1722, 0x1c2026, 0x0a0d0c, 0x10141a, 30, 160, 0.09, 0.66, 0.85, 0.0)
];

export class SunCycle {
  constructor(scene, renderer, tier) {
    this.renderer = renderer;

    this.sun = new THREE.DirectionalLight(0xffffff, 0);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(tier.shadow, tier.shadow);
    const c = this.sun.shadow.camera;
    c.left = -42; c.right = 42; c.top = 42; c.bottom = -42;
    c.near = 30; c.far = 220;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.03;
    scene.add(this.sun, this.sun.target);

    this.moon = new THREE.DirectionalLight(0xa8b6c8, 0);
    this.moon.position.set(-40, 55, 60);
    scene.add(this.moon);

    this.hemi = new THREE.HemisphereLight(0x5f7d8c, 0x3a3a2c, 0.1);
    scene.add(this.hemi);

    scene.fog = new THREE.Fog(0x0c1512, 30, 150);
    this.fog = scene.fog;

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

    this.sun.position.copy(st.dir).multiplyScalar(120);
    this.sun.color.copy(st.color);
    this.sun.intensity = st.intensity * 3.1;
    this.sun.castShadow = st.intensity > 0.02;

    this.moon.intensity = st.night * 0.16;
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
      u.uNight.value = st.night * 0.4;
    }
    return st;
  }
}
