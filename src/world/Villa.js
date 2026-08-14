import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { smooth } from '../core/utils.js';
import { Water } from './Water.js';

/*
  Villa Vespera — composition procédurale (mètres)
  pavillon de verre RDC · dalle en porte-à-faux · volume haut aveugle
  noyau de travertin traversant · bassin miroir · colonnade bronze
*/

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

function mesh(geo, mat, x, y, z, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

export class Villa {
  constructor(scene, mats) {
    this.mats = mats;
    this.group = new THREE.Group();
    scene.add(this.group);

    const edgeSources = [];
    const addEdges = (m, threshold = 20) => edgeSources.push({ mesh: m, threshold });

    /* ── socle ── */
    const gBase = new THREE.Group();
    const podium = mesh(box(30, 0.5, 15), mats.travertineFloor, 1, 0.25, 0);
    gBase.add(podium); addEdges(podium);

    for (let i = 0; i < 3; i++) {
      const st = mesh(box(6, 0.166, 0.45), mats.travertine, -4, 0.417 - i * 0.166, 7.725 + i * 0.45);
      gBase.add(st);
    }
    const landWall = mesh(box(14, 1.4, 0.35), mats.travertine, 5, 1.2, -6.8);
    gBase.add(landWall); addEdges(landWall);

    /* ── bassin miroir ── */
    this.pool = new Water({ width: 9.5, depth: 5, calm: 0, scale: 1.1 });
    this.pool.mesh.position.set(10.75, 0.507, 3.0);
    gBase.add(this.pool.mesh);
    const rimGeo = [
      box(9.72, 0.035, 0.11), box(9.72, 0.035, 0.11),
      box(0.11, 0.035, 5.0), box(0.11, 0.035, 5.0)
    ];
    const rimPos = [
      [10.75, 0.517, 0.445], [10.75, 0.517, 5.555],
      [5.945, 0.517, 3.0], [15.555, 0.517, 3.0]
    ];
    rimGeo.forEach((g, i) => gBase.add(mesh(g, mats.bronze, ...rimPos[i], { cast: false })));

    /* ── sol intérieur + tapis ── */
    const gFurn = new THREE.Group();
    const rugMat = new THREE.MeshStandardMaterial({ color: 0x373126, roughness: 1, envMapIntensity: 0.12 });
    rugMat.clippingPlanes = [mats.buildPlane];
    gFurn.add(mesh(new THREE.BoxGeometry(5.2, 0.02, 3.4), rugMat, -3.4, 0.515, 1.0, { cast: false }));

    /* canapé en L */
    gFurn.add(mesh(box(3.1, 0.38, 1.05), mats.fabric, -3.4, 0.7, 1.7));
    gFurn.add(mesh(box(3.1, 0.42, 0.28), mats.fabric, -3.4, 1.05, 2.28));
    gFurn.add(mesh(box(1.05, 0.38, 2.3), mats.fabric, -5.45, 0.7, 0.75));
    gFurn.add(mesh(box(1.05, 0.42, 0.28), mats.fabric, -5.84, 1.05, 0.75).rotateY(Math.PI / 2));
    /* table basse — monolithe travertin */
    gFurn.add(mesh(box(1.5, 0.34, 0.9), mats.travertine, -2.9, 0.68, 0.7));
    /* table à manger */
    gFurn.add(mesh(box(2.6, 0.06, 1.05), mats.oak, 0.3, 1.23, -2.0));
    gFurn.add(mesh(box(0.07, 0.68, 0.9), mats.darkWood, -0.75, 0.86, -2.0));
    gFurn.add(mesh(box(0.07, 0.68, 0.9), mats.darkWood, 1.35, 0.86, -2.0));
    /* suspension */
    gFurn.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.2, 6), mats.inkMetal, 0.3, 3.08, -2.0, { cast: false }));
    this.pendant = mesh(new THREE.SphereGeometry(0.11, 20, 14), mats.pendant, 0.3, 2.42, -2.0, { cast: false });
    gFurn.add(this.pendant);
    /* étagère basse */
    gFurn.add(mesh(box(4.2, 0.42, 0.36), mats.oak, -4.6, 0.72, -4.1));
    /* lampadaire */
    gFurn.add(mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.62, 6), mats.inkMetal, -7.1, 1.31, -3.6));
    this.lampHead = mesh(new THREE.SphereGeometry(0.08, 16, 12), mats.pendant, -7.1, 2.16, -3.6, { cast: false });
    gFurn.add(this.lampHead);
    /* îlot */
    gFurn.add(mesh(box(2.3, 0.85, 0.8), mats.travertine, 1.6, 0.925, -3.6));

    /* lambris chêne sur le noyau (face séjour) */
    gFurn.add(mesh(box(0.06, 3.2, 5), mats.oak, 3.86, 2.1, -1.0));
    /* foyer */
    this.ember = mesh(box(0.05, 0.32, 0.95), mats.ember, 3.9, 1.05, -1.2, { cast: false });
    gFurn.add(this.ember);

    /* ── noyau de travertin ── */
    const gCore = new THREE.Group();
    const core = mesh(box(1.2, 8.2, 5), mats.travertine, 4.5, 4.6, -1.0);
    gCore.add(core); addEdges(core);

    /* ── colonnade bronze ── */
    const gCols = new THREE.Group();
    [-7.2, -2.4, 2.4, 7.2].forEach((x) => {
      gCols.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.2, 12), mats.bronze, x, 2.1, 4.62));
    });

    /* ── enveloppe de verre — 4 parois ── */
    const H = 3.14, Y = 2.07; // vitrage y 0.5 → 3.64
    const mullion = (len) => box(0.07, H, 0.07);
    const rail = (w, d) => box(w, 0.09, d);

    const makeWall = (opts) => {
      const g = new THREE.Group();
      const { axis, at, from, to, posts, pane } = opts;
      posts.forEach((p) => {
        const m = new THREE.Mesh(mullion(), this.mats.bronze);
        m.castShadow = true;
        if (axis === 'z') m.position.set(p, Y, at); else m.position.set(at, Y, p);
        g.add(m);
      });
      const railLen = to - from;
      [0.545, 3.6].forEach((ry) => {
        const r = new THREE.Mesh(axis === 'z' ? rail(railLen, 0.09) : rail(0.09, railLen), this.mats.bronze);
        if (axis === 'z') r.position.set((from + to) / 2, ry, at); else r.position.set(at, ry, (from + to) / 2);
        g.add(r);
      });
      if (pane !== false) {
        const p = new THREE.Mesh(
          axis === 'z' ? box(railLen, H, 0.025) : box(0.025, H, railLen),
          this.mats.glass
        );
        if (axis === 'z') p.position.set((from + to) / 2, Y, at); else p.position.set(at, Y, (from + to) / 2);
        p.castShadow = false;
        g.add(p);
        addEdges(p, 80);
      }
      return g;
    };

    /* façade sud — avec porte coulissante */
    const gGlassF = new THREE.Group();
    gGlassF.add(makeWall({ axis: 'z', at: 4.5, from: -8, to: 0, posts: [-8, -5.33, -2.67, 0], pane: true }));
    gGlassF.add(makeWall({ axis: 'z', at: 4.5, from: 2.67, to: 8, posts: [2.67, 5.33, 8], pane: true }));
    this.door = new THREE.Group();
    const doorPane = new THREE.Mesh(box(2.67, H, 0.025), mats.glass);
    doorPane.position.set(1.335, Y, 4.44);
    const doorFrameV1 = new THREE.Mesh(box(0.06, H, 0.06), mats.inkMetal);
    doorFrameV1.position.set(0.03, Y, 4.44);
    const doorFrameV2 = doorFrameV1.clone();
    doorFrameV2.position.x = 2.64;
    this.door.add(doorPane, doorFrameV1, doorFrameV2);
    gGlassF.add(this.door);

    const gGlassB = makeWall({ axis: 'z', at: -4.5, from: -8, to: 8, posts: [-8, -5.33, -2.67, 0, 2.67, 5.33, 8] });
    const gGlassW = makeWall({ axis: 'x', at: -8, from: -4.5, to: 4.5, posts: [-4.5, -1.5, 1.5, 4.5] });
    const gGlassE = makeWall({ axis: 'x', at: 8, from: -4.5, to: 4.5, posts: [-4.5, -1.5, 1.5, 4.5] });

    /* ── dalle intermédiaire ── */
    const gSlab = new THREE.Group();
    const slab = mesh(box(18, 0.4, 10.4), mats.concrete, 0, 3.9, 0);
    gSlab.add(slab); addEdges(slab);
    /* sous-face chêne du débord (plafond terrasse) */
    gSlab.add(mesh(box(17.9, 0.03, 10.3), mats.oak, 0, 3.685, 0, { cast: false }));

    /* ── volume haut — bandeau vitré filant ── */
    const gUpper = new THREE.Group();
    const up = (w, h, d, x, y, z) => { const m = mesh(box(w, h, d), mats.concrete, x, y, z); gUpper.add(m); return m; };
    up(12, 1.2, 6.5, -4.5, 4.7, -1.0);            // bande basse
    up(12, 1.0, 6.5, -4.5, 6.6, -1.0);            // bande haute
    up(0.36, 0.8, 6.5, -10.32, 5.7, -1.0);        // about ouest
    up(0.36, 0.8, 6.5, 1.32, 5.7, -1.0);          // about est
    up(12, 0.8, 0.3, -4.5, 5.7, -4.1);            // remplissage nord
    const ribbon = new THREE.Mesh(box(11.2, 0.8, 0.025), mats.glass);
    ribbon.position.set(-4.5, 5.7, 2.1);
    gUpper.add(ribbon);
    /* volume d'édition pour les arêtes */
    const upperProxy = mesh(box(12, 3.0, 6.5), mats.concrete, -4.5, 5.6, -1.0);
    upperProxy.visible = false;
    gUpper.add(upperProxy); addEdges(upperProxy);

    /* ── toiture ── */
    const gRoof = new THREE.Group();
    const roof = mesh(box(13.6, 0.35, 8.0), mats.concrete, -4.5, 7.28, -1.0);
    gRoof.add(roof); addEdges(roof);

    this.group.add(gBase, gFurn, gCore, gCols, gGlassF, gGlassB, gGlassW, gGlassE, gSlab, gUpper, gRoof);

    this.parts = {
      base: gBase, furniture: gFurn, core: gCore, columns: gCols,
      glassF: gGlassF, glassB: gGlassB, glassW: gGlassW, glassE: gGlassE,
      slab: gSlab, upper: gUpper, roof: gRoof
    };
    this.doorPane = doorPane;
    this.doorBaseX = this.door.position.x;

    this.base = {};
    for (const [k, g] of Object.entries(this.parts)) this.base[k] = g.position.clone();

    /* ── arêtes — le trait de lumière ── */
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
      uColor: { value: new THREE.Color(0xd9ad6c) }
    };
    const lineMat = new THREE.ShaderMaterial({
      uniforms: this.lineUniforms,
      vertexShader: /* glsl */ `
        varying float vT;
        void main() {
          vec3 w = (modelMatrix * vec4(position, 1.0)).xyz;
          vT = clamp((w.x + w.z * 0.7 + w.y * 2.2 + 16.0) / 44.0, 0.0, 1.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        varying float vT;
        uniform float uProgress;
        uniform float uOpacity;
        uniform vec3 uColor;
        void main() {
          if (vT > uProgress) discard;
          float tip = smoothstep(0.06, 0.0, uProgress - vT) * 2.4;
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

    /* ── éclairage intérieur nocturne ── */
    this.innerLight = new THREE.PointLight(0xffb877, 0, 16, 1.8);
    this.innerLight.position.set(-1, 2.7, 0);
    scene.add(this.innerLight);
    this.emberLight = new THREE.PointLight(0xff8a3a, 0, 7, 2);
    this.emberLight.position.set(3.4, 1.1, -1.2);
    scene.add(this.emberLight);
  }

  /* e : éclaté 0..1 — chorégraphie par couche */
  setExplode(e) {
    const p = this.parts, b = this.base;
    const s = (d) => smooth(d, d + 0.55, e);
    p.roof.position.y = b.roof.y + s(0.0) * 5.0;
    p.upper.position.y = b.upper.y + s(0.09) * 3.3;
    p.slab.position.y = b.slab.y + s(0.18) * 1.75;
    p.glassF.position.z = b.glassF.z + s(0.27) * 3.4;
    p.glassB.position.z = b.glassB.z - s(0.27) * 3.4;
    p.glassW.position.x = b.glassW.x - s(0.33) * 3.4;
    p.glassE.position.x = b.glassE.x + s(0.33) * 3.4;
  }

  setDoor(t) {
    this.door.position.x = this.doorBaseX + t * 2.5;
  }

  /* n : facteur nuit · fill : présence caméra à l'intérieur (bounce diurne) */
  setLights(n, fill = 0) {
    this.mats.glass.emissiveIntensity = n * 0.1;
    this.mats.ember.emissiveIntensity = n * 1.6 + fill * 0.25;
    this.mats.pendant.emissiveIntensity = n * 1.8 + fill * 0.3;
    this.innerLight.intensity = n * 30 + fill * 7;
    this.emberLight.intensity = n * 9 + fill * 1.5;
  }
}
