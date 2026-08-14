"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ScrollAnimationOptions } from "@/types/animation";

gsap.registerPlugin(ScrollTrigger);

export function useScrollAnimation({ enabled, frameCount, onFrame, onProgress }: ScrollAnimationOptions) {
  const lastFrameRef = useRef(-1);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const trigger = ScrollTrigger.create({
      trigger: "[data-scroll-scene]",
      start: "top top",
      end: "bottom bottom",
      scrub: 1.2,
      onUpdate: (self) => {
        const progress = self.progress;
        const frame = Math.min(frameCount - 1, Math.floor(progress * frameCount));

        onProgress?.(progress);

        if (frame !== lastFrameRef.current) {
          lastFrameRef.current = frame;
          onFrame(frame);
        }
      },
    });

    onFrame(0);
    ScrollTrigger.refresh();

    return () => {
      trigger.kill();
    };
  }, [enabled, frameCount, onFrame, onProgress]);
}
