import * as THREE from 'three';
import { groundY } from './Terrain.js';

/* coteaux boisés, pins, chênes verts, crêtes calcaires au loin */
export class Landscape {
  constructor(scene, mats) {
    this.group = new THREE.Group();
    scene.add(this.group);

    /* crêtes lointaines — échines douces (Vercors au nord, collines au sud) */
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

    /* pin sylvestre — fût nu + houppier en plateaux */
    const pin = (x, z, s = 1, mat = mats.canopy) => {
      const g = new THREE.Group();
      const y0 = groundY(x, z);
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.09 * s, 0.14 * s, 3.4 * s, 6), mats.trunk);
      t.position.y = 1.7 * s; t.castShadow = true;
      g.add(t);
      const c1 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6 * s, 1), mat);
      c1.scale.y = 0.42; c1.position.y = 3.6 * s; c1.castShadow = true;
      const c2 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1 * s, 1), mat);
      c2.scale.y = 0.4; c2.position.set(0.5 * s, 4.3 * s, 0.2 * s); c2.castShadow = true;
      g.add(c1, c2);
      g.position.set(x, y0 - 0.1, z);
      g.rotation.y = x * 1.7 + z;
      this.group.add(g);
    };
    /* chêne vert — masse ronde dense */
    const chene = (x, z, s = 1) => {
      const g = new THREE.Group();
      const y0 = groundY(x, z);
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.17 * s, 1.5 * s, 6), mats.trunk);
      t.position.y = 0.75 * s; t.castShadow = true;
      const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7 * s, 1), mats.canopySombre);
      c.scale.y = 0.78; c.position.y = 2.4 * s; c.castShadow = true;
      g.add(t, c);
      g.position.set(x, y0 - 0.1, z);
      g.rotation.y = z * 2.3;
      this.group.add(g);
    };

    /* bosquet de pins au nord, derrière la maison et la ferme */
    pin(-16, -20, 1.5); pin(-10, -17, 1.2); pin(-44, -26, 1.8);
    pin(-49, -19, 1.3); pin(-40, -30, 1.5); pin(-22, -24, 1.1);
    /* pins d'accompagnement à l'est, au-delà du bassin */
    pin(42, -12, 1.6); pin(48, -4, 1.2);
    /* chênes verts sur le coteau sud */
    chene(-14, 15, 1.3); chene(30, 14, 1.6); chene(-27, 11, 1.1);
    chene(9, 21, 1.4); chene(46, 10, 1.0);
    /* boisement lointain — masses simples sur les pentes */
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const r = 64 + (i % 5) * 15;
      const x = Math.cos(a) * r * 1.4;
      const z = -30 + Math.sin(a) * r;
      if (Math.abs(x) < 42 && z > -30 && z < 24) continue;
      const s = 1.6 + (i % 3) * 0.9;
      const c = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4 * s, 1), (i % 2) ? mats.canopy : mats.canopySombre);
      c.scale.y = 0.6;
      c.position.set(x, groundY(x, z) + 1.1 * s, z);
      this.group.add(c);
    }

    /* chemin d'accès gravier — serpente depuis l'est jusqu'à la maison */
    const pathGeo = new THREE.PlaneGeometry(34, 3.2, 30, 3);
    pathGeo.rotateX(-Math.PI / 2);
    const pp = pathGeo.attributes.position;
    for (let i = 0; i < pp.count; i++) {
      const lx = pp.getX(i), lz = pp.getZ(i);
      const wx = lx + 40;
      const wz = lz - 3 + Math.sin(lx * 0.16) * 2.4;
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
