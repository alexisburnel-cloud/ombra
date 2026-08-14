import * as THREE from 'three';
import { smooth, clamp, lerp } from '../core/utils.js';

/*
  Le chantier — pelle mécanique, toupie béton, grue mobile,
  piquets d'implantation, terre décapée. Chaque engin accomplit
  une action lisible, puis quitte la scène. Sud = +z.
*/

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

function mesh(geo, mat, x, y, z, cast = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = true;
  return m;
}

/* pelle mécanique sur chenilles, flèche articulée deux segments + godet */
function buildPelle(mats) {
  const g = new THREE.Group();
  /* chenilles */
  [-0.95, 0.95].forEach((zz) => {
    const tr = new THREE.Group();
    tr.add(mesh(box(3.1, 0.75, 0.62), mats.chenille, 0, 0.42, zz));
    tr.add(mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.6, 12).rotateX(Math.PI / 2), mats.chenille, -1.55, 0.42, zz, false));
    tr.add(mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.6, 12).rotateX(Math.PI / 2), mats.chenille, 1.55, 0.42, zz, false));
    g.add(tr);
  });
  g.add(mesh(box(2.4, 0.3, 2.3), mats.enginFonce, 0, 0.92, 0));
  /* tourelle */
  const tour = new THREE.Group();
  tour.position.set(0, 1.07, 0);
  tour.add(mesh(box(2.5, 1.15, 2.1), mats.engin, -0.35, 0.6, 0));
  tour.add(mesh(box(1.1, 0.5, 1.9), mats.enginFonce, -1.75, 0.45, 0));
  /* cabine vitrée */
  tour.add(mesh(box(1.05, 1.05, 0.95), mats.engin, 0.45, 1.55, 0.55));
  tour.add(mesh(box(0.85, 0.7, 0.86), mats.enginVitre, 0.45, 1.68, 0.56, false));
  /* flèche : segment 1 */
  const boom = new THREE.Group();
  boom.position.set(1.0, 1.05, -0.15);
  const seg1 = mesh(box(2.9, 0.5, 0.36), mats.engin, 1.35, 0, 0);
  boom.add(seg1);
  /* vérin décoratif */
  boom.add(mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.6, 8).rotateZ(1.2), mats.aluClair, 0.9, -0.35, 0.24, false));
  /* segment 2 (balancier) */
  const stick = new THREE.Group();
  stick.position.set(2.75, 0, 0);
  stick.add(mesh(box(2.2, 0.34, 0.28), mats.engin, 1.0, 0, 0));
  /* godet */
  const bucket = new THREE.Group();
  bucket.position.set(2.1, 0, 0);
  bucket.add(mesh(box(0.75, 0.55, 0.85), mats.enginFonce, 0.3, -0.2, 0));
  stick.add(bucket);
  boom.add(stick);
  tour.add(boom);
  g.add(tour);
  return { group: g, tour, boom, stick, bucket };
}

/* toupie béton */
function buildToupie(mats) {
  const g = new THREE.Group();
  g.add(mesh(box(5.6, 0.5, 1.9), mats.enginFonce, 0, 0.75, 0));
  [-1.9, -0.6, 1.9].forEach((wx) => {
    [-0.95, 0.95].forEach((wz) => {
      g.add(mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.34, 14).rotateX(Math.PI / 2), mats.chenille, wx, 0.46, wz, false));
    });
  });
  /* cabine */
  g.add(mesh(box(1.25, 1.35, 1.8), mats.engin, -2.5, 1.65, 0));
  g.add(mesh(box(1.05, 0.65, 1.66), mats.enginVitre, -2.42, 1.95, 0, false));
  /* tambour incliné strié */
  const drum = new THREE.Group();
  drum.position.set(0.7, 1.8, 0);
  const d = mesh(new THREE.CylinderGeometry(0.55, 0.95, 3.0, 14), mats.engin, 0, 0, 0);
  d.rotation.z = 1.32;
  drum.add(d);
  const stripes = mesh(new THREE.CylinderGeometry(0.97, 0.97, 0.24, 14), mats.enginFonce, -0.6, -0.14, 0, false);
  stripes.rotation.z = 1.32;
  drum.add(stripes);
  g.add(drum);
  /* goulotte */
  g.add(mesh(box(1.1, 0.16, 0.4), mats.aluClair, 2.6, 1.5, 0, false));
  return { group: g, drum };
}

/* poussière de chantier — sprites doux à durée de vie courte */
function dustTexture() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const ctx = cv.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, 'rgba(212,202,182,0.5)');
  grad.addColorStop(0.55, 'rgba(206,196,176,0.2)');
  grad.addColorStop(1, 'rgba(200,190,170,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(cv);
}

