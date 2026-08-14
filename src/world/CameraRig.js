import * as THREE from 'three';
import { clamp, lerp, damp, easeInOut, REDUCED } from '../core/utils.js';

/*
  La caméra comme un réalisateur : trajectoire Catmull-Rom ancrée aux
  chapitres, easing par segment, souffle au repos, parallaxe amortie.
  La maison vit autour de (-4.5, 1.6, -1) ; la ferme à rénover à (-34, -16).
*/

const POSE = (pos, tgt, fov, roll = 0) => ({
  pos: new THREE.Vector3(...pos),
  tgt: new THREE.Vector3(...tgt),
  fov, roll
});

/* clé : ancrage → [chapitre, fraction locale] */
export const KEYS = [
  { at: [0, 0.0], pose: POSE([40, 24, 58], [0, 0, -6], 36) },
  { at: [0, 0.85], pose: POSE([27, 9, 36], [-2, 1.4, -1], 33) },
  { at: [1, 0.15], pose: POSE([18, 3.6, 21], [-4, 1.8, -0.5], 33) },
  { at: [1, 0.8], pose: POSE([10, 2.1, 14], [-7.5, 2.3, -0.5], 36) },
  { at: [2, 0.15], pose: POSE([25, 14, 21], [-3, 2.8, -0.5], 27, 0.01) },
  { at: [2, 0.8], pose: POSE([30, 10, 9], [-3, 3.2, -0.5], 27, -0.008) },
  { at: [3, 0.12], pose: POSE([4.5, 1.9, 8.5], [-6, 1.9, -1.5], 38) },
  { at: [3, 0.5], pose: POSE([-2.2, 1.75, 1.0], [-10, 1.85, -1.2], 46) },
  { at: [3, 0.95], pose: POSE([-7.5, 1.7, 0.4], [-14.5, 2.4, -0.6], 44) },
  { at: [4, 0.18], pose: POSE([-13, 5, 12], [-31, 2.6, -14], 33) },
  { at: [4, 0.85], pose: POSE([-21.5, 3.4, -1.5], [-33.5, 2.8, -16], 35) },
  { at: [6, 0.5], pose: POSE([16, 8, 30], [-4, 1.4, -2], 32) },
  { at: [9, 0.5], pose: POSE([24, 4.5, 32], [-4, 1.8, -1], 31) },
  { at: [10, 0.05], pose: POSE([21, 3.2, 28], [-4, 2, -1], 31) },
  { at: [10, 1.0], pose: POSE([13, 2.0, 17.5], [-5.5, 1.9, -1], 34) }
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

    /* intérieur : autour des clés 6 à 8 (chapitre séjour) */
    this.interior = clamp((i + t - 5.6) * 1.6, 0, 1) * clamp((9.4 - (i + t)) * 1.6, 0, 1);

    /* respiration au repos, avant le premier défilement */
    if (p < 0.003 && !REDUCED) {
      this._pos.x += Math.sin(time * 0.19) * 0.6;
      this._pos.y += Math.sin(time * 0.14) * 0.3;
      this._pos.z += Math.cos(time * 0.16) * 0.5;
    }

    /* recul du menu */
    this.menuBoost = damp(this.menuBoost, this.menuTarget, 4, dt);
    if (this.menuBoost > 0.001) {
      this._back.subVectors(this._pos, this._tgt).normalize();
      this._pos.addScaledVector(this._back, this.menuBoost * 8);
      this._pos.y += this.menuBoost * 3;
    }

    /* parallaxe souris */
    if (!REDUCED) {
      const amp = lerp(0.55, 1.1, this.interior);
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
