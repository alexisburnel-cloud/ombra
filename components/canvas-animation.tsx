"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import { drawCoverImage } from "@/lib/canvas";

export type CanvasAnimationHandle = {
  renderFrame: (frameIndex: number) => void;
};

type CanvasAnimationProps = {
  getFrame: (frameIndex: number) => HTMLImageElement | null;
  className?: string;
};

export const CanvasAnimation = forwardRef<CanvasAnimationHandle, CanvasAnimationProps>(
  function CanvasAnimation({ getFrame, className }, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const lastFrameRef = useRef(0);
    const rafRef = useRef<number | null>(null);

    const renderFrame = useCallback((frameIndex: number) => {
      const canvas = canvasRef.current;
      const image = getFrame(frameIndex);

      if (!canvas || !image) {
        return;
      }

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const context = canvas.getContext("2d");

        if (!context) {
          return;
        }

        lastFrameRef.current = frameIndex;
        drawCoverImage(context, image, canvas.width, canvas.height);
      });
    }, [getFrame]);

    useImperativeHandle(ref, () => ({ renderFrame }), [renderFrame]);

    useEffect(() => {
      const canvas = canvasRef.current;

      if (!canvas) {
        return;
      }

      const resize = () => {
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const width = window.innerWidth;
        const height = window.innerHeight;

        canvas.width = Math.floor(width * pixelRatio);
        canvas.height = Math.floor(height * pixelRatio);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        renderFrame(lastFrameRef.current);
      };

      resize();
      window.addEventListener("resize", resize, { passive: true });

      return () => {
        window.removeEventListener("resize", resize);
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
      };
    }, [renderFrame]);

    return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
  },
);
