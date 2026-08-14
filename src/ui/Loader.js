import gsap from 'gsap';
import { $, $$, REDUCED } from '../core/utils.js';

/* le plan se dessine, le compteur monte, puis le plan s'efface
   et le trait de lumière prend le relais en 3D */
export class Loader {
  constructor() {
    this.el = $('#loader');
    this.pct = $('#loadPct');
    this.value = 0;
    this.done = false;

    const paths = $$('.lp', this.el);
    paths.forEach((p) => {
      const len = p.getTotalLength ? p.getTotalLength() : 400;
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });

    this.tl = gsap.timeline();
    this.tl.to(paths, {
      strokeDashoffset: 0,
      duration: REDUCED ? 0.1 : 2.3,
      ease: 'power2.inOut',
      stagger: REDUCED ? 0 : 0.09
    });
    this.tl.to($$('.lp-txt', this.el), { opacity: 1, duration: 0.6, stagger: 0.15 }, '-=0.9');

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

  /* appelé quand tout est réellement prêt */
  finish() {
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });
      tl.to(this.counter, {
        v: 100, duration: 0.4, ease: 'power2.in',
        onUpdate: () => this.set(this.counter.v)
      });
      tl.to(this.el, {
        clipPath: 'inset(0% 0% 100% 0%)',
        duration: REDUCED ? 0.2 : 1.25,
        ease: 'power4.inOut'
      }, '+=0.25');
      tl.to($('.loader-plan'), { y: -60, opacity: 0, duration: 0.9, ease: 'power3.in' }, '<');
      tl.set(this.el, { display: 'none' });
      this.done = true;
    });
  }
}
