import * as THREE from 'three';
import { $$ } from '../core/utils.js';

/* cotes de chantier ancrées aux lots — elles suivent l'éclaté */
const DEFS = [
  { part: 'couv', off: [-12, 5.45, 0.6], text: 'FAÎTAGE — TUILES TERRE CUITE', flip: true },
  { part: 'couv', off: [4.5, 6.45, 2.4], text: 'TOITURE ATTIQUE — DALLE BÉTON' },
  { part: 'murs', off: [-0.7, 2.0, 3.7], text: 'VOILE PIERRE SÈCHE — BANDEAU VITRÉ', flip: true },
  { part: 'etage', off: [6.6, 4.9, 1.6], text: 'BARDAGE BOIS GRISÉ' },
  { part: 'fini', off: [13.5, 0.35, 4.2], text: 'BASSIN À DÉBORDEMENT' },
  { part: 'fini', off: [8, -1.6, 5.9], text: 'SOUTÈNEMENT GALETS — H. 3,00 M' }
];

export class Annotations {
  constructor(camera, villa) {
    this.camera = camera;
    this.villa = villa;
    this.v = new THREE.Vector3();
    this.items = DEFS.map((d, i) => {
      const el = document.createElement('div');
      el.className = 'anno' + (d.flip ? ' flip' : '');
      el.innerHTML = `<div class="anno-in"><i class="anno-dot"></i><i class="anno-line"></i><span class="anno-label">${d.text}</span></div>`;
      document.body.appendChild(el);
      return { el, def: d, delay: i * 0.12, shown: false };
    });
  }

  /* t : progression locale du chapitre construire */
  update(t) {
    const want = t > 0.2 && t < 0.94;
    this.items.forEach((it) => {
      const wantThis = want && t > 0.2 + it.delay * 0.4;
      if (wantThis !== it.shown) {
        it.shown = wantThis;
        it.el.classList.toggle('on', wantThis);
      }
      if (!want && !it.shown) { it.el.style.display = 'none'; return; }
      it.el.style.display = 'block';

      const part = this.villa.parts[it.def.part];
      this.v.set(...it.def.off);
      part.localToWorld(this.v);
      this.v.project(this.camera);
      if (this.v.z > 1) { it.el.style.display = 'none'; return; }
      const x = (this.v.x * 0.5 + 0.5) * innerWidth;
      const y = (-this.v.y * 0.5 + 0.5) * innerHeight;
      it.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    });
  }
}

/* liste des lots — chapitre construire : chaque lot s'allume
   au rythme exact de l'éclaté */
export class LotsList {
  constructor() {
    this.items = $$('#lots li');
    this.keys = { fond: 0.0, dalle: 0.1, murs: 0.18, charp: 0.28, couv: 0.42, menu: 0.26, fini: 0.16 };
  }

  update(e) {
    this.items.forEach((li) => {
      const d = this.keys[li.dataset.k] ?? 0;
      li.classList.toggle('on', e > d + 0.08);
    });
  }
}
