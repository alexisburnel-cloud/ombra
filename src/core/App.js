import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, clamp, smooth, REDUCED, TIER } from './utils.js';
import { Stage } from './Stage.js';
import { makeTextures } from '../world/textures.js';
import { makeMaterials } from '../world/materials.js';
import { Sky } from '../world/Sky.js';
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
import { Annotations, AnatomyList } from '../ui/Annotations.js';
import { Works } from '../ui/Works.js';
import { Strip } from '../ui/Strip.js';
import { Sound } from '../ui/Sound.js';
import { takeSnapshots, materialPlates } from '../ui/Snapshots.js';
import { splitChars } from '../ui/SplitText.js';

export class App {
  constructor(canvas) {
    this.stage = new Stage(canvas);
    this.textures = makeTextures();
    this.mats = makeMaterials(this.textures);
    this.sky = new Sky(this.stage.scene);
    this.sun = new SunCycle(this.stage.scene, this.stage.renderer, TIER);
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
    this.annos = new Annotations(this.stage.camera);
    this.anatomy = new AnatomyList();
    this.works = new Works();
    this.strip = new Strip(this.scroll, 7);
    this.sound = new Sound();

    /* hud */
    this.hudNum = $('#hudNum');
    this.hudName = $('#hudName');
    this.dayline = $('#dayline');
    this.daylineDot = $('#daylineDot');
    this.matRow = $('#matRow');
    this.scroll.onChapter = (i, el) => this.swapChapter(el);

    /* titre héroïque préparé */
    this.heroChars = splitChars($('#heroTitle'));
    gsap.set(this.heroChars, { opacity: 0 });

    /* nuancier — textures dessinées dans les panneaux */
    this.paintMaterialPanels();

    this.post.setSize(innerWidth, innerHeight, this.stage.dpr);
    addEventListener('resize', () => this.onResize());

    this.time = 0;
    gsap.ticker.add((t, dtMs) => this.update(t, Math.min(dtMs / 1000, 0.05)));

    this.begin();
  }

  paintMaterialPanels() {
    $$('.mat').forEach((el) => {
      const key = el.dataset.mat;
      const src = this.textures.canvases[key];
      const cv = el.querySelector('canvas');
      if (!src || !cv) return;
      const ctx = cv.getContext('2d');
      const s = Math.max(cv.width / src.width, cv.height / src.height);
      const sw = cv.width / s, sh = cv.height / s;
      ctx.drawImage(src, (src.width - sw) / 2, (src.height - sh) / 2, sw, sh, 0, 0, cv.width, cv.height);
      const g = ctx.createRadialGradient(cv.width / 2, cv.height / 2, cv.height * 0.2, cv.width / 2, cv.height / 2, cv.height * 0.85);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(10,8,5,0.42)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cv.width, cv.height);
    });
  }

  async begin() {
    await document.fonts.ready;

    /* préchauffe + photographies de la maquette */
    this.sun.apply(0.7, this.sky);
    this.stage.renderer.render(this.stage.scene, this.stage.camera);
    const shots = takeSnapshots(this);
    this.works.setShots(shots);
    this.strip.fill([...shots, ...materialPlates(this.textures.canvases)]);

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
      tl.to('#heroRule', { scaleX: 1, duration: 0.4 }, '<');
      return;
    }
    tl.to(this.villa.lineUniforms.uProgress, { value: 1, duration: 3.2, ease: 'power2.inOut' }, 0.2);
    tl.fromTo(this.heroChars,
      { opacity: 0, yPercent: 42, filter: 'blur(14px)' },
      { opacity: 1, yPercent: 0, filter: 'blur(0px)', duration: 1.7, ease: 'power3.out', stagger: 0.07 },
      1.3);
    tl.to('[data-intro="kicker"]', { opacity: 1, duration: 1.2, ease: 'power2.out' }, 1.1);
    tl.to('#heroRule', { scaleX: 1, duration: 1.6, ease: 'expo.out' }, 2.2);
    tl.to('[data-intro="line"]', { opacity: 1, duration: 1.2, ease: 'power2.out' }, 2.5);
    tl.to('[data-intro="hint"]', { opacity: 1, duration: 1.0 }, 3.1);
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

    const l1 = sc.local(1), l2 = sc.local(2), l3 = sc.local(3), l4 = sc.local(4),
      l5 = sc.local(5), l6 = sc.local(6), l7 = sc.local(7);

    /* construction — le bâtiment s'élève au chapitre I */
    const build = smooth(0.04, 0.6, l1);
    this.mats.buildPlane.constant = build * 10.5;

    /* le trait s'efface quand la matière arrive, revient en filigrane au ch. II */
    if (this.loader.done) {
      const bump = smooth(0.08, 0.32, l2) * (1 - smooth(0.68, 0.95, l2));
      this.villa.lineUniforms.uOpacity.value =
        clamp((1 - smooth(0.1, 0.55, l1)) + bump * 0.32, 0, 1);
    }

    /* éclaté chorégraphié, aller-retour */
    const e = smooth(0.06, 0.44, l3) * (1 - smooth(0.6, 0.94, l3));
    this.villa.setExplode(e);
    this.anatomy.update(e);

    /* la porte s'ouvre à l'approche de la caméra */
    this.villa.setDoor(smooth(0.02, 0.3, l4));

    /* caméra d'abord — l'intérieur pilote l'éclairage d'appoint */
    this.rig.update(p, dt, t);

    /* soleil, ciel, brume */
    const st = this.sun.apply(p, this.sky);
    this.sky.uniforms.uTime.value = t;
    this.villa.setLights(st.night, this.rig.interior);
    this.villa.pool.sync(st, this.stage.scene.fog, t);
    this.landscape.lake.sync(st, this.stage.scene.fog, t);

    /* voile éditorial */
    const dim5 = smooth(0.05, 0.2, l5) * (1 - smooth(0.88, 1, l5));
    const dim6 = smooth(0.03, 0.22, l6) * (1 - smooth(0.85, 1, l6));
    const dim7 = smooth(0.03, 0.25, l7) * (1 - smooth(0.8, 1, l7));
    const dim = Math.max(dim5 * 0.74, dim6 * 0.55, dim7 * 0.64, this.rig.menuBoost * 0.3);

    /* rais de lumière + poussière dans le séjour */
    const shaftSun = smooth(0.15, 0.7, st.intensity);
    const inten = smooth(0.3, 0.6, l4) * (1 - smooth(0.05, 0.35, l6)) * shaftSun * (1 - dim5);
    this.fx.update(t, inten);

    /* annotations du chapitre structure */
    this.annos.update(l2);

    /* nuancier horizontal */
    if (this.matRow) {
      const maxX = Math.max(0, this.matRow.scrollWidth - innerWidth + innerWidth * 0.06);
      const x = -maxX * smooth(0.08, 0.94, l5);
      this.matRow.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
    }

    /* interfaces */
    this.works.update(dt);
    this.strip.update(dt);
    this.cursor.update(dt);
    if (this.daylineDot) {
      this.daylineDot.style.top = `${(16 + p * (this.dayline.clientHeight - 32)).toFixed(1)}px`;
    }

    this.post.render(t, { dim, night: st.night });
  }
}