class Dust {
  constructor(parent, count) {
    const tex = dustTexture();
    this.pool = [];
    for (let i = 0; i < count; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({
        map: tex, transparent: true, opacity: 0, depthWrite: false
      }));
      s.visible = false;
      s.userData = { life: 0, vel: new THREE.Vector3(), grow: 1 };
      parent.add(s);
      this.pool.push(s);
    }
    this._i = 0;
  }

  emit(p, spread, up) {
    const s = this.pool[this._i = (this._i + 1) % this.pool.length];
    s.position.set(
      p.x + (Math.random() - 0.5) * spread,
      p.y + Math.random() * 0.2,
      p.z + (Math.random() - 0.5) * spread
    );
    s.userData.life = 1;
    s.userData.vel.set((Math.random() - 0.5) * 0.5, up * (0.5 + Math.random() * 0.4), (Math.random() - 0.5) * 0.5);
    s.userData.grow = 0.9 + Math.random() * 0.8;
    const sz = 0.5 + Math.random() * 0.4;
    s.scale.setScalar(sz);
    s.visible = true;
  }

  update(dt) {
    this.pool.forEach((s) => {
      if (s.userData.life <= 0) return;
      s.userData.life -= dt * 0.55;
      if (s.userData.life <= 0) { s.visible = false; s.material.opacity = 0; return; }
      s.position.addScaledVector(s.userData.vel, dt);
      s.userData.vel.x *= 1 - dt * 0.4;
      s.userData.vel.z *= 1 - dt * 0.4;
      const age = 1 - s.userData.life;
      s.scale.setScalar(s.scale.x + dt * s.userData.grow);
      s.material.opacity = Math.min(age * 4, 1) * s.userData.life * 0.65;
    });
  }
}

/* grue mobile — porteur + flèche télescopique + élingue */
function buildGrue(mats) {
  const g = new THREE.Group();
  g.add(mesh(box(6.4, 0.55, 2.1), mats.engin, 0, 0.8, 0));
  [-2.4, -1.1, 1.4, 2.5].forEach((wx) => {
    [-1.05, 1.05].forEach((wz) => {
      g.add(mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.36, 14).rotateX(Math.PI / 2), mats.chenille, wx, 0.5, wz, false));
    });
  });
  g.add(mesh(box(1.35, 1.25, 1.95), mats.engin, -2.55, 1.7, 0));
  g.add(mesh(box(1.15, 0.6, 1.8), mats.enginVitre, -2.5, 1.95, 0, false));
  /* stabilisateurs */
  [-1.8, 2.2].forEach((sx) => {
    [-1.5, 1.5].forEach((sz) => {
      g.add(mesh(box(0.18, 0.7, 0.18), mats.aluClair, sx, 0.45, sz, false));
    });
  });
  /* flèche télescopique */
  const fl = new THREE.Group();
  fl.position.set(0.6, 1.35, 0);
  const s1 = mesh(box(4.6, 0.44, 0.44), mats.engin, 2.0, 0, 0);
  const s2 = mesh(box(3.4, 0.32, 0.32), mats.engin, 4.6, 0, 0, false);
  fl.add(s1, s2);
  fl.rotation.z = 0.62;
  /* câble + crochet + panne portée */
  const cable = mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.6, 6), mats.chenille, 6.2, -1.35, 0, false);
  fl.add(cable);
  const charge = mesh(box(3.4, 0.18, 0.18), mats.charpente ?? mats.engin, 6.2, -2.75, 0);
  fl.add(charge);
  g.add(fl);
  return { group: g, fleche: fl, charge };
}

