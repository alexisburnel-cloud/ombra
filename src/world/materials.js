import * as THREE from 'three';
import { pbr } from './pbr.js';

/*
  Matériaux V3 — physiques (ambientCG CC0) + spéciaux.
  Le plan de construction (clipping) ne s'applique qu'au bâti.
*/

export function makeMaterials() {
  const buildPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
  const clipped = [];
  const clip = (m) => { m.clippingPlanes = [buildPlane]; clipped.push(m); return m; };

  /* ── bâti ── */
  const drystone = clip(pbr('stonewall2', {
    repeat: [2.2, 1.1], color: 0xcfc4ae, envMapIntensity: 0.3, normalScale: 1.15
  }));
  const drystoneTall = clip(pbr('stonewall2', {
    repeat: [1.1, 2.2], color: 0xcfc4ae, envMapIntensity: 0.3, normalScale: 1.15
  }));
  const enduit = clip(pbr('plaster', {
    repeat: [2.6, 1.6], color: 0xe9e0cd, envMapIntensity: 0.32, normalScale: 0.65
  }));
  const enduitFonce = clip(pbr('plaster', {
    repeat: [2.2, 1.4], color: 0x9b948a, envMapIntensity: 0.25, normalScale: 0.6
  }));
  const tuiles = clip(pbr('tiles', {
    repeat: [3.2, 2.2], color: 0xc9a68e, envMapIntensity: 0.22, normalScale: 1.1
  }));
  const siding = clip(pbr('siding', {
    repeat: [2.8, 1.2], color: 0xbdb4a4, envMapIntensity: 0.3, normalScale: 0.9
  }));
  const bois = clip(pbr('woodfloor', {
    repeat: [1.6, 1.0], color: 0xcfa878, envMapIntensity: 0.3, normalScale: 0.8
  }));
  const charpente = clip(pbr('woodfloor', {
    repeat: [2.4, 0.5], color: 0xb08a5e, envMapIntensity: 0.2, normalScale: 0.7
  }));
  const beton = clip(pbr('concrete', {
    repeat: [2.4, 2.4], color: 0xd6d0c2, envMapIntensity: 0.3, normalScale: 0.55
  }));
  const betonBrut = clip(pbr('concrete', {
    repeat: [1.8, 1.8], color: 0xaba69b, envMapIntensity: 0.2, normalScale: 0.8
  }));
  const paving = clip(pbr('paving', {
    repeat: [2.6, 2.6], color: 0xcdc6b6, envMapIntensity: 0.3, normalScale: 0.9
  }));
  const planks = clip(pbr('planks', {
    repeat: [2.2, 2.2], color: 0xbfa284, envMapIntensity: 0.3, normalScale: 0.85
  }));
  const vieillePierre = clip(pbr('stonewall2', {
    repeat: [2.6, 1.4], color: 0xc4b79c, envMapIntensity: 0.2, normalScale: 1.3, roughness: 1
  }));
  const woodfloorInt = clip(pbr('woodfloor', {
    repeat: [4, 4], color: 0xc9a97e, envMapIntensity: 0.35, normalScale: 0.6
  }));

  const alu = clip(new THREE.MeshStandardMaterial({
    color: 0x2e3230, roughness: 0.45, metalness: 0.7, envMapIntensity: 0.7
  }));
  const aluClair = clip(new THREE.MeshStandardMaterial({
    color: 0x8a8d88, roughness: 0.35, metalness: 0.8, envMapIntensity: 0.9
  }));
  /* verre : présence réelle — reflets d'environnement + teinte légère */
  const glass = clip(new THREE.MeshPhysicalMaterial({
    color: 0x9db8ae, transparent: true, opacity: 0.26,
    roughness: 0.04, metalness: 0.06, envMapIntensity: 2.6,
    clearcoat: 0.6, clearcoatRoughness: 0.08,
    side: THREE.DoubleSide, depthWrite: false,
    emissive: 0xffb267, emissiveIntensity: 0
  }));

  /* ── intérieur ── */
  const fabric = clip(new THREE.MeshStandardMaterial({
    color: 0xd3c8b0, roughness: 1, metalness: 0, envMapIntensity: 0.15
  }));
  const fabricDark = clip(new THREE.MeshStandardMaterial({
    color: 0x635f52, roughness: 1, metalness: 0, envMapIntensity: 0.12
  }));
  const rideau = clip(new THREE.MeshStandardMaterial({
    color: 0xe8e0cf, roughness: 1, metalness: 0, envMapIntensity: 0.1,
    transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false
  }));
  const noyer = clip(pbr('woodfloor', {
    repeat: [1.2, 0.8], color: 0x8a6742, envMapIntensity: 0.3, normalScale: 0.7
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
  const borne = new THREE.MeshStandardMaterial({
    color: 0x2c2c28, emissive: 0xffc48a, emissiveIntensity: 0, roughness: 0.7, metalness: 0.3
  });
  const plante = clip(new THREE.MeshStandardMaterial({
    color: 0x3d5430, roughness: 1, metalness: 0, envMapIntensity: 0.1, flatShading: true
  }));

  /* ── paysage (non clippé) ── */
  const prairie = pbr('grass', {
    repeat: [90, 70], color: 0xc9c2a2, envMapIntensity: 0.12, normalScale: 0.5
  });
  const gravier = pbr('gravel', {
    repeat: [14, 10], color: 0xcfc5ae, envMapIntensity: 0.15, normalScale: 0.9
  });
  const terre = pbr('ground', {
    repeat: [8, 8], color: 0xb59f82, envMapIntensity: 0.12, normalScale: 1
  });
  const roche = pbr('rock', {
    repeat: [1.6, 1.2], color: 0xbdb3a0, envMapIntensity: 0.2, normalScale: 1.2
  });
  const soutenement = pbr('stonewall2', {
    repeat: [4.5, 1.6], color: 0xc6bba4, envMapIntensity: 0.25, normalScale: 1.25
  });
  const hill = new THREE.MeshStandardMaterial({ color: 0x39473e, roughness: 1, envMapIntensity: 0 });
  const canopy = new THREE.MeshStandardMaterial({ color: 0x4a5a38, roughness: 1, envMapIntensity: 0.06, flatShading: true });
  const canopySombre = new THREE.MeshStandardMaterial({ color: 0x35462e, roughness: 1, envMapIntensity: 0.05, flatShading: true });
  const trunk = new THREE.MeshStandardMaterial({ color: 0x584a38, roughness: 1, envMapIntensity: 0 });

  /* ── chantier ── */
  const engin = new THREE.MeshStandardMaterial({
    color: 0xd9a13c, roughness: 0.5, metalness: 0.35, envMapIntensity: 0.5
  });
  const enginFonce = new THREE.MeshStandardMaterial({
    color: 0x3a3a36, roughness: 0.7, metalness: 0.4, envMapIntensity: 0.3
  });
  const enginVitre = new THREE.MeshStandardMaterial({
    color: 0x39464a, roughness: 0.15, metalness: 0.4, envMapIntensity: 0.9
  });
  const chenille = new THREE.MeshStandardMaterial({
    color: 0x2b2b28, roughness: 0.95, metalness: 0.15, envMapIntensity: 0.15
  });

  return {
    buildPlane, clipped,
    drystone, drystoneTall, enduit, enduitFonce, tuiles, siding, bois,
    charpente, beton, betonBrut, paving, planks, vieillePierre, woodfloorInt,
    alu, aluClair, glass,
    fabric, fabricDark, rideau, noyer, inkMetal, pendant, ember, borne, plante,
    prairie, gravier, terre, roche, soutenement, hill, canopy, canopySombre, trunk,
    engin, enginFonce, enginVitre, chenille
  };
}
