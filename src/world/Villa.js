import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { smooth, clamp } from '../core/utils.js';
import { Water } from './Water.js';

/*
  Villa manifeste V3 — étude CARÈNE (mètres, sud = +z).
  Séjour cathédrale double hauteur à l'ouest (pignon vitré),
  corps de pierre (cuisine/salle à manger), attique bardé (suite),
  aile est garage sur cour gravier, pergola bioclimatique,
  piscine à marches, jacuzzi intime, quatre terrasses meublées.
  L'aile ancienne à rénover vit plus loin à l'ouest.
*/

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

function mesh(geo, mat, x, y, z, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

function gablePrism(w, halfDepth, rise) {
  const shape = new THREE.Shape();
  shape.moveTo(-halfDepth, 0);
  shape.lineTo(halfDepth, 0);
  shape.lineTo(0, rise);
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled: false });
  g.rotateY(-Math.PI / 2);
  g.translate(w / 2, 0, 0);
  return g;
}

export class Villa {
  constructor(scene, mats) {
    this.mats = mats;
    this.group = new THREE.Group();
    scene.add(this.group);

    const edgeSources = [];
    const addEdges = (m, threshold = 25) => edgeSources.push({ mesh: m, threshold });

    /* ═══════════ FONDATIONS ═══════════ */
    const gFond = new THREE.Group();
    [-16, -9, -2, 5, 11, 16].forEach((x) => {
      gFond.add(mesh(box(2.4, 0.6, 9.4), mats.betonBrut, x, -0.5, -1.4));
    });
    gFond.add(mesh(box(2.2, 0.6, 6.2), mats.betonBrut, 11.5, -0.5, -4));
    this.group.add(gFond);

    /* ═══════════ DALLES ═══════════ */
    const gDalle = new THREE.Group();
    const dalleRdc = mesh(box(36.5, 0.35, 11.0), mats.beton, -1.2, 0.18, -1.5);
    gDalle.add(dalleRdc); addEdges(dalleRdc);
    this.group.add(gDalle);

    /* ═══════════ MURS ═══════════ */
    const gMurs = new THREE.Group();

    /* — séjour cathédrale ouest (x -19..-8) — */
    const sejN = mesh(box(11.4, 3.4, 0.5), mats.enduit, -13.3, 2.05, -6.05);
    gMurs.add(sejN); addEdges(sejN);
    /* pignons est/ouest du séjour, au-dessus : triangles */
    const pigW = new THREE.Mesh(gablePrism(0.55, 5.3, 2.6), mats.enduit);
    pigW.position.set(-19.05, 3.75, -1.05); pigW.castShadow = true;
    const pigE = new THREE.Mesh(gablePrism(0.55, 5.3, 2.6), mats.enduit);
    pigE.position.set(-8.55, 3.75, -1.05); pigE.castShadow = true;
    gMurs.add(pigW, pigE); addEdges(pigW);
    /* bandeau haut du pignon ouest (au-dessus du vitrage) */
    gMurs.add(mesh(box(0.5, 0.35, 10.6), mats.enduit, -18.8, 3.58, -1.05, { cast: false }));
    /* mur est du séjour (refend porteur pierre, cheminée) */
    const chem = mesh(box(1.15, 8.0, 3.6), mats.drystoneTall, -8.0, 3.9, -2.9);
    gMurs.add(chem); addEdges(chem);

    /* — corps central pierre (x -8..6) — */
    const voileBas = mesh(box(12.4, 1.0, 0.55), mats.drystone, -0.4, 0.85, 3.72);
    const voileHaut = mesh(box(12.4, 0.9, 0.55), mats.drystone, -0.4, 2.98, 3.72);
    gMurs.add(voileBas, voileHaut); addEdges(voileBas); addEdges(voileHaut);
    [-4.9, -0.7, 3.1].forEach((x) => gMurs.add(mesh(box(0.65, 1.28, 0.55), mats.drystone, x, 1.92, 3.72)));
    const nordB = mesh(box(14.0, 3.4, 0.5), mats.enduit, -1.0, 2.05, -6.05);
    gMurs.add(nordB); addEdges(nordB);

    /* dalle d'étage — coulée sur les murs, elle grandit avec eux */
    const dalleEtage = mesh(box(12.6, 0.35, 8.6), mats.beton, 0, 3.58, -1.4);
    gMurs.add(dalleEtage); addEdges(dalleEtage);

    /* — aile est : garage + entrée (x 6..17) — */
    const garS = mesh(box(11.0, 3.1, 0.5), mats.enduit, 11.5, 1.9, 0.75);
    const garN = mesh(box(11.0, 3.1, 0.5), mats.enduit, 11.5, 1.9, -8.05);
    const garE = mesh(box(0.5, 3.1, 9.3), mats.drystone, 16.75, 1.9, -3.65);
    gMurs.add(garS, garN, garE);
    addEdges(garN); addEdges(garE);
    /* porche d'entrée entre corps et garage */
    gMurs.add(mesh(box(0.4, 3.1, 2.6), mats.noyer, 6.2, 1.9, -5.1));

    this.group.add(gMurs);

    /* ═══════════ CHARPENTE (séjour cathédrale) ═══════════ */
    const gCharp = new THREE.Group();
    const rampL = mesh(box(11.6, 0.1, 5.9), mats.bois, -13.3, 4.95, -3.66, { cast: false });
    rampL.rotation.x = -0.46;
    const rampR = mesh(box(11.6, 0.1, 5.9), mats.bois, -13.3, 4.95, 1.56, { cast: false });
    rampR.rotation.x = 0.46;
    gCharp.add(rampL, rampR);
    for (let i = 0; i < 5; i++) {
      const y = 3.7 + i * 0.6, half = 5.1 - i * 1.15;
      gCharp.add(mesh(box(11.2, 0.16, 0.16), mats.charpente, -13.3, y, -1.05 - half, { cast: false }));
      gCharp.add(mesh(box(11.2, 0.16, 0.16), mats.charpente, -13.3, y, -1.05 + half, { cast: false }));
    }
    this.group.add(gCharp);

    /* ═══════════ ATTIQUE — suite parentale bardée, posée SUR l'acrotère ═══════════ */
    const gEtage = new THREE.Group();
    const etage = mesh(box(12.2, 2.75, 8.2), mats.siding, 0, 5.29, -1.5);
    gEtage.add(etage); addEdges(etage);
    /* fond sombre + ruban vitré filant sud */
    gEtage.add(mesh(box(10.9, 1.26, 0.016), mats.inkMetal, 0, 5.41, 2.615, { cast: false }));
    const ruban = new THREE.Mesh(box(10.8, 1.2, 0.05), mats.glass);
    ruban.position.set(0, 5.41, 2.66);
    gEtage.add(ruban);
    [-4.2, -1.4, 1.4, 4.2].forEach((x) => gEtage.add(mesh(box(0.08, 1.2, 0.1), mats.alu, x, 5.41, 2.66, { cast: false })));
    /* terrasse d'étage ouest, sur le toit du corps (garde-corps verre) */
    gEtage.add(mesh(box(2.2, 0.06, 6.6), mats.planks, -7.2, 3.95, -1.5, { cast: false }));
    gEtage.add(mesh(box(2.2, 0.9, 0.04), mats.glass, -7.2, 4.45, 1.75, { cast: false }));
    gEtage.add(mesh(box(0.04, 0.9, 6.6), mats.glass, -8.28, 4.45, -1.5, { cast: false }));
    this.group.add(gEtage);

    /* ═══════════ COUVERTURES ═══════════ */
    const gCouv = new THREE.Group();
    /* toit du séjour — tuiles deux rampants */
    const couvL = mesh(box(12.2, 0.13, 6.2), mats.tuiles, -13.3, 5.27, -3.78);
    couvL.rotation.x = -0.46;
    const couvR = mesh(box(12.2, 0.13, 6.2), mats.tuiles, -13.3, 5.27, 1.68);
    couvR.rotation.x = 0.46;
    gCouv.add(couvL, couvR);
    addEdges(couvL); addEdges(couvR);
    gCouv.add(mesh(box(12.2, 0.15, 0.32), mats.inkMetal, -13.3, 6.62, -1.05, { cast: false }));
    /* acrotère du corps central */
    const acro = mesh(box(14.6, 0.42, 10.6), mats.enduit, -1.0, 3.7, -1.35);
    gCouv.add(acro); addEdges(acro);
    /* toiture attique — dalle débordante + casquette */
    const toitEtage = mesh(box(13.2, 0.3, 9.2), mats.beton, 0, 6.82, -1.5);
    gCouv.add(toitEtage); addEdges(toitEtage);
    gCouv.add(mesh(box(13.2, 0.14, 1.5), mats.beton, 0, 6.76, 3.4, { cast: true }));
    /* toit de l'aile garage */
    const toitGar = mesh(box(11.6, 0.4, 9.8), mats.enduit, 11.5, 3.62, -3.65);
    gCouv.add(toitGar); addEdges(toitGar);
    /* auvent d'entrée */
    gCouv.add(mesh(box(3.2, 0.12, 3.2), mats.inkMetal, 6.4, 3.05, -6.6, { cast: true }));
    this.group.add(gCouv);

    /* ═══════════ MENUISERIES ═══════════ */
    const H = 2.7, Y = 1.72;
    const gMenui = new THREE.Group();
    const makeBay = (w, h, yC) => {
      const g = new THREE.Group();
      const pane = new THREE.Mesh(box(w, h, 0.05), mats.glass);
      pane.position.set(0, yC, 0);
      g.add(pane);
      addEdges(pane, 80);
      const n = Math.max(1, Math.round(w / 1.3));
      for (let i = 0; i <= n; i++) {
        g.add(mesh(box(0.07, h, 0.09), mats.alu, -w / 2 + (w * i) / n, yC, 0, { cast: false }));
      }
      g.add(mesh(box(w, 0.09, 0.09), mats.alu, 0, yC - h / 2 + 0.05, 0, { cast: false }));
      g.add(mesh(box(w, 0.09, 0.09), mats.alu, 0, yC + h / 2 - 0.04, 0, { cast: false }));
      return g;
    };

    /* pignon ouest du séjour — vitrage double hauteur (la vallée entre) */
    const bayW = makeBay(10.2, 3.1, 1.95);
    bayW.rotation.y = Math.PI / 2;
    bayW.position.set(-18.95, 0, -1.05);
    gMenui.add(bayW);
    /* triangle vitré sous rampants */
    const triW = new THREE.Mesh(gablePrism(0.06, 4.6, 2.2), mats.glass);
    triW.position.set(-18.9, 3.55, -1.05);
    gMenui.add(triW);
    /* baie sud du séjour */
    const baySejour = makeBay(9.6, H, Y);
    baySejour.position.set(-13.3, 0, 3.62);
    gMenui.add(baySejour);
    /* grande coulissante du corps (sous voile pierre) */
    this.door = new THREE.Group();
    const doorPane = new THREE.Mesh(box(3.4, H, 0.05), mats.glass);
    doorPane.position.set(-3.0, Y, 3.6);
    this.door.add(doorPane);
    this.door.add(mesh(box(0.08, H, 0.1), mats.alu, -4.66, Y, 3.6, { cast: false }));
    this.door.add(mesh(box(0.08, H, 0.1), mats.alu, -1.34, Y, 3.6, { cast: false }));
    this.door.add(mesh(box(3.4, 0.09, 0.1), mats.alu, -3.0, 3.02, 3.6, { cast: false }));
    gMenui.add(this.door);
    this.doorBaseX = this.door.position.x;
    /* bandeau vitré dans le voile pierre */
    const bandeau = new THREE.Mesh(box(12.2, 1.18, 0.05), mats.glass);
    bandeau.position.set(-0.4, 1.92, 3.6);
    gMenui.add(bandeau);
    /* volet coulissant bois */
    this.volet = mesh(box(2.6, 1.34, 0.07), mats.bois, 2.2, 1.92, 4.02);
    gMenui.add(this.volet);
    this.voletBaseX = this.volet.position.x;
    /* portes de garage — deux travées bois vertical */
    const garDoor = (x) => {
      const g = new THREE.Group();
      g.add(mesh(box(3.6, 2.5, 0.12), mats.bois, x, 1.45, -8.06));
      g.add(mesh(box(3.72, 0.14, 0.16), mats.inkMetal, x, 2.78, -8.06, { cast: false }));
      for (let i = 1; i < 5; i++) g.add(mesh(box(0.02, 2.5, 0.13), mats.inkMetal, x - 1.8 + i * 0.72, 1.45, -8.05, { cast: false }));
      return g;
    };
    gMenui.add(garDoor(9.4), garDoor(13.6));
    /* porte d'entrée noyer + fenêtre du bureau (aile est côté sud) */
    gMenui.add(mesh(box(1.2, 2.5, 0.1), mats.noyer, 6.4, 1.45, -6.0));
    const bayBureau = makeBay(2.6, 2.2, 1.55);
    bayBureau.position.set(12.5, 0, 0.72);
    gMenui.add(bayBureau);
    this.group.add(gMenui);

    /* ═══════════ FINITIONS — terrasses, pergola, piscine, jacuzzi, cour ═══════════ */
    const gFini = new THREE.Group();

    /* soutènement sud (front de vallée) */
    const soutien = mesh(box(37, 3.0, 0.6), mats.soutenement, 11.5, -1.28, 8.2);
    gFini.add(soutien); addEdges(soutien);
    gFini.add(mesh(box(0.6, 3.0, 13.5), mats.soutenement, 29.7, -1.28, 14.9));
    /* grand emmarchement paysager : volée large, joues en pierre, palier */
    for (let i = 0; i < 6; i++) {
      gFini.add(mesh(box(3.4, 0.45, 0.68), mats.paving, -3.4, -0.22 - i * 0.44, 8.32 + i * 0.66));
    }
    gFini.add(mesh(box(3.6, 0.14, 1.6), mats.paving, -3.4, -2.55, 12.6, { cast: false }));
    [-5.35, -1.45].forEach((jx) => {
      const joue = mesh(box(0.5, 2.9, 4.9), mats.soutenement, jx, -1.35, 10.4);
      gFini.add(joue);
    });
    gFini.add(mesh(box(0.09, 0.62, 0.09), mats.borne, -5.0, -2.3, 12.2, { cast: false }));
    /* muret paysager ouest */
    const muret = mesh(box(10, 1.05, 0.5), mats.soutenement, -22, 0.52, 5.4);
    gFini.add(muret); addEdges(muret);

    /* terrasse repas sud (paving) + pergola bioclimatique */
    gFini.add(mesh(box(13.4, 0.14, 4.4), mats.paving, -0.6, 0.1, 5.9, { cast: false }));
    const perg = new THREE.Group();
    const pLame = [];
    [[-5.6, 4.2], [-5.6, 7.4], [5.6, 4.2], [5.6, 7.4]].forEach(([px, pz]) => {
      perg.add(mesh(box(0.16, 2.9, 0.16), mats.inkMetal, px, 1.45, pz));
    });
    perg.add(mesh(box(11.6, 0.18, 0.2), mats.inkMetal, 0, 2.94, 4.14, { cast: false }));
    perg.add(mesh(box(11.6, 0.18, 0.2), mats.inkMetal, 0, 2.94, 7.5, { cast: false }));
    perg.add(mesh(box(0.2, 0.18, 3.6), mats.inkMetal, -5.62, 2.94, 5.82, { cast: false }));
    perg.add(mesh(box(0.2, 0.18, 3.6), mats.inkMetal, 5.62, 2.94, 5.82, { cast: false }));
    this.lames = [];
    for (let i = 0; i < 13; i++) {
      const lame = mesh(box(11.2, 0.03, 0.2), mats.aluClair, 0, 2.96, 4.36 + i * 0.26, { cast: true });
      this.lames.push(lame);
      perg.add(lame);
    }
    perg.position.set(-0.6, 0, 0.6);
    gFini.add(perg);
    /* repas sous pergola */
    gFini.add(mesh(box(2.8, 0.07, 1.1), mats.noyer, -0.6, 0.86, 6.4));
    gFini.add(mesh(box(0.09, 0.72, 0.9), mats.inkMetal, -1.9, 0.5, 6.4));
    gFini.add(mesh(box(0.09, 0.72, 0.9), mats.inkMetal, 0.7, 0.5, 6.4));
    [[-1.5, 5.6], [-0.6, 5.6], [0.3, 5.6], [-1.5, 7.2], [-0.6, 7.2], [0.3, 7.2]].forEach(([cx, cz]) => {
      gFini.add(mesh(box(0.46, 0.5, 0.46), mats.fabricDark, cx, 0.4, cz, { cast: false }));
    });

    /* terrasse salon ouest (planks) + lounge */
    gFini.add(mesh(box(9.6, 0.13, 5.6), mats.planks, -14.6, 0.1, 6.0, { cast: false }));
    gFini.add(mesh(box(3.2, 0.42, 1.05), mats.fabric, -15.6, 0.55, 4.9));
    gFini.add(mesh(box(3.2, 0.4, 0.3), mats.fabric, -15.6, 0.92, 4.36));
    gFini.add(mesh(box(1.0, 0.42, 2.0), mats.fabric, -13.4, 0.55, 5.9));
    gFini.add(mesh(box(1.2, 0.3, 0.7), mats.noyer, -15.3, 0.42, 6.4));
    /* jacuzzi affleurant dans le deck, adossé au muret */
    this.jacuzzi = new Water({ width: 2.5, depth: 2.5, calm: 0.35, scale: 3.2 });
    this.jacuzzi.mesh.position.set(-17.9, 0.19, 7.0);
    gFini.add(this.jacuzzi.mesh);
    gFini.add(mesh(box(2.9, 0.1, 0.2), mats.planks, -17.9, 0.16, 5.65, { cast: false }));
    gFini.add(mesh(box(2.9, 0.1, 0.2), mats.planks, -17.9, 0.16, 8.35, { cast: false }));
    gFini.add(mesh(box(0.2, 0.1, 2.5), mats.planks, -19.45, 0.16, 7.0, { cast: false }));
    gFini.add(mesh(box(0.2, 0.1, 2.5), mats.planks, -16.35, 0.16, 7.0, { cast: false }));
    /* banc + graminées autour du jacuzzi */
    gFini.add(mesh(box(2.2, 0.38, 0.45), mats.noyer, -17.9, 0.36, 8.9, { cast: false }));

    /* piscine 12×4.5 à marches + plage (contenue dans la plateforme) */
    gFini.add(mesh(box(14.8, 0.14, 6.2), mats.paving, 14.2, 0.1, 4.6, { cast: false }));
    this.pool = new Water({ width: 12, depth: 4.5, calm: 0, scale: 0.85 });
    this.pool.mesh.position.set(14.0, 0.22, 4.4);
    gFini.add(this.pool.mesh);
    /* parois intérieures + fond dégradé (profondeur perçue) */
    const bassinFond = mesh(box(12, 0.05, 4.5), mats.beton, 14.0, -1.15, 4.4, { cast: false });
    bassinFond.material = mats.beton;
    gFini.add(bassinFond);
    [[14, 0.22 - 0.7, 2.13, 12.2, 1.5, 0.12], [14, 0.22 - 0.7, 6.67, 12.2, 1.5, 0.12],
     [7.94, 0.22 - 0.7, 4.4, 0.12, 1.5, 4.5], [20.06, 0.22 - 0.7, 4.4, 0.12, 1.5, 4.5]]
      .forEach(([px, py, pz, w, h, d]) => gFini.add(mesh(box(w, h, d), mats.beton, px, py, pz, { cast: false })));
    /* banquette immergée + marches côté ouest */
    gFini.add(mesh(box(1.4, 0.5, 4.3), mats.beton, 8.8, -0.12, 4.4, { cast: false }));
    for (let i = 0; i < 3; i++) {
      gFini.add(mesh(box(0.7, 0.16, 4.3), mats.beton, 8.45 + i * 0.55, 0.05 - i * 0.16, 4.4, { cast: false }));
    }
    /* margelle sombre */
    gFini.add(mesh(box(12.4, 0.06, 0.18), mats.inkMetal, 14, 0.19, 2.08, { cast: false }));
    gFini.add(mesh(box(12.4, 0.06, 0.18), mats.inkMetal, 14, 0.19, 6.72, { cast: false }));
    /* transats + parasol + douche — sur la plage, jamais dans le vide */
    [[10.6, 7.15], [12.4, 7.15], [14.2, 7.15]].forEach(([tx, tz]) => {
      const t = mesh(box(0.7, 0.12, 1.9), mats.fabric, tx, 0.32, tz);
      t.rotation.x = -0.06;
      gFini.add(t);
      gFini.add(mesh(box(0.7, 0.3, 0.12), mats.fabric, tx, 0.42, tz - 0.86, { cast: false }));
    });
    gFini.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.3, 6), mats.aluClair, 19.4, 1.25, 6.9, { cast: false }));
    gFini.add(mesh(box(0.32, 0.05, 0.32), mats.aluClair, 19.4, 2.42, 6.9, { cast: false }));

    /* cuisine d'été contre l'aile est */
    gFini.add(mesh(box(3.0, 0.95, 0.75), mats.beton, 8.6, 0.88, 1.7));
    gFini.add(mesh(box(3.1, 0.07, 0.85), mats.noyer, 8.6, 1.4, 1.7, { cast: false }));
    gFini.add(mesh(new THREE.CylinderGeometry(0.34, 0.28, 0.5, 10), mats.inkMetal, 10.6, 0.62, 2.2, { cast: false }));

    /* cour d'arrivée nord-est : gravier + bandes de roulage + arbre d'ombrage */
    const cour = mesh(box(17.5, 0.08, 9.6), mats.gravier, 18.2, 0.05, -8.6, { cast: false });
    gFini.add(cour);
    [-11.2, -6.4].forEach((cz) => {
      gFini.add(mesh(box(14, 0.1, 0.7), mats.paving, 18.6, 0.07, cz, { cast: false }));
    });
    /* muret de cour + portail bas */
    gFini.add(mesh(box(0.5, 1.0, 8.6), mats.soutenement, 27.4, 0.5, -8.8));
    gFini.add(mesh(box(3.4, 0.9, 0.08), mats.inkMetal, 27.4, 0.5, -3.2, { cast: false }));
    /* chemin piéton vers l'entrée */
    for (let i = 0; i < 5; i++) {
      gFini.add(mesh(box(0.9, 0.06, 0.6), mats.paving, 8.2 + i * 1.15, 0.06, -6.4 - i * 0.35, { cast: false }));
    }
    /* bornes lumineuses */
    this.bornes = [];
    [[7.6, -5.6], [12.5, -7.2], [-3.4, 9.4], [-14.6, 8.9], [19, 6.9], [24, -4.2]].forEach(([bx, bz]) => {
      const b = mesh(box(0.09, 0.62, 0.09), mats.borne, bx, 0.31, bz, { cast: false });
      this.bornes.push(b);
      gFini.add(b);
    });
    /* pots architecturaux + oliviers de pot -> graminées */
    [[-20.5, 4.2], [4.4, 4.6], [6.9, 3.4]].forEach(([px, pz]) => {
      gFini.add(mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.55, 10), mats.betonBrut, px, 0.35, pz));
      gFini.add(mesh(new THREE.IcosahedronGeometry(0.42, 1), mats.plante, px, 0.95, pz));
    });
    this.group.add(gFini);

    /* ═══════════ INTÉRIEUR ═══════════ */
    const gInt = new THREE.Group();
    /* sols */
    gInt.add(mesh(box(10.2, 0.05, 9.4), mats.woodfloorInt, -13.4, 0.39, -1.2, { cast: false }));
    gInt.add(mesh(box(13.6, 0.05, 9.4), mats.beton, -1.4, 0.39, -1.2, { cast: false }));
    /* séjour cathédrale : grand canapé d'angle face au pignon vitré */
    gInt.add(mesh(box(3.6, 0.03, 2.6), mats.fabricDark, -14.6, 0.42, -0.8, { cast: false }));
    gInt.add(mesh(box(3.4, 0.45, 1.1), mats.fabric, -14.4, 0.72, -2.0));
    gInt.add(mesh(box(3.4, 0.5, 0.3), mats.fabric, -14.4, 1.15, -2.5));
    gInt.add(mesh(box(1.1, 0.45, 2.3), mats.fabric, -16.2, 0.72, -0.6));
    gInt.add(mesh(box(1.5, 0.34, 0.9), mats.noyer, -14.2, 0.6, -0.4));
    /* cheminée murale noire sur le refend pierre */
    gInt.add(mesh(box(0.18, 1.7, 1.1), mats.inkMetal, -8.65, 1.6, -2.9, { cast: false }));
    this.ember = mesh(box(0.05, 0.4, 0.9), mats.ember, -8.72, 1.1, -2.9, { cast: false });
    gInt.add(this.ember);
    /* bibliothèque nord double hauteur — posée devant le mur */
    gInt.add(mesh(box(4.6, 4.6, 0.4), mats.noyer, -13.6, 2.7, -5.42));
    /* lampadaire + plante */
    gInt.add(mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.7, 6), mats.inkMetal, -11.2, 1.25, -4.6));
    this.lampHead = mesh(new THREE.SphereGeometry(0.09, 16, 12), mats.pendant, -11.2, 2.16, -4.6, { cast: false });
    gInt.add(this.lampHead);
    gInt.add(mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.55, 8), mats.betonBrut, -17.9, 0.68, -4.9));
    gInt.add(mesh(new THREE.IcosahedronGeometry(0.6, 1), mats.plante, -17.9, 1.55, -4.9));

    /* salle à manger (corps central ouest) */
    gInt.add(mesh(box(3.0, 0.07, 1.15), mats.noyer, -5.4, 1.08, -0.8));
    gInt.add(mesh(box(0.1, 0.66, 1.0), mats.inkMetal, -6.7, 0.72, -0.8));
    gInt.add(mesh(box(0.1, 0.66, 1.0), mats.inkMetal, -4.1, 0.72, -0.8));
    [[-6.3, 0.15], [-5.4, 0.15], [-4.5, 0.15], [-6.3, -1.75], [-5.4, -1.75], [-4.5, -1.75]].forEach(([cx, cz]) => {
      gInt.add(mesh(box(0.44, 0.5, 0.44), mats.fabricDark, cx, 0.66, cz, { cast: false }));
    });
    this.pendants = [];
    [-6.2, -5.4, -4.6].forEach((x) => {
      gInt.add(mesh(new THREE.CylinderGeometry(0.006, 0.006, 1.35, 5), mats.inkMetal, x, 2.9, -0.8, { cast: false }));
      const p = mesh(new THREE.SphereGeometry(0.1, 16, 12), mats.pendant, x, 2.2, -0.8, { cast: false });
      this.pendants.push(p);
      gInt.add(p);
    });

    /* cuisine : îlot 3 m + linéaire nord + crédence */
    gInt.add(mesh(box(3.0, 0.92, 1.1), mats.noyer, 1.6, 0.87, -0.6));
    gInt.add(mesh(box(3.15, 0.06, 1.2), mats.beton, 1.6, 1.36, -0.6, { cast: false }));
    gInt.add(mesh(box(5.4, 0.95, 0.72), mats.inkMetal, 1.4, 0.9, -5.6));
    gInt.add(mesh(box(5.4, 1.3, 0.36), mats.noyer, 1.4, 2.7, -5.78, { cast: false }));
    gInt.add(mesh(box(5.4, 1.0, 0.06), mats.drystone, 1.4, 1.85, -5.72, { cast: false }));
    /* escalier flottant vers l'attique, le long du mur nord */
    for (let i = 0; i < 12; i++) {
      gInt.add(mesh(box(1.0, 0.06, 0.28), mats.bois, 4.9, 0.55 + i * 0.26, -5.2 + i * 0.001 - i * 0.0, { cast: false }));
    }
    /* réalité : volée droite le long du mur — corrige la profondeur */
    gInt.children.splice(-12);
    for (let i = 0; i < 12; i++) {
      gInt.add(mesh(box(0.28, 0.06, 1.0), mats.bois, 5.6 - 0.0, 0.55 + i * 0.26, -5.35 + 0 * i, { cast: false }));
    }
    gInt.children.splice(-12);
    for (let i = 0; i < 12; i++) {
      gInt.add(mesh(box(0.3, 0.06, 1.0), mats.bois, 3.3 + i * 0.24, 0.55 + i * 0.26, -5.4, { cast: false }));
    }
    gInt.add(mesh(box(3.3, 0.05, 0.06), mats.inkMetal, 4.6, 2.1, -4.88, { cast: false }));

    /* suite parentale (attique) : lit, chevets, rideaux */
    gInt.add(mesh(box(2.2, 0.42, 1.9), mats.fabric, -1.6, 4.2, -2.4));
    gInt.add(mesh(box(2.2, 0.95, 0.14), mats.noyer, -1.6, 4.45, -3.42));
    [[-2.9, -2.9], [-0.3, -2.9]].forEach(([bx, bz]) => {
      gInt.add(mesh(box(0.5, 0.3, 0.4), mats.noyer, bx, 4.1, bz, { cast: false }));
    });
    gInt.add(mesh(box(2.8, 1.9, 0.04), mats.rideau, 2.8, 5.0, 2.35, { cast: false }));
    gInt.add(mesh(box(1.9, 0.03, 1.4), mats.fabricDark, -1.6, 3.97, -0.9, { cast: false }));

    /* bureau (aile est, près de la fenêtre sud) */
    gInt.add(mesh(box(1.7, 0.06, 0.8), mats.noyer, 12.5, 1.05, -0.6, { cast: false }));
    gInt.add(mesh(box(0.5, 0.5, 0.5), mats.fabricDark, 12.5, 0.65, -1.4, { cast: false }));
    /* voiture non identifiable dans le garage */
    const car = new THREE.Group();
    car.add(mesh(box(4.1, 0.9, 1.75), mats.enginFonce, 0, 0.75, 0));
    car.add(mesh(box(2.2, 0.6, 1.6), mats.enginFonce, -0.2, 1.45, 0));
    [[-1.35, 0.75], [1.35, 0.75], [-1.35, -0.75], [1.35, -0.75]].forEach(([wx, wz]) => {
      const wheel = mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 14), mats.chenille, wx, 0.34, wz, { cast: false });
      wheel.rotation.x = Math.PI / 2;
      car.add(wheel);
    });
    car.position.set(11.2, 0.4, -4.2);
    car.rotation.y = 0.12;
    gInt.add(car);
    this.group.add(gInt);

    this.parts = {
      fond: gFond, dalle: gDalle, murs: gMurs, charp: gCharp,
      etage: gEtage, couv: gCouv, menui: gMenui, fini: gFini, interieur: gInt
    };
    this.base = {};
    for (const [k, g] of Object.entries(this.parts)) this.base[k] = g.position.clone();
    this.baseScale = {};
    for (const [k, g] of Object.entries(this.parts)) this.baseScale[k] = g.scale.clone();

    /* ═══ EXTENSION VITRÉE — le récit « transformer » sur l'aile est ═══ */
    this.renovExt = new THREE.Group();
    const extDalle = mesh(box(5.6, 0.3, 6.8), mats.beton, 19.9, 0.15, -3.6);
    const extToit = mesh(box(6.0, 0.28, 7.2), mats.beton, 19.9, 3.28, -3.6);
    const extGlass = new THREE.Mesh(box(0.05, 2.7, 6.2), mats.glass);
    extGlass.position.set(22.6, 1.7, -3.6);
    const extGlassS = new THREE.Mesh(box(5.2, 2.7, 0.05), mats.glass);
    extGlassS.position.set(19.9, 1.7, -0.35);
    [[22.6, -6.3], [22.6, -0.9], [22.6, -3.6]].forEach(([px, pz]) => {
      this.renovExt.add(mesh(box(0.14, 3.0, 0.14), mats.alu, px, 1.7, pz, { cast: false }));
    });
    this.renovExt.add(extDalle, extToit, extGlass, extGlassS);
    addEdges(extToit);
    this.group.add(this.renovExt);
    this.renovExtBase = this.renovExt.position.clone();

    /* ═══ ARÊTES — le trait de lumière ═══ */
    this.group.updateMatrixWorld(true);
    const edgeGeos = edgeSources.map(({ mesh: m, threshold }) => {
      const e = new THREE.EdgesGeometry(m.geometry, threshold);
      e.applyMatrix4(m.matrixWorld);
      return e;
    });
    const merged = mergeGeometries(edgeGeos);
    edgeGeos.forEach((g) => g.dispose());

    this.lineUniforms = {
      uProgress: { value: 0 },
      uOpacity: { value: 1 },
      uColor: { value: new THREE.Color(0x4fd39a) }
    };
    const lineMat = new THREE.ShaderMaterial({
      uniforms: this.lineUniforms,
      vertexShader: /* glsl */ `
        varying float vT;
        void main() {
          vec3 w = (modelMatrix * vec4(position, 1.0)).xyz;
          vT = clamp((w.x + w.z * 0.6 + w.y * 2.4 + 52.0) / 96.0, 0.0, 1.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        varying float vT;
        uniform float uProgress;
        uniform float uOpacity;
        uniform vec3 uColor;
        void main() {
          if (vT > uProgress) discard;
          float tip = smoothstep(0.05, 0.0, uProgress - vT) * 2.2;
          float a = (0.5 + tip) * uOpacity;
          gl_FragColor = vec4(uColor * (1.0 + tip), a);
        }`,
      transparent: true,
      depthTest: false,
      blending: THREE.AdditiveBlending
    });
    this.lines = new THREE.LineSegments(merged, lineMat);
    this.lines.renderOrder = 20;
    scene.add(this.lines);

    /* éclairage du soir */
    this.innerLight = new THREE.PointLight(0xffb877, 0, 24, 1.8);
    this.innerLight.position.set(-6, 2.6, -1.5);
    scene.add(this.innerLight);
    this.cathLight = new THREE.PointLight(0xffc890, 0, 18, 1.8);
    this.cathLight.position.set(-13.5, 3.6, -1);
    scene.add(this.cathLight);
    this.pergLight = new THREE.PointLight(0xffaa60, 0, 10, 2);
    this.pergLight.position.set(-0.6, 2.6, 5.9);
    scene.add(this.pergLight);
    this.poolLight = new THREE.PointLight(0x6fd8c0, 0, 12, 2);
    this.poolLight.position.set(14, 0.6, 4.4);
    scene.add(this.poolLight);
  }

  /* c : chantier 0..1 — la maison se construit par lots */
  setChantier(c) {
    const p = this.parts, b = this.base, s = this.baseScale;
    const seg = (a, z) => smooth(a, z, c);
    /* fondations montent du sol */
    p.fond.position.y = b.fond.y - 2.4 * (1 - seg(0.2, 0.3));
    p.fond.visible = c > 0.06;
    /* dalles */
    const dS = seg(0.28, 0.36);
    p.dalle.scale.setScalar(Math.max(0.001, dS));
    p.dalle.visible = dS > 0.01;
    /* murs poussent */
    const mS = seg(0.34, 0.47);
    p.murs.scale.y = Math.max(0.001, mS * s.murs.y);
    p.murs.visible = mS > 0.01;
    /* charpente descend en place */
    const cS = seg(0.45, 0.54);
    p.charp.position.y = b.charp.y + (1 - cS) * 6;
    p.charp.visible = cS > 0.01;
    /* attique */
    const eS = seg(0.48, 0.57);
    p.etage.position.y = b.etage.y + (1 - eS) * 5;
    p.etage.visible = eS > 0.01;
    /* couvertures */
    const kS = seg(0.54, 0.62);
    p.couv.position.y = b.couv.y + (1 - kS) * 5.5;
    p.couv.visible = kS > 0.01;
    /* menuiseries glissent depuis le sud */
    const nS = seg(0.6, 0.68);
    p.menui.position.z = b.menui.z + (1 - nS) * 5;
    p.menui.visible = nS > 0.01;
    /* finitions + intérieur apparaissent */
    const fS = seg(0.66, 0.8);
    p.fini.position.y = b.fini.y - (1 - fS) * 1.6;
    p.fini.visible = fS > 0.01;
    const iS = seg(0.72, 0.84);
    p.interieur.visible = iS > 0.15;
    /* l'eau monte dans le bassin */
    this.pool.mesh.visible = fS > 0.55;
    this.pool.mesh.position.y = 0.22 - (1 - seg(0.74, 0.86)) * 0.9;
    this.jacuzzi.mesh.visible = fS > 0.6;
  }

  /* mode fini : tout en place (pour les chapitres après le chantier) */
  setComplete() {
    const p = this.parts, b = this.base, s = this.baseScale;
    for (const k of Object.keys(p)) {
      p[k].visible = true;
      p[k].position.copy(b[k]);
      p[k].scale.copy(s[k]);
    }
    this.pool.mesh.visible = true;
    this.pool.mesh.position.y = 0.22;
    this.jacuzzi.mesh.visible = true;
  }

  /* e : éclaté par lots (seconde moitié du chapitre construire) */
  setExplode(e) {
    const p = this.parts, b = this.base;
    const s = (d) => smooth(d, d + 0.5, e);
    p.couv.position.y = b.couv.y + s(0.14) * 8.4;
    p.etage.position.y = b.etage.y + s(0.26) * 6.2;
    p.charp.position.y = b.charp.y + s(0.36) * 4.6;
    p.murs.position.y = b.murs.y + s(0.44) * 2.8;
    p.dalle.position.y = b.dalle.y + s(0.52) * 1.4;
    p.fond.position.y = b.fond.y - s(0.0) * 2.4;
    p.menui.position.z = b.menui.z + s(0.3) * 4.2;
    p.fini.position.z = b.fini.z + s(0.18) * 3.4;
    p.interieur.position.y = b.interieur.y + s(0.48) * 1.2;
  }

  setDoor(t) {
    this.door.position.x = this.doorBaseX - t * 3.2;
    this.volet.position.x = this.voletBaseX + t * 2.3;
  }

  /* lames de pergola — orientation subtile */
  setLames(a) {
    const rot = -0.15 + a * 0.85;
    this.lames.forEach((l, i) => { l.rotation.z = rot * (1 + Math.sin(i * 1.7) * 0.04); });
  }

  /* l'extension vitrée vient s'assembler contre l'aile est */
  setRenov(r) {
    this.renovExt.visible = r > 0.02;
    const extSlide = 1 - smooth(0.2, 0.85, r);
    this.renovExt.position.x = this.renovExtBase.x + extSlide * 9;
    this.renovExt.position.y = this.renovExtBase.y + extSlide * 0.5;
  }

  /* n : soir · fill : caméra à l'intérieur · pr : présence du bâti (0 avant chantier) */
  setLights(n, fill = 0, pr = 1) {
    this.mats.glass.emissiveIntensity = n * 0.09 * pr;
    this.mats.ember.emissiveIntensity = (n * 1.5 + fill * 0.25) * pr;
    this.mats.pendant.emissiveIntensity = (n * 1.7 + fill * 0.35) * pr;
    this.mats.borne.emissiveIntensity = n * 1.6 * pr;
    this.innerLight.intensity = (n * 36 + fill * 8) * pr;
    this.cathLight.intensity = (n * 26 + fill * 6) * pr;
    this.pergLight.intensity = n * 12 * pr;
    this.poolLight.intensity = n * 10 * pr;
  }
}
