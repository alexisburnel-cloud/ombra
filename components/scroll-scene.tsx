"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CanvasAnimation, type CanvasAnimationHandle } from "@/components/canvas-animation";
import { CTASection } from "@/components/cta-section";
import { HeroText } from "@/components/hero-text";
import { LoadingScreen } from "@/components/loading-screen";
import { Navbar } from "@/components/navbar";
import { OrbitSection } from "@/components/orbit-section";
import { ProgressIndicator } from "@/components/progress-indicator";
import { useFrameLoader } from "@/hooks/use-frame-loader";
import { useLenis } from "@/hooks/use-lenis";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { FRAME_TOTAL } from "@/lib/frames";

const SCROLL_HEIGHT = "900vh";
const MIN_LOADER_DURATION = 2400;

export function ScrollScene() {
  const canvasRef = useRef<CanvasAnimationHandle | null>(null);
  const { getFrame, progress: loadProgress, status, error } = useFrameLoader(FRAME_TOTAL);
  const [minimumLoaderDone, setMinimumLoaderDone] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeFrame, setActiveFrame] = useState(1);
  
  const ready = (status === "ready" || loadProgress >= 1) && minimumLoaderDone;
  const visibleLoaderProgress = ready ? 1 : loadProgress;
  const loaderStatus = status === "error" ? status : ready ? "ready" : "loading";

  useLenis(ready);

  // Disable browser scrolling until all frames are fully preloaded in memory
  useEffect(() => {
    if (!ready) {
      document.body.style.overflow = "hidden";
      document.body.style.height = "100vh";
    } else {
      document.body.style.overflow = "";
      document.body.style.height = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
    };
  }, [ready]);

  // Ensure loading screen is active for at least MIN_LOADER_DURATION to prevent visual flashes
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinimumLoaderDone(true);
    }, MIN_LOADER_DURATION);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      const id = link?.hash.slice(1);
      const target = id ? document.getElementById(id) : null;

      if (!link || !target) {
        return;
      }

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, "", link.hash);
    };

    document.addEventListener("click", onClick);

    return () => document.removeEventListener("click", onClick);
  }, []);

  const handleFrame = useCallback((frameIndex: number) => {
    canvasRef.current?.renderFrame(frameIndex);
    setActiveFrame(frameIndex + 1);
  }, []);

  useScrollAnimation({
    enabled: ready,
    frameCount: FRAME_TOTAL,
    onFrame: handleFrame,
    onProgress: setScrollProgress,
  });

  // Render the initial frame as soon as all frames are preloaded and ready
  useEffect(() => {
    if (ready) {
      canvasRef.current?.renderFrame(0);
    }
  }, [ready]);


  return (
    <>
      <LoadingScreen progress={visibleLoaderProgress} status={loaderStatus} error={error} />
      <Navbar />
      <section id="top" className="relative grid min-h-screen place-items-center overflow-hidden bg-neutral-950 px-6 text-center text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.16),transparent_34%),linear-gradient(180deg,#111_0%,#050505_70%)]" />
        <div className="absolute bottom-0 left-1/2 h-72 w-[78rem] -translate-x-1/2 rounded-[100%] bg-white/10 blur-3xl" />
        <div className="relative pt-24">
          <p className="mb-6 text-xs uppercase tracking-[0.45em] text-white/45">Carène — depuis 1979</p>
          <h1 className="mx-auto max-w-6xl text-6xl font-semibold leading-[0.86] tracking-[-0.075em] md:text-9xl">
            Créateur de lieux de vie.
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-base leading-7 text-white/58 md:text-xl md:leading-8">
            Du premier trait au dernier détail : vivez la naissance d&apos;une maison Carène, de l&apos;esquisse à la remise des clés — en Drôme, Ardèche et quart sud-est.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href="#story" className="rounded-full bg-white px-7 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-black transition hover:bg-white/85">
              Voir la construction
            </a>
            <a href="#contact" className="rounded-full border border-white/15 px-7 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-white/80 transition hover:border-white hover:text-white">
              Votre projet
            </a>
          </div>
        </div>
      </section>
      <section className="grid min-h-[70vh] place-items-center bg-[#080808] px-6 text-center text-white">
        <div className="max-w-4xl">
          <p className="mb-5 text-xs uppercase tracking-[0.45em] text-white/40">Notre métier</p>
          <h2 className="text-5xl font-semibold leading-[0.95] tracking-[-0.06em] md:text-8xl">
            Chaque étape est menée avec intention.
          </h2>
          <p className="mx-auto mt-8 max-w-xl text-white/55">
            La suite est interactive : continuez à faire défiler, la maison se construit sous vos yeux, étape par étape.
          </p>
        </div>
      </section>
      <section id="story" data-scroll-scene className="relative bg-black" style={{ height: SCROLL_HEIGHT }}>
        <div className="sticky top-0 h-screen overflow-hidden">
          <div style={{ opacity: scrollProgress > 0.92 ? Math.max(0, 1 - (scrollProgress - 0.92) / 0.08) : 1 }}>
            <CanvasAnimation ref={canvasRef} getFrame={getFrame} className="block h-screen w-screen bg-black" />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.18)_42%,rgba(0,0,0,0)_72%)]" />
          {ready ? <HeroText frame={activeFrame} /> : null}
          {ready ? <ProgressIndicator progress={scrollProgress} /> : null}
        </div>
      </section>
      <OrbitSection />
      <CTASection />
    </>
  );
}
