import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, clamp, smooth, REDUCED, TIER } from './utils.js';
import { Stage } from './Stage.js';
import { makeMaterials } from '../world/materials.js';
import { Sky } from '../world/Sky.js';
import { Terrain } from '../world/Terrain.js';
import { Villa } from '../world/Villa.js';
import { Chantier } from '../world/Chantier.js';
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
    this.mats = makeMaterials();
    /* le clipping du bâti n'est plus utilisé pour la révélation :
       le chantier pilote les lots directement */
    this.mats.buildPlane.constant = 999;
    this.sky = new Sky(this.stage.scene);
    this.sun = new SunCycle(this.stage.scene, this.stage.renderer, TIER);
    this.terrain = new Terrain(this.stage.scene, this.mats);
    this.landscape = new Landscape(this.stage.scene, this.mats);
    this.villa = new Villa(this.stage.scene, this.mats);
    this.chantier = new Chantier(this.stage.scene, this.mats);
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

    this.hudNum = $('#hudNum');
    this.hudName = $('#hudName');
    this.dayline = $('#dayline');
    this.daylineDot = $('#daylineDot');
    this.matRow = $('#matRow');
    this.scroll.onChapter = (i, el) => {
      this.swapChapter(el);
      document.body.classList.toggle('on-light', LIGHT_CHAPTERS.has(i));
    };

    this.heroChars = splitChars($('#proTitle'));
    gsap.set(this.heroChars, { opacity: 0 });

    this.post.setSize(innerWidth, innerHeight, this.stage.dpr);
    addEventListener('resize', () => this.onResize());
    addEventListener('load', () => this.onResize());
    document.querySelectorAll('img').forEach((img) => {
      if (!img.complete) img.addEventListener('load', () => this.onResize(), { once: true });
    });

    this.time = 0;
    gsap.ticker.add((t, dtMs) => this.update(t, Math.min(dtMs / 1000, 0.05)));

    this.begin();
  }

  async begin() {
    await document.fonts.ready;
    this.sun.apply(0.4, this.sky);
    this.villa.setChantier(0);
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

    /* courbes de niveau : du prologue à l'implantation, puis s'effacent */
    this.terrain.uniforms.uTopo.value = clamp(
      Math.max(1 - smooth(0.12, 0.4, l2), this.rig.menuBoost * 0.55),
      0, 1
    );

    /* — LE CHANTIER (chapitre construire, première moitié) — */
    const c = clamp(l2 / 0.62, 0, 1);
    const afterBuild = l2 >= 0.62 || sc.chapter > 2;
    if (!afterBuild) {
      this.villa.setChantier(c);
    } else {
      this.villa.setComplete();
      /* éclaté de coordination en seconde partie, aller-retour */
      const e = smooth(0.68, 0.84, l2) * (1 - smooth(0.88, 0.99, l2));
      this.villa.setExplode(e);
      this.lots.update(e);
    }
    this.chantier.update(c * (afterBuild ? 0 : 1), t);
    this.lots.update(afterBuild
      ? smooth(0.68, 0.84, l2) * (1 - smooth(0.88, 0.99, l2))
      : c);
    this.annos.update(smooth(0.64, 0.7, l2) * (1 - smooth(0.95, 1, l2)));

    /* le trait de lumière : visible jusqu'au début du chantier */
    if (this.loader.done) {
      this.villa.lineUniforms.uOpacity.value = clamp(1 - smooth(0.02, 0.16, l2), 0, 1);
    }

    /* la baie coulisse à l'approche */
    this.villa.setDoor(smooth(0.02, 0.24, l3));

    /* lames de pergola — respiration lente + souris */
    this.villa.setLames(0.45 + Math.sin(t * 0.12) * 0.1 + this.rig.mouse.x * 0.08);

    /* assemblage de la rénovation */
    this.villa.setRenov(smooth(0.1, 0.8, l4));

    /* soleil, ciel, brume */
    const st = this.sun.apply(p, this.sky);
    this.sky.uniforms.uTime.value = t;
    const presence = afterBuild ? 1 : smooth(0.62, 0.76, c);
    this.villa.setLights(st.night, this.rig.interior, presence);
    this.villa.pool.sync(st, this.stage.scene.fog, t);
    this.villa.jacuzzi.sync(st, this.stage.scene.fog, t * 1.6);

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
