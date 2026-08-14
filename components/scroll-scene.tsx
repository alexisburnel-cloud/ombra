"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CanvasAnimation, type CanvasAnimationHandle } from "@/components/canvas-animation";
import { CTASection } from "@/components/cta-section";
import { CareneSections } from "@/components/carene-sections";
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
      <div id="top" />
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
      <CareneSections />
      <CTASection />
    </>
  );
}
