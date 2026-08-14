"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FRAME_TOTAL, FRAME_STEP, getFrameSrc } from "@/lib/frames";
import type { FrameLoaderState } from "@/types/frames";

const CONCURRENCY = 24; // Optimal concurrency for HTTP/2 multiplexing
const MAX_RETRIES = 3;

// Global frame cache to keep preloaded images in memory across re-renders/mounts
const frameCache = new Map<number, HTMLImageElement>();

export function useFrameLoader(totalFrames = FRAME_TOTAL): FrameLoaderState {
  // Generate list of target frames based on FRAME_STEP
  const targetFrames = useRef<number[]>([]);
  if (targetFrames.current.length === 0) {
    const list: number[] = [];
    for (let f = 1; f <= totalFrames; f += FRAME_STEP) {
      list.push(f);
    }
    // Always include the last frame to ensure a clean animation finish
    if (totalFrames > 0 && !list.includes(totalFrames)) {
      list.push(totalFrames);
    }
    targetFrames.current = list;
  }

  const expectedTotal = targetFrames.current.length;

  // Helper to count how many of our target frames are currently in cache
  const getCachedTargetCount = () => {
    return targetFrames.current.filter((f) => frameCache.has(f)).length;
  };

  const [loadedCount, setLoadedCount] = useState(getCachedTargetCount());
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    getCachedTargetCount() === expectedTotal ? "ready" : "idle"
  );
  const [error, setError] = useState<string | null>(null);

  const activeLoadsRef = useRef(0);
  const queueRef = useRef<number[]>([]);
  const startedRef = useRef(false);

  // Return the closest loaded frame outward if the requested frame failed or isn't loaded yet
  const getFrame = useCallback((frameIndex: number) => {
    const frame = frameIndex + 1;
    if (frameCache.has(frame)) {
      return frameCache.get(frame) ?? null;
    }

    // Search outward for the nearest available preloaded frame
    const maxSearch = 60;
    for (let offset = 1; offset <= maxSearch; offset++) {
      const nextFrame = frame + offset;
      const prevFrame = frame - offset;
      if (frameCache.has(nextFrame)) return frameCache.get(nextFrame) ?? null;
      if (frameCache.has(prevFrame)) return frameCache.get(prevFrame) ?? null;
    }

    return frameCache.get(1) || null;
  }, []);

  const setTargetFrame = useCallback((_frameIndex: number) => {
    // No-op. Preloading is fully completed upfront.
  }, []);

  const progress = expectedTotal > 0 ? loadedCount / expectedTotal : 0;

  // Transition to ready as soon as progress reaches 100%, bypassing delayed socket timeouts
  useEffect(() => {
    if (loadedCount >= expectedTotal) {
      setStatus("ready");
    }
  }, [loadedCount, expectedTotal]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const initialCached = getCachedTargetCount();
    if (initialCached === expectedTotal) {
      setStatus("ready");
      setLoadedCount(expectedTotal);
      return;
    }

    setStatus("loading");

    // Populate queue with only the target frames that haven't been loaded yet
    const queue = targetFrames.current.filter((f) => !frameCache.has(f));
    queueRef.current = queue;

    let aborted = false;

    const loadImageWithRetry = (frame: number, retriesLeft = MAX_RETRIES): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.decoding = "async";

        img.onload = () => {
          if (aborted) return;
          frameCache.set(frame, img);
          resolve(img);
        };

        img.onerror = () => {
          if (aborted) return;
          if (retriesLeft > 0) {
            setTimeout(() => {
              if (aborted) return;
              loadImageWithRetry(frame, retriesLeft - 1).then(resolve, reject);
            }, 200);
          } else {
            reject(new Error(`Failed to load frame ${frame}`));
          }
        };

        img.src = getFrameSrc(frame);
      });
    };

    const processQueue = () => {
      if (aborted) return;

      // When the queue is fully drained and active loads complete, transition to ready
      if (queueRef.current.length === 0 && activeLoadsRef.current === 0) {
        setStatus("ready");
        setLoadedCount(getCachedTargetCount());
        return;
      }

      while (activeLoadsRef.current < CONCURRENCY && queueRef.current.length > 0) {
        const frame = queueRef.current.shift();
        if (frame === undefined) break;

        activeLoadsRef.current++;

        loadImageWithRetry(frame)
          .then(() => {
            if (aborted) return;
            setLoadedCount(getCachedTargetCount());
          })
          .catch((err) => {
            if (aborted) return;
            // Robust error handling: print warning but do not crash the load queue.
            // We still proceed and will fallback to the closest frame when rendering.
            console.warn(`Frame loader warning (non-fatal): ${err instanceof Error ? err.message : String(err)}`);
            // We increment loaded count to keep the progress bar moving even if a frame is missing
            setLoadedCount((prev) => Math.min(prev + 1, expectedTotal));
          })
          .finally(() => {
            if (aborted) return;
            activeLoadsRef.current--;
            processQueue();
          });
      }
    };

    processQueue();

    return () => {
      aborted = true;
    };
  }, [totalFrames, expectedTotal]);

  return {
    getFrame,
    setTargetFrame,
    loaded: loadedCount,
    progress,
    status,
    error,
  };
}
