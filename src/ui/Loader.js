import gsap from 'gsap';
import { $, $$, REDUCED } from '../core/utils.js';

/* le logo se trace, les courbes de niveau dessinent le territoire,
   le compteur monte — puis le terrain 3D prend le relais */
export class Loader {
  constructor() {
    this.el = $('#loader');
    this.pct = $('#loadPct');
    this.value = 0;
    this.done = false;

    const strokes = [...$$('.lm', this.el), ...$$('.lt', this.el)];
    strokes.forEach((p) => {
      const len = p.getTotalLength ? p.getTotalLength() : 400;
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });

    this.tl = gsap.timeline();
    this.tl.to($$('.lm', this.el), {
      strokeDashoffset: 0,
      duration: REDUCED ? 0.1 : 1.1,
      ease: 'power2.inOut',
      stagger: REDUCED ? 0 : 0.18
    });
    this.tl.to($$('.lt', this.el), {
      strokeDashoffset: 0,
      duration: REDUCED ? 0.1 : 1.7,
      ease: 'power2.inOut',
      stagger: REDUCED ? 0 : 0.12
    }, '-=0.7');

    this.counter = { v: 0 };
    gsap.to(this.counter, {
      v: 96,
      duration: REDUCED ? 0.2 : 2.7,
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
      const tl = gsap.timeline({ onComplete: resolve });
      tl.to(this.counter, {
        v: 100, duration: 0.35, ease: 'power2.in',
        onUpdate: () => this.set(this.counter.v)
      });
      tl.to(this.el, {
        clipPath: 'inset(0% 0% 100% 0%)',
        duration: REDUCED ? 0.2 : 1.2,
        ease: 'power4.inOut'
      }, '+=0.2');
      tl.to([$('#loaderTopo'), $('#loaderMark')], { y: -50, opacity: 0, duration: 0.85, ease: 'power3.in' }, '<');
      tl.set(this.el, { display: 'none' });
      this.done = true;
    });
  }
}
