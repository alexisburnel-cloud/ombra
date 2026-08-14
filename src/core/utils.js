export const $ = (s, c = document) => c.querySelector(s);
export const $$ = (s, c = document) => [...c.querySelectorAll(s)];

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, l, dt) => lerp(a, b, 1 - Math.exp(-l * dt));
export const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t) => 1 - Math.pow(1 - t, 4);

export const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const COARSE = matchMedia('(pointer: coarse)').matches;

const mem = navigator.deviceMemory || 8;
const cores = navigator.hardwareConcurrency || 8;
export const TIER = (COARSE || mem <= 4 || cores <= 4)
  ? { name: 'low', dpr: 1.5, shadow: 1024, dust: 240, ca: false }
  : { name: 'high', dpr: 2, shadow: 2048, dust: 520, ca: true };

/* bruit de valeur 2D — textures procédurales */
const P = new Uint8Array(512);
{
  const p = [...Array(256).keys()];
  let seed = 1337;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 255; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) P[i] = p[i & 255];
}
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const grad = (h, x, y) => ((h & 1) ? -x : x) + ((h & 2) ? -y : y);

export function noise2(x, y) {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
  x -= Math.floor(x); y -= Math.floor(y);
  const u = fade(x), v = fade(y);
  const a = P[P[X] + Y], b = P[P[X + 1] + Y], c = P[P[X] + Y + 1], d = P[P[X + 1] + Y + 1];
  return lerp(
    lerp(grad(a, x, y), grad(b, x - 1, y), u),
    lerp(grad(c, x, y - 1), grad(d, x - 1, y - 1), u),
    v
  ) * 0.7071 + 0.5;
}

export function fbm(x, y, oct = 4) {
  let v = 0, amp = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += amp * noise2(x * f, y * f); amp *= 0.5; f *= 2.03; }
  return v;
}

export const ROMAN = ['00', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
