import gsap from 'gsap';
import { $, $$, REDUCED } from '../core/utils.js';

/* le dossier d'architecte se dessine à l'encre bleue sur la planche,
   le compteur monte — puis la feuille se soulève vers le terrain 3D */
export class Loader {
  constructor() {
    this.el = $('#loader');
    this.sheet = $('.sheet', this.el);
    this.pct = $('#loadPct');
    this.value = 0;
    this.done = false;

    const drawable = $$('#sheetSvg .bp, #sheetSvg .bp-hatch, #sheetSvg .bp-dim, #sheetSvg .bp-topo, #sheetSvg .bp-pool, #sheetSvg .bp-dash', this.el)
      .filter((p) => typeof p.getTotalLength === 'function');
    drawable.forEach((p) => {
      let len = 400;
      try { len = p.getTotalLength(); } catch { /* éléments non géométriques */ }
      p.style.strokeDasharray = p.classList.contains('bp-dash') ? '6 5' : `${len}`;
      if (!p.classList.contains('bp-dash')) p.style.strokeDashoffset = len;
      else { p.style.opacity = 0; }
    });
    const texts = $$('#sheetSvg .bp-txt, #sheetSvg .bp-cap, #sheetSvg .bp-stain', this.el);

    this.tl = gsap.timeline();
    if (!REDUCED) {
      this.tl.to(drawable.filter((p) => !p.classList.contains('bp-dash')), {
        strokeDashoffset: 0,
        duration: 2.2,
        ease: 'power2.inOut',
        stagger: 0.018
      });
      this.tl.to($$('#sheetSvg .bp-dash', this.el), { opacity: 1, duration: 0.5 }, '-=0.6');
      this.tl.to(texts, { opacity: 1, duration: 0.7, stagger: 0.05 }, '-=1.0');
    } else {
      drawable.forEach((p) => { p.style.strokeDashoffset = 0; p.style.opacity = 1; });
      this.tl.to(texts, { opacity: 1, duration: 0.2 });
    }

    this.counter = { v: 0 };
    gsap.to(this.counter, {
      v: 96,
      duration: REDUCED ? 0.2 : 2.9,
      ease: 'power2.out',
      onUpdate: () => this.set(this.counter.v)
    });
  }

  set(v) {
    this.value = Math.max(this.value, v);
    this.pct.textContent = String(Math.round(this.value)).padStart(3, '0');
  }

  finish() {
    return new Promise((resolve) => {
      /* laisser la planche finir de se dessiner — c'est le moment signature */
      const remaining = REDUCED ? 0 : Math.max(0, this.tl.duration() - this.tl.time() + 0.5);
      const tl = gsap.timeline({ onComplete: resolve, delay: remaining });
      tl.to(this.counter, {
        v: 100, duration: 0.35, ease: 'power2.in',
        onUpdate: () => this.set(this.counter.v)
      });
      /* la feuille se soulève comme une page qu'on tourne vers le site réel */
      tl.to(this.sheet, {
        y: '-16vh',
        rotateX: 24,
        scale: 0.94,
        opacity: 0,
        duration: REDUCED ? 0.2 : 1.15,
        ease: 'power3.inOut',
        transformOrigin: '50% 0%'
      }, '+=0.35');
      tl.to(this.el, {
        backgroundColor: 'rgba(21, 43, 37, 0)',
        duration: REDUCED ? 0.1 : 0.6,
        ease: 'power2.out'
      }, '-=0.5');
      tl.set(this.el, { display: 'none' });
      this.done = true;
    });
  }
}
