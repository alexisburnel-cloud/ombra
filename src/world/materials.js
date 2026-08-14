import * as THREE from 'three';

export function makeMaterials(textures) {
  /* plan de construction — le bâtiment s'élève avec le chapitre I */
  const buildPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);

  const clipped = [];
  const clip = (m) => { m.clippingPlanes = [buildPlane]; clipped.push(m); return m; };

  const travertine = clip(new THREE.MeshStandardMaterial({
    map: textures.travertine, color: 0xcfc6b2, roughness: 0.82, metalness: 0.0, envMapIntensity: 0.35
  }));
  const travertineFloor = clip(new THREE.MeshStandardMaterial({
    map: textures.travertineFloor, color: 0xc9c0ac, roughness: 0.75, metalness: 0.0, envMapIntensity: 0.4
  }));
  const concrete = clip(new THREE.MeshStandardMaterial({
    map: textures.concrete, color: 0xd8d1c2, roughness: 0.92, metalness: 0.0, envMapIntensity: 0.25
  }));
  const oak = clip(new THREE.MeshStandardMaterial({
    map: textures.oak, color: 0x8a7358, roughness: 0.68, metalness: 0.0, envMapIntensity: 0.3
  }));
  const bronze = clip(new THREE.MeshStandardMaterial({
    map: textures.bronze, color: 0x9a825e, roughness: 0.38, metalness: 0.85, envMapIntensity: 1.1
  }));
  const glass = clip(new THREE.MeshPhysicalMaterial({
    color: 0x9fb6b6, transparent: true, opacity: 0.16,
    roughness: 0.06, metalness: 0.0, envMapIntensity: 1.4,
    side: THREE.DoubleSide, depthWrite: false,
    emissive: 0xffab5e, emissiveIntensity: 0
  }));
  const darkWood = clip(new THREE.MeshStandardMaterial({
    map: textures.oak, color: 0x4a3a2a, roughness: 0.7, metalness: 0.0, envMapIntensity: 0.25
  }));
  const fabric = clip(new THREE.MeshStandardMaterial({
    color: 0xb9ae98, roughness: 1.0, metalness: 0.0, envMapIntensity: 0.15
  }));
  const inkMetal = clip(new THREE.MeshStandardMaterial({
    color: 0x211d17, roughness: 0.5, metalness: 0.6, envMapIntensity: 0.6
  }));
  const ember = clip(new THREE.MeshStandardMaterial({
    color: 0x1a120a, emissive: 0xff9a4a, emissiveIntensity: 0, roughness: 1
  }));
  const pendant = clip(new THREE.MeshStandardMaterial({
    color: 0x2a2118, emissive: 0xffc98e, emissiveIntensity: 0, roughness: 1
  }));

  const lawn = new THREE.MeshStandardMaterial({
    map: textures.lawn, color: 0x9aa284, roughness: 1.0, metalness: 0.0, envMapIntensity: 0.1
  });
  const hill = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 1, envMapIntensity: 0 });
  const canopy = new THREE.MeshStandardMaterial({ color: 0x1d2318, roughness: 1, envMapIntensity: 0.05, flatShading: true });
  const trunk = new THREE.MeshStandardMaterial({ color: 0x241c14, roughness: 1, envMapIntensity: 0 });
  const poolShell = new THREE.MeshStandardMaterial({ color: 0x0d1d1e, roughness: 0.9, envMapIntensity: 0.1 });

  return {
    buildPlane, clipped,
    travertine, travertineFloor, concrete, oak, bronze, glass,
    darkWood, fabric, inkMetal, ember, pendant,
    lawn, hill, canopy, trunk, poolShell
  };
}

/* désactive le plan de construction (constant très haut = tout visible) */
export function setBuildHeight(mats, h) {
  mats.buildPlane.constant = h;
}