export class Chantier {
  constructor(scene, mats) {
    this.group = new THREE.Group();
    scene.add(this.group);

    /* terre décapée — plateforme de chantier + tas de déblais */
    this.terre = new THREE.Mesh(new THREE.PlaneGeometry(50, 26, 1, 1).rotateX(-Math.PI / 2), mats.terre);
    this.terre.position.set(2, 0.045, -2.5);
    this.terre.receiveShadow = true;
    this.group.add(this.terre);
    const tas = new THREE.Mesh(new THREE.SphereGeometry(2.6, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mats.terre);
    tas.scale.set(1.3, 0.6, 1);
    tas.position.set(24.5, 0, 2.5);
    tas.castShadow = true;
    this.tas = tas;
    this.group.add(tas);

    /* piquets + cordeaux d'implantation */
    this.implant = new THREE.Group();
    const corners = [[-19.4, -6.4], [17.2, -6.4], [17.2, 4.1], [-19.4, 4.1]];
    corners.forEach(([px, pz]) => {
      this.implant.add(mesh(box(0.05, 0.85, 0.05), mats.charpente, px, 0.42, pz));
    });
    const lineMat = new THREE.LineBasicMaterial({ color: 0xe8ddc4, transparent: true, opacity: 0.9 });
    const pts = corners.concat([corners[0]]).map(([px, pz]) => new THREE.Vector3(px, 0.8, pz));
    this.implant.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
    this.group.add(this.implant);

    /* engins */
    this.pelle = buildPelle(mats);
    this.pelle.group.position.set(22, 0.1, 3.5);
    this.pelle.group.rotation.y = -0.5;
    this.pelle.group.scale.setScalar(1.25);
    this.group.add(this.pelle.group);

    this.toupie = buildToupie(mats);
    this.toupie.group.position.set(20, 0.1, -9);
    this.toupie.group.rotation.y = 0.15;
    this.group.add(this.toupie.group);

    this.grue = buildGrue(mats);
    this.grue.group.position.set(-2, 0.1, -12.5);
    this.grue.group.rotation.y = 0.35;
    this.group.add(this.grue.group);

    /* poussière */
    this.dust = new Dust(this.group, 48);
    this._emitT = 0;
    this._lastT = 0;
    this._v = new THREE.Vector3();
  }

  /* c : progression chantier 0..1 · t : temps */
  update(c, t) {
    const dt = clamp(t - this._lastT, 0, 0.05);
    this._lastT = t;
    const vis = c > 0.015 && c < 0.97;
    this.group.visible = vis;
    if (!vis) return;

    /* implantation : piquets pendant la phase 0.02..0.3 */
    this.implant.visible = c < 0.34;

    /* terre visible du décapage aux finitions, fond en douceur */
    const terreIn = smooth(0.07, 0.14, c) * (1 - smooth(0.62, 0.82, c));
    this.terre.material.transparent = true;
    this.terre.material.opacity = terreIn;
    this.terre.visible = terreIn > 0.02;
    this.tas.scale.y = 0.6 * terreIn;
    this.tas.visible = terreIn > 0.05;

    /* — PELLE : entre par l'est, creuse (0.1..0.34), repart — */
    const pIn = smooth(0.06, 0.14, c);
    const pOut = smooth(0.38, 0.48, c);
    const px = lerp(40, 22, pIn) + pOut * 22;
    this.pelle.group.position.x = px;
    this.pelle.group.visible = pOut < 0.98;
    const dig = smooth(0.12, 0.34, c) * (1 - pOut);
    if (dig > 0.001) {
      const ph = t * 1.4;
      this.pelle.tour.rotation.y = Math.sin(ph * 0.5) * 0.55 * dig;
      this.pelle.boom.rotation.z = (0.45 + Math.sin(ph) * 0.28) * dig;
      this.pelle.stick.rotation.z = (-0.85 + Math.cos(ph * 1.1) * 0.35) * dig;
      this.pelle.bucket.rotation.z = (-0.5 + Math.sin(ph * 1.3 + 1) * 0.45) * dig;
    }

    /* — TOUPIE : présente pendant fondations/dalle (0.2..0.4) — */
    const tIn = smooth(0.17, 0.24, c);
    const tOut = smooth(0.4, 0.5, c);
    this.toupie.group.position.x = lerp(38, 20, tIn) + tOut * 24;
    this.toupie.group.visible = tOut < 0.98;
    this.toupie.drum.rotation.x = t * 1.1;

    /* — GRUE : structure/charpente (0.34..0.6) — */
    const gIn = smooth(0.32, 0.4, c);
    const gOut = smooth(0.6, 0.7, c);
    this.grue.group.position.z = lerp(-30, -12.5, gIn) - gOut * 26;
    this.grue.group.visible = gOut < 0.98;
    const lift = smooth(0.4, 0.56, c);
    this.grue.fleche.rotation.z = 0.62 + Math.sin(t * 0.4) * 0.02;
    this.grue.fleche.rotation.y = Math.sin(t * 0.25) * 0.12 * lift;
    this.grue.charge.visible = lift < 0.85;

    /* — POUSSIÈRE — */
    this._emitT += dt;
    const pump = this._emitT > 0.07;
    if (pump) this._emitT = 0;
    if (pump) {
      /* au godet, quand la pelle mord le sol */
      if (dig > 0.3 && Math.sin(t * 1.4 * 1.3 + 1) < -0.2) {
        this.pelle.bucket.getWorldPosition(this._v);
        this._v.y = Math.max(this._v.y - 0.3, 0.15);
        this.group.worldToLocal(this._v);
        this.dust.emit(this._v, 0.9, 1);
      }
      /* aux chenilles pendant les entrées/sorties d'engins */
      if ((pIn > 0.05 && pIn < 0.95) || (pOut > 0.05 && pOut < 0.95)) {
        this._v.set(this.pelle.group.position.x - 1.8, 0.25, this.pelle.group.position.z);
        this.dust.emit(this._v, 1.4, 0.5);
      }
      if ((tIn > 0.05 && tIn < 0.95) || (tOut > 0.05 && tOut < 0.95)) {
        this._v.set(this.toupie.group.position.x - 2.4, 0.25, this.toupie.group.position.z);
        this.dust.emit(this._v, 1.4, 0.5);
      }
      /* à la goulotte pendant la coulée du béton */
      if (tIn > 0.95 && tOut < 0.05) {
        this._v.set(3.2, 1.2, 0);
        this.toupie.group.localToWorld(this._v);
        this.group.worldToLocal(this._v);
        this.dust.emit(this._v, 0.4, 0.7);
      }
    }
    this.dust.update(dt);
  }
}
