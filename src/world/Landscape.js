import * as THREE from 'three';
import { Water } from './Water.js';

/* terrain, lac lointain, arbres stylisés, lignes de crête */
export class Landscape {
  constructor(scene, mats) {
    this.group = new THREE.Group();
    scene.add(this.group);

    const lawn = new THREE.Mesh(new THREE.PlaneGeometry(620, 110), mats.lawn);
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.set(0, -0.01, 8);
    lawn.receiveShadow = true;
    this.group.add(lawn);

    /* le lac — au nord, derrière la villa : le soleil s'y couche */
    this.lake = new Water({ width: 640, depth: 170, calm: 1, scale: 0.14 });
    this.lake.mesh.position.set(0, 0.02, -130);
    this.group.add(this.lake.mesh);

    /* crêtes lointaines — longues échines sans about visible */
    const ridge = (w, h, x, z, r = 0) => {
      const g = new THREE.CylinderGeometry(h, h * 2.6, w, 7, 1);
      g.rotateZ(Math.PI / 2);
      const m = new THREE.Mesh(g, mats.hill);
      m.scale.set(1, 1, 0.35);
      m.position.set(x, -h * 0.15, z);
      m.rotation.y = r;
      this.group.add(m);
    };
    ridge(320, 7, -120, -60, 0.16);
    ridge(380, 10, 150, -70, -0.12);
    ridge(260, 4.5, -20, -52, 0.04);
    ridge(500, 16, -60, -130, 0.24);
    ridge(520, 20, 220, -140, -0.2);

    /* cyprès — ponctuation verticale */
    const cypress = (x, z, h, r) => {
      const g = new THREE.Group();
      const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), mats.canopy);
      c.position.y = h / 2 + 0.3;
      c.castShadow = true;
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.5, 5), mats.trunk);
      t.position.y = 0.2;
      g.add(c, t);
      g.position.set(x, 0, z);
      this.group.add(g);
    };
    cypress(-19, 4, 6.4, 0.72);
    cypress(-21.5, 0.5, 5.2, 0.6);
    cypress(-18, -3, 7.1, 0.8);
    cypress(24, -8, 5.8, 0.68);
    cypress(30, 12, 4.6, 0.55);

    /* arbres à canopée — masses horizontales */
    const tree = (x, z, s) => {
      const g = new THREE.Group();
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.09 * s, 0.13 * s, 2.1 * s, 6), mats.trunk);
      t.position.y = 1.05 * s;
      t.castShadow = true;
      const c1 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.9 * s, 1), mats.canopy);
      c1.scale.y = 0.55;
      c1.position.y = 2.6 * s;
      c1.castShadow = true;
      const c2 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25 * s, 1), mats.canopy);
      c2.scale.y = 0.5;
      c2.position.set(1.1 * s, 3.15 * s, 0.4 * s);
      c2.castShadow = true;
      g.add(t, c1, c2);
      g.position.set(x, 0, z);
      this.group.add(g);
    };
    tree(34, -14, 1.25);
    tree(-21, 15, 1.0);
    tree(-40, 22, 1.5);
  }
}
