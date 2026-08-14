import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $$, clamp, REDUCED, ROMAN } from './utils.js';
import { splitLines } from '../ui/SplitText.js';

gsap.registerPlugin(ScrollTrigger);

export class ScrollDirector {
  constructor() {
    history.scrollRestoration = 'manual';
    scrollTo(0, 0);

    this.sections = $$('[data-ch]');
    this.ranges = [];
    this.progress = 0;
    this.chapter = 0;
    this.onChapter = null;

    if (!REDUCED) {
      this.lenis = new Lenis({ duration: 1.4, smoothWheel: true, touchMultiplier: 1.6 });
      this.lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => this.lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    this.measure();
    addEventListener('resize', () => {
      this.measure();
      ScrollTrigger.refresh();
    });
  }

  measure() {
    const total = document.documentElement.scrollHeight - innerHeight;
    this.total = Math.max(total, 1);
    this.ranges = this.sections.map((el) => ({
      start: el.offsetTop / this.total,
      end: (el.offsetTop + el.offsetHeight - innerHeight) / this.total,
      el
    }));
  }

  get scroll() {
    return this.lenis ? this.lenis.scroll : (scrollY || 0);
  }

  update() {
    this.progress = clamp(this.scroll / this.total, 0, 1);

    /* le chapitre bascule quand sa section occupe la moitié de l'écran */
    const lookahead = this.progress + (innerHeight * 0.5) / this.total;
    let ch = 0;
    for (let i = 0; i < this.ranges.length; i++) {
      if (lookahead >= this.ranges[i].start - 0.0001) ch = i;
    }
    if (ch !== this.chapter) {
      this.chapter = ch;
      if (this.onChapter) this.onChapter(ch, this.sections[ch]);
    }
  }

  /* progression locale d'un chapitre, 0..1 */
  local(i) {
    const r = this.ranges[i];
    if (!r) return 0;
    const span = r.end - r.start;
    return span > 0 ? clamp((this.progress - r.start) / span, 0, 1) : 0;
  }

  to(target) {
    if (this.lenis) {
      this.lenis.start();
      this.lenis.scrollTo(target, { duration: 2.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
    } else {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (el && el.scrollIntoView) el.scrollIntoView();
      else scrollTo(0, target);
    }
  }

  stop() { this.lenis && this.lenis.stop(); }
  start() { this.lenis && this.lenis.start(); }

  /* révélations typographiques */
  buildReveals() {
    $$('[data-rv]').forEach((el) => {
      const lines = splitLines(el);
      /* data-rv-at : déclenche à une fraction du chapitre (contenu sticky) */
      const at = el.dataset.rvAt;
      const section = el.closest('.ch');
      const trig = at && section
        ? { trigger: section, start: `${(+at * 100).toFixed(0)}% top`, once: true }
        : { trigger: el, start: 'top 82%', once: true };
      gsap.fromTo(lines,
        { yPercent: 118, rotate: 0.5 },
        {
          yPercent: 0, rotate: 0,
          duration: REDUCED ? 0 : 1.5,
          ease: 'power4.out',
          stagger: 0.08,
          scrollTrigger: trig
        });
    });
    $$('[data-rv-fade]').forEach((el) => {
      gsap.fromTo(el,
        { opacity: 0, y: 14 },
        {
          opacity: 1, y: 0,
          duration: REDUCED ? 0 : 1.2,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 86%', once: true }
        });
    });
  }
}

export { ROMAN };
