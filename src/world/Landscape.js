import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { groundY } from './Terrain.js';
import { fbm } from '../core/utils.js';

/*
  Paysage V4 — belvédère de coteau face au Vercors.
  Massifs calcaires étagés au nord, parcelle clôturée, pelouse
  délimitée, massifs plantés, végétation photogrammétrique réelle
  (Poly Haven, CC0) avec repli procédural si un modèle manque.
*/

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

/* crête montagneuse : silhouette bruitée extrudée */
function mountainRange(width, height, jag, seed, color, cliffColor = null) {
  const N = 64;
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  const crest = [];
  for (let i = 0; i <= N; i++) {
    const x = -width / 2 + (i / N) * width;
    const y = height * (0.35
      + fbm(i * 0.09 + seed, seed, 4) * 0.55
      + fbm(i * 0.35 + seed * 2, seed + 5, 3) * jag);
    crest.push([x, y]);
    shape.lineTo(x, y);
  }
  shape.lineTo(width / 2, 0);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 6, bevelEnabled: false });
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 1, envMapIntensity: 0 });
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, mat));
  /* bande de falaises calcaires sous la crête (signature Vercors) */
  if (cliffColor) {
    const cliff = new THREE.Shape();
    cliff.moveTo(crest[6][0], crest[6][1] * 0.8);
    for (let i = 6; i <= N - 6; i++) cliff.lineTo(crest[i][0], crest[i][1] - height * 0.02);
    for (let i = N - 6; i >= 6; i--) cliff.lineTo(crest[i][0], crest[i][1] * (0.72 + fbm(i, seed, 2) * 0.08));
    cliff.closePath();
    const cgeo = new THREE.ExtrudeGeometry(cliff, { depth: 6.4, bevelEnabled: false });
    const cmat = new THREE.MeshStandardMaterial({ color: cliffColor, roughness: 1, envMapIntensity: 0 });
    const cm = new THREE.Mesh(cgeo, cmat);
    cm.position.z = -0.2;
    g.add(cm);
  }
  return g;
}

