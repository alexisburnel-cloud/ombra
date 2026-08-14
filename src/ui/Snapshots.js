import { clamp } from '../core/utils.js';

/*
  Photographie procédurale : l'atelier photographie sa propre maquette.
  Chaque « œuvre » est un cadrage, une heure et une configuration
  différente de la même architecture — recomposée puis restaurée.
*/

const SHOTS = [
  {
    name: 'Villa Vespera — heure dorée',
    phase: 0.7,
    cam: { pos: [21, 3.4, 27], tgt: [0, 3.0, 0], fov: 30 },
    setup: null,
    w: 1000, h: 1250
  },
  {
    name: 'Casa Traverta — pavillon bas',
    phase: 0.42,
    cam: { pos: [-3, 1.9, 30], tgt: [0, 2.6, 0], fov: 26 },
    setup: (villa) => {
      villa.parts.upper.visible = false;
      villa.parts.roof.position.y = villa.base.roof.y - 3.15;
      villa.parts.roof.scale.set(1.32, 1, 1.18);
    },
    w: 1000, h: 1250
  },
  {
    name: 'Maison Brume — matin',
    phase: 0.3,
    fog: { near: 3, far: 34 },
    cam: { pos: [27, 2.2, 21], tgt: [0, 3.6, 0], fov: 34 },
    setup: null,
    w: 1250, h: 940
  },
  {
    name: 'Sei-An House — nuit',
    phase: 0.97,
    fill: 0.5,
    cam: { pos: [9, 1.6, 13], tgt: [1, 2.6, 0], fov: 40 },
    setup: null,
    w: 1000, h: 1250
  },
  {
    name: 'Pavillon Dune — chantier',
    phase: 0.55,
    cam: { pos: [-16, 5.5, 21], tgt: [0, 2.2, 0], fov: 33 },
    setup: (villa) => {
      villa.parts.upper.visible = false;
      villa.parts.core.visible = false;
      villa.parts.furniture.visible = false;
      villa.parts.roof.position.y = villa.base.roof.y - 2.4;
      villa.parts.roof.scale.set(1.5, 1, 1.3);
    },
    w: 1250, h: 940
  }
];

export function takeSnapshots(app) {
  const { stage, villa, sun, sky, landscape } = app;
  const { renderer, scene, camera } = stage;

  const saved = {
    camPos: camera.position.clone(),
    camQuat: camera.quaternion.clone(),
    fov: camera.fov,
    aspect: camera.aspect,
    build: app.mats.buildPlane.constant,
    lineOp: villa.lineUniforms.uOpacity.value,
    night: 0
  };

  app.mats.buildPlane.constant = 99;
  villa.lineUniforms.uOpacity.value = 0;

  const urls = [];
  for (const shot of SHOTS) {
    if (shot.setup) shot.setup(villa);

    const st = sun.apply(shot.phase, sky);
    villa.setLights(st.night, shot.fill || 0);
    villa.pool.sync(st, scene.fog, 12);
    landscape.lake.sync(st, scene.fog, 12);
    if (shot.fog) { scene.fog.near = shot.fog.near; scene.fog.far = shot.fog.far; }

    camera.position.set(...shot.cam.pos);
    camera.lookAt(...shot.cam.tgt);
    camera.fov = shot.cam.fov;
    camera.aspect = shot.w / shot.h;
    camera.updateProjectionMatrix();

    renderer.setPixelRatio(1);
    renderer.setSize(shot.w, shot.h, false);
    renderer.render(scene, camera);
    urls.push({
      src: renderer.domElement.toDataURL('image/jpeg', 0.88),
      name: shot.name,
      portrait: shot.h > shot.w
    });

    /* restauration de la configuration */
    villa.parts.upper.visible = true;
    villa.parts.core.visible = true;
    villa.parts.furniture.visible = true;
    villa.parts.roof.position.y = villa.base.roof.y;
    villa.parts.roof.scale.set(1, 1, 1);
  }

  camera.position.copy(saved.camPos);
  camera.quaternion.copy(saved.camQuat);
  camera.fov = saved.fov;
  camera.aspect = saved.aspect;
  camera.updateProjectionMatrix();
  app.mats.buildPlane.constant = saved.build;
  villa.lineUniforms.uOpacity.value = saved.lineOp;
  stage.resize();

  return urls;
}

/* deux macros matière pour les planches */
export function materialPlates(canvases) {
  const out = [];
  const pick = [['travertin', 'Travertin Navona — détail'], ['chene', 'Chêne fumé — détail']];
  for (const [key, name] of pick) {
    out.push({ src: canvases[key].toDataURL('image/jpeg', 0.85), name, portrait: false });
  }
  return out;
}
