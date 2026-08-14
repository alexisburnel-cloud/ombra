import { $, $$, damp, clamp } from '../core/utils.js';

/* index des œuvres — l'image flotte sous le curseur */
export class Works {
  constructor() {
    this.list = $('#works');
    this.rows = $$('.work');
    this.peek = $('#workPeek');
    this.img = $('#workPeekImg');
    this.shots = [];
    this.x = 0; this.y = 0; this.tx = 0; this.ty = 0;
    this.vx = 0;
    this.active = false;

    this.rows.forEach((row) => {
      row.addEventListener('mouseenter', () => {
        const i = +row.dataset.shot;
        if (this.shots[i]) {
          this.img.src = this.shots[i].src;
          this.peek.classList.add('on');
          this.peek.style.opacity = 1;
          this.active = true;
        }
        this.list.classList.add('hovering');
        this.rows.forEach((r) => r.classList.toggle('hot', r === row));
      });
      row.addEventListener('mouseleave', () => {
        row.classList.remove('hot');
      });
    });
    this.list.addEventListener('mouseleave', () => {
      this.list.classList.remove('hovering');
      this.peek.classList.remove('on');
      this.peek.style.opacity = 0;
      this.active = false;
    });

    addEventListener('pointermove', (e) => {
      this.tx = e.clientX; this.ty = e.clientY;
    }, { passive: true });
  }

  setShots(shots) { this.shots = shots; }

  update(dt) {
    if (!this.active && Math.abs(this.tx - this.x) < 0.5) return;
    const px = this.x;
    this.x = damp(this.x, this.tx, 11, dt);
    this.y = damp(this.y, this.ty, 11, dt);
    this.vx = clamp((this.x - px) * 0.6, -14, 14);
    const w = this.peek.offsetWidth || 280;
    this.peek.style.transform =
      `translate(${this.x - w / 2}px, ${this.y - this.peek.offsetHeight * 0.55}px) rotate(${this.vx * 0.16}deg)`;
  }
}
