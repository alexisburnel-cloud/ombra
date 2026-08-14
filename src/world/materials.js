import * as THREE from 'three';

export function makeMaterials(textures) {
  /* plan de construction — la maison s'élève avec le chapitre I */
  const buildPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);

  const clipped = [];
  const clip = (m) => { m.clippingPlanes = [buildPlane]; clipped.push(m); return m; };

  const drystone = clip(new THREE.MeshStandardMaterial({
    map: textures.drystone, color: 0xcfc7b6, roughness: 0.9, metalness: 0, envMapIntensity: 0.3
  }));
  const galets = clip(new THREE.MeshStandardMaterial({
    map: textures.galets, color: 0xc8c0b0, roughness: 0.92, metalness: 0, envMapIntensity: 0.25
  }));
  const enduit = clip(new THREE.MeshStandardMaterial({
    map: textures.enduit, color: 0xe4dcc9, roughness: 0.88, metalness: 0, envMapIntensity: 0.3
  }));
  const enduitFonce = clip(new THREE.MeshStandardMaterial({
    map: textures.enduit, color: 0x9d968a, roughness: 0.9, metalness: 0, envMapIntensity: 0.25
  }));
  const tuiles = clip(new THREE.MeshStandardMaterial({
    map: textures.tuiles, color: 0x9d8471, roughness: 0.88, metalness: 0, envMapIntensity: 0.18
  }));
  const bois = clip(new THREE.MeshStandardMaterial({
    map: textures.bois, color: 0xc7a67c, roughness: 0.7, metalness: 0, envMapIntensity: 0.3
  }));
  const boisGris = clip(new THREE.MeshStandardMaterial({
    map: textures.boisGris, color: 0xb9b2a4, roughness: 0.75, metalness: 0, envMapIntensity: 0.3
  }));
  const vieillePierre = clip(new THREE.MeshStandardMaterial({
    map: textures.vieillePierre, color: 0xcabfa6, roughness: 0.95, metalness: 0, envMapIntensity: 0.2
  }));
  const beton = clip(new THREE.MeshStandardMaterial({
    map: textures.beton, color: 0xcfc9bc, roughness: 0.82, metalness: 0, envMapIntensity: 0.3
  }));
  const betonBrut = clip(new THREE.MeshStandardMaterial({
    map: textures.beton, color: 0xaaa79e, roughness: 0.9, metalness: 0, envMapIntensity: 0.2
  }));
  const alu = clip(new THREE.MeshStandardMaterial({
    color: 0x2e3230, roughness: 0.45, metalness: 0.7, envMapIntensity: 0.7
  }));
  const glass = clip(new THREE.MeshPhysicalMaterial({
    color: 0xa8bcb4, transparent: true, opacity: 0.16,
    roughness: 0.06, metalness: 0, envMapIntensity: 1.4,
    side: THREE.DoubleSide, depthWrite: false,
    emissive: 0xffb267, emissiveIntensity: 0
  }));
  const charpente = clip(new THREE.MeshStandardMaterial({
    map: textures.bois, color: 0xb08d60, roughness: 0.8, metalness: 0, envMapIntensity: 0.2
  }));

  /* intérieur */
  const fabric = clip(new THREE.MeshStandardMaterial({
    color: 0xcec3ab, roughness: 1, metalness: 0, envMapIntensity: 0.15
  }));
  const fabricDark = clip(new THREE.MeshStandardMaterial({
    color: 0x5d5a4e, roughness: 1, metalness: 0, envMapIntensity: 0.12
  }));
  const noyer = clip(new THREE.MeshStandardMaterial({
    map: textures.bois, color: 0x87643f, roughness: 0.65, metalness: 0, envMapIntensity: 0.3
  }));
  const inkMetal = clip(new THREE.MeshStandardMaterial({
    color: 0x24211c, roughness: 0.5, metalness: 0.6, envMapIntensity: 0.5
  }));
  const pendant = clip(new THREE.MeshStandardMaterial({
    color: 0x2a2118, emissive: 0xffc98e, emissiveIntensity: 0, roughness: 1
  }));
  const ember = clip(new THREE.MeshStandardMaterial({
    color: 0x1a120a, emissive: 0xff9a4a, emissiveIntensity: 0, roughness: 1
  }));
  const plante = clip(new THREE.MeshStandardMaterial({
    color: 0x39502e, roughness: 1, metalness: 0, envMapIntensity: 0.1, flatShading: true
  }));

  /* paysage (non clippé) */
  const prairie = new THREE.MeshStandardMaterial({
    map: textures.prairie, color: 0xc3b998, roughness: 1, metalness: 0, envMapIntensity: 0.12
  });
  const hill = new THREE.MeshStandardMaterial({ color: 0x33413a, roughness: 1, envMapIntensity: 0 });
  const canopy = new THREE.MeshStandardMaterial({ color: 0x3d4a2e, roughness: 1, envMapIntensity: 0.06, flatShading: true });
  const canopySombre = new THREE.MeshStandardMaterial({ color: 0x2a3a26, roughness: 1, envMapIntensity: 0.05, flatShading: true });
  const trunk = new THREE.MeshStandardMaterial({ color: 0x4a3d2e, roughness: 1, envMapIntensity: 0 });
  const gravier = new THREE.MeshStandardMaterial({
    map: textures.beton, color: 0xc0b49a, roughness: 1, metalness: 0, envMapIntensity: 0.1
  });

  return {
    buildPlane, clipped,
    drystone, galets, enduit, enduitFonce, tuiles, bois, boisGris,
    vieillePierre, beton, betonBrut, alu, glass, charpente,
    fabric, fabricDark, noyer, inkMetal, pendant, ember, plante,
    prairie, hill, canopy, canopySombre, trunk, gravier
  };
}
