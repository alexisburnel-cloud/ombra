export type ScrollAnimationOptions = {
  enabled: boolean;
  frameCount: number;
  onFrame: (frameIndex: number) => void;
  onProgress?: (progress: number) => void;
};