export class Landscape {
  constructor(scene, mats) {
    this.group = new THREE.Group();
    scene.add(this.group);

    /* ═══ LE VERCORS — plans étagés au nord ═══ */
    const far = mountainRange(900, 120, 0.12, 3, 0x8a95a4, 0xb8bcc0);
    far.position.set(60, -6, -340);
    this.group.add(far);
    const mid = mountainRange(760, 74, 0.16, 7, 0x66788a, 0xa8adad);
    mid.position.set(-120, -4, -280);
    this.group.add(mid);
    const near = mountainRange(680, 40, 0.2, 11, 0x4a5c54);
    near.position.set(40, -3, -225);
    this.group.add(near);
    /* collines douces au sud (vallée de la Drôme) */
    const south = mountainRange(700, 26, 0.1, 17, 0x5c6a58);
    south.rotation.y = Math.PI;
    south.position.set(-60, -6, 260);
    this.group.add(south);

    /* ═══ VÉGÉTATION RÉELLE (Poly Haven CC0) + replis ═══ */
    this.pending = [];
    const draco = new DRACOLoader();
    draco.setDecoderPath('/draco/');
    const gltf = new GLTFLoader();
    gltf.setDRACOLoader(draco);

    const canopyMats = [mats.canopy, mats.canopySombre];

    /* repli procédural en attendant / à défaut du modèle réel */
    const placeholder = (x, z, s, kind) => {
      const g = new THREE.Group();
      const y0 = groundY(x, z);
      if (kind === 'pin' || kind === 'fir') {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * s, 0.16 * s, 3.6 * s, 7), mats.trunk);
        t.position.y = 1.8 * s; t.castShadow = true; g.add(t);
        for (let i = 0; i < 3; i++) {
          const c = new THREE.Mesh(ruffle(new THREE.IcosahedronGeometry((1.8 - i * 0.4) * s, 2), 0.3, 1.4, x + i), canopyMats[i % 2]);
          c.scale.y = 0.36; c.position.y = (3.2 + i * 0.8) * s; c.castShadow = true; g.add(c);
        }
      } else {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.18 * s, 1.5 * s, 7), mats.trunk);
        t.position.y = 0.75 * s; t.castShadow = true; g.add(t);
        const c = new THREE.Mesh(ruffle(new THREE.IcosahedronGeometry(1.5 * s, 2), 0.32, 1.1, z), canopyMats[0]);
        c.scale.y = 0.8; c.position.y = 2.2 * s; c.castShadow = true; g.add(c);
      }
      g.position.set(x, y0 - 0.08, z);
      this.group.add(g);
      return g;
    };

    /* charge un modèle réel et remplace ses emplacements */
    const spots = { pin: [], fir: [], tree: [], small: [], shrub2: [], shrub4: [], fern: [], boulder: [], potted: [], planter: [] };
    const real = (name, list, scale = 1) => {
      gltf.load(`/models-opt/${name}.glb`, (g) => {
        const src = g.scene;
        src.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
        list.forEach(({ x, z, s, y, rot, ph }) => {
          const inst = src.clone(true);
          inst.scale.setScalar(s * scale);
          inst.rotation.y = rot;
          inst.position.set(x, y !== null ? y : groundY(x, z) - 0.04, z);
          this.group.add(inst);
          if (ph) { this.group.remove(ph); }
        });
      }, undefined, () => { /* modèle absent : le repli reste en place */ });
    };

    const put = (kind, x, z, s = 1, y = null) => {
      const ph = (kind === 'pin' || kind === 'fir' || kind === 'tree' || kind === 'small')
        ? placeholder(x, z, s, kind) : null;
      spots[kind].push({ x, z, s, y, rot: (x * 7.3 + z * 3.1) % (Math.PI * 2), ph });
    };

    /* pins autour du belvédère nord */
    put('pin', -18, -22, 1.4); put('pin', -46, -26, 1.7); put('pin', 26, -21, 1.3);
    put('pin', 44, -15, 1.5); put('fir', -11, -19, 1.1); put('fir', -52, -18, 1.4);
    /* feuillus du jardin et du coteau */
    put('tree', 21, -12.6, 1.0); /* ombrage de la cour */
    put('tree', -16, 17, 1.2); put('tree', 33, 16, 1.4); put('small', -29, 12, 1.1);
    put('small', 49, 10, 1.0); put('tree', -39, 19, 1.2);
    /* arbustes en massifs — le long des terrasses et de la cour */
    [[-20.8, 4.6], [-21.4, 7.4], [7.2, 8.0], [20.6, 7.4], [26.8, -3.6],
     [6.8, -7.0], [27.6, -13.2], [-24, 10.5]].forEach(([x, z]) => put('shrub2', x, z, 1.1));
    [[-18.6, 9.4], [21.8, 6.6], [8.4, -6.4], [24.4, -13.6]].forEach(([x, z]) => put('shrub4', x, z, 1));
    /* fougères à l'ombre nord */
    [[-9, -7.2], [-14.5, -7.4], [7.4, -9.2]].forEach(([x, z]) => put('fern', x, z, 1));
    /* enrochements */
    [[-33, 11, 1.6], [39, 17, 2.0], [-49, -8, 2.4]].forEach(([x, z, s]) => put('boulder', x, z, s));
    /* pots sur les terrasses — posés sur les platelages, pas dans le sol */
    [[-20.4, 4.4], [4.6, 4.7], [12.2, 1.8]].forEach(([x, z]) => put('potted', x, z, 1, 0.18));
    [[-6.2, 4.5], [16.6, 1.8]].forEach(([x, z]) => put('planter', x, z, 1, 0.18));

    real('pine_tree_01', spots.pin, 1);
    real('fir_tree_01', spots.fir, 1);
    real('island_tree_02', spots.tree, 1);
    real('tree_small_02', spots.small, 1);
    real('shrub_02', spots.shrub2, 1);
    real('shrub_04', spots.shrub4, 1);
    real('fern_02', spots.fern, 1);
    real('boulder_01', spots.boulder, 1);
    real('potted_plant_02', spots.potted, 1);
    real('planter_box_01', spots.planter, 1);

    /* ═══ LA PARCELLE — clôture claire-voie + pelouse délimitée ═══ */
    const fence = new THREE.Group();
    const post = new THREE.BoxGeometry(0.09, 1.05, 0.09);
    const rail = (a, b) => {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.07, 0.03), mats.bois);
      m.position.set((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2);
      m.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
      return m;
    };
    /* parcelle fermée sur 4 côtés, portail à l'arrivée du chemin (est, z≈-8) */
    const runs = [
      [[-33, 24], [-33, -26]],
      [[-33, -26], [38, -26]],
      [[38, -26], [38, -10.5]],
      [[38, -5.5], [38, 24]],
      [[38, 24], [-33, 24]]
    ];
    runs.forEach(([[ax, az], [bx, bz]]) => {
      const segs = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 2.4));
      for (let i = 0; i <= segs; i++) {
        const x = ax + ((bx - ax) * i) / segs, z = az + ((bz - az) * i) / segs;
        const p = new THREE.Mesh(post, mats.inkMetal);
        p.position.set(x, groundY(x, z) + 0.52, z);
        fence.add(p);
      }
      for (let h = 0; h < 3; h++) {
        const r = rail([ax, az], [bx, bz]);
        const midX = (ax + bx) / 2, midZ = (az + bz) / 2;
        r.position.y = groundY(midX, midZ) + 0.35 + h * 0.28;
        fence.add(r);
      }
    });
    /* portail : deux vantaux claire-voie entrouverts */
    const gy = groundY(38, -8);
    [[-10.4, 0.5], [-5.6, -0.5]].forEach(([z, dir]) => {
      const vantail = new THREE.Group();
      const cadre = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.1, 2.1), mats.inkMetal);
      cadre.position.set(0, 0.55, dir * 1.05);
      vantail.add(cadre);
      for (let h = 0; h < 3; h++) {
        const lisse = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 2.0), mats.bois);
        lisse.position.set(0.02, 0.28 + h * 0.3, dir * 1.05);
        vantail.add(lisse);
      }
      vantail.position.set(38, gy, z);
      vantail.rotation.y = dir * 0.5;
      fence.add(vantail);
    });
    this.group.add(fence);

    /* pelouse entretenue à l'intérieur de la parcelle (plus verte) */
    const lawnMat = mats.prairie.clone();
    lawnMat.color = new THREE.Color(0xa8b878);
    lawnMat.map = mats.prairie.map.clone();
    lawnMat.map.repeat.set(34, 22);
    const lawnGeo = new THREE.PlaneGeometry(68, 46, 52, 36);
    lawnGeo.rotateX(-Math.PI / 2);
    const lp = lawnGeo.attributes.position;
    for (let i = 0; i < lp.count; i++) {
      const x = lp.getX(i) + 2.5, z = lp.getZ(i) - 1;
      lp.setX(i, x); lp.setZ(i, z);
      lp.setY(i, groundY(x, z) + 0.035);
    }
    lawnGeo.computeVertexNormals();
    const lawn = new THREE.Mesh(lawnGeo, lawnMat);
    lawn.receiveShadow = true;
    this.group.add(lawn);

    /* chemin d'accès gravier — jusqu'au portail de la cour */
    const pathGeo = new THREE.PlaneGeometry(30, 4.0, 30, 3);
    pathGeo.rotateX(-Math.PI / 2);
    const pp = pathGeo.attributes.position;
    for (let i = 0; i < pp.count; i++) {
      const lx = pp.getX(i), lz = pp.getZ(i);
      const wx = lx + 52;
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
