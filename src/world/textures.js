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

function tex(canvas, rx = 1, ry = rx) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = 4;
  return t;
}

const mixc = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t
];

/* ── pierre sèche calcaire : assises irrégulières (cf. maison 2020) ── */
export function drystoneCanvas(size = 512) {
  const mortar = [176, 166, 148], stones = [
    [214, 203, 180], [201, 188, 162], [222, 213, 194], [190, 176, 150], [208, 199, 184]
  ];
  const rows = 14;
  return canvasOf(size, (u, v) => {
    const row = Math.floor(v * rows);
    const jitter = noise2(row * 7.3, 0.5) * 0.5;
    const w = 0.10 + noise2(row * 3.1, 10) * 0.1;
    const col = Math.floor((u + jitter) / w);
    const cid = Math.abs((row * 31 + col * 17) % stones.length);
    const lu = ((u + jitter) / w) % 1;
    const lv = (v * rows) % 1;
    const edge = Math.min(lu, 1 - lu, (lv + 0.12) * 1.4, (1.12 - lv) * 1.4);
    let c = stones[cid];
    const face = fbm(u * 26 + cid, v * 26, 3);
    c = mixc(c, [164, 150, 126], (face - 0.5) * 0.55 + 0.08);
    if (edge < 0.09) c = mixc(mortar, c, clamp(edge / 0.09, 0, 1) * 0.6);
    const grain = (noise2(u * 240, v * 240) - 0.5) * 12;
    return [c[0] + grain, c[1] + grain, c[2] + grain * 0.9].map((x) => clamp(x, 0, 255));
  });
}

/* ── galets roulés maçonnés (soubassements, vallée du Rhône) ── */
export function galetsCanvas(size = 512) {
  const mortar = [168, 158, 140];
  const cells = 9;
  return canvasOf(size, (u, v) => {
    let best = 10, tone = 0.5;
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        const cx = Math.floor(u * cells) + ox, cy = Math.floor(v * cells) + oy;
        const jx = noise2(cx * 12.9, cy * 7.1), jy = noise2(cx * 5.3, cy * 11.7);
        const px = (cx + 0.25 + jx * 0.5) / cells, py = (cy + 0.25 + jy * 0.5) / cells;
        const d = Math.hypot((u - px) * 1.15, v - py);
        if (d < best) { best = d; tone = noise2(cx * 3.7, cy * 9.2); }
      }
    }
    const r = 0.052;
    let c;
    if (best < r) {
      const stone = mixc([196, 186, 168], [128, 120, 110], tone);
      const shade = clamp(1 - best / r, 0, 1);
      c = mixc(stone, [230, 224, 210], shade * 0.35);
    } else {
      c = mixc(mortar, [140, 130, 114], fbm(u * 30, v * 30, 3) * 0.5);
    }
    const grain = (noise2(u * 260, v * 260) - 0.5) * 10;
    return [c[0] + grain, c[1] + grain, c[2] + grain].map((x) => clamp(x, 0, 255));
  });
}

/* ── enduit minéral clair, gratté fin ── */
export function enduitCanvas(size = 512) {
  return canvasOf(size, (u, v) => {
    const cloud = fbm(u * 4, v * 4, 4);
    const rake = noise2(u * 300, v * 40) * 8;
    let g = 227 + (cloud - 0.5) * 14 + rake - 4;
    const speck = noise2(u * 220, v * 220) < 0.1 ? -7 : 0;
    g += speck;
    return [g + 4, g, g - 10].map((x) => clamp(x, 0, 255));
  });
}

/* ── tuiles terre cuite nuancées (couverture faible pente) ── */
export function tuilesCanvas(size = 512) {
  const rows = 12, cols = 7;
  const tones = [[156, 110, 86], [166, 122, 96], [144, 102, 82], [160, 118, 98], [150, 106, 84]];
  return canvasOf(size, (u, v) => {
    const row = Math.floor(v * rows);
    const off = (row % 2) * 0.5 / cols;
    const col = Math.floor((u + off) * cols);
    const cid = Math.abs((row * 13 + col * 29) % tones.length);
    const lv = (v * rows) % 1;
    const lu = ((u + off) * cols) % 1;
    let c = tones[cid];
    c = mixc(c, [120, 70, 50], Math.pow(1 - lv, 2.2) * 0.45);
    c = mixc(c, [214, 160, 120], Math.pow(lv, 3) * 0.18);
    if (lu < 0.05 || lu > 0.95) c = mixc(c, [110, 66, 48], 0.4);
    const grain = (noise2(u * 200, v * 200) - 0.5) * 14;
    return [c[0] + grain, c[1] + grain * 0.9, c[2] + grain * 0.8].map((x) => clamp(x, 0, 255));
  });
}

