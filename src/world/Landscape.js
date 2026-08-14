import * as THREE from 'three';
import { groundY } from './Terrain.js';
import { fbm } from '../core/utils.js';

/*
  Paysage V3 — coteaux boisés de la Drôme.
  Végétation organique : silhouettes déformées par bruit, échelles et
  rotations variées, strates (arbres, arbustes, graminées), crêtes
  lointaines en plans successifs fondus dans la brume.
*/

/* déforme une géométrie par bruit — feuillages organiques */
function ruffle(geo, amp, freq, seed = 0) {
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = fbm(v.x * freq + seed, (v.y + v.z) * freq - seed, 3) - 0.5;
    const len = v.length() || 1;
    const s = 1 + (n * 2 * amp) / len;
    pos.setXYZ(i, v.x * s, v.y * s, v.z * s);
  }
  geo.computeVertexNormals();
  return geo;
}

export class Landscape {
  constructor(scene, mats) {
    this.group = new THREE.Group();
    scene.add(this.group);

    /* crêtes lointaines — échines douces en plans successifs */
    const ridge = (w, h, x, y, z, r = 0, sz = 0.32) => {
      const g = new THREE.CylinderGeometry(h, h * 2.8, w, 18, 1);
      g.rotateZ(Math.PI / 2);
      const m = new THREE.Mesh(g, mats.hill);
      m.scale.set(1, 1, sz);
      m.position.set(x, y, z);
      m.rotation.y = r;
      this.group.add(m);
    };
    ridge(460, 20, -40, 2, -235, 0.06);
    ridge(400, 15, 160, 0, -210, -0.12);
    ridge(460, 11, -90, -5, 185, 0.05);
    ridge(560, 16, 190, -7, 240, -0.14);

    /* matériaux de feuillage nuancés (variation de teinte par arbre) */
    const canopyMats = [
      mats.canopy,
      mats.canopySombre,
      mats.canopy.clone(), mats.canopySombre.clone()
    ];
    canopyMats[2].color = new THREE.Color(0x5d6c40);
    canopyMats[3].color = new THREE.Color(0x44532f);

    /* pin sylvestre — fût nu, houppier en plateaux irréguliers */
    const pin = (x, z, s = 1, seed = 0) => {
      const g = new THREE.Group();
      const y0 = groundY(x, z);
      const lean = (fbm(x * 0.3, z * 0.3, 2) - 0.5) * 0.16;
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * s, 0.16 * s, 3.6 * s, 7), mats.trunk);
      t.position.y = 1.8 * s;
      t.rotation.z = lean;
      t.castShadow = true;
      g.add(t);
      const nPl = 2 + Math.floor(fbm(seed, x, 2) * 2.9);
      for (let i = 0; i < nPl; i++) {
        const r = (1.9 - i * 0.42) * s * (0.85 + fbm(i, seed + 3, 2) * 0.4);
        const geo = ruffle(new THREE.IcosahedronGeometry(r, 2), 0.34, 1.3, seed + i * 7);
        const c = new THREE.Mesh(geo, canopyMats[(seed + i) % 4 | 0]);
        c.scale.y = 0.32 + fbm(i * 3, seed, 2) * 0.1;
        c.position.set(
          (fbm(seed + i, 1, 2) - 0.5) * 1.1 * s + lean * 3,
          (3.3 + i * 0.75) * s,
          (fbm(seed + i, 9, 2) - 0.5) * 1.1 * s
        );
        c.castShadow = true;
        g.add(c);
      }
      g.position.set(x, y0 - 0.1, z);
      g.rotation.y = x * 1.7 + z;
      this.group.add(g);
    };

    /* chêne — couronne large en masses composées */
    const chene = (x, z, s = 1, seed = 1) => {
      const g = new THREE.Group();
      const y0 = groundY(x, z);
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.13 * s, 0.2 * s, 1.6 * s, 7), mats.trunk);
      t.position.y = 0.8 * s;
      t.castShadow = true;
      g.add(t);
      const nB = 3 + (seed % 2);
      for (let i = 0; i < nB; i++) {
        const r = (1.35 - i * 0.14) * s * (0.85 + fbm(i, seed, 2) * 0.45);
        const geo = ruffle(new THREE.IcosahedronGeometry(r, 2), 0.3, 1.1, seed * 3 + i * 5);
        const c = new THREE.Mesh(geo, canopyMats[(seed + i * 2) % 4 | 0]);
        c.scale.y = 0.72 + fbm(i, seed + 8, 2) * 0.2;
        c.position.set(
          (fbm(seed, i * 2, 2) - 0.5) * 1.5 * s,
          (2.1 + fbm(i * 5, seed, 2) * 1.1) * s,
          (fbm(seed, i * 7 + 2, 2) - 0.5) * 1.5 * s
        );
        c.castShadow = true;
        g.add(c);
      }
      g.position.set(x, y0 - 0.1, z);
      g.rotation.y = z * 2.3;
      this.group.add(g);
    };

    /* cyprès de haie — fuseau légèrement irrégulier */
    const cypres = (x, z, s = 1, seed = 2) => {
      const y0 = groundY(x, z);
      const geo = ruffle(new THREE.ConeGeometry(0.5 * s, 4.6 * s, 8, 3), 0.16, 2.2, seed);
      const c = new THREE.Mesh(geo, canopyMats[3]);
      c.position.set(x, y0 + 2.2 * s, z);
      c.castShadow = true;
      this.group.add(c);
    };

    /* graminées — touffes fines près des terrasses */
    const graminee = (x, z, s = 1) => {
      const y0 = groundY(x, z);
      const g = new THREE.Group();
      for (let i = 0; i < 7; i++) {
        const b = new THREE.Mesh(new THREE.ConeGeometry(0.025 * s, 0.75 * s * (0.7 + Math.random() * 0.6), 4), canopyMats[2]);
        b.position.set((Math.random() - 0.5) * 0.5 * s, 0.32 * s, (Math.random() - 0.5) * 0.5 * s);
        b.rotation.z = (Math.random() - 0.5) * 0.5;
        g.add(b);
      }
      g.position.set(x, y0, z);
      this.group.add(g);
    };

    /* — composition — */
    /* bosquet de pins au nord, derrière la maison et la ferme */
    pin(-18, -22, 1.5, 1); pin(-11, -18, 1.2, 2); pin(-46, -28, 1.8, 3);
    pin(-52, -20, 1.3, 4); pin(-42, -32, 1.5, 5); pin(-24, -26, 1.1, 6);
    pin(24, -20, 1.4, 7);
    /* pins d'accompagnement à l'est, au-delà de la cour */
    pin(44, -14, 1.6, 8); pin(50, -5, 1.2, 9);
    /* chênes sur le coteau sud */
    chene(-16, 16, 1.3, 1); chene(32, 15, 1.6, 2); chene(-29, 12, 1.1, 3);
    chene(10, 22, 1.4, 4); chene(48, 11, 1.0, 5); chene(-38, 18, 1.2, 6);
    /* haie de cyprès le long de la cour */
    cypres(29.5, -13.5, 1.1, 1); cypres(29.5, -11, 1.0, 2); cypres(29.5, -8.5, 1.15, 3);
    /* arbre d'ombrage dans la cour */
    chene(21, -12.6, 1.05, 7);
    /* graminées près du jacuzzi, de la piscine et du muret */
    graminee(-19.5, 8.8, 1.2); graminee(-16.2, 9.0, 1); graminee(-20.6, 5.9, 1.1);
    graminee(20.4, 7.0, 1.2); graminee(7.6, 7.6, 1); graminee(-21.5, 4.2, 0.9);
    graminee(26.6, -3.4, 1.1); graminee(6.9, -6.9, 0.9);

    /* boisement lointain — masses simples sur les pentes */
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const r = 64 + (i % 5) * 15;
      const x = Math.cos(a) * r * 1.4;
      const z = -30 + Math.sin(a) * r;
      if (Math.abs(x) < 48 && z > -34 && z < 30) continue;
      const s = 1.6 + (i % 3) * 0.9;
      const geo = ruffle(new THREE.IcosahedronGeometry(2.4 * s, 1), 0.3, 0.6, i);
      const c = new THREE.Mesh(geo, canopyMats[i % 4]);
      c.scale.y = 0.6;
      c.position.set(x, groundY(x, z) + 1.1 * s, z);
      this.group.add(c);
    }

    /* affleurements rocheux sur le coteau */
    [[-34, 10, 1.4], [38, 18, 1.8], [-48, -8, 2.2]].forEach(([rx, rz, rs]) => {
      const rock = new THREE.Mesh(ruffle(new THREE.IcosahedronGeometry(rs, 1), 0.4, 0.9, rx), mats.roche);
      rock.scale.y = 0.5;
      rock.position.set(rx, groundY(rx, rz) + rs * 0.16, rz);
      rock.castShadow = true;
      this.group.add(rock);
    });

    /* chemin d'accès gravier — serpente depuis l'est jusqu'à la cour */
    const pathGeo = new THREE.PlaneGeometry(30, 4.0, 30, 3);
    pathGeo.rotateX(-Math.PI / 2);
    const pp = pathGeo.attributes.position;
    for (let i = 0; i < pp.count; i++) {
      const lx = pp.getX(i), lz = pp.getZ(i);
      const wx = lx + 44;
      const wz = lz - 8 + Math.sin(lx * 0.14) * 2.0;
      pp.setX(i, wx);
      pp.setZ(i, wz);
      pp.setY(i, groundY(wx, wz) + 0.05);
    }
    pathGeo.computeVertexNormals();
    const path = new THREE.Mesh(pathGeo, mats.gravier);
    path.receiveShadow = true;
    this.group.add(path);
  }
}
