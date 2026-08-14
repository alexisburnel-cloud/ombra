import { $, clamp, damp, lerp } from '../core/utils.js';

/* réalisations — bande horizontale : le défilement la traverse,
   la main peut la saisir (les figures vivent déjà dans le HTML) */
export class Strip {
  constructor(scrollDirector, sectionIndex) {
    this.scroll = scrollDirector;
    this.index = sectionIndex;
    this.el = $('#strip');
    this.bar = $('#stripBar');
    this.wrap = this.el.parentElement;
    this.imgs = [...this.el.querySelectorAll('img')];

    this.x = 0;
    this.drag = 0;
    this.dragTarget = 0;
    this.max = 0;

    let down = false, startX = 0, startDrag = 0;
    this.wrap.addEventListener('pointerdown', (e) => {
      down = true; startX = e.clientX; startDrag = this.dragTarget;
      this.wrap.setPointerCapture(e.pointerId);
    });
    this.wrap.addEventListener('pointermove', (e) => {
      if (!down) return;
      this.dragTarget = startDrag + (e.clientX - startX) * 1.4;
    });
    const up = () => { down = false; };
    this.wrap.addEventListener('pointerup', up);
    this.wrap.addEventListener('pointercancel', up);

    this.measure();
    addEventListener('resize', () => this.measure());
  }

  measure() {
    this.max = Math.max(0, this.el.scrollWidth - innerWidth + innerWidth * 0.06);
  }

  update(dt) {
    if (!this.max) return;
    const local = this.scroll.local(this.index);
    if (local <= 0 || local >= 1) {
      if (Math.abs(this.dragTarget) > 0.5) this.dragTarget = 0;
    }
    const base = lerp(0, -this.max, clamp((local - 0.28) / 0.6, 0, 1));
    this.drag = damp(this.drag, this.dragTarget, 5, dt);
    const target = clamp(base + this.drag, -this.max, 0);
    this.x = damp(this.x, target, 8, dt);
    this.el.style.transform = `translate3d(${this.x.toFixed(1)}px, 0, 0)`;

    const vw = innerWidth;
    this.imgs.forEach((img) => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.right < 0 || r.left > vw) return;
      const c = (r.left + r.width / 2 - vw / 2) / vw;
      img.style.transform = `translateX(${(-c * 6).toFixed(2)}%)`;
    });

    if (this.bar) this.bar.style.transform = `scaleX(${(-this.x / this.max).toFixed(4)})`;
  }
}
