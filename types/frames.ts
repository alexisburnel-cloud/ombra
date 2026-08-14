export type FrameLoadStatus = "idle" | "loading" | "ready" | "error";

export type FrameLoaderState = {
  getFrame: (frameIndex: number) => HTMLImageElement | null;
  setTargetFrame: (frameIndex: number) => void;
  loaded: number;
  progress: number;
  status: FrameLoadStatus;
  error: string | null;
};
