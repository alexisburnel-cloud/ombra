import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, clamp, smooth, REDUCED, TIER } from './utils.js';
import { Stage } from './Stage.js';
import { makeTextures } from '../world/textures.js';
import { makeMaterials } from '../world/materials.js';
import { Sky } from '../world/Sky.js';
import { Terrain } from '../world/Terrain.js';
import { Villa } from '../world/Villa.js';
import { Landscape } from '../world/Landscape.js';
import { InteriorFX } from '../world/InteriorFX.js';
import { SunCycle } from '../world/SunCycle.js';
import { CameraRig } from '../world/CameraRig.js';
import { Post } from '../fx/Composer.js';
import { ScrollDirector } from './ScrollDirector.js';
import { Loader } from '../ui/Loader.js';
import { Cursor } from '../ui/Cursor.js';
import { Menu } from '../ui/Menu.js';
import { Annotations, LotsList } from '../ui/Annotations.js';
import { Strip } from '../ui/Strip.js';
import { Form } from '../ui/Form.js';
import { splitChars } from '../ui/SplitText.js';

/* chapitres à fond clair — le header passe à l'encre */
const LIGHT_CHAPTERS = new Set([5, 6, 7, 9]);

export class App {
  constructor(canvas) {
    this.stage = new Stage(canvas);
    this.textures = makeTextures();
    this.mats = makeMaterials(this.textures);
    this.sky = new Sky(this.stage.scene);
    this.sun = new SunCycle(this.stage.scene, this.stage.renderer, TIER);
    this.terrain = new Terrain(this.stage.scene, this.mats);
    this.landscape = new Landscape(this.stage.scene, this.mats);
    this.villa = new Villa(this.stage.scene, this.mats);
    this.fx = new InteriorFX(this.stage.scene);
    this.rig = new CameraRig(this.stage.camera);
    this.post = new Post(this.stage.renderer, this.stage.scene, this.stage.camera, TIER);

    this.scroll = new ScrollDirector();
    this.scroll.stop();
    this.rig.bake(this.scroll.ranges);

    this.loader = new Loader();
    this.cursor = new Cursor();
    this.menu = new Menu(this);
    this.annos = new Annotations(this.stage.camera, this.villa);
    this.lots = new LotsList();
    this.strip = new Strip(this.scroll, 7);
    this.form = new Form();

    /* hud */
    this.hudNum = $('#hudNum');
    this.hudName = $('#hudName');
    this.dayline = $('#dayline');
    this.daylineDot = $('#daylineDot');
    this.matRow = $('#matRow');
    this.scroll.onChapter = (i, el) => {
      this.swapChapter(el);
      document.body.classList.toggle('on-light', LIGHT_CHAPTERS.has(i));
    };

    /* titre héroïque préparé */
    this.heroChars = splitChars($('#proTitle'));
    gsap.set(this.heroChars, { opacity: 0 });

    this.post.setSize(innerWidth, innerHeight, this.stage.dpr);
    addEventListener('resize', () => this.onResize());

    this.time = 0;
    gsap.ticker.add((t, dtMs) => this.update(t, Math.min(dtMs / 1000, 0.05)));

    this.begin();
  }

  async begin() {
    await document.fonts.ready;
    /* préchauffe des shaders */
    this.sun.apply(0.4, this.sky);
    this.stage.renderer.render(this.stage.scene, this.stage.camera);

    await this.loader.finish();
    this.scroll.start();
    $('.hd').classList.add('on');
    $('.hud').classList.add('on');
    this.intro();
    this.scroll.buildReveals();
    ScrollTrigger.refresh();
  }

