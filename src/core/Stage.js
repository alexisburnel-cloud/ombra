import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { TIER } from './utils.js';

export class Stage {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false
    });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.6;
    this.renderer.localClippingEnabled = true;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 900);
    this.camera.position.set(33, 3, 46);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.28;
    pmrem.dispose();

    this.dpr = Math.min(devicePixelRatio || 1, TIER.dpr);
    this.resize();
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(w, h);
  }
}
