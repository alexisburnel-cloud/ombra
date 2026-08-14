import { $ } from '../core/utils.js';

/* vent procédural, très bas — jamais autoplay, contrôle évident */
export class Sound {
  constructor() {
    this.btn = $('#soundBtn');
    this.state = $('#soundState');
    this.on = false;
    this.ctx = null;
    if (this.btn) this.btn.addEventListener('click', () => this.toggle());
  }

  build() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.ctx = ctx;

    /* bruit brun bouclé */
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.2;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    lp.Q.value = 0.4;

    /* respiration du vent */
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 160;
    lfo.connect(lfoGain).connect(lp.frequency);
    lfo.start();

    const windGain = ctx.createGain();
    windGain.gain.value = 0.055;

    /* nappe grave discrète */
    const padGain = ctx.createGain();
    padGain.gain.value = 0.012;
    [55, 82.4].forEach((f) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      o.detune.value = Math.random() * 6 - 3;
      o.connect(padGain);
      o.start();
    });

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    src.connect(lp).connect(windGain).connect(this.master);
    padGain.connect(this.master);
    this.master.connect(ctx.destination);
    src.start();
  }

  toggle() {
    this.on = !this.on;
    if (this.on && !this.ctx) this.build();
    if (this.ctx) {
      this.ctx.resume();
      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.linearRampToValueAtTime(this.on ? 1 : 0, t + 1.2);
    }
    this.state.textContent = this.on ? 'ACTIF' : 'COUPÉ';
    document.body.classList.toggle('sound-on', this.on);
  }
}
