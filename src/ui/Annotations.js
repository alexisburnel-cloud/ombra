import * as THREE from 'three';
import { $$ } from '../core/utils.js';

/* légendes techniques ancrées dans l'espace — chapitre II */
const DEFS = [
  { p: [-10.2, 5.6, 2.6], text: 'PORTE-À-FAUX — 6,00 M', flip: true },
  { p: [8.9, 3.92, 5.1], text: 'DALLE — BÉTON BLANC, 40 CM' },
  { p: [5.1, 7.9, -0.6], text: 'NOYAU — TRAVERTIN MASSIF, H. 8,20 M' },
  { p: [-8.0, 2.2, 4.55], text: 'VITRAGE TOUTE HAUTEUR — 3,20 M', flip: true },
  { p: [12.4, 0.55, 5.5], text: 'BASSIN MIROIR — 9,50 M' },
  { p: [7.2, 2.2, 4.7], text: 'COLONNES BRONZE — Ø 140 MM' }
];

export class Annotations {
  constructor(camera) {
    this.camera = camera;
    this.v = new THREE.Vector3();
    this.items = DEFS.map((d, i) => {
      const el = document.createElement('div');
      el.className = 'anno' + (d.flip ? ' flip' : '');
      el.innerHTML = `<div class="anno-in"><i class="anno-dot"></i><i class="anno-line"></i><span class="anno-label">${d.text}</span></div>`;
      document.body.appendChild(el);
      return { el, pos: new THREE.Vector3(...d.p), delay: i * 0.12, shown: false };
    });
    this.active = false;
  }

  /* t : progression locale du chapitre structure */
  update(t) {
    const want = t > 0.22 && t < 0.94;
    this.items.forEach((it, i) => {
      const wantThis = want && t > 0.22 + it.delay * 0.4;
      if (wantThis !== it.shown) {
        it.shown = wantThis;
        it.el.classList.toggle('on', wantThis);
      }
      if (!want && !it.shown) { it.el.style.display = 'none'; return; }
      it.el.style.display = 'block';

      this.v.copy(it.pos).project(this.camera);
      if (this.v.z > 1) { it.el.style.display = 'none'; return; }
      const x = (this.v.x * 0.5 + 0.5) * innerWidth;
      const y = (-this.v.y * 0.5 + 0.5) * innerHeight;
      it.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    });
  }
}

/* liste anatomie — chapitre III : les couches s'allument
   au rythme exact de l'éclaté */
export class AnatomyList {
  constructor() {
    this.items = $$('#anaList li');
    this.keys = { roof: 0.0, upper: 0.09, slab: 0.18, glass: 0.27, core: 0.42 };
  }

  update(e) {
    this.items.forEach((li) => {
      const d = this.keys[li.dataset.k] ?? 0;
      li.classList.toggle('on', e > d + 0.1);
    });
  }
}
