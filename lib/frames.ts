import { frameConfig } from "@/lib/frame-config";

export const FRAME_TOTAL = frameConfig.totalFrames;
export const FRAME_STEP = frameConfig.frameStep;

/* mobile : séquence 768px (~25 Mo) au lieu de la 1536px (~67 Mo) */
function frameFolder(): string {
  if (typeof window !== "undefined" && Math.min(window.innerWidth, window.innerHeight) < 640) {
    return "/frames-sm";
  }
  return frameConfig.frameFolder;
}

export function getFrameSrc(frame: number): string {
  return `${frameFolder()}/${String(frame).padStart(4, "0")}.${frameConfig.frameExtension}`;
}
