import * as THREE from 'three';
import { clamp, lerp, damp, easeInOut, REDUCED } from '../core/utils.js';

/*
  La caméra comme un réalisateur : une trajectoire Catmull-Rom
  ancrée aux chapitres, easing par segment, souffle au repos,
  parallaxe de souris amortie — plus ample à l'intérieur.
*/

const POSE = (pos, tgt, fov, roll = 0) => ({
  pos: new THREE.Vector3(...pos),
  tgt: new THREE.Vector3(...tgt),
  fov, roll
});

/* clé : ancrage → [chapitre, fraction locale] */
export const KEYS = [
  { at: [0, 0.0], pose: POSE([33, 3.0, 46], [0, 3.2, 0], 30) },
  { at: [1, 0.0], pose: POSE([27, 2.6, 37], [0, 3.0, 0], 32) },
  { at: [2, 0.0], pose: POSE([14, 2.8, 36], [0.5, 3.1, 0], 27) },
  { at: [2, 0.55], pose: POSE([1.0, 3.3, 46], [0.5, 3.3, 0], 21) },
  { at: [3, 0.15], pose: POSE([26, 8.5, 34], [2.5, 4.6, 0], 26, 0.012) },
  { at: [3, 0.75], pose: POSE([31, 11, 25], [2.5, 5.0, 0], 26, -0.008) },
  { at: [4, 0.18], pose: POSE([7.5, 2.1, 10.5], [-2, 2.3, 0], 36) },
  { at: [4, 0.55], pose: POSE([2.2, 1.95, 3.2], [-4.5, 2.1, -1.2], 44) },
  { at: [5, 0.0], pose: POSE([0.2, 1.9, 0.4], [4.2, 2.0, -1.4], 46) },
  { at: [5, 0.9], pose: POSE([1.6, 1.7, 1.4], [4.3, 2.6, -0.6], 44) },
  { at: [6, 0.25], pose: POSE([-19, 3.8, 27], [0, 3.2, 0], 32) },
  { at: [7, 0.3], pose: POSE([-28, 5.5, 14], [0, 3.2, 0], 33) },
  { at: [8, 0.0], pose: POSE([27, 2.8, 40], [0, 3.0, 0], 31) },
  { at: [8, 1.0], pose: POSE([19, 2.1, 28], [0, 2.8, 0], 33) }
];

export class CameraRig {
  constructor(camera) {
    this.camera = camera;
    this.mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    this.menuBoost = 0;
    this.menuTarget = 0;
    this.interior = 0;

    this.posCurve = null;
    this.tgtCurve = null;
    this.stops = [];

    this._pos = new THREE.Vector3();
    this._tgt = new THREE.Vector3();
    this._back = new THREE.Vector3();

    addEventListener('pointermove', (e) => {
      this.mouse.tx = (e.clientX / innerWidth - 0.5) * 2;
      this.mouse.ty = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  /* ranges : [{start, end}] par chapitre, en progression globale */
  bake(ranges) {
    this.stops = KEYS.map(({ at }) => {
      const r = ranges[at[0]];
      return r.start + (r.end - r.start) * at[1];
    });
    this.posCurve = new THREE.CatmullRomCurve3(KEYS.map((k) => k.pose.pos), false, 'catmullrom', 0.5);
    this.tgtCurve = new THREE.CatmullRomCurve3(KEYS.map((k) => k.pose.tgt), false, 'catmullrom', 0.5);
  }

  update(p, dt, time) {
    if (!this.posCurve) return;
    const n = this.stops.length;

    let i = 0;
    while (i < n - 2 && this.stops[i + 1] < p) i++;
    const span = this.stops[i + 1] - this.stops[i];
    const tRaw = span > 0 ? clamp((p - this.stops[i]) / span, 0, 1) : 0;
    const t = easeInOut(tRaw);
    const u = (i + t) / (n - 1);

    this.posCurve.getPoint(u, this._pos);
    this.tgtCurve.getPoint(u, this._tgt);
    const fov = lerp(KEYS[i].pose.fov, KEYS[i + 1].pose.fov, t);
    const roll = lerp(KEYS[i].pose.roll, KEYS[i + 1].pose.roll, t);

    /* intérieur : entre les clés 7 et 9 */
    this.interior = clamp((i + t - 6.6) * 1.4, 0, 1) * clamp((9.6 - (i + t)) * 1.4, 0, 1);

    /* respiration au repos, avant le premier défilement */
    if (p < 0.003 && !REDUCED) {
      this._pos.x += Math.sin(time * 0.21) * 0.5;
      this._pos.y += Math.sin(time * 0.16) * 0.22;
      this._pos.z += Math.cos(time * 0.18) * 0.4;
    }

    /* recul du sommaire */
    this.menuBoost = damp(this.menuBoost, this.menuTarget, 4, dt);
    if (this.menuBoost > 0.001) {
      this._back.subVectors(this._pos, this._tgt).normalize();
      this._pos.addScaledVector(this._back, this.menuBoost * 7);
      this._pos.y += this.menuBoost * 2.5;
    }

    /* parallaxe souris */
    if (!REDUCED) {
      const amp = lerp(0.55, 1.15, this.interior);
      this.mouse.x = damp(this.mouse.x, this.mouse.tx, 3, dt);
      this.mouse.y = damp(this.mouse.y, this.mouse.ty, 3, dt);
      const right = new THREE.Vector3().subVectors(this._tgt, this._pos).cross(this.camera.up).normalize();
      this._pos.addScaledVector(right, this.mouse.x * amp * 0.4);
      this._pos.y += -this.mouse.y * amp * 0.25;
      this._tgt.addScaledVector(right, this.mouse.x * amp * 0.7);
      this._tgt.y += -this.mouse.y * amp * 0.4;
    }

    this.camera.position.copy(this._pos);
    this.camera.lookAt(this._tgt);
    if (roll) this.camera.rotateZ(roll);
    if (Math.abs(this.camera.fov - fov) > 0.01) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
  }
}