/* ── bois lasuré clair (sous-faces, volets — cf. porche 2020) ── */
export function boisCanvas(size = 512) {
  const low = [150, 118, 82], hi = [206, 172, 128];
  return canvasOf(size, (u, v) => {
    const lame = Math.floor(v * 9);
    const lv = (v * 9) % 1;
    const drift = fbm(lame * 5.1, u * 1.3, 3) * 2.2;
    const fil = Math.sin((v * 9 + drift + lame * 1.7) * Math.PI * 2) * 0.5 + 0.5;
    let c = mixc(low, hi, clamp(0.3 + fil * 0.55 + noise2(u * 320, v * 60) * 0.18, 0, 1));
    if (lv < 0.03 || lv > 0.97) c = c.map((x) => x * 0.62);
    return c.map((x) => clamp(x, 0, 255));
  });
}

/* ── bois grisé extérieur (bardage vieilli) ── */
export function boisGrisCanvas(size = 512) {
  const low = [136, 129, 118], hi = [184, 178, 166];
  return canvasOf(size, (u, v) => {
    const lame = Math.floor(u * 12);
    const lu = (u * 12) % 1;
    const fil = fbm(lame * 3.3 + 0.7, v * 2.2, 3);
    let c = mixc(low, hi, clamp(fil + noise2(u * 80, v * 400) * 0.22, 0, 1));
    if (lu < 0.04 || lu > 0.96) c = c.map((x) => x * 0.7);
    return c.map((x) => clamp(x, 0, 255));
  });
}

/* ── vieille pierre de ferme (rénovation) ── */
export function vieillePierreCanvas(size = 512) {
  const mortar = [188, 178, 158];
  const cells = 8;
  return canvasOf(size, (u, v) => {
    let best = 10, tone = 0.5;
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        const cx = Math.floor(u * cells) + ox, cy = Math.floor(v * cells * 1.6) + oy;
        const jx = noise2(cx * 9.9, cy * 6.1), jy = noise2(cx * 4.3, cy * 13.7);
        const px = (cx + 0.2 + jx * 0.6) / cells, py = (cy + 0.2 + jy * 0.6) / (cells * 1.6);
        const d = Math.max(Math.abs(u - px) * 0.85, Math.abs(v - py) * 1.5);
        if (d < best) { best = d; tone = noise2(cx * 5.7, cy * 3.2); }
      }
    }
    let c;
    if (best < 0.055) {
      c = mixc([182, 166, 138], [140, 124, 100], tone);
      c = mixc(c, [206, 194, 170], clamp(1 - best / 0.055, 0, 1) * 0.25);
    } else {
      c = mortar;
    }
    const grain = (noise2(u * 240, v * 240) - 0.5) * 16;
    return [c[0] + grain, c[1] + grain, c[2] + grain * 0.85].map((x) => clamp(x, 0, 255));
  });
}

/* ── prairie sèche drômoise ── */
export function prairieCanvas(size = 256) {
  const vert = [96, 102, 62], sec = [142, 130, 84], terre = [122, 104, 78];
  return canvasOf(size, (u, v) => {
    const n = fbm(u * 6, v * 6, 4);
    const dry = fbm(u * 2.2 + 40, v * 2.2, 3);
    let c = mixc(vert, sec, clamp(dry * 1.15 - 0.12, 0, 1));
    c = mixc(c, terre, clamp((n - 0.62) * 2.2, 0, 0.5));
    const blade = (noise2(u * 220, v * 220) - 0.5) * 16;
    return [c[0] + blade, c[1] + blade, c[2] + blade * 0.8].map((x) => clamp(x, 0, 255));
  });
}

/* ── béton lissé (dalles, terrasse) ── */
export function betonCanvas(size = 512) {
  return canvasOf(size, (u, v) => {
    const cloud = fbm(u * 5, v * 5, 4);
    let g = 198 + (cloud - 0.5) * 18;
    const joint = (Math.abs(((u * 3) % 1) - 0.5) < 0.006 || Math.abs(((v * 3) % 1) - 0.5) < 0.006) ? -18 : 0;
    g += joint + (noise2(u * 240, v * 240) < 0.1 ? -6 : 0);
    return [g + 2, g, g - 6].map((x) => clamp(x, 0, 255));
  });
}

export function makeTextures() {
  return {
    drystone: tex(drystoneCanvas(), 2.6, 1.3),
    galets: tex(galetsCanvas(), 3, 1.5),
    enduit: tex(enduitCanvas(), 3, 2),
    tuiles: tex(tuilesCanvas(), 4, 3),
    bois: tex(boisCanvas(), 2, 1),
    boisGris: tex(boisGrisCanvas(), 5, 1.6),
    vieillePierre: tex(vieillePierreCanvas(), 2.2, 1.4),
    prairie: tex(prairieCanvas(), 26, 26),
    beton: tex(betonCanvas(), 3, 3)
  };
}
