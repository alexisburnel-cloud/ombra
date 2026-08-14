import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { smooth } from '../core/utils.js';
import { Water } from './Water.js';

/*
  Maison de coteau — étude CARÈNE (mètres).
  Trois volumes : porche cathédrale à l'ouest (pignon, tuiles, plafond bois),
  corps en pierre sèche au centre, étage bardé bois grisé en attique.
  Soutènements en galets, terrasse, bassin à débordement vers la vallée.
  Une aile ancienne à rénover vit plus loin à l'ouest (chapitre Rénover).
*/

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

function mesh(geo, mat, x, y, z, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

/* prisme triangulaire pour pignons (largeur w le long de x, pente sur z) */
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

    /* ═══ NIVEAU BAS — fondations, soutènements, jardin bas ═══ */
    const gFond = new THREE.Group();
    [-14, -7.5, 0, 6].forEach((x) => {
      gFond.add(mesh(box(2.2, 0.6, 8.6), mats.betonBrut, x, -0.5, -1));
    });
    this.group.add(gFond);

    const gFini = new THREE.Group();
    /* mur de soutènement galets — front de vallée */
    const soutien = mesh(box(30, 3.0, 0.6), mats.galets, 3, -1.3, 5.5);
    gFini.add(soutien); addEdges(soutien);
    /* retour est du soutènement */
    gFini.add(mesh(box(0.6, 3.0, 11), mats.galets, 21.8, -1.3, 11));
    /* escalier vers jardin bas */
    for (let i = 0; i < 6; i++) {
      gFini.add(mesh(box(2.4, 0.45, 0.62), mats.beton, -2.6, -0.22 - i * 0.44, 5.6 + i * 0.6));
    }
    /* muret paysager pierre sèche, approche ouest */
    const muret = mesh(box(12, 1.1, 0.45), mats.drystone, -16, 0.55, 6.8);
    gFini.add(muret); addEdges(muret);

    /* terrasse sud (dalles béton lissé) */
    gFini.add(mesh(box(26, 0.14, 4.6), mats.beton, -3, 0.07, 5.2 - 2.3 + 0.4, { cast: false }));
    /* deck du bassin */
    gFini.add(mesh(box(11.4, 0.14, 6.6), mats.beton, 13.6, 0.07, 1.5, { cast: false }));
    this.group.add(gFini);

    /* bassin à débordement */
    this.pool = new Water({ width: 9, depth: 4.6, calm: 0, scale: 1.15 });
    this.pool.mesh.position.set(13.5, 0.16, 1.4);
    gFini.add(this.pool.mesh);
    gFini.add(mesh(box(9.3, 0.1, 0.16), mats.inkMetal, 13.5, 0.1, 3.85, { cast: false }));
    /* bac débordement visible du jardin bas */
    gFini.add(mesh(box(9.3, 1.2, 0.3), mats.galets, 13.5, -0.9, 4.1));

    /* ═══ DALLES ═══ */
    const gDalle = new THREE.Group();
    const dalleRdc = mesh(box(24.5, 0.35, 9.6), mats.beton, -3.2, 0.18, -1);
    gDalle.add(dalleRdc); addEdges(dalleRdc);
    const dalleEtage = mesh(box(11.6, 0.35, 8.2), mats.beton, 1.2, 3.38, -1);
    gDalle.add(dalleEtage); addEdges(dalleEtage);
    this.group.add(gDalle);

    /* ═══ MURS — corps pierre + refends + cheminée ═══ */
    const gMurs = new THREE.Group();
    /* voile pierre sèche sud (bandeau vitré dedans) : deux linteaux + trumeaux */
    const voileBas = mesh(box(9.5, 1.0, 0.5), mats.drystone, -0.75, 0.85, 3.15);
    const voileHaut = mesh(box(9.5, 0.85, 0.5), mats.drystone, -0.75, 2.93, 3.15);
    gMurs.add(voileBas, voileHaut);
    addEdges(voileBas); addEdges(voileHaut);
    [-5.2, -1.6, 2.2].forEach((x) => gMurs.add(mesh(box(0.6, 1.25, 0.5), mats.drystone, x, 1.98, 3.15)));
    /* pignon est en enduit — percé pour la baie (z -1.3 → 2.1) */
    const pE1 = mesh(box(0.5, 3.2, 4.0), mats.enduit, 5.75, 1.95, -3.3);
    const pE2 = mesh(box(0.5, 3.2, 1.2), mats.enduit, 5.75, 1.95, 2.7);
    const pE3 = mesh(box(0.5, 0.55, 3.4), mats.enduit, 5.75, 3.28, 0.4);
    const pE4 = mesh(box(0.5, 0.4, 3.4), mats.enduit, 5.75, 0.55, 0.4);
    gMurs.add(pE1, pE2, pE3, pE4); addEdges(pE1);
    /* mur nord (enduit) */
    const nord = mesh(box(20.5, 3.2, 0.5), mats.enduit, -4.4, 1.95, -5.05);
    gMurs.add(nord); addEdges(nord);
    /* refend & cheminée pierre traversant l'étage — appareillage adapté à la hauteur */
    const chem = mesh(box(1.1, 7.4, 3.4), mats.drystoneTall, 3.4, 3.6, -2.4);
    gMurs.add(chem); addEdges(chem);
    /* îlot d'entrée nord — chêne chaleureux côté séjour */
    gMurs.add(mesh(box(3.6, 3.2, 0.5), mats.bois, -10.5, 1.95, -5.05));
    this.group.add(gMurs);

    /* ═══ PORCHE CATHÉDRALE OUEST (pignon bois + tuiles) ═══ */
    const gCharp = new THREE.Group();
    /* murs latéraux du porche */
    const porcheN = mesh(box(7.4, 3.0, 0.5), mats.enduit, -12.0, 1.85, -5.05);
    const porcheS = mesh(box(7.4, 0.5, 0.35), mats.enduit, -12.0, 3.1, 3.3);
    gCharp.add(porcheN, porcheS); addEdges(porcheN);
    /* poteaux du porche côté sud */
    [-15.4, -8.6].forEach((x) => gCharp.add(mesh(box(0.42, 3.35, 0.42), mats.enduit, x, 1.68, 3.3)));
    /* pignons triangulaires est/ouest */
    const pigW = new THREE.Mesh(gablePrism(0.5, 4.5, 1.7), mats.enduit);
    pigW.position.set(-15.85, 3.35, -0.9);
    pigW.castShadow = true;
    const pigE = pigW.clone(); pigE.position.x = -8.35;
    gCharp.add(pigW, pigE);
    addEdges(pigW);
    /* plafond bois sous rampants — la pente monte vers le faîtage */
    const rampL = mesh(box(7.9, 0.09, 4.85), mats.bois, -12.05, 4.18, -3.06, { cast: false });
    rampL.rotation.x = -0.352;
    const rampR = mesh(box(7.9, 0.09, 4.85), mats.bois, -12.05, 4.18, 1.26, { cast: false });
    rampR.rotation.x = 0.352;
    gCharp.add(rampL, rampR);
    /* pannes de charpente */
    for (let i = 0; i < 4; i++) {
      const y = 3.42 + i * 0.4, halfSpan = 4.4 - i * 1.05;
      gCharp.add(mesh(box(7.6, 0.14, 0.14), mats.charpente, -12.05, y, -0.9 - halfSpan, { cast: false }));
      gCharp.add(mesh(box(7.6, 0.14, 0.14), mats.charpente, -12.05, y, -0.9 + halfSpan, { cast: false }));
    }
    this.group.add(gCharp);

    /* ═══ ÉTAGE — attique bardé bois grisé ═══ */
    const gEtage = new THREE.Group();
    const etage = mesh(box(11.0, 2.55, 7.4), mats.boisGris, 1.2, 4.85, -1.2);
    gEtage.add(etage); addEdges(etage);
    /* bandeau vitré filant sud de l'étage — tableau sombre en retrait */
    gEtage.add(mesh(box(9.9, 1.3, 0.08), mats.inkMetal, 1.2, 4.95, 2.44, { cast: false }));
    const ruban = new THREE.Mesh(box(9.6, 1.1, 0.06), mats.glass);
    ruban.position.set(1.2, 4.95, 2.53);
    gEtage.add(ruban);
    [-2.4, 0, 2.4, 4.6].forEach((x) => gEtage.add(mesh(box(0.08, 1.1, 0.1), mats.alu, 1.2 + x - 1.1, 4.95, 2.53, { cast: false })));
    this.group.add(gEtage);

    /* ═══ COUVERTURES ═══ */
    const gCouv = new THREE.Group();
    /* toit du porche — deux rampants de tuiles vers le faîtage */
    const couvL = mesh(box(8.3, 0.12, 5.1), mats.tuiles, -12.05, 4.47, -3.18);
    couvL.rotation.x = -0.352;
    const couvR = mesh(box(8.3, 0.12, 5.1), mats.tuiles, -12.05, 4.47, 1.38);
    couvR.rotation.x = 0.352;
    gCouv.add(couvL, couvR);
    addEdges(couvL); addEdges(couvR);
    /* faîtière */
    gCouv.add(mesh(box(8.3, 0.14, 0.3), mats.inkMetal, -12.05, 5.28, -0.9, { cast: false }));
    /* toit plat du corps central (acrotère) */
    const acro = mesh(box(14.6, 0.4, 9.0), mats.enduit, -1.2, 3.5, -1);
    gCouv.add(acro); addEdges(acro);
    /* toiture étage — dalle fine débordante */
    const toitEtage = mesh(box(11.9, 0.28, 8.2), mats.beton, 1.2, 6.3, -1.2);
    gCouv.add(toitEtage); addEdges(toitEtage);
    /* casquette sud de l'étage */
    gCouv.add(mesh(box(11.9, 0.14, 1.4), mats.beton, 1.2, 6.24, 3.2, { cast: true }));
    this.group.add(gCouv);

    /* ═══ MENUISERIES — baies vitrées ═══ */
    const H = 2.62, Y = 1.66;
    const gMenui = new THREE.Group();
    const makeBay = (w, x, z, withDoor = false) => {
      const g = new THREE.Group();
      const pane = new THREE.Mesh(box(w, H, 0.05), mats.glass);
      pane.position.set(x, Y, z);
      g.add(pane);
      addEdges(pane, 80);
      const n = Math.round(w / 1.15);
      for (let i = 0; i <= n; i++) {
        g.add(mesh(box(0.07, H, 0.09), mats.alu, x - w / 2 + (w * i) / n, Y, z, { cast: false }));
      }
      g.add(mesh(box(w, 0.1, 0.09), mats.alu, x, 0.4, z, { cast: false }));
      g.add(mesh(box(w, 0.09, 0.09), mats.alu, x, 2.94, z, { cast: false }));
      return g;
    };
    /* grande baie du séjour cathédrale (sous le pignon) */
    gMenui.add(makeBay(6.9, -12.0, 2.0));
    /* pignon ouest vitré — la vallée entre dans le séjour */
    const bayW = makeBay(8.2, 0, 0);
    bayW.rotation.y = Math.PI / 2;
    bayW.position.set(-15.45, 0, -1.05);
    gMenui.add(bayW);
    gMenui.add(mesh(box(0.4, 0.5, 8.6), mats.enduit, -15.55, 3.1, -1.05, { cast: false }));
    /* baie coulissante du séjour (sous le voile pierre) */
    this.door = new THREE.Group();
    const doorPane = new THREE.Mesh(box(2.9, H, 0.05), mats.glass);
    doorPane.position.set(-6.6, Y, 3.05);
    const doorFrame = mesh(box(2.9, 0.09, 0.09), mats.alu, -6.6, 2.94, 3.05, { cast: false });
    const doorPost1 = mesh(box(0.08, H, 0.1), mats.alu, -8.0, Y, 3.05, { cast: false });
    const doorPost2 = mesh(box(0.08, H, 0.1), mats.alu, -5.2, Y, 3.05, { cast: false });
    this.door.add(doorPane, doorFrame, doorPost1, doorPost2);
    gMenui.add(this.door);
    /* bandeau vitré dans le voile pierre */
    const bandeau = new THREE.Mesh(box(9.3, 1.15, 0.05), mats.glass);
    bandeau.position.set(-0.75, 1.98, 3.05);
    gMenui.add(bandeau);
    /* volet coulissant bois devant le bandeau */
    this.volet = mesh(box(2.3, 1.3, 0.07), mats.bois, 1.6, 1.98, 3.42);
    gMenui.add(this.volet);
    /* baie pignon est — dans l'ouverture du mur */
    const bayE = makeBay(3.4, 0, 0);
    bayE.rotation.y = Math.PI / 2;
    bayE.position.set(5.72, 0, 0.4);
    gMenui.add(bayE);
    this.group.add(gMenui);

    /* ═══ INTÉRIEUR — séjour traversant meublé ═══ */
    const gInt = new THREE.Group();
    /* sol intérieur béton ciré */
    gInt.add(mesh(box(19.6, 0.04, 8.0), mats.beton, -4.4, 0.38, -1, { cast: false }));
    /* tapis */
    gInt.add(mesh(box(4.6, 0.03, 3.2), mats.fabricDark, -11.6, 0.42, -0.6, { cast: false }));
    /* canapé en L face au paysage */
    gInt.add(mesh(box(3.4, 0.42, 1.05), mats.fabric, -11.9, 0.72, -1.9));
    gInt.add(mesh(box(3.4, 0.48, 0.3), mats.fabric, -11.9, 1.12, -2.32));
    gInt.add(mesh(box(1.05, 0.42, 2.1), mats.fabric, -13.6, 0.72, -0.6));
    /* table basse travertin-like */
    gInt.add(mesh(box(1.5, 0.32, 0.85), mats.drystone, -11.4, 0.6, -0.35));
    /* cheminée dans le voile pierre (foyer) */
    this.ember = mesh(box(0.06, 0.34, 1.1), mats.ember, 2.82, 1.0, -2.4, { cast: false });
    gInt.add(this.ember);
    /* table à manger + bancs */
    gInt.add(mesh(box(2.6, 0.07, 1.05), mats.noyer, -4.6, 1.08, -0.6));
    gInt.add(mesh(box(0.09, 0.66, 0.9), mats.inkMetal, -5.7, 0.72, -0.6));
    gInt.add(mesh(box(0.09, 0.66, 0.9), mats.inkMetal, -3.5, 0.72, -0.6));
    gInt.add(mesh(box(2.2, 0.05, 0.32), mats.noyer, -4.6, 0.62, 0.35, { cast: false }));
    gInt.add(mesh(box(2.2, 0.05, 0.32), mats.noyer, -4.6, 0.62, -1.55, { cast: false }));
    /* cuisine — îlot + linéaire nord */
    gInt.add(mesh(box(2.8, 0.92, 1.05), mats.noyer, 0.9, 0.87, -0.4));
    gInt.add(mesh(box(2.95, 0.06, 1.15), mats.beton, 0.9, 1.36, -0.4, { cast: false }));
    gInt.add(mesh(box(4.6, 0.95, 0.7), mats.inkMetal, 0.4, 0.9, -4.55));
    gInt.add(mesh(box(4.6, 1.15, 0.35), mats.noyer, 0.4, 2.6, -4.72, { cast: false }));
    /* suspensions au-dessus de l'îlot */
    this.pendants = [];
    [-0.1, 0.9, 1.9].forEach((x) => {
      gInt.add(mesh(new THREE.CylinderGeometry(0.006, 0.006, 1.15, 5), mats.inkMetal, x, 2.75, -0.4, { cast: false }));
      const p = mesh(new THREE.SphereGeometry(0.09, 16, 12), mats.pendant, x, 2.14, -0.4, { cast: false });
      this.pendants.push(p);
      gInt.add(p);
    });
    /* bibliothèque basse + plante */
    gInt.add(mesh(box(3.4, 0.5, 0.35), mats.noyer, -8.2, 0.68, -4.6));
    gInt.add(mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.5, 8), mats.betonBrut, -14.6, 0.68, -3.9));
    gInt.add(mesh(new THREE.IcosahedronGeometry(0.55, 1), mats.plante, -14.6, 1.45, -3.9));
    /* mobilier extérieur sous le porche */
    gInt.add(mesh(box(1.9, 0.34, 0.85), mats.boisGris, -12.4, 0.6, 1.2));
    gInt.add(mesh(box(0.8, 0.38, 0.8), mats.fabric, -10.6, 0.62, 1.6));
    /* lit à l'étage (aperçu par le bandeau) */
    gInt.add(mesh(box(2.1, 0.4, 1.7), mats.fabric, 0.2, 4.0, -2.2));
    gInt.add(mesh(box(2.1, 0.9, 0.12), mats.noyer, 0.2, 4.2, -3.1));
    this.group.add(gInt);

    this.parts = {
      fond: gFond, dalle: gDalle, murs: gMurs, charp: gCharp,
      etage: gEtage, couv: gCouv, menui: gMenui, fini: gFini, interieur: gInt
    };
    this.base = {};
    for (const [k, g] of Object.entries(this.parts)) this.base[k] = g.position.clone();
    this.doorBaseX = this.door.position.x;
    this.voletBaseX = this.volet.position.x;

    /* ═══ AILE ANCIENNE À RÉNOVER (ouest, sur le coteau) ═══ */
    this.renov = new THREE.Group();
    this.renov.position.set(-34, 0, -16);
    const old1 = mesh(box(9, 3.4, 6.2), mats.vieillePierre, 0, 1.7, 0);
    /* deux pignons minces en pierre — la ferme attend sa toiture */
    const oldPigW = new THREE.Mesh(gablePrism(0.55, 3.1, 1.9), mats.vieillePierre);
    oldPigW.position.set(-4.5, 3.4, 0); oldPigW.castShadow = true;
    const oldPigE = new THREE.Mesh(gablePrism(0.55, 3.1, 1.9), mats.vieillePierre);
    oldPigE.position.set(3.95, 3.4, 0); oldPigE.castShadow = true;
    this.renov.add(old1, oldPigW, oldPigE);
    addEdges(old1);
    /* toiture neuve (descend pendant l'assemblage) */
    this.renovRoof = new THREE.Group();
    const rL = mesh(box(9.8, 0.1, 3.75), mats.tuiles, 0, 4.42, -1.62); rL.rotation.x = -0.55;
    const rR = mesh(box(9.8, 0.1, 3.75), mats.tuiles, 0, 4.42, 1.62); rR.rotation.x = 0.55;
    this.renovRoof.add(rL, rR);
    this.renovRoof.add(mesh(box(9.8, 0.12, 0.26), mats.inkMetal, 0, 5.32, 0, { cast: false }));
    this.renov.add(this.renovRoof);
    /* extension contemporaine (glisse depuis l'est) */
    this.renovExt = new THREE.Group();
    const extDalle = mesh(box(6.2, 0.3, 5.4), mats.beton, 7.2, 0.15, 0.2);
    const extToit = mesh(box(6.6, 0.28, 5.8), mats.beton, 7.2, 3.3, 0.2);
    const extGlass = new THREE.Mesh(box(5.6, 2.7, 0.05), mats.glass);
    extGlass.position.set(7.2, 1.7, 2.6);
    const extFond = mesh(box(6.2, 3.0, 0.4), mats.boisGris, 7.2, 1.8, -2.3);
    [4.6, 7.2, 9.8].forEach((x) => this.renovExt.add(mesh(box(0.14, 3.0, 0.14), mats.alu, x, 1.8, 2.6, { cast: false })));
    this.renovExt.add(extDalle, extToit, extGlass, extFond);
    addEdges(extToit);
    this.renov.add(this.renovExt);
    this.renovExtBase = this.renovExt.position.clone();
    this.renovRoofBase = this.renovRoof.position.clone();
    this.group.add(this.renov);

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
          vT = clamp((w.x + w.z * 0.6 + w.y * 2.4 + 42.0) / 78.0, 0.0, 1.0);
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

    /* éclairage intérieur du soir */
    this.innerLight = new THREE.PointLight(0xffb877, 0, 20, 1.8);
    this.innerLight.position.set(-4, 2.4, -1);
    scene.add(this.innerLight);
    this.porchLight = new THREE.PointLight(0xffa860, 0, 12, 2);
    this.porchLight.position.set(-12, 2.6, 0);
    scene.add(this.porchLight);
  }

  /* e : éclaté par lots, 0..1 — chorégraphie de coordination */
  setExplode(e) {
    const p = this.parts, b = this.base;
    const s = (d) => smooth(d, d + 0.5, e);
    p.fond.position.y = b.fond.y - s(0.0) * 2.4;
    p.dalle.position.y = b.dalle.y + s(0.1) * 1.3;
    p.murs.position.y = b.murs.y + s(0.18) * 2.6;
    p.charp.position.y = b.charp.y + s(0.28) * 4.2;
    p.etage.position.y = b.etage.y + s(0.34) * 5.6;
    p.couv.position.y = b.couv.y + s(0.42) * 7.6;
    p.menui.position.z = b.menui.z + s(0.26) * 3.6;
    p.fini.position.z = b.fini.z + s(0.16) * 3.0;
    p.interieur.position.y = b.interieur.y + s(0.22) * 1.3;
  }

  setDoor(t) {
    this.door.position.x = this.doorBaseX - t * 2.6;
    this.volet.position.x = this.voletBaseX + t * 2.1;
  }

  /* r : assemblage de la rénovation, 0..1 — avant, la ferme attend sans toit */
  setRenov(r) {
    this.renovRoof.visible = r > 0.02;
    this.renovExt.visible = r > 0.02;
    const roofDrop = 1 - smooth(0.15, 0.6, r);
    this.renovRoof.position.y = this.renovRoofBase.y + roofDrop * 5.5;
    const extSlide = 1 - smooth(0.4, 0.9, r);
    this.renovExt.position.x = this.renovExtBase.x + extSlide * 10;
    this.renovExt.position.y = this.renovExtBase.y + extSlide * 0.6;
  }

  /* n : facteur soir · fill : présence caméra à l'intérieur */
  setLights(n, fill = 0) {
    this.mats.glass.emissiveIntensity = n * 0.09;
    this.mats.ember.emissiveIntensity = n * 1.5 + fill * 0.25;
    this.mats.pendant.emissiveIntensity = n * 1.7 + fill * 0.35;
    this.innerLight.intensity = n * 34 + fill * 8;
    this.porchLight.intensity = n * 12 + fill * 2;
  }
}
