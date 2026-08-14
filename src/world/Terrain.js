import * as THREE from 'three';
import { fbm, clamp, smooth } from '../core/utils.js';

/*
  Terrain de coteau — Drôme.
  Une pente descend vers la vallée (sud, +z), la plateforme de la
  maison est taillée dedans, un jardin bas prolonge côté vallée.
  Les courbes de niveau (shader) dessinent le territoire au prologue.
*/

const PLATFORM = { x0: -20, x1: 24, z0: -10, z1: 5.2, y: 0 };
const GARDEN = { x0: -4, x1: 22, z0: 5.2, z1: 17, y: -2.6 };

function rectDist(x, z, r) {
  const dx = Math.max(r.x0 - x, 0, x - r.x1);
  const dz = Math.max(r.z0 - z, 0, z - r.z1);
  return Math.hypot(dx, dz);
}

export function terrainHeight(x, z) {
  let h = -z * 0.055
    + fbm(x * 0.018 + 7, z * 0.018, 3) * 4.2
    + fbm(x * 0.06, z * 0.06 + 3, 3) * 0.9
    - 2.2;
  /* adoucir vers le lointain sud (vallée) */
  h -= smooth(20, 90, z) * 2.5;
  /* plateforme maison */
  const dP = rectDist(x, z, PLATFORM);
  h = h * smooth(0, 14, dP) + PLATFORM.y * (1 - smooth(0, 14, dP));
  /* jardin bas */
  const dG = rectDist(x, z, GARDEN);
  h = h * smooth(0, 8, dG) + GARDEN.y * (1 - smooth(0, 8, dG));
  return h;
}

export class Terrain {
  constructor(scene, mats) {
    const W = 420, D = 340, SX = 150, SZ = 120;
    const geo = new THREE.PlaneGeometry(W, D, SX, SZ);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, terrainHeight(x, z));
    }
    geo.computeVertexNormals();

    this.uniforms = { uTopo: { value: 1 } };
    const mat = mats.prairie;
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTopo = this.uniforms.uTopo;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWorldTopo;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWorldTopo = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWorldTopo;\nuniform float uTopo;')
        .replace('#include <dithering_fragment>', `#include <dithering_fragment>
          {
            float lv = vWorldTopo.y / 1.25;
            float f = abs(fract(lv) - 0.5);
            float aw = max(fwidth(lv), 1e-5);
            /* épaisseur constante à l'écran, jamais plus de 0.06 niveau */
            float w = min(aw * 1.1, 0.06);
            float line = 1.0 - smoothstep(w, w * 2.0, f);
            /* pas de trait sur les replats (le niveau y stagne) */
            line *= smoothstep(0.0015, 0.006, aw);
            /* fondu au lointain */
            line *= smoothstep(190.0, 70.0, length(vWorldTopo - cameraPosition));
            float major = step(0.72, fract(lv / 4.0 + 0.125));
            vec3 tc = mix(vec3(0.55, 0.56, 0.47), vec3(0.28, 0.75, 0.53), 0.35 + major * 0.5);
            gl_FragColor.rgb = mix(gl_FragColor.rgb, tc, line * uTopo * 0.6);
          }`);
    };
    mat.needsUpdate = true;

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.receiveShadow = true;
    scene.add(this.mesh);
  }
}

export const groundY = terrainHeight;
