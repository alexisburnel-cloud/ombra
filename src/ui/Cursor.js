import { $, damp, COARSE } from '../core/utils.js';

export class Cursor {
  constructor() {
    if (COARSE) return;
    document.body.classList.add('no-cursor');

    this.el = $('#cursor');
    this.dot = $('#cursorDot');
    this.ring = $('#cursorRing');
    this.label = $('#cursorLabel');

    this.x = innerWidth / 2; this.y = innerHeight / 2;
    this.rx = this.x; this.ry = this.y;
    this.visible = false;

    addEventListener('pointermove', (e) => {
      this.x = e.clientX; this.y = e.clientY;
      if (!this.visible) { this.visible = true; this.el.style.opacity = 1; }
    }, { passive: true });

    addEventListener('pointerdown', () => this.el.classList.add('is-down'));
    addEventListener('pointerup', () => this.el.classList.remove('is-down'));

    document.addEventListener('mouseover', (e) => {
      const t = e.target.closest('[data-cursor]');
      if (t) {
        this.label.textContent = t.dataset.cursor;
        this.el.classList.add('is-label');
      } else {
        this.el.classList.remove('is-label');
      }
    });
    document.addEventListener('mouseleave', () => { this.el.style.opacity = 0; this.visible = false; });

    this.el.style.opacity = 0;
  }

  update(dt) {
    if (COARSE) return;
    this.rx = damp(this.rx, this.x, 14, dt);
    this.ry = damp(this.ry, this.y, 14, dt);
    this.dot.style.transform = `translate(${this.x}px, ${this.y}px)`;
    this.ring.style.transform = `translate(${this.rx}px, ${this.ry}px)`;
  }
}
