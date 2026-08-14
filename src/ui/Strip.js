import { $, clamp, damp, lerp } from '../core/utils.js';

/* planches — bande horizontale : le défilement la traverse,
   la main peut la saisir */
export class Strip {
  constructor(scrollDirector, sectionIndex) {
    this.scroll = scrollDirector;
    this.index = sectionIndex;
    this.el = $('#strip');
    this.bar = $('#stripBar');
    this.wrap = this.el.parentElement;

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
  }

  fill(items) {
    items.forEach((it, i) => {
      const fig = document.createElement('figure');
      fig.className = it.portrait ? 'portrait' : 'landscape';
      fig.innerHTML =
        `<img src="${it.src}" alt="${it.name}" draggable="false" />` +
        `<figcaption><span>PL.${String(i + 1).padStart(2, '0')}</span><span>${it.name.toUpperCase()}</span></figcaption>`;
      this.el.appendChild(fig);
    });
    this.imgs = [...this.el.querySelectorAll('img')];
    this.measure();
  }

  measure() {
    this.max = Math.max(0, this.el.scrollWidth - innerWidth + innerWidth * 0.08);
  }

  update(dt) {
    if (!this.imgs || !this.max) return;
    const local = this.scroll.local(this.index);
    if (local <= 0 || local >= 1) {
      if (Math.abs(this.dragTarget) > 0.5) this.dragTarget = 0;
    }
    const base = lerp(0, -this.max, clamp((local - 0.06) / 0.88, 0, 1));
    this.drag = damp(this.drag, this.dragTarget, 5, dt);
    const target = clamp(base + this.drag, -this.max, 0);
    this.x = damp(this.x, target, 8, dt);
    this.el.style.transform = `translate3d(${this.x.toFixed(1)}px, 0, 0)`;

    /* parallaxe interne des images */
    const vw = innerWidth;
    this.imgs.forEach((img) => {
      const r = img.parentElement.getBoundingClientRect();
      const c = (r.left + r.width / 2 - vw / 2) / vw;
      img.style.transform = `translateX(${(-c * 6).toFixed(2)}%)`;
    });

    this.bar.style.transform = `scaleX(${(-this.x / this.max).toFixed(4)})`;
  }
}