  intro() {
    const tl = gsap.timeline();
    if (REDUCED) {
      this.villa.lineUniforms.uProgress.value = 1;
      tl.to(this.heroChars, { opacity: 1, duration: 0.6 });
      tl.to('[data-intro]', { opacity: 1, duration: 0.6 }, '<');
      tl.to('#proRule', { scaleX: 1, duration: 0.4 }, '<');
      return;
    }
    tl.to(this.villa.lineUniforms.uProgress, { value: 1, duration: 3.4, ease: 'power2.inOut' }, 0.2);
    tl.fromTo(this.heroChars,
      { opacity: 0, yPercent: 42, filter: 'blur(14px)' },
      { opacity: 1, yPercent: 0, filter: 'blur(0px)', duration: 1.7, ease: 'power3.out', stagger: 0.06 },
      1.2);
    tl.to('[data-intro="kicker"]', { opacity: 1, duration: 1.2, ease: 'power2.out' }, 1.0);
    tl.to('[data-intro="base"]', { opacity: 1, duration: 1.2, ease: 'power2.out' }, 2.2);
    tl.to('#proRule', { scaleX: 1, duration: 1.6, ease: 'expo.out' }, 2.4);
    tl.to('[data-intro="line"]', { opacity: 1, duration: 1.2, ease: 'power2.out' }, 2.7);
    tl.to('[data-intro="hint"]', { opacity: 1, duration: 1.0 }, 3.2);
  }

  swapChapter(el) {
    const num = el.dataset.num, name = el.dataset.name;
    gsap.killTweensOf([this.hudNum, this.hudName]);
    gsap.to([this.hudNum, this.hudName], {
      y: -8, opacity: 0, duration: 0.25, ease: 'power2.in',
      onComplete: () => {
        this.hudNum.textContent = num;
        this.hudName.textContent = name;
        gsap.fromTo([this.hudNum, this.hudName],
          { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' });
      }
    });
  }

  onResize() {
    this.stage.resize();
    this.post.setSize(innerWidth, innerHeight, this.stage.dpr);
    this.scroll.measure();
    this.rig.bake(this.scroll.ranges);
    this.strip.measure();
  }

  update(t, dt) {
    this.time = t;
    const sc = this.scroll;
    sc.update();
    const p = sc.progress;

    const l0 = sc.local(0), l1 = sc.local(1), l2 = sc.local(2),
      l3 = sc.local(3), l4 = sc.local(4), l6 = sc.local(6);

    /* courbes de niveau : visibles au prologue, en filigrane ensuite */
    this.terrain.uniforms.uTopo.value = clamp(
      Math.max(1 - smooth(0.55, 0.95, l0) - smooth(0.0, 0.4, l1), this.rig.menuBoost * 0.55),
      0, 1
    );

    /* construction — la maison s'élève au chapitre étude */
    const build = smooth(0.04, 0.62, l1);
    this.mats.buildPlane.constant = -3 + build * 13;
    this.villa.pool.mesh.visible = build > 0.4;

    /* le trait s'efface quand la matière arrive */
    if (this.loader.done) {
      this.villa.lineUniforms.uOpacity.value = clamp(1 - smooth(0.12, 0.6, l1), 0, 1);
    }

    /* éclaté par lots, aller-retour */
    const e = smooth(0.08, 0.46, l2) * (1 - smooth(0.62, 0.94, l2));
    this.villa.setExplode(e);
    this.lots.update(e);
    this.annos.update(l2);

    /* la baie coulisse à l'approche de la caméra */
    this.villa.setDoor(smooth(0.02, 0.24, l3));

    /* assemblage de la rénovation */
    this.villa.setRenov(smooth(0.1, 0.8, l4));

    /* soleil, ciel, brume */
    const st = this.sun.apply(p, this.sky);
    this.sky.uniforms.uTime.value = t;
    this.villa.setLights(st.night, this.rig.interior);
    this.villa.pool.sync(st, this.stage.scene.fog, t);

    /* caméra */
    this.rig.update(p, dt, t);

    /* rais de lumière + poussière dans le séjour */
    const shaftSun = smooth(0.15, 0.7, st.intensity);
    const inten = smooth(0.2, 0.5, l3) * (1 - smooth(0.75, 1, l3)) * shaftSun;
    this.fx.update(t, inten);

    /* nuancier horizontal */
    if (this.matRow) {
      const maxX = Math.max(0, this.matRow.scrollWidth - innerWidth + innerWidth * 0.06);
      const x = -maxX * smooth(0.08, 0.94, l6);
      this.matRow.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
    }

    /* interfaces */
    this.strip.update(dt);
    this.cursor.update(dt);
    if (this.daylineDot) {
      this.daylineDot.style.top = `${(16 + p * (this.dayline.clientHeight - 32)).toFixed(1)}px`;
    }

    const dim = Math.max(this.rig.menuBoost * 0.32, 0);
    this.post.render(t, { dim, night: st.night });
  }
}
