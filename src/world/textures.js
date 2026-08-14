import * as THREE from 'three';
import { fbm, noise2, clamp } from '../core/utils.js';

function canvasOf(size, fn) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  const d = img.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const [r, g, b] = fn(x / size, y / size);
      d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function tex(canvas, repeat = 1) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  return t;
}

const mixc = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t
];

/* ── travertin : lits horizontaux serrés, pores allongés ── */
export function travertineCanvas(size = 512) {
  const dark = [163, 146, 116], pale = [228, 219, 199];
  return canvasOf(size, (u, v) => {
    const warp = fbm(u * 1.6, v * 5, 3) * 0.06;
    const strata = fbm(u * 0.8, (v + warp) * 26, 4);
    const fine = fbm(u * 3, (v + warp) * 90, 2);
    let c = mixc(dark, pale, clamp(strata * 0.85 + fine * 0.3, 0, 1));
    /* pores allongés dans le lit */
    const pore = fbm(u * 40, (v + warp) * 14, 3);
    if (pore < 0.3) c = mixc(c, [116, 98, 74], (0.3 - pore) * 2.6);
    const grain = (noise2(u * 200, v * 200) - 0.5) * 9;
    return [c[0] + grain, c[1] + grain * 0.9, c[2] + grain * 0.8].map((x) => clamp(x, 0, 255));
  });
}

/* ── béton blanc : banches, trous de tige, nuages fins ── */
export function concreteCanvas(size = 512) {
  const ties = [[0.25, 0.28], [0.75, 0.28], [0.25, 0.74], [0.75, 0.74]];
  return canvasOf(size, (u, v) => {
    const cloud = fbm(u * 4, v * 4, 5);
    const streak = fbm(u * 1.2, v * 18, 3) * 0.5;
    let g = 204 + (cloud - 0.5) * 30 + (streak - 0.25) * 16;
    /* joints de banche */
    const bx = Math.abs(((u * 3) % 1) - 0.5);
    const by = Math.abs(((v * 2) % 1) - 0.5);
    if (bx < 0.008 || by < 0.006) g -= 26;
    else if (bx < 0.02 || by < 0.016) g -= 8;
    /* trous de banche */
    for (const [tx, ty] of ties) {
      const d = Math.hypot((u - tx) * 1.4, v - ty);
      if (d < 0.022) g -= 60 * (1 - d / 0.022);
    }
    const speck = noise2(u * 240, v * 240) < 0.1 ? -8 : 0;
    g += speck;
    return [g + 6, g + 2, g - 7].map((x) => clamp(x, 0, 255));
  });
}

/* ── chêne fumé : fil long ondé, dosses cathédrale ── */
export function oakCanvas(size = 512) {
  const low = [58, 43, 29], mid = [88, 66, 44], hi = [122, 96, 64];
  return canvasOf(size, (u, v) => {
    /* 4 lames verticales, fil qui ondule sur la longueur */
    const lame = Math.floor(u * 4);
    const lu = (u * 4) % 1;
    const drift = fbm(lame * 3.7 + 0.5, v * 1.1, 3) * 3.2;
    const ring = Math.sin((lu * 7 + drift + lame * 2.3) * Math.PI);
    const cath = Math.pow(Math.abs(ring), 0.6);
    let c = mixc(low, hi, clamp(cath, 0, 1));
    c = mixc(c, mid, fbm(u * 6, v * 40, 2) * 0.5);
    /* fil fin longitudinal */
    const fine = (noise2(u * 500, v * 30) - 0.5) * 22;
    c = [c[0] + fine, c[1] + fine * 0.85, c[2] + fine * 0.7];
    /* joint entre lames */
    if (lu < 0.012 || lu > 0.988) c = c.map((x) => x * 0.55);
    return c.map((x) => clamp(x, 0, 255));
  });
}

/* ── bronze patiné ── */
export function bronzeCanvas(size = 512) {
  const dark = [46, 36, 24], mid = [96, 76, 48], hot = [148, 118, 76];
  return canvasOf(size, (u, v) => {
    const flow = fbm(u * 4, v * 9, 4);
    const streak = fbm(u * 1.4, v * 22, 3);
    let c = mixc(dark, mid, flow);
    c = mixc(c, hot, clamp((streak - 0.55) * 1.8, 0, 0.5));
    return c.map((x) => clamp(x, 0, 255));
  });
}

/* ── verre (panneau nuancier uniquement) ── */
export function glassCanvas(size = 512) {
  const deep = [26, 36, 38], sky = [128, 148, 148], warm = [188, 168, 132];
  return canvasOf(size, (u, v) => {
    let c = mixc(deep, sky, clamp(1.2 - v * 1.5 + fbm(u * 3, v * 3, 3) * 0.3, 0, 1));
    const streak = Math.pow(clamp(Math.sin((u * 3.1 + v * 0.4) * Math.PI), 0, 1), 18);
    c = mixc(c, warm, streak * 0.5);
    const edge = Math.pow(clamp(1 - Math.abs(u - 0.82) * 9, 0, 1), 3);
    c = mixc(c, [214, 224, 218], edge * 0.35);
    return c.map((x) => clamp(x, 0, 255));
  });
}

/* ── pelouse crépusculaire ── */
export function lawnCanvas(size = 256) {
  const a = [58, 60, 44], b = [42, 44, 32];
  return canvasOf(size, (u, v) => {
    const n = fbm(u * 7, v * 7, 4);
    const c = mixc(b, a, n);
    const blade = (noise2(u * 200, v * 200) - 0.5) * 10;
    return [c[0] + blade, c[1] + blade, c[2] + blade].map((x) => clamp(x, 0, 255));
  });
}

export function makeTextures() {
  const trav = travertineCanvas();
  const conc = concreteCanvas();
  const oak = oakCanvas();
  const brz = bronzeCanvas();
  const lawn = lawnCanvas();
  return {
    canvases: { travertin: travertineCanvas(640), beton: concreteCanvas(640), chene: oakCanvas(640), bronze: bronzeCanvas(640), verre: glassCanvas(640) },
    travertine: tex(trav, 2),
    travertineFloor: tex(trav, 6),
    concrete: tex(conc, 2),
    oak: tex(oak, 3),
    bronze: tex(brz, 1),
    lawn: tex(lawn, 18)
  };
}
