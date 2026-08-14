import gsap from 'gsap';
import { $, $$, REDUCED } from '../core/utils.js';

/* le sommaire transforme la scène : la caméra recule,
   le monde s'assombrit, la typographie prend toute la place */
export class Menu {
  constructor(app) {
    this.app = app;
    this.el = $('#menu');
    this.bg = $('#menuBg');
    this.btn = $('#menuBtn');
    this.btnLabel = $('#menuBtnLabel');
    this.links = $$('.menu-list a');
    this.open = false;
    this.busy = false;

    /* filigrane : clone de la planche d'architecte, à l'encre claire */
    const sheet = $('#sheetSvg');
    if (sheet) {
      const clone = sheet.cloneNode(true);
      clone.removeAttribute('id');
      clone.querySelectorAll('[style]').forEach((p) => p.removeAttribute('style'));
      clone.querySelectorAll('.bp, .bp-hatch, .bp-dim, .bp-topo, .bp-pool, .bp-dash').forEach((p) => {
        p.style.stroke = '#e8f5ee';
      });
      clone.querySelectorAll('.bp-txt, .bp-cap').forEach((p) => {
        p.style.fill = '#e8f5ee';
        p.style.opacity = '0.6';
      });
      this.bg.appendChild(clone);
    }

    this.btn.addEventListener('click', () => this.toggle());
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.open) this.toggle();
    });

    this.animPromise = Promise.resolve();
    this.links.forEach((a) => {
      a.addEventListener('click', async (e) => {
        e.preventDefault();
        const target = a.getAttribute('href');
        await this.animPromise;
        if (this.open) await this.toggle();
        this.app.scroll.to(target);
      });
    });
  }

  toggle() {
    if (this.busy) return this.animPromise;
    this.busy = true;
    this.open = !this.open;

    document.body.classList.toggle('menu-open', this.open);
    this.btn.setAttribute('aria-expanded', this.open);
    this.el.setAttribute('aria-hidden', !this.open);
    this.btnLabel.textContent = this.open ? 'Fermer' : 'Sommaire';
    this.app.rig.menuTarget = this.open ? 1 : 0;

    this.animPromise = new Promise((resolve) => {
      const tl = gsap.timeline({
        onComplete: () => { this.busy = false; resolve(); }
      });

      if (this.open) {
        this.app.scroll.stop();
        this.el.classList.add('open');
        tl.to(this.bg, { opacity: 1, duration: REDUCED ? 0.1 : 0.7, ease: 'power2.out' });
        tl.to(this.links, {
          y: 0, duration: REDUCED ? 0 : 1.0, ease: 'power4.out', stagger: 0.055,
          startAt: { y: '110%' }
        }, '-=0.35');
        tl.fromTo($('.menu-side'), { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }, '-=0.7');
      } else {
        tl.to(this.links, { y: '-110%', duration: REDUCED ? 0 : 0.55, ease: 'power3.in', stagger: 0.03 });
        tl.to(this.bg, { opacity: 0, duration: 0.55, ease: 'power2.in' }, '-=0.2');
        tl.add(() => {
          this.el.classList.remove('open');
          gsap.set(this.links, { y: '110%' });
          this.app.scroll.start();
        });
      }
    });
    return this.animPromise;
  }
}
