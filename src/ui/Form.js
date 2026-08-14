import { $ } from '../core/utils.js';

/* prise de contact honnête, sans backend : le message part
   par la messagerie du visiteur vers contact@carene.net */
export class Form {
  constructor() {
    this.el = $('#ctForm');
    this.err = $('#fError');
    if (!this.el) return;
    this.el.addEventListener('submit', (e) => {
      e.preventDefault();
      this.err.textContent = '';
      const d = Object.fromEntries(new FormData(this.el).entries());
      const missing = ['prenom', 'nom', 'tel', 'email', 'message'].filter((k) => !String(d[k] || '').trim());
      if (missing.length) {
        this.err.textContent = 'MERCI DE REMPLIR TOUS LES CHAMPS.';
        return;
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) {
        this.err.textContent = 'ADRESSE EMAIL INVALIDE.';
        return;
      }
      const subject = encodeURIComponent(`Projet — ${d.prenom} ${d.nom}`);
      const body = encodeURIComponent(
        `${d.message}\n\n—\n${d.prenom} ${d.nom}\nTél : ${d.tel}\nEmail : ${d.email}`
      );
      location.href = `mailto:contact@carene.net?subject=${subject}&body=${body}`;
    });
  }
}
