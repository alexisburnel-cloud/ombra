"use client";

import { useCallback, useEffect, useRef } from "react";

export function OrbitSection() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const playVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    video.muted = true;
    video.playsInline = true;
    void video.play().catch(() => {
      /* Safari peut bloquer la 1re tentative : on relance sans bouton,
         à la première interaction (scroll ou toucher). */
      const retry = () => {
        void video.play().catch(() => undefined);
        window.removeEventListener("touchstart", retry);
        window.removeEventListener("scroll", retry);
        window.removeEventListener("pointerdown", retry);
      };
      window.addEventListener("touchstart", retry, { passive: true, once: true });
      window.addEventListener("scroll", retry, { passive: true, once: true });
      window.addEventListener("pointerdown", retry, { passive: true, once: true });
    });
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          playVideo();
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [playVideo]);

  return (
    <section id="reveal" className="relative flex min-h-[60vh] items-center overflow-hidden bg-black md:min-h-screen">
      {/* portrait : la maison ENTIÈRE (object-contain) · paysage : plein cadre */}
      <video
        ref={videoRef}
        className="max-h-screen w-full object-contain md:h-screen md:object-cover"
        src="/videos/orbit.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-label="Vidéo orbitale de la maison achevée"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
      <div className="pointer-events-none absolute bottom-10 left-6 max-w-xl md:bottom-24 md:left-20">
        <p className="mb-4 text-xs uppercase tracking-[0.45em] text-white/50">La maison, achevée</p>
        <h2 className="text-4xl font-semibold leading-[0.9] tracking-[-0.06em] text-white md:text-7xl">
          Un lieu de vie, signé Carène.
        </h2>
      </div>
    </section>
  );
}
