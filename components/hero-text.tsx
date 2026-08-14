"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { STORY_CHAPTERS } from "@/lib/story";

type HeroTextProps = {
  frame: number;
};

function getChapterIndex(frame: number) {
  return Math.max(
    0,
    STORY_CHAPTERS.findIndex((item) => frame >= item.start && frame <= item.end),
  );
}

export function HeroText({ frame }: HeroTextProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const previousIndexRef = useRef(-1);
  const chapterIndex = getChapterIndex(frame);
  const chapter = STORY_CHAPTERS[chapterIndex] ?? STORY_CHAPTERS[0];

  useEffect(() => {
    if (!wrapperRef.current || previousIndexRef.current === chapterIndex) {
      return;
    }

    previousIndexRef.current = chapterIndex;
    gsap.fromTo(
      wrapperRef.current.querySelectorAll("[data-text-line]"),
      { autoAlpha: 0, y: 34, filter: "blur(10px)" },
      { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.8, ease: "power3.out", stagger: 0.08 },
    );
  }, [chapterIndex]);

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-end justify-start px-6 pb-16 md:px-20 md:pb-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_45%,transparent_0,rgba(0,0,0,0.18)_35%,rgba(0,0,0,0.78)_100%)]" />
      <div ref={wrapperRef} className="relative max-w-2xl rounded-[2rem] border border-white/10 bg-black/22 p-6 shadow-2xl shadow-black/40 backdrop-blur-md md:p-8">
        <p data-text-line className="mb-5 text-xs uppercase tracking-[0.45em] text-white/55">
          {chapter.eyebrow}
        </p>
        <h1 className="whitespace-pre-line text-5xl font-semibold leading-[0.9] tracking-[-0.065em] text-white md:text-7xl">
          {chapter.title.split("\n").map((line) => (
            <span data-text-line className="block" key={line}>
              {line}
            </span>
          ))}
        </h1>
      </div>
    </div>
  );
}
