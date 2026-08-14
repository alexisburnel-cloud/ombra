"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function OrbitSection() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showPlayButton, setShowPlayButton] = useState(false);

  const playVideo = useCallback(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.muted = true;
    video.playsInline = true;
    void video.play()
      .then(() => setShowPlayButton(false))
      .catch(() => setShowPlayButton(true));
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          video.currentTime = 0;
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
    <section id="reveal" className="relative min-h-screen overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="h-screen w-full object-cover"
        src="/videos/orbit.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-label="Vidéo orbitale de la maison achevée"
      />
      {showPlayButton ? (
        <button
          type="button"
          onClick={playVideo}
          className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-7 py-4 text-xs font-semibold uppercase tracking-[0.28em] text-black transition hover:bg-white/85"
        >
          Voir la maison
        </button>
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
      <div className="pointer-events-none absolute bottom-16 left-6 max-w-xl md:left-20 md:bottom-24">
        <p className="mb-4 text-xs uppercase tracking-[0.45em] text-white/50">La maison, achevée</p>
        <h2 className="text-5xl font-semibold leading-[0.9] tracking-[-0.06em] text-white md:text-7xl">Un lieu de vie, signé Carène.</h2>
      </div>
    </section>
  );
}
