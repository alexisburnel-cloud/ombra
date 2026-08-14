import * as THREE from 'three';

/*
  Matériaux physiques fichiers (ambientCG, CC0) :
  color + normal GL + roughness + ambient occlusion.
  Un seul loader partagé, textures clonées par variante de répétition.
*/

const loader = new THREE.TextureLoader();
const cache = new Map();

function baseTex(url, srgb) {
  if (!cache.has(url)) {
    const t = loader.load(url);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    cache.set(url, t);
  }
  return cache.get(url);
}

function variant(url, srgb, rx, ry) {
  const base = baseTex(url, srgb);
  if (rx === 1 && ry === 1) return base;
  const t = base.clone();
  t.repeat.set(rx, ry);
  t.needsUpdate = true;
  return t;
}

/**
 * Crée un MeshStandardMaterial PBR depuis public/textures/<key>/.
 * opts : repeat [rx,ry], color (teinte), roughness (multiplicateur),
 * normalScale, aoIntensity, extra (props matériau supplémentaires).
 */
export function pbr(key, opts = {}) {
  const [rx, ry] = opts.repeat || [1, 1];
  const dir = `/textures/${key}`;
  const mat = new THREE.MeshStandardMaterial({
    map: variant(`${dir}/color.jpg`, true, rx, ry),
    normalMap: variant(`${dir}/normal.jpg`, false, rx, ry),
    roughnessMap: variant(`${dir}/rough.jpg`, false, rx, ry),
    aoMap: variant(`${dir}/ao.jpg`, false, rx, ry),
    color: opts.color !== undefined ? opts.color : 0xffffff,
    roughness: opts.roughness !== undefined ? opts.roughness : 1,
    metalness: opts.metalness !== undefined ? opts.metalness : 0,
    envMapIntensity: opts.envMapIntensity !== undefined ? opts.envMapIntensity : 0.35,
    ...(opts.extra || {})
  });
  mat.normalScale.setScalar(opts.normalScale !== undefined ? opts.normalScale : 1);
  mat.aoMapIntensity = opts.aoIntensity !== undefined ? opts.aoIntensity : 0.85;
  return mat;
}
