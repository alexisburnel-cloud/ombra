import * as THREE from 'three';
import { clamp, lerp, damp, easeInOut, REDUCED } from '../core/utils.js';

/*
  La caméra comme un réalisateur : trajectoire Catmull-Rom ancrée aux
  chapitres, easing par segment, souffle au repos, parallaxe amortie,
  orbite 360° au glisser-souris. La maison vit autour de (-4.5, 1.6, -1) ;
  l'extension à rénover s'accoste au pignon est du garage (≈ 20, -3.6).
*/

const UP = new THREE.Vector3(0, 1, 0);

const POSE = (pos, tgt, fov, roll = 0) => ({
  pos: new THREE.Vector3(...pos),
  tgt: new THREE.Vector3(...tgt),
  fov, roll
});

/* clé : ancrage → [chapitre, fraction locale] */
export const KEYS = [
  { at: [0, 0.0], pose: POSE([46, 27, 66], [0, 0, -7], 36) },
  { at: [0, 0.85], pose: POSE([33, 11, 44], [-3, 1.4, -1], 33) },
  { at: [1, 0.12], pose: POSE([26, 4.8, 19], [-5, 1.7, -0.5], 33) },
  { at: [1, 0.5], pose: POSE([21, 3.2, 8.5], [-6, 1.5, -1.2], 37) },
  { at: [1, 0.85], pose: POSE([11.5, 2.4, 15], [-9.5, 2.4, -0.8], 36) },
  { at: [2, 0.1], pose: POSE([33, 13, 24], [-2, 2, -1], 30, 0.008) },
  { at: [2, 0.32], pose: POSE([26, 7, -17], [-2, 2.4, -2.5], 33) },
  { at: [2, 0.55], pose: POSE([37, 17, 28], [-2, 3, -1], 29) },
  { at: [2, 0.85], pose: POSE([50, 22, 17], [-1.5, 4.8, -1], 27, -0.008) },
  { at: [3, 0.12], pose: POSE([7.5, 2.0, 10.5], [-7, 1.9, -1], 38) },
  { at: [3, 0.5], pose: POSE([-2.4, 1.8, 1.4], [-13, 2.1, -1.2], 46) },
  { at: [3, 0.95], pose: POSE([-10.5, 2.0, 0.8], [-18.6, 2.8, -1.05], 44) },
  { at: [4, 0.18], pose: POSE([31, 4.6, 9], [19.5, 1.9, -3.5], 34) },
  { at: [4, 0.85], pose: POSE([28, 2.7, -10.5], [20, 1.7, -3.3], 36) },
  { at: [6, 0.5], pose: POSE([20, 10, 38], [-3, 1.4, -2], 32) },
  { at: [9, 0.5], pose: POSE([28, 5.5, 38], [-3, 1.8, -1], 31) },
  { at: [10, 0.05], pose: POSE([26, 3.6, 32], [-4, 2, 0], 31) },
  { at: [10, 1.0], pose: POSE([15, 2.1, 13.5], [-2, 1.9, 3.2], 35) }
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
    this._off = new THREE.Vector3();

    /* orbite 360° : maintenir le clic et glisser pour tourner autour */
    this.orbit = 0;
    this.orbitTarget = 0;
    this._drag = null;
    this._lastP = 0;

    addEventListener('pointermove', (e) => {
      this.mouse.tx = (e.clientX / innerWidth - 0.5) * 2;
      this.mouse.ty = (e.clientY / innerHeight - 0.5) * 2;
      if (this._drag !== null) {
        this.orbitTarget += (e.clientX - this._drag) * 0.006;
        this._drag = e.clientX;
      }
    }, { passive: true });
    addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button === 0) {
        this._drag = e.clientX;
        document.documentElement.classList.add('is-orbit');
      }
    }, { passive: true });
    const endDrag = () => {
      this._drag = null;
      document.documentElement.classList.remove('is-orbit');
    };
    addEventListener('pointerup', endDrag, { passive: true });
    addEventListener('pointercancel', endDrag, { passive: true });
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

    /* orbite 360° — se relâche doucement dès que l'on re-défile, coupée en intérieur */
    if (Math.abs(p - this._lastP) > 0.0004 && this._drag === null) {
      this.orbitTarget = damp(this.orbitTarget, 0, 2.2, dt);
    }
    this._lastP = p;
    this.orbit = damp(this.orbit, this.orbitTarget, 3.5, dt);
    const orbitAngle = this.orbit * (1 - this.interior);
    if (Math.abs(orbitAngle) > 1e-4) {
      this._off.subVectors(this._pos, this._tgt);
      this._off.applyAxisAngle(UP, -orbitAngle);
      this._pos.copy(this._tgt).add(this._off);
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
